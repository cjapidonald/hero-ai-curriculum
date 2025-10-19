# HeroSchool Implementation Guide

This guide covers all the major updates and new features added to the HeroSchool platform.

## 📋 Table of Contents

1. [Frontend Updates](#frontend-updates)
2. [Database Schema Updates](#database-schema-updates)
3. [New Features](#new-features)
4. [Setup Instructions](#setup-instructions)
5. [Usage Guide](#usage-guide)

---

## 🎨 Frontend Updates

### Homepage
- ✅ **Rolling Number Animations**: Statistics now animate when scrolling into view
  - 95% Exam Pass Rate
  - 12 Max Class Size
  - 2022 Established
  - 100% Parent Satisfaction

### Navigation
- ✅ **Logo Update**: Removed "H" text, now uses image placeholder (`/logo.svg`)

### Curriculum Page
- ✅ **Circle Decorations**: Added decorative circular elements like homepage
- ✅ **Book Image**: Featured Cambridge Global English Stage 1 book with decorative circles
- ✅ **Study Path Roadmap**: New vertical timeline showing all 6 stages
  - Alternating left/right layout
  - Highlights exam stages (2, 4, 6)
  - Foundation stages clearly marked
- ✅ **2-Column Layout**: Cambridge Shields and Exam Details side-by-side

### Fees Page
- ✅ **Circle Decorations**: Added decorative elements
- ✅ **Removed CTA**: Removed "Ready to Enroll?" section at bottom

### Events Page
- ✅ **Circle Decorations**: Added decorative circular elements

### Teacher Dashboard
- ✅ **Fixed Background**: Removed hard-coded white backgrounds, now uses theme colors
- ✅ **Removed Tabs**: Removed Assessment and Blog tabs
- ✅ **Enhanced Lesson Builder**: New drag-and-drop lesson planner integrated

---

## 🗄️ Database Schema Updates

### New Migration: `20250119_enhanced_schema.sql`

#### 1. Teachers Table Updates
```sql
ALTER TABLE teachers
ADD COLUMN username TEXT UNIQUE,
ADD COLUMN assigned_classes TEXT[],
ADD COLUMN hourly_rate NUMERIC(10,2),
ADD COLUMN monthly_earnings NUMERIC(10,2),
ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;
```

**New Features:**
- Username-based authentication
- Array of assigned class names
- Hourly rate in VND
- Auto-calculated monthly earnings
- Last login tracking

#### 2. Resources Table (NEW)
Central repository for all teaching resources:

**Fields:**
- `name`, `description`: Resource metadata
- `resource_type`: warmup, main_activity, assessment, homework, printable
- `file_type`: pdf, image, video, link, file
- `file_url`, `storage_path`: File location
- `tags[]`: Searchable tags
- `subject`, `level`, `stage`: Categorization
- `uploaded_by`: Teacher reference
- `is_public`: Visibility flag
- `download_count`: Usage tracking

**Features:**
- Full-text search on name, description, tags
- Filter by type, level, stage
- Drag-and-drop to lesson plans
- File size tracking
- Thumbnail support

#### 3. Curriculum Table Updates
```sql
ALTER TABLE curriculum
ADD COLUMN class TEXT,
ADD COLUMN school TEXT DEFAULT 'HeroSchool',
ADD COLUMN curriculum_stage TEXT;
```

**New Fields:**
- Class assignment
- School name
- Curriculum stage (Stage 1-6)

#### 4. Classes Table (NEW)
Manage all classes in the school:

**Fields:**
- `name`: Class name (unique)
- `level`: Beginner, Pre-A1, A1, A2
- `stage`: Stage 1-6
- `teacher_id`: Assigned teacher
- `schedule`: Class schedule text
- `max_students`, `current_students`: Capacity tracking
- `classroom`: Physical location
- `is_active`: Active status
- `start_date`, `end_date`: Term dates

#### 5. Skills Master Table (NEW)
Admin-managed skills for assignments:

**Fields:**
- `skill_name`: Name of skill
- `skill_category`: Writing, Reading, Listening, Speaking
- `level`, `stage`: Target level
- `assigned_classes[]`: Classes using this skill
- `evaluation_criteria[]`: Assessment criteria
- `is_active`: Active status

#### 6. Attendance Table (NEW)
Track student attendance:

**Fields:**
- `student_id`: Student reference
- `class`: Class name
- `session_date`: Date of session
- `status`: present, absent, late, excused
- `notes`: Optional notes

**Auto-triggers:**
- Updates `sessions` and `sessions_left` in student record
- Recalculates `attendance_rate` automatically

#### 7. Auto-calculation Functions

**Student Sessions:**
```sql
CREATE FUNCTION update_student_sessions()
-- Triggers on attendance insert
-- Auto-decrements sessions_left
-- Recalculates attendance_rate
```

**Teacher Earnings:**
```sql
CREATE FUNCTION update_teacher_earnings()
-- Triggers on payroll insert/update
-- Calculates monthly earnings from payroll
```

---

## 🆕 New Features

### 1. Enhanced Lesson Planner

**Location:** `src/pages/teacher/EnhancedLessonPlanner.tsx`

**Features:**
- **Drag-and-Drop Interface**: Powered by @dnd-kit
- **Split Screen Layout**:
  - Left: Lesson plan editor
  - Right: Resource library
- **5 Activity Sections**:
  - Warm-up Activities (max 4)
  - Main Activities (max 5)
  - Assessment Activities (max 4)
  - Homework (max 6)
  - Printables (max 4)
- **Resource Integration**: Drag resources from library to lesson
- **Reordering**: Drag to reorder activities within sections
- **Export Options**:
  - CSV export (implemented)
  - PDF export (placeholder)
- **Class Integration**: Auto-fills teacher and class info
- **Stage Tracking**: Links to Cambridge stages

### 2. Resource Library

**Location:** `src/components/ResourceLibrary.tsx`

**Features:**
- **Search**: Full-text search on name, description, tags
- **Filters**:
  - Resource Type (warmup, main_activity, etc.)
  - Level (Beginner, Pre-A1, A1, A2)
  - Stage (Stage 1-6)
- **Drag-and-Drop**: Drag resources to lesson plans
- **Visual Indicators**:
  - File type icons (📄 PDF, 🖼️ Image, 🎥 Video, 🔗 Link)
  - Color-coded resource types
  - File size badges
  - Tag clouds
- **Compact Mode**: Optimized for split-screen layout

### 3. Storage Buckets

**Configuration:** `supabase/storage-buckets.sql`

**Buckets:**

1. **curriculum-resources**
   - Public access
   - 50MB file limit
   - Types: PDF, images, videos, audio, PowerPoint
   - Structure: `{teacher_id}/warmup/`, `/main-activities/`, etc.

2. **profile-images**
   - Public access
   - 5MB file limit
   - Types: Images only
   - Structure: `teachers/{teacher_id}/`, `students/{student_id}/`

3. **student-work**
   - Private access
   - 10MB file limit
   - Types: PDF, images, videos, audio
   - Structure: `{student_id}/homework/`, `/projects/`, `/assessments/`

---

## 🚀 Setup Instructions

### 1. Install Dependencies
Already installed, but if needed:
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### 2. Apply Database Migrations

**Option A: Using Supabase CLI (Recommended)**
```bash
cd supabase
./apply-migrations.sh
```

**Option B: Manual SQL Execution**
1. Open Supabase Dashboard → SQL Editor
2. Copy and paste `supabase/migrations/20250119_enhanced_schema.sql`
3. Execute the SQL

### 3. Create Storage Buckets

**Via Supabase Dashboard:**
1. Go to Storage section
2. Click "New bucket"
3. Create three buckets as defined in `storage-buckets.sql`:
   - `curriculum-resources` (public, 50MB)
   - `profile-images` (public, 5MB)
   - `student-work` (private, 10MB)

**Via SQL (Advanced):**
```bash
# In Supabase SQL Editor
# Paste and execute: supabase/storage-buckets.sql
```

### 4. Add Sample Data

Sample data is included in the migration:
- 3 classes (Starters A, Movers B, Flyers C)
- 5 sample resources
- 4 sample skills
- Teacher usernames and rates

To add more sample data for teacher Donald, see the migration file.

### 5. Test the Application

```bash
npm run dev
```

1. Login as teacher Donald:
   - Email: `donald@heroschool.com`
   - Password: `teacher123`

2. Navigate to "Lesson Builder" tab

3. Test drag-and-drop functionality

---

## 📖 Usage Guide

### For Teachers

#### Creating a Lesson Plan

1. **Click "Lesson Builder" tab**
2. **Fill in basic info**:
   - Lesson Title
   - Date
   - Select Class (from your assigned classes)
   - Select Stage
   - Add Skills
   - Add Success Criteria

3. **Add Activities**:
   - **Method 1**: Drag resources from right panel to lesson sections
   - **Method 2**: Click a resource to auto-add to appropriate section

4. **Organize Activities**:
   - Drag activities to reorder within sections
   - Click X to remove an activity

5. **Save Lesson**:
   - Click "Save" button
   - Lesson is stored in database

6. **Export Lesson**:
   - Click "CSV" to download CSV format
   - Click "PDF" for PDF export (coming soon)

#### Using the Resource Library

1. **Search Resources**:
   - Type in search box to filter by name, description, or tags

2. **Filter Resources**:
   - Select Type (warmup, main activity, etc.)
   - Select Level (Beginner, Pre-A1, A1, A2)
   - Select Stage (Stage 1-6)

3. **Add to Lesson**:
   - Drag resource to lesson plan section
   - Or click resource to auto-add

4. **View Resource**:
   - Click eye icon to open resource in new tab

### For Admins

#### Managing Classes

Classes are now defined in the `classes` table. Teachers can only create lessons for classes they're assigned to.

#### Managing Skills

Use the `skills_master` table to define skills that can be assigned to classes.

#### Tracking Teacher Earnings

Teacher earnings are auto-calculated from the `teacher_payroll` table based on:
- Hours taught × Hourly rate
- Plus bonuses
- Minus deductions

---

## 🔧 Technical Details

### Component Architecture

```
TeacherDashboard
├── EnhancedLessonPlanner
│   ├── Lesson Plan Editor (left)
│   │   ├── Basic Info Form
│   │   ├── Warmup Section (DndContext)
│   │   ├── Main Activities Section (DndContext)
│   │   ├── Assessment Section (DndContext)
│   │   ├── Homework Section (DndContext)
│   │   └── Printables Section (DndContext)
│   └── ResourceLibrary (right)
│       ├── Search Bar
│       ├── Filter Controls
│       └── Resource List (draggable items)
└── Other Tabs...
```

### Data Flow

1. **Loading Lesson**:
   - Fetch from `curriculum` table
   - Parse flat structure (wp1_name, ma1_name, etc.) into organized arrays
   - Display in sections

2. **Saving Lesson**:
   - Convert organized arrays back to flat structure
   - Upsert to `curriculum` table

3. **Dragging Resources**:
   - Resource data stored in drag event
   - Drop handler extracts data
   - Adds to appropriate activity array
   - Triggers re-render

4. **Reordering Activities**:
   - @dnd-kit handles drag events
   - Calculates new index
   - Uses `arrayMove` to reorder
   - Updates state

### Database Triggers

**Attendance → Student Sessions:**
```sql
attendance INSERT → update_student_sessions()
  → Increment sessions
  → Decrement sessions_left
  → Recalculate attendance_rate
```

**Payroll → Teacher Earnings:**
```sql
payroll INSERT/UPDATE → update_teacher_earnings()
  → Sum current month payroll
  → Update teacher.monthly_earnings
```

---

## 📝 Future Enhancements

### Short-term
1. **File Upload**: Direct file upload to Supabase storage
2. **PDF Export**: Generate PDF lesson plans
3. **Resource Upload**: Teachers can upload their own resources
4. **Lesson Templates**: Save and reuse lesson templates
5. **Collaborative Planning**: Share lessons with other teachers

### Long-term
1. **AI Suggestions**: AI-powered resource recommendations
2. **Student View**: Students can view their upcoming lessons
3. **Print Optimization**: Better formatting for printed lessons
4. **Mobile App**: Native mobile app for lesson planning
5. **Analytics**: Track most-used resources

---

## 🐛 Troubleshooting

### Issue: Resources not loading
**Solution:** Check that:
1. Database migration was applied
2. Resources table has sample data
3. RLS policies allow SELECT

### Issue: Drag-and-drop not working
**Solution:** Check that:
1. @dnd-kit packages are installed
2. Browser supports drag events
3. JavaScript is enabled

### Issue: Save fails
**Solution:** Check that:
1. All required fields are filled
2. Teacher is assigned to the selected class
3. Database connection is active

### Issue: Storage upload fails
**Solution:** Check that:
1. Storage buckets exist
2. File size is within limits
3. MIME type is allowed

---

## 📞 Support

For issues or questions:
1. Check this guide
2. Review the migration file
3. Check Supabase logs
4. Contact development team

---

**Last Updated:** January 19, 2025
**Version:** 2.0.0
