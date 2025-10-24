-- Migration to create teacher_assignments for Donald Chapman
-- This assigns all curriculum items to his primary class

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
  -- Check if Donald Chapman exists
  IF NOT EXISTS (SELECT 1 FROM teachers WHERE id = donald_teacher_id) THEN
    RAISE NOTICE 'Donald Chapman not found, skipping assignment creation';
    RETURN;
  END IF;

  -- Get Donald's primary class
  SELECT id INTO primary_class_id
  FROM classes
  WHERE teacher_id = donald_teacher_id
    AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;

  IF primary_class_id IS NULL THEN
    RAISE NOTICE 'No active class found for Donald Chapman, skipping';
    RETURN;
  END IF;

  RAISE NOTICE 'Creating assignments for Donald Chapman...';
  RAISE NOTICE 'Using class: %', primary_class_id;

  -- Delete any existing assignments for Donald Chapman (cleanup)
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

  RAISE NOTICE 'Successfully created % teacher assignments for Donald Chapman', created_count;
END $$;
