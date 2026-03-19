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

    /** MEDIA */
    const media = files.map(({ mimetype = "", filename }) => ({
      type: mimetype.toLowerCase().includes("video") ? "video" : "image",
      url: `/uploads/${filename}`
    }));

    const images = media
      .filter(m => m.type === "image")
      .map(m => m.url);

    /** VALIDATION */
    if (!content && media.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Le contenu ou une image est requis"
      });
    }

    /** POST DATA */
    const postData = {
      author: req.user._id,
      content: content || "",
      media,
      images
    };

    /** LOCATION */
    if (location?.longitude && location?.latitude) {
      const longitude = parseFloat(location.longitude);
      const latitude = parseFloat(location.latitude);

      if (!Number.isNaN(longitude) && !Number.isNaN(latitude)) {
        postData.location = {
          type: "Point",
          coordinates: [longitude, latitude],
          address: location.address || "",
          city: location.city || "",
          country: location.country || "",
          placeName: location.placeName || ""
        };

        postData.city = location.city || "";
      }
    }

    /** TAGS */
    if (tags) {
      postData.tags = Array.isArray(tags)
        ? tags
        : tags.split(",").map(t => t.trim()).filter(Boolean);
    }

    /** MUSIC */
    if (musicURL) {
      postData.musicURL = musicURL;

      const volume = parseFloat(musicVolume);
      if (!Number.isNaN(volume)) {
        postData.musicVolume = Math.max(0, Math.min(100, volume)) / 100;
      }
    }

    /** CREATE POST */
    const post = await Post.create(postData);

    /** UPDATE USER (non bloquant) */
    const userUpdatePromise = User.findByIdAndUpdate(req.user._id, {
      $push: { posts: post._id }
    });

    /** POPULATE (optimisé, pas de requête supplémentaire) */
    await post.populate("author", "username avatar firstName lastName");

    /** NOTIFICATIONS */
    const followersPromise = User.findById(req.user._id)
      .select("followers")
      .lean();

    const [{ followers = [] }] = await Promise.all([
      followersPromise,
      userUpdatePromise
    ]);

    if (followers.length) {
      await Promise.all(
        followers.map(followerId =>
          emitNotification(followerId, {
            type: "post",
            message: `${req.user.username} a publié un nouveau post`,
            postId: post._id
          })
        )
      );
    }

    res.status(201).json({
      success: true,
      message: "Post créé avec succès",
      post
    });

  } catch (error) {
    next(error);
  }
};