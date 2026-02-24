/**
 * Story Controller
 * Handle 24-hour stories creation and viewing
 */

const Story = require("../models/Story");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { emitNotification } = require("../sockets/socketHandler");

/**
 * Create story
 */
exports.createStory = async (req, res, next) => {
  try {
    const { content, location } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Une image est requise pour une story",
      });
    }

    const storyData = {
      author: req.user._id,
      content: content || "",
      image: `/uploads/${req.file.filename}`,
    };

    // Add location if provided
    if (location && location.longitude && location.latitude) {
      storyData.location = {
        type: "Point",
        coordinates: [
          parseFloat(location.longitude),
          parseFloat(location.latitude),
        ],
        address: location.address || "",
        city: location.city || "",
        placeName: location.placeName || "",
      };
    }

    // Create story with 24-hour expiration
    const story = await Story.createStory(storyData);

    const populatedStory = await Story.findById(story._id).populate(
      "author",
      "username avatar firstName lastName"
    );

    // Notify followers
    const user = await User.findById(req.user._id).select("followers");
    if (user && user.followers.length > 0) {
      user.followers.forEach((followerId) => {
        emitNotification(followerId, {
          type: "story",
          message: `${req.user.username} a publié une story`,
          storyId: story._id,
        });
      });
    }

    res.status(201).json({
      success: true,
      message: "Story créée avec succès",
      story: populatedStory,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get stories from followed users
 */
exports.getStories = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const followingIds = [...user.following, user._id]; // Include own stories

    const stories = await Story.find({
      author: { $in: followingIds },
      isActive: true,
      expiresAt: { $gt: new Date() }, // Only non-expired stories
    })
      .populate("author", "username avatar firstName lastName")
      .sort({ createdAt: -1 })
      .limit(50);

    // Group stories by author
    const storiesByAuthor = {};
    stories.forEach((story) => {
      const authorId = story.author._id.toString();
      if (!storiesByAuthor[authorId]) {
        storiesByAuthor[authorId] = {
          author: story.author,
          stories: [],
        };
      }
      storiesByAuthor[authorId].stories.push(story);
    });

    res.json({
      success: true,
      stories: Object.values(storiesByAuthor),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's stories
 */
exports.getUserStories = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user._id;

    const stories = await Story.find({
      author: userId,
      isActive: true,
      expiresAt: { $gt: new Date() },
    })
      .populate("author", "username avatar firstName lastName")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      stories,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * View story (mark as viewed)
 */
exports.viewStory = async (req, res, next) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Story non trouvée",
      });
    }

    // Add view
    const viewed = story.addView(req.user._id);
    await story.save();

    // Create notification if not own story
    if (story.author.toString() !== req.user._id.toString() && viewed) {
      await Notification.create({
        recipient: story.author,
        sender: req.user._id,
        type: "story_view",
        story: story._id,
      });

      emitNotification(story.author, {
        type: "story_view",
        message: `${req.user.username} a vu votre story`,
        storyId: story._id,
      });
    }

    res.json({
      success: true,
      viewed,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete story
 */
exports.deleteStory = async (req, res, next) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Story non trouvée",
      });
    }

    if (story.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Non autorisé",
      });
    }

    story.isActive = false;
    await story.save();

    res.json({
      success: true,
      message: "Story supprimée",
    });
  } catch (error) {
    next(error);
  }
};
