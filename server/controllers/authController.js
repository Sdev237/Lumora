/**
 * Auth Controller
 * Handle user registration, login, and authentication
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const {
  evaluateDeclaredAge,
} = require('../services/ageVerificationService');

/**
 * Generate JWT token
 */
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    { expiresIn: '7d' }
  );
};

/**
 * Register new user
 */
exports.register = async (req, res, next) => {
  try {
    const { username, email, password, firstName, lastName, dateOfBirth } = req.body;

    const minimumAge =
      parseInt(process.env.MINIMUM_AGE || '', 10) || 16;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Un utilisateur avec cet email ou nom d\'utilisateur existe déjà.'
      });
    }

    // Age verification based on declared date of birth
    const { isOfAge } = evaluateDeclaredAge(dateOfBirth, minimumAge);

    if (!isOfAge) {
      return res.status(400).json({
        success: false,
        message: `Vous devez avoir au moins ${minimumAge} ans pour créer un compte.`,
      });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      firstName,
      lastName,
      dateOfBirth,
      ageVerified: true,
      verificationMethod: 'self-report',
      verificationConfidence: 0.5,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      token,
      user: user.toPublicJSON()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect.'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect.'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Compte désactivé.'
      });
    }

    // Update last active
    user.lastActive = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: user.toPublicJSON()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 */
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('followers', 'username avatar firstName lastName')
      .populate('following', 'username avatar firstName lastName')
      .select('-password');

    res.json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};
