-- ============================================
-- FEED ENHANCEMENT - DATABASE UPDATES
-- Add new columns to existing tables
-- ============================================

-- Add new columns to regulatory_updates table
ALTER TABLE regulatory_updates
ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS is_seen BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS review_status TEXT DEFAULT 'unreviewed' CHECK (review_status IN ('reviewed', 'unreviewed'));

-- Create index for new columns
CREATE INDEX IF NOT EXISTS idx_regulatory_updates_is_new ON regulatory_updates(is_new);
CREATE INDEX IF NOT EXISTS idx_regulatory_updates_is_seen ON regulatory_updates(is_seen);
CREATE INDEX IF NOT EXISTS idx_regulatory_updates_review_status ON regulatory_updates(review_status);

-- Add comments
COMMENT ON COLUMN regulatory_updates.is_new IS 'Indicates if this is a newly fetched update (for "NEW" badge)';
COMMENT ON COLUMN regulatory_updates.is_seen IS 'Indicates if user has viewed this update in the feed';
COMMENT ON COLUMN regulatory_updates.review_status IS 'Tracking if compliance team has reviewed this update';
