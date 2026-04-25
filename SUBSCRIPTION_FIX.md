# Subscription Time Calculation Fix

## Issues Fixed

### 1. ✅ Days Calculation Changed from `Math.ceil` to `Math.floor`

**Problem:**
- When you bought a 30-day subscription, it showed 30 days immediately
- Should show 29 days after purchase (since time has passed)

**Solution:**
- Changed from `Math.ceil()` (rounds up) to `Math.floor()` (rounds down)
- Now correctly shows the actual full days remaining

**Example:**
- Purchase: April 23, 2026 at 17:32
- End Date: May 23, 2026 at 17:32
- If checked on April 24 at 10:00 (less than 24 hours later):
  - **Before**: Showed 30 days (wrong - used ceil)
  - **After**: Shows 28 days (correct - uses floor)

### 2. ✅ Added Hours and Minutes Display

**Backend Changes:**
- Added `hoursLeft` and `minutesLeft` to API response
- Precise calculation showing exact time remaining

**Frontend Changes:**
- When days = 0, shows hours and minutes
- Format: "29soat 45daq" (29 hours 45 minutes)
- Dynamic label: Changes from "Kun qoldi" to "Soat qoldi" when < 1 day

### 3. ✅ Added Refresh Button to Profile

**Features:**
- Refresh icon button in top-right corner of profile header
- Re-fetches subscription data from backend
- Shows loading state (opacity 0.5) while refreshing
- Updates days, hours, and minutes remaining

## Code Changes

### Backend (Node.js)

**File: `src/controllers/userController.js`**
```javascript
const timeDiff = new Date(activeSub.endDate) - now;
daysLeft = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
hoursLeft = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
minutesLeft = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
```

**File: `src/controllers/subscriptionController.js`**
- Same calculation applied for consistency

### Frontend (React Native)

**File: `mobile/app/(tabs)/profile.tsx`**
- Added hours/minutes display in stats card
- Added refresh button with loading state
- Dynamic label based on time remaining

**File: `mobile/lib/api/types.ts`**
- Added `hoursLeft: number` and `minutesLeft: number` to MySubscription interface

## Time Display Logic

### When days > 0:
```
┌─────────────┐
│     29      │
│  Kun qoldi  │
└─────────────┘
```

### When days = 0 (less than 24 hours):
```
┌─────────────┐
│      0      │
│ Soat qoldi  │
│  15soat 32daq│
└─────────────┘
```

## Files Modified

1. ✅ `src/controllers/userController.js` - Updated calculation
2. ✅ `src/controllers/subscriptionController.js` - Updated calculation
3. ✅ `mobile/lib/api/types.ts` - Added types
4. ✅ `mobile/app/(tabs)/profile.tsx` - UI updates

## Testing

To test the changes:

1. **Check subscription shows correct days:**
   - Buy a subscription
   - Should show 29 days (not 30) if few hours passed
   
2. **Check hours display:**
   - Wait until less than 24 hours remain
   - Should show hours and minutes

3. **Test refresh button:**
   - Tap refresh icon in profile
   - Stats should update with latest data

## Why Math.floor Instead of Math.ceil?

**Math.ceil (Before - WRONG):**
- 29.1 days → 30 days (rounds up)
- User thinks they have more time than actual

**Math.floor (After - CORRECT):**
- 29.9 days → 29 days (rounds down)
- Shows only complete days remaining
- More accurate and honest

## Database Schema

The `endDate` in database is correct:
```javascript
startDate: 2026-04-23T17:32:37.707+00:00
endDate:   2026-05-23T17:32:37.707+00:00  // Exactly 30 days later
```

The calculation now properly shows how much time is **actually remaining** from now until the endDate.
