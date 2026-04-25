# Expo Push Notifications Setup

## ✅ What Was Implemented

Replaced Firebase FCM with **Expo Push Notifications** using `expo-server-sdk`.

### Features:
1. ✅ Push notifications to individual users
2. ✅ Push notifications to multiple users
3. ✅ **Auto-check expiring subscriptions every 5 minutes**
4. ✅ Automatic notification for users with expiring subscriptions
5. ✅ Invalid token cleanup

---

## 📦 Installation

```bash
npm install expo-server-sdk
```

---

## 🔧 How It Works

### 1. Server Startup

When server starts (`src/server.js`):
```javascript
// Start periodic notification checker (every 5 minutes)
startPeriodicNotificationChecker(5);
```

### 2. Auto-Checker Runs Every 5 Minutes

**What it does:**
- Scans database for subscriptions expiring in next 5 days
- Sends push notifications to those users
- Logs results

**Logic:**
```javascript
// Find subscriptions expiring in next 5 days
const expiringSubs = await UserSubscription.find({
  paymeState: 2,
  endDate: { $gt: now, $lte: fiveDaysFromNow },
  isActive: true,
});

// Send notification to each user
for (const sub of expiringSubs) {
  const daysLeft = Math.ceil((sub.endDate - now) / (1000 * 60 * 60 * 24));
  
  if (daysLeft <= 1) {
    title = "⏰ Obuna deyarli tugadi!";
    body = "Sizning obunangiz bugun/ertaga tugaydi...";
  } else if (daysLeft <= 3) {
    title = "⚠️ Obuna yaqinlashmoqda";
    body = `Sizning obunangiz ${daysLeft} kundan keyin tugaydi...`;
  } else {
    title = "📅 Obuna eslatmasi";
    body = `Sizning obunangiz ${daysLeft} kundan keyin tugaydi...`;
  }
  
  await sendToUser(user._id, title, body, data);
}
```

### 3. Notification Messages

**5 days before:**
```
📅 Obuna eslatmasi
Sizning obunangiz 5 kundan keyin tugaydi. Oldindan rejalashtiring!
```

**3 days before:**
```
⚠️ Obuna yaqinlashmoqda
Sizning obunangiz 3 kundan keyin tugaydi. Vaqtida yangilang!
```

**1 day or less:**
```
⏰ Obuna deyarli tugadi!
Sizning obunangiz bugun/ertaga tugaydi. Hoziroq yangilang!
```

---

## 📡 API Endpoints

### Send to Single User
```javascript
import { sendToUser } from './services/notificationService.js';

await sendToUser(userId, "Title", "Body", {
  type: 'new_pattern',
  patternId: '123',
});
```

### Send to Multiple Users
```javascript
import { sendToMultiple } from './services/notificationService.js';

const userIds = ['user1', 'user2', 'user3'];
await sendToMultiple(userIds, "Title", "Body", {
  type: 'promotion',
});
```

### Send to All Users
```javascript
import { sendToAll } from './services/notificationService.js';

await sendToAll("Title", "Body", {
  sentTo: 'all', // or 'premium', 'free_users'
});
```

---

## 🔍 Database Requirements

### User Model must have:
```javascript
{
  fcmToken: String,           // Expo Push Token
  notificationsEnabled: Boolean // true/false
}
```

### How tokens are saved:
When user opens app, frontend sends token:
```
PUT /api/user/fcm-token
Body: { fcmToken: "ExponentPushToken[...]" }
```

---

## 📊 Console Output

**Every 5 minutes:**
```
🔍 Checking for expiring subscriptions...
⚠️ Found 3 expiring subscriptions
✅ Notified user1@gmail.com - 4 days left
✅ Notified user2@gmail.com - 2 days left
✅ Notified user3@gmail.com - 1 days left
✅ Checked 3 subscriptions, notified 3 users
```

**When no expiring subscriptions:**
```
🔍 Checking for expiring subscriptions...
✅ No expiring subscriptions found
```

---

## ⚙️ Configuration

