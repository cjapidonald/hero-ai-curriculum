-- =============================================
-- SETUP CURRICULUM FOR DONALD CHAPMAN (REMOTE)
-- =============================================
-- Donald Chapman UUID: 389ea82c-db4c-40be-aee0-6b39785813da
-- Email: donald@heroschool.com
-- Password: teacher123
-- =============================================
-- 🚨 RUN THIS IN SUPABASE DASHBOARD SQL EDITOR
-- Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
-- =============================================

-- Step 1: Verify Donald exists
SELECT '=== VERIFY DONALD ===' as step;
SELECT id, name, surname, email, is_active
FROM teachers
WHERE id = '389ea82c-db4c-40be-aee0-6b39785813da';

-- Step 2: Create or assign a class to Donald
INSERT INTO classes (
  class_name,
  stage,
  level,
  teacher_name,
  teacher_id,
  max_students,
  current_students,
  classroom,
  classroom_location,
  schedule,
  start_date,
  end_date,
  is_active
) VALUES (
  'Donald Chapman - English Excellence',
  'stage_4',
  'B1',
  'Donald Chapman',
  '389ea82c-db4c-40be-aee0-6b39785813da',
  15,
  0,
  'Room 301',
  'Main Building - 3rd Floor',
  'Mon, Wed, Fri - 14:00-15:30',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '6 months',
  true
)
ON CONFLICT (class_name) DO UPDATE
SET
  teacher_id = EXCLUDED.teacher_id,
  teacher_name = EXCLUDED.teacher_name,
  is_active = true,
  updated_at = NOW()
RETURNING id, class_name;

-- Step 3: Create curriculum items for Donald
INSERT INTO curriculum (
  teacher_id,
  teacher_name,
  subject,
  lesson_title,
  lesson_date,
  class_id,
  stage,
  lesson_skills,
  success_criteria,
  status
) VALUES
-- Lesson 1: Today
(
  '389ea82c-db4c-40be-aee0-6b39785813da',
  'Donald Chapman',
  'English',
  'Introduction to Advanced Grammar',
  CURRENT_DATE,
  (SELECT id FROM classes WHERE teacher_id = '389ea82c-db4c-40be-aee0-6b39785813da' LIMIT 1),
  'stage_4',
  'Grammar, Writing, Speaking',
  'Students can use complex sentences correctly',
  'scheduled'
),
-- Lesson 2: +2 days
(
  '389ea82c-db4c-40be-aee0-6b39785813da',
  'Donald Chapman',
  'English',
  'Business English - Professional Communication',
  CURRENT_DATE + INTERVAL '2 days',
  (SELECT id FROM classes WHERE teacher_id = '389ea82c-db4c-40be-aee0-6b39785813da' LIMIT 1),
  'stage_4',
  'Speaking, Listening, Vocabulary',
  'Students can conduct professional conversations',
  'scheduled'
),
-- Lesson 3: +4 days
(
  '389ea82c-db4c-40be-aee0-6b39785813da',
  'Donald Chapman',
  'English',
  'Academic Writing - Essay Composition',
  CURRENT_DATE + INTERVAL '4 days',
  (SELECT id FROM classes WHERE teacher_id = '389ea82c-db4c-40be-aee0-6b39785813da' LIMIT 1),
  'stage_4',
  'Writing, Reading, Vocabulary',
  'Students can write structured academic essays',
  'scheduled'
),
-- Lesson 4: +6 days
(
  '389ea82c-db4c-40be-aee0-6b39785813da',
  'Donald Chapman',
  'English',
  'Reading Comprehension - Literary Analysis',
  CURRENT_DATE + INTERVAL '6 days',
  (SELECT id FROM classes WHERE teacher_id = '389ea82c-db4c-40be-aee0-6b39785813da' LIMIT 1),
  'stage_4',
  'Reading, Comprehension, Vocabulary',
  'Students can analyze literary texts critically',
  'scheduled'
),
-- Lesson 5: +8 days
(
  '389ea82c-db4c-40be-aee0-6b39785813da',
  'Donald Chapman',
  'English',
  'Presentation Skills - Public Speaking',
  CURRENT_DATE + INTERVAL '8 days',
  (SELECT id FROM classes WHERE teacher_id = '389ea82c-db4c-40be-aee0-6b39785813da' LIMIT 1),
  'stage_4',
  'Speaking, Fluency, Pronunciation',
  'Students can deliver confident presentations',
  'scheduled'
),
-- Lesson 6: +10 days
(
  '389ea82c-db4c-40be-aee0-6b39785813da',
  'Donald Chapman',
  'English',
  'Advanced Vocabulary - Idiomatic Expressions',
  CURRENT_DATE + INTERVAL '10 days',
  (SELECT id FROM classes WHERE teacher_id = '389ea82c-db4c-40be-aee0-6b39785813da' LIMIT 1),
  'stage_4',
  'Vocabulary, Speaking, Listening',
  'Students can use idioms appropriately in context',
  'scheduled'
),
-- Lesson 7: +12 days
(
  '389ea82c-db4c-40be-aee0-6b39785813da',
  'Donald Chapman',
  'English',
  'Listening Skills - News and Media',
  CURRENT_DATE + INTERVAL '12 days',
  (SELECT id FROM classes WHERE teacher_id = '389ea82c-db4c-40be-aee0-6b39785813da' LIMIT 1),
  'stage_4',
  'Listening, Comprehension, Vocabulary',
  'Students can understand news broadcasts and podcasts',
  'scheduled'
),
-- Lesson 8: +14 days
(
  '389ea82c-db4c-40be-aee0-6b39785813da',
  'Donald Chapman',
  'English',
  'Debate and Discussion - Critical Thinking',
  CURRENT_DATE + INTERVAL '14 days',
  (SELECT id FROM classes WHERE teacher_id = '389ea82c-db4c-40be-aee0-6b39785813da' LIMIT 1),
  'stage_4',
  'Speaking, Listening, Critical Thinking',
  'Students can engage in structured debates',
  'scheduled'
)
ON CONFLICT DO NOTHING
RETURNING id, lesson_title, lesson_date;

