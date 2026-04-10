import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { createAuthController } from "../controllers/authController.js";
import { createAuthService } from "../services/authService.js";
import * as authUtils from "../utils/authUtils.js";

const router = Router();
const authService = createAuthService({
	prisma,
	authUtils,
});
const authController = createAuthController({ authService });

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", authController.me);
router.post("/logout", authController.logout);

export default router;