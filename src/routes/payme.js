import { Router } from "express";
import { handlePayme } from "../controllers/paymeController.js";
import { paymeCheckToken } from "../middleware/paymeAuth.js";

const router = Router();

// POST /api/payme — JSON-RPC 2.0
router.post("/", paymeCheckToken, handlePayme);

export default router;
