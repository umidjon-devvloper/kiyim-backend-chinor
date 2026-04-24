import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { sendToAll, sendToUser, updateFCMToken, toggleNotifications } from "../services/notificationService.js";
import { successResponse, errorResponse } from "../utils/response.js";

/**
 * Send notification to all users (Admin only)
 */
export const sendNotification = async (req, res, next) => {
  try {
    const { title, body, type, sentTo, patternId } = req.body;

    if (!title || !body) {
      return errorResponse(res, "Title va body majburiy", 400);
    }

    // Create notification record
    const notification = await Notification.create({
      title,
      body,
      type: type || "general",
      sentTo: sentTo || "all",
      patternId: patternId || null,
      sentBy: req.user._id,
    });

    // Send notification
    const result = await sendToAll(title, body, {
      type: notification.type,
      patternId: notification.patternId,
      sentTo: notification.sentTo,
      notificationId: notification._id.toString(),
    });

    // Update notification status
    notification.sentCount = result.total || 0;
    notification.successCount = result.success || 0;
    notification.failureCount = result.failure || 0;
    notification.isSent = true;
    await notification.save();

    return successResponse(res, {
      notification,
      stats: {
        total: result.total,
        success: result.success,
        failure: result.failure,
      },
    }, "Notification yuborildi");
  } catch (error) {
    next(error);
  }
};

/**
 * Get all notifications (Admin only)
 */
export const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (type) filter.type = type;

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .populate("sentBy", "name email")
        .populate("patternId", "title previewImage")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Notification.countDocuments(filter),
    ]);

    return successResponse(res, {
      notifications,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update FCM token (for mobile app)
 */
export const updateFCMTokenController = async (req, res, next) => {
  try {
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return errorResponse(res, "FCM token majburiy", 400);
    }

    const result = await updateFCMToken(req.user._id, fcmToken);

    if (result.success) {
      return successResponse(res, null, "FCM token yangilandi");
    } else {
      return errorResponse(res, result.error, 500);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle notifications (for mobile app)
 */
export const toggleNotificationsController = async (req, res, next) => {
  try {
    const { enabled } = req.body;

    if (typeof enabled !== "boolean") {
      return errorResponse(res, "Enabled boolean bo'lishi kerak", 400);
    }

    const result = await toggleNotifications(req.user._id, enabled);

    if (result.success) {
      return successResponse(res, { enabled }, `Notifications ${enabled ? "yoqildi" : "o'chirildi"}`);
    } else {
      return errorResponse(res, result.error, 500);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Get user notification preferences (for mobile app)
 */
export const getNotificationPreferences = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("notificationsEnabled fcmToken");

    return successResponse(res, {
      notificationsEnabled: user.notificationsEnabled,
      hasFCMToken: !!user.fcmToken,
    });
  } catch (error) {
    next(error);
  }
};