-- Step 4: Create teacher_assignments (trigger will create class_sessions)
DO $$
DECLARE
  donald_id UUID := '389ea82c-db4c-40be-aee0-6b39785813da';
  class_id UUID;
  curr_rec RECORD;
BEGIN
  -- Get Donald's class
  SELECT id INTO class_id
  FROM classes
  WHERE teacher_id = donald_id
    AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;

  -- Create assignments for each curriculum item
  FOR curr_rec IN
    SELECT id, lesson_date, lesson_title
    FROM curriculum
    WHERE teacher_id = donald_id
      AND lesson_date >= CURRENT_DATE
    ORDER BY lesson_date
    LIMIT 10
  LOOP
    INSERT INTO teacher_assignments (
      teacher_id,
      class_id,
      curriculum_id,
      teaching_date,
      start_time,
      end_time,
      status,
      location,
      notes
    ) VALUES (
      donald_id,
      class_id,
      curr_rec.id,
      curr_rec.lesson_date,
      '14:00:00'::TIME,
      '15:30:00'::TIME,
      'scheduled',
      'Room 301',
      'Assignment for: ' || curr_rec.lesson_title
    )
    ON CONFLICT DO NOTHING;
  END LOOP;

  RAISE NOTICE 'Created assignments for Donald Chapman';
END $$;

-- Step 5: Manually create class_sessions (in case trigger doesn't exist yet)
INSERT INTO class_sessions (
  teacher_id,
  class_id,
  curriculum_id,
  session_date,
  start_time,
  end_time,
  status,
  location,
  notes
)
SELECT
  ta.teacher_id,
  ta.class_id,
  ta.curriculum_id,
  ta.teaching_date,
  ta.start_time,
  ta.end_time,
  ta.status,
  ta.location,
  'Session for: ' || c.lesson_title
FROM teacher_assignments ta
LEFT JOIN curriculum c ON c.id = ta.curriculum_id
WHERE ta.teacher_id = '389ea82c-db4c-40be-aee0-6b39785813da'
  AND ta.curriculum_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM class_sessions cs
    WHERE cs.teacher_id = ta.teacher_id
      AND cs.session_date = ta.teaching_date
      AND (cs.curriculum_id = ta.curriculum_id OR (cs.curriculum_id IS NULL AND ta.curriculum_id IS NULL))
  )
ON CONFLICT DO NOTHING
RETURNING id, session_date, (SELECT lesson_title FROM curriculum WHERE id = curriculum_id);

-- Step 6: Verify Donald's complete setup
SELECT '=== VERIFICATION RESULTS ===' as step;

SELECT 'Total Classes' as metric, COUNT(*) as count
FROM classes
WHERE teacher_id = '389ea82c-db4c-40be-aee0-6b39785813da'
  AND is_active = true;

SELECT 'Total Curriculum' as metric, COUNT(*) as count
FROM curriculum
WHERE teacher_id = '389ea82c-db4c-40be-aee0-6b39785813da';

SELECT 'Total Assignments' as metric, COUNT(*) as count
FROM teacher_assignments
WHERE teacher_id = '389ea82c-db4c-40be-aee0-6b39785813da';

SELECT 'Total Sessions' as metric, COUNT(*) as count
FROM class_sessions
WHERE teacher_id = '389ea82c-db4c-40be-aee0-6b39785813da';

-- Step 7: Show Donald's schedule
SELECT '=== DONALD CHAPMAN''S SCHEDULE ===' as step;

SELECT
  ROW_NUMBER() OVER (ORDER BY cs.session_date, cs.start_time) as "#",
  TO_CHAR(cs.session_date, 'Mon DD, YYYY') as date,
  TO_CHAR(cs.start_time, 'HH24:MI') as start_time,
  c.class_name,
  cur.lesson_title,
  cs.status
FROM class_sessions cs
LEFT JOIN classes c ON c.id = cs.class_id
LEFT JOIN curriculum cur ON cur.id = cs.curriculum_id
WHERE cs.teacher_id = '389ea82c-db4c-40be-aee0-6b39785813da'
ORDER BY cs.session_date, cs.start_time;

-- Step 8: Check auth user
SELECT '=== AUTH USER CHECK ===' as step;

SELECT id, email, email_confirmed_at
FROM auth.users
WHERE id = '389ea82c-db4c-40be-aee0-6b39785813da';

SELECT '✅ SETUP COMPLETE! Donald Chapman can now login and see curriculum!' as result;
