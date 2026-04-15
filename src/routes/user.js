import { Router } from "express";
import {
  getProfile,
  updateProfile,
  getMySubscription,
  getSubscriptionHistory,
  getFavorites,
  addFavorite,
  removeFavorite,
} from "../controllers/userController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.use(protect);

router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.get("/subscription", getMySubscription);
router.get("/subscription/history", getSubscriptionHistory);
router.get("/favorites", getFavorites);
router.post("/favorites/:patternId", addFavorite);
router.delete("/favorites/:patternId", removeFavorite);

export default router;
