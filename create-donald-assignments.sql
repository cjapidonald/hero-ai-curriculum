-- Create teacher_assignments for Donald Chapman
-- This script assigns all of Donald's curriculum items to his primary class

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

  -- Create assignments for each curriculum item
  FOR curriculum_record IN
    SELECT id, lesson_title, lesson_number, lesson_date
    FROM curriculum
    WHERE teacher_id = donald_teacher_id
    ORDER BY lesson_number
  LOOP
    -- Calculate teaching date (spread over 10 weeks, 5 lessons per week)
    day_counter := (curriculum_record.lesson_number - 1) % 5;
    week_counter := (curriculum_record.lesson_number - 1) / 5;
    assignment_date := CURRENT_DATE + (week_counter * 7) + day_counter;

    -- Use curriculum's lesson_date if available, otherwise use calculated date
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

  -- Show summary
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '  Teacher: Donald Chapman (%)', donald_teacher_id;
  RAISE NOTICE '  Class: %', primary_class_id;
  RAISE NOTICE '  Assignments created: %', created_count;
END $$;

-- Verify the assignments were created
SELECT
  COUNT(*) as total_assignments,
  MIN(teaching_date) as first_lesson,
  MAX(teaching_date) as last_lesson
FROM teacher_assignments
WHERE teacher_id = '389ea82c-db4c-40be-aee0-6b39785813da';

-- Show first 5 assignments as sample
SELECT
  ta.teaching_date,
  ta.status,
  c.lesson_title,
  c.subject,
  cls.class_name
FROM teacher_assignments ta
JOIN curriculum c ON c.id = ta.curriculum_id
JOIN classes cls ON cls.id = ta.class_id
WHERE ta.teacher_id = '389ea82c-db4c-40be-aee0-6b39785813da'
ORDER BY ta.teaching_date
LIMIT 5;
