-- Add unique constraint on (vin, source) to normalized_data table
-- This allows ON CONFLICT upserts in normalizer worker code

ALTER TABLE normalized_data 
ADD CONSTRAINT normalized_data_vin_source_unique UNIQUE (vin, source);
