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
    const files = req.files ?? [];

    const media = files.map(({ mimetype = "", filename }) => ({
      type: mimetype.toLowerCase().includes("video") ? "video" : "image",
      url: `/uploads/${filename}`
    }));

    const images = media.filter(m => m.type === "image").map(m => m.url);

    if (!content && !media.length) {
      return res.status(400).json({
        success: false,
        message: "Le contenu ou une image est requis"
      });
    }

    const postData = {
      author: req.user._id,
      content: content || "",
      media,
      images
    };

    /** LOCATION */
    if (location?.longitude && location?.latitude) {
      const { longitude, latitude, address = "", city = "", country = "", placeName = "" } = location;

      postData.location = {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
        address,
        city,
        country,
        placeName
      };

      postData.city = city;
    }

    /** TAGS */
    if (tags) {
      postData.tags = Array.isArray(tags)
        ? tags
        : tags.split(",").map(t => t.trim());
    }

    /** MUSIC */
    if (musicURL) {
      postData.musicURL = musicURL;

      const volume = parseFloat(musicVolume);
      if (!Number.isNaN(volume)) {
        postData.musicVolume = Math.max(0, Math.min(100, volume)) / 100;
      }
    }

    const post = await Post.create(postData);

    /** UPDATE USER POSTS */
    await User.findByIdAndUpdate(req.user._id, {
      $push: { posts: post._id }
    });

    /** POPULATE POST */
    const populatedPost = await Post.findById(post._id)
      .populate("author", "username avatar firstName lastName");

    /** NOTIFY FOLLOWERS */
    const { followers = [] } = await User
      .findById(req.user._id)
      .select("followers")
      .lean();

    if (followers.length) {
      followers.forEach(followerId =>
        emitNotification(followerId, {
          type: "post",
          message: `${req.user.username} a publié un nouveau post`,
          postId: post._id
        })
      );
    }

    res.status(201).json({
      success: true,
      message: "Post créé avec succès",
      post: populatedPost
    });

  } catch (error) {
    next(error);
  }
};


/**
 * Get feed
 */
exports.getFeed = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { city } = req.query;

    const skip = (page - 1) * limit;

    const user = await User.findById(req.user._id).select("following");

    const followingIds = [...user.following, req.user._id];

    const query = {
      author: { $in: followingIds },
      isPublic: true
    };

    if (city) {
      query.city = new RegExp(city, "i");
    }

    const posts = await Post.find(query)
      .populate("author", "username avatar firstName lastName")
      .populate("likes", "username avatar")
      .sort(city ? { city: 1, createdAt: -1 } : { createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      posts,
      pagination: {
        page,
        limit,
        hasMore: posts.length === limit
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
      .populate("author", "username avatar firstName lastName")
      .populate("likes", "username avatar")
      .populate({
        path: "comments",
        populate: {
          path: "author",
          select: "username avatar firstName lastName"
        },
        options: { sort: { createdAt: -1 } }
      });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post non trouvé"
      });
    }

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

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post non trouvé"
      });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Non autorisé"
      });
    }

    post.content = req.body.content || post.content;

    await post.save();

    const updatedPost = await Post.findById(post._id)
      .populate("author", "username avatar firstName lastName");

    res.json({
      success: true,
      message: "Post mis à jour",
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
        message: "Post non trouvé"
      });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Non autorisé"
      });
    }

    await Post.findByIdAndDelete(req.params.id);

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { posts: req.params.id }
    });

    res.json({
      success: true,
      message: "Post supprimé"
    });

  } catch (error) {
    next(error);
  }
};


