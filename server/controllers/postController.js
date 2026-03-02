/**
 * Post Controller
 * Handle post creation, retrieval, and management
 */

const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { getIO, emitNotification } = require('../sockets/socketHandler');

/**
 * Create new post
 */
exports.createPost = async (req, res, next) => {
  try {
    const { content, location, tags, musicURL, musicVolume } = req.body;
    const files = req.files || [];
    const media = files.map(file => {
      const ext = (file.mimetype || "").toLowerCase();
      const type = ext.includes("video") ? "video" : "image";
      return {
        type,
        url: `/uploads/${file.filename}`,
      };
    });
    const images = media
      .filter((m) => m.type === "image")
      .map((m) => m.url);

    if (!content && media.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Le contenu ou une image est requis'
      });
    }

    const postData = {
      author: req.user._id,
      content: content || '',
      media,
      images,
    };

    // Add location if provided
    if (location) {
      const { longitude, latitude, address, city, country, placeName } = location;
      if (longitude && latitude) {
        postData.location = {
          type: 'Point',
          coordinates: [parseFloat(longitude), parseFloat(latitude)],
          address: address || '',
          city: city || '',
          country: country || '',
          placeName: placeName || ''
        };
        postData.city = city || '';
      }
    }

    // Add tags if provided
    if (tags) {
      postData.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
    }

    // Attach music metadata if provided
    if (musicURL) {
      postData.musicURL = musicURL;
      const volumeNumber =
        typeof musicVolume === "string" ? parseFloat(musicVolume) : musicVolume;
      if (!Number.isNaN(volumeNumber)) {
        // Expect 0–100 from UI, store as 0–1
        const clamped = Math.max(0, Math.min(100, volumeNumber));
        postData.musicVolume = clamped / 100;
      }
    }

    const post = new Post(postData);
    await post.save();

    // Update user's posts array
    await User.findByIdAndUpdate(req.user._id, {
      $push: { posts: post._id }
    });

    // Populate author for response
    const populatedPost = await Post.findById(post._id)
      .populate('author', 'username avatar firstName lastName');

    // Notify followers via Socket.io
    const user = await User.findById(req.user._id).select('followers');
    if (user && user.followers.length > 0) {
      user.followers.forEach(followerId => {
        emitNotification(followerId, {
          type: 'post',
          message: `${req.user.username} a publié un nouveau post`,
          postId: post._id
        });
      });
    }

    res.status(201).json({
      success: true,
      message: 'Post créé avec succès',
      post: populatedPost
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get feed (posts from followed users)
 */
exports.getFeed = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, city } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const user = await User.findById(req.user._id);
    const followingIds = [...user.following, user._id]; // Include own posts

    let query = {
      author: { $in: followingIds },
      isPublic: true
    };

    // Local network mode: prioritize posts from same city
    if (city) {
      query.city = new RegExp(city, 'i');
    }

    const posts = await Post.find(query)
      .populate('author', 'username avatar firstName lastName')
      .populate('likes', 'username avatar')
      .sort(city ? { city: 1, createdAt: -1 } : { createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: posts.length === parseInt(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single post
 */
exports.getPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username avatar firstName lastName')
      .populate('likes', 'username avatar')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'username avatar firstName lastName'
        },
        options: { sort: { createdAt: -1 } }
      });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post non trouvé'
      });
    }

    // Increment views
    post.views += 1;
    await post.save();

    res.json({
      success: true,
      post
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update post
 */
exports.updatePost = async (req, res, next) => {
  try {
    const { content } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post non trouvé'
      });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    post.content = content || post.content;
    await post.save();

    const updatedPost = await Post.findById(post._id)
      .populate('author', 'username avatar firstName lastName');

    res.json({
      success: true,
      message: 'Post mis à jour',
      post: updatedPost
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete post
 */
exports.deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post non trouvé'
      });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    await Post.findByIdAndDelete(req.params.id);
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { posts: req.params.id }
    });

    res.json({
      success: true,
      message: 'Post supprimé'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get posts by location (for map view)
 */
exports.getPostsByLocation = async (req, res, next) => {
  try {
    const { longitude, latitude, maxDistance = 5000 } = req.query;

    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: 'Coordonnées requises'
      });
    }

    const posts = await Post.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      },
      isPublic: true
    })
    .populate('author', 'username avatar firstName lastName')
    .sort({ createdAt: -1 })
    .limit(100);

    res.json({
      success: true,
      posts
    });
  } catch (error) {
    next(error);
  }
};
