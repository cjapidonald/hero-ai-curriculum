-- =============================================
-- COMPLETE SETUP FOR DONALD
-- =============================================
-- Donald's UUID: 22b11e4b-a242-4fc3-bdbe-a6dab4aea948
-- Email: donald@heroschool.com
-- =============================================

-- Step 1: Create a new dedicated class for Donald if needed
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
  'Donald Chapman - Advanced English',
  'stage_4',
  'B1',
  'Donald Teacher',
  '22b11e4b-a242-4fc3-bdbe-a6dab4aea948',
  15,
  8,
  'Room 201',
  'Main Building - 2nd Floor',
  'Mon, Wed, Fri - 10:00-11:30',
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

-- Step 2: Store the class ID (copy from output above)
-- Replace <CLASS_ID> below with the actual ID

-- Step 3: Create curriculum lessons for Donald
INSERT INTO curriculum (
  teacher_id,
  teacher_name,
  subject,
  lesson_title,
  title,
  lesson_date,
  class_id,
  stage,
  curriculum_stage,
  lesson_number,
  lesson_skills,
  description,
  objectives,
  status
) VALUES
-- Lesson 1
(
  '22b11e4b-a242-4fc3-bdbe-a6dab4aea948',
  'Donald Teacher',
  'English',
  'Introduction to Advanced Grammar',
  'Introduction to Advanced Grammar',
  CURRENT_DATE + INTERVAL '1 day',
  (SELECT id FROM classes WHERE class_name = 'Donald Chapman - Advanced English' LIMIT 1),
  'stage_4',
  'B1',
  1,
  ARRAY['grammar', 'writing', 'speaking'],
  'Introduction to complex sentence structures and advanced grammar concepts',
  ARRAY['Understand complex sentences', 'Practice conditional forms', 'Apply grammar in context'],
  'scheduled'
),
-- Lesson 2
(
  '22b11e4b-a242-4fc3-bdbe-a6dab4aea948',
  'Donald Teacher',
  'English',
  'Academic Writing Skills',
  'Academic Writing Skills',
  CURRENT_DATE + INTERVAL '3 days',
  (SELECT id FROM classes WHERE class_name = 'Donald Chapman - Advanced English' LIMIT 1),
  'stage_4',
  'B1',
  2,
  ARRAY['writing', 'vocabulary', 'reading'],
  'Develop academic writing skills including essay structure and formal language',
  ARRAY['Structure an academic essay', 'Use formal vocabulary', 'Cite sources correctly'],
  'scheduled'
),
-- Lesson 3
(
  '22b11e4b-a242-4fc3-bdbe-a6dab4aea948',
  'Donald Teacher',
  'English',
  'Business English Communication',
  'Business English Communication',
  CURRENT_DATE + INTERVAL '5 days',
  (SELECT id FROM classes WHERE class_name = 'Donald Chapman - Advanced English' LIMIT 1),
  'stage_4',
  'B1',
  3,
  ARRAY['speaking', 'listening', 'vocabulary'],
  'Professional communication skills for business contexts',
  ARRAY['Conduct business meetings', 'Write professional emails', 'Present ideas clearly'],
  'scheduled'
),
-- Lesson 4
(
  '22b11e4b-a242-4fc3-bdbe-a6dab4aea948',
  'Donald Teacher',
  'English',
  'Critical Reading and Analysis',
  'Critical Reading and Analysis',
  CURRENT_DATE + INTERVAL '7 days',
  (SELECT id FROM classes WHERE class_name = 'Donald Chapman - Advanced English' LIMIT 1),
  'stage_4',
  'B1',
  4,
  ARRAY['reading', 'comprehension', 'vocabulary'],
  'Develop critical reading skills and analytical thinking',
  ARRAY['Analyze texts critically', 'Identify main arguments', 'Evaluate evidence'],
  'scheduled'
),
-- Lesson 5
(
  '22b11e4b-a242-4fc3-bdbe-a6dab4aea948',
  'Donald Teacher',
  'English',
  'Public Speaking and Presentations',
  'Public Speaking and Presentations',
  CURRENT_DATE + INTERVAL '10 days',
  (SELECT id FROM classes WHERE class_name = 'Donald Chapman - Advanced English' LIMIT 1),
  'stage_4',
  'B1',
  5,
  ARRAY['speaking', 'fluency', 'pronunciation'],
  'Master public speaking and presentation techniques',
  ARRAY['Deliver confident presentations', 'Use body language effectively', 'Engage audiences'],
  'scheduled'
)
ON CONFLICT DO NOTHING
RETURNING id, lesson_title, lesson_date;

-- Step 4: Create teacher_assignments (which will trigger class_sessions creation)
-- First, get curriculum IDs
DO $$
DECLARE
  donald_id UUID := '22b11e4b-a242-4fc3-bdbe-a6dab4aea948';
  class_id UUID;
  curr_rec RECORD;
BEGIN
  -- Get Donald's class
  SELECT id INTO class_id
  FROM classes
  WHERE teacher_id = donald_id
    AND class_name = 'Donald Chapman - Advanced English'
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
      '10:00:00',
      '11:30:00',
      'scheduled',
      'Room 201',
      'Auto-generated assignment for ' || curr_rec.lesson_title
    )
    ON CONFLICT DO NOTHING;
  END LOOP;

  RAISE NOTICE 'Created assignments for Donald';
END $$;

-- Step 5: Verify Donald's setup
SELECT
  'VERIFICATION RESULTS' as section,
  '' as details;

SELECT
  'Donald''s Classes:' as info,
  COUNT(*) as count
FROM classes
WHERE teacher_id = '22b11e4b-a242-4fc3-bdbe-a6dab4aea948'
  AND is_active = true;

SELECT
  'Donald''s Curriculum:' as info,
  COUNT(*) as count
FROM curriculum
WHERE teacher_id = '22b11e4b-a242-4fc3-bdbe-a6dab4aea948';

SELECT
  'Donald''s Assignments:' as info,
  COUNT(*) as count
FROM teacher_assignments
WHERE teacher_id = '22b11e4b-a242-4fc3-bdbe-a6dab4aea948';

SELECT
  'Donald''s Class Sessions:' as info,
  COUNT(*) as count
FROM class_sessions
WHERE teacher_id = '22b11e4b-a242-4fc3-bdbe-a6dab4aea948';

-- Step 6: Show Donald's complete schedule
SELECT
  cs.session_date,
  cs.start_time || ' - ' || cs.end_time as time_slot,
  c.class_name,
  cur.lesson_title,
  cs.status,
  cs.lesson_plan_completed
FROM class_sessions cs
LEFT JOIN classes c ON c.id = cs.class_id
LEFT JOIN curriculum cur ON cur.id = cs.curriculum_id
WHERE cs.teacher_id = '22b11e4b-a242-4fc3-bdbe-a6dab4aea948'
ORDER BY cs.session_date, cs.start_time;
