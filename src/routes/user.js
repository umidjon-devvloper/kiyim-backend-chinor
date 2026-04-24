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
import {
  updateFCMTokenController,
  toggleNotificationsController,
  getNotificationPreferences,
} from "../controllers/notificationController.js";
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

// Notification routes
router.put("/fcm-token", updateFCMTokenController);
router.put("/notifications/toggle", toggleNotificationsController);
router.get("/notifications/preferences", getNotificationPreferences);

export default router;
