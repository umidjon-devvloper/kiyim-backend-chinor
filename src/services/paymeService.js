// Docs loyihasiga to'liq mos keltirildi:
// - amount / 100 (tiyindan so'mga)
// - 12 daqiqalik expiration check (createTransaction va performTransaction)
// - AlreadyDone, Pending tekshiruvlari
// - TransactionState: Pending=1, Paid=2, PendingCanceled=-1, PaidCanceled=-2

import { UserSubscription } from "../models/Subscription.js";
import { PaymeError } from "../utils/errors.js";

// TransactionState (docs bilan bir xil)
const TransactionState = {
  Paid: 2,
  Pending: 1,
  PendingCanceled: -1,
  PaidCanceled: -2,
};

// Payme checkout URL yaratish
export function buildPaymeUrl(subscriptionId, amountInTiyin) {
  const isTest = process.env.NODE_ENV !== "production";
  const baseUrl = isTest
    ? "https://checkout.test.paycom.uz"
    : "https://checkout.paycom.uz";

  const params = {
    merchant: process.env.PAYME_MERCHANT_ID,
    amount: amountInTiyin,
    account: {
      subscription_id: subscriptionId.toString(),
    },
  };  

  const encoded = Buffer.from(JSON.stringify(params)).toString("base64");
  return `${baseUrl}/${encoded}`;
}

// ─── CheckPerformTransaction ───────────────────────────────────
export const checkPerformTransaction = async ({ id, params }) => {
  const { account, amount } = params;

  if (!account?.subscription_id) {
    return PaymeError.orderNotFound(id);
  }

  const sub = await UserSubscription.findById(account.subscription_id).populate(
    "plan",
  );
  if (!sub) return PaymeError.orderNotFound(id);

  // Docs: amount / 100 qilib so'm bilan taqqoslash
  const amountInSom = Math.floor(amount / 100);
  const subAmountInSom = Math.floor(sub.amount / 100);

  if (amountInSom !== subAmountInSom) {
    return PaymeError.wrongAmount(id);
  }

  return { id, result: { allow: true } };
};

// ─── CreateTransaction ─────────────────────────────────────────
export const createTransaction = async ({ id, params }) => {
  const { id: paymeId, time, amount, account } = params;

  // Birinchi checkPerformTransaction chaqiramiz (docs bilan bir xil)
  const checkResult = await checkPerformTransaction({ id, params });
  if (checkResult.error) return checkResult;

  const sub = await UserSubscription.findById(account?.subscription_id);
  if (!sub) return PaymeError.orderNotFound(id);

  // Agar bu paymeId bilan tranzaksiya allaqachon bor
  const existing = await UserSubscription.findOne({
    paymeTransactionId: paymeId,
  });
  if (existing) {
    if (existing.paymeState !== TransactionState.Pending) {
      return PaymeError.cantDoOperation(id);
    }

    // 12 daqiqalik expiration check (docs bilan bir xil)
    const currentTime = Date.now();
    const isNotExpired =
      (currentTime - existing.createdAt.getTime()) / 60000 < 12;
    if (!isNotExpired) {
      existing.paymeState = TransactionState.PendingCanceled;
      existing.reason = 4;
      await existing.save();
      return PaymeError.cantDoOperation(id);
    }

    return {
      id,
      result: {
        create_time: existing.createdAt.getTime(),
        transaction: existing._id.toString(),
        state: TransactionState.Pending,
      },
    };
  }

  // Bu user + subscription uchun oldingi tranzaksiya bormi?
  const prevTx = await UserSubscription.findOne({
    user: sub.user,
    plan: sub.plan,
    paymeTransactionId: { $exists: true, $ne: null },
  });
  if (prevTx) {
    if (prevTx.paymeState === TransactionState.Paid) {
      return PaymeError.alreadyDone(id);
    }
    if (prevTx.paymeState === TransactionState.Pending) {
      return PaymeError.pending(id);
    }
  }

  // Yangi tranzaksiya yaratish
  sub.paymeTransactionId = paymeId;
  sub.paymeState = TransactionState.Pending;
  sub.paymeCreateTime = time;
  await sub.save();

  return {
    id,
    result: {
      create_time: time,
      transaction: sub._id.toString(),
      state: TransactionState.Pending,
    },
  };
};

