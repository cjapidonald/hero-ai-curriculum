# HeroSchool Supabase Database Setup Guide

This guide will help you set up and configure the Supabase database for the HeroSchool English Center project.

## 🗄️ Database Overview

The HeroSchool database is designed to manage all aspects of an English language learning center, including:

- **Student Management** - Track students, parents, and their information
- **Class Management** - Organize classes, schedules, and enrollments
- **Cambridge Exams** - Record exam results with the shield system
- **Events** - Manage workshops, camps, and special events
- **Payments** - Track tuition and fees
- **Attendance** - Monitor student attendance
- **Progress Tracking** - AI-powered progress assessment
- **Inquiries & Trials** - Handle contact forms and trial bookings

## 📊 Database Schema

### Core Tables

1. **parents** - Parent/guardian information
2. **students** - Student profiles and status
3. **classes** - Class schedules and details
4. **enrollments** - Student class assignments
5. **attendance** - Daily attendance records
6. **exam_results** - Cambridge exam scores (shields)
7. **events** - Workshops, camps, and activities
8. **event_registrations** - Event sign-ups
9. **payments** - Financial transactions
10. **student_progress** - Skill assessments
11. **inquiries** - Contact form submissions
12. **trial_bookings** - Free trial class bookings
13. **users** - Staff/admin accounts

### Supporting Types (ENUMs)

- `english_level` - beginner, some_english, confident, unsure
- `cambridge_stage` - stage_1 through stage_6
- `cambridge_exam` - starters, movers, flyers
- `contact_method` - zalo, email, phone
- `inquiry_type` - trial_class, curriculum_info, center_tour, etc.
- `student_status` - inquiry, trial, active, inactive, graduated
- `class_day` - monday through sunday
- `event_type` - workshop, exam, competition, etc.

## 🚀 Setup Instructions

### Step 1: Access Your Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Log in to your account
3. Open your project: `pyqmjwwxkdumgxdpjjnw`

### Step 2: Run the Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire contents of `schema.sql`
4. Paste it into the SQL Editor
5. Click **Run** to execute the schema

This will create:
- All tables with proper relationships
- Indexes for performance
- Row Level Security (RLS) policies
- Triggers for automatic updates
- Views for common queries
- Sample event data

### Step 3: Configure Row Level Security

The schema includes RLS policies that allow:

**Public Access (no authentication required):**
- View published events
- Submit contact inquiries
- Book trial classes
- Register for events

**Authenticated Access (staff/admin only):**
- Full CRUD access to all student, class, and payment data
- Manage inquiries and bookings
- View and edit all records

### Step 4: Set Up Authentication (Optional)

If you want staff login functionality:

1. Go to **Authentication** in Supabase dashboard
2. Enable **Email** authentication
3. Add staff members via **Users** section
4. They can log in using the login form on your website

### Step 5: Update TypeScript Types (Optional)

To get TypeScript type safety, generate types from your schema:

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Generate TypeScript types
supabase gen types typescript --project-id pyqmjwwxkdumgxdpjjnw > src/integrations/supabase/types.ts
```

## 🔌 Using the Database in Your App

### Import the Supabase Client

```typescript
import { supabase } from "@/integrations/supabase/client";
```

### Example Queries

#### 1. Submit a Contact Inquiry

```typescript
const { data, error } = await supabase
  .from('inquiries')
  .insert({
    parent_name: 'John Doe',
    child_name: 'Jane Doe',
    child_age: 8,
    phone: '0987654321',
    current_level: 'some_english',
    preferred_contact: 'zalo',
    interested_in: ['trial_class', 'curriculum_info'],
    message: 'I would like to book a trial class'
  });
```

#### 2. Book a Trial Class

```typescript
const { data, error } = await supabase
  .from('trial_bookings')
  .insert({
    parent_name: 'John Doe',
    child_name: 'Jane Doe',
    child_age: 8,
    phone: '0987654321',
    email: 'john@example.com',
    current_level: 'beginner',
    preferred_date: '2025-06-15'
  });
```

#### 3. Get Upcoming Events

```typescript
const { data: events, error } = await supabase
  .from('upcoming_events')
  .select('*')
  .limit(6);
```

#### 4. Register for an Event

```typescript
const { data, error } = await supabase
  .from('event_registrations')
  .insert({
    event_id: 'event-uuid-here',
    parent_name: 'John Doe',
    child_name: 'Jane Doe',
    child_age: 8,
    phone: '0987654321',
    email: 'john@example.com'
  });
```

#### 5. Get Active Students (Authenticated)

```typescript
const { data: students, error } = await supabase
  .from('active_students_with_classes')
  .select('*')
  .order('student_name');
```

#### 6. Record Exam Results

```typescript
const { data, error } = await supabase
  .from('exam_results')
  .insert({
    student_id: 'student-uuid-here',
    exam_type: 'starters',
    exam_date: '2025-06-20',
    listening_shields: 4,
    reading_writing_shields: 5,
    speaking_shields: 4,
    certificate_number: 'CAM-2025-12345'
  });
```

## 📈 Database Features

### Automatic Updates

- **Timestamps** - `updated_at` fields update automatically
- **Participant Counts** - Class and event counts update when enrollments/registrations change
- **Computed Fields** - `total_shields` in exam results calculates automatically

### Data Integrity

- **Foreign Keys** - Ensure referential integrity
- **Check Constraints** - Validate shield scores (1-5)
- **Unique Constraints** - Prevent duplicate enrollments
- **Cascading Deletes** - Clean up related records

### Performance

- **Indexes** - Optimized queries on frequently searched fields
- **Views** - Pre-computed common queries
- **Efficient Queries** - Properly normalized schema

### Security

- **Row Level Security** - Fine-grained access control
- **Public/Private Separation** - Public forms, private admin data
- **UUID Primary Keys** - Secure, non-sequential IDs

## 🎯 Next Steps

### For Development

1. **Test the Contact Form** - Submit inquiries from your website
2. **Create Sample Data** - Add test students and classes
3. **Build Admin Dashboard** - Create pages to manage data
4. **Implement Authentication** - Add staff login

### For Production

1. **Set Up Backups** - Enable automatic backups in Supabase
2. **Monitor Usage** - Check database size and API calls
3. **Create Indexes** - Add more indexes as needed
4. **Set Up Alerts** - Get notified of issues

## 📞 Common Use Cases

### Parent Portal Features
- View child's progress
- Check attendance
- See upcoming events
- Download exam certificates

### Admin Dashboard Features
- Manage student enrollments
- Track attendance
- Record exam results
- Generate reports
- Handle inquiries
- Schedule classes

### Website Features
- Display upcoming events
- Accept contact inquiries
- Book trial classes
- Show Cambridge exam information

## 🔧 Maintenance

### Regular Tasks
- Archive old data quarterly
- Review and optimize slow queries
- Update RLS policies as needed
- Backup data before major changes

### Monitoring
- Check API usage in Supabase dashboard
- Monitor database size
- Review error logs
- Track query performance

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)

---

**Need Help?** Check the Supabase dashboard logs or contact the development team.
