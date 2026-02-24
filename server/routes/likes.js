/**
 * Like Routes
 * Like/unlike endpoints
 */

const express = require("express");
const { likePost, likeComment } = require("../controllers/likeController");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Like/Unlike post
router.post("/post/:postId", likePost);

// Like/Unlike comment
router.post("/comment/:commentId", likeComment);

module.exports = router;
