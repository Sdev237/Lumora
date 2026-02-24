/**
 * Follow Routes
 * Follow/unfollow endpoints
 */

const express = require("express");
const {
  followUser,
  getFollowers,
  getFollowing,
} = require("../controllers/followController");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Follow/Unfollow user
router.post("/:userId", followUser);

// Get followers
router.get("/:userId/followers", getFollowers);

// Get following
router.get("/:userId/following", getFollowing);

module.exports = router;
