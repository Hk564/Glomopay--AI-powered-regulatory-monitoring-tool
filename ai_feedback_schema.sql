-- ============================================
-- AI Feedback Loop - Database Schema
-- ============================================

-- Create ai_feedback table
CREATE TABLE IF NOT EXISTS ai_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ai_analysis_id UUID NOT NULL REFERENCES ai_analysis(id) ON DELETE CASCADE,
    regulatory_update_id UUID NOT NULL REFERENCES regulatory_updates(id) ON DELETE CASCADE,
    
    -- Feedback type
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('relevance', 'analysis_quality', 'both')),
    
    -- Relevance feedback
    relevance_approved BOOLEAN,
    correct_relevance_score TEXT CHECK (correct_relevance_score IN ('HIGH', 'MEDIUM', 'LOW', 'NOT_RELEVANT')),
    relevance_disagreement_reason TEXT,
    
    -- Analysis quality feedback
    analysis_useful BOOLEAN,
    analysis_issue_types JSONB, -- Array of issue types
    analysis_comment TEXT,
    
    -- Metadata
    user_id TEXT, -- For future multi-user support
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one feedback per analysis (users can update their feedback)
    UNIQUE(ai_analysis_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ai_feedback_analysis_id 
    ON ai_feedback(ai_analysis_id);

CREATE INDEX IF NOT EXISTS idx_ai_feedback_regulatory_update_id 
    ON ai_feedback(regulatory_update_id);

CREATE INDEX IF NOT EXISTS idx_ai_feedback_type 
    ON ai_feedback(feedback_type);

CREATE INDEX IF NOT EXISTS idx_ai_feedback_created_at 
    ON ai_feedback(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_feedback_relevance_approved 
    ON ai_feedback(relevance_approved);

CREATE INDEX IF NOT EXISTS idx_ai_feedback_analysis_useful 
    ON ai_feedback(analysis_useful);

-- Comments
COMMENT ON TABLE ai_feedback IS 
    'Stores user feedback on AI analysis to improve future outputs';

COMMENT ON COLUMN ai_feedback.feedback_type IS 
    'Type of feedback: relevance (score), analysis_quality, or both';

COMMENT ON COLUMN ai_feedback.relevance_approved IS 
    'Whether user agrees with AI relevance score';

COMMENT ON COLUMN ai_feedback.correct_relevance_score IS 
    'User-suggested correct relevance score if they disagree';

COMMENT ON COLUMN ai_feedback.analysis_useful IS 
    'Whether user found the analysis useful';

COMMENT ON COLUMN ai_feedback.analysis_issue_types IS 
    'Array of issues: summary_unclear, impact_incorrect, action_items_missing, too_generic, missed_key_point';

COMMENT ON COLUMN ai_feedback.analysis_comment IS 
    'Optional user comment on analysis quality';
