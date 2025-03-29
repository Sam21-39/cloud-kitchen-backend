// src/db/schema.ts

import {
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  pgEnum,
  integer,
  decimal,
  date,
  json,
  uuid,
  primaryKey,
  foreignKey,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

// User roles enum
export const userRoleEnum = pgEnum("user_role", ["admin", "staff"]);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("staff"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  active: boolean("active").default(true).notNull(),
});

// User relations
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
}));

// ========================
// Menu Categories
// ========================
export const menuCategories = pgTable("menu_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  active: boolean("active").default(true).notNull(),
});

export const menuCategoriesRelations = relations(
  menuCategories,
  ({ many }) => ({
    menuItems: many(menuItems),
  })
);

// ========================
// Menu Items
// ========================
export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  categoryId: integer("category_id").references(() => menuCategories.id),
  available: boolean("available").default(true).notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  preparationTime: integer("preparation_time"), // in minutes
});

export const menuItemsRelations = relations(menuItems, ({ one, many }) => ({
  category: one(menuCategories, {
    fields: [menuItems.categoryId],
    references: [menuCategories.id],
  }),
  orderItems: many(orderItems),
  menuItemIngredients: many(menuItemIngredients),
}));

// ========================
// Inventory Units
// ========================
export const unitEnum = pgEnum("unit", [
  "g",
  "kg",
  "ml",
  "l",
  "unit",
  "box",
  "package",
  "bottle",
  "can",
]);

// ========================
// Inventory Categories
// ========================
export const inventoryCategories = pgTable("inventory_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const inventoryCategoriesRelations = relations(
  inventoryCategories,
  ({ many }) => ({
    inventoryItems: many(inventoryItems),
  })
);

// ========================
// Inventory Items
// ========================
export const inventoryItems = pgTable("inventory_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  categoryId: integer("category_id").references(() => inventoryCategories.id),
  quantityInStock: decimal("quantity_in_stock", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  unit: unitEnum("unit").notNull(),
  lowStockThreshold: decimal("low_stock_threshold", {
    precision: 10,
    scale: 2,
  }),
  costPerUnit: decimal("cost_per_unit", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const inventoryItemsRelations = relations(
  inventoryItems,
  ({ one, many }) => ({
    category: one(inventoryCategories, {
      fields: [inventoryItems.categoryId],
      references: [inventoryCategories.id],
    }),
    inventoryTransactions: many(inventoryTransactions),
    menuItemIngredients: many(menuItemIngredients),
  })
);

// ========================
// Menu Item Ingredients (for recipe management)
// ========================
export const menuItemIngredients = pgTable(
  "menu_item_ingredients",
  {
    id: serial("id").primaryKey(),
    menuItemId: integer("menu_item_id")
      .notNull()
      .references(() => menuItems.id),
    inventoryItemId: integer("inventory_item_id")
      .notNull()
      .references(() => inventoryItems.id),
    quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      menuItemInventoryUnique: uniqueIndex("menu_item_inventory_unique_idx").on(
        table.menuItemId,
        table.inventoryItemId
      ),
    };
  }
);

export const menuItemIngredientsRelations = relations(
  menuItemIngredients,
  ({ one }) => ({
    menuItem: one(menuItems, {
      fields: [menuItemIngredients.menuItemId],
      references: [menuItems.id],
    }),
    inventoryItem: one(inventoryItems, {
      fields: [menuItemIngredients.inventoryItemId],
      references: [inventoryItems.id],
    }),
  })
);

// ========================
// Inventory Transactions
// ========================
export const transactionTypeEnum = pgEnum("transaction_type", [
  "purchase",
  "usage",
  "adjustment",
  "waste",
  "return",
]);

export const inventoryTransactions = pgTable("inventory_transactions", {
  id: serial("id").primaryKey(),
  inventoryItemId: integer("inventory_item_id")
    .notNull()
    .references(() => inventoryItems.id),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  type: transactionTypeEnum("type").notNull(),
  notes: text("notes"),
  userId: integer("user_id").references(() => users.id),
  transactionDate: timestamp("transaction_date").defaultNow().notNull(),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  supplierId: integer("supplier_id").references(() => suppliers.id),
});

export const inventoryTransactionsRelations = relations(
  inventoryTransactions,
  ({ one }) => ({
    inventoryItem: one(inventoryItems, {
      fields: [inventoryTransactions.inventoryItemId],
      references: [inventoryItems.id],
    }),
    user: one(users, {
      fields: [inventoryTransactions.userId],
      references: [users.id],
    }),
    supplier: one(suppliers, {
      fields: [inventoryTransactions.supplierId],
      references: [suppliers.id],
    }),
  })
);

// ========================
// Suppliers
// ========================
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactPerson: text("contact_person"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  active: boolean("active").default(true).notNull(),
});

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  inventoryTransactions: many(inventoryTransactions),
}));

// ========================
// Orders
// ========================
export const orderStatusEnum = pgEnum("order_status", [
  "received",
  "in_progress",
  "completed",
  "cancelled",
]);

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number")
    .notNull()
    .unique()
    .$defaultFn(() => createId()),
  status: orderStatusEnum("status").notNull().default("received"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  customerName: text("customer_name"),
  customerPhone: text("customer_phone"),
  customerEmail: text("customer_email"),
  paymentStatus: text("payment_status").default("pending"),
  paymentMethod: text("payment_method"),
});

export const ordersRelations = relations(orders, ({ many, one }) => ({
  orderItems: many(orderItems),
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
}));

// ========================
// Order Items
// ========================
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  menuItemId: integer("menu_item_id")
    .notNull()
    .references(() => menuItems.id),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
});

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  menuItem: one(menuItems, {
    fields: [orderItems.menuItemId],
    references: [menuItems.id],
  }),
}));

// ========================
// Sales Records (Daily summaries)
// ========================
export const salesRecords = pgTable("sales_records", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  totalSales: decimal("total_sales", { precision: 10, scale: 2 }).notNull(),
  totalOrders: integer("total_orders").notNull(),
  averageOrderValue: decimal("average_order_value", {
    precision: 10,
    scale: 2,
  }),
  topSellingItems:
    json("top_selling_items").$type<
      { itemId: number; name: string; quantity: number }[]
    >(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
