import Pattern from "../models/Pattern.js";
import Favorite from "../models/Favorite.js";
import { UserSubscription } from "../models/Subscription.js";
import { deleteFile, deleteFiles } from "../services/uploadthingService.js";
import { successResponse, errorResponse } from "../utils/response.js";

const hasActiveSubscription = async (userId) => {
  const now = new Date();
  const sub = await UserSubscription.findOne({
    user: userId,
    paymeState: 2,
    endDate: { $gt: now },
  });
  return !!sub;
};

export const getPatterns = async (req, res, next) => {
  try {
    const { category, type, size, height, tag, page = 1, limit = 12 } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (type && ["FREE", "SUBSCRIPTION"].includes(type)) filter.type = type;
    if (size) filter.sizes = size;
    if (height) filter.heights = height;
    if (tag) filter.tags = tag;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [patterns, total] = await Promise.all([
      Pattern.find(filter)
        .populate("category", "name slug icon")
        .select("-files")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Pattern.countDocuments(filter),
    ]);

    return successResponse(res, {
      patterns,
      pagination: {
        total, page: parseInt(page), limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) { next(error); }
};

export const getPatternById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pattern = await Pattern.findById(id)
      .populate("category", "name slug icon")
      .populate("author", "name avatar");

    if (!pattern) return errorResponse(res, "Pattern topilmadi", 404);

    // View count oshirish - faqat bir marta (session/viewedPatterns orqali)
    let shouldIncrementView = true;
    if (req.user) {
      // User autentifikatsiya qilgan - user ID orqali tekshiramiz
      const ViewedPattern = (await import("../models/ViewedPattern.js")).default;
      const alreadyViewed = await ViewedPattern.findOne({ 
        user: req.user._id, 
        pattern: id 
      });
      if (!alreadyViewed) {
        await ViewedPattern.create({ user: req.user._id, pattern: id });
      } else {
        shouldIncrementView = false;
      }
    }
    
    if (shouldIncrementView) {
      await Pattern.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });
    }

    let hasSubscription = false;
    let isFavorite = false;

    if (req.user) {
      const [subCheck, favorite] = await Promise.all([
        hasActiveSubscription(req.user._id),
        Favorite.findOne({ user: req.user._id, pattern: id }),
      ]);
      hasSubscription = subCheck;
      isFavorite = !!favorite;

      // Auto-add to favorites if not already favorited
      if (!favorite) {
        await Favorite.create({ user: req.user._id, pattern: id });
        await Pattern.findByIdAndUpdate(id, { $inc: { favoriteCount: 1 } });
        isFavorite = true;
      }
    }

    const patternObj = pattern.toObject();
    patternObj.viewCount += 1; // Yangi qiymatni qaytarish uchun

    // Video URL: obuna bor foydalanuvchilarga ko'rsatiladi
    if (pattern.type === "SUBSCRIPTION" && !hasSubscription) {
      delete patternObj.files;
      delete patternObj.videoUrl;
    }

    return successResponse(res, { ...patternObj, hasSubscription, isFavorite });
  } catch (error) { next(error); }
};

export const createPattern = async (req, res, next) => {
  try {
    const {
      title, description, category, type,
      sizes, heights, tags, previewImage, files, videoUrl,
    } = req.body;

    if (!title || !category || !type) {
      return errorResponse(res, "title, category va type talab etiladi", 400);
    }

    const pattern = await Pattern.create({
      title, description, category, type,
      sizes: sizes || [], heights: heights || [], tags: tags || [],
      previewImage: previewImage || "",
      files: files || [],
      videoUrl: videoUrl || "",
      author: req.user._id,
    });

    const populated = await pattern.populate("category", "name slug icon");
    return successResponse(res, populated, "Pattern yaratildi", 201);
  } catch (error) { next(error); }
};

export const updatePattern = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const pattern = await Pattern.findById(id);
    if (!pattern) return errorResponse(res, "Pattern topilmadi", 404);

    if (updates.previewImage && updates.previewImage !== pattern.previewImage) {
      if (pattern.previewImage) {
        const oldKey = pattern.previewImage.split("/f/")[1];
        if (oldKey) await deleteFile(oldKey);
      }
    }

    if (updates.files && Array.isArray(updates.files)) {
      const newKeys = updates.files.map((f) => f.key);
      const removedFiles = pattern.files.filter((f) => !newKeys.includes(f.key));
      if (removedFiles.length > 0) await deleteFiles(removedFiles.map((f) => f.key));
    }

    const updated = await Pattern.findByIdAndUpdate(id, updates, {
      new: true, runValidators: true,
    }).populate("category", "name slug icon");

    return successResponse(res, updated, "Pattern yangilandi");
  } catch (error) { next(error); }
};

export const deletePattern = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pattern = await Pattern.findById(id);
    if (!pattern) return errorResponse(res, "Pattern topilmadi", 404);

    if (pattern.previewImage) {
      const key = pattern.previewImage.split("/f/")[1];
      if (key) await deleteFile(key);
    }
    if (pattern.files.length > 0) await deleteFiles(pattern.files.map((f) => f.key));

    await Pattern.findByIdAndDelete(id);
    return successResponse(res, null, "Pattern o'chirildi");
  } catch (error) { next(error); }
};

export const downloadPattern = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pattern = await Pattern.findById(id);
    if (!pattern) return errorResponse(res, "Pattern topilmadi", 404);

    // Download count oshirish
    await Pattern.findByIdAndUpdate(id, { $inc: { downloadCount: 1 } });

    if (pattern.type === "FREE") {
      return successResponse(res, { 
        files: pattern.files.map((f) => ({ name: f.name, url: f.url })),
        downloadCount: pattern.downloadCount + 1
      });
    }

    // SUBSCRIPTION pattern — obuna tekshir
    const subOk = await hasActiveSubscription(req.user._id);
    if (!subOk) {
      return errorResponse(res, "Bu patronni yuklab olish uchun obuna kerak", 403);
    }

    return successResponse(res, { 
      files: pattern.files.map((f) => ({ name: f.name, url: f.url })),
      downloadCount: pattern.downloadCount + 1
    });
  } catch (error) { next(error); }
};
