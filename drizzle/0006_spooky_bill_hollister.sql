CREATE TABLE "offers" (
	"product_slug" text NOT NULL,
	"variant_id" text NOT NULL,
	"seller_slug" text NOT NULL,
	"price_centavos" integer NOT NULL,
	"list_price_centavos" integer,
	"stock" numeric(12, 2) NOT NULL,
	"lead_days" integer NOT NULL,
	"tiers" jsonb,
	"position" integer NOT NULL,
	CONSTRAINT "offers_product_slug_variant_id_seller_slug_pk" PRIMARY KEY("product_slug","variant_id","seller_slug"),
	CONSTRAINT "offers_stock_not_negative" CHECK ("offers"."stock" >= 0),
	CONSTRAINT "offers_price_positive" CHECK ("offers"."price_centavos" > 0)
);
--> statement-breakpoint
CREATE TABLE "products" (
	"slug" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"brand" text NOT NULL,
	"category_slug" text NOT NULL,
	"subcategory" text NOT NULL,
	"unit" text NOT NULL,
	"size_label" text,
	"badge" text,
	"default_variant_id" text,
	"description" text NOT NULL,
	"highlights" jsonb NOT NULL,
	"images" jsonb NOT NULL,
	"rating" numeric(2, 1),
	"review_count" integer,
	"rating_bars" jsonb,
	"sales_rank" integer NOT NULL,
	"added_at" date NOT NULL,
	"related" jsonb,
	"position" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_slug" text NOT NULL,
	"author" text NOT NULL,
	"role" text NOT NULL,
	"rating" integer NOT NULL,
	"date_label" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"seller_name" text,
	"reply_from" text,
	"reply_body" text,
	"position" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sellers" (
	"slug" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"city" text NOT NULL,
	"since" integer NOT NULL,
	"rating" numeric(2, 1) NOT NULL,
	"review_count" integer NOT NULL,
	"blurb" text NOT NULL,
	"tint" text NOT NULL,
	"awning" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"product_slug" text NOT NULL,
	"id" text NOT NULL,
	"label" text NOT NULL,
	"spec" text NOT NULL,
	"attributes" jsonb NOT NULL,
	"measure" jsonb,
	"weight_kg" numeric(10, 3) NOT NULL,
	"min_qty" numeric(10, 2),
	"step" numeric(10, 2),
	"quick_qty" jsonb,
	"drawing" jsonb,
	"position" integer NOT NULL,
	CONSTRAINT "product_variants_product_slug_id_pk" PRIMARY KEY("product_slug","id")
);
--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_seller_slug_sellers_slug_fk" FOREIGN KEY ("seller_slug") REFERENCES "public"."sellers"("slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_variant_fk" FOREIGN KEY ("product_slug","variant_id") REFERENCES "public"."product_variants"("product_slug","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_slug_products_slug_fk" FOREIGN KEY ("product_slug") REFERENCES "public"."products"("slug") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_slug_products_slug_fk" FOREIGN KEY ("product_slug") REFERENCES "public"."products"("slug") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "offers_seller_slug_idx" ON "offers" USING btree ("seller_slug");--> statement-breakpoint
CREATE INDEX "reviews_product_slug_idx" ON "reviews" USING btree ("product_slug");