CREATE TABLE "lookups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vin" varchar(17) NOT NULL,
	"decoded_json" jsonb NOT NULL,
	"ncs_valuation_usd" numeric NOT NULL,
	"valuation_confidence" varchar(20) NOT NULL,
	"duty_json" jsonb NOT NULL,
	"cbn_rate_ngn" numeric NOT NULL,
	"rate_fetched_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"refreshed_at" timestamp with time zone,
	CONSTRAINT "lookups_vin_unique" UNIQUE("vin")
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lookup_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"amount_ngn" numeric NOT NULL,
	"flw_tx_ref" varchar NOT NULL,
	"flw_tx_id" varchar,
	"status" varchar(20) NOT NULL,
	"source" varchar(10) NOT NULL,
	"telegram_chat_id" varchar,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"paid_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"r2_key" varchar NOT NULL,
	"pdf_hash" varchar(64) NOT NULL,
	"signed_url" varchar NOT NULL,
	"sent_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reports_order_id_unique" UNIQUE("order_id")
);
--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_lookup_id_lookups_id_fk" FOREIGN KEY ("lookup_id") REFERENCES "public"."lookups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;