# Real-time Subscription Countdown

## ✅ What Was Fixed

### Problem:
- Days weren't automatically decreasing each day
- User expected: "Kechagina oldim, 30 kun edi, nega 29 emas?"
- Need real-time countdown with hours and minutes

### Solution:
Added **real-time countdown** that updates every minute on the client side.

---

## 🎯 How It Works

### Backend (Already Correct):
```javascript
// Calculates time remaining from NOW until endDate
const timeDiff = new Date(activeSub.endDate) - now;
const daysLeft = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
const hoursLeft = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
const minutesLeft = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
```

**Example:**
- User A (umid@gmail.com): Bought on April 23
  - End date: May 23, 2026
  - Today: April 25, 2026
  - **Shows: 28 days** ✅

- User B (qo'lda activated): Activated on April 24
  - End date: May 24, 2026
  - Today: April 25, 2026
  - **Shows: 29 days** ✅

### Frontend (New - Real-time):
```typescript
// Updates every 60 seconds
const [currentTime, setCurrentTime] = useState(new Date());

useEffect(() => {
  const interval = setInterval(() => {
    setCurrentTime(new Date());
  }, 60000); // Update every minute
  return () => clearInterval(interval);
}, []);

// Calculate remaining time in real-time
const calculateTimeLeft = () => {
  const endDate = new Date(subscription.endDate);
  const timeDiff = endDate.getTime() - currentTime.getTime();
  
  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
  
  return { days, hours, minutes };
};
```

---

## 📊 Display Logic

### When Days > 0:
```
┌─────────┐
│   28    │  ← Updates automatically every day
│Kun qoldi│
└─────────┘
```

### When Days = 0 (Less than 24 hours):
```
┌──────────────┐
│      0       │
│ Soat qoldi   │
│ 15soat 32daq │ ← Shows hours and minutes
└──────────────┘
```

### When Expired:
```
┌─────────┐
│    0    │
│Kun qoldi│
└─────────┘
```

---

## 🔄 Auto-Update Features

### 1. Every Minute:
- Frontend recalculates time remaining
- No need to refresh page
- Automatic countdown

### 2. When You Refresh:
- Fetches latest data from backend
- Backend calculates from current server time
- Always accurate

### 3. Each Day:
- Days automatically decrease by 1
- No manual intervention needed
- Math: `endDate - currentDate = remaining days`

---

## 📝 Example Timeline

**User: umid@gmail.com**
- **April 23, 17:32**: Bought 30-day subscription
  - End date: May 23, 17:32
  - Shows: **29 days** (same day, few hours passed)

- **April 24, 10:00**: Next day
  - Shows: **28 days** ✅

- **April 25, 15:00**: Another day
  - Shows: **27 days** ✅

- **May 22, 17:32**: Last day
  - Shows: **0 days, 23soat 59daq**

- **May 23, 17:32**: Expired
  - Shows: **0 days**
  - Subscription inactive

---

## 🎨 Visual Display

### Profile Stats Card:

```
┌─────────────────────┐
│  ❤️  28    ⏰  0    │
│ Sevimli  Kun qoldi  │
│                     │
└─────────────────────┘

When < 24 hours:
┌─────────────────────┐
│  ❤️  5     ⏰  0    │
│ Sevimli  Soat qoldi │
│         15soat 32daq│ ← New!
└─────────────────────┘
```

---

## 🔧 Code Changes

### File: `mobile/app/(tabs)/profile.tsx`

**1. Added state for current time:**
```typescript
const [currentTime, setCurrentTime] = useState(new Date());
```

**2. Added auto-update interval:**
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    setCurrentTime(new Date());
  }, 60000); // Every minute
  return () => clearInterval(interval);
}, []);
```

**3. Added calculation function:**
```typescript
const calculateTimeLeft = () => {
  const endDate = new Date(subscription.endDate);
  const timeDiff = endDate.getTime() - currentTime.getTime();
  
  return {
    days: Math.floor(timeDiff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))
  };
};
```

**4. Updated display:**
```typescript
<Text>{timeLeft.days}</Text>
<Text>{timeLeft.days === 0 ? "Soat" : "Kun"} qoldi</Text>
{timeLeft.days === 0 && (
  <Text>{timeLeft.hours}soat {timeLeft.minutes}daq</Text>
)}
```

---

## ✅ Testing

### Test 1: Check Current Days
1. Open profile
2. Look at "Kun qoldi" stat
3. Should show correct remaining days

### Test 2: Wait 1 Minute
1. Stay on profile screen
2. Wait 60 seconds
3. Time should update automatically

### Test 3: Pull to Refresh
1. Tap refresh button (🔄)
2. Data fetches from backend
3. Shows latest calculation

### Test 4: Check Different Users
- **umid@gmail.com**: Should show ~29 days
- **qo'lda activated user**: Should show ~28 days
- Each user has different end date

---

## 🎯 Key Benefits

1. ✅ **Auto-decrease**: Days decrease automatically each day
2. ✅ **Real-time**: Updates every minute without refresh
3. ✅ **Accurate**: Backend calculates from server time
4. ✅ **Detailed**: Shows hours and minutes when < 1 day
5. ✅ **No manual work**: Everything automatic

---

## 💡 How the Math Works

```
Given:
- Start: April 23, 2026 17:32
- End: May 23, 2026 17:32
- Now: April 25, 2026 10:00

Calculation:
timeDiff = endDate - now
         = May 23 17:32 - April 25 10:00
         = 28 days, 7 hours, 32 minutes

days = Math.floor(28.31...) = 28 ✅
hours = Math.floor(7.53...) = 7
minutes = Math.floor(32.0) = 32
```

**Result:** 28 days remaining (correct!)

---

## 🚀 Summary

✅ **Days auto-decrease** every day
✅ **Real-time updates** every minute
✅ **Hours & minutes** shown when < 24 hours
✅ **Accurate calculation** from backend
✅ **No manual refresh** needed

The countdown is now fully automatic! Just open the profile and watch the days decrease. 🎉
