import mongoose from "mongoose";
import { UserSubscription } from "../models/Subscription.js";
import { Transaction } from "../models/Transaction.js";
import { TransactionState, PaymeError } from "../enum/transaction.enum.js";

// TransactionState dan foydalanamiz
const STATE = TransactionState;
export function buildPaymeUrl(subscriptionId, amountInTiyin) {
  const merchantId = process.env.PAYME_MERCHANT_ID;

  const params = {
    m: merchantId,
    ac: { subscription_id: subscriptionId.toString() },
    a: amountInTiyin, // 1000000 — tiyin ✅
  };

  const encoded = Buffer.from(JSON.stringify(params)).toString("base64");
  return `https://checkout.paycom.uz/${encoded}`;
}

export const checkPerformTransaction = async ({ id, params }) => {
  // subscription_id valid ObjectId emasmi?
  console.log("Checking PerformTransaction with params:", params);
  if (!mongoose.Types.ObjectId.isValid(params.account.subscription_id)) {
    return { error: PaymeError.ProductNotFound, id };
  }

  const sub = await UserSubscription.findById(params.account.subscription_id);
  console.log("Found subscription:", sub);
  if (!sub) return { error: PaymeError.ProductNotFound, id };

  const paymeAmount = Number(params.amount);

  if (sub.amount !== paymeAmount) {
    return { error: PaymeError.InvalidAmount, id };
  }

  // Agar obuna boshqa pending tranzaksiya bilan bo'lsa
  const pendingTransaction = await Transaction.findOne({
    subscription: sub._id,
    state: STATE.Pending,
  });
  if (pendingTransaction) {
    return { error: PaymeError.ProductNotFound, id };
  }

  // Agar obuna allaqachon to'langan bo'lsa
  if (sub.paymeState === STATE.Paid) {
    return { error: PaymeError.AlreadyDone, id };
  }

  // Payme spec: result = { allow: boolean }
  return {
    id,
    result: {
      allow: true,
    },
  };
};

export const createTransaction = async ({ id, params }) => {
  const { id: paymeId, time } = params;

  // subscription_id valid ObjectId emasmi?
  if (!mongoose.Types.ObjectId.isValid(params.account.subscription_id)) {
    return { error: PaymeError.ProductNotFound, id };
  }

  const sub = await UserSubscription.findById(params.account.subscription_id);

  if (!sub) return { error: PaymeError.ProductNotFound, id };

  // Summa tekshiruvi
  const paymeAmount = Number(params.amount);
  if (sub.amount !== paymeAmount) {
    console.warn(`Amount mismatch: DB=${sub.amount}, Payme=${paymeAmount}`);
    return { error: PaymeError.InvalidAmount, id };
  }

  // Obunani user bilan populate qilish
  await sub.populate("user");

  // Agar shu paymeId bilan allaqachon tranzaksiya yaratilgan bo'lsa
  let transaction = await Transaction.findOne({ paymeId });
  if (transaction) {
    // Agar tranzaksiya timeout bo'lsa, bekor qilish
    const currentTime = Date.now();
    const expirationTime = 720000; // 12 daqiqa
    if (
      transaction.state === STATE.Pending &&
      currentTime - transaction.createTime > expirationTime
    ) {
      transaction.state = STATE.PendingCanceled;
      transaction.cancelTime = currentTime;
      transaction.reason = 4; // Timeout
      await transaction.save();
      return { error: PaymeError.CantDoOperation, id };
    }
    return {
      id,
      result: {
        create_time: transaction.createTime,
        transaction: transaction.paymeId,
        state: transaction.state,
      },
    };
  }

  // Agar obuna boshqa pending tranzaksiya bilan bo'lsa
  const pendingTransaction = await Transaction.findOne({
    subscription: sub._id,
    state: STATE.Pending,
  });
  if (pendingTransaction) {
    return { error: PaymeError.Pending, id };
  }

  // Yangi tranzaksiya yaratish
  transaction = await Transaction.create({
    paymeId,
    subscription: sub._id,
    user: sub.user._id,
    amount: params.amount,
    state: STATE.Pending,
    createTime: time,
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

export const performTransaction = async ({ id, params }) => {
  const transaction = await Transaction.findOne({ paymeId: params.id });

  if (!transaction) return { error: PaymeError.TransactionNotFound, id };

  // Agar allaqachon to'langan bo'lsa
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

  // 12 daqiqa timeout tekshiruvi (720000 ms)
  const currentTime = Date.now();
  const expirationTime = 720000; // 12 daqiqa
  if (currentTime - transaction.createTime > expirationTime) {
    // Timeout - tranzaksiyani bekor qilish
    transaction.state = STATE.PendingCanceled;
    transaction.cancelTime = currentTime;
    transaction.reason = 4; // Timeout
    await transaction.save();
    return { error: PaymeError.CantDoOperation, id };
  }

  const performTime = currentTime;
  transaction.state = STATE.Paid;
  transaction.performTime = performTime;
  await transaction.save();

  // Obunani ham faollashtirish
  const subscription = await UserSubscription.findById(
    transaction.subscription,
  );
  if (subscription) {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(
      endDate.getDate() + (subscription.plan?.durationDays || 30),
    );

    subscription.isActive = true;
    subscription.startDate = startDate;
    subscription.endDate = endDate;
    await subscription.save();
  }

  return {
    id,
    result: {
      perform_time: performTime,
      transaction: transaction.paymeId,
      state: transaction.state,
    },
  };
};

export const cancelTransaction = async ({ id, params }) => {
  const transaction = await Transaction.findOne({ paymeId: params.id });

  if (!transaction) return { error: PaymeError.TransactionNotFound, id };

  // Agar allaqachon bekor qilingan bo'lsa, o'zgartirmasdan qaytarish
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

  const cancelTime = Date.now();
  transaction.state = -Math.abs(transaction.state);
  transaction.cancelTime = cancelTime;
  transaction.reason = params.reason;
  await transaction.save();

  return {
    id,
    result: {
      cancel_time: cancelTime,
      transaction: transaction.paymeId,
      state: transaction.state,
    },
  };
};

export const checkTransaction = async ({ id, params }) => {
  // Transaction modelidan qidirish
  const transaction = await Transaction.findOne({
    paymeId: params.id,
  });

  if (!transaction) return { error: PaymeError.TransactionNotFound, id };

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

export const getStatement = async ({ id, params }) => {
  const { from, to } = params;

  // Vaqt oraliigidagi tranzaksiyalarni olish
  const transactions = await Transaction.find({
    createTime: { $gte: from, $lte: to },
  });

  // Payme spec formatida qaytarish
  const result = transactions.map((t) => ({
    id: t.paymeId,
    time: t.createTime,
    amount: t.amount,
    account: {
      subscription_id: t.subscription.toString(),
    },
    create_time: t.createTime,
    perform_time: t.performTime || 0,
    cancel_time: t.cancelTime || 0,
    transaction: t.paymeId,
    state: t.state,
    reason: t.reason,
  }));

  return {
    id,
    result: {
      transactions: result,
    },
  };
};
