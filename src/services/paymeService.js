import mongoose from "mongoose";
import { UserSubscription } from "../models/Subscription.js";
import { Transaction } from "../models/Transaction.js";
import { TransactionState, PaymeError } from "../enum/transaction.enum.js";

const STATE = TransactionState;

// ================================
// 💰 HELPERS (MUHIM)
// ================================

// so'm -> tiyin
export const toTiyin = (amount) => {
  return Math.round(Number(amount || 0) * 100);
};

// tiyin -> so'm (optional)
export const toSom = (amount) => {
  return Math.floor(Number(amount || 0) / 100);
};

// ================================
// 🔗 PAYME URL
// ================================
export function buildPaymeUrl(subscriptionId, amountInSom) {
  const merchantId = process.env.PAYME_MERCHANT_ID;

  if (!merchantId || merchantId.length !== 24) {
    throw new Error("PAYME_MERCHANT_ID noto‘g‘ri");
  }

  const subId =
    typeof subscriptionId === "string"
      ? subscriptionId
      : subscriptionId.toString();

  // 🔥 SO'M -> TIYIN
  const amount = toTiyin(amountInSom);

  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("Amount noto‘g‘ri");
  }

  const params = `m=${merchantId};ac.subscription_id=${subId};a=${amount}`;

  console.log("RAW PARAMS:", params);

  const encoded = Buffer.from(params, "utf-8").toString("base64");

  const url = `https://checkout.paycom.uz/${encoded}`;

  console.log("FINAL URL:", url);

  return url;
}

// ================================
// ✅ CHECK PERFORM
// ================================
export const checkPerformTransaction = async ({ id, params }) => {
  const subId = params.account?.subscription_id;

  if (!mongoose.Types.ObjectId.isValid(subId)) {
    return { error: PaymeError.ProductNotFound, id };
  }

  const sub = await UserSubscription.findById(subId);

  if (!sub) return { error: PaymeError.ProductNotFound, id };

  const paymeAmount = Number(params.amount);

  // 🔥 SO'M -> TIYIN CHECK
  if (toTiyin(sub.amount) !== paymeAmount) {
    return { error: PaymeError.InvalidAmount, id };
  }

  const pending = await Transaction.findOne({
    subscription: sub._id,
    state: STATE.Pending,
  });

  if (pending) {
    return { error: PaymeError.Pending, id };
  }

  if (sub.paymeState === STATE.Paid) {
    return { error: PaymeError.AlreadyDone, id };
  }

  return {
    id,
    result: { allow: true },
  };
};

// ================================
// 💳 CREATE TRANSACTION
// ================================
export const createTransaction = async ({ id, params }) => {
  const subId = params.account?.subscription_id;
  const paymeId = params.id;

  if (!mongoose.Types.ObjectId.isValid(subId)) {
    return { error: PaymeError.ProductNotFound, id };
  }

  const sub = await UserSubscription.findById(subId).populate("user");

  if (!sub) return { error: PaymeError.ProductNotFound, id };

  const paymeAmount = Number(params.amount);

  // 🔥 TIYIN CHECK
  if (toTiyin(sub.amount) !== paymeAmount) {
    return { error: PaymeError.InvalidAmount, id };
  }

  let transaction = await Transaction.findOne({ paymeId });

  if (transaction) {
    return {
      id,
      result: {
        create_time: transaction.createTime,
        transaction: transaction.paymeId,
        state: transaction.state,
      },
    };
  }

  const pending = await Transaction.findOne({
    subscription: sub._id,
    state: STATE.Pending,
  });

  if (pending) {
    return { error: PaymeError.Pending, id };
  }

  transaction = await Transaction.create({
    paymeId,
    subscription: sub._id,
    user: sub.user._id,
    amount: paymeAmount, // 🔥 TIYIN saqlanadi
    state: STATE.Pending,
    createTime: params.time,
  });

  return {
    id,
    result: {
      create_time: transaction.createTime,
      transaction: transaction.paymeId,
      state: transaction.state,
    },
  };
};

// ================================
// ✅ PERFORM TRANSACTION
// ================================
export const performTransaction = async ({ id, params }) => {
  const transaction = await Transaction.findOne({ paymeId: params.id });

  if (!transaction) {
    return { error: PaymeError.TransactionNotFound, id };
  }

  if (transaction.state === STATE.Paid) {
    return {
      id,
      result: {
        perform_time: transaction.performTime,
        transaction: transaction.paymeId,
        state: transaction.state,
      },
    };
  }

  const now = Date.now();

  if (now - transaction.createTime > 720000) {
    transaction.state = STATE.PendingCanceled;
    transaction.cancelTime = now;
    transaction.reason = 4;
    await transaction.save();

    return { error: PaymeError.CantDoOperation, id };
  }

  transaction.state = STATE.Paid;
  transaction.performTime = now;
  await transaction.save();

  const subscription = await UserSubscription.findById(
    transaction.subscription,
  ).populate("plan");

  if (subscription) {
    const start = new Date();
    const end = new Date();

    end.setDate(end.getDate() + (subscription.plan?.durationDays || 30));

    subscription.isActive = true;
    subscription.startDate = start;
    subscription.endDate = end;
    subscription.paymeState = STATE.Paid;

    await subscription.save();
  }

  return {
    id,
    result: {
      perform_time: now,
      transaction: transaction.paymeId,
      state: transaction.state,
    },
  };
};

// ================================
// ❌ CANCEL TRANSACTION
// ================================
export const cancelTransaction = async ({ id, params }) => {
  const transaction = await Transaction.findOne({ paymeId: params.id });

  if (!transaction) {
    return { error: PaymeError.TransactionNotFound, id };
  }

  if (transaction.state < 0) {
    return {
      id,
      result: {
        cancel_time: transaction.cancelTime,
        transaction: transaction.paymeId,
        state: transaction.state,
      },
    };
  }

  const now = Date.now();

  transaction.state = -Math.abs(transaction.state);
  transaction.cancelTime = now;
  transaction.reason = params.reason;

  await transaction.save();

  return {
    id,
    result: {
      cancel_time: now,
      transaction: transaction.paymeId,
      state: transaction.state,
    },
  };
};

// ================================
// 🔍 CHECK TRANSACTION
// ================================
export const checkTransaction = async ({ id, params }) => {
  const transaction = await Transaction.findOne({
    paymeId: params.id,
  });

  if (!transaction) {
    return { error: PaymeError.TransactionNotFound, id };
  }

  return {
    id,
    result: {
      create_time: transaction.createTime,
      perform_time: transaction.performTime || 0,
      cancel_time: transaction.cancelTime || 0,
      transaction: transaction.paymeId,
      state: transaction.state,
      reason: transaction.reason,
    },
  };
};

// ================================
// 📊 STATEMENT
// ================================
export const getStatement = async ({ id, params }) => {
  const transactions = await Transaction.find({
    createTime: {
      $gte: params.from,
      $lte: params.to,
    },
  });

  return {
    id,
    result: {
      transactions: transactions.map((t) => ({
        id: t.paymeId,
        time: t.createTime,
        amount: t.amount, // 🔥 TIYIN
        account: {
          subscription_id: t.subscription.toString(),
        },
        create_time: t.createTime,
        perform_time: t.performTime || 0,
        cancel_time: t.cancelTime || 0,
        transaction: t.paymeId,
        state: t.state,
        reason: t.reason,
      })),
    },
  };
};
