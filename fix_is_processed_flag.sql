-- ============================================
-- FIX: Update is_processed flag for existing analyzed records
-- This updates all regulatory_updates that have AI analysis
-- but still have is_processed = false
-- ============================================

-- Update is_processed to true for all records that have corresponding AI analysis
UPDATE regulatory_updates
SET is_processed = true
WHERE id IN (
    SELECT regulatory_update_id 
    FROM ai_analysis
)
AND is_processed = false;

-- Verify the update
SELECT 
    COUNT(*) as total_updates,
    SUM(CASE WHEN is_processed = true THEN 1 ELSE 0 END) as processed_count,
    SUM(CASE WHEN is_processed = false THEN 1 ELSE 0 END) as unprocessed_count
FROM regulatory_updates;
