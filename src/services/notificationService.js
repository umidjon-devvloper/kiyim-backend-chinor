import { Expo } from 'expo-server-sdk';
import User from "../models/User.js";
import { UserSubscription } from "../models/Subscription.js";

// Create Expo SDK instance
const expo = new Expo();

/**
 * Send push notification to a single user using Expo Push API
 */
export const sendToUser = async (userId, title, body, data = {}) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.fcmToken || !user.notificationsEnabled) {
      return { success: false, reason: "User not found or notifications disabled" };
    }

    // Check if it's a valid Expo push token
    if (!Expo.isExpoPushToken(user.fcmToken)) {
      console.error(`Invalid Expo push token: ${user.fcmToken}`);
      return { success: false, reason: "Invalid push token" };
    }

    const message = {
      to: user.fcmToken,
      sound: 'default',
      title,
      body,
      data: {
        type: data.type || "general",
        patternId: data.patternId || "",
        ...data,
      },
    };

    const ticket = await expo.sendPushNotificationsAsync([message]);
    console.log("✅ Notification sent to user:", userId, ticket);
    return { success: true, ticket };
  } catch (error) {
    console.error("❌ Error sending notification to user:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send push notification to multiple users using Expo Push API
 */
export const sendToMultiple = async (userIds, title, body, data = {}) => {
  try {
    const users = await User.find({
      _id: { $in: userIds },
      fcmToken: { $ne: null },
      notificationsEnabled: true,
    });

    if (users.length === 0) {
      return { success: 0, failure: 0, reason: "No users with push tokens" };
    }

    // Filter valid Expo push tokens
    const messages = [];
    const userMap = new Map();

    users.forEach(user => {
      if (Expo.isExpoPushToken(user.fcmToken)) {
        messages.push({
          to: user.fcmToken,
          sound: 'default',
          title,
          body,
          data: {
            type: data.type || "general",
            patternId: data.patternId || "",
            ...data,
          },
        });
        userMap.set(user.fcmToken, user._id);
      } else {
        console.warn(`Invalid Expo push token for user ${user._id}: ${user.fcmToken}`);
      }
    });

    if (messages.length === 0) {
      return { success: 0, failure: 0, reason: "No valid Expo push tokens" };
    }

    // Send in chunks (Expo recommends max 100 per request)
    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error("❌ Error sending push notification chunk:", error);
      }
    }

    // Check for errors in tickets
    let successCount = 0;
    let failureCount = 0;

    tickets.forEach((ticket, idx) => {
      if (ticket.status === 'ok') {
        successCount++;
      } else {
        failureCount++;
        console.error(`❌ Failed to send to ${messages[idx].to}:`, ticket.details);
        
        // Remove invalid tokens
        if (ticket.details && ticket.details.error === 'DeviceNotRegistered') {
          const userId = userMap.get(messages[idx].to);
          if (userId) {
            User.findByIdAndUpdate(userId, { $unset: { fcmToken: 1 } }).catch(console.error);
          }
        }
      }
    });

    console.log(`✅ Notifications sent: ${successCount} success, ${failureCount} failure`);
    
    return {
      success: successCount,
      failure: failureCount,
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

/**
 * Check and send notifications for expiring subscriptions
 * Run this every 5-10 minutes
 */
export const checkExpiringSubscriptions = async () => {
  try {
    console.log("🔍 Checking for expiring subscriptions...");
    
    const now = new Date();
    const fiveDaysFromNow = new Date(now.getTime() + (5 * 24 * 60 * 60 * 1000));
    
    // Find subscriptions expiring in next 5 days
    const expiringSubs = await UserSubscription.find({
      paymeState: 2,
      endDate: { $gt: now, $lte: fiveDaysFromNow },
      isActive: true,
    }).populate('user');

    if (expiringSubs.length === 0) {
      console.log("✅ No expiring subscriptions found");
      return { checked: 0, notified: 0 };
    }

    console.log(`⚠️ Found ${expiringSubs.length} expiring subscriptions`);

    let notified = 0;

    for (const sub of expiringSubs) {
      const user = sub.user;
      if (!user || !user.fcmToken || !user.notificationsEnabled) {
        continue;
      }

      const daysLeft = Math.ceil((sub.endDate - now) / (1000 * 60 * 60 * 24));
      
      let title, body;
      
      if (daysLeft <= 1) {
        title = "⏰ Obuna deyarli tugadi!";
        body = `Sizning obunangiz ${daysLeft === 0 ? 'bugun' : 'ertaga'} tugaydi. Hoziroq yangilang!`;
      } else if (daysLeft <= 3) {
        title = "⚠️ Obuna yaqinlashmoqda";
        body = `Sizning obunangiz ${daysLeft} kundan keyin tugaydi. Vaqtida yangilang!`;
      } else {
        title = "📅 Obuna eslatmasi";
        body = `Sizning obunangiz ${daysLeft} kundan keyin tugaydi. Oldindan rejalashtiring!`;
      }

      const result = await sendToUser(user._id, title, body, {
        type: 'subscription_expiring',
        subscriptionId: sub._id.toString(),
        daysLeft: daysLeft.toString(),
      });

      if (result.success) {
        notified++;
        console.log(`✅ Notified ${user.email} - ${daysLeft} days left`);
      }
    }

    console.log(`✅ Checked ${expiringSubs.length} subscriptions, notified ${notified} users`);
    return { checked: expiringSubs.length, notified };
  } catch (error) {
    console.error("❌ Error checking expiring subscriptions:", error.message);
    return { checked: 0, notified: 0, error: error.message };
  }
};

/**
 * Start periodic notification checker
 * Call this once when server starts
 */
export const startPeriodicNotificationChecker = (intervalMinutes = 5) => {
  const intervalMs = intervalMinutes * 60 * 1000;
  
  console.log(`🔄 Starting periodic notification checker (every ${intervalMinutes} minutes)`);
  
  // Run immediately on start
  checkExpiringSubscriptions().catch(console.error);
  
  // Then run periodically
  setInterval(() => {
    checkExpiringSubscriptions().catch(console.error);
  }, intervalMs);
};
