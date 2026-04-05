-- Add unique constraint on (vin, source) to raw_data table
-- This allows ON CONFLICT upserts in worker code

ALTER TABLE raw_data 
ADD CONSTRAINT raw_data_vin_source_unique UNIQUE (vin, source);
