import admin from "firebase-admin";
import User from "../models/User.js";

/**
 * Send push notification to a single user
 */
export const sendToUser = async (userId, title, body, data = {}) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.fcmToken || !user.notificationsEnabled) {
      return { success: false, reason: "User not found or notifications disabled" };
    }

    const message = {
      notification: {
        title,
        body,
      },
      data: {
        type: data.type || "general",
        patternId: data.patternId || "",
        ...data,
      },
      token: user.fcmToken,
      android: {
        priority: "high",
        notification: {
          channelId: "patterns",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log("✅ Notification sent to user:", userId);
    return { success: true, messageId: response };
  } catch (error) {
    console.error("❌ Error sending notification to user:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send push notification to multiple users
 */
export const sendToMultiple = async (userIds, title, body, data = {}) => {
  try {
    const users = await User.find({
      _id: { $in: userIds },
      fcmToken: { $ne: null },
      notificationsEnabled: true,
    });

    if (users.length === 0) {
      return { success: 0, failure: 0, reason: "No users with FCM tokens" };
    }

    const message = {
      notification: {
        title,
        body,
      },
      data: {
        type: data.type || "general",
        patternId: data.patternId || "",
        ...data,
      },
      tokens: users.map(u => u.fcmToken),
      android: {
        priority: "high",
        notification: {
          channelId: "patterns",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
          },
        },
      },
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    
    console.log(`✅ Notifications sent: ${response.successCount} success, ${response.failureCount} failure`);
    
    // Remove invalid tokens
    if (response.failureCount > 0) {
      const invalidTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          invalidTokens.push(users[idx].fcmToken);
        }
      });

      if (invalidTokens.length > 0) {
        await User.updateMany(
          { fcmToken: { $in: invalidTokens } },
          { $unset: { fcmToken: 1 } }
        );
      }
    }

    return {
      success: response.successCount,
      failure: response.failureCount,
    };
  } catch (error) {
    console.error("❌ Error sending notifications:", error.message);
    return { success: 0, failure: 0, error: error.message };
  }
};

/**
 * Send notification to all users
 */
export const sendToAll = async (title, body, data = {}) => {
  try {
    const filter = {
      fcmToken: { $ne: null },
      notificationsEnabled: true,
    };

    // Optionally filter by premium status
    if (data.sentTo === "premium") {
      filter.isPremium = true;
    } else if (data.sentTo === "free_users") {
      filter.isPremium = false;
    }

    const users = await User.find(filter);

    if (users.length === 0) {
      return { success: 0, failure: 0, reason: "No users found" };
    }

    // Send in batches of 500 (FCM limit)
    const batchSize = 500;
    let totalSuccess = 0;
    let totalFailure = 0;

    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      const result = await sendToMultiple(
        batch.map(u => u._id),
        title,
        body,
        data
      );
      
      totalSuccess += result.success || 0;
      totalFailure += result.failure || 0;
    }

    console.log(`✅ Total notifications sent: ${totalSuccess} success, ${totalFailure} failure`);
    
    return {
      success: totalSuccess,
      failure: totalFailure,
      total: users.length,
    };
  } catch (error) {
    console.error("❌ Error sending notifications to all:", error.message);
    return { success: 0, failure: 0, error: error.message };
  }
};

/**
 * Update user's FCM token
 */
export const updateFCMToken = async (userId, fcmToken) => {
  try {
    await User.findByIdAndUpdate(userId, { fcmToken });
    console.log("✅ FCM token updated for user:", userId);
    return { success: true };
  } catch (error) {
    console.error("❌ Error updating FCM token:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Toggle notifications for user
 */
export const toggleNotifications = async (userId, enabled) => {
  try {
    await User.findByIdAndUpdate(userId, { notificationsEnabled: enabled });
    console.log(`✅ Notifications ${enabled ? "enabled" : "disabled"} for user:`, userId);
    return { success: true };
  } catch (error) {
    console.error("❌ Error toggling notifications:", error.message);
    return { success: false, error: error.message };
  }
};
