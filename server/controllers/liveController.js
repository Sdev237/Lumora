/**
 * Live Controller
 * Basic TikTok-style live session management
 */

const LiveSession = require("../models/LiveSession");
const User = require("../models/User");
const { getIO, emitNotification } = require("../sockets/socketHandler");
const Post = require("../models/Post");

/**
 * Start or resume a live session
 */
exports.startLive = async (req, res, next) => {
  try {
    const { title } = req.body;

    // Either reuse an existing inactive session or create a new one
    let session = await LiveSession.findOne({
      host: req.user._id,
      isActive: true,
    });

    if (!session) {
      session = await LiveSession.create({
        host: req.user._id,
        title: title || "",
        isActive: true,
        viewersCount: 0,
        startedAt: new Date(),
      });
    } else if (title) {
      session.title = title;
      await session.save();
    }

    await User.findByIdAndUpdate(req.user._id, { isLive: true });

    const io = getIO();
    io.emit("live:started", {
      sessionId: session._id,
      hostId: req.user._id,
      title: session.title,
    });

    res.status(201).json({
      success: true,
      session,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Stop the current live session
 */
exports.stopLive = async (req, res, next) => {
  try {
    const { publishToFeed, content } = req.body || {};

    const session = await LiveSession.findOne({
      host: req.user._id,
      isActive: true,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Aucune session live active",
      });
    }

    session.isActive = false;
    session.endedAt = new Date();
    await session.save();

    await User.findByIdAndUpdate(req.user._id, { isLive: false });

    const io = getIO();
    io.emit("live:stopped", {
      sessionId: session._id,
      hostId: req.user._id,
    });

    let publishedPost = null;
    if (publishToFeed) {
      const postContent =
        (content && String(content).trim()) ||
        `🔴 Live terminé${session.title ? ` : ${session.title}` : ""}`;

      const post = await Post.create({
        author: req.user._id,
        content: postContent,
        liveSession: session._id,
        media: [],
        images: [],
        isPublic: true,
      });

      await User.findByIdAndUpdate(req.user._id, {
        $push: { posts: post._id },
      });

      publishedPost = await Post.findById(post._id).populate(
        "author",
        "username avatar firstName lastName"
      );

      // Notify followers in real-time (like a normal post)
      const u = await User.findById(req.user._id).select("followers username");
      if (u && u.followers?.length) {
        u.followers.forEach((followerId) => {
          emitNotification(followerId, {
            type: "post",
            message: `${u.username} a publié un nouveau post`,
            postId: post._id,
          });
        });
      }
    }

    res.json({
      success: true,
      session,
      publishedPost,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List active sessions
 */
exports.getActiveLives = async (req, res, next) => {
  try {
    const sessions = await LiveSession.find({ isActive: true })
      .sort({ startedAt: -1 })
      .populate("host", "username avatar firstName lastName isLive");

    res.json({
      success: true,
      sessions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get one live session
 */
exports.getLiveById = async (req, res, next) => {
  try {
    const session = await LiveSession.findById(req.params.id).populate(
      "host",
      "username avatar firstName lastName isLive"
    );

    if (!session || !session.isActive) {
      return res.status(404).json({
        success: false,
        message: "Live non trouvé ou terminé",
      });
    }

    res.json({
      success: true,
      session,
    });
  } catch (error) {
    next(error);
  }
};

