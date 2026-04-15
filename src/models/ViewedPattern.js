import mongoose from "mongoose";

const viewedPatternSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    pattern: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pattern",
      required: true,
    },
  },
  { timestamps: true }
);

// Bir user bir pattern ni faqat bir marta ko'radi
viewedPatternSchema.index({ user: 1, pattern: 1 }, { unique: true });

const ViewedPattern = mongoose.model("ViewedPattern", viewedPatternSchema);

export default ViewedPattern;
