/**
 * Comment Controller
 * Handle comments on posts
 */

const Comment = require("../models/Comment");
const Post = require("../models/Post");
const Notification = require("../models/Notification");
const { emitNotification } = require("../sockets/socketHandler");

/**
 * Create comment
 */
exports.createComment = async (req, res, next) => {
  try {
    const { content, parentComment } = req.body;
    const postId = req.params.postId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post non trouvé",
      });
    }

    const comment = new Comment({
      post: postId,
      author: req.user._id,
      content,
      parentComment: parentComment || null,
    });

    await comment.save();

    // Add comment to post or parent comment
    if (parentComment) {
      await Comment.findByIdAndUpdate(parentComment, {
        $push: { replies: comment._id },
      });
    } else {
      await Post.findByIdAndUpdate(postId, {
        $push: { comments: comment._id },
      });
    }

    // Create notification for post author
    if (post.author.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: post.author,
        sender: req.user._id,
        type: "comment",
        post: postId,
        comment: comment._id,
      });

      emitNotification(post.author, {
        type: "comment",
        message: `${req.user.username} a commenté votre post`,
        postId: postId,
        commentId: comment._id,
      });
    }

    const populatedComment = await Comment.findById(comment._id).populate(
      "author",
      "username avatar firstName lastName"
    );

    res.status(201).json({
      success: true,
      message: "Commentaire créé",
      comment: populatedComment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get comments for a post
 */
exports.getComments = async (req, res, next) => {
  try {
    const postId = req.params.postId;
    const comments = await Comment.find({
      post: postId,
      parentComment: null, // Only top-level comments
    })
      .populate("author", "username avatar firstName lastName")
      .populate({
        path: "replies",
        populate: {
          path: "author",
          select: "username avatar firstName lastName",
        },
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      comments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete comment
 */
exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Commentaire non trouvé",
      });
    }

    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Non autorisé",
      });
    }

    // Delete replies
    if (comment.replies.length > 0) {
      await Comment.deleteMany({ _id: { $in: comment.replies } });
    }

    // Remove comment from post
    await Post.findByIdAndUpdate(comment.post, {
      $pull: { comments: comment._id },
    });

    await Comment.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Commentaire supprimé",
    });
  } catch (error) {
    next(error);
  }
};
