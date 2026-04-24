import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      sparse: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    
    // Premium account fields
    isPremium: {
      type: Boolean,
      default: false,
    },
    premiumActivatedAt: {
      type: Date,
      default: null,
    },
    premiumExpiresAt: {
      type: Date,
      default: null,
    },
    premiumDuration: {
      type: Number, // days: 30, 90, 365
      default: null,
    },
    premiumActivatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    activationType: {
      type: String,
      enum: ["purchase", "subscription", "manual", null],
      default: null,
    },
    lastPurchaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Purchase",
      default: null,
    },
    lastSubscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserSubscription",
      default: null,
    },
    
    // FCM Token for push notifications
    fcmToken: {
      type: String,
      default: null,
    },
    notificationsEnabled: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });

const User = mongoose.model("User", userSchema);
export default User;
