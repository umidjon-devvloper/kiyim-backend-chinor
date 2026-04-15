import { Router } from "express";
import {
  getPatterns,
  getPatternById,
  createPattern,
  updatePattern,
  deletePattern,
  downloadPattern,
} from "../controllers/patternController.js";
import { protect } from "../middleware/auth.js";
import { adminOnly } from "../middleware/admin.js";

const router = Router();

// Public + optional auth (isPurchased, isFavorite checks)
router.get("/", getPatterns);
router.get("/:id", (req, res, next) => {
  // Optional auth — tokenli bo'lsa attach qiladi, bo'lmasa ham davom etadi
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return protect(req, res, () => getPatternById(req, res, next));
  }
  return getPatternById(req, res, next);
});

// Auth required
router.get("/:id/download", protect, downloadPattern);

// Admin only
router.post("/", protect, adminOnly, createPattern);
router.put("/:id", protect, adminOnly, updatePattern);
router.delete("/:id", protect, adminOnly, deletePattern);

export default router;
