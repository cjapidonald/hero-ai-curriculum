-- =============================================
-- ASSIGN CURRICULUM AND CLASS TO DONALD CHAPMAN
-- =============================================

-- Step 1: Find Donald Chapman
SELECT
  id,
  name,
  surname,
  email,
  is_active
FROM teachers
WHERE name ILIKE '%donald%' OR surname ILIKE '%chapman%' OR email ILIKE '%donald%'
LIMIT 5;

-- Copy Donald's UUID from above and replace <DONALD_UUID> below

-- Step 2: Check if Donald has any classes
SELECT
  c.id,
  c.class_name,
  c.teacher_id,
  c.teacher_name,
  c.stage,
  c.level,
  c.is_active
FROM classes c
WHERE c.teacher_id = '<DONALD_UUID>';

-- Step 3: Check if Donald has any curriculum
SELECT
  id,
  lesson_title,
  subject,
  lesson_date,
  teacher_id,
  class_id
FROM curriculum
WHERE teacher_id = '<DONALD_UUID>';

-- Step 4: Check if Donald has any teacher_assignments
SELECT
  ta.id,
  ta.teaching_date,
  ta.start_time,
  ta.end_time,
  ta.status,
  c.class_name,
  cur.lesson_title
FROM teacher_assignments ta
LEFT JOIN classes c ON c.id = ta.class_id
LEFT JOIN curriculum cur ON cur.id = ta.curriculum_id
WHERE ta.teacher_id = '<DONALD_UUID>';

-- Step 5: Check if Donald has any class_sessions
SELECT
  cs.id,
  cs.session_date,
  cs.start_time,
  cs.status,
  cs.lesson_plan_completed,
  c.class_name,
  cur.lesson_title
FROM class_sessions cs
LEFT JOIN classes c ON c.id = cs.class_id
LEFT JOIN curriculum cur ON cur.id = cs.curriculum_id
WHERE cs.teacher_id = '<DONALD_UUID>';
