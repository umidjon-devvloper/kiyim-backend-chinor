import { UserSubscription } from "../models/Subscription.js";
import { PaymeError } from "../utils/errors.js";

const STATE = {
  Pending: 1,
  Paid: 2,
  PendingCanceled: -1,
  PaidCanceled: -2,
};
export function buildPaymeUrl(subscriptionId, amountInTiyin) {
  const isTest = process.env.NODE_ENV !== "production";
  const baseUrl = isTest ? "https://checkout.test.paycom.uz" : "https://checkout.paycom.uz";
  const params = { merchant: process.env.PAYME_MERCHANT_ID, amount: amountInTiyin, account: { subscription_id: subscriptionId.toString(), }, };
  return `${baseUrl}/widget/${process.env.PAYME_WALLET_ID}?${new URLSearchParams(params)}`;
}
export const checkPerformTransaction = async ({ id, params }) => {
  const sub = await UserSubscription.findById(
    params.account.subscription_id
  );

  if (!sub) return PaymeError.orderNotFound(id);

  if (sub.amount !== params.amount) {
    return PaymeError.wrongAmount(id);
  }

  return { id, result: { allow: true } };
};

export const createTransaction = async ({ id, params }) => {
  const { id: paymeId, time } = params;

  const sub = await UserSubscription.findById(
    params.account.subscription_id
  );

  if (!sub) return PaymeError.orderNotFound(id);

  sub.paymeTransactionId = paymeId;
  sub.paymeState = STATE.Pending;
  sub.paymeCreateTime = time;

  await sub.save();

  return {
    id,
    result: {
      create_time: time,
      transaction: sub._id.toString(),
      state: STATE.Pending,
    },
  };
};

export const performTransaction = async ({ id, params }) => {
  const sub = await UserSubscription.findOne({
    paymeTransactionId: params.id,
  });

  if (!sub) return PaymeError.transactionNotFound(id);

  sub.paymeState = STATE.Paid;
  sub.isActive = true;
  sub.performTime = new Date();

  await sub.save();

  return {
    id,
    result: {
      perform_time: Date.now(),
      transaction: sub._id.toString(),
      state: STATE.Paid,
    },
  };
};

export const cancelTransaction = async ({ id, params }) => {
  const sub = await UserSubscription.findOne({
    paymeTransactionId: params.id,
  });

  if (!sub) return PaymeError.transactionNotFound(id);

  sub.paymeState = -Math.abs(sub.paymeState);
  sub.isActive = false;
  sub.cancelTime = new Date();

  await sub.save();

  return {
    id,
    result: {
      cancel_time: Date.now(),
      transaction: sub._id.toString(),
      state: sub.paymeState,
    },
  };
};

export const checkTransaction = async ({ id, params }) => {
  const sub = await UserSubscription.findOne({
    paymeTransactionId: params.id,
  });

  if (!sub) return PaymeError.transactionNotFound(id);

  return {
    id,
    result: {
      state: sub.paymeState,
      transaction: sub._id.toString(),
    },
  };
};