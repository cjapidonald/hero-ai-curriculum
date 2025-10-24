# 🧪 Testing Guide - Comprehensive Curriculum System

## ✅ System Status

**Development Server:** Running at http://localhost:8080/
**Compilation:** ✅ No errors
**Routes:** ✅ All configured
**Components:** ✅ All integrated
**Ready to Test:** ✅ YES!

---

## 🚀 Quick Start - Test the Complete Workflow

### Step 1: Access the Teacher Dashboard

1. **Open:** http://localhost:8080/
2. **You should be redirected to login**
3. **Login as Donald Chapman:**
   - Email: `donald@heroschool.com`
   - Password: `teacher123`
4. **You should see:** Teacher Dashboard

---

### Step 2: Test Curriculum Tab

**URL:** http://localhost:8080/teacher/dashboard?tab=curriculum

1. **Click:** "Curriculum" tab (4th tab)
2. **You should see:**
   - Table with assigned curriculum lessons
   - Search bar
   - Status filter dropdown
   - Subject filter dropdown

3. **Test Search:**
   - Type in search box
   - Results should filter in real-time

4. **Test Filters:**
   - Click status filter → Select "Scheduled"
   - Click subject filter → Select a subject
   - Results should update

5. **Test Quick View:**
   - Click "Quick view" button on any lesson
   - Dialog should open with lesson details
   - Should show skills, materials, dates
   - Click outside to close

---

### Step 3: Test Lesson Builder

**From Curriculum Tab:**

1. **Click:** "Manage" dropdown on any lesson
2. **Click:** "Build Lesson"
3. **You should see:**
   - Lesson Builder page
   - Auto-populated curriculum data (left side)
   - Skills selector
   - 6 lesson sections (Warm-up, Body, Assessment, Homework, Printables, Notes)
   - Resources panel (right side)
   - "My Resources & Contributions" section

4. **Test Skills Selection:**
   - Click skills dropdown
   - Search for a skill
   - Select multiple skills
   - Skills should appear as badges

5. **Test Drag & Drop:**
   - Drag a resource from the right panel
   - Drop it into a lesson section
   - Resource should appear in that section

6. **Test My Contribution:**
   - Click "Upload Contribution" button
   - Select a file
   - File should upload and appear in your resources

7. **Test Save:**
   - Click "Save" button
   - Toast notification should appear
   - Status should update

---

### Step 4: Test Start Lesson (Class Management)

**From Curriculum Tab:**

1. **Click:** "Manage" → "Start Lesson"
2. **Expected Behavior:**
   - ❗ If lesson is NOT scheduled for today → Error message + redirect
   - ✅ If lesson IS scheduled for today → Opens class management

**If you can access (lesson scheduled for today):**

3. **Test Attendance:**
   - Click "Select All Present" button
   - All students should be marked present
   - Click individual student names to toggle

4. **Test Behavior Points:**
   - Click "+" button on a student card
   - Points should increase
   - Click "-" button
   - Points should decrease

5. **Test Badges:**
   - Click gold badge at top of student card
   - Badge should highlight
   - Click again to remove
   - Repeat for silver and bronze

6. **Test Comments:**
   - Click "Add Comment" button on student card
   - Dialog should open
   - Type a comment
   - Click "Save Comment"
   - Button should show comment count

7. **Test Timer:**
   - Click "5 min" button
   - Timer should start countdown
   - Should show remaining time
   - When timer hits 0, toast notification appears

8. **Test Randomizer:**
   - Ensure some students are marked present
   - Click "Random Student" button
   - Toast should show a random student name

9. **Test Seating Plan:**
   - Click "Seating Plan" button
   - Dialog should open with neon-style classroom
   - Test geometry selector:
     - "All Students" → Rows layout
     - "Groups" → Circular group arrangement
     - "Pairs" → 2-person groups
     - "Groups of 3" → Triangle arrangement
   - Try dragging a student to a new position
   - Click "Save Layout"
   - Click "Close"

10. **Test Conclude Lesson:**
    - Scroll to top
    - Click "Conclude Lesson" button
    - Should save all data
    - Should redirect to curriculum tab

---

### Step 5: Test Skills Evaluation

**From Curriculum Tab:**

1. **Click:** "Manage" → "Evaluate"
2. **You should see:**
   - Left panel: Student list with completion counts
   - Right panel: Skills evaluation forms

3. **Select a Student:**
   - Click a student name in left panel
   - Student should highlight
   - Skills should appear on right

4. **Test Slider Evaluation:**
   - For a skill, ensure "Slider" tab is selected
   - Drag the slider
   - Percentage should update
   - Click "Save"
   - Badge should show "Saved"

