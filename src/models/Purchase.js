import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    pattern: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pattern",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymeTransactionId: {
      type: String,
      unique: true,
      sparse: true,
    },
    paymeState: {
      type: Number,
      enum: [1, 2, -1, -2],
      default: 1,
    },
    performTime: {
      type: Date,
      default: null,
    },
    cancelTime: {
      type: Date,
      default: null,
    },
    reason: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true }
);

purchaseSchema.index({ user: 1, pattern: 1 });
purchaseSchema.index({ paymeTransactionId: 1 });
purchaseSchema.index({ paymeState: 1 });

const Purchase = mongoose.model("Purchase", purchaseSchema);
export default Purchase;
