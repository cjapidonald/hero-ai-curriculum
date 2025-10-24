# Teacher View Fix - Complete Checklist

## Problem Summary
**Teachers cannot see their assigned curriculums and classes** because:
1. Admin assignments go into `teacher_assignments` table
2. Teachers query `class_sessions` table
3. **No sync exists between these two tables!**

---

## 🔴 CRITICAL FIX - Execute SQL Script

### Step 1: Run the SQL Script in Supabase Dashboard

1. **Open Supabase SQL Editor:**
   - Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
   - Or navigate to: Dashboard → SQL Editor → New Query

2. **Open the SQL file:**
   - File location: `/Users/donaldcjapi/Desktop/hero-ai-curriculum/EXECUTE_THIS_IN_SUPABASE_SQL_EDITOR.sql`
   - Copy the entire contents

3. **Paste and Execute:**
   - Paste the SQL into the editor
   - Click **"Run"** button
   - Wait for success message

4. **Verify Results:**
   - You should see output like:
     ```
     total_sessions_created | teachers_with_sessions
     ----------------------|----------------------
                         15 |                    3
     ```
   - And message: "SUCCESS! Teachers should now see their assigned curriculums!"

---

## ✅ VERIFICATION CHECKLIST

### Test 1: Teacher Can See Assigned Curriculums

- [ ] **Log in as a teacher** (e.g., Donald)
- [ ] **Navigate to:** Teacher Dashboard → **Curriculum** tab
- [ ] **Verify:** You see a list of assigned curriculum/lessons
- [ ] **Check columns:**
  - [ ] Lesson Title
  - [ ] Date
  - [ ] Class Name
  - [ ] Stage
  - [ ] Lesson Plan Status (badges)
  - [ ] Teaching Status (badges)
- [ ] **Check action buttons:**
  - [ ] "Lesson Builder" button (pencil icon)
  - [ ] "View Plan" button (eye icon) - if lesson completed
  - [ ] "Start Lesson" button (play icon) - if ready

**If you see "No sessions found":** The sync didn't work. Check Step 1 again.

---

### Test 2: Teacher Can See Assigned Classes

- [ ] **Still logged in as teacher** (e.g., Donald)
- [ ] **Navigate to:** Teacher Dashboard → **My Classes** tab
- [ ] **Verify:** You see a list of classes assigned to you
- [ ] **Check for each class:**
  - [ ] Class name
  - [ ] Student count
  - [ ] Average attendance percentage
  - [ ] "Take Attendance" button
- [ ] **Click a class** to see students
- [ ] **Verify:** Student cards show:
  - [ ] Student name
  - [ ] Attendance rate
  - [ ] Sessions left

**If you see "No students yet":** Admin hasn't assigned students to your classes yet (see Test 4).

**If you see empty class list:** Classes don't have `teacher_id` set (see Test 3).

---

### Test 3: Admin Can Assign Classes to Teachers

- [ ] **Log in as admin**
- [ ] **Navigate to:** Admin Dashboard → **Classes** (or wherever you manage classes)
- [ ] **Create or Edit a class**
- [ ] **Verify there's a "Teacher" dropdown:**
  - [ ] If YES: Select a teacher (e.g., Donald)
  - [ ] If NO: You need to add this field to the admin UI
- [ ] **Save the class**
- [ ] **Verify in database:**
  ```sql
  SELECT class_name, teacher_id, teacher_name
  FROM classes
  WHERE teacher_id IS NOT NULL;
  ```
  - [ ] Should show classes with teacher assigned

**Fix if missing:** Add teacher selection dropdown to admin class creation/edit form.

---

### Test 4: Admin Can Assign Students to Classes

- [ ] **Log in as admin**
- [ ] **Navigate to:** Admin Dashboard → **Students**
- [ ] **Create or Edit a student**
- [ ] **Verify there's a "Class" dropdown:**
  - [ ] If YES: Select a class
  - [ ] If NO: You need to add this field to student form
- [ ] **Save the student**
- [ ] **Verify enrollment created:**
  ```sql
  SELECT s.name, s.surname, c.class_name, e.is_active
  FROM enrollments e
  JOIN dashboard_students s ON s.id = e.student_id
  JOIN classes c ON c.id = e.class_id
  WHERE e.is_active = true;
  ```
  - [ ] Should show student enrolled in class

**Fix if missing:** Add class selection dropdown to admin student creation/edit form.

---

### Test 5: Admin Can Assign Curriculum to Teachers

