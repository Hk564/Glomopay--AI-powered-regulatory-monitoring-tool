#!/bin/bash

echo "════════════════════════════════════════════════════════════════"
echo "🧪 Testing Layer 1: Data Ingestion System"
echo "════════════════════════════════════════════════════════════════"
echo ""

BASE_URL="https://glomopay--ai-powered-regulatory-monitoring-tool.preview.emergentagent.com"

echo "1️⃣  Testing Service Status..."
echo "────────────────────────────────────────────────────────────────"
curl -s "$BASE_URL/" | python3 -m json.tool
echo ""
echo ""

echo "2️⃣  Testing Health Check..."
echo "────────────────────────────────────────────────────────────────"
curl -s "$BASE_URL/api/health" | python3 -m json.tool
echo ""
echo ""

echo "3️⃣  Testing Webhook - Single Update..."
echo "────────────────────────────────────────────────────────────────"
curl -s -X POST "$BASE_URL/api/ingest" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test RBI Circular - FEMA Regulations Update",
    "url": "https://rbi.org.in/test/circular/001",
    "source": "RBI",
    "published_at": "2024-01-15T10:00:00Z",
    "summary": "This is a test regulatory update for FEMA compliance requirements.",
    "raw_content": "Full content of the RBI circular regarding Foreign Exchange Management Act updates. This content will be used for AI processing in Layer 2."
  }' | python3 -m json.tool
echo ""
echo ""

echo "4️⃣  Testing Deduplication (Same URL Again)..."
echo "────────────────────────────────────────────────────────────────"
curl -s -X POST "$BASE_URL/api/ingest" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Duplicate Test - Same URL",
    "url": "https://rbi.org.in/test/circular/001",
    "source": "RBI",
    "published_at": "2024-01-15T10:00:00Z",
    "summary": "This should be marked as duplicate"
  }' | python3 -m json.tool
echo ""
echo ""

echo "5️⃣  Testing Batch Updates..."
echo "────────────────────────────────────────────────────────────────"
curl -s -X POST "$BASE_URL/api/ingest" \
  -H "Content-Type: application/json" \
  -d '{
    "updates": [
      {
        "title": "SEBI Circular on Insider Trading Regulations",
        "url": "https://sebi.gov.in/test/circular/001",
        "source": "SEBI",
        "published_at": "2024-01-20T14:30:00Z",
        "summary": "New guidelines for insider trading disclosure requirements.",
        "raw_content": "Complete text of SEBI circular on insider trading regulations..."
      },
      {
        "title": "RBI Guidelines on Digital Lending",
        "url": "https://rbi.org.in/test/circular/002",
        "source": "RBI",
        "published_at": "2024-01-22T09:00:00Z",
        "summary": "Updated guidelines for digital lending platforms and regulations.",
        "raw_content": "Full content of RBI guidelines on digital lending practices..."
      }
    ]
  }' | python3 -m json.tool
echo ""
echo ""

echo "6️⃣  Getting All Updates..."
echo "────────────────────────────────────────────────────────────────"
curl -s "$BASE_URL/api/regulatory-updates?limit=10" | python3 -m json.tool
echo ""
echo ""

echo "7️⃣  Getting Statistics..."
echo "────────────────────────────────────────────────────────────────"
curl -s "$BASE_URL/api/stats" | python3 -m json.tool
echo ""
echo ""

echo "8️⃣  Filtering by Source (RBI only)..."
echo "────────────────────────────────────────────────────────────────"
curl -s "$BASE_URL/api/regulatory-updates?source=RBI&limit=5" | python3 -m json.tool
echo ""
echo ""

echo "9️⃣  Filtering by Processing Status (Unprocessed only)..."
echo "────────────────────────────────────────────────────────────────"
curl -s "$BASE_URL/api/regulatory-updates?is_processed=false&limit=5" | python3 -m json.tool
echo ""
echo ""

echo "════════════════════════════════════════════════════════════════"
echo "✅ Testing Complete!"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "📊 Next Steps:"
echo "   1. Check the dashboard at: $BASE_URL"
echo "   2. Try the Manual Entry tab to add updates via UI"
echo "   3. Configure your n8n workflows to use the webhook endpoint"
echo ""
echo "🔗 Webhook Endpoint: $BASE_URL/api/ingest"
echo ""
