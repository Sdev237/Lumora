/**
 * Post Routes
 * Post CRUD operations
 */

const express = require("express");
const {
  createPost,
  getFeed,
  getPost,
  updatePost,
  deletePost,
  getPostsByLocation,
} = require("../controllers/postController");
const authMiddleware = require("../middleware/auth");
const upload = require("../middleware/upload");
const { validatePost } = require("../middleware/validator");

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get feed
router.get("/feed", getFeed);

// Get posts by location (for map)
router.get("/location", getPostsByLocation);

// Get single post
router.get("/:id", getPost);

// Create post
router.post("/", upload.array("images", 5), validatePost, createPost);

// Update post
router.put("/:id", validatePost, updatePost);

// Delete post
router.delete("/:id", deletePost);

module.exports = router;