5. **Test Text Evaluation:**
   - Click "Text" tab on a skill
   - Type evaluation notes
   - Click "Save"
   - Badge should show "Saved"

6. **Test Save All:**
   - Evaluate multiple skills
   - Click "Save All" button at top
   - All unsaved evaluations should save
   - Toast notification with count

7. **Test Student Navigation:**
   - Click different students in left panel
   - Their evaluations should load
   - Completion count should show X/Y skills

---

### Step 6: Test Printables Manager

**From Curriculum Tab:**

1. **Click:** "Manage" → "Printables"
2. **You should see:**
   - Left panel: Student selection with checkboxes
   - Right panel: Printables list

3. **Test Student Selection:**
   - Click individual checkboxes
   - Click "Select All" button
   - All should be checked
   - Click "Clear" button
   - All should uncheck

4. **Test Distribution:**
   - Select some students
   - Click "Distribute" button on a printable
   - Toast should confirm
   - Badge should show "Distributed"

5. **Test Download:**
   - If printable has a file URL
   - Click "Download" button
   - Should open file in new tab

---

### Step 7: Test Homework Manager

**From Curriculum Tab:**

1. **Click:** "Manage" → "Homework"
2. **You should see:**
   - Left panel: Student selection
   - Top: Due date picker
   - Right panel: Homework items

3. **Test Due Date:**
   - Click calendar button
   - Select a date
   - Date should display
   - Click "Clear" to remove

4. **Test Student Selection:**
   - Same as printables (checkboxes)

5. **Test Assignment:**
   - Select students
   - Optionally set due date
   - Click "Assign" button on homework
   - Toast should confirm
   - Badge should show "Assigned"

6. **Test View Homework:**
   - If homework has a URL
   - Click "View" button
   - Should open in new tab

---

## 📊 Database Verification

After testing workflows, verify data was saved:

### Check Supabase Tables

**Option 1: Supabase Dashboard**
1. Go to: https://supabase.com/dashboard/project/mqlihjzdfkhaomehxbye/editor
2. Check these tables:

```sql
-- Lesson sessions
SELECT * FROM lesson_sessions ORDER BY created_at DESC LIMIT 5;

-- Behavior points
SELECT * FROM student_behavior_points ORDER BY recorded_at DESC LIMIT 10;

-- Skill evaluations
SELECT * FROM skill_evaluations_new ORDER BY evaluated_at DESC LIMIT 10;

-- Student milestones (auto-updated by trigger)
SELECT * FROM student_skill_milestones ORDER BY updated_at DESC LIMIT 5;

-- Printables distributed
SELECT * FROM printables_distributed ORDER BY distributed_at DESC LIMIT 5;

-- Homework assignments
SELECT * FROM homework_assignments_new ORDER BY assigned_at DESC LIMIT 5;

-- Teacher contribution stats (auto-updated by trigger)
SELECT * FROM teacher_contribution_stats WHERE teacher_id = '022fa037-c099-4905-8cfc-95cf73ec8129';
```

**Option 2: Local Postgres**
If using local Supabase:

```bash
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
```

Then run the same queries above.

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot start lesson" error

**Cause:** Lesson is not scheduled for today
**Solution:**
1. Check the `teaching_date` in `teacher_assignments` table
2. Update it to today's date:
```sql
UPDATE teacher_assignments
SET teaching_date = CURRENT_DATE
WHERE id = 'assignment-id';
```

### Issue: No students appear in Start Lesson

**Cause:** No students in the class
**Solution:**
1. Check students table: `SELECT * FROM students WHERE class_id = 'class-id'`
2. Add test students if needed

### Issue: No skills appear in Evaluation

**Cause:** No skills attached to lesson
**Solution:**
1. Go to Lesson Builder
2. Add skills from dropdown
3. Save lesson plan
4. Try evaluation again

### Issue: No printables/homework appear

**Cause:** Lesson plan has no resources
**Solution:**
1. Go to Lesson Builder
2. Drag resources into Homework or Printables sections
3. Save lesson plan
4. Try again

### Issue: Seating plan shows "No students present"

**Cause:** No attendance marked
**Solution:**
1. Go back to Start Lesson
2. Click "Select All Present"
3. Open seating plan again

---

## ✅ Feature Checklist

Use this checklist to verify all features work:

### Curriculum Tab
- [ ] Table displays lessons
- [ ] Search works
- [ ] Status filter works
- [ ] Subject filter works
- [ ] Quick view opens
- [ ] All 8 action buttons visible

