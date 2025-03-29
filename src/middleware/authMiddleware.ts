// src/middleware/authMiddleware.ts

import { Request, Response, NextFunction } from "express";
import { authService } from "../services/authService";

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: string;
      };
    }
  }
}

// Middleware to authenticate requests
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const user = await authService.verifySession(token);

    // Attach user to request object
    req.user = user;

    next();
  } catch (error: any) {
    return res
      .status(401)
      .json({ error: error.message || "Authentication failed" });
  }
};

// Middleware to check admin role
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): any => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }

  next();
};
