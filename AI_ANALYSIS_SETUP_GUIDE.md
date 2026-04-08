# AI Analysis Layer Setup Guide

## 🎯 Overview

The AI Analysis Layer (Layer 2) automatically processes regulatory updates and converts them into actionable compliance insights using OpenAI GPT-5.2.

---

## 📋 Prerequisites

✅ Layer 1 (Data Ingestion) is operational  
✅ Regulatory updates in `regulatory_updates` table  
✅ Supabase database access  
✅ Emergent LLM Key configured  

---

## 🗄️ Step 1: Create Database Tables

Run this SQL in your Supabase SQL Editor:

```sql
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
CREATE INDEX IF NOT EXISTS idx_ai_analysis_regulatory_update_id ON ai_analysis(regulatory_update_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_relevance_score ON ai_analysis(relevance_score);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_processing_status ON ai_analysis(processing_status);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_created_at ON ai_analysis(created_at DESC);

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

CREATE INDEX IF NOT EXISTS idx_ai_processing_logs_batch_id ON ai_processing_logs(batch_id);
CREATE INDEX IF NOT EXISTS idx_ai_processing_logs_status ON ai_processing_logs(status);
CREATE INDEX IF NOT EXISTS idx_ai_processing_logs_created_at ON ai_processing_logs(created_at DESC);
```

Copy the complete SQL from `/app/ai_analysis_schema.sql`

---

## ⚙️ Step 2: Set Up Cron Job (Hourly Processing)

### Option A: Using crontab (Recommended)

```bash
# Edit crontab
crontab -e

# Add this line to run every hour
0 * * * * /app/backend/ai_cron.sh >> /var/log/ai_analysis_cron.log 2>&1
```

### Option B: Manual Trigger via API

You can also trigger processing manually:

```bash
curl -X POST https://compliance-pulse-16.preview.emergentagent.com/api/trigger-ai-analysis
```

---

## 🧪 Step 3: Test the AI Analysis

### Run Manual Test

```bash
cd /app/backend
python ai_processor.py
```

Expected output:
```
================================================================================
🚀 AI Analysis Layer - Processing Run Started
📅 2026-04-08 12:00:00
🆔 Batch ID: abc123-def456
================================================================================
✅ LLM initialized (OpenAI GPT-5.2)
📊 Found 11 unprocessed records

[1/11] 📄 Processing: master direction on counterfeit notes...
   ID: 8b9a8b19-851c-4c89-b31b-bf0dca23ddb0
  🤖 Sending to GPT-5.2 (attempt 1/3)...
  ✅ Valid JSON received
  💾 Analysis stored successfully
  ⏱️  Completed in 3425ms
  📊 Relevance: MEDIUM

...

================================================================================
📊 Processing Summary
================================================================================
✅ Successfully processed: 11
❌ Failed: 0
📝 Total: 11
================================================================================
```

---

## 📊 Step 4: View AI Analysis Results

### Via API Endpoints

**Get all AI analysis:**
```bash
curl https://compliance-pulse-16.preview.emergentagent.com/api/ai-analysis
```

**Get by relevance score:**
```bash
curl "https://compliance-pulse-16.preview.emergentagent.com/api/ai-analysis?relevance_score=HIGH"
```

**Get statistics:**
```bash
curl https://compliance-pulse-16.preview.emergentagent.com/api/ai-analysis-stats
```

**Get processing logs:**
```bash
curl https://compliance-pulse-16.preview.emergentagent.com/api/processing-logs
```

---

## 🔍 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai-analysis` | GET | Get all AI analysis with pagination |
| `/api/ai-analysis/{id}` | GET | Get specific analysis by ID |
| `/api/ai-analysis/by-update/{update_id}` | GET | Get analysis for a regulatory update |
| `/api/ai-analysis-stats` | GET | Get analysis statistics |
| `/api/trigger-ai-analysis` | POST | Manually trigger processing |
| `/api/processing-logs` | GET | Get processing logs |

---

## 📋 AI Analysis Output Structure

Each analysis contains:

