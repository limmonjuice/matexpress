import {
  bigint,
  boolean,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Better Auth core tables (user, session, account, verification)
// ---------------------------------------------------------------------------

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => new Date())
    .notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => new Date())
    .notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// ---------------------------------------------------------------------------
// App tables
// ---------------------------------------------------------------------------

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  unit: text("unit").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  stock: integer("stock").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

// ---------------------------------------------------------------------------
// Orders. Everything an order needs is copied in when it's placed, so later
// changes to prices or the catalog never rewrite what someone bought.
// ---------------------------------------------------------------------------

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey(),
  number: text("number").notNull().unique(),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  contactName: text("contact_name").notNull(),
  mobile: text("mobile").notNull(),
  street: text("street").notNull(),
  city: text("city").notNull(),
  area: text("area").notNull(),
  notes: text("notes"),
  truckAccess: text("truck_access"),
  deliveryDate: text("delivery_date").notNull(),
  deliveryWindow: text("delivery_window").notNull(),
  subtotalCentavos: integer("subtotal_centavos").notNull(),
  deliveryFeeCentavos: integer("delivery_fee_centavos").notNull(),
  totalCentavos: integer("total_centavos").notNull(),
  paymentMethod: text("payment_method").notNull(),
  paymentStatus: text("payment_status").notNull(),
  paymentRef: text("payment_ref"),
  idempotencyKey: text("idempotency_key").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productSlug: text("product_slug").notNull(),
  variantId: text("variant_id").notNull(),
  variantLabel: text("variant_label"),
  sellerSlug: text("seller_slug").notNull(),
  sellerName: text("seller_name").notNull(),
  name: text("name").notNull(),
  unit: text("unit").notNull(),
  image: text("image").notNull(),
  unitPriceCentavos: integer("unit_price_centavos").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
  lineTotalCentavos: integer("line_total_centavos").notNull(),
});

export const orderEvents = pgTable("order_events", {
  id: uuid("id").primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  sellerSlug: text("seller_slug"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/** Delivery sites a signed-in buyer has saved, to fill checkout in one tap. */
export const sites = pgTable("sites", {
  id: uuid("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  contactName: text("contact_name").notNull(),
  mobile: text("mobile").notNull(),
  street: text("street").notNull(),
  city: text("city").notNull(),
  area: text("area").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sellerApplications = pgTable("seller_applications", {
  id: uuid("id").primaryKey(),
  storeName: text("store_name").notNull(),
  contactName: text("contact_name").notNull(),
  mobile: text("mobile").notNull(),
  city: text("city").notNull(),
  sells: text("sells").notNull(),
  awning: text("awning"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/** Rate limits, kept here so every copy of a hosted server counts together. */
export const throttles = pgTable("throttles", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  windowStart: bigint("window_start", { mode: "number" }).notNull(),
});
