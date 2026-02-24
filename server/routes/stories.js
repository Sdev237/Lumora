/**
 * Story Routes
 * 24-hour stories endpoints
 */

const express = require("express");
const {
  createStory,
  getStories,
  getUserStories,
  viewStory,
  deleteStory,
} = require("../controllers/storyController");
const authMiddleware = require("../middleware/auth");
const upload = require("../middleware/upload");
const { validateStory } = require("../middleware/validator");

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get stories from followed users
router.get("/", getStories);

// Get user's stories
router.get("/user/:userId", getUserStories);

// Create story
router.post("/", upload.single("image"), validateStory, createStory);

// View story (mark as viewed)
router.post("/:id/view", viewStory);

// Delete story
router.delete("/:id", deleteStory);

module.exports = router;
