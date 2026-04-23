import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    // Payme tranzaksiya ID si
    paymeId: { type: String, required: true, unique: true },
    
    // Obuna ID si
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserSubscription",
      required: true,
    },
    
    // Foydalanuvchi ID si
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    
    // Summa (tiyinda)
    amount: { type: Number, required: true },
    
    // Tranzaksiya holati (Payme spec)
    // 1 = Pending, 2 = Paid, -1 = PendingCanceled, -2 = PaidCanceled
    state: { type: Number, default: 1 },
    
    // Vaqt maydonlari (Payme spec - millisekundlarda)
    createTime: { type: Number, required: true },
    performTime: { type: Number, default: null },
    cancelTime: { type: Number, default: null },
    
    // Bekor qilish sababi
    reason: { type: Number, default: null },
  },
  { timestamps: true }
);

transactionSchema.index({ subscription: 1 });
transactionSchema.index({ user: 1 });
transactionSchema.index({ state: 1 });

export const Transaction = mongoose.model("Transaction", transactionSchema);