```json
{
  "id": "uuid",
  "regulatory_update_id": "uuid",
  "summary": "Clear 2-3 sentence summary",
  "key_changes": [
    "Specific change 1",
    "Specific change 2"
  ],
  "implications": {
    "lrs_remittances": "Impact description or 'No impact'",
    "kyc_aml": "Impact description or 'No impact'",
    "fatf_sanctions": "Impact description or 'No impact'",
    "transaction_processing": "Impact description or 'No impact'",
    "regulatory_reporting": "Impact description or 'No impact'"
  },
  "relevance_score": "HIGH|MEDIUM|LOW|NOT_RELEVANT",
  "relevance_reason": "Justification for the score",
  "action_items": [
    {
      "action": "Specific action to take",
      "owner": "Compliance|Tech|Ops",
      "timeline": "Immediate|7 days|30 days",
      "priority": "Critical|High|Medium|Low"
    }
  ],
  "risk_if_ignored": "Concrete consequences if not addressed",
  "processing_status": "completed|failed|retry",
  "created_at": "2026-04-08T12:00:00Z"
}
```

---

## 🔁 How It Works

1. **Hourly Cron Job** checks for new regulatory updates
2. **Query Unprocessed**: Find records where:
   - `raw_content` IS NOT NULL
   - No entry exists in `ai_analysis` table
3. **AI Processing**:
   - Send full text to OpenAI GPT-5.2
   - System prompt: Glomopay compliance analyst persona
   - Receive structured JSON response
4. **Validation**: Retry up to 2 times if JSON is invalid
5. **Storage**: Save analysis in `ai_analysis` table
6. **Logging**: Track success/failure in `ai_processing_logs`

---

## ⚠️ Error Handling

- **Invalid JSON**: Retry up to 2 times
- **API Failures**: Log error and skip record
- **Duplicate Processing**: Prevented by UNIQUE constraint
- **Empty Content**: Automatically skipped

All errors are logged in `ai_processing_logs` table.

---

## 📊 Observability

Monitor processing through:

1. **Processing Logs Table**:
   ```sql
   SELECT * FROM ai_processing_logs ORDER BY created_at DESC LIMIT 50;
   ```

2. **Statistics Endpoint**:
   ```bash
   curl /api/ai-analysis-stats
   ```

3. **Log Files**:
   ```bash
   tail -f /var/log/ai_analysis.log
   tail -f /var/log/ai_analysis_cron.log
   ```

---

## 🎯 Relevance Score Guide

| Score | Criteria | Action Required |
|-------|----------|----------------|
| **HIGH** | Direct impact on LRS, KYC, AML, FATF, transactions | Immediate operational changes |
| **MEDIUM** | Indirect impact on reporting, controls, monitoring | Review and plan changes |
| **LOW** | Informational or minor clarification | Monitor for updates |
| **NOT_RELEVANT** | No impact on Glomopay's business | Archive/ignore |

---

## 🔧 Troubleshooting

### AI processing not running

**Check cron:**
```bash
crontab -l
```

**Check logs:**
```bash
tail -50 /var/log/ai_analysis.log
```

**Manual run:**
```bash
cd /app/backend && python ai_processor.py
```

### No records being processed

**Check unprocessed count:**
```bash
curl /api/ai-analysis-stats
```

**Verify raw_content exists:**
```sql
SELECT COUNT(*) FROM regulatory_updates WHERE raw_content IS NOT NULL;
```

### API key issues

**Verify key in .env:**
```bash
grep EMERGENT_LLM_KEY /app/backend/.env
```

---

## 🚀 Next Steps

1. **Create database tables** (Step 1)
2. **Set up cron job** (Step 2)
3. **Run manual test** (Step 3)
4. **Monitor first run** and verify results
5. **Integrate with frontend** (Layer 3 - UI)

---

## 📁 Files Created

| File | Purpose |
|------|---------|
| `/app/backend/ai_processor.py` | Main AI processing module |
| `/app/backend/ai_cron.sh` | Cron job script |
| `/app/ai_analysis_schema.sql` | Database schema SQL |
| `/app/backend/.env` | Updated with EMERGENT_LLM_KEY |
| `/app/backend/server.py` | Updated with AI analysis endpoints |

---

**Layer 2 is ready! Set up the database tables and cron job to start processing!** 🎊
