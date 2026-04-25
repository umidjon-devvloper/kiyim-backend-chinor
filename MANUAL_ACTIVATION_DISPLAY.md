# Manual Activation Display Feature

## Overview
When admin manually activates a user's premium (e.g., cash payment), the mobile app now shows that the activation was done manually.

## How It Works

### Admin Panel Flow:
1. Admin goes to **Payment Activations** page
2. Finds user (e.g., umid@gmail.com)
3. Selects duration (30/90/365 days)
4. Clicks "Premium" button
5. User gets `activationType: "manual"` in database

### Mobile App Display:

#### 1. **Role Badge** (Top of Profile)
Shows different labels based on activation type:

| Activation Type | Badge Label | Color | Background |
|----------------|-------------|-------|------------|
| `manual` | ✦ Qo'lda aktiv | 🟠 Orange (#F97316) | Light Orange |
| `subscription` | ✦ Obuna | 🟣 Purple (#8B5CF6) | Light Purple |
| `purchase` | ✦ Sotib olingan | 🔵 Blue (#3B82F6) | Light Blue |
| Default | ✦ Premium | 🟤 Gold (#C4956A) | Light Gold |

#### 2. **Info Card** (Below Subscription Card)
When activation type is "manual", shows special info card:

```
┌────────────────────────────────────┐
│ 🖐️  Qo'lda aktivlashtirilgan      │
│     Admin tomonidan naqd to'lov   │
│     orqali                         │
└────────────────────────────────────┘
```

**Styling:**
- Orange theme (#F97316)
- Hand icon
- Rounded card with border
- Clear description

## Code Changes

### Backend Changes

**File: `src/controllers/userController.js`**
```javascript
// Added activationType to response
let activationType = null;

if (activeSub) {
  // ...
  activationType = "subscription"; // Payme orqali sotib olingan
} else if (isPremium) {
  // ...
  activationType = req.user.activationType || "manual";
}

return successResponse(res, {
  // ...
  activationType,
});
```

**File: `src/controllers/subscriptionController.js`**
- Added `activationType: "subscription"` for Payme purchases
- Added `activationType: null` when no subscription

### Frontend Changes

**File: `mobile/lib/api/types.ts`**
```typescript
export interface MySubscription {
  // ...
  activationType: "purchase" | "subscription" | "manual" | null;
}
```

**File: `mobile/app/(tabs)/profile.tsx`**

1. **Added activation type logic:**
```typescript
const getActivationLabel = () => {
  switch (sub?.activationType) {
    case "manual":
      return { label: "Qo'lda aktiv", color: "#F97316", bg: "#FFF7ED" };
    case "purchase":
      return { label: "Sotib olingan", color: "#3B82F6", bg: "#EFF6FF" };
    case "subscription":
      return { label: "Obuna", color: "#8B5CF6", bg: "#F5F3FF" };
    default:
      return { label: "Premium", color: "#C4956A", bg: "#FDF3E7" };
  }
};
```

2. **Updated role badge:**
```typescript
{isAdmin
  ? "Administrator"
  : activationBadge
    ? `✦ ${activationBadge.label}`
    : "Foydalanuvchi"}
```

3. **Added manual activation info card:**
```typescript
{hasActiveSub && sub?.activationType === "manual" && (
  <RNView style={styles.activationInfoCard}>
    <Ionicons name="hand-left" size={20} color="#F97316" />
    <Text>Qo'lda aktivlashtirilgan</Text>
    <Text>Admin tomonidan naqd to'lov orqali</Text>
  </RNView>
)}
```

## Database Fields

**User Model (`src/models/User.js`):**
```javascript
activationType: {
  type: String,
  enum: ["purchase", "subscription", "manual", null],
  default: null,
}
```

**Admin Controller (`src/controllers/adminController.js`):**
- Already handles manual activation correctly
- Sets `activationType: "manual"` when admin activates

## Visual Examples

### Scenario 1: Admin Manual Activation
User paid cash → Admin activated manually

**Profile shows:**
```
┌─────────────────────────────┐
│ [Avatar] User Name    [🔄] │
│          user@email.com     │
│          ✦ Qo'lda aktiv     │ ← Orange badge
└─────────────────────────────┘

[Subscription Card]

┌─────────────────────────────┐
│ 🖐️  Qo'lda aktivlashtirilgan│
│     Admin tomonidan naqd    │
│     to'lov orqali           │
└─────────────────────────────┘
```

### Scenario 2: Payme Subscription
User paid online via Payme

**Profile shows:**
```
┌─────────────────────────────┐
│ [Avatar] User Name    [🔄] │
│          user@email.com     │
│          ✦ Obuna            │ ← Purple badge
└─────────────────────────────┘

[Subscription Card]
```

### Scenario 3: No Subscription
Regular user

**Profile shows:**
```
┌─────────────────────────────┐
│ [Avatar] User Name    [🔄] │
│          user@email.com     │
│          Foydalanuvchi      │ ← Gray badge
└─────────────────────────────┘
```

## Testing

To test the feature:

1. **Manual Activation:**
   - Go to Admin Panel → Payment Activations
   - Find a user
   - Click "Premium" button
   - Check mobile app → Should show "Qo'lda aktiv"

2. **Payme Subscription:**
   - Buy subscription via Payme in app
   - Check mobile app → Should show "Obuna"

3. **Badge Colors:**
   - Manual: Orange 🟠
   - Subscription: Purple 🟣
   - Purchase: Blue 🔵
   - Default: Gold 🟤

## Files Modified

1. ✅ `src/controllers/userController.js` - Added activationType to response
2. ✅ `src/controllers/subscriptionController.js` - Added activationType
3. ✅ `mobile/lib/api/types.ts` - TypeScript type definition
4. ✅ `mobile/app/(tabs)/profile.tsx` - UI implementation

## Benefits

✅ Users know how their premium was activated
✅ Clear distinction between manual and automatic activation
✅ Professional UI with color-coded badges
✅ Transparent about payment method
✅ Builds trust with users
