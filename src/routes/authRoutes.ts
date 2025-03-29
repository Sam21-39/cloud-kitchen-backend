// src/routes/authRoutes.ts

import express from "express";
import { authController } from "../controllers/authController";
import { authenticate, requireAdmin } from "../middleware/authMiddleware";

const router = express.Router();

// Public routes
router.post("/login", authController.login);
router.post("/initialize-admin", authController.initializeAdmin);
router.post("/logout", authenticate, authController.logout);

// Protected routes
router.get("/profile", authenticate, authController.getProfile);
router.post("/register", authenticate, requireAdmin, authController.register);

export default router;