- [ ] **Log in as admin**
- [ ] **Navigate to:** Admin Dashboard → **Teacher Assignments** tab
- [ ] **Click "New Assignment" or similar**
- [ ] **Fill in form:**
  - [ ] Teacher: (select a teacher)
  - [ ] Class: (select a class)
  - [ ] Curriculum: (select a lesson)
  - [ ] Teaching Date: (pick a date)
  - [ ] Start Time / End Time
  - [ ] Status: "Scheduled"
- [ ] **Save assignment**
- [ ] **Verify in `teacher_assignments` table:**
  ```sql
  SELECT
    t.name as teacher_name,
    c.class_name,
    cur.lesson_title,
    ta.teaching_date,
    ta.status
  FROM teacher_assignments ta
  JOIN teachers t ON t.id = ta.teacher_id
  LEFT JOIN classes c ON c.id = ta.class_id
  LEFT JOIN curriculum cur ON cur.id = ta.curriculum_id
  ORDER BY ta.teaching_date DESC;
  ```
  - [ ] Should show your new assignment

---

### Test 6: Verify Sync is Working

- [ ] **After creating assignment in Test 5**
- [ ] **Check `class_sessions` table:**
  ```sql
  SELECT
    t.name as teacher_name,
    c.class_name,
    cs.session_date,
    cs.status,
    cs.lesson_plan_completed
  FROM class_sessions cs
  JOIN teachers t ON t.id = cs.teacher_id
  LEFT JOIN classes c ON c.id = cs.class_id
  ORDER BY cs.session_date DESC;
  ```
  - [ ] Should show a matching record with same teacher/date/class
  - [ ] This proves the trigger is working!

**If no matching record:** Trigger didn't fire. Re-run Step 1.

---

### Test 7: End-to-End Flow

**Complete workflow from admin assignment to teacher viewing:**

- [ ] **Admin:** Create a new teacher assignment
  - Teacher: Donald
  - Class: Test Class A
  - Curriculum: Lesson 1 - Introduction
  - Date: Tomorrow
  - Time: 09:00 - 10:30

- [ ] **System:** Trigger auto-creates class_session

- [ ] **Teacher (Donald):** Log in and check Curriculum tab
  - [ ] See the new lesson listed
  - [ ] Date shows tomorrow
  - [ ] Status shows "Scheduled"
  - [ ] "Lesson Builder" button is available

- [ ] **Teacher (Donald):** Click "Lesson Builder"
  - [ ] Modal opens with lesson builder interface
  - [ ] Can add warm-up, body activities, resources, etc.
  - [ ] Click "Save" or "Done"

- [ ] **Teacher (Donald):** Return to Curriculum tab
  - [ ] Lesson status changed to "Ready" or "Building"
  - [ ] "View Plan" button now available
  - [ ] "Start Lesson" button available (if date is today/past)

**If ANY step fails:** Document where it broke and investigate.

---

## 🚨 TROUBLESHOOTING

### Problem: Teachers see "No sessions found"

**Diagnosis:**
```sql
-- Check if teacher has assignments
SELECT COUNT(*) FROM teacher_assignments WHERE teacher_id = '<teacher-uuid>';

-- Check if teacher has sessions
SELECT COUNT(*) FROM class_sessions WHERE teacher_id = '<teacher-uuid>';
```

**Fix:**
- If assignments exist but sessions don't → Re-run SQL script from Step 1
- If no assignments → Admin needs to create assignments first

---

### Problem: Teachers see "No classes"

**Diagnosis:**
```sql
-- Check if teacher_id is set on classes
SELECT class_name, teacher_id, teacher_name
FROM classes
WHERE teacher_id = '<teacher-uuid>';
```

**Fix:**
- If no results → Admin hasn't assigned classes to teacher
- If teacher_id is NULL → Update class to set teacher_id

**Manual fix:**
```sql
UPDATE classes
SET teacher_id = '<donald-uuid>',
    teacher_name = 'Donald Japi'
WHERE class_name = 'Test Class A';
```

---

### Problem: Trigger not working for new assignments

**Diagnosis:**
```sql
-- Check if trigger exists
SELECT tgname FROM pg_trigger WHERE tgname = 'trigger_sync_assignment_to_session';
```

**Fix:**
- If no result → Re-run Step 1 (SQL script)
- If exists → Check trigger function:
  ```sql
  \df sync_teacher_assignment_to_session
  ```

---

### Problem: Duplicate session errors

**Error:** `duplicate key value violates unique constraint "unique_teacher_date_curriculum"`

**This is NORMAL!** The constraint prevents creating duplicate sessions.

**Fix:**
- If you want to update existing session, use UPDATE instead of INSERT
- Or delete the old session first:
  ```sql
  DELETE FROM class_sessions
  WHERE teacher_id = '<uuid>'
    AND session_date = '2025-10-25'
    AND curriculum_id = '<curriculum-uuid>';
  ```

