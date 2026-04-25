# Development Build Setup Guide

## ❌ Why Expo Go Doesn't Work

Your app uses native modules that Expo Go doesn't support:
- `expo-screen-capture` (screenshot prevention)
- `expo-notifications` (push notifications)
- `expo-video` (video playback)
- `@react-native-firebase/*` (Firebase)

**Solution:** You must use a **development build** instead.

---

## ✅ Option 1: Local Development Build (Fastest for Testing)

### Step 1: Install EAS CLI (if not installed)
```bash
npm install -g eas-cli
```

### Step 2: Build for Android (Local)
```bash
cd mobile
eas build --platform android --profile preview --local
```

### Step 3: Build for iOS (Local - Mac only)
```bash
cd mobile
eas build --platform ios --profile preview --local
```

### Step 4: Install the Build

**Android:**
```bash
# Install APK on connected device
adb install path/to/your/app.apk
```

**iOS (Mac):**
```bash
# Install on simulator or device
xcrun simctl install booted path/to/your/app.app
```

### Step 5: Run Metro Server
```bash
npm start
```

Then press `a` for Android or `i` for iOS.

---

## ✅ Option 2: Cloud Build (Easier)

### Step 1: Login to EAS
```bash
eas login
```

### Step 2: Create Development Build
```bash
cd mobile
eas build --platform android --profile development
```

### Step 3: Download & Install
- EAS will provide a download link
- Install the APK on your device
- Run `npm start` and scan QR code

---

## ✅ Option 3: Run on Emulator/Simulator (Easiest for Development)

### For Android Emulator:

1. **Start Android Emulator** (from Android Studio)
2. **Run:**
```bash
cd mobile
npm start
```
3. **Press `a`** - It will build and install automatically

### For iOS Simulator (Mac only):

1. **Start iOS Simulator** (from Xcode)
2. **Run:**
```bash
cd mobile
npm start
```
3. **Press `i`** - It will build and install automatically

---

## 📝 Configuration Files

### app.json - Already Configured ✅
Your `app.json` already has the correct plugins:
```json
{
  "plugins": [
    "expo-router",
    "expo-font",
    "expo-web-browser",
    "expo-dev-client",
    "expo-video",
    ["expo-notifications", { ... }]
  ]
}
```

### eas.json - Check Build Profiles

Create or update `mobile/eas.json`:
```json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "distribution": "store"
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

## 🔧 Common Commands

### Start Development Server
```bash
npm start
# or
expo start
```

### Build & Run on Android
```bash
npm run android
# or
expo run:android
```

### Build & Run on iOS
```bash
npm run ios
# or
expo run:ios
```

### Clear Cache & Restart
```bash
npm start -- --clear
# or
expo start -c
```

---

## 🐛 Troubleshooting

### Error: "expo-notifications not supported in Expo Go"
**Solution:** Use development build (see above)

### Error: "Cannot find module expo-screen-capture"
**Solution:**
```bash
cd mobile
npm install
npm start -- --clear
```

### Error: "Build failed"
**Solution:**
```bash
# Clear everything
rm -rf node_modules
rm -rf .expo
npm install
expo start -c
```

### App Won't Connect to Backend
**Solution:** Check `.env` file:
```
EXPO_PUBLIC_API_URL=http://YOUR_IP:5000
```

Use your computer's IP address (not localhost) for physical devices.

---

## 📱 Quick Start (Recommended for You)

### 1. Connect Android Device via USB
```bash
# Enable USB debugging on phone
# Connect via USB
cd mobile
npm start
```

### 2. Press `a` when prompted
- This will build the app
- Install on your device
- Start Metro server

### 3. App Will Launch Automatically
- Scan QR code if needed
- App should now work with all features

---

## ⚡ Development Workflow

Once you have a development build installed:

1. **Make code changes**
2. **Save file** (auto-reload)
3. **Press `r`** to reload if needed
4. **Press `j`** to open debugger

No need to rebuild unless you:
- Add new native modules
- Change app.json
- Update dependencies

---

## 🎯 Summary

| Method | Time | Difficulty | Best For |
|--------|------|------------|----------|
| Local Emulator | 5-10 min | Easy | Development |
| Cloud Build (EAS) | 15-30 min | Medium | Testing on device |
| Local Build | 10-20 min | Hard | Production |

**Recommended:** Start with Android/iOS emulator for fastest development!
