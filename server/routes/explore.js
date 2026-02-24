/**
 * Explore Routes
 * Explore page with smart filtering
 */

const express = require("express");
const {
  explorePosts,
  getTrending,
  getPostsByInterest,
  getNearbyPosts,
} = require("../controllers/exploreController");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Explore posts with filters
router.get("/posts", explorePosts);

// Get trending posts
router.get("/trending", getTrending);

// Get posts by interest
router.get("/interest", getPostsByInterest);

// Get nearby posts (for map)
router.get("/nearby", getNearbyPosts);

module.exports = router;
