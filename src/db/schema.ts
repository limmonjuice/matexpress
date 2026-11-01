import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  date,
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { Badge, Drawing, Measure, Product, ProductImage } from "@/lib/catalog/types";

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

export const session = pgTable(
  "session",
  {
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
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
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
  },
  (table) => [index("account_user_id_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

// ---------------------------------------------------------------------------
// The catalog: who sells what, at what price, and how much they have left.
// Prices are whole centavos, as on orders. `position` keeps lists in the order
// they were written. Categories and job guides are still in code: they're the
// site's navigation, and they don't change while it runs.
// ---------------------------------------------------------------------------

export const sellers = pgTable("sellers", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  city: text("city").notNull(),
  since: integer("since").notNull(),
  rating: numeric("rating", { precision: 2, scale: 1, mode: "number" }).notNull(),
  reviewCount: integer("review_count").notNull(),
  blurb: text("blurb").notNull(),
  tint: text("tint").notNull(),
  awning: text("awning").notNull(),
});

export const products = pgTable("products", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  brand: text("brand").notNull(),
  categorySlug: text("category_slug").notNull(),
  subcategory: text("subcategory").notNull(),
  unit: text("unit").notNull(),
  sizeLabel: text("size_label"),
  badge: text("badge").$type<Badge>(),
  defaultVariantId: text("default_variant_id"),
  description: text("description").notNull(),
  highlights: jsonb("highlights").$type<string[]>().notNull(),
  images: jsonb("images").$type<ProductImage[]>().notNull(),
  rating: numeric("rating", { precision: 2, scale: 1, mode: "number" }),
  reviewCount: integer("review_count"),
  ratingBars: jsonb("rating_bars").$type<NonNullable<Product["ratingBars"]>>(),
  salesRank: integer("sales_rank").notNull(),
  addedAt: date("added_at", { mode: "string" }).notNull(),
  related: jsonb("related").$type<string[]>(),
  position: integer("position").notNull(),
});

/** One size of a product. A product with one size still has one of these. */
export const variants = pgTable(
  "product_variants",
  {
    productSlug: text("product_slug")
      .notNull()
      .references(() => products.slug, { onDelete: "cascade" }),
    id: text("id").notNull(),
    label: text("label").notNull(),
    spec: text("spec").notNull(),
    attributes: jsonb("attributes").$type<Record<string, string>>().notNull(),
    measure: jsonb("measure").$type<Measure>(),
    weightKg: numeric("weight_kg", { precision: 10, scale: 3, mode: "number" }).notNull(),
    minQty: numeric("min_qty", { precision: 10, scale: 2, mode: "number" }),
    step: numeric("step", { precision: 10, scale: 2, mode: "number" }),
    quickQty: jsonb("quick_qty").$type<number[]>(),
    drawing: jsonb("drawing").$type<Drawing>(),
    position: integer("position").notNull(),
  },
  (table) => [primaryKey({ columns: [table.productSlug, table.id] })],
);

/** One seller's price and stock for one size. Stock has decimals because sand sells by the half cubic metre. */
export const offers = pgTable(
  "offers",
  {
    productSlug: text("product_slug").notNull(),
    variantId: text("variant_id").notNull(),
    sellerSlug: text("seller_slug")
      .notNull()
      .references(() => sellers.slug),
    priceCentavos: integer("price_centavos").notNull(),
    listPriceCentavos: integer("list_price_centavos"),
    stock: numeric("stock", { precision: 12, scale: 2, mode: "number" }).notNull(),
    leadDays: integer("lead_days").notNull(),
    tiers: jsonb("tiers").$type<{ from: number; priceCentavos: number }[]>(),
    position: integer("position").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.productSlug, table.variantId, table.sellerSlug] }),
    foreignKey({ name: "offers_variant_fk", columns: [table.productSlug, table.variantId], foreignColumns: [variants.productSlug, variants.id] }).onDelete("cascade"),
    index("offers_seller_slug_idx").on(table.sellerSlug),
    // What stops two buyers both getting the last unit: the second order's stock update fails, and takes its whole order with it.
    check("offers_stock_not_negative", sql`${table.stock} >= 0`),
    check("offers_price_positive", sql`${table.priceCentavos} > 0`),
  ],
);

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productSlug: text("product_slug")
      .notNull()
      .references(() => products.slug, { onDelete: "cascade" }),
    author: text("author").notNull(),
    role: text("role").notNull(),
    rating: integer("rating").notNull(),
    dateLabel: text("date_label").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    sellerName: text("seller_name"),
    replyFrom: text("reply_from"),
    replyBody: text("reply_body"),
    position: integer("position").notNull(),
  },
  (table) => [index("reviews_product_slug_idx").on(table.productSlug)],
);

// ---------------------------------------------------------------------------
// Orders. Everything an order needs is copied in when it's placed, so later
// changes to prices or the catalog never rewrite what someone bought.
// ---------------------------------------------------------------------------

export const orders = pgTable(
  "orders",
  {
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
  },
  // Read backwards, this is the account page's list: one buyer's orders, newest first, with nothing to sort.
  (table) => [index("orders_user_id_created_at_idx").on(table.userId, table.createdAt)],
);

export const orderItems = pgTable(
  "order_items",
  {
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
  },
  (table) => [index("order_items_order_id_idx").on(table.orderId)],
);

export const orderEvents = pgTable(
  "order_events",
  {
    id: uuid("id").primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    sellerSlug: text("seller_slug"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("order_events_order_id_idx").on(table.orderId)],
);

/** Delivery sites a signed-in buyer has saved, to fill checkout in one tap. */
export const sites = pgTable(
  "sites",
  {
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
  },
  (table) => [index("sites_user_id_created_at_idx").on(table.userId, table.createdAt)],
);

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
