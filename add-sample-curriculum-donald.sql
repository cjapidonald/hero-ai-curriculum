-- Add sample curriculum back to Donald Chapman for testing
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/mqlihjzdfkhaomehxbye/sql/new

BEGIN;

DO $$
DECLARE
  donald_id UUID := '389ea82c-db4c-40be-aee0-6b39785813da';
  primary_class_id UUID;
  curr_rec RECORD;
  created_count INT := 0;
BEGIN
  RAISE NOTICE 'Adding curriculum assignments for Donald Chapman...';

  -- Get Donald's primary class
  SELECT id INTO primary_class_id
  FROM classes
  WHERE teacher_id = donald_id
    AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;

  IF primary_class_id IS NULL THEN
    RAISE EXCEPTION 'No active class found for Donald Chapman';
  END IF;

  RAISE NOTICE 'Found class: %', primary_class_id;

  -- Add 5 sample curriculum assignments
  FOR curr_rec IN
    SELECT
      id as curriculum_id,
      lesson_title,
      lesson_date,
      COALESCE(lesson_date, CURRENT_DATE + (ROW_NUMBER() OVER (ORDER BY created_at))::INT) as teaching_date
    FROM curriculum
    WHERE teacher_id = donald_id
    ORDER BY lesson_date NULLS LAST, created_at
    LIMIT 5
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
      primary_class_id,
      curr_rec.curriculum_id,
      curr_rec.teaching_date::DATE,
      '14:00:00'::TIME,
      '15:30:00'::TIME,
      CASE
        WHEN created_count = 0 THEN 'in progress'
        WHEN created_count = 1 THEN 'scheduled'
        WHEN created_count = 2 THEN 'completed'
        ELSE 'scheduled'
      END,
      'Room 301',
      'Sample assignment: ' || curr_rec.lesson_title
    );

    created_count := created_count + 1;
  END LOOP;

  RAISE NOTICE '✅ Created % sample assignments', created_count;

  -- Create corresponding class_sessions
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
    'Session: ' || c.lesson_title
  FROM teacher_assignments ta
  LEFT JOIN curriculum c ON c.id = ta.curriculum_id
  WHERE ta.teacher_id = donald_id
    AND NOT EXISTS (
      SELECT 1 FROM class_sessions cs
      WHERE cs.teacher_id = ta.teacher_id
        AND cs.session_date = ta.teaching_date
        AND cs.curriculum_id = ta.curriculum_id
    )
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '✅ Created corresponding sessions';
END $$;

COMMIT;

-- Verify
SELECT
    ta.teaching_date,
    c.lesson_title,
    ta.status,
    cl.class_name
FROM teacher_assignments ta
LEFT JOIN curriculum c ON c.id = ta.curriculum_id
LEFT JOIN classes cl ON cl.id = ta.class_id
WHERE ta.teacher_id = '389ea82c-db4c-40be-aee0-6b39785813da'
ORDER BY ta.teaching_date;
