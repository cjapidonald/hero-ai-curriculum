-- Setup curriculum sessions for Teacher Donald
-- Run this in Supabase Dashboard → SQL Editor

-- First, let's verify teacher Donald exists and get his info
DO $$
DECLARE
  donald_id UUID;
  donald_name TEXT;
  class_count INT;
BEGIN
  -- Find Donald
  SELECT id, name || ' ' || surname INTO donald_id, donald_name
  FROM teachers
  WHERE name ILIKE '%donald%'
  LIMIT 1;

  IF donald_id IS NULL THEN
    RAISE EXCEPTION 'Teacher Donald not found!';
  END IF;

  -- Count his classes
  SELECT COUNT(*) INTO class_count
  FROM classes
  WHERE teacher_id = donald_id AND is_active = true;

  RAISE NOTICE 'Found teacher: % (ID: %)', donald_name, donald_id;
  RAISE NOTICE 'Classes: %', class_count;
END $$;

-- Clean up any existing sessions for Donald
DELETE FROM class_sessions
WHERE teacher_id IN (
  SELECT id FROM teachers WHERE name ILIKE '%donald%'
);

-- Create class sessions for the next 2 weeks
-- This will create sessions for each of Donald's classes
INSERT INTO class_sessions (
  teacher_id,
  class_id,
  curriculum_id,
  session_date,
  start_time,
  end_time,
  status,
  lesson_plan_completed,
  attendance_taken,
  location,
  notes
)
SELECT
  t.id as teacher_id,
  c.id as class_id,
  curr.id as curriculum_id,
  date_series.session_date,
  CASE
    WHEN ROW_NUMBER() OVER (PARTITION BY date_series.session_date, c.id ORDER BY curr.id) % 2 = 0
    THEN '09:00:00'::TIME
    ELSE '14:00:00'::TIME
  END as start_time,
  CASE
    WHEN ROW_NUMBER() OVER (PARTITION BY date_series.session_date, c.id ORDER BY curr.id) % 2 = 0
    THEN '10:30:00'::TIME
    ELSE '15:30:00'::TIME
  END as end_time,
  CASE
    WHEN date_series.session_date < CURRENT_DATE THEN 'completed'
    WHEN date_series.session_date = CURRENT_DATE THEN 'ready'
    WHEN date_series.session_date = CURRENT_DATE + INTERVAL '1 day' THEN 'building'
    ELSE 'scheduled'
  END as status,
  CASE
    WHEN date_series.session_date < CURRENT_DATE THEN true
    WHEN date_series.session_date = CURRENT_DATE THEN true
    WHEN date_series.session_date = CURRENT_DATE + INTERVAL '1 day' THEN true
    ELSE false
  END as lesson_plan_completed,
  CASE
    WHEN date_series.session_date < CURRENT_DATE THEN true
    ELSE false
  END as attendance_taken,
  'Main Building - Room ' || (100 + ROW_NUMBER() OVER (ORDER BY c.id)) as location,
  'Auto-generated session for curriculum management testing' as notes
FROM
  teachers t
  CROSS JOIN LATERAL (
    SELECT
      (CURRENT_DATE + (n || ' days')::INTERVAL)::DATE as session_date
    FROM generate_series(0, 13) n
    WHERE EXTRACT(DOW FROM (CURRENT_DATE + (n || ' days')::INTERVAL)) NOT IN (0, 6) -- Skip weekends
  ) date_series
  CROSS JOIN classes c
  CROSS JOIN LATERAL (
    SELECT id FROM curriculum ORDER BY RANDOM() LIMIT 1
  ) curr
WHERE
  t.name ILIKE '%donald%'
  AND c.teacher_id = t.id
  AND c.is_active = true;

-- Verify the data was created
DO $$
DECLARE
  session_count INT;
  scheduled_count INT;
  building_count INT;
  ready_count INT;
  completed_count INT;
BEGIN
  -- Count sessions by status
  SELECT
    COUNT(*),
    SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END),
    SUM(CASE WHEN status = 'building' THEN 1 ELSE 0 END),
    SUM(CASE WHEN status = 'ready' THEN 1 ELSE 0 END),
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)
  INTO
    session_count,
    scheduled_count,
    building_count,
    ready_count,
    completed_count
  FROM class_sessions cs
  JOIN teachers t ON cs.teacher_id = t.id
  WHERE t.name ILIKE '%donald%';

  RAISE NOTICE '';
  RAISE NOTICE '=== SETUP COMPLETE ===';
  RAISE NOTICE 'Total sessions created: %', session_count;
  RAISE NOTICE 'Scheduled: %', scheduled_count;
  RAISE NOTICE 'Building: %', building_count;
  RAISE NOTICE 'Ready: %', ready_count;
  RAISE NOTICE 'Completed: %', completed_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Teacher Donald can now:';
  RAISE NOTICE '1. Login and navigate to Curriculum tab';
  RAISE NOTICE '2. See all scheduled sessions';
  RAISE NOTICE '3. Click "Build" on building/scheduled sessions';
  RAISE NOTICE '4. Click "View" on ready/completed sessions';
  RAISE NOTICE '5. Click "Start" on ready sessions (for today)';
END $$;

-- Show a sample of the created sessions
SELECT
  cs.session_date,
  cs.start_time,
  cs.end_time,
  c.class_name,
  cu.lesson_title,
  cs.status,
  cs.lesson_plan_completed,
  cs.location
FROM class_sessions cs
JOIN teachers t ON cs.teacher_id = t.id
JOIN classes c ON cs.class_id = c.id
LEFT JOIN curriculum cu ON cs.curriculum_id = cu.id
WHERE t.name ILIKE '%donald%'
ORDER BY cs.session_date, cs.start_time
LIMIT 10;
