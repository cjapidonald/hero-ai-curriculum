# 🎯 Comprehensive Curriculum System - Implementation Plan

## 📋 Overview

Building a complete curriculum management, lesson planning, class management, and formative assessment system.

---

## 🏗️ System Architecture

### 1. **Curriculum Tab** (Main View)
Location: Teacher Dashboard & Admin Dashboard

**Columns:**
- Subject
- Lesson Nr
- Lesson Title
- Date
- Lesson Plan Status (Draft / In Progress / Done)
- **Actions:**
  - 🔨 Build Lesson
  - ▶️ Start Lesson
  - 📊 Evaluate Skills
  - 👁️ Quick View
  - 🖨️ Printables
  - 📚 Homework
  - 📝 Add Quiz (Coming Soon)
  - 📋 Add Assignment (Coming Soon)

---

### 2. **Lesson Builder** (Build Lesson Page)

#### Auto-Fetched Components (Left Panel - Top):
- ✅ Lesson Nr
- ✅ Lesson Title
- ✅ Date
- ✅ Class
- ✅ School Name
- ✅ Teacher Name
- ✅ Stage

#### Skills Selection (After Auto-Fetch):
- 🔍 Searchable dropdown
- ✅ Multiple selection
- 📚 Skills from curriculum
- ❌ Remove objectives & criteria

#### Lesson Sections (Drag & Drop):
1. **Warm Up** - Placeholder for resources
2. **Body** - Main lesson activities
3. **Assessment** - Evaluation materials
4. **Teacher Notes** - Private notes
5. **Print** - Printable materials
6. **Homework** - Take-home assignments

#### Resources Panel (Right Side):
**Each Resource Has:**
- Title
- Subject
- Stage
- Interaction
- How to Implement
- Resource (File / Link / Activity)

**My Contribution:**
- Teachers can add their own resources
- Auto-inserted into resource pool
- Contribution count tracked
- Shown in admin dashboard & teacher performance

#### Bottom Actions:
- 💾 Save (In Progress)
- ✅ Done

---

### 3. **Start Lesson** (Class Management System)

#### Layout:

**Left Side - Student Cards:**
- Student names as cards
- Behavior points displayed
- Real-time interaction

**Card Interactions:**
- **Left:** + Points button
- **Right:** - Points button
- **Top:** Badges (🥈 Silver, 🥉 Bronze, 🥇 Gold)
- **Bottom:** 💬 Add Comment

**Bottom Functions:**
- ✅ **Attendance** - Auto-select all, unselect absent
- ⏱️ **Timer** - Countdown timer
- 🎲 **Randomizer** - Random student selector
- 🪑 **Seating Plan** - Classroom layout

#### Seating Plan Geometries:
1. **All Students** - Full class view
2. **Groups** - Pin-based grouping
3. **Pair Work** - 2-person groups
4. **Groups of 3** - 3-person groups

**Geometry Style:** Neon classroom layout (visible and clear)

**Scroll Down:**
- View full lesson plan
- **Conclude Lesson** button at bottom

**Business Logic:**
- ✅ Lesson can ONLY start on scheduled date
- ✅ Completed lesson added to teacher payroll
- ✅ All formative assessment data saved to student records

---

### 4. **Evaluate Skills**

**Interface:**
- Student list (left)
- Skills from lesson (right)

**Input Types:**
- 📝 Text input (strings, numbers)
- 📊 Slider (1-100)

**Milestones:**
- Each evaluation = 1 milestone
- Tracked per student per skill
- Visible in student dashboard:
  - Timeline view
  - Percentage graph
  - Pie chart

---

### 5. **Printables Management**

**Features:**
- View all printables from lesson
- Download for printing
- Organized list

---

### 6. **Homework Assignment**

**Interface:**
- Student list
- Homework items (auto-assigned from lesson builder)
- **Select All** button
- Unselect individual students
- Save assignments

---

### 7. **Quick View (Eye Button)**

**Shows:**
- Complete lesson plan
- Read-only view
- All components and resources

---

### 8. **Add Quiz** (Coming Soon)

Placeholder button with "Feature Coming Soon" message

---

### 9. **Add Assignment** (Coming Soon)

Placeholder button with "Feature Coming Soon" message

---

## 🗄️ Database Schema Updates Needed

### New Tables:

#### 1. **lesson_plans**
```sql
- id (UUID, PK)
- curriculum_id (FK)
- teacher_id (FK)
- class_id (FK)
- status (draft / in_progress / done)
- skills (JSONB array)
- warm_up_resources (JSONB)
- body_resources (JSONB)
- assessment_resources (JSONB)
- teacher_notes (TEXT)
- print_resources (JSONB)
- homework_resources (JSONB)
- created_at
- updated_at
```

#### 2. **teacher_resources** (My Contribution)
```sql
- id (UUID, PK)
- teacher_id (FK)
- title (TEXT)
- subject (TEXT)
- stage (TEXT)
- interaction (TEXT)
- how_to_implement (TEXT)
- resource_type (file / link / activity)
- resource_url (TEXT)
- file_path (TEXT)
- is_approved (BOOLEAN)
- contribution_count (INT)
- created_at
```

