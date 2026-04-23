import mongoose from "mongoose";

// Obuna rejalari — admin tomonidan sozlanadi
const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // "1 oylik", "3 oylik"
    duration: { type: Number, required: true }, // kunlarda: 30, 90, 365
    price: { type: Number, required: true }, // tiyinda (so'm * 100)
    isActive: { type: Boolean, default: true },
    description: { type: String, default: "" },
  },
  { timestamps: true },
);

// Foydalanuvchi obunasi
const userSubscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: false },
    amount: { type: Number, required: true }, // tiyinda

    // ─── Payme maydonlari (docs bilan bir xil) ───────────────
    paymeTransactionId: { type: String, unique: true, sparse: true },

    // Docs: state 1=Pending, 2=Paid, -1=PendingCanceled, -2=PaidCanceled
    paymeState: {
      type: Number,
      enum: [1, 2, -1, -2],
      default: 1,
    },

    // Docs: create_time number (timestamp ms) saqlanadi
    paymeCreateTime: { type: Number, default: null },

    performTime: { type: Date, default: null },
    cancelTime: { type: Date, default: null },
    reason: { type: Number, default: null },
  },
  { timestamps: true },
);

userSubscriptionSchema.index({ user: 1, isActive: 1 });
userSubscriptionSchema.index({ endDate: 1 });
userSubscriptionSchema.index({ paymeTransactionId: 1 });
userSubscriptionSchema.index({ paymeCreateTime: 1 }); // GetStatement uchun

export const SubscriptionPlan = mongoose.model(
  "SubscriptionPlan",
  subscriptionPlanSchema,
);
export const UserSubscription = mongoose.model(
  "UserSubscription",
  userSubscriptionSchema,
);
