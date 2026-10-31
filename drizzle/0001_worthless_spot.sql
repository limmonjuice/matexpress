CREATE TABLE "order_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"order_id" uuid NOT NULL,
	"type" text NOT NULL,
	"seller_slug" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY NOT NULL,
	"order_id" uuid NOT NULL,
	"product_slug" text NOT NULL,
	"variant_id" text NOT NULL,
	"variant_label" text,
	"seller_slug" text NOT NULL,
	"seller_name" text NOT NULL,
	"name" text NOT NULL,
	"unit" text NOT NULL,
	"image" text NOT NULL,
	"unit_price_centavos" integer NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"line_total_centavos" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY NOT NULL,
	"number" text NOT NULL,
	"user_id" text,
	"contact_name" text NOT NULL,
	"mobile" text NOT NULL,
	"street" text NOT NULL,
	"city" text NOT NULL,
	"area" text NOT NULL,
	"notes" text,
	"truck_access" text,
	"delivery_date" text NOT NULL,
	"delivery_window" text NOT NULL,
	"subtotal_centavos" integer NOT NULL,
	"delivery_fee_centavos" integer NOT NULL,
	"total_centavos" integer NOT NULL,
	"payment_method" text NOT NULL,
	"payment_status" text NOT NULL,
	"payment_ref" text,
	"idempotency_key" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "orders_number_unique" UNIQUE("number"),
	CONSTRAINT "orders_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "seller_applications" (
	"id" uuid PRIMARY KEY NOT NULL,
	"store_name" text NOT NULL,
	"contact_name" text NOT NULL,
	"mobile" text NOT NULL,
	"city" text NOT NULL,
	"sells" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sites" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"contact_name" text NOT NULL,
	"mobile" text NOT NULL,
	"street" text NOT NULL,
	"city" text NOT NULL,
	"area" text NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sites" ADD CONSTRAINT "sites_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;