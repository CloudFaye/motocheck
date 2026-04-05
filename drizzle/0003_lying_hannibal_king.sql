CREATE TYPE "public"."data_source" AS ENUM('nhtsa_decode', 'nhtsa_recalls', 'nmvtis', 'nicb', 'copart', 'iaai', 'autotrader', 'cargurus');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('title_transfer', 'auction_sale', 'accident', 'recall', 'inspection', 'listing', 'theft', 'title_brand');--> statement-breakpoint
CREATE TYPE "public"."odometer_source" AS ENUM('title_transfer', 'state_inspection', 'auction', 'service_record', 'listing');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('pending', 'fetching', 'normalizing', 'stitching', 'analyzing', 'ready', 'failed');--> statement-breakpoint
CREATE TABLE "normalized_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"vin" varchar(17) NOT NULL,
	"source" "data_source" NOT NULL,
	"normalized_at" timestamp with time zone DEFAULT now() NOT NULL,
	"data" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "odometer_readings" (
	"id" serial PRIMARY KEY NOT NULL,
	"vin" varchar(17) NOT NULL,
	"reading_date" timestamp with time zone NOT NULL,
	"mileage" integer NOT NULL,
	"source" "odometer_source" NOT NULL,
	"reported_by" text,
	"is_anomaly" boolean DEFAULT false NOT NULL,
	"anomaly_note" text
);
--> statement-breakpoint
CREATE TABLE "pipeline_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"vin" varchar(17) NOT NULL,
	"stage" text NOT NULL,
	"status" text NOT NULL,
	"message" text,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pipeline_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"vin" varchar(17) NOT NULL,
	"status" "report_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"error_message" text,
	"year" integer,
	"make" text,
	"model" text,
	"trim" text,
	"body_style" text,
	"engine_description" text,
	"drive_type" text,
	"fuel_type" text,
	"timeline" jsonb,
	"llm_flags" jsonb,
	"llm_verdict" text,
	CONSTRAINT "pipeline_reports_vin_unique" UNIQUE("vin")
);
--> statement-breakpoint
CREATE TABLE "raw_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"vin" varchar(17) NOT NULL,
	"source" "data_source" NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"raw_json" jsonb NOT NULL,
	"raw_html" text,
	"success" boolean DEFAULT true NOT NULL,
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE "report_sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"vin" varchar(17) NOT NULL,
	"section_key" text NOT NULL,
	"content" text NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"model_used" text
);
--> statement-breakpoint
CREATE TABLE "vehicle_photos" (
	"id" serial PRIMARY KEY NOT NULL,
	"vin" varchar(17) NOT NULL,
	"url" text NOT NULL,
	"source" text NOT NULL,
	"captured_at" timestamp with time zone,
	"scraped_at" timestamp with time zone DEFAULT now() NOT NULL,
	"photo_type" text,
	"auction_lot_id" text
);
--> statement-breakpoint
ALTER TABLE "reports" RENAME COLUMN "pdf_hash" TO "document_hash";--> statement-breakpoint
ALTER TABLE "reports" DROP CONSTRAINT "reports_order_id_unique";--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "report_format" varchar(10) DEFAULT 'docx' NOT NULL;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "format" varchar(10) DEFAULT 'pdf' NOT NULL;--> statement-breakpoint
CREATE INDEX "normalized_data_vin_idx" ON "normalized_data" USING btree ("vin");--> statement-breakpoint
CREATE INDEX "normalized_data_vin_source_idx" ON "normalized_data" USING btree ("vin","source");--> statement-breakpoint
CREATE INDEX "odometer_readings_vin_idx" ON "odometer_readings" USING btree ("vin");--> statement-breakpoint
CREATE INDEX "odometer_readings_vin_date_idx" ON "odometer_readings" USING btree ("vin","reading_date");--> statement-breakpoint
CREATE INDEX "pipeline_log_vin_idx" ON "pipeline_log" USING btree ("vin");--> statement-breakpoint
CREATE INDEX "pipeline_log_vin_timestamp_idx" ON "pipeline_log" USING btree ("vin","timestamp");--> statement-breakpoint
CREATE INDEX "pipeline_reports_vin_idx" ON "pipeline_reports" USING btree ("vin");--> statement-breakpoint
CREATE INDEX "raw_data_vin_idx" ON "raw_data" USING btree ("vin");--> statement-breakpoint
CREATE INDEX "raw_data_vin_source_idx" ON "raw_data" USING btree ("vin","source");--> statement-breakpoint
CREATE INDEX "report_sections_vin_idx" ON "report_sections" USING btree ("vin");--> statement-breakpoint
CREATE INDEX "report_sections_vin_section_idx" ON "report_sections" USING btree ("vin","section_key");--> statement-breakpoint
CREATE INDEX "vehicle_photos_vin_idx" ON "vehicle_photos" USING btree ("vin");--> statement-breakpoint
CREATE INDEX "vehicle_photos_vin_source_idx" ON "vehicle_photos" USING btree ("vin","source");