import { SubscriptionPlan, UserSubscription } from "../models/Subscription.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { buildPaymeUrl } from "../services/paymeService.js";



// ─── PLANS ────────────────────────────────────────────────────

export const getPlans = async (req, res, next) => {
  try {
    const plans = await SubscriptionPlan.find({ isActive: true }).sort({ price: 1 });
    return successResponse(res, plans);
  } catch (error) { next(error); }
};

export const getAllPlans = async (req, res, next) => {
  try {
    const plans = await SubscriptionPlan.find().sort({ price: 1 });
    return successResponse(res, plans);
  } catch (error) { next(error); }
};

export const createPlan = async (req, res, next) => {
  try {
    const { name, duration, price, description } = req.body;
    if (!name || !duration || !price) {
      return errorResponse(res, "name, duration va price talab etiladi", 400);
    }
    const plan = await SubscriptionPlan.create({ name, duration, price, description });
    return successResponse(res, plan, "Reja yaratildi", 201);
  } catch (error) { next(error); }
};

export const updatePlan = async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!plan) return errorResponse(res, "Reja topilmadi", 404);
    return successResponse(res, plan, "Reja yangilandi");
  } catch (error) { next(error); }
};

export const deletePlan = async (req, res, next) => {
  try {
    await SubscriptionPlan.findByIdAndDelete(req.params.id);
    return successResponse(res, null, "Reja o'chirildi");
  } catch (error) { next(error); }
};

// ─── USER SUBSCRIPTION ────────────────────────────────────────

export const getMySubscription = async (req, res, next) => {
  try {
    const now = new Date();
    
    // Avval aktiv obunani qidiramiz (to'langan)
    const activeSub = await UserSubscription.findOne({
      user: req.user._id,
      paymeState: 2,
      endDate: { $gt: now },
    })
      .populate("plan")
      .sort({ endDate: -1 });

    // Agar aktiv obuna bo'lsa, uni qaytaramiz
    if (activeSub) {
      return successResponse(res, {
        hasSubscription: true,
        subscription: activeSub,
        daysLeft: Math.ceil((new Date(activeSub.endDate) - now) / (1000 * 60 * 60 * 24)),
        pendingSubscription: null,
      });
    }

    // Aktiv obuna yo'q bo'lsa, pending (kutilayotgan) obunani qidiramiz
    const pendingSub = await UserSubscription.findOne({
      user: req.user._id,
      paymeState: 1,
      isActive: false,
    })
      .populate("plan")
      .sort({ createdAt: -1 });

    return successResponse(res, {
      hasSubscription: false,
      subscription: null,
      daysLeft: 0,
      pendingSubscription: pendingSub ? {
        _id: pendingSub._id,
        plan: pendingSub.plan,
        amount: pendingSub.amount,
        createdAt: pendingSub.createdAt,
      } : null,
    });
  } catch (error) { next(error); }
};

export const createSubscriptionOrder = async (req, res, next) => {
  try {
    const { planId } = req.body;
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan || !plan.isActive) {
      return errorResponse(res, "Reja topilmadi", 404);
    }

    // Eski pending (hali to'lanmagan) orderlarni o'chirish
    await UserSubscription.deleteMany({
      user: req.user._id,
      plan: plan._id,
      paymeState: 1,
      paymeTransactionId: { $exists: false },
    });

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.duration);

    const subscription = await UserSubscription.create({
      user:      req.user._id,
      plan:      plan._id,
      amount:    plan.price,   // tiyinda saqlash
      startDate,
      endDate,
      paymeState: 1,
      isActive:   false,
    });

    // Payme checkout URL (test yoki prod)
    const paymeUrl = buildPaymeUrl(subscription._id, plan.price);

    return successResponse(
      res,
      {
        subscriptionId: subscription._id,
        planName:       plan.name,
        amount:         plan.price,   // tiyinda
        duration:       plan.duration,
        paymeUrl,                     // ← WebView ga beriladigan URL
      },
      "Obuna buyurtmasi yaratildi",
      201
    );
  } catch (error) { next(error); }
};

export const getSubscriptionHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [subs, total] = await Promise.all([
      UserSubscription.find({ user: req.user._id })
        .populate("plan")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      UserSubscription.countDocuments({ user: req.user._id }),
    ]);

    return successResponse(res, {
      subscriptions: subs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) { next(error); }
};

// Admin: barcha obunalar
export const getAllSubscriptions = async (req, res, next) => {
  try {
    const { state, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const filter = {};
    if (state !== undefined) filter.paymeState = parseInt(state);

    const [subs, total] = await Promise.all([
      UserSubscription.find(filter)
        .populate("user", "name email avatar")
        .populate("plan")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      UserSubscription.countDocuments(filter),
    ]);

    return successResponse(res, {
      subscriptions: subs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) { next(error); }
};

// Utility: foydalanuvchining aktiv obunasi bormi
export const checkSubscription = async (userId) => {
  const now = new Date();
  const sub = await UserSubscription.findOne({
    user: userId,
    paymeState: 2,
    endDate: { $gt: now },
  });
  return !!sub;
};

// Pending obuna uchun to'lovni davom ettirish
export const continuePendingPayment = async (req, res, next) => {
  try {
    const { subscriptionId } = req.body;
    
    if (!subscriptionId) {
      return errorResponse(res, "subscriptionId talab etiladi", 400);
    }

    // Pending obunani topamiz
    const subscription = await UserSubscription.findOne({
      _id: subscriptionId,
      user: req.user._id,
      paymeState: 1,
      isActive: false,
    }).populate("plan");

    if (!subscription) {
      return errorResponse(res, "Pending obuna topilmadi", 404);
    }

    // Payme checkout URL (test yoki prod)
    const paymeUrl = buildPaymeUrl(subscription._id, subscription.amount);

    return successResponse(
      res,
      {
        subscriptionId: subscription._id,
        planName: subscription.plan.name,
        amount: subscription.amount,
        duration: subscription.plan.duration,
        paymeUrl,
      },
      "To'lov davom ettirildi"
    );
  } catch (error) { next(error); }
};
