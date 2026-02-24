/**
 * Notification Controller
 * Handle user notifications
 */

const Notification = require('../models/Notification');

/**
 * Get notifications
 */
exports.getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const notifications = await Notification.find({
      recipient: req.user._id
    })
    .populate('sender', 'username avatar firstName lastName')
    .populate('post', 'content images')
    .populate('comment', 'content')
    .populate('story', 'image')
    .populate('timeCapsule', 'content')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false
    });

    res.json({
      success: true,
      notifications,
      unreadCount
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark notifications as read
 */
exports.markAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    res.json({
      success: true,
      message: 'Notifications marquées comme lues'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete notification
 */
exports.deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification non trouvée'
      });
    }

    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    await Notification.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Notification supprimée'
    });
  } catch (error) {
    next(error);
  }
};
