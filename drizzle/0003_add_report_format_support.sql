-- Migration: Add report format support for DOCX and PDF
-- This migration adds format columns to orders and reports tables

-- Step 1: Add report_format column to orders table
ALTER TABLE "orders" 
ADD COLUMN "report_format" varchar(10) DEFAULT 'docx' CHECK ("report_format" IN ('pdf', 'docx'));

-- Step 2: Update existing orders to use 'pdf' for backward compatibility
UPDATE "orders" 
SET "report_format" = 'pdf' 
WHERE "report_format" IS NULL;

-- Step 3: Add index on report_format for efficient queries
CREATE INDEX "idx_orders_report_format" ON "orders"("report_format");

-- Step 4: Rename pdf_hash to document_hash in reports table
ALTER TABLE "reports" 
RENAME COLUMN "pdf_hash" TO "document_hash";

-- Step 5: Add format column to reports table
ALTER TABLE "reports" 
ADD COLUMN "format" varchar(10) DEFAULT 'pdf' CHECK ("format" IN ('pdf', 'docx'));

-- Step 6: Update existing reports to format='pdf'
UPDATE "reports" 
SET "format" = 'pdf' 
WHERE "format" IS NULL;
