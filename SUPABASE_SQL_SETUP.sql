-- ============================================
-- COPY EVERYTHING BELOW THIS LINE
-- ============================================

-- Step 1: Create the regulatory_updates table
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

-- Step 2: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_regulatory_updates_source 
    ON regulatory_updates(source);

CREATE INDEX IF NOT EXISTS idx_regulatory_updates_created_at 
    ON regulatory_updates(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_regulatory_updates_is_processed 
    ON regulatory_updates(is_processed);

CREATE INDEX IF NOT EXISTS idx_regulatory_updates_published_at 
    ON regulatory_updates(published_at DESC);

-- Step 3: Add documentation comments
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

-- ============================================
-- SETUP COMPLETE!
-- ============================================
