import { UserSubscription } from "../models/Subscription.js";
import { TransactionState } from "../enum/transaction.enum.js";
import { PaymeError } from "../utils/errors.js";

// TransactionState dan foydalanamiz
const STATE = TransactionState;
export function buildPaymeUrl(subscriptionId, amountInTiyin) {
  const isTest = process.env.NODE_ENV !== "production";
  const baseUrl = isTest ? "https://checkout.test.paycom.uz" : "https://checkout.paycom.uz";
  
  // Payme rekvizitlari
  const merchantId = process.env.PAYME_MERCHANT_ID;
  
  if (!merchantId) {
    throw new Error("PAYME_MERCHANT_ID environment variable is not set");
  }
  
  // Payme checkout URL formati
  // https://checkout.paycom.uz/{merchant_id}?{params}
  const params = new URLSearchParams();
  params.append('merchant', merchantId);
  params.append('amount', amountInTiyin.toString());
  params.append('account[subscription_id]', subscriptionId.toString());
  
  return `${baseUrl}/${merchantId}?${params.toString()}`;
}
export const checkPerformTransaction = async ({ id, params }) => {
  const sub = await UserSubscription.findById(
    params.account.subscription_id
  );

  if (!sub) return PaymeError.orderNotFound(id);

  if (sub.amount !== params.amount) {
    return PaymeError.wrongAmount(id);
  }

  // Payme spec: result = { allow: boolean }
  return { 
    id, 
    result: { 
      allow: true 
    } 
  };
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