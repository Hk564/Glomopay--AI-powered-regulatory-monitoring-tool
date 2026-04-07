# 🔌 How to Connect to Supabase & Create Tables Automatically

## Two Methods Available:

---

## ⚡ METHOD 1: Automatic Setup (Recommended)

I can create the table for you automatically! Just follow these steps:

### Step 1: Get Your PostgreSQL Connection String

1. **Go to Supabase Dashboard**
   ```
   https://app.supabase.com
   ```

2. **Select your project**: `fqnprailkyqxbreqzmoj`

3. **Navigate to Database Settings**
   - Click the **⚙️ Settings** icon in the left sidebar
   - Click **Database** tab

4. **Find Connection String**
   - Scroll down to **"Connection string"** section
   - Click the **"URI"** tab (not Transaction or Session)
   - You'll see something like:
     ```
     postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
     ```

5. **Copy the connection string**
   - Click the **Copy** button
   - ⚠️ **IMPORTANT**: Replace `[YOUR-PASSWORD]` with your actual database password
   - If you don't know your password, click "Reset Database Password" first

### Step 2: Provide the Connection String

**Option A: Paste it directly (Quick)**

Run this command and paste when prompted:
```bash
cd /app/backend
python setup_database.py
```

**Option B: Add to .env file (Permanent)**

1. Edit the backend .env file:
```bash
nano /app/backend/.env
```

2. Add this line (replace with your actual connection string):
```
DATABASE_URL=postgresql://postgres.xxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

3. Save and exit (Ctrl+X, then Y, then Enter)

4. Run the setup script:
```bash
cd /app/backend
python setup_database.py
```

### Step 3: Verify

You should see:
```
✅ Table created successfully!
📊 Table structure:
   id                   uuid                 Nullable: NO
   title                text                 Nullable: NO
   url                  text                 Nullable: NO
   ...
✅ Database setup complete!
🚀 You can now start using the system!
```

---

## 📝 METHOD 2: Manual Setup (Copy-Paste SQL)

If you prefer to create the table manually in Supabase UI:

### Step 1: Open SQL Editor

1. Go to https://app.supabase.com
2. Select project: `fqnprailkyqxbreqzmoj`
3. Click **SQL Editor** in left sidebar
4. Click **New Query**

### Step 2: Run the SQL

Copy this SQL and paste it in the editor:

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
CREATE INDEX IF NOT EXISTS idx_regulatory_updates_source ON regulatory_updates(source);
CREATE INDEX IF NOT EXISTS idx_regulatory_updates_created_at ON regulatory_updates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_regulatory_updates_is_processed ON regulatory_updates(is_processed);
CREATE INDEX IF NOT EXISTS idx_regulatory_updates_published_at ON regulatory_updates(published_at DESC);

-- Add comments for documentation
COMMENT ON TABLE regulatory_updates IS 'Stores regulatory updates from various sources (RBI, SEBI, etc.)';
COMMENT ON COLUMN regulatory_updates.url IS 'Unique URL - used for deduplication';
COMMENT ON COLUMN regulatory_updates.is_processed IS 'Flag for Layer 2 AI processing status';
COMMENT ON COLUMN regulatory_updates.raw_content IS 'Full content for AI processing in Layer 2';
```

### Step 3: Click "RUN" (or press Cmd/Ctrl + Enter)

You should see: **"Success. No rows returned"**

### Step 4: Verify in Table Editor

1. Click **Table Editor** in left sidebar
2. You should see **regulatory_updates** table
3. Click on it to see the structure

---

## 🧪 Test the Connection

After creating the table (using either method), test it:

```bash
# Test health endpoint
curl https://glomopay--ai-powered-regulatory-monitoring-tool.preview.emergentagent.com/api/health

# Should return:
# {
#   "status": "healthy",
#   "database": "connected",
#   "timestamp": "..."
# }
```

Or test by adding a record:

```bash
bash /app/test_system.sh
```

---

## 🔍 Where to Find Your Database Password

If you forgot your database password:

1. Go to **Project Settings** → **Database**
2. Find **"Database Password"** section
3. Click **"Reset Database Password"**
4. Copy the new password
5. Use it in your connection string: `postgresql://postgres.[ref]:[NEW-PASSWORD]@...`

---

## 💡 Quick Reference

### What You Need:
- **Supabase URL**: ✅ Already configured
- **Service Role Key**: ✅ Already configured
- **Database Password**: ⚠️ You need to provide this

### Connection String Format:
```
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@[HOST]:6543/postgres
```

### Example:
```
postgresql://postgres.fqnprailkyqxbreqzmoj:MySecurePass123!@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

---

## ✅ Next Steps After Table Creation

1. **Test the system**: `bash /app/test_system.sh`
2. **Access dashboard**: https://glomopay--ai-powered-regulatory-monitoring-tool.preview.emergentagent.com
3. **Add test data**: Use Manual Entry tab or curl commands
4. **Configure n8n**: Set up workflows to send to `/api/ingest`

---

## 🆘 Troubleshooting

### "Could not find table"
- Table hasn't been created yet
- Run METHOD 1 or METHOD 2 above

### "Connection refused" or "Authentication failed"
- Check your database password is correct
- Verify the connection string format
- Ensure your Supabase project is active

### "Permission denied"
- Use the correct service role key (already configured)
- Or use the database password for direct connection

---

**Choose Method 1 for automatic setup, or Method 2 if you prefer manual control!**
