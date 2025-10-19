# HeroSchool Admin & Teacher System - Implementation Guide

## Overview
This document outlines the comprehensive admin, teacher, and student system with role-based access control, skills tracking, resource management, and payroll features.

## What Has Been Implemented

### 1. Database Migration (`supabase/migrations/20251019120000_comprehensive_admin_teacher_system.sql`)

#### New Tables Created:

##### A. **admins** table
- Full admin user management
- Fields: id, email, password, name, surname, phone, profile_image_url, is_active, last_login
- Demo admin: `admin@heroschool.com` / `admin123`

##### B. **teacher_profiles** table
- Extended teacher information (links to existing teachers table)
- Fields: bio, qualifications, years_of_experience, specializations, languages_spoken, hourly_rate, bank details, emergency contact, address

##### C. **skills** table (Master Skills List)
- Centralized skills repository with 20+ predefined skills:
  - **Listening**: Basic, Intermediate, Advanced
  - **Speaking**: Basic, Conversational, Fluent
  - **Reading**: Basic, Intermediate, Advanced
  - **Writing**: Basic, Structured, Creative
  - **Vocabulary**: Basic, Intermediate, Advanced
  - **Grammar**: Basic, Intermediate, Advanced
  - **Pronunciation, Fluency, Comprehension, Social Skills**
- Each skill has:
  - `skill_code` (e.g., 'LISTEN_001', 'SPEAK_001')
  - `category` (listening, speaking, reading, writing, etc.)
  - `target_stage` (which Cambridge stages it applies to)

##### D. **student_skills** table (Junction Table)
- Links students to skills with individual scores
- Fields: student_id, skill_id, current_score (0-100), proficiency_level, last_assessed_date, assessed_by, notes
- Answers your question: **This is how we track individual student skill scores**
- Each student has multiple rows (one per skill being tracked)
- Scores are on a 0-100 scale
- Teachers can update scores and add notes

##### E. **resources** table
- Searchable teaching resources library
- Same structure as curriculum but specifically for reusable resources
- Types: warmup, activity, game, worksheet, video, audio, presentation, assessment, homework, printable
- Fields: title, description, resource_type, stage, duration_minutes, objectives, materials_needed, instructions, file_url, image_url, tags
- **Full-text search enabled** on title and tags for quick searching
- Sample resources included (Alphabet Song, Numbers Bingo, Role Play activities, etc.)

##### F. **lesson_resources** table (Drag-Drop Junction)
- Links curriculum lessons to resources
- Fields: curriculum_id, resource_id, position (for ordering), notes, added_by
- Enables the "Tetris/Lego" drag-and-drop lesson building you requested
- Teachers can arrange resources in specific order within a lesson

##### G. **teacher_notes** table
- Teachers can add notes to students
- Types: general, behavior, progress, assignment, skill
- Can link notes to specific skills or curriculum items
- Private flag for teacher-only notes
- Fields: student_id, teacher_id, note_type, note_text, related_skill_id, related_curriculum_id, is_private

##### H. **teacher_assignments** table
- Admin assigns teachers to classes with specific dates/times
- Fields: teacher_id, class_id, curriculum_id, teaching_date, start_time, end_time, location, status, notes, created_by
- Status: scheduled, completed, cancelled, rescheduled
- Teachers see their schedule in dashboard

##### I. **payroll** table
- Teacher payment tracking
- Fields: teacher_id, period_start, period_end, hours_worked, hourly_rate, base_amount, bonus, deductions, total_amount (calculated), payment_status, payment_date, payment_method, notes
- Payment status: pending, paid, partial, overdue, cancelled
- Total amount auto-calculated: base_amount + bonus - deductions

#### Row Level Security (RLS) Policies:
- **Admins**: Full access to all tables
- **Teachers**:
  - Can view own payroll, assignments, students in their classes
  - Can manage own notes and student skills for assigned students
  - Can view and edit curriculum for assigned classes
- **Students**: Read-only access to own data
- All policies use `auth.role() = 'authenticated'` check

#### Views Created:
- **teacher_dashboard_view**: Summary of teacher stats (classes, students, assignments)
- **student_skills_summary**: Aggregated skill scores by category for each student

### 2. Authentication Updates

#### **AuthContext.tsx** (Updated)
- Added **admin** role support
- Admin login flow queries the `admins` table
- Updates last_login timestamp on successful admin login
- Full role checking: `isAdmin`, `isTeacher`, `isStudent`

#### **Login.tsx** (Updated)
- Added **Admin** tab (3 tabs total: Admin, Teacher, Student)
- Shield icon for admin role
- Demo credentials displayed:
  - **Admin**: admin@heroschool.com / admin123
  - **Teacher**: donald@heroschool.com / teacher123
  - **Student**: emma@student.com / student123
- Automatic navigation to `/admin/dashboard` on admin login

### 3. Admin Dashboard Components

