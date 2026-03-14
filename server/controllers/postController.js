/**
 * Post Controller
 * Handle post creation, retrieval, and management
 */

const Post = require('../models/Post');
const User = require('../models/User');
const { emitNotification } = require('../sockets/socketHandler');

/**
 * Create new post
 */
exports.createPost = async (req, res, next) => {
  try {
    const { content, location, tags, musicURL, musicVolume } = req.body;
    const files = req.files || [];

    // Build media array
    const media = files.map(file => ({
      type: (file.mimetype || "").toLowerCase().includes("video") ? "video" : "image",
      url: `/uploads/${file.filename}`
    }));

    const images = media.filter(m => m.type === "image").map(m => m.url);

    if (!content && media.length === 0) {
      return res.status(400).json({ success: false, message: 'Le contenu ou une image est requis' });
    }

    const postData = {
      author: req.user._id,
      content: content || '',
      media,
      images,
    };

    // Add location if provided
    if (location?.longitude && location?.latitude) {
      const { longitude, latitude, address = '', city = '', country = '', placeName = '' } = location;
      postData.location = {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
        address,
        city,
        country,
        placeName
      };
      postData.city = city;
    }

    // Add tags if provided
    if (tags) postData.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());

    // Attach music metadata if provided
    if (musicURL) {
      postData.musicURL = musicURL;
      const volume = parseFloat(musicVolume);
      if (!Number.isNaN(volume)) postData.musicVolume = Math.max(0, Math.min(100, volume)) / 100;
    }

    const post = await Post.create(postData);

    // Update user's posts array and fetch followers in parallel
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $push: { posts: post._id } },
      { new: true }
    ).select('followers username');

    // Notify followers
    user.followers?.forEach(followerId => {
      emitNotification(followerId, {
        type: 'post',
        message: `${user.username} a publié un nouveau post`,
        postId: post._id
      });
    });

    // Populate author for response
    const populatedPost = await post.populate('author', 'username avatar firstName lastName');

    res.status(201).json({ success: true, message: 'Post créé avec succès', post: populatedPost });
  } catch (error) {
    next(error);
  }
};

/**
 * Get feed (posts from followed users)
 */
exports.getFeed = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const city = req.query.city;

    const user = await User.findById(req.user._id);
    const followingIds = [...user.following, user._id];

    const query = { author: { $in: followingIds }, isPublic: true };
    if (city) query.city = new RegExp(city, 'i');

    const posts = await Post.find(query)
      .populate('author', 'username avatar firstName lastName')
      .populate('likes', 'username avatar')
      .sort(city ? { city: 1, createdAt: -1 } : { createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      posts,
      pagination: { page, limit, hasMore: posts.length === limit }
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
        populate: { path: 'author', select: 'username avatar firstName lastName' },
        options: { sort: { createdAt: -1 } }
      });

    if (!post) return res.status(404).json({ success: false, message: 'Post non trouvé' });

    // Increment views (async, non-blocking)
    post.views += 1;
    post.save().catch(() => {});

    res.json({ success: true, post });
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

    if (!post) return res.status(404).json({ success: false, message: 'Post non trouvé' });
    if (post.author.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Non autorisé' });

    post.content = content || post.content;
    await post.save();

    const updatedPost = await post.populate('author', 'username avatar firstName lastName');

    res.json({ success: true, message: 'Post mis à jour', post: updatedPost });
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

    if (!post) return res.status(404).json({ success: false, message: 'Post non trouvé' });
    if (post.author.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Non autorisé' });

    await Promise.all([
      Post.findByIdAndDelete(req.params.id),
      User.findByIdAndUpdate(req.user._id, { $pull: { posts: req.params.id } })
    ]);

    res.json({ success: true, message: 'Post supprimé' });
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
    if (!longitude || !latitude)
      return res.status(400).json({ success: false, message: 'Coordonnées requises' });

    const posts = await Post.find({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
          $maxDistance: parseInt(maxDistance)
        }
      },
      isPublic: true
    })
      .populate('author', 'username avatar firstName lastName')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, posts });
  } catch (error) {
    next(error);
  }
};