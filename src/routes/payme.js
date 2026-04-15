import { Router } from "express";
import { handlePayme } from "../controllers/paymeController.js";
import { paymeAuth } from "../middleware/paymeAuth.js";

const router = Router();

// POST /api/payme — JSON-RPC 2.0
router.post("/", paymeAuth, handlePayme);

export default router;
