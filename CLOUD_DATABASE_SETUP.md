# Cloud Database Setup Guide

## Your Supabase Instance
- **Project ID**: mqlihjzdfkhaomehxbye
- **URL**: https://mqlihjzdfkhaomehxbye.supabase.co
- **Dashboard**: https://supabase.com/dashboard/project/mqlihjzdfkhaomehxbye

## Step-by-Step Instructions

### Step 1: Access Supabase Dashboard
1. Go to: **https://supabase.com/dashboard/project/mqlihjzdfkhaomehxbye**
2. Login to your Supabase account

### Step 2: Open SQL Editor
1. In the left sidebar, click on **"SQL Editor"**
2. Click **"New Query"**

### Step 3: Run Schemas in Order

**IMPORTANT**: Run these files **ONE AT A TIME** in this exact order:

#### 3.1 Run Main Schema
1. Open the file: `supabase/schema.sql`
2. Copy **ALL** the content
3. Paste it into the SQL Editor
4. Click **"Run"** button (or press Cmd/Ctrl + Enter)
5. Wait for success message ✅

#### 3.2 Run Dashboard Schema
1. Open the file: `supabase/dashboard-schema.sql`
2. Copy **ALL** the content
3. Paste it into a **new query** in SQL Editor
4. Click **"Run"**
5. Wait for success message ✅

#### 3.3 Run Enhanced Dashboard Schema
1. Open the file: `supabase/enhanced-dashboard-schema.sql`
2. Copy **ALL** the content
3. Paste it into a **new query** in SQL Editor
4. Click **"Run"**
5. Wait for success message ✅

#### 3.4 Run Seed Data
1. Open the file: `supabase/seed-data.sql`
2. Copy **ALL** the content
3. Paste it into a **new query** in SQL Editor
4. Click **"Run"**
5. Wait for success message ✅

### Step 4: Verify Data

1. In Supabase Dashboard, go to **"Table Editor"**
2. Check these tables have data:
   - `dashboard_students` - should have 8 students
   - `teachers` - should have 4 teachers
   - `skills_evaluation` - should have 24+ records
   - `assessment` - should have 5 assessments

### Step 5: Start Your Application

```bash
npm run dev
```

### Step 6: Test Login

Open http://localhost:5173 and login with:

**Student Account** (Most complete data):
- Email: `emma@student.com`
- Password: `student123`

**Teacher Account**:
- Email: `donald@heroschool.com`
- Password: `teacher123`

**Admin Account**:
- Email: `admin@heroschool.com`
- Password: `admin123`

## What You'll See

### Student Dashboard (emma@student.com)
- ✅ Profile photo and personal details
- ✅ 4 stat cards with progress bars
- ✅ Placement test results
- ✅ Skills radar chart
- ✅ 16 skills evaluations showing 4-month progression
- ✅ 2 assessments with teacher feedback
- ✅ Apple-style charts with grids

### Teacher Dashboard (donald@heroschool.com)
- ✅ Calendar with sessions
- ✅ My Classes list
- ✅ Student roster
- ✅ Assessment tools
- ✅ Skills evaluation interface
- ✅ Curriculum builder

### Admin Dashboard (admin@heroschool.com)
- ✅ System overview statistics
- ✅ Student directory
- ✅ Teacher profiles
- ✅ Class schedules
- ✅ Financial tracking
- ✅ Multiple charts and visualizations

## Troubleshooting

### Error: "relation already exists"
If you see this error, it means tables already exist. You can:
1. Drop all tables first (CAREFUL - this deletes everything):
   ```sql
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   ```
2. Then run the schemas again from Step 3

### Error: "permission denied"
Make sure you're running the queries in the SQL Editor, not the Table Editor.

### No data showing in dashboard
1. Verify seed data ran successfully
2. Check browser console for errors (F12)
3. Make sure you're logged in with correct credentials

### Can't login
The seed script creates user records in `dashboard_students` and `teachers` tables, but you may need to create actual Supabase Auth users. If login doesn't work:

1. Go to **Authentication** > **Users** in Supabase Dashboard
2. Click **"Add User"**
3. Add these users manually:
   - Email: emma@student.com, Password: student123
   - Email: donald@heroschool.com, Password: teacher123
   - Email: admin@heroschool.com, Password: admin123

## Alternative: Using Supabase CLI (if you have it installed)

If you have the Supabase CLI installed and linked to your project:

```bash
# Link to your cloud project
supabase link --project-ref mqlihjzdfkhaomehxbye

# Run migrations
supabase db push < supabase/schema.sql
supabase db push < supabase/dashboard-schema.sql
supabase db push < supabase/enhanced-dashboard-schema.sql
supabase db push < supabase/seed-data.sql
```

## Quick Access Links

- **Dashboard**: https://supabase.com/dashboard/project/mqlihjzdfkhaomehxbye
- **SQL Editor**: https://supabase.com/dashboard/project/mqlihjzdfkhaomehxbye/sql
- **Table Editor**: https://supabase.com/dashboard/project/mqlihjzdfkhaomehxbye/editor
- **Authentication**: https://supabase.com/dashboard/project/mqlihjzdfkhaomehxbye/auth/users

## Data Summary

After running all scripts, you'll have:
- 8 students with complete profiles
- 4 teachers with bios
- 5 active classes
- 24+ skills evaluations (showing progression)
- 5 assessments with rubrics
- Multiple attendance, payment, and event records
- All data fully connected and realistic

## Need Help?

If you encounter any issues:
1. Check the Supabase Dashboard logs
2. Open browser console (F12) for frontend errors
3. Verify all 4 SQL files ran successfully
4. Make sure Auth users are created for login
