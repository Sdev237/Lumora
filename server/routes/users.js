/**
 * User Routes
 * User profile and location endpoints
 */

const express = require("express");
const {
  getProfile,
  updateProfile,
  updateLocation,
  searchUsers,
  getNearbyUsers,
  getActiveUsers,
} = require("../controllers/userController");
const authMiddleware = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Search users
router.get("/search", searchUsers);

// Get nearby users (for local network mode)
router.get("/nearby", getNearbyUsers);

// Get active users (sharing location)
router.get("/active", getActiveUsers);

// Get user profile
router.get("/:id", getProfile);

// Update profile
router.put("/profile", upload.single("avatar"), updateProfile);

// Update current location
router.put("/location", updateLocation);

module.exports = router;
