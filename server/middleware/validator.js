/**
 * Input Validation Middleware
 * Basic input validation helpers
 */

const { body, param, query, validationResult } = require("express-validator");

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Erreurs de validation",
      errors: errors.array(),
    });
  }
  next();
};

// Auth validation rules
const validateRegister = [
  body("username")
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Le nom d'utilisateur doit contenir entre 3 et 30 caractères")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage(
      "Le nom d'utilisateur ne peut contenir que des lettres, chiffres et underscores"
    ),
  body("email").isEmail().withMessage("Email invalide").normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Le mot de passe doit contenir au moins 6 caractères"),
  body("dateOfBirth")
    .exists()
    .withMessage("La date de naissance est requise")
    .isISO8601()
    .withMessage("Date de naissance invalide")
    .toDate(),
  handleValidationErrors,
];

const validateLogin = [
  body("email").isEmail().withMessage("Email invalide").normalizeEmail(),
  body("password").notEmpty().withMessage("Le mot de passe est requis"),
  handleValidationErrors,
];

// Post validation rules
const validatePost = [
  body("content")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Le contenu ne peut pas dépasser 2000 caractères"),
  body("location.longitude")
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude invalide"),
  body("location.latitude")
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude invalide"),
  handleValidationErrors,
];

// Story validation rules
const validateStory = [
  body("content")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Le contenu ne peut pas dépasser 500 caractères"),
  handleValidationErrors,
];

// Time Capsule validation rules
const validateTimeCapsule = [
  body("content")
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage("Le contenu doit contenir entre 1 et 2000 caractères"),
  body("unlockDate")
    .isISO8601()
    .withMessage("Date de déverrouillage invalide")
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error("La date de déverrouillage doit être dans le futur");
      }
      return true;
    }),
  handleValidationErrors,
];

// Comment validation rules
const validateComment = [
  body("content")
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage("Le commentaire doit contenir entre 1 et 500 caractères"),
  handleValidationErrors,
];

module.exports = {
  validateRegister,
  validateLogin,
  validatePost,
  validateStory,
  validateTimeCapsule,
  validateComment,
  handleValidationErrors,
};
