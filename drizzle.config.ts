import type { Config } from "drizzle-kit";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Ensure DATABASE_URL is available
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

export default {
  schema: "./src/models/*.ts", // Load all schema files from models directory
  out: "./drizzle", // Output directory for migrations
  // PostgreSQL driver
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  // Verbose logging during migrations
  verbose: true,
  // Strict mode to catch potential errors
  strict: true,
  dialect: "postgresql",
  extensionsFilters: ["postgis"],
  schemaFilter: "public",
  tablesFilter: "*",
  introspect: {
    casing: "camel",
  },
  migrations: {
    prefix: "timestamp",
    table: "__drizzle_migrations__",
    schema: "public",
  },
  entities: {
    roles: {
      provider: "",
      exclude: [],
      include: [],
    },
  },
  breakpoints: true,
} satisfies Config;
