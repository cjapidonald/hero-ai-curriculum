# 🔧 Fix Donald Chapman's Missing Curriculum

## The Problem
Donald Chapman has 0 curriculum assignments in the `teacher_assignments` table, which is why the Curriculum tab shows "No curriculum lessons found".

## The Solution
Run the SQL below in the Supabase SQL Editor to create 44 curriculum assignments for Donald Chapman.

---

## Steps:

### 1. Open Supabase SQL Editor
Go to: https://supabase.com/dashboard/project/mqlihjzdfkhaomehxbye/sql/new

### 2. Copy and paste the SQL below:

```sql
-- Create teacher_assignments for Donald Chapman
-- This assigns all 44 curriculum items to his primary class

DO $$
DECLARE
  donald_teacher_id UUID := '389ea82c-db4c-40be-aee0-6b39785813da';
  primary_class_id UUID;
  curriculum_record RECORD;
  assignment_date DATE;
  week_counter INT := 0;
  day_counter INT := 0;
  created_count INT := 0;
BEGIN
  -- Get Donald's primary class
  SELECT id INTO primary_class_id
  FROM classes
  WHERE teacher_id = donald_teacher_id
    AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;

  IF primary_class_id IS NULL THEN
    RAISE EXCEPTION 'No active class found for Donald Chapman';
  END IF;

  RAISE NOTICE 'Using class: %', primary_class_id;

  -- Delete any existing assignments (cleanup)
  DELETE FROM teacher_assignments
  WHERE teacher_id = donald_teacher_id;

  RAISE NOTICE 'Cleaned up old assignments';

  -- Create assignments for each curriculum item
  FOR curriculum_record IN
    SELECT id, lesson_title, lesson_number, lesson_date
    FROM curriculum
    WHERE teacher_id = donald_teacher_id
    ORDER BY lesson_number
  LOOP
    -- Calculate teaching date (spread over 10 weeks, 5 lessons per week)
    day_counter := ((curriculum_record.lesson_number - 1) % 5);
    week_counter := ((curriculum_record.lesson_number - 1) / 5);
    assignment_date := CURRENT_DATE + (week_counter * 7) + day_counter;

    -- Use curriculum's lesson_date if available
    IF curriculum_record.lesson_date IS NOT NULL THEN
      assignment_date := curriculum_record.lesson_date;
    END IF;

    -- Insert teacher_assignment
    INSERT INTO teacher_assignments (
      teacher_id,
      curriculum_id,
      class_id,
      teaching_date,
      start_time,
      end_time,
      status,
      notes
    ) VALUES (
      donald_teacher_id,
      curriculum_record.id,
      primary_class_id,
      assignment_date,
      '09:00:00',
      '10:00:00',
      'scheduled',
      'Auto-assigned: ' || curriculum_record.lesson_title
    );

    created_count := created_count + 1;
  END LOOP;

  RAISE NOTICE 'Successfully created % teacher assignments', created_count;
END $$;

-- Verify the assignments were created
SELECT
  COUNT(*) as total_assignments,
  MIN(teaching_date) as first_lesson,
  MAX(teaching_date) as last_lesson,
  COUNT(DISTINCT status) as status_count
FROM teacher_assignments
WHERE teacher_id = '389ea82c-db4c-40be-aee0-6b39785813da';

-- Show first 10 assignments as sample
SELECT
  ta.teaching_date,
  ta.status,
  c.lesson_number,
  c.lesson_title,
  c.subject,
  cls.class_name
FROM teacher_assignments ta
JOIN curriculum c ON c.id = ta.curriculum_id
JOIN classes cls ON cls.id = ta.class_id
WHERE ta.teacher_id = '389ea82c-db4c-40be-aee0-6b39785813da'
ORDER BY c.lesson_number
LIMIT 10;
```

### 3. Click "Run" button

You should see output like:
```
total_assignments: 44
first_lesson: 2025-10-26
last_lesson: 2025-01-02
status_count: 1
```

Plus a table showing the first 10 assignments.

### 4. Refresh the Curriculum Tab

Go to: http://localhost:8080/teacher/dashboard?tab=curriculum

You should now see 44 curriculum lessons for Donald Chapman!

---

## What This SQL Does:

1. ✅ Finds Donald Chapman's primary class
2. ✅ Deletes any old assignments (cleanup)
3. ✅ Loops through all 44 curriculum items
4. ✅ Creates a teacher_assignment for each one
5. ✅ Spreads lessons over 10 weeks (5 per week)
6. ✅ Sets status as "scheduled"
7. ✅ Uses curriculum's lesson_date if available
8. ✅ Assigns all to his primary class

---

## Expected Result:

After running this SQL, Donald Chapman will have:
- ✅ 44 curriculum assignments
- ✅ Lessons spread from today to ~10 weeks from now
- ✅ All assigned to his "Donald Chapman - English Excellence" class
- ✅ All marked as "scheduled"

The Curriculum tab will display all 44 lessons with:
- Subject, Lesson Number, Title, Class Name, Date, Status
- 8 action buttons per lesson (Build, Start, Evaluate, etc.)
- Search and filter functionality

---

## Alternative: Run in Local Supabase

If you want to test in local first:

```bash
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f create-donald-assignments.sql
```

Then switch your .env to use local Supabase:
```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
```

---

**Let me know once you run this and I'll verify it worked!** ✅
