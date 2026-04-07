"""
Database Setup Script for Supabase
This script creates the regulatory_updates table automatically
"""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

print("════════════════════════════════════════════════════════════════")
print("🗄️  Supabase Database Setup Script")
print("════════════════════════════════════════════════════════════════")
print()

# Method 1: Get PostgreSQL Connection String
print("📋 To create tables automatically, I need your PostgreSQL connection string.")
print()
print("🔑 How to get it:")
print("   1. Go to: https://app.supabase.com")
print("   2. Select your project: fqnprailkyqxbreqzmoj")
print("   3. Click 'Project Settings' (gear icon) in left sidebar")
print("   4. Click 'Database' tab")
print("   5. Scroll down to 'Connection string' section")
print("   6. Select 'URI' tab")
print("   7. Copy the connection string")
print("      It looks like: postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres")
print()
print("📝 Once you have it, you can:")
print("   Option A: Run this script and paste the connection string when prompted")
print("   Option B: Add it to .env file as: DATABASE_URL=postgresql://...")
print()

# Check if DATABASE_URL exists
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    print("✅ Found DATABASE_URL in environment")
    print()
    
    try:
        import psycopg2
        print("📦 psycopg2 is installed")
    except ImportError:
        print("📦 Installing psycopg2-binary...")
        os.system("pip install psycopg2-binary")
        import psycopg2
    
    try:
        print("🔌 Connecting to database...")
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        print("📝 Creating regulatory_updates table...")
        
        # Create table
        cursor.execute("""
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
        """)
        
        # Create indexes
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_regulatory_updates_source 
                ON regulatory_updates(source);
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_regulatory_updates_created_at 
                ON regulatory_updates(created_at DESC);
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_regulatory_updates_is_processed 
                ON regulatory_updates(is_processed);
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_regulatory_updates_published_at 
                ON regulatory_updates(published_at DESC);
        """)
        
        # Add comments
        cursor.execute("""
            COMMENT ON TABLE regulatory_updates IS 
                'Stores regulatory updates from various sources (RBI, SEBI, etc.)';
        """)
        
        conn.commit()
        
        print("✅ Table created successfully!")
        print()
        
        # Verify
        cursor.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'regulatory_updates'
            ORDER BY ordinal_position;
        """)
        
        print("📊 Table structure:")
        print("-" * 60)
        for row in cursor.fetchall():
            print(f"   {row[0]:20} {row[1]:20} Nullable: {row[2]}")
        print("-" * 60)
        print()
        
        cursor.close()
        conn.close()
        
        print("✅ Database setup complete!")
        print("🚀 You can now start using the system!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print()
        print("💡 If the connection failed, verify:")
        print("   1. The DATABASE_URL is correct")
        print("   2. Your Supabase project is active")
        print("   3. You have network connectivity")

else:
    print("❌ DATABASE_URL not found in environment")
    print()
    print("📝 Please follow these steps:")
    print()
    print("STEP 1: Get your PostgreSQL connection string")
    print("   → Go to https://app.supabase.com")
    print("   → Project Settings → Database → Connection string → URI")
    print()
    print("STEP 2: Add it to .env file")
    print("   → Edit: /app/backend/.env")
    print("   → Add line: DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres")
    print()
    print("STEP 3: Run this script again")
    print("   → python /app/backend/setup_database.py")
    print()
    print("OR manually paste it here:")
    
    try:
        connection_string = input("Paste your PostgreSQL connection string: ").strip()
        
        if connection_string:
            # Save to .env
            with open("/app/backend/.env", "a") as f:
                f.write(f"\nDATABASE_URL={connection_string}\n")
            
            print("✅ Saved to .env file!")
            print("🔄 Please run this script again: python /app/backend/setup_database.py")
    except:
        print("⏭️  Skipping interactive input")

print()
print("════════════════════════════════════════════════════════════════")
