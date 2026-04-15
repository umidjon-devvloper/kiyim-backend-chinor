import User from "../models/User.js";
import { UserSubscription } from "../models/Subscription.js";
import Favorite from "../models/Favorite.js";
import { successResponse, errorResponse } from "../utils/response.js";

export const getProfile = async (req, res, next) => {
  try {
    return successResponse(res, req.user);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, avatar } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (avatar) updates.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select("-__v");

    return successResponse(res, user, "Profil yangilandi");
  } catch (error) {
    next(error);
  }
};

export const getMySubscription = async (req, res, next) => {
  try {
    const now = new Date();
    const active = await UserSubscription.findOne({
      user: req.user._id,
      paymeState: 2,
      endDate: { $gt: now },
    }).populate("plan").sort({ endDate: -1 });

    return successResponse(res, {
      hasSubscription: !!active,
      subscription: active || null,
      daysLeft: active ? Math.ceil((new Date(active.endDate) - now) / (1000 * 60 * 60 * 24)) : 0,
    });
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
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) { next(error); }
};

export const getFavorites = async (req, res, next) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [favorites, total] = await Promise.all([
      Favorite.find({ user: req.user._id })
        .populate({
          path: "pattern",
          select: "title previewImage type price",
          populate: { path: "category", select: "name slug icon" },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Favorite.countDocuments({ user: req.user._id }),
    ]);

    return successResponse(res, {
      favorites,
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

export const addFavorite = async (req, res, next) => {
  try {
    const { patternId } = req.params;

    const existing = await Favorite.findOne({
      user: req.user._id,
      pattern: patternId,
    });

    if (existing) {
      return errorResponse(res, "Allaqachon sevimlilar ro'yxatida", 409);
    }

    const favorite = await Favorite.create({
      user: req.user._id,
      pattern: patternId,
    });

    return successResponse(res, favorite, "Sevimlilarga qo'shildi", 201);
  } catch (error) {
    next(error);
  }
};

export const removeFavorite = async (req, res, next) => {
  try {
    const { patternId } = req.params;

    const favorite = await Favorite.findOneAndDelete({
      user: req.user._id,
      pattern: patternId,
    });

    if (!favorite) {
      return errorResponse(res, "Sevimlilar ro'yxatida topilmadi", 404);
    }

    return successResponse(res, null, "Sevimlilardan o'chirildi");
  } catch (error) {
    next(error);
  }
};
