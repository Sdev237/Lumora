/**
 * User Model
 * User schema with geolocation support for local network mode
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Le nom d'utilisateur est requis"],
      unique: true,
      trim: true,
      minlength: [
        3,
        "Le nom d'utilisateur doit contenir au moins 3 caractères",
      ],
      maxlength: [
        30,
        "Le nom d'utilisateur ne peut pas dépasser 30 caractères",
      ],
      match: [
        /^[a-zA-Z0-9_]+$/,
        "Le nom d'utilisateur ne peut contenir que des lettres, chiffres et underscores",
      ],
    },
    email: {
      type: String,
      required: [true, "L'email est requis"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Email invalide"],
    },
    password: {
      type: String,
      required: [true, "Le mot de passe est requis"],
      minlength: [6, "Le mot de passe doit contenir au moins 6 caractères"],
      select: false, // Don't return password by default
    },
    firstName: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    bio: {
      type: String,
      maxlength: 500,
      default: "",
    },
    avatar: {
      type: String,
      default: "",
    },
    coverPhoto: {
      type: String,
      default: "",
    },
    // Current location for local network mode and live sharing
    currentLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
      address: String,
      city: String,
      country: String,
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
      isSharing: {
        type: Boolean,
        default: false, // Live location sharing status
      },
    },
    // Home location (optional)
    homeLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: null,
      },
      coordinates: {
        type: [Number],
        default: null,
      },
      address: String,
      city: String,
      country: String,
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    posts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
    interests: [
      {
        type: String, // e.g., 'adventure', 'culture', 'food', 'nature'
      },
    ],
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Geospatial index for current location (pour les requêtes de proximité)
userSchema.index({ currentLocation: "2dsphere" });
// Attention : ne pas indexer homeLocation en 2dsphere tant que les valeurs null ne sont pas nettoyées
// userSchema.index({ homeLocation: "2dsphere" });

// Indexes for performance
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ "currentLocation.city": 1 });
userSchema.index({ lastActive: -1 });

/**
 * Hash password before saving
 */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Compare password method
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Get public profile (without sensitive data)
 */
userSchema.methods.toPublicJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.email;
  return user;
};

/**
 * Check if user is in same city (for local network mode)
 */
userSchema.methods.isInSameCity = function (otherUser) {
  if (!this.currentLocation.city || !otherUser.currentLocation.city) {
    return false;
  }
  return (
    this.currentLocation.city.toLowerCase() ===
    otherUser.currentLocation.city.toLowerCase()
  );
};

module.exports = mongoose.model("User", userSchema);
