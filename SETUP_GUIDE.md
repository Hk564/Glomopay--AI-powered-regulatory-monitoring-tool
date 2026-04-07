# Regulatory Monitoring System - Layer 1: Data Ingestion

## 🎯 Overview

This is a production-ready data ingestion system for regulatory compliance monitoring. Layer 1 focuses on collecting, storing, and managing regulatory updates from sources like RBI and SEBI.

---

## 📋 Features Implemented

### ✅ Backend (FastAPI)
- **Webhook Endpoint** (`/api/ingest`) - Receives data from n8n workflows
  - Supports single updates or batch updates
  - Automatic deduplication based on URL
  - Detailed response with insertion/duplicate/failure counts
  
- **Manual Entry Endpoint** (`/api/regulatory-updates`) - Add updates manually
- **Read Endpoints** - Fetch and filter updates
- **Statistics Endpoint** (`/api/stats`) - Dashboard metrics
- **Health Check** (`/api/health`) - Service monitoring

### ✅ Database (Supabase)
- PostgreSQL table with proper schema
- URL-based deduplication (unique constraint)
- Ready for Layer 2 AI processing (`is_processed` flag)

### ✅ Frontend (React)
- Interactive dashboard with statistics
- Manual data entry form
- Filter by source (RBI/SEBI)
- Real-time updates view
- n8n integration documentation

---

## 🗄️ Database Setup

### Step 1: Create the Table in Supabase

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project: `fqnprailkyqxbreqzmoj`
3. Click on **SQL Editor** in the left sidebar
4. Create a new query and paste the following SQL:

```sql
-- Create regulatory_updates table
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
CREATE INDEX idx_regulatory_updates_source ON regulatory_updates(source);
CREATE INDEX idx_regulatory_updates_created_at ON regulatory_updates(created_at DESC);
CREATE INDEX idx_regulatory_updates_is_processed ON regulatory_updates(is_processed);
CREATE INDEX idx_regulatory_updates_published_at ON regulatory_updates(published_at DESC);

-- Add comments for documentation
COMMENT ON TABLE regulatory_updates IS 'Stores regulatory updates from various sources (RBI, SEBI, etc.)';
COMMENT ON COLUMN regulatory_updates.url IS 'Unique URL - used for deduplication';
COMMENT ON COLUMN regulatory_updates.is_processed IS 'Flag for Layer 2 AI processing status';
COMMENT ON COLUMN regulatory_updates.raw_content IS 'Full content for AI processing in Layer 2';
```

5. Click **Run** to execute the SQL
6. Verify the table was created by checking the **Table Editor**

### Table Schema

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `title` | TEXT | NOT NULL | Update title |
| `url` | TEXT | NOT NULL, UNIQUE | Source URL (deduplication key) |
| `source` | TEXT | NOT NULL | Source (RBI, SEBI, etc.) |
| `published_at` | TIMESTAMPTZ | - | Publication date |
| `summary` | TEXT | - | Brief summary |
| `raw_content` | TEXT | - | Full content for AI |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Ingestion timestamp |
| `is_processed` | BOOLEAN | DEFAULT FALSE | AI processing status |

---

## 🔌 n8n Integration Guide

### Webhook Endpoint
```
POST https://glomopay--ai-powered-regulatory-monitoring-tool.preview.emergentagent.com/api/ingest
```

### Single Update Format
```json
{
  "title": "RBI Circular on FEMA Updates",
  "url": "https://rbi.org.in/Scripts/NotificationUser.aspx?Id=12345",
  "source": "RBI",
  "published_at": "2024-01-15T10:30:00Z",
  "summary": "Updates to Foreign Exchange Management Act regulations...",
  "raw_content": "Full text of the circular..."
}
```

### Batch Updates Format
```json
{
  "updates": [
    {
      "title": "First Update",
      "url": "https://rbi.org.in/circular/1",
      "source": "RBI",
      "published_at": "2024-01-15",
      "summary": "Summary here..."
    },
    {
      "title": "Second Update",
      "url": "https://sebi.gov.in/circular/2",
      "source": "SEBI",
      "published_at": "2024-01-16",
      "summary": "Another summary..."
    }
  ]
}
```

### Response Format
```json
{
  "success": true,
  "message": "Processed 2 updates",
  "inserted_count": 1,
  "duplicate_count": 1,
  "failed_count": 0,
  "details": [
    {
      "url": "https://rbi.org.in/circular/1",
      "status": "inserted",
      "id": "123e4567-e89b-12d3-a456-426614174000"
    },
    {
      "url": "https://sebi.gov.in/circular/2",
      "status": "duplicate",
      "message": "URL already exists in database"
    }
  ]
}
```

### n8n Workflow Setup Steps

1. **Create HTTP Request Node**
   - Method: POST
   - URL: `https://glomopay--ai-powered-regulatory-monitoring-tool.preview.emergentagent.com/api/ingest`
   - Authentication: None (add if needed later)
   - Body Content Type: JSON

2. **Map Your Data**
   - Ensure your workflow outputs match the required fields
   - Required: `title`, `url`, `source`
   - Optional: `published_at`, `summary`, `raw_content`

3. **Handle Responses**
   - Check `success` field
   - Log `duplicate_count` for monitoring
   - Alert on `failed_count > 0`

---

## 🚀 Testing the System

### 1. Check Service Status
```bash
curl https://glomopay--ai-powered-regulatory-monitoring-tool.preview.emergentagent.com/
```

