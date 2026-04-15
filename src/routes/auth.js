import { Router } from "express";
import { emailLogin, emailRegister, googleLogin } from "../controllers/authController.js";

const router = Router();

// POST /api/auth/google
router.post("/google", googleLogin);
router.post("/login", emailLogin);
router.post("/register", emailRegister);

export default router;
