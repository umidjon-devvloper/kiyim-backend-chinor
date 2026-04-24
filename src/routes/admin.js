import { Router } from "express";
import {
  getStats,
  getUsers,
  getPurchases,
  updateUserRole,
  activateUserAccount,
  deactivateUserAccount,
  getPendingActivations,
} from "../controllers/adminController.js";
import { protect } from "../middleware/auth.js";
import { adminOnly } from "../middleware/admin.js";

const router = Router();

router.use(protect, adminOnly);

router.get("/stats", getStats);
router.get("/users", getUsers);
router.put("/users/:id/role", updateUserRole);
router.get("/purchases", getPurchases);
router.get("/activations/pending", getPendingActivations);
router.put("/users/:id/activate", activateUserAccount);
router.put("/users/:id/deactivate", deactivateUserAccount);

export default router;