### Lesson Builder
- [ ] Auto-fetch populates data
- [ ] Skills dropdown works
- [ ] Skills can be selected
- [ ] Drag & drop works
- [ ] Resources appear in sections
- [ ] Upload contribution works
- [ ] Save updates database

### Start Lesson
- [ ] Date validation works
- [ ] Student cards display
- [ ] Attendance toggle works
- [ ] Points +/- work
- [ ] Badges toggle
- [ ] Comments save
- [ ] Timer counts down
- [ ] Randomizer works
- [ ] Seating plan opens
- [ ] All 4 geometries work
- [ ] Drag students works
- [ ] Save layout works
- [ ] Conclude lesson works

### Skills Evaluation
- [ ] Student list displays
- [ ] Completion counts show
- [ ] Slider input works
- [ ] Text input works
- [ ] Individual save works
- [ ] Save all works
- [ ] Saved badges appear
- [ ] Data persists

### Printables Manager
- [ ] Student selection works
- [ ] Printables list displays
- [ ] Distribute works
- [ ] Download works
- [ ] Distributed badges appear

### Homework Manager
- [ ] Student selection works
- [ ] Due date picker works
- [ ] Homework list displays
- [ ] Assign works
- [ ] View homework works
- [ ] Assigned badges appear

---

## 🎯 Performance Testing

### Check Page Load Times
- Curriculum Tab: Should load < 2 seconds
- Lesson Builder: Should load < 3 seconds
- Start Lesson: Should load < 2 seconds
- Skills Evaluation: Should load < 2 seconds

### Check Data Sync
- Make a change (e.g., add points)
- Reload the page
- Change should persist

### Check Multiple Students
- Test with 30+ students
- UI should remain responsive
- No lag when scrolling

---

## 📱 Browser Testing

Test in multiple browsers:
- [ ] Chrome (primary)
- [ ] Firefox
- [ ] Safari
- [ ] Edge

Test on different screen sizes:
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

---

## 🔐 Security Testing

### RLS Policy Verification

1. **Test as different teacher:**
   - Login as different teacher
   - Should NOT see Donald's data
   - Should only see their own curriculum

2. **Test unauthenticated:**
   - Clear cookies
   - Try to access /teacher/dashboard
   - Should redirect to login

3. **Test student access:**
   - Login as student
   - Try to access teacher routes
   - Should be blocked

---

## 📝 Test Scenarios

### Scenario 1: New Teacher First Lesson

1. Login as new teacher
2. View curriculum (should see assigned lessons)
3. Build first lesson
4. Start lesson on scheduled day
5. Take attendance
6. Award points
7. Use seating plan
8. Evaluate skills
9. Assign homework
10. Conclude lesson

**Expected:** All features work smoothly, data saves

### Scenario 2: Experienced Teacher

1. Login
2. View past lessons (concluded status)
3. View upcoming lessons
4. Edit an existing lesson plan
5. Start today's lesson
6. Use all class management features
7. Complete evaluations quickly (Save All)
8. Distribute printables and homework
9. Conclude

**Expected:** Efficient workflow, past data visible

### Scenario 3: Heavy Usage

1. Class with 35 students
2. 8 skills to evaluate
3. Multiple printables
4. Multiple homework items
5. Active use of seating plan
6. Many comments and points

**Expected:** System remains responsive

---

## 🎉 Success Criteria

The system is working correctly if:

✅ All pages load without errors
✅ All forms submit successfully
✅ Data persists across page reloads
✅ UI is responsive and smooth
✅ No console errors in browser
✅ Database tables populate correctly
✅ Triggers update milestone tables
✅ RLS policies enforce security
✅ Navigation works between all pages
✅ Toast notifications appear

---

## 📞 Next Steps After Testing

Once testing is complete:

1. **Document Issues:**
   - Note any bugs found
   - Screenshot any errors
   - Record steps to reproduce

2. **Performance Notes:**
   - Note any slow pages
   - Identify bottlenecks
   - Check database query performance

3. **UX Feedback:**
   - Note confusing flows
   - Identify missing features
   - Suggest improvements

4. **Deploy to Staging:**
   - Run `npm run build`
   - Deploy to staging environment
   - Test in production-like setup

5. **User Acceptance Testing:**
   - Have real teachers test
   - Gather feedback
   - Iterate based on input

---

## 🚀 Ready to Go!

**Start here:** http://localhost:8080/

**Login:** donald@heroschool.com / teacher123

**Begin with:** Curriculum Tab → Build Lesson → Start Lesson

**Have fun testing the complete LMS system!** 🎓

---

**Last Updated:** October 24, 2025
**System Version:** 1.0.0
**Status:** Ready for Testing
