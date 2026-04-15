import Category from "../models/Category.js";
import { successResponse, errorResponse } from "../utils/response.js";

export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    return successResponse(res, categories, "Kategoriyalar ro'yxati");
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { name, slug, icon } = req.body;

    if (!name || !slug) {
      return errorResponse(res, "name va slug talab etiladi", 400);
    }

    const existing = await Category.findOne({ slug });
    if (existing) {
      return errorResponse(res, "Bu slug allaqachon mavjud", 409);
    }

    const category = await Category.create({ name, slug, icon });
    return successResponse(res, category, "Kategoriya yaratildi", 201);
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, slug, icon } = req.body;

    if (slug) {
      const existing = await Category.findOne({ slug, _id: { $ne: id } });
      if (existing) {
        return errorResponse(res, "Bu slug allaqachon mavjud", 409);
      }
    }

    const category = await Category.findByIdAndUpdate(
      id,
      { name, slug, icon },
      { new: true, runValidators: true }
    );

    if (!category) return errorResponse(res, "Kategoriya topilmadi", 404);

    return successResponse(res, category, "Kategoriya yangilandi");
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await Category.findByIdAndDelete(id);
    if (!category) return errorResponse(res, "Kategoriya topilmadi", 404);
    return successResponse(res, null, "Kategoriya o'chirildi");
  } catch (error) {
    next(error);
  }
};