---

## 📊 DATABASE QUERIES FOR VERIFICATION

### Get all teachers with their assigned curriculums:
```sql
SELECT
  t.name || ' ' || t.surname as teacher,
  COUNT(DISTINCT cs.id) as total_sessions,
  COUNT(DISTINCT cs.class_id) as total_classes,
  MIN(cs.session_date) as earliest_session,
  MAX(cs.session_date) as latest_session
FROM teachers t
LEFT JOIN class_sessions cs ON cs.teacher_id = t.id
WHERE t.is_active = true
GROUP BY t.id, t.name, t.surname
ORDER BY total_sessions DESC;
```

### Get teacher's full schedule:
```sql
SELECT
  cs.session_date,
  cs.start_time,
  cs.end_time,
  c.class_name,
  cur.lesson_title,
  cs.status,
  cs.lesson_plan_completed
FROM class_sessions cs
LEFT JOIN classes c ON c.id = cs.class_id
LEFT JOIN curriculum cur ON cur.id = cs.curriculum_id
WHERE cs.teacher_id = (SELECT id FROM teachers WHERE email = 'donald@example.com')
ORDER BY cs.session_date, cs.start_time;
```

### Check sync status:
```sql
-- Assignments that don't have corresponding sessions (should be 0)
SELECT
  t.name,
  ta.teaching_date,
  cur.lesson_title,
  'MISSING SESSION' as issue
FROM teacher_assignments ta
JOIN teachers t ON t.id = ta.teacher_id
LEFT JOIN curriculum cur ON cur.id = ta.curriculum_id
WHERE NOT EXISTS (
  SELECT 1 FROM class_sessions cs
  WHERE cs.teacher_id = ta.teacher_id
    AND cs.session_date = ta.teaching_date
    AND cs.curriculum_id = ta.curriculum_id
)
AND ta.curriculum_id IS NOT NULL;
```

---

## 🎯 WHAT WAS FIXED

### Before:
1. ❌ Admin creates `teacher_assignments` record
2. ❌ Record stays in `teacher_assignments` table only
3. ❌ Teacher queries `class_sessions` table → finds nothing
4. ❌ Teacher sees "No sessions found"

### After:
1. ✅ Admin creates `teacher_assignments` record
2. ✅ Trigger auto-creates matching `class_sessions` record
3. ✅ Teacher queries `class_sessions` table → finds records
4. ✅ Teacher sees curriculum list with all assigned lessons!

---

## 📁 FILES CREATED

1. **Migration File:**
   - `/Users/donaldcjapi/Desktop/hero-ai-curriculum/supabase/migrations/20251116000000_sync_teacher_assignments_to_sessions.sql`
   - This is the permanent fix that will be applied when migrations work

2. **Standalone SQL Script:**
   - `/Users/donaldcjapi/Desktop/hero-ai-curriculum/EXECUTE_THIS_IN_SUPABASE_SQL_EDITOR.sql`
   - **RUN THIS NOW** in Supabase dashboard to fix immediately

3. **This Checklist:**
   - `/Users/donaldcjapi/Desktop/hero-ai-curriculum/TEACHER_VIEW_FIX_CHECKLIST.md`
   - Follow all tests to verify everything works

---

## ✅ FINAL CHECKLIST

Complete these in order:

- [ ] Execute SQL script in Supabase dashboard (Step 1)
- [ ] Test 1: Teacher sees curriculums
- [ ] Test 2: Teacher sees classes
- [ ] Test 3: Admin can assign classes to teachers
- [ ] Test 4: Admin can assign students to classes
- [ ] Test 5: Admin can assign curriculum to teachers
- [ ] Test 6: Verify sync is working
- [ ] Test 7: Complete end-to-end flow

---

## 🆘 NEED HELP?

If teachers still can't see curriculums after completing all steps:

1. **Check browser console** for JavaScript errors
2. **Check teacher's auth.uid()** matches teacher_id in database
3. **Verify RLS policies** aren't blocking access
4. **Run diagnostic queries** from the "Database Queries" section above
5. **Contact support** with specific error messages

---

## 🎉 SUCCESS CRITERIA

You'll know everything is working when:

✅ Teachers log in and see their curriculum list populated
✅ Teachers can click "Lesson Builder" and create lesson plans
✅ Teachers can see their assigned classes with students
✅ Admin creates assignment → Teacher sees it immediately
✅ No "No sessions found" messages for teachers with assignments

---

**Good luck! Execute that SQL script and test with Donald's account!**
