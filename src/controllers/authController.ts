// src/controllers/authController.ts

import { Request, Response } from "express";
import { authService, UserCredentials } from "../services/authService";

export const authController = {
  // Register a new user
  async register(req: Request, res: Response): Promise<any> {
    try {
      const { email, password, firstName, lastName, role } = req.body;

      // Validate request
      if (!email || !password) {
        return res
          .status(400)
          .json({ error: "Email and password are required" });
      }

      // Check if user is authorized to set role
      if (role === "admin") {
        // Only admin can create another admin
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
          return res.status(401).json({ error: "Unauthorized" });
        }

        try {
          const currentUser = await authService.verifySession(token);
          if (currentUser.role !== "admin") {
            return res.status(403).json({
              error: "Forbidden: Only admins can create admin accounts",
            });
          }
        } catch (error) {
          return res.status(401).json({ error: "Invalid token" });
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
      return res.status(201).json(user);
    } catch (error: any) {
      console.error("Registration error:", error);
      return res
        .status(500)
        .json({ error: error.message || "Failed to register user" });
    }
  },

  // Login user
  async login(req: Request, res: Response): Promise<any> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ error: "Email and password are required" });
      }

      const result = await authService.login({ email, password });
      return res.status(200).json(result);
    } catch (error: any) {
      console.error("Login error:", error);
      return res
        .status(401)
        .json({ error: error.message || "Invalid credentials" });
    }
  },

  // Logout user
  async logout(req: Request, res: Response): Promise<any> {
    try {
      const token = req.headers.authorization?.split(" ")[1];

      if (!token) {
        return res.status(401).json({ error: "No token provided" });
      }

      await authService.logout(token);
      return res.status(200).json({ message: "Logged out successfully" });
    } catch (error: any) {
      console.error("Logout error:", error);
      return res
        .status(500)
        .json({ error: error.message || "Failed to logout" });
    }
  },

  // Get current user profile
  async getProfile(req: Request, res: Response): Promise<any> {
    try {
      const token = req.headers.authorization?.split(" ")[1];

      if (!token) {
        return res.status(401).json({ error: "No token provided" });
      }

      const user = await authService.verifySession(token);
      return res.status(200).json(user);
    } catch (error: any) {
      console.error("Get profile error:", error);
      return res.status(401).json({ error: error.message || "Invalid token" });
    }
  },

  // Initialize admin (for first-time setup)
  async initializeAdmin(req: Request, res: Response): Promise<any> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ error: "Email and password are required" });
      }

      const admin = await authService.createInitialAdmin({ email, password });
      return res.status(201).json(admin);
    } catch (error: any) {
      console.error("Initialize admin error:", error);
      return res
        .status(500)
        .json({ error: error.message || "Failed to initialize admin" });
    }
  },
};
