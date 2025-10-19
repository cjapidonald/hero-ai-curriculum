# 🚀 Quick Start Guide

## Setup Your Database (3 Minutes)

### 1️⃣ Open Supabase Dashboard
Click here: **[Open SQL Editor](https://supabase.com/dashboard/project/mqlihjzdfkhaomehxbye/sql)**

### 2️⃣ Run 4 SQL Files (Copy → Paste → Run)

Run these **ONE AT A TIME** in the SQL Editor:

#### File 1: `supabase/schema.sql`
- Copy all content from this file
- Paste into SQL Editor
- Click "Run" ▶️

#### File 2: `supabase/dashboard-schema.sql`
- Copy all content
- Paste into new query
- Click "Run" ▶️

#### File 3: `supabase/enhanced-dashboard-schema.sql`
- Copy all content
- Paste into new query
- Click "Run" ▶️

#### File 4: `supabase/seed-data.sql`
- Copy all content
- Paste into new query
- Click "Run" ▶️

### 3️⃣ Create Auth Users

Go to: **[Authentication → Users](https://supabase.com/dashboard/project/mqlihjzdfkhaomehxbye/auth/users)**

Click "Add User" and create these 3 users:

1. **Student**
   - Email: `emma@student.com`
   - Password: `student123`

2. **Teacher**
   - Email: `donald@heroschool.com`
   - Password: `teacher123`

3. **Admin**
   - Email: `admin@heroschool.com`
   - Password: `admin123`

### 4️⃣ Start Your App

```bash
npm run dev
```

### 5️⃣ Login & Explore

Open http://localhost:5173

**Try Student Dashboard** (Best visualizations):
- Login: `emma@student.com` / `student123`
- See: Profile, charts, progress tracking, assessments

**Try Admin Dashboard**:
- Login: `admin@heroschool.com` / `admin123`
- See: System overview, statistics, charts

---

## ✅ What You Get

### Student Dashboard
- Personal profile with photo
- 4 stat cards with progress bars
- Skills radar chart
- 16 evaluations showing 4-month progression
- Apple-style charts with clean grids
- Assessment history with teacher feedback

### Admin Dashboard
- System statistics (students, teachers, classes, revenue)
- Class enrollment charts
- Student level distribution
- Attendance tracking
- Financial reports

### Teacher Dashboard
- Class management
- Student assessments
- Skills evaluation tools
- Curriculum builder

---

## 🔗 Quick Links

- [SQL Editor](https://supabase.com/dashboard/project/mqlihjzdfkhaomehxbye/sql)
- [Create Auth Users](https://supabase.com/dashboard/project/mqlihjzdfkhaomehxbye/auth/users)
- [View Tables](https://supabase.com/dashboard/project/mqlihjzdfkhaomehxbye/editor)

---

## 📊 Sample Data

- **8 students** with complete profiles
- **4 teachers** with bios
- **24+ skills evaluations** (showing realistic improvement)
- **5 assessments** with detailed rubrics
- **5 classes** with schedules
- All data fully connected!

---

## ❓ Issues?

### Can't login?
Make sure you created Auth users in Step 3

### No data showing?
Check that all 4 SQL files ran successfully

### Need detailed help?
See `CLOUD_DATABASE_SETUP.md`
