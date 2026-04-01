-- Migration: Drop unique constraint on reports.order_id to allow multiple reports per order
-- This enables sending both PDF and DOCX formats for the same order

-- Drop the unique constraint
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_order_id_unique;

-- Verify the constraint is dropped
-- You can check with: \d reports in psql to see the table structure
