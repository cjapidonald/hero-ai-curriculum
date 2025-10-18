# Quick Setup Instructions for HeroSchool Supabase Database

## ⚡ Quick Start (5 minutes)

### 1. Access Supabase Dashboard

- URL: https://supabase.com/dashboard/project/mqlihjzdfkhaomehxbye
- Your Project ID: `mqlihjzdfkhaomehxbye`

### 2. Run the Schema

1. Click **SQL Editor** in the left sidebar
2. Click **New Query** button
3. Open the file `supabase/schema.sql` in your code editor
4. Copy ALL the contents (Ctrl+A, Ctrl+C)
5. Paste into the Supabase SQL Editor
6. Click **Run** (or press Ctrl+Enter)

**Expected Result:** You should see "Success. No rows returned"

### 3. Verify Setup

Go to **Table Editor** and you should see these tables:
- ✅ parents
- ✅ students
- ✅ classes
- ✅ enrollments
- ✅ attendance
- ✅ exam_results
- ✅ events
- ✅ event_registrations
- ✅ payments
- ✅ student_progress
- ✅ inquiries
- ✅ trial_bookings
- ✅ users

### 4. Test Public Access

The following features work WITHOUT authentication:

**✅ Contact Form (Already Working)**
```typescript
// Your contact form can insert into 'inquiries' table
supabase.from('inquiries').insert({ ... })
```

**✅ Trial Booking Form**
```typescript
// Users can book trial classes
supabase.from('trial_bookings').insert({ ... })
```

**✅ Event Registration**
```typescript
// Users can register for events
supabase.from('event_registrations').insert({ ... })
```

**✅ View Events**
```typescript
// Anyone can see published events
supabase.from('events').select('*').eq('is_published', true)
```

## 🎨 Database Structure Overview

```
┌─────────────────────────────────────────────────────────┐
│                    PUBLIC ACCESS                         │
│  (No login required - for website visitors)             │
├─────────────────────────────────────────────────────────┤
│  • View published events                                 │
│  • Submit contact inquiries                              │
│  • Book trial classes                                    │
│  • Register for events                                   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  AUTHENTICATED ACCESS                    │
│  (Staff/Admin only - requires login)                    │
├─────────────────────────────────────────────────────────┤
│  • Manage students & parents                             │
│  • Create & manage classes                               │
│  • Track attendance                                      │
│  • Record exam results                                   │
│  • Process payments                                      │
│  • View & respond to inquiries                           │
│  • Schedule trial classes                                │
│  • Create & publish events                               │
└─────────────────────────────────────────────────────────┘
```

## 📋 Key Features Included

### 1. Student Management System
- Parent profiles with contact preferences
- Student profiles with learning levels
- Cambridge stage assignments
- Progress tracking

### 2. Class Management
- Multiple classes per stage
- Teacher assignments
- Schedule management
- Enrollment tracking
- Automatic participant counting

### 3. Cambridge Exam System
- Support for Starters, Movers, Flyers
- Shield scoring (1-5 per skill)
- Automatic total calculation
- Certificate tracking

### 4. Event Management
- Different event types (camps, workshops, exams)
- Registration system
- Participant limits
- Age restrictions
- Payment tracking

### 5. Communication System
- Contact form inquiries
- Trial class bookings
- Status tracking
- Response management

### 6. Financial Tracking
- Payment records
- Receipt numbers
- Multiple payment methods
- Term-based tracking

## 🔐 Security Configuration

### Already Configured:
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Public access policies for forms and events
- ✅ Authenticated access for admin features
- ✅ Automatic timestamp updates
- ✅ Data validation constraints

### Default Security Rules:

**Public Can:**
- Read published events
- Insert inquiries
- Insert trial bookings
- Insert event registrations

**Authenticated Users Can:**
- Full CRUD on all tables
- Manage all student data
- View and update inquiries
- Create and publish events

## 📊 Sample Data

The schema includes 3 sample events:
1. Summer English Camp 2025
2. Cambridge Starters Mock Exam
3. Parent-Teacher Meeting

You can view them by running:
```sql
SELECT * FROM events;
```

## 🛠️ Common Operations

### Add Your First Student (via SQL)

```sql
-- 1. Add parent
INSERT INTO parents (full_name, phone, email, preferred_contact)
VALUES ('John Smith', '0987654321', 'john@example.com', 'zalo');

-- 2. Add student (replace parent_id with the UUID from step 1)
INSERT INTO students (parent_id, full_name, age, current_level, assigned_stage, status)
VALUES ('parent-uuid-here', 'Jane Smith', 8, 'some_english', 'stage_2', 'active');
```

### Create Your First Class

```sql
INSERT INTO classes (
  class_name,
  stage,
  teacher_name,
  max_students,
  schedule_days,
  start_time,
  end_time,
  start_date,
  is_active
) VALUES (
  'Starters Monday Evening',
  'stage_2',
  'Teacher Sarah',
  12,
  ARRAY['monday', 'wednesday']::class_day[],
  '17:00',
  '18:30',
  '2025-06-01',
  true
);
```

### View All Active Students

```sql
SELECT * FROM active_students_with_classes;
```

### View Upcoming Events

```sql
SELECT * FROM upcoming_events;
```

## 🔄 Integration with Your Website

### Update Your Contact Form

```typescript
// src/pages/Contact.tsx
import { supabase } from "@/integrations/supabase/client";

const handleSubmit = async (formData) => {
  const { data, error } = await supabase
    .from('inquiries')
    .insert({
      parent_name: formData.parentName,
      child_name: formData.childName,
      child_age: formData.childAge,
      current_level: formData.currentLevel,
      phone: formData.phone,
      email: formData.email,
      preferred_contact: formData.preferredContact,
      how_did_hear: formData.howDidYouHear,
      interested_in: formData.interestedIn,
      message: formData.message
    });

  if (error) {
    console.error('Error:', error);
    // Show error toast
  } else {
    // Show success toast
    console.log('Inquiry submitted:', data);
  }
};
```

### Load Events on Events Page

```typescript
// src/pages/Events.tsx
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

const Events = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    const { data, error } = await supabase
      .from('upcoming_events')
      .select('*')
      .limit(10);

    if (data) {
      setEvents(data);
    }
  };

  // Render events...
};
```

## ✅ Verification Checklist

After running the schema, verify:

- [ ] All 13 tables created in Table Editor
- [ ] RLS enabled (shield icon visible on tables)
- [ ] 3 sample events in events table
- [ ] Views created (upcoming_events, active_students_with_classes)
- [ ] No errors in SQL Editor
- [ ] Contact form can submit (test with Supabase dashboard)

## 🚨 Troubleshooting

### Error: "relation already exists"
- **Solution:** Tables already created. You can drop them and re-run, or skip the CREATE statements.

### Error: "permission denied"
- **Solution:** Make sure you're logged in as the project owner in Supabase dashboard.

### Can't see RLS shield icons
- **Solution:** Refresh the page, RLS is enabled via SQL.

### Public forms not working
- **Solution:** Check RLS policies are created. Re-run the policy section of schema.sql.

## 📞 Next Steps

1. **Test the Contact Form** - Submit from your website
2. **Add Sample Data** - Create test students and classes
3. **Build Admin Dashboard** - Create pages to manage data
4. **Set Up Authentication** - Add staff login (optional)

## 🎓 Learning Resources

- **Supabase Docs:** https://supabase.com/docs
- **PostgreSQL Tutorial:** https://www.postgresql.org/docs/current/tutorial.html
- **RLS Guide:** https://supabase.com/docs/guides/auth/row-level-security

---

**Ready to go!** Your database is now set up and ready to use. 🚀
