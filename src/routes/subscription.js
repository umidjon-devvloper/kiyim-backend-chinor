import { Router } from "express";
import {
  getPlans, getAllPlans, createPlan, updatePlan, deletePlan,
  getMySubscription, createSubscriptionOrder, continuePendingPayment,
  getSubscriptionHistory, getAllSubscriptions,
} from "../controllers/subscriptionController.js";
import { protect } from "../middleware/auth.js";
import { adminOnly } from "../middleware/admin.js";

const router = Router();

// Public: obuna rejalari
router.get("/plans", getPlans);

// Auth: foydalanuvchi obunasi
router.get("/my", protect, getMySubscription);
router.post("/order", protect, createSubscriptionOrder);
router.post("/continue-payment", protect, continuePendingPayment);
router.get("/history", protect, getSubscriptionHistory);

// Admin
router.get("/admin/plans", protect, adminOnly, getAllPlans);
router.post("/admin/plans", protect, adminOnly, createPlan);
router.put("/admin/plans/:id", protect, adminOnly, updatePlan);
router.delete("/admin/plans/:id", protect, adminOnly, deletePlan);
router.get("/admin/all", protect, adminOnly, getAllSubscriptions);

export default router;
