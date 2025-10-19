# Database Seed Data Instructions

## Overview
This project includes a comprehensive seed data script that populates all tables with realistic, interconnected dummy data for testing and demonstration purposes.

## Quick Start

### Option 1: Using Supabase Studio (Recommended)
1. Open Supabase Studio in your browser (usually at `http://localhost:54323`)
2. Go to the **SQL Editor**
3. Run the schemas in this order:
   - `supabase/schema.sql`
   - `supabase/dashboard-schema.sql`
   - `supabase/enhanced-dashboard-schema.sql`
   - `supabase/seed-data.sql`

### Option 2: Using psql Command Line
```bash
# Navigate to project directory
cd /Users/donaldcjapi/Desktop/hero-ai-curriculum

# Apply schemas
psql $DATABASE_URL < supabase/schema.sql
psql $DATABASE_URL < supabase/dashboard-schema.sql
psql $DATABASE_URL < supabase/enhanced-dashboard-schema.sql
psql $DATABASE_URL < supabase/seed-data.sql
```

### Option 3: Using the Shell Script
```bash
./supabase/populate-all.sh
```

## What Gets Created

### Users & Authentication
- **4 Teachers**
  - donald@heroschool.com (password: teacher123)
  - sarah@heroschool.com (password: teacher123)
  - michael@heroschool.com (password: teacher123)
  - emily@heroschool.com (password: teacher123)

- **8 Students**
  - emma@student.com (password: student123)
  - liam@student.com (password: student123)
  - olivia@student.com (password: student123)
  - noah@student.com (password: student123)
  - ava@student.com (password: student123)
  - ethan@student.com (password: student123)
  - sophia@student.com (password: student123)
  - mason@student.com (password: student123)

- **1 Admin**
  - admin@heroschool.com (password: admin123)

### Sample Data Includes
- ✅ 8 Parents with contact information
- ✅ 8 Students with full profiles and photos
- ✅ 5 Classes with schedules and capacities
- ✅ 8 Enrollments linking students to classes
- ✅ Multiple attendance records
- ✅ 3 Curriculum lessons with materials
- ✅ 5 Assessments with detailed rubric scoring
- ✅ 24+ Skills evaluations tracking progress over time (Writing, Reading, Listening, Speaking)
- ✅ 5 Calendar sessions
- ✅ Payment records
- ✅ 2 Cambridge exam results
- ✅ 5 Events (camps, exams, competitions)
- ✅ 2 Blog posts
- ✅ 3 Assignments
- ✅ 3 Student notifications
- ✅ 2 Inquiries
- ✅ 2 Trial bookings

## Data Relationships

The seed data is fully connected:
- Students are linked to parents
- Students are enrolled in classes
- Skills evaluations show progress over 4 months (Feb-May 2025)
- Assessments are published and visible to students
- Attendance is tracked for calendar sessions
- Payments reference enrollments
- All foreign keys are properly connected

## Student Dashboard Features

### Emma Nguyen (emma@student.com)
Emma has the most complete data set with:
- ✅ Profile photo and complete bio
- ✅ 16 skills evaluations across all 4 categories showing progression
- ✅ 2 published assessments with feedback
- ✅ Attendance records
- ✅ Placement test scores
- ✅ Cambridge Starters exam result (14/15 shields)

### Liam Tran (liam@student.com)
Liam has:
- ✅ 16 skills evaluations showing improvement
- ✅ 2 published assessments
- ✅ Attendance records
- ✅ Cambridge Movers exam result (12/15 shields)

## Visualizations Included

### Student Dashboard
1. **Profile Card** - Photo, name, age, location, contact
2. **Stats Cards** - Attendance, sessions, level, performance with progress bars
3. **Placement Test Results** - Initial skill assessment
4. **Skills Radar Chart** - Overall performance across 4 categories
5. **Skills Progress Line Chart** - Apple-style chart with grid, showing trends over time
6. **Assessment Bar Chart** - Rubric breakdown with rounded bars
7. **Attendance Pie Chart** - Present vs absent visualization

### Teacher Dashboard
- Class lists with student details
- Assessment creation and management
- Skills evaluation interface
- Curriculum builder
- Calendar with sessions

### Admin Dashboard (To Be Created)
- System overview
- User management
- Reports and analytics

## Notes

### Data Timeline
- Enrollment Date: January 10, 2025
- Skills Evaluations: February 15 - May 15, 2025 (monthly progression)
- Assessments: May 15 & May 28, 2025
- Events: June-October 2025

### Score Scale
- All skills and assessments use a 0-5 point scale
- Progress shows realistic improvement over time
- Emma's scores: 3.5 → 4.6 (26% improvement)
- Liam's scores: 3.4 → 4.2 (23% improvement)

## Troubleshooting

### Error: Table already exists
If you see errors about existing tables:
```sql
-- Run this to drop all tables first (CAUTION: This deletes all data!)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

### Error: Foreign key constraint
Make sure to run the schemas in the correct order:
1. schema.sql (creates base tables)
2. dashboard-schema.sql (creates dashboard tables)
3. enhanced-dashboard-schema.sql (creates enhanced features)
4. seed-data.sql (populates data)

### Missing data in dashboard
1. Check that you're logged in as emma@student.com or liam@student.com
2. Verify the seed script completed without errors
3. Check browser console for any fetch errors

## Next Steps

After seeding the database:
1. Start the development server: `npm run dev`
2. Login as a student to see the enhanced dashboard
3. Login as a teacher to manage students and assessments
4. Explore the data visualizations and charts

## Apple-Style Chart Features

The charts now include:
- ✅ Clean horizontal grid lines (no vertical lines)
- ✅ No tick lines, only subtle axis lines
- ✅ Gray subtle colors (#e5e7eb for grid, #6b7280 for text)
- ✅ Proper 0-5 scale for all educational metrics
- ✅ Rounded bars with radius
- ✅ Smooth line charts with prominent dots
- ✅ Dynamic and responsive design
