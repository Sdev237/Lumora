/**
 * Like Controller
 * Handle likes on posts and comments
 */

const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Notification = require("../models/Notification");
const { emitNotification } = require("../sockets/socketHandler");

/**
 * Like/Unlike post
 */
exports.likePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post non trouvé",
      });
    }

    const isLiked = post.likes.some(
      (like) => like.toString() === req.user._id.toString()
    );

    if (isLiked) {
      // Remove like
      post.likes = post.likes.filter(
        (like) => like.toString() !== req.user._id.toString()
      );
      await post.save();

      // Delete notification
      await Notification.findOneAndDelete({
        recipient: post.author,
        sender: req.user._id,
        type: "like",
        post: post._id,
      });

      res.json({
        success: true,
        message: "Like retiré",
        liked: false,
      });
    } else {
      // Add like
      post.likes.push(req.user._id);
      await post.save();

      // Create notification if not own post
      if (post.author.toString() !== req.user._id.toString()) {
        await Notification.create({
          recipient: post.author,
          sender: req.user._id,
          type: "like",
          post: post._id,
        });

        emitNotification(post.author, {
          type: "like",
          message: `${req.user.username} a aimé votre post`,
          postId: post._id,
        });
      }

      res.json({
        success: true,
        message: "Post aimé",
        liked: true,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Like/Unlike comment
 */
exports.likeComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Commentaire non trouvé",
      });
    }

    const isLiked = comment.likes.some(
      (like) => like.toString() === req.user._id.toString()
    );

    if (isLiked) {
      comment.likes = comment.likes.filter(
        (like) => like.toString() !== req.user._id.toString()
      );
      await comment.save();

      res.json({
        success: true,
        message: "Like retiré",
        liked: false,
      });
    } else {
      comment.likes.push(req.user._id);
      await comment.save();

      res.json({
        success: true,
        message: "Commentaire aimé",
        liked: true,
      });
    }
  } catch (error) {
    next(error);
  }
};