### 2. Health Check
```bash
curl https://glomopay--ai-powered-regulatory-monitoring-tool.preview.emergentagent.com/api/health
```

### 3. Test Webhook with Sample Data
```bash
curl -X POST https://glomopay--ai-powered-regulatory-monitoring-tool.preview.emergentagent.com/api/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test RBI Circular - FEMA Update",
    "url": "https://rbi.org.in/test/12345",
    "source": "RBI",
    "published_at": "2024-01-15",
    "summary": "Test summary for regulatory update",
    "raw_content": "Full content here for AI processing..."
  }'
```

### 4. Test Deduplication (Send Same URL Again)
```bash
curl -X POST https://glomopay--ai-powered-regulatory-monitoring-tool.preview.emergentagent.com/api/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test RBI Circular - FEMA Update",
    "url": "https://rbi.org.in/test/12345",
    "source": "RBI",
    "published_at": "2024-01-15",
    "summary": "Same URL - should be marked as duplicate"
  }'
```

### 5. Get All Updates
```bash
curl https://glomopay--ai-powered-regulatory-monitoring-tool.preview.emergentagent.com/api/regulatory-updates
```

### 6. Get Statistics
```bash
curl https://glomopay--ai-powered-regulatory-monitoring-tool.preview.emergentagent.com/api/stats
```

---

## 🖥️ Frontend Dashboard

Access the dashboard at:
```
https://glomopay--ai-powered-regulatory-monitoring-tool.preview.emergentagent.com
```

### Features:
- **Dashboard Tab**: View all ingested updates, statistics, and filters
- **Manual Entry Tab**: Add regulatory updates manually
- **Filters**: Filter by source (RBI/SEBI)
- **Statistics**: Total updates, recent updates (24h), processed/unprocessed counts

---

## 📊 API Documentation

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Service info |
| `GET` | `/api/health` | Health check |
| `POST` | `/api/ingest` | Webhook for n8n |
| `POST` | `/api/regulatory-updates` | Manual entry |
| `GET` | `/api/regulatory-updates` | List updates |
| `GET` | `/api/regulatory-updates/{id}` | Get single update |
| `DELETE` | `/api/regulatory-updates/{id}` | Delete update |
| `GET` | `/api/stats` | Statistics |

### Query Parameters

**GET /api/regulatory-updates**
- `limit` (default: 50) - Number of records to return
- `offset` (default: 0) - Pagination offset
- `source` (optional) - Filter by source (RBI, SEBI)
- `is_processed` (optional) - Filter by processing status (true/false)

Example:
```
GET /api/regulatory-updates?limit=20&source=RBI&is_processed=false
```

---

## 🔐 Environment Variables

### Backend (.env)
```
SUPABASE_URL=https://fqnprailkyqxbreqzmoj.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGci...
```

### Frontend (.env)
```
REACT_APP_BACKEND_URL=https://glomopay--ai-powered-regulatory-monitoring-tool.preview.emergentagent.com
```

---

## 🎯 Key Features for Production

### ✅ Deduplication
- Handled at database level using `UNIQUE` constraint on `url`
- Duplicate attempts return proper status in response
- No duplicate data stored

### ✅ Error Handling
- Comprehensive error messages
- HTTP status codes for different scenarios
- Detailed logging for debugging

### ✅ Scalability
- Batch processing support
- Pagination for large datasets
- Indexed database columns for performance

### ✅ Extensibility
- Ready for SEBI and additional sources
- `is_processed` flag for Layer 2 integration
- `raw_content` field for AI processing

### ✅ Monitoring
- Health check endpoint
- Statistics endpoint
- Detailed ingestion reports

---

## 🔄 Next Steps for Layer 2 (AI Processing)

When ready to implement Layer 2:

1. **Query unprocessed updates**:
   ```bash
   GET /api/regulatory-updates?is_processed=false
   ```

2. **Process with AI** (classify, summarize, extract insights)

3. **Update processing status**:
   ```python
   supabase.table("regulatory_updates")\
     .update({"is_processed": True})\
     .eq("id", update_id)\
     .execute()
   ```

4. **Store AI results** in a new table (e.g., `ai_insights`)

---

## 📝 Notes

- **Data Sources**: Currently configured for RBI; SEBI can be added by updating n8n workflows
- **Authentication**: No authentication on webhook endpoint (add API key if needed)
- **Rate Limiting**: Not implemented (consider adding for production)
- **Monitoring**: Set up alerts for `failed_count > 0` in ingestion responses

---

## 🐛 Troubleshooting

### Database connection issues
- Verify Supabase credentials in `/app/backend/.env`
- Check Supabase project status
- Test with health endpoint: `/api/health`

### n8n webhook not working
- Verify the webhook URL is correct
- Check request format matches documentation
- Review backend logs: `tail -f /var/log/supervisor/backend.err.log`

### Frontend not loading
- Check browser console for errors
- Verify REACT_APP_BACKEND_URL in `/app/frontend/.env`
- Check frontend logs: `tail -f /var/log/supervisor/frontend.out.log`

---

## ✅ Layer 1 Checklist

- [x] Backend API with FastAPI
- [x] Supabase database integration
- [x] Webhook endpoint for n8n
- [x] Manual entry endpoint
- [x] URL-based deduplication
- [x] Frontend dashboard
- [x] Statistics and monitoring
- [x] API documentation
- [x] Error handling
- [x] Ready for Layer 2 integration

---

**Layer 1 is production-ready! 🚀**

Once you've created the database table in Supabase and configured your n8n workflows, the system will be fully operational.
