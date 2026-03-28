-- Clear invalid VINs from cache
-- Run with: psql $DATABASE_URL -f clear-invalid-vins.sql

-- Show invalid VINs before deletion
SELECT 
    id, 
    vin, 
    decoded_json->>'make' as make,
    decoded_json->>'model' as model,
    decoded_json->>'year' as year
FROM lookups
WHERE 
    decoded_json->>'make' = 'Unknown' 
    OR decoded_json->>'model' = 'Unknown' 
    OR decoded_json->>'year' = 'Unknown';

-- Delete invalid VINs
DELETE FROM lookups
WHERE 
    decoded_json->>'make' = 'Unknown' 
    OR decoded_json->>'model' = 'Unknown' 
    OR decoded_json->>'year' = 'Unknown';

-- Show count
SELECT COUNT(*) as remaining_lookups FROM lookups;
