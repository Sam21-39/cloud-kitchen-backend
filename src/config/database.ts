// Database Configuration with Drizzle ORM and Supabase
// src/db/index.ts

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as schema from "../models/userSchema"; // Adjust the import path as necessary
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Connection string from environment variables
const connectionString = process.env.DATABASE_URL || "";

// Client for migrations
const migrationClient = postgres(connectionString, {
  ssl: process.env.NODE_ENV === "production",
  max: 10,
});

// Client for queries
const queryClient = postgres(connectionString, {
  ssl: process.env.NODE_ENV === "production",
  max: 10,
});

// Initialize Drizzle with the query client and schema
export const db = drizzle(queryClient, { schema });

// // Function to run migrations
// export const runMigrations = async () => {
//   try {
//     console.log("Running migrations...");
//     await migrate(drizzle(migrationClient), {
//       migrationsFolder: "src/db/migrations",
//     });
//     console.log("Migrations completed successfully");
//   } catch (error) {
//     console.error("Migration failed:", error);
//     throw error;
//   } finally {
//     await migrationClient.end();
//   }
// };
