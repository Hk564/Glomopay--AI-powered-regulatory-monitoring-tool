-- ============================================
-- Regulatory Monitoring System - Database Schema
-- Layer 1: Data Ingestion
-- ============================================

-- Create the main table for regulatory updates
CREATE TABLE IF NOT EXISTS regulatory_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    source TEXT NOT NULL,
    published_at TIMESTAMPTZ,
    summary TEXT,
    raw_content TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_processed BOOLEAN DEFAULT FALSE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_regulatory_updates_source 
    ON regulatory_updates(source);

CREATE INDEX IF NOT EXISTS idx_regulatory_updates_created_at 
    ON regulatory_updates(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_regulatory_updates_is_processed 
    ON regulatory_updates(is_processed);

CREATE INDEX IF NOT EXISTS idx_regulatory_updates_published_at 
    ON regulatory_updates(published_at DESC);

-- Add comments for documentation
COMMENT ON TABLE regulatory_updates IS 
    'Stores regulatory updates from various sources (RBI, SEBI, etc.)';

COMMENT ON COLUMN regulatory_updates.id IS 
    'Unique identifier (UUID)';

COMMENT ON COLUMN regulatory_updates.title IS 
    'Title of the regulatory update';

COMMENT ON COLUMN regulatory_updates.url IS 
    'Unique URL - used for deduplication. This is the primary deduplication key.';

COMMENT ON COLUMN regulatory_updates.source IS 
    'Source of the update (e.g., RBI, SEBI, etc.)';

COMMENT ON COLUMN regulatory_updates.published_at IS 
    'Publication date of the regulatory update';

COMMENT ON COLUMN regulatory_updates.summary IS 
    'Brief summary extracted from n8n or entered manually';

COMMENT ON COLUMN regulatory_updates.raw_content IS 
    'Full content for AI processing in Layer 2';

COMMENT ON COLUMN regulatory_updates.created_at IS 
    'Timestamp when the record was ingested into the system';

COMMENT ON COLUMN regulatory_updates.is_processed IS 
    'Flag indicating if this update has been processed by Layer 2 AI system';

-- Sample data (optional - for testing)
-- Uncomment to insert sample records

/*
INSERT INTO regulatory_updates (title, url, source, published_at, summary, raw_content) VALUES
(
    'RBI Master Direction on KYC',
    'https://rbi.org.in/Scripts/NotificationUser.aspx?Id=12345',
    'RBI',
    '2024-01-15 10:00:00+00',
    'Updated KYC guidelines for banks and financial institutions',
    'Full content of the RBI circular regarding KYC updates...'
),
(
    'SEBI Circular on Insider Trading',
    'https://www.sebi.gov.in/legal/circulars/jan-2024/67890',
    'SEBI',
    '2024-01-20 14:30:00+00',
    'New regulations on insider trading disclosure requirements',
    'Complete text of SEBI circular on insider trading...'
);
*/

-- Verify table creation
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_name = 'regulatory_updates'
ORDER BY 
    ordinal_position;
