/**
 * Live Routes
 * Basic live session endpoints
 */

const express = require("express");
const {
  startLive,
  stopLive,
  getActiveLives,
  getLiveById,
} = require("../controllers/liveController");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// All live routes require authentication
router.use(authMiddleware);

router.post("/start", startLive);
router.post("/stop", stopLive);
router.get("/active", getActiveLives);
router.get("/:id", getLiveById);

module.exports = router;

