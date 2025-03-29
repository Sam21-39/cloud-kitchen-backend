// src/controllers/authController.ts

import { Request, Response } from "express";
import { authService, UserCredentials } from "../services/authService";
import { ResponseHandler } from "../utils/responseHandler";
import { asyncHandler } from "../utils/errorHandler";
import {
  AuthenticationError,
  AuthorizationError,
  ValidationError,
} from "../utils/errorHandler";

export const authController = {
  // Register a new user
  register: asyncHandler(async (req: Request, res: Response) => {
    const { email, password, firstName, lastName, role } = req.body;

    // Validate request
    if (!email || !password) {
      throw new ValidationError("Email and password are required");
    }

    // Check if user is authorized to set role
    if (role === "admin") {
      // Only admin can create another admin
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        throw new AuthenticationError("Authentication required");
      }

      try {
        const currentUser = await authService.verifySession(token);
        if (currentUser.role !== "admin") {
          throw new AuthorizationError("Only admins can create admin accounts");
        }
      } catch (error) {
        throw new AuthenticationError("Invalid token");
      }
    }

    const userData: UserCredentials & {
      firstName?: string;
      lastName?: string;
      role?: "admin" | "staff";
    } = {
      email,
      password,
      firstName,
      lastName,
      role: role as "admin" | "staff",
    };

    const user = await authService.register(userData);
    return ResponseHandler.created(res, user, "User registered successfully");
  }),

  // Login user
  login: asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ValidationError("Email and password are required");
    }

    const result = await authService.login({ email, password });
    return ResponseHandler.success(res, result, "Login successful");
  }),

  // Logout user
  logout: asyncHandler(async (req: Request, res: Response) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      throw new AuthenticationError("No token provided");
    }

    await authService.logout(token);
    return ResponseHandler.success(res, null, "Logged out successfully");
  }),

  // Get current user profile
  getProfile: asyncHandler(async (req: Request, res: Response) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      throw new AuthenticationError("No token provided");
    }

    const user = await authService.verifySession(token);
    return ResponseHandler.success(res, user, "Profile retrieved successfully");
  }),

  // Initialize admin (for first-time setup)
  initializeAdmin: asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ValidationError("Email and password are required");
    }

    const admin = await authService.createInitialAdmin({ email, password });
    return ResponseHandler.created(
      res,
      admin,
      "Admin initialized successfully"
    );
  }),
};
