import { Router } from "express";
import {
  getStats,
  getUsers,
  getPurchases,
  updateUserRole,
} from "../controllers/adminController.js";
import { protect } from "../middleware/auth.js";
import { adminOnly } from "../middleware/admin.js";

const router = Router();

router.use(protect, adminOnly);

router.get("/stats", getStats);
router.get("/users", getUsers);
router.put("/users/:id/role", updateUserRole);
router.get("/purchases", getPurchases);

export default router;