### Change Check Interval

In `src/server.js`:
```javascript
// Change from 5 minutes to 10 minutes
startPeriodicNotificationChecker(10);
```

### Notification Timing

In `src/services/notificationService.js`:
```javascript
// Change from 5 days to 7 days
const sevenDaysFromNow = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));

const expiringSubs = await UserSubscription.find({
  endDate: { $gt: now, $lte: sevenDaysFromNow },
});
```

---

## 🧪 Testing

### Test 1: Manual Notification
```javascript
// In Node.js console or test file
import { sendToUser } from './services/notificationService.js';

await sendToUser('USER_ID', 'Test', 'This is a test notification');
```

### Test 2: Trigger Auto-Checker
```javascript
import { checkExpiringSubscriptions } from './services/notificationService.js';

const result = await checkExpiringSubscriptions();
console.log(result);
// { checked: 3, notified: 3 }
```

### Test 3: Create Test Subscription
```javascript
// Create subscription expiring in 2 days
const testSub = await UserSubscription.create({
  user: userId,
  plan: planId,
  startDate: new Date(),
  endDate: new Date(Date.now() + (2 * 24 * 60 * 60 * 1000)), // 2 days
  paymeState: 2,
  isActive: true,
});

// Wait 5 minutes for auto-checker
// Or manually trigger:
await checkExpiringSubscriptions();
```

---

## 🚨 Error Handling

### Invalid Tokens
Automatically removed from database:
```javascript
if (ticket.details.error === 'DeviceNotRegistered') {
  User.findByIdAndUpdate(userId, { $unset: { fcmToken: 1 } });
}
```

### Token Validation
Only valid Expo tokens are used:
```javascript
if (!Expo.isExpoPushToken(user.fcmToken)) {
  console.warn(`Invalid Expo push token: ${user.fcmToken}`);
  return;
}
```

---

## 📈 Monitoring

### Check Logs
```bash
# See notification logs
tail -f logs/server.log | grep -i "notification"
```

### Expected Log Pattern:
```
🔄 Starting periodic notification checker (every 5 minutes)
🔍 Checking for expiring subscriptions...
✅ No expiring subscriptions found
[5 minutes later]
🔍 Checking for expiring subscriptions...
⚠️ Found 2 expiring subscriptions
✅ Notified user1@gmail.com - 3 days left
✅ Notified user2@gmail.com - 1 days left
✅ Checked 2 subscriptions, notified 2 users
```

---

## 🎯 Benefits

1. ✅ **Automatic** - No manual intervention needed
2. ✅ **Smart timing** - Notifies at 5, 3, and 1 days
3. ✅ **Localized** - Messages in Uzbek language
4. ✅ **Efficient** - Only checks every 5 minutes
5. ✅ **Self-cleaning** - Removes invalid tokens automatically
6. ✅ **Scalable** - Uses chunked sending for large batches

---

## 🔑 Key Differences from Firebase

| Feature | Firebase FCM | Expo Push |
|---------|-------------|-----------|
| Setup | Complex (service account) | Simple (API key) |
| Token Format | FCM token | ExponentPushToken[...] |
| SDK | firebase-admin | expo-server-sdk |
| Best for | Native apps | Expo apps |
| Batch limit | 500 | 100 per chunk |

---

## 💡 Tips

1. **Check interval**: 5 minutes is good balance
2. **Token validation**: Always validate with `Expo.isExpoPushToken()`
3. **Error handling**: Check ticket.status === 'ok'
4. **Batch sending**: Use chunks for large user base
5. **Testing**: Use manual trigger before relying on auto-checker

---

## 🎉 Summary

✅ **expo-server-sdk** installed and configured
✅ **Auto-checker** runs every 5 minutes
✅ **Notifications** sent for expiring subscriptions
✅ **Invalid tokens** automatically cleaned up
✅ **Localized messages** in Uzbek
✅ **Smart timing** (5, 3, 1 days before expiry)

The system now automatically monitors subscriptions and sends timely push notifications! 🚀
