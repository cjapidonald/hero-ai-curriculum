# 🚀 Complete Guide: Push Local Database to Remote

## 📋 Table of Contents
1. [Understanding the Flow](#understanding-the-flow)
2. [Method 1: Migrations (Recommended)](#method-1-migrations-recommended)
3. [Method 2: Data Dump & Restore](#method-2-data-dump--restore)
4. [Setup Donald Chapman in Remote](#setup-donald-chapman-in-remote)
5. [Best Practices](#best-practices)

---

## 🔄 Understanding the Flow

```
┌──────────────────────┐
│  LOCAL Database      │  Your laptop (Docker)
│  127.0.0.1:54322     │  ← Development & Testing
└──────────┬───────────┘
           │
           │ Migration Files
           │ (SQL scripts)
           │
           ↓
┌──────────────────────┐
│  Migration System    │  Tracks what's been applied
│  supabase db push    │  ← Safe, version-controlled
└──────────┬───────────┘
           │
           ↓
┌──────────────────────┐
│  REMOTE Database     │  Supabase Cloud
│  xyz.supabase.co     │  ← Production (Real users)
└──────────────────────┘
```

**Key Concept:**
- **Migrations** = SQL files that change schema (CREATE TABLE, ALTER, etc.)
- **Data** = Actual records (INSERT, UPDATE, etc.)
- Migrations sync **structure**, not necessarily **data**

---

## 📦 Method 1: Migrations (RECOMMENDED)

### What Are Migrations?

Migrations are SQL files in `supabase/migrations/` that:
- Create tables
- Add columns
- Create functions/triggers
- Set up RLS policies

### Step-by-Step Process

#### **1. Link to Remote Project**

```bash
# Link your local project to remote
supabase link --project-ref mqlihjzdfkhaomehxbye

# Verify link
supabase status
```

#### **2. Check Pending Migrations**

```bash
# See which migrations need to be pushed
supabase migration list --linked
```

**Output example:**
```
Local          | Remote         | Time (UTC)
---------------|----------------|--------------------
20251023000000 | 20251023000000 | 2025-10-23 00:00:00  ✅ Applied
20251024000000 |                | 2025-10-24 00:00:00  ⚠️ Pending
20251116000000 |                | 2025-11-16 00:00:00  ⚠️ Pending
```

#### **3. Push Migrations to Remote**

```bash
# Push only new migrations
supabase db push --linked

# OR push ALL migrations (including historical)
supabase db push --linked --include-all
```

**What happens:**
1. Reads migration files from `supabase/migrations/`
2. Checks which ones haven't been applied to remote
3. Applies them in chronological order
4. Updates migration tracking table

#### **4. Verify Success**

```bash
# Check migration list again
supabase migration list --linked

# Should show all migrations applied remotely
```

---

## 💾 Method 2: Data Dump & Restore

### When to Use This?

When you want to copy **actual data** (not just schema):
- Test data
- Seed data
- Development records

### ⚠️ **WARNING: This will OVERWRITE remote data!**

### Step-by-Step Process

#### **1. Dump Local Database**

```bash
# Dump entire local database
supabase db dump --local > local_dump.sql

# OR dump specific table
supabase db dump --local --data-only -t teachers > teachers_data.sql
```

#### **2. Review the Dump**

```bash
# Check what's in the dump
head -50 local_dump.sql

# Make sure it looks correct!
```

#### **3. Restore to Remote**

**Option A: Via Supabase Dashboard**
1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
2. Copy contents of `local_dump.sql`
3. Paste and click "Run"

**Option B: Via psql**
```bash
# Get your remote database URL from Supabase Dashboard
# Settings → Database → Connection String (Transaction)

psql "YOUR_REMOTE_DATABASE_URL" < local_dump.sql
```

---

## 🎯 Method 3: Selective Data Copy

### Copy Specific Records

#### **Export from Local**

```bash
# Connect to local
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres"

# Export specific data
\copy teachers TO 'teachers.csv' CSV HEADER
\copy curriculum TO 'curriculum.csv' CSV HEADER
```

#### **Import to Remote**

```bash
# Connect to remote (get URL from Supabase Dashboard)
psql "YOUR_REMOTE_URL"

# Import data
\copy teachers FROM 'teachers.csv' CSV HEADER
\copy curriculum FROM 'curriculum.csv' CSV HEADER
```

---

## 👨‍🏫 Setup Donald Chapman in Remote

Since **Donald Chapman** (UUID: `389ea82c`) exists in **REMOTE**, not local:

### **Option 1: Run SQL Script in Supabase Dashboard** ✅ EASIEST

1. **Open Supabase Dashboard:**
   - Go to: https://supabase.com/dashboard/project/mqlihjzdfkhaomehxbye
   - Click: **SQL Editor** → **New Query**

2. **Open the script:**
   - File: `setup-donald-chapman-REMOTE.sql`
   - Copy **ALL** contents

3. **Paste and Run:**
   - Paste into SQL Editor
   - Click **"Run"** button
   - Wait for success messages

4. **Verify:**
   - Should see: "Created assignments for Donald Chapman"
   - Should see: "Total Sessions: 8"
   - Should see: "✅ SETUP COMPLETE!"

### **Option 2: Create Migration File** (More Professional)

```bash
# 1. Create new migration
cat > supabase/migrations/$(date +%Y%m%d%H%M%S)_setup_donald_chapman.sql << 'EOF'
-- Copy contents of setup-donald-chapman-REMOTE.sql here
EOF

# 2. Push to remote
supabase db push --linked
```

### **What This Does:**

Creates for Donald Chapman:
- ✅ 1 Class (English Excellence)
- ✅ 8 Curriculum items
- ✅ 8 Teacher assignments
- ✅ 8 Class sessions (via trigger or manual insert)

---

## 📚 Best Practices

### **DO:**

✅ **Always test locally first**
```bash
# Make changes locally
# Test thoroughly
# THEN push to remote
```

✅ **Use migrations for schema changes**
```bash
# Good for:
CREATE TABLE, ALTER TABLE, CREATE FUNCTION, etc.
```

✅ **Review before pushing**
```bash
# Check what will be pushed
supabase migration list --linked

# Review migration files
cat supabase/migrations/20251116000000_*.sql
```

✅ **Backup remote before big changes**
```bash
# Dump remote database first
supabase db dump --linked > remote_backup.sql
```

✅ **Use version control (git)**
```bash
git add supabase/migrations/
git commit -m "Add teacher curriculum sync"
git push
```

### **DON'T:**

❌ **Don't push untested migrations**
- Always test locally first!

❌ **Don't push data dumps without review**
- Can overwrite production data!

❌ **Don't skip backups**
- Always backup before major changes

❌ **Don't edit remote database directly**
- Use migrations for reproducibility

---

## 🔍 Troubleshooting

### **Problem: "Migration already exists remotely"**

**Solution:**
```bash
# Reset migration status
supabase migration repair --status reverted MIGRATION_ID

# Then push again
supabase db push --linked
```

### **Problem: "Permission denied"**

**Solution:**
```bash
# Re-login to Supabase
supabase login

# Re-link project
supabase link --project-ref mqlihjzdfkhaomehxbye
```

### **Problem: "Database connection failed"**

**Solution:**
```bash
# Check if remote is accessible
ping xyz.supabase.co

# Check if local is running
supabase status

# Restart local if needed
supabase stop
supabase start
```

---

## ✅ Quick Reference

### **Push Migrations:**
```bash
supabase db push --linked
```

### **Check Migration Status:**
```bash
supabase migration list --linked
```

### **Create New Migration:**
```bash
supabase db diff --local > supabase/migrations/new_feature.sql
```

### **Dump Local Database:**
```bash
supabase db dump --local > backup.sql
```

### **Reset Local Database:**
```bash
supabase db reset
```

---

## 🚀 Next Steps

1. **Run Donald Chapman setup:**
   - Open: `setup-donald-chapman-REMOTE.sql`
   - Copy to Supabase Dashboard SQL Editor
   - Run it!

2. **Verify it worked:**
   ```sql
   SELECT COUNT(*) FROM class_sessions
   WHERE teacher_id = '389ea82c-db4c-40be-aee0-6b39785813da';
   -- Should return 8
   ```

3. **Test Donald's login:**
   - Email: `donald@heroschool.com`
   - Password: `teacher123`
   - Check Curriculum tab → Should see 8 lessons!

4. **Push future changes:**
   ```bash
   # Always use migrations for reproducibility
   supabase db push --linked
   ```

---

## 📞 Need Help?

**Common Commands:**
- `supabase status` - Check what's running
- `supabase link` - Connect to remote
- `supabase db push` - Push migrations
- `supabase db dump` - Backup database
- `supabase db reset` - Reset local

**Files to Check:**
- `.env` - Which database your app connects to
- `supabase/config.toml` - Project configuration
- `supabase/migrations/` - All migration files

---

**Ready to go! Now run the SQL script for Donald Chapman!** 🚀
