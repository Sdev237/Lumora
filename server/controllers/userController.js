/**
 * User Controller
 * Handle user profile operations and location updates
 */

const User = require('../models/User');
const Post = require('../models/Post');
const { getIO } = require('../sockets/socketHandler');

/**
 * Get user profile
 */
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('followers', 'username avatar firstName lastName currentLocation')
      .populate('following', 'username avatar firstName lastName currentLocation')
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const posts = await Post.find({ author: user._id, isPublic: true })
      .populate('author', 'username avatar firstName lastName')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      user,
      posts
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, bio, interests, homeLocation } = req.body;
    const updates = {};

    if (firstName) updates.firstName = firstName;
    if (lastName) updates.lastName = lastName;
    if (bio !== undefined) updates.bio = bio;
    if (req.file) updates.avatar = `/uploads/${req.file.filename}`;
    if (interests) updates.interests = Array.isArray(interests) ? interests : interests.split(',').map(i => i.trim());
    if (homeLocation) {
      updates.homeLocation = {
        type: 'Point',
        coordinates: [homeLocation.longitude, homeLocation.latitude],
        address: homeLocation.address || '',
        city: homeLocation.city || '',
        country: homeLocation.country || ''
      };
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profil mis à jour',
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update current location (for live sharing)
 */
exports.updateLocation = async (req, res, next) => {
  try {
    const { longitude, latitude, address, city, country, isSharing } = req.body;

    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: 'Coordonnées requises'
      });
    }

    const updateData = {
      'currentLocation.coordinates': [longitude, latitude],
      'currentLocation.address': address || '',
      'currentLocation.city': city || '',
      'currentLocation.country': country || '',
      'currentLocation.lastUpdated': new Date(),
      'currentLocation.isSharing': isSharing !== undefined ? isSharing : true,
      lastActive: new Date()
    };

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true }
    ).select('-password');

    // Emit socket event for real-time updates
    const io = getIO();
    if (io && isSharing) {
      user.followers.forEach(followerId => {
        io.to(`user-${followerId}`).emit('location-update', {
          userId: user._id,
          location: user.currentLocation,
          timestamp: new Date()
        });
      });
    }

    res.json({
      success: true,
      message: 'Localisation mise à jour',
      location: user.currentLocation
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search users
 */
exports.searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({
        success: true,
        users: []
      });
    }

    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } }
      ],
      isActive: true
    })
    .select('username avatar firstName lastName bio currentLocation')
    .limit(20);

    res.json({
      success: true,
      users
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get nearby users (for local network mode)
 */
exports.getNearbyUsers = async (req, res, next) => {
  try {
    const { longitude, latitude, maxDistance = 10000, city } = req.query;

    let query = { isActive: true, _id: { $ne: req.user._id } };

    // If city is provided, use city-based filtering (local network mode)
    if (city) {
      query['currentLocation.city'] = new RegExp(city, 'i');
    } else if (longitude && latitude) {
      // Otherwise use geospatial query
      query.currentLocation = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      };
    } else {
      return res.status(400).json({
        success: false,
        message: 'Coordonnées ou ville requises'
      });
    }

    const users = await User.find(query)
      .select('username avatar firstName lastName currentLocation lastActive')
      .limit(50);

    res.json({
      success: true,
      users
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get active users (currently sharing location)
 */
exports.getActiveUsers = async (req, res, next) => {
  try {
    const users = await User.find({
      'currentLocation.isSharing': true,
      isActive: true,
      _id: { $ne: req.user._id }
    })
    .select('username avatar firstName lastName currentLocation lastActive')
    .sort({ lastActive: -1 })
    .limit(100);

    res.json({
      success: true,
      users
    });
  } catch (error) {
    next(error);
  }
};