#### **PayrollManagement.tsx** (New Component)
- Full CRUD for teacher payroll
- Features:
  - Create new payroll records with dialog form
  - View all payroll records in table
  - Filter by teacher, period, status
  - Calculate totals (base + bonus - deductions)
  - Track payment status with color-coded badges
  - Delete payroll records
  - Fields: period dates, hours worked, hourly rate, base amount, bonus, deductions, payment status, payment date, method, notes

## What Still Needs to Be Created

### 1. Admin Dashboard Enhancements
You need to update the existing **AdminDashboard.tsx** to include new tabs:
- **Payroll** tab (import PayrollManagement component)
- **Teacher Assignments** tab (schedule teachers to classes)
- **Student Enrollment** tab (enroll students in classes, manage enrollments)
- **Skills Management** tab (add/edit master skills, view student skill reports)
- **Resources Library** tab (manage teaching resources)
- **Teacher Profiles** tab (view extended teacher information)

### 2. Teacher Assignment Component (Admin)
Create `TeacherAssignments.tsx`:
- Admin can assign teachers to classes
- Select teacher, class, curriculum, date range
- Set teaching times (start/end time)
- Mark assignments as scheduled/completed/cancelled
- Calendar view of all teacher assignments

### 3. Student Skills Management (Admin)
Create `StudentSkillsManagement.tsx`:
- View all students and their skill scores
- Update individual skill scores for students
- Add assessment notes
- Filter by student, skill category, proficiency level
- Generate skill progress reports

### 4. Resources Library Component
Create `ResourcesLibrary.tsx`:
- **Searchable** resource browser
- Filter by type, stage, tags
- Add/edit/delete resources
- Upload files (worksheets, videos, audio)
- Tag management for better searchability
- Preview resources

### 5. Lesson Plan Editor with Drag-Drop
Create `LessonPlanEditor.tsx`:
- **Two-column layout**:
  - **Left**: Selected lesson details from curriculum
  - **Right**: Searchable resources panel
- **Drag-and-drop** functionality:
  - Search resources by keyword, type, stage
  - Resources display as cards
  - Drag cards from right panel to left panel
  - Drop resources into lesson in desired order
  - Reorder resources within lesson
  - Add notes for each resource
- Uses `lesson_resources` junction table to persist
- Think: "Tetris/Lego game" - building a lesson from resource blocks

### 6. Teacher Dashboard Enhancements
Update **TeacherDashboard.tsx** to add:
- **Payroll** tab: View own payment history (read-only)
- **My Assignments** tab: View teaching schedule
- **Student Skills** tab: Assess and score students on skills
- **Notes** tab: Add/view notes for students
- **Lesson Builder** tab: Access lesson plan editor with drag-drop resources

### 7. Student Dashboard Feature
Add **Generate Progress Report** button:
- Uses API call to generate AI-powered student report
- Based on: attendance, skill scores, behavior notes, assessment data
- Short summary of progress and areas for improvement
- Teacher can edit and save report

### 8. App Routing
Update your router (`App.tsx` or routing config) to:
- Add `/admin/dashboard` route → AdminDashboard
- Protect admin routes (require admin role)
- Protect teacher routes (require teacher role)
- Protect student routes (require student role)

## How to Apply the Migration

### Option 1: Local Development
```bash
supabase db push --local
```

### Option 2: Remote/Production
```bash
supabase db push
```

### Option 3: Specific Database URL
```bash
supabase db push --db-url "postgresql://user:password@host:port/database"
```

## Database Relationship Diagram

```
admins (full access to everything)
  ↓
teachers ←→ teacher_profiles (1:1, extended info)
  ↓
teacher_assignments (teachers → classes + dates)
  ↓
classes ←→ enrollments ←→ students
  ↓
students ←→ student_skills ←→ skills (many-to-many with scores)
  ↓
teacher_notes → students (teachers add notes)
  ↓
curriculum ←→ lesson_resources ←→ resources (drag-drop)
  ↓
teachers ←→ payroll (payment tracking)
```

## Skills Tracking: How It Works

**Your Question**: "I don't know how this works in supabase do you need to create a skills table for each student or how to connect the score of a student with his assessment tables and skills table"

**Answer**:
1. **One central `skills` table** - contains all possible skills (20+ skills defined)
2. **One `student_skills` junction table** - each row represents one student's score for one skill
3. **Example**:
   - Student John (id: abc-123) has multiple rows in student_skills:
     - Row 1: John, Listening_001, score: 85, proficiency: intermediate
     - Row 2: John, Speaking_002, score: 75, proficiency: pre_intermediate
     - Row 3: John, Reading_001, score: 90, proficiency: intermediate
4. **Teachers update scores** via dashboard by:
   - Selecting a student
   - Selecting a skill
   - Entering a score (0-100)
   - Adding optional notes
   - Setting proficiency level
5. **Queries**:
   - Get all skills for a student: `SELECT * FROM student_skills WHERE student_id = 'abc-123'`
   - Get student's listening skills: `SELECT ss.*, sk.* FROM student_skills ss JOIN skills sk ON ss.skill_id = sk.id WHERE ss.student_id = 'abc-123' AND sk.category = 'listening'`
   - Get class average for a skill: `SELECT AVG(current_score) FROM student_skills WHERE skill_id = 'xyz'`

