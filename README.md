# AI Regulatory Monitoring Tool

## 🚀 How to Run

### 1. Import and Run n8n Workflow
- Open n8n  
- Click **Import Workflow**  
- Upload `workflow.json`  
- Execute the workflow  

---

### 2. View the Application

Open the preview link:  
https://glomopay--ai-powered-regulatory-monitoring-tool.preview.emergentagent.com

---

### 3. Verify Output

- Go to **Data Ingestion** tab → check workflow execution  
- Go to **Compliance** section → view stored regulatory records  
- Click on any record → view:
  - **AI Analysis**
  - **Feedback**

---

## ⚡ What This Does
- Fetches regulatory updates (RBI, SEBI)  
- Processes and stores them  
- Displays insights with AI analysis  

---

## 📝 Note
- Workflow execution reflects in the UI in real-time  








# Regulatory Monitoring System - Layer 1: Data Ingestion

![Status](https://img.shields.io/badge/Status-Production%20Ready-green)
![Layer](https://img.shields.io/badge/Layer-1%20Complete-blue)

## 🎯 Project Overview

An AI-powered regulatory monitoring tool for financial compliance teams that automatically tracks regulatory updates from RBI, SEBI, and other sources, processes them into actionable insights, and presents them in a clean interface.

**Current Status**: Layer 1 (Data Ingestion) - ✅ Complete

## 📁 Project Structure

```
/app/
├── backend/               # FastAPI backend
│   ├── server.py         # Main API application
│   ├── requirements.txt  # Python dependencies
│   └── .env             # Environment variables
├── frontend/             # React frontend
│   ├── src/
│   │   ├── App.js       # Main dashboard component
│   │   ├── index.js     # Entry point
│   │   └── index.css    # Tailwind styles
│   ├── public/
│   ├── package.json     # Node dependencies
│   └── .env            # Frontend config
├── database_schema.sql  # Database setup script
├── SETUP_GUIDE.md      # Detailed setup instructions
└── README.md           # This file
```

## 🚀 Quick Start

### 1. Create Database Table

**⚠️ IMPORTANT: You must create the database table before the system will work!**

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click **SQL Editor**
4. Copy the SQL from `/app/database_schema.sql`
5. Paste and click **Run**

### 2. Verify Services are Running

Both backend and frontend are already running via supervisor:

```bash
# Check status
sudo supervisorctl status

# You should see:
# backend    RUNNING
# frontend   RUNNING
```

### 3. Access the Application

- **Frontend Dashboard**: https://glomopay--ai-powered-regulatory-monitoring-tool.preview.emergentagent.com
- **Backend API**: https://glomopay--ai-powered-regulatory-monitoring-tool.preview.emergentagent.com/api/
- **API Docs**: See SETUP_GUIDE.md

### 4. Test the System

```bash
# Health check
curl https://glomopay--ai-powered-regulatory-monitoring-tool.preview.emergentagent.com/api/health

# Should return: "status": "healthy" (after creating database table)
```

## 📊 Layer 1 Features

### ✅ Data Ingestion
- Webhook endpoint for n8n integration
- Single update and batch processing
- URL-based automatic deduplication
- Manual data entry via UI

### ✅ Data Storage
- Supabase PostgreSQL database
- Unique constraint on URLs
- Indexed for performance
- Ready for AI processing (Layer 2)

### ✅ API Endpoints
- `/api/ingest` - Webhook for n8n
- `/api/regulatory-updates` - CRUD operations
- `/api/stats` - Dashboard statistics
- `/api/health` - Service monitoring

### ✅ Frontend Dashboard
- View all regulatory updates
- Filter by source (RBI/SEBI)
- Manual data entry form
- Real-time statistics
- n8n integration guide

## 🔌 n8n Integration

### Webhook URL
```
POST https://glomopay--ai-powered-regulatory-monitoring-tool.preview.emergentagent.com/api/ingest
```

### Request Format (Single Update)
```json
{
  "title": "RBI Circular on FEMA Updates",
  "url": "https://rbi.org.in/circular/12345",
  "source": "RBI",
  "published_at": "2024-01-15",
  "summary": "Brief summary...",
  "raw_content": "Full content for AI processing..."
}
```

### Request Format (Batch)
```json
{
  "updates": [
    { "title": "...", "url": "...", "source": "RBI", ... },
    { "title": "...", "url": "...", "source": "SEBI", ... }
  ]
}
```

**See SETUP_GUIDE.md for complete n8n integration instructions.**

## 📚 Documentation

- **SETUP_GUIDE.md** - Complete setup and usage guide
- **database_schema.sql** - Database schema and creation script
- **API Documentation** - Available in SETUP_GUIDE.md

## 🗄️ Database Schema

**Table: `regulatory_updates`**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Unique identifier |
| `title` | TEXT | Update title |
| `url` | TEXT (UNIQUE) | Source URL (deduplication key) |
| `source` | TEXT | RBI, SEBI, etc. |
| `published_at` | TIMESTAMPTZ | Publication date |
| `summary` | TEXT | Brief summary |
| `raw_content` | TEXT | Full content for AI |
| `created_at` | TIMESTAMPTZ | Ingestion timestamp |
| `is_processed` | BOOLEAN | AI processing status |

## 🔐 Environment Configuration

### Backend (.env)
```
SUPABASE_URL=https://fqnprailkyqxbreqzmoj.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGci...
```

### Frontend (.env)
```
REACT_APP_BACKEND_URL=https://glomopay--ai-powered-regulatory-monitoring-tool.preview.emergentagent.com
```

## 🧪 Testing

```bash
# Test webhook with sample data
curl -X POST https://glomopay--ai-powered-regulatory-monitoring-tool.preview.emergentagent.com/api/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test RBI Update",
    "url": "https://rbi.org.in/test/123",
    "source": "RBI",
    "summary": "Test summary"
  }'

# Get all updates
curl https://glomopay--ai-powered-regulatory-monitoring-tool.preview.emergentagent.com/api/regulatory-updates

# Get statistics
curl https://glomopay--ai-powered-regulatory-monitoring-tool.preview.emergentagent.com/api/stats
```

## 🏗️ System Architecture

### Layer 1: Data Ingestion (✅ COMPLETE)
- Data collection via n8n workflows
- Storage in Supabase
- Deduplication handling
- Manual entry capability

### Layer 2: AI Processing (🔜 NEXT)
- Classification and categorization
- Summarization
- Affected parties identification
- Urgency level assignment

### Layer 3: UI Dashboard (🔜 FUTURE)
- Enhanced compliance dashboard
- Detailed insights display
- Search and filtering

### Layer 4: Advanced Features (🔜 FUTURE)
- Alerts and notifications
- Team collaboration
- Priority management

## 🛠️ Tech Stack

- **Backend**: FastAPI, Python 3.11
- **Frontend**: React 18, Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Supervisor, Nginx
- **Data Pipeline**: n8n (external)

## 📝 Next Steps

1. **Create Database Table** - Run the SQL script in Supabase
2. **Configure n8n Workflows** - Set up data scraping for RBI
3. **Test Data Ingestion** - Send test data via webhook
4. **Monitor Dashboard** - Verify data appears in UI
5. **Prepare for Layer 2** - AI processing implementation

## 🐛 Troubleshooting

### Database Not Connected
- Ensure you've created the table in Supabase
- Check credentials in `/app/backend/.env`
- Test with: `curl .../api/health`

### Frontend Not Loading
- Check browser console for errors
- Verify backend URL in `/app/frontend/.env`
- Check logs: `tail -f /var/log/supervisor/frontend.out.log`

### Webhook Not Working
- Verify URL and request format
- Check backend logs: `tail -f /var/log/supervisor/backend.err.log`
- Test with curl command first

## 📞 Support

For detailed documentation, see **SETUP_GUIDE.md**

---

**Layer 1 Status**: ✅ Production Ready

**Last Updated**: 2026-04-07
