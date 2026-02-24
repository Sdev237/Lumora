/**
 * Time Capsule Controller
 * Handle time capsules (posts that unlock in the future)
 */

const TimeCapsule = require("../models/TimeCapsule");
const Post = require("../models/Post");
const User = require("../models/User");
const { emitNotification } = require("../sockets/socketHandler");

/**
 * Create time capsule
 */
exports.createTimeCapsule = async (req, res, next) => {
  try {
    const { content, unlockDate, location, tags, recipients, isPublic } =
      req.body;
    const images = req.files
      ? req.files.map((file) => `/uploads/${file.filename}`)
      : [];

    if (!content && images.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Le contenu ou une image est requis",
      });
    }

    const capsuleData = {
      author: req.user._id,
      content: content || "",
      images,
      unlockDate: new Date(unlockDate),
      isPublic: isPublic !== undefined ? isPublic : true,
    };

    // Add location if provided
    if (location && location.longitude && location.latitude) {
      capsuleData.location = {
        type: "Point",
        coordinates: [
          parseFloat(location.longitude),
          parseFloat(location.latitude),
        ],
        address: location.address || "",
        city: location.city || "",
        country: location.country || "",
        placeName: location.placeName || "",
      };
    }

    // Add tags if provided
    if (tags) {
      capsuleData.tags = Array.isArray(tags)
        ? tags
        : tags.split(",").map((t) => t.trim());
    }

    // Add recipients if provided (for private capsules)
    if (recipients && recipients.length > 0) {
      capsuleData.recipients = recipients;
      capsuleData.isPublic = false;
    }

    const timeCapsule = await TimeCapsule.create(capsuleData);

    const populatedCapsule = await TimeCapsule.findById(timeCapsule._id)
      .populate("author", "username avatar firstName lastName")
      .populate("recipients", "username avatar");

    res.status(201).json({
      success: true,
      message: "Capsule temporelle créée avec succès",
      timeCapsule: populatedCapsule,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's time capsules
 */
exports.getMyTimeCapsules = async (req, res, next) => {
  try {
    const { status } = req.query; // 'pending', 'unlocked', 'all'

    let query = { author: req.user._id };

    if (status === "pending") {
      query.isUnlocked = false;
      query.unlockDate = { $gt: new Date() };
    } else if (status === "unlocked") {
      query.isUnlocked = true;
    }

    const timeCapsules = await TimeCapsule.find(query)
      .populate("author", "username avatar firstName lastName")
      .populate("unlockedPost")
      .sort({ unlockDate: 1 })
      .limit(50);

    res.json({
      success: true,
      timeCapsules,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get unlocked time capsules (for recipients)
 */
exports.getUnlockedTimeCapsules = async (req, res, next) => {
  try {
    const query = {
      isUnlocked: true,
      $or: [
        { isPublic: true },
        { recipients: req.user._id },
        { author: req.user._id },
      ],
    };

    const timeCapsules = await TimeCapsule.find(query)
      .populate("author", "username avatar firstName lastName")
      .populate("unlockedPost")
      .sort({ unlockedAt: -1 })
      .limit(50);

    res.json({
      success: true,
      timeCapsules,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Unlock time capsule (called by scheduled job or manually)
 */
exports.unlockTimeCapsule = async (req, res, next) => {
  try {
    const timeCapsule = await TimeCapsule.findById(req.params.id);

    if (!timeCapsule) {
      return res.status(404).json({
        success: false,
        message: "Capsule temporelle non trouvée",
      });
    }

    if (timeCapsule.isUnlocked) {
      return res.status(400).json({
        success: false,
        message: "Cette capsule est déjà déverrouillée",
      });
    }

    if (new Date() < timeCapsule.unlockDate) {
      return res.status(400).json({
        success: false,
        message: "Cette capsule ne peut pas encore être déverrouillée",
      });
    }

    // Unlock the capsule
    const post = await timeCapsule.unlock();

    // Notify recipients
    const recipients =
      timeCapsule.recipients.length > 0
        ? timeCapsule.recipients
        : await User.find({ following: timeCapsule.author }).select("_id");

    recipients.forEach((recipientId) => {
      emitNotification(recipientId, {
        type: "time_capsule_unlocked",
        message: `Une capsule temporelle de ${timeCapsule.author.username} a été déverrouillée`,
        timeCapsuleId: timeCapsule._id,
        postId: post._id,
      });
    });

    res.json({
      success: true,
      message: "Capsule temporelle déverrouillée",
      post,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete time capsule
 */
exports.deleteTimeCapsule = async (req, res, next) => {
  try {
    const timeCapsule = await TimeCapsule.findById(req.params.id);

    if (!timeCapsule) {
      return res.status(404).json({
        success: false,
        message: "Capsule temporelle non trouvée",
      });
    }

    if (timeCapsule.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Non autorisé",
      });
    }

    await TimeCapsule.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Capsule temporelle supprimée",
    });
  } catch (error) {
    next(error);
  }
};
