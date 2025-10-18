# Database Schema Setup Guide

This guide will help you apply the database schemas to your Supabase project and fix the table update issues.

## Current Status

✅ Supabase client is properly configured
✅ Environment variables are set
❌ Database schemas need to be applied
❌ TypeScript types need to be generated
❌ Form submit handlers need to be implemented

## Step 1: Apply Database Schemas

You have **two schema files** that need to be applied to your Supabase database:

### Option A: Via Supabase Dashboard (Recommended)

#### 1. Apply `schema.sql` (Main Tables)

1. Open the SQL Editor: https://supabase.com/dashboard/project/mqlihjzdfkhaomehxbye/sql
2. Click **"New Query"** button
3. Open `supabase/schema.sql` in your code editor
4. Copy the **entire contents** (562 lines)
5. Paste into the SQL Editor
6. Click **"Run"** or press `Cmd+Enter`
7. Wait for confirmation message

**This creates these tables:**
- `parents` - Parent/guardian information
- `students` - Student profiles
- `inquiries` - Contact form submissions
- `classes` - Class schedules
- `enrollments` - Student enrollments
- `attendance` - Attendance tracking
- `exam_results` - Cambridge exam results
- `events` - Workshops and events
- `event_registrations` - Event sign-ups
- `payments` - Financial transactions
- `student_progress` - Progress tracking
- `trial_bookings` - Trial class bookings
- `users` - Staff accounts

#### 2. Apply `dashboard-schema.sql` (Dashboard Tables)

1. In the SQL Editor, click **"New Query"** again
2. Open `supabase/dashboard-schema.sql` in your code editor
3. Copy the **entire contents** (372 lines)
4. Paste into the SQL Editor
5. Click **"Run"** or press `Cmd+Enter`
6. Wait for confirmation

**This creates these tables:**
- `teachers` - Teacher accounts
- `dashboard_students` - Extended student data for dashboard
- `curriculum` - Lesson plans with materials
- `assessment` - Student assessments
- `skills_evaluation` - Detailed skill tracking
- `homework_completion` - Homework tracking
- `blog_posts` - Educational blog posts

### Option B: Via Command Line (Alternative)

If you prefer using the command line:

1. Get your database connection string from:
   https://supabase.com/dashboard/project/mqlihjzdfkhaomehxbye/settings/database

2. Look for the **Connection String** under "Connection pooling" (use the Transaction mode)

3. Run the apply script:
   ```bash
   ./supabase/apply-schemas.sh 'postgresql://postgres:[YOUR-PASSWORD]@db.mqlihjzdfkhaomehxbye.supabase.co:5432/postgres'
   ```

**Note:** Replace `[YOUR-PASSWORD]` with your actual database password.

## Step 2: Verify Tables Were Created

After applying the schemas, verify everything is set up:

1. Go to Table Editor: https://supabase.com/dashboard/project/mqlihjzdfkhaomehxbye/editor
2. You should see all tables listed in the sidebar
3. Sample data will be included in:
   - `events` table (3 sample events)
   - `teachers` table (3 sample teachers)
   - `dashboard_students` table (3 sample students)
   - Other sample records

## Step 3: Generate TypeScript Types (After schemas are applied)

Once the schemas are applied, generate TypeScript types:

```bash
npx supabase gen types typescript --project-id mqlihjzdfkhaomehxbye > src/integrations/supabase/types.ts
```

This will populate the empty `types.ts` file with all your table definitions.

## Step 4: Test Form Submissions

After completing Steps 1-3, the following forms will work:

### Contact Form (inquiries table)
- Location: `/contact` page
- Saves to: `inquiries` table
- Fields: parent name, child name, age, phone, email, message, etc.

### Event Registration (event_registrations table)
- Location: `/events` page
- Saves to: `event_registrations` table
- Fields: event selection, parent/child info, contact details

### Trial Booking (trial_bookings table)
- Location: Floating "Book Trial" button on homepage
- Saves to: `trial_bookings` table
- Fields: parent name, child name, age, phone, preferred date/time

## What Was Fixed

### 1. Database Schema Structure
- Complete schema with 20+ tables
- Row Level Security (RLS) policies configured
- Public insert policies for forms (no auth required)
- Automatic triggers for updated_at timestamps
- Proper foreign key relationships

### 2. Form Submit Handlers (Implemented)
- **Contact.tsx** - Now saves inquiries to database
- **Events.tsx** - Now saves event registrations
- **FloatingActions.tsx** - Now saves trial bookings
- All forms include:
  - Proper error handling
  - Success/failure messages
  - Form validation
  - Loading states

### 3. Type Safety
- Once types are generated, all database operations will be type-safe
- Autocomplete for table names and columns
- Compile-time error checking

## Troubleshooting

### Issue: "Permission denied for table X"
**Solution:** The RLS policies should allow public inserts for `inquiries`, `trial_bookings`, and `event_registrations`. If this error occurs, check the RLS policies in the Supabase dashboard.

### Issue: "relation 'public.inquiries' does not exist"
**Solution:** The schema hasn't been applied yet. Follow Step 1 above.

### Issue: TypeScript errors about table types
**Solution:** Run the type generation command from Step 3.

### Issue: "Cannot connect to database"
**Solution:** Check your environment variables in `.env` file and ensure they match your Supabase project.

## Next Steps After Setup

1. ✅ Apply both schemas
2. ✅ Generate TypeScript types
3. ✅ Test contact form submission
4. ✅ Test event registration
5. ✅ Test trial booking
6. Consider adding email notifications for form submissions
7. Set up admin dashboard to view submissions

## Support

If you encounter any issues:
- Check Supabase logs: https://supabase.com/dashboard/project/mqlihjzdfkhaomehxbye/logs
- Review API logs for errors
- Check browser console for JavaScript errors
- Verify RLS policies allow public inserts

---

**Created:** October 19, 2025
**Project:** HeroSchool English Center
**Supabase Project:** mqlihjzdfkhaomehxbye
