/**
 * Notification Routes
 * Notification endpoints
 */

const express = require("express");
const {
  getNotifications,
  markAsRead,
  deleteNotification,
} = require("../controllers/notificationController");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get notifications
router.get("/", getNotifications);

// Mark all as read
router.put("/read", markAsRead);

// Delete notification
router.delete("/:id", deleteNotification);

module.exports = router;
