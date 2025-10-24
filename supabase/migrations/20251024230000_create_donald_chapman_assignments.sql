-- =============================================
-- CREATE TEACHER ASSIGNMENTS FOR DONALD CHAPMAN
-- =============================================
-- This migration fixes the issue where Donald Chapman cannot see curriculum
-- because teacher_assignments table is empty for him
-- =============================================

BEGIN;

-- Verify Donald Chapman exists and create assignments
DO $$
DECLARE
  donald_id UUID := '389ea82c-db4c-40be-aee0-6b39785813da';
  primary_class_id UUID;
  curr_rec RECORD;
  assignment_count INT := 0;
  session_count INT := 0;
BEGIN
  -- Verify teacher exists
  IF NOT EXISTS (SELECT 1 FROM teachers WHERE id = donald_id) THEN
    RAISE NOTICE 'Donald Chapman not found - skipping assignment creation';
    RETURN;
  END IF;

  RAISE NOTICE '✅ Donald Chapman found';

  -- Get Donald's primary class
  SELECT id INTO primary_class_id
  FROM classes
  WHERE teacher_id = donald_id
    AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;

  IF primary_class_id IS NULL THEN
    RAISE NOTICE 'No active class found for Donald Chapman - skipping';
    RETURN;
  END IF;

  RAISE NOTICE '✅ Found primary class: %', primary_class_id;

  -- Delete any existing assignments for Donald (cleanup)
  DELETE FROM teacher_assignments WHERE teacher_id = donald_id;
  RAISE NOTICE 'Cleared existing assignments';

  -- Create teacher_assignments for each curriculum item
  FOR curr_rec IN
    SELECT
      id as curriculum_id,
      lesson_title,
      lesson_date,
      COALESCE(lesson_date, CURRENT_DATE) as teaching_date
    FROM curriculum
    WHERE teacher_id = donald_id
    ORDER BY lesson_date NULLS LAST, created_at
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
      'scheduled',
      'Room 301',
      'Assignment for: ' || curr_rec.lesson_title
    );

    assignment_count := assignment_count + 1;
  END LOOP;

  RAISE NOTICE '✅ Created % teacher_assignments for Donald Chapman', assignment_count;

  -- Create class_sessions manually (in case trigger doesn't exist or fails)
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
  WHERE ta.teacher_id = donald_id
    AND NOT EXISTS (
      SELECT 1 FROM class_sessions cs
      WHERE cs.teacher_id = ta.teacher_id
        AND cs.session_date = ta.teaching_date
        AND cs.curriculum_id = ta.curriculum_id
    )
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS session_count = ROW_COUNT;
  RAISE NOTICE '✅ Created % class_sessions for Donald Chapman', session_count;

  -- Final verification
  SELECT COUNT(*) INTO assignment_count
  FROM teacher_assignments
  WHERE teacher_id = donald_id;

  SELECT COUNT(*) INTO session_count
  FROM class_sessions
  WHERE teacher_id = donald_id;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'VERIFICATION:';
  RAISE NOTICE 'Total teacher_assignments: %', assignment_count;
  RAISE NOTICE 'Total class_sessions: %', session_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Donald Chapman can now see curriculum!';

END $$;

COMMIT;
