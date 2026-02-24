/**
 * Time Capsule Routes
 * Time capsule endpoints
 */

const express = require("express");
const {
  createTimeCapsule,
  getMyTimeCapsules,
  getUnlockedTimeCapsules,
  unlockTimeCapsule,
  deleteTimeCapsule,
} = require("../controllers/timeCapsuleController");
const authMiddleware = require("../middleware/auth");
const upload = require("../middleware/upload");
const { validateTimeCapsule } = require("../middleware/validator");

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get my time capsules
router.get("/my", getMyTimeCapsules);

// Get unlocked time capsules
router.get("/unlocked", getUnlockedTimeCapsules);

// Create time capsule
router.post(
  "/",
  upload.array("images", 5),
  validateTimeCapsule,
  createTimeCapsule
);

// Unlock time capsule (manual unlock)
router.post("/:id/unlock", unlockTimeCapsule);

// Delete time capsule
router.delete("/:id", deleteTimeCapsule);

module.exports = router;
