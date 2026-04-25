# Push Notification Debugging Guide

## Current Status
✅ Expo Push Token is generated successfully: `ExponentPushToken[6QWoO2CT1qB4_1-XwyIyeV]`
❌ Network request fails when sending token to backend

## Possible Causes & Solutions

### 1. Backend Server Not Reachable
**Check if backend is running:**
```bash
curl https://kiyim-backend-chinor-production-beab.up.railway.app/health
```

**Expected response:**
```json
{
  "success": true,
  "message": "Server ishlayapti ✅",
  "timestamp": "..."
}
```

### 2. Authentication Issue
The `/api/user/fcm-token` endpoint requires authentication.

**Check the logs for:**
- `401 Unauthorized` - Token is invalid or expired
- `403 Forbidden` - Permission issue
- Network error - Backend unreachable

### 3. CORS Issue (Less likely since CORS is configured)
Backend CORS is set to `*` so this shouldn't be an issue.

### 4. Expo Go Limitations
The warnings you see are normal:
```
expo-notifications functionality is not fully supported in Expo Go
```

**Solution:** Use a development build instead of Expo Go for full notification support.

## Steps to Fix

### Step 1: Verify Backend is Running
```bash
# Test health endpoint
curl https://kiyim-backend-chinor-production-beab.up.railway.app/health
```

### Step 2: Check Auth Token
Make sure you're logged in and the token is valid:
- Check AsyncStorage for the JWT token
- Verify the token isn't expired

### Step 3: Test Manually
```bash
# Replace YOUR_JWT_TOKEN with actual token
curl -X PUT https://kiyim-backend-chinor-production-beab.up.railway.app/api/user/fcm-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"fcmToken": "ExponentPushToken[6QWoO2CT1qB4_1-XwyIyeV]"}'
```

### Step 4: Check Backend Logs
Look at your Railway logs for any errors when the request is made.

### Step 5: Use Development Build (Recommended)
For production notifications, create a development build:
```bash
eas build --profile development --platform ios
```

## What I Fixed in the Code

1. ✅ Added retry logic (3 attempts with 2s delay)
2. ✅ Better error handling and logging
3. ✅ App continues to work even if token save fails
4. ✅ Replaced Firebase messaging with expo-notifications

## Next Steps

1. Check if backend is reachable from your device/emulator
2. Verify authentication token is valid
3. Check backend logs on Railway
4. Consider creating a development build for full notification support

## Testing Admin Notifications

Once the token is saved successfully:
1. Go to Admin Panel → Notifications
2. Send a test notification
3. Check if it arrives on the device
