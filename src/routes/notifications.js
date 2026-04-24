import { Router } from "express";
import {
  sendNotification,
  getNotifications,
} from "../controllers/notificationController.js";
import { protect } from "../middleware/auth.js";
import { adminOnly } from "../middleware/admin.js";

const router = Router();

// Admin only routes
router.use(protect, adminOnly);

router.post("/send", sendNotification);
router.get("/", getNotifications);

export default router;