## Lesson Builder: How Drag-Drop Works

**Your Request**: "teacher searches and cards show up teacher drags and drops the cards where he wants. so its like a tetris or lego game 1 side the lesson plan 1 side the bricks that are fetched from resources"

**Implementation Plan**:
1. **UI Layout**:
   ```
   ┌─────────────────────────────────────────────────────────────┐
   │ Lesson: "Introduction to Past Tense"                        │
   ├──────────────────────┬──────────────────────────────────────┤
   │ LESSON PLAN         │ RESOURCES LIBRARY                     │
   │ (Drop Zone)          │ (Search & Drag)                       │
   │                      │                                       │
   │ 1. [Warmup Card]     │ Search: [_________]  [Filter▼]      │
   │    ↑ ↓ ✏️ 🗑️         │                                       │
   │                      │ ┌──────────┐ ┌──────────┐           │
   │ 2. [Activity Card]   │ │ Warmup   │ │ Game     │           │
   │    ↑ ↓ ✏️ 🗑️         │ │ Alphabet │ │ Numbers  │           │
   │                      │ │ Song     │ │ Bingo    │           │
   │ 3. [Worksheet Card]  │ └──────────┘ └──────────┘           │
   │    ↑ ↓ ✏️ 🗑️         │                                       │
   │                      │ ┌──────────┐ ┌──────────┐           │
   │ [+ Drop here]        │ │Worksheet │ │ Video    │           │
   │                      │ │ Past     │ │ Story    │           │
   │                      │ │ Tense    │ │ Time     │           │
   │                      │ └──────────┘ └──────────┘           │
   └──────────────────────┴──────────────────────────────────────┘
   ```

2. **Technology**:
   - Use `react-beautiful-dnd` or `@dnd-kit/core` for drag-and-drop
   - Left panel: Droppable zone showing `lesson_resources` in order
   - Right panel: Draggable resource cards from `resources` table
   - On drop: Insert into `lesson_resources` with auto-increment position
   - Reordering: Update position values in junction table

3. **Search Functionality**:
   - Text search: Full-text search on title and tags
   - Filters: resource_type, stage, duration
   - Results display as draggable cards with preview

## Next Steps for You

1. **Apply the migration**:
   ```bash
   cd /Users/donaldcjapi/Desktop/hero-ai-curriculum
   supabase db push
   ```

2. **Create missing components** (I can help with these):
   - TeacherAssignments.tsx
   - StudentSkillsManagement.tsx
   - ResourcesLibrary.tsx
   - LessonPlanEditor.tsx (with drag-drop)
   - Update AdminDashboard.tsx with new tabs
   - Update TeacherDashboard.tsx with payroll view

3. **Install drag-drop library**:
   ```bash
   npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
   ```

4. **Test the system**:
   - Login as admin (admin@heroschool.com / admin123)
   - Verify admin dashboard loads
   - Test creating payroll records
   - Login as teacher and verify restricted access

5. **Optional: Add the skills list** you mentioned:
   - You said you have a skills list to provide
   - Add those to the skills table insert in the migration
   - Or create them via admin dashboard once built

## Summary of Access Levels

| Feature | Admin | Teacher | Student |
|---------|-------|---------|---------|
| View all students | ✅ | Own classes only | Own data only |
| Edit student data | ✅ | ❌ | ❌ |
| Enroll students | ✅ | ❌ | ❌ |
| View all teachers | ✅ | Own data only | ❌ |
| Edit teacher profiles | ✅ | Own profile only | ❌ |
| Manage payroll | ✅ | View own only | ❌ |
| Create teacher assignments | ✅ | View own only | ❌ |
| Manage curriculum | ✅ | Edit assigned | ❌ |
| Manage resources | ✅ | Create/Edit | ❌ |
| Build lesson plans | ✅ | ✅ | ❌ |
| Assess student skills | ✅ | Assigned students | ❌ |
| Add teacher notes | ✅ | Own notes only | ❌ |
| View attendance | ✅ | Own classes | Own only |
| Manage classes | ✅ | ❌ | ❌ |
| Assign teachers to classes | ✅ | ❌ | ❌ |
| View payments | ✅ | ❌ | ❌ |

## Questions Answered

1. **"How to connect student scores with skills?"** → Use `student_skills` junction table with one row per student per skill
2. **"Do I create a skills table for each student?"** → No, one central `skills` table + one `student_skills` junction table for all students
3. **"How does drag-drop lesson building work?"** → Use `lesson_resources` junction table to store which resources are in which lesson, with position field for ordering
4. **"Can teacher see curriculum and edit it?"** → Yes, RLS policies allow teachers to view all curriculum and edit curriculum for their assigned classes

This system is now ready for you to build the UI components on top of this solid database foundation!
