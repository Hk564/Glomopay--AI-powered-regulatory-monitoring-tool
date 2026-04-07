"""
Alternative Database Setup using Supabase REST API
This uses the service role key to execute SQL via Supabase's REST API
"""
import os
import requests
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

print("════════════════════════════════════════════════════════════════")
print("🗄️  Creating Database Table via Supabase REST API")
print("════════════════════════════════════════════════════════════════")
print()

# SQL to create the table
create_table_sql = """
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

CREATE INDEX IF NOT EXISTS idx_regulatory_updates_source ON regulatory_updates(source);
CREATE INDEX IF NOT EXISTS idx_regulatory_updates_created_at ON regulatory_updates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_regulatory_updates_is_processed ON regulatory_updates(is_processed);
CREATE INDEX IF NOT EXISTS idx_regulatory_updates_published_at ON regulatory_updates(published_at DESC);
"""

print("📝 SQL to execute:")
print("-" * 60)
print(create_table_sql[:200] + "...")
print("-" * 60)
print()

# Try using Supabase RPC or direct query endpoint
print("🔌 Attempting to create table...")

# Use PostgREST SQL function if available
headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

# First, let's test if we can connect to Supabase at all
try:
    test_response = requests.get(
        f"{SUPABASE_URL}/rest/v1/",
        headers=headers,
        timeout=10
    )
    print(f"✅ Supabase API connection successful (Status: {test_response.status_code})")
    print()
except Exception as e:
    print(f"❌ Failed to connect to Supabase API: {e}")
    print()
    exit(1)

# Since we can't execute arbitrary SQL via REST API without special setup,
# let's inform the user they need to use the Supabase UI
print("⚠️  Note: Direct SQL execution requires database connection or Supabase UI")
print()
print("📋 RECOMMENDED APPROACH:")
print()
print("Since direct PostgreSQL connection isn't available from this environment,")
print("please use Supabase's SQL Editor in the UI:")
print()
print("1. Go to: https://app.supabase.com/project/fqnprailkyqxbreqzmoj/sql")
print("2. Click 'New Query'")
print("3. Copy and paste the SQL from: /app/database_schema.sql")
print("4. Click 'RUN' (or press Cmd/Ctrl + Enter)")
print()
print("The SQL script is ready at: /app/database_schema.sql")
print()
print("════════════════════════════════════════════════════════════════")
