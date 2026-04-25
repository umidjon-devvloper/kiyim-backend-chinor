# Socket.IO Troubleshooting Guide

## ❌ Common Errors and Solutions

### Error 1: `websocket error`

**Cause:** WebSocket connection blocked or unsupported

**Solutions:**

#### Solution 1: Use Polling First (Already Applied)
```typescript
transports: ['polling', 'websocket']
```
- Tries HTTP polling first
- Upgrades to WebSocket if supported
- Works behind proxies/firewalls

#### Solution 2: Check URL Format
```typescript
// WRONG
http://example.com
https://example.com

// CORRECT
ws://example.com (for http)
wss://example.com (for https)
```

#### Solution 3: Railway WebSocket Support
Railway requires special configuration for WebSockets:

1. **Check Railway docs**: https://docs.railway.app/guides/websockets
2. **Enable WebSocket support** in railway.toml:
```toml
[build]
builder = "NIXPACKS"

[deploy]
healthcheckPath = "/health"
restartPolicyType = "ON_FAILURE"
```

---

## 🔍 Debug Steps

### Step 1: Check Console Logs

**Mobile app should show:**
```
🔗 API URL: https://kiyim-backend-chinor-production-beab.up.railway.app
🔗 WebSocket URL: wss://kiyim-backend-chinor-production-beab.up.railway.app
✅ Socket connected: abc123
```

**If you see:**
```
❌ Socket connection error: websocket error
```
→ WebSocket is blocked, using polling fallback

### Step 2: Test WebSocket Connection

**From browser console:**
```javascript
const ws = new WebSocket('wss://kiyim-backend-chinor-production-beab.up.railway.app/socket.io/?EIO=4&transport=websocket');
ws.onopen = () => console.log('✅ WebSocket works!');
ws.onerror = (e) => console.log('❌ WebSocket failed:', e);
```

### Step 3: Test HTTP Polling

**From terminal:**
```bash
curl "https://kiyim-backend-chinor-production-beab.up.railway.app/socket.io/?EIO=4&transport=polling"
```

**Should return:**
```
0{"sid":"...","upgrades":["websocket"],"pingInterval":25000,"pingTimeout":20000}
```

---

## 🚀 Quick Fixes

### Fix 1: Disable WebSocket (Use Polling Only)

**File:** `mobile/lib/socket.ts`
```typescript
this.socket = io(wsUrl, {
  transports: ['polling'], // NO websocket
  reconnection: true,
});
```

**Pros:**
- ✅ Always works
- ✅ Behind any proxy
- ✅ No firewall issues

**Cons:**
- ❌ Slightly higher latency (1-2s)
- ❌ More HTTP requests

### Fix 2: Use Local Backend for Testing

**File:** `mobile/.env`
```env
# Change from Railway to local
EXPO_PUBLIC_API_URL=http://192.168.0.117:5000
```

Then:
```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Mobile
cd mobile
npm start
```

### Fix 3: Check Railway Deployment

**In Railway dashboard:**
1. Go to your service
2. Check logs for:
   ```
   ✅ Socket.IO server initialized
   👀 Starting notification watcher...
   ```

3. If you see errors → Redeploy

---

## 📊 Current Configuration

### Backend (socket.js)
```javascript
io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins
    methods: ["GET", "POST"]
  }
});
```

### Mobile (socket.ts)
```typescript
transports: ['polling', 'websocket'],
reconnection: true,
reconnectionDelay: 2000,
reconnectionAttempts: 10,
```

---

## 🔧 Alternative: HTTP Polling Fallback

If Socket.IO doesn't work on Railway, use simple polling:

**Create:** `mobile/lib/notificationPoller.ts`
```typescript
import * as api from '@/lib/api/kiyimApi';

class NotificationPoller {
  private interval: any = null;
  private lastNotificationId: string | null = null;

  start(userId: string, token: string) {
    console.log('🔄 Starting notification poller (every 30s)');
    
    this.interval = setInterval(async () => {
      try {
        const notifications = await api.getNotifications(token);
        
        // Check for new notifications
        const latest = notifications[0];
        if (latest && latest._id !== this.lastNotificationId) {
          this.lastNotificationId = latest._id;
          console.log('🔔 New notification:', latest.title);
          
          // Show notification
          this.showNotification(latest);
        }
      } catch (error) {
        console.error('❌ Polling error:', error);
      }
    }, 30000); // Every 30 seconds
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private showNotification(data: any) {
    console.log(`📱 ${data.title}: ${data.body}`);
  }
}

export const notificationPoller = new NotificationPoller();
```

**Use in AuthContext:**
```typescript
import { notificationPoller } from '@/lib/notificationPoller';

// After login
notificationPoller.start(user._id, token);

// On logout
notificationPoller.stop();
```

---

## ✅ Verification Checklist

- [ ] Backend logs show: `✅ Socket.IO server initialized`
- [ ] Backend logs show: `👀 Starting notification watcher...`
- [ ] Mobile logs show: `🔗 WebSocket URL: wss://...`
- [ ] Mobile logs show: `✅ Socket connected` OR using polling
- [ ] No CORS errors in backend logs
- [ ] Railway service is running (not crashed)
- [ ] MongoDB replica set is configured (for change streams)

---

## 🎯 Recommended Approach for Railway

Since Railway may have WebSocket limitations:

### Option 1: Polling + Socket (Hybrid)
```typescript
// Try socket first
socketService.connect(userId);

// Fallback to polling if socket fails
setTimeout(() => {
  if (!socketService.isConnected()) {
    console.log('⚠️ Socket failed, using polling fallback');
    notificationPoller.start(userId, token);
  }
}, 5000);
```

### Option 2: Polling Only (Simpler)
```typescript
// Skip socket, use polling
notificationPoller.start(userId, token);
```

**Polling interval:** 30 seconds
**Latency:** 30s max (vs 250ms with socket)
**Reliability:** 100% (always works)

---

## 📝 Next Steps

1. **Check mobile logs** - What exact error?
2. **Try polling only** - Change `transports: ['polling']`
3. **Test locally** - Use `http://192.168.0.117:5000`
4. **Check Railway** - Verify WebSocket support
5. **Use hybrid** - Socket + polling fallback

Choose the approach that works best for your setup! 🚀