// ─── PerformTransaction ────────────────────────────────────────
export const performTransaction = async ({ id, params }) => {
  const { id: paymeId } = params;
  const currentTime = Date.now();

  const sub = await UserSubscription.findOne({ paymeTransactionId: paymeId });
  if (!sub) return PaymeError.transactionNotFound(id);

  if (sub.paymeState !== TransactionState.Pending) {
    if (sub.paymeState !== TransactionState.Paid) {
      return PaymeError.cantDoOperation(id);
    }
    // Allaqachon to'langan
    return {
      id,
      result: {
        perform_time: sub.performTime ? sub.performTime.getTime() : currentTime,
        transaction: sub._id.toString(),
        state: TransactionState.Paid,
      },
    };
  }

  // 12 daqiqalik expiration check (docs bilan bir xil)
  const createTime = sub.paymeCreateTime || sub.createdAt.getTime();
  const isNotExpired = (currentTime - createTime) / 60000 < 12;
  if (!isNotExpired) {
    sub.paymeState = TransactionState.PendingCanceled;
    sub.reason = 4;
    sub.cancelTime = new Date(currentTime);
    await sub.save();
    return PaymeError.cantDoOperation(id);
  }

  // To'lov tasdiqlandi - obunani faollashtirish
  sub.paymeState = TransactionState.Paid;
  sub.isActive = true;
  sub.performTime = new Date(currentTime);
  await sub.save();

  return {
    id,
    result: {
      perform_time: currentTime,
      transaction: sub._id.toString(),
      state: TransactionState.Paid,
    },
  };
};

// ─── CancelTransaction ─────────────────────────────────────────
export const cancelTransaction = async ({ id, params }) => {
  const { id: paymeId, reason } = params;

  const sub = await UserSubscription.findOne({ paymeTransactionId: paymeId });
  if (!sub) return PaymeError.transactionNotFound(id);

  const currentTime = Date.now();

  if (sub.paymeState > 0) {
    // Docs: state = -Math.abs(state)
    sub.paymeState = -Math.abs(sub.paymeState);
    sub.isActive = false;
    sub.reason = reason;
    sub.cancelTime = new Date(currentTime);
    await sub.save();
  }

  return {
    id,
    result: {
      cancel_time: sub.cancelTime ? sub.cancelTime.getTime() : currentTime,
      transaction: sub._id.toString(),
      state: sub.paymeState,
    },
  };
};

// ─── CheckTransaction ──────────────────────────────────────────
export const checkTransaction = async ({ id, params }) => {
  const { id: paymeId } = params;

  const sub = await UserSubscription.findOne({ paymeTransactionId: paymeId });
  if (!sub) return PaymeError.transactionNotFound(id);

  const createTime = sub.paymeCreateTime || sub.createdAt.getTime();

  return {
    id,
    result: {
      create_time: createTime,
      perform_time: sub.performTime ? sub.performTime.getTime() : 0,
      cancel_time: sub.cancelTime ? sub.cancelTime.getTime() : 0,
      transaction: sub._id.toString(),
      state: sub.paymeState,
      reason: sub.reason || null,
    },
  };
};

// ─── GetStatement ──────────────────────────────────────────────
export const getStatement = async ({ id, params }) => {
  const { from, to } = params;

  const subs = await UserSubscription.find({
    paymeCreateTime: { $gte: from, $lte: to },
    paymeTransactionId: { $exists: true },
  });

  const transactions = subs.map((s) => ({
    id: s.paymeTransactionId,
    time: s.paymeCreateTime || s.createdAt.getTime(),
    amount: s.amount,
    account: { subscription_id: s._id.toString() },
    create_time: s.paymeCreateTime || s.createdAt.getTime(),
    perform_time: s.performTime ? s.performTime.getTime() : 0,
    cancel_time: s.cancelTime ? s.cancelTime.getTime() : 0,
    transaction: s._id.toString(),
    state: s.paymeState,
    reason: s.reason || null,
  }));

  return { id, result: { transactions } };
};
