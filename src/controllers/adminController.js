import User from "../models/User.js";
import Pattern from "../models/Pattern.js";
import Purchase from "../models/Purchase.js";
import { UserSubscription } from "../models/Subscription.js";
import { successResponse, errorResponse } from "../utils/response.js";

export const getStats = async (req, res, next) => {
  try {
    const now = new Date();
    const [
      totalUsers,
      totalPatterns,
      freePatterns,
      subscriptionPatterns,
      activeSubscriptions,
      subStats,
      recentSubscriptions,
    ] = await Promise.all([
      User.countDocuments(),
      Pattern.countDocuments(),
      Pattern.countDocuments({ type: "FREE" }),
      Pattern.countDocuments({ type: "SUBSCRIPTION" }),
      UserSubscription.countDocuments({ paymeState: 2, endDate: { $gt: now } }),
      UserSubscription.aggregate([
        { $match: { paymeState: 2 } },
        {
          $group: {
            _id: null,
            totalSubscriptions: { $sum: 1 },
            totalRevenue: { $sum: "$amount" },
          },
        },
      ]),
      UserSubscription.find({ paymeState: 2 })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("user", "name email avatar")
        .populate("plan"),
    ]);

    const stats = subStats[0] || { totalSubscriptions: 0, totalRevenue: 0 };

    return successResponse(res, {
      totalUsers,
      totalPatterns,
      freePatterns,
      subscriptionPatterns,
      activeSubscriptions,
      totalSubscriptions: stats.totalSubscriptions,
      totalRevenue: stats.totalRevenue,
      recentSubscriptions,
    });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 20, premium } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (role && ["user", "admin"].includes(role)) filter.role = role;
    if (premium !== undefined) filter.isPremium = premium === "true";

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-__v -password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    return successResponse(res, {
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getPurchases = async (req, res, next) => {
  try {
    const { state, from, to, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (state !== undefined) filter.paymeState = parseInt(state);
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const [purchases, total] = await Promise.all([
      Purchase.find(filter)
        .populate("user", "name email avatar")
        .populate("pattern", "title previewImage type price")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Purchase.countDocuments(filter),
    ]);

    return successResponse(res, {
      purchases,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!["user", "admin"].includes(role)) {
      return errorResponse(res, "Role user yoki admin bo'lishi kerak", 400);
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true },
    ).select("-__v");

    if (!user) return errorResponse(res, "Foydalanuvchi topilmadi", 404);

    return successResponse(res, user, "Foydalanuvchi roli yangilandi");
  } catch (error) {
    next(error);
  }
};

export const activateUserAccount = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { purchaseId, subscriptionId, activationType } = req.body;

    if (!activationType || !["purchase", "subscription", "manual"].includes(activationType)) {
      return errorResponse(res, "activationType purchase, subscription yoki manual bo'lishi kerak", 400);
    }

    const user = await User.findById(id);
    if (!user) return errorResponse(res, "Foydalanuvchi topilmadi", 404);

    // Activate user account - set premium status
    user.isPremium = true;
    user.premiumActivatedAt = new Date();
    user.premiumActivatedBy = req.user._id;
    user.activationType = activationType;
    
    if (purchaseId) {
      user.lastPurchaseId = purchaseId;
    }
    
    if (subscriptionId) {
      user.lastSubscriptionId = subscriptionId;
    }

    await user.save();

    // If it's a purchase activation, update the purchase state
    if (purchaseId && activationType === "purchase") {
      await Purchase.findByIdAndUpdate(purchaseId, {
        paymeState: 2,
        performTime: new Date()
      });
    }

    // If it's a subscription activation, update the subscription state
    if (subscriptionId && activationType === "subscription") {
      const Subscription = (await import("../models/Subscription.js")).default;
      await Subscription.findByIdAndUpdate(subscriptionId, {
        paymeState: 2,
        isActive: true
      });
    }

    return successResponse(res, user, "Foydalanuvchi accounti aktivlashtirildi");
  } catch (error) {
    next(error);
  }
};

export const deactivateUserAccount = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) return errorResponse(res, "Foydalanuvchi topilmadi", 404);

    user.isPremium = false;
    user.premiumActivatedAt = null;
    user.premiumActivatedBy = null;
    user.activationType = null;

    await user.save();

    return successResponse(res, user, "Foydalanuvchi accounti deaktivlashtirildi");
  } catch (error) {
    next(error);
  }
};

export const getPendingActivations = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { paymeState: 1 };
    
    if (type === "subscription") {
      const Subscription = (await import("../models/Subscription.js")).default;
      const pendingSubscriptions = await Subscription.find({ paymeState: 1 })
        .populate("user", "name email avatar")
        .populate("plan", "name price duration")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const totalSubscriptions = await Subscription.countDocuments({ paymeState: 1 });

      return successResponse(res, {
        activations: pendingSubscriptions.map(sub => ({
          _id: sub._id,
          type: "subscription",
          user: sub.user,
          plan: sub.plan,
          amount: sub.amount,
          paymeTransactionId: sub.paymeTransactionId,
          createdAt: sub.createdAt
        })),
        pagination: {
          total: totalSubscriptions,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(totalSubscriptions / parseInt(limit)),
        },
      });
    }

    const [purchases, totalPurchases] = await Promise.all([
      Purchase.find(filter)
        .populate("user", "name email avatar")
        .populate("pattern", "title previewImage type price")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Purchase.countDocuments(filter),
    ]);

    const activations = purchases.map(purchase => ({
      _id: purchase._id,
      type: "purchase",
      user: purchase.user,
      pattern: purchase.pattern,
      amount: purchase.amount,
      paymeTransactionId: purchase.paymeTransactionId,
      createdAt: purchase.createdAt
    }));

    return successResponse(res, {
      activations,
      pagination: {
        total: totalPurchases,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalPurchases / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};
