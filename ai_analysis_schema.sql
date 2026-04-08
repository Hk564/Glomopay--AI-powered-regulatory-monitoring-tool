-- ============================================
-- AI Analysis Table for Layer 2
-- ============================================

-- Create ai_analysis table
CREATE TABLE IF NOT EXISTS ai_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    regulatory_update_id UUID NOT NULL REFERENCES regulatory_updates(id) ON DELETE CASCADE,
    
    -- AI-generated structured analysis
    summary JSONB,
    key_changes JSONB,
    implications JSONB,
    relevance_score TEXT CHECK (relevance_score IN ('HIGH', 'MEDIUM', 'LOW', 'NOT_RELEVANT')),
    relevance_reason TEXT,
    action_items JSONB,
    risk_if_ignored TEXT,
    
    -- Raw AI response for debugging
    raw_ai_response JSONB,
    
    -- Processing metadata
    processing_status TEXT DEFAULT 'completed' CHECK (processing_status IN ('completed', 'failed', 'retry')),
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one analysis per regulatory update
    UNIQUE(regulatory_update_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_analysis_regulatory_update_id 
    ON ai_analysis(regulatory_update_id);

CREATE INDEX IF NOT EXISTS idx_ai_analysis_relevance_score 
    ON ai_analysis(relevance_score);

CREATE INDEX IF NOT EXISTS idx_ai_analysis_processing_status 
    ON ai_analysis(processing_status);

CREATE INDEX IF NOT EXISTS idx_ai_analysis_created_at 
    ON ai_analysis(created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE ai_analysis IS 
    'Stores AI-generated analysis of regulatory updates for Glomopay compliance team';

COMMENT ON COLUMN ai_analysis.regulatory_update_id IS 
    'Foreign key to regulatory_updates table';

COMMENT ON COLUMN ai_analysis.summary IS 
    'AI-generated summary of the regulatory update';

COMMENT ON COLUMN ai_analysis.key_changes IS 
    'List of actual regulatory changes identified';

COMMENT ON COLUMN ai_analysis.implications IS 
    'Impact on Glomopay workflows (LRS, KYC, AML, etc.)';

COMMENT ON COLUMN ai_analysis.relevance_score IS 
    'HIGH/MEDIUM/LOW/NOT_RELEVANT based on impact to Glomopay';

COMMENT ON COLUMN ai_analysis.relevance_reason IS 
    'Justification for the relevance score';

COMMENT ON COLUMN ai_analysis.action_items IS 
    'Specific, actionable next steps with owner and timeline';

COMMENT ON COLUMN ai_analysis.risk_if_ignored IS 
    'Consequences if the regulatory update is not addressed';

COMMENT ON COLUMN ai_analysis.raw_ai_response IS 
    'Complete raw response from AI for debugging';

COMMENT ON COLUMN ai_analysis.processing_status IS 
    'Status of AI processing: completed, failed, or retry';

COMMENT ON COLUMN ai_analysis.retry_count IS 
    'Number of retry attempts for failed processing';

-- Create processing logs table for observability
CREATE TABLE IF NOT EXISTS ai_processing_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID,
    regulatory_update_id UUID REFERENCES regulatory_updates(id),
    status TEXT CHECK (status IN ('success', 'failed', 'retry', 'skipped')),
    error_message TEXT,
    processing_time_ms INTEGER,
    retry_attempt INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_processing_logs_batch_id 
    ON ai_processing_logs(batch_id);

CREATE INDEX IF NOT EXISTS idx_ai_processing_logs_status 
    ON ai_processing_logs(status);

CREATE INDEX IF NOT EXISTS idx_ai_processing_logs_created_at 
    ON ai_processing_logs(created_at DESC);

COMMENT ON TABLE ai_processing_logs IS 
    'Logs for AI processing runs - tracks successes, failures, and retries';
