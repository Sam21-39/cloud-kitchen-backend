// src/services/authService.ts

import { createClient } from "@supabase/supabase-js";
import { db } from "../config/database";
import { users } from "../models/userSchema"; // Adjust the import path as necessary
import { eq } from "drizzle-orm";
import dotenv from "dotenv";

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export interface UserCredentials {
  email: string;
  password: string;
}

export interface UserProfile {
  id: number;
  email: string;
  role: string;
  firstName: string | null;
  lastName: string | null;
}

export const authService = {
  // Register a new user
  async register(
    userData: UserCredentials & {
      firstName?: string;
      lastName?: string;
      role?: "admin" | "staff";
    }
  ) {
    try {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error("Failed to create user");
      }

      // Also store user in our database for additional user properties
      const [newUser] = await db
        .insert(users)
        .values({
          email: userData.email,
          passwordHash: "supabase_managed", // We don't store the actual password, Supabase handles that
          role: userData.role || "staff",
          firstName: userData.firstName || null,
          lastName: userData.lastName || null,
        })
        .returning();

      return {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
      };
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  },

  // Login user
  async login(credentials: UserCredentials) {
    try {
      // Sign in with Supabase Auth
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });

      if (authError) {
        throw new Error(authError.message);
      }

      // Get user details from our database
      const userDetails = await db
        .select()
        .from(users)
        .where(eq(users.email, credentials.email))
        .limit(1);

      if (!userDetails.length) {
        throw new Error("User not found in database");
      }

      const userProfile: UserProfile = {
        id: userDetails[0].id,
        email: userDetails[0].email,
        role: userDetails[0].role,
        firstName: userDetails[0].firstName,
        lastName: userDetails[0].lastName,
      };

      return {
        user: userProfile,
        session: authData.session,
      };
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  // Logout user
  async logout(token: string) {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw new Error(error.message);
      }

      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  },

  // Verify token/session
  async verifySession(token: string) {
    try {
      const { data, error } = await supabase.auth.getUser(token);

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error("Invalid session");
      }

      // Get user details from our database
      const userDetails = await db
        .select()
        .from(users)
        .where(eq(users.email, data.user.email || ""))
        .limit(1);

      if (!userDetails.length) {
        throw new Error("User not found in database");
      }

      return {
        id: userDetails[0].id,
        email: userDetails[0].email,
        role: userDetails[0].role,
      };
    } catch (error) {
      console.error("Token verification error:", error);
      throw error;
    }
  },

  // Create initial admin user (for setup)
  async createInitialAdmin(adminData: UserCredentials) {
    // Check if any admin exists
    const existingAdmins = await db
      .select()
      .from(users)
      .where(eq(users.role, "admin"));

    if (existingAdmins.length > 0) {
      throw new Error("Admin user already exists");
    }

    // Create admin user
    return this.register({
      ...adminData,
      role: "admin",
    });
  },
};
