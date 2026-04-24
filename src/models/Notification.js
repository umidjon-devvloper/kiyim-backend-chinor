import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["new_pattern", "free_pattern", "paid_pattern", "general", "promotion"],
      required: true,
    },
    patternId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pattern",
      default: null,
    },
    sentTo: {
      type: String,
      enum: ["all", "premium", "free_users"],
      default: "all",
    },
    sentCount: {
      type: Number,
      default: 0,
    },
    successCount: {
      type: Number,
      default: 0,
    },
    failureCount: {
      type: Number,
      default: 0,
    },
    isSent: {
      type: Boolean,
      default: false,
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ type: 1 });
notificationSchema.index({ isSent: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