#### 3. **lesson_sessions** (Start Lesson)
```sql
- id (UUID, PK)
- lesson_plan_id (FK)
- teacher_id (FK)
- class_id (FK)
- started_at (TIMESTAMP)
- concluded_at (TIMESTAMP)
- status (in_progress / concluded)
- attendance_data (JSONB)
- seating_plan (JSONB)
```

#### 4. **student_behavior_points**
```sql
- id (UUID, PK)
- session_id (FK)
- student_id (FK)
- points (INT)
- badges (JSONB array: silver, bronze, gold)
- comments (TEXT array)
- recorded_at (TIMESTAMP)
```

#### 5. **skill_evaluations**
```sql
- id (UUID, PK)
- session_id (FK)
- student_id (FK)
- skill_id (FK)
- evaluation_type (text / slider)
- evaluation_value (TEXT or INT)
- milestone_number (INT)
- evaluated_at (TIMESTAMP)
```

#### 6. **homework_assignments**
```sql
- id (UUID, PK)
- lesson_plan_id (FK)
- student_id (FK)
- homework_resource (JSONB)
- assigned_at (TIMESTAMP)
- status (assigned / completed)
```

---

## 📦 File Structure

```
src/
├── pages/
│   ├── teacher/
│   │   ├── CurriculumTab.tsx (NEW - Main curriculum view)
│   │   ├── LessonBuilderEnhanced.tsx (NEW)
│   │   ├── StartLesson.tsx (NEW - Class management)
│   │   ├── EvaluateSkills.tsx (NEW)
│   │   ├── PrintablesManager.tsx (NEW)
│   │   ├── HomeworkAssignment.tsx (NEW)
│   │   └── QuickView.tsx (NEW)
│   └── admin/
│       └── components/
│           └── CurriculumTab.tsx (NEW - Same as teacher)
│
├── components/
│   ├── curriculum/
│   │   ├── StudentCard.tsx (Behavior points card)
│   │   ├── SeatingPlan.tsx (Geometry layouts)
│   │   ├── ResourcePanel.tsx (Resources sidebar)
│   │   ├── MyContribution.tsx (Add resources)
│   │   ├── SkillSelector.tsx (Searchable skills)
│   │   └── LessonSection.tsx (Drag & drop sections)
│   │
│   └── ui/
│       ├── timer.tsx
│       ├── randomizer.tsx
│       └── attendance-selector.tsx
│
└── lib/
    ├── curriculum/
    │   ├── lesson-utils.ts
    │   ├── behavior-utils.ts
    │   └── skill-utils.ts
    └── storage/
        └── file-upload.ts (Bucket management)
```

---

## 🎯 Implementation Phases

### Phase 1: Curriculum Tab & Basic Structure
- ✅ Create curriculum tab with all columns
- ✅ Add action buttons
- ✅ Setup routing

### Phase 2: Enhanced Lesson Builder
- ✅ Auto-fetch components
- ✅ Skills selector (remove objectives/criteria)
- ✅ Drag & drop sections
- ✅ Resources panel
- ✅ My Contribution feature
- ✅ Done/In Progress status

### Phase 3: Start Lesson (Class Management)
- ✅ Student cards layout
- ✅ Behavior point system (+/-)
- ✅ Badges (silver, bronze, gold)
- ✅ Comments
- ✅ Attendance
- ✅ Timer
- ✅ Randomizer
- ✅ Seating plan with geometries
- ✅ Conclude lesson

### Phase 4: Skills Evaluation
- ✅ Student-skill matrix
- ✅ Text and slider inputs
- ✅ Milestone tracking
- ✅ Student dashboard graphs

### Phase 5: Supporting Features
- ✅ Printables manager
- ✅ Homework assignment
- ✅ Quick view
- ✅ Coming soon placeholders

### Phase 6: Database & Backend
- ✅ Create all tables
- ✅ Setup RLS policies
- ✅ Create storage buckets
- ✅ API endpoints for contribution counting

### Phase 7: Testing & Polish
- ✅ Test full workflow
- ✅ Performance optimization
- ✅ UI/UX polish
- ✅ Documentation

---

## 🚀 Estimated Timeline

- **Phase 1:** 2-3 hours
- **Phase 2:** 4-5 hours
- **Phase 3:** 5-6 hours
- **Phase 4:** 3-4 hours
- **Phase 5:** 2-3 hours
- **Phase 6:** 2-3 hours
- **Phase 7:** 2-3 hours

**Total:** ~20-27 hours of development

---

## ⚠️ Critical Requirements

1. **Lesson can ONLY start on scheduled day** - Implement date validation
2. **All behavior data saved to student records** - Persistent storage
3. **Contribution counting** - Track and display in dashboards
4. **Shared lesson plans** - Other teachers can view/edit
5. **Real-time updates** - Multiple teachers can work simultaneously
6. **File storage** - Supabase buckets for resources
7. **Milestones timeline** - Student progress tracking

---

## 🎨 UI/UX Considerations

- Neon geometry for seating plans (high visibility)
- Card-based student management
- Hover interactions for points/badges
- Drag & drop for resources
- Responsive design (works on tablets)
- Loading states for all async operations
- Toast notifications for success/error

---

## 📝 Notes

This is a MASSIVE feature set. We should implement it incrementally, testing each phase before moving to the next. Start with the curriculum tab structure and lesson builder, then progressively add more complex features like class management and skills evaluation.

---

**Status:** 📋 Planning Complete - Ready to implement Phase 1
