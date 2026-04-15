// src/models/Pattern.js — images array qo'shildi
import mongoose from "mongoose";

const patternSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },

    // Birinchi rasm — muqova (eski field, backwards compat uchun)
    previewImage: { type: String, default: "" },

    // 4 tagacha rasm gallery
    images: [{ type: String }],

    videoUrl: { type: String, default: "" },

    files: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        key: { type: String, required: true },
      },
    ],
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["FREE", "SUBSCRIPTION"],
      required: true,
    },
    sizes: [{ type: String }],
    heights: [{ type: String }],
    tags: [{ type: String }],
    viewCount: { type: Number, default: 0 },
    downloadCount: { type: Number, default: 0 },
    favoriteCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

patternSchema.index({ category: 1 });
patternSchema.index({ type: 1 });
patternSchema.index({ tags: 1 });
patternSchema.index({ viewCount: -1 });

const Pattern = mongoose.model("Pattern", patternSchema);
export default Pattern;
