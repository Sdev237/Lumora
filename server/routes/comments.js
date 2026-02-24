/**
 * Comment Routes
 * Comment endpoints
 */

const express = require("express");
const {
  createComment,
  getComments,
  deleteComment,
} = require("../controllers/commentController");
const authMiddleware = require("../middleware/auth");
const { validateComment } = require("../middleware/validator");

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get comments for a post
router.get("/:postId", getComments);

// Create comment
router.post("/:postId", validateComment, createComment);

// Delete comment
router.delete("/:id", deleteComment);

module.exports = router;
