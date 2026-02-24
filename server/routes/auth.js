/**
 * Auth Routes
 * Authentication endpoints
 */

const express = require("express");
const { register, login, getMe } = require("../controllers/authController");
const { validateRegister, validateLogin } = require("../middleware/validator");
const authMiddleware = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

// Register
router.post("/register", authLimiter, validateRegister, register);

// Login
router.post("/login", authLimiter, validateLogin, login);

// Get current user
router.get("/me", authMiddleware, getMe);

module.exports = router;
