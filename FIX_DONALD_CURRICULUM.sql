-- Fix Donald Chapman's Curriculum Assignments
-- This script finds the correct teacher_id and recreates assignments

DO $$
DECLARE
  correct_teacher_id UUID;
  primary_class_id UUID;
  curriculum_record RECORD;
  assignment_date DATE;
  created_count INT := 0;
BEGIN
  -- Find Donald Chapman's teacher record
  -- The teacher.id should match the auth user ID
  SELECT id INTO correct_teacher_id
  FROM teachers
  WHERE email = 'donald@heroschool.com'
  LIMIT 1;

  IF correct_teacher_id IS NULL THEN
    RAISE EXCEPTION 'Donald Chapman not found in teachers table';
  END IF;

  RAISE NOTICE 'Found Donald Chapman with teacher_id: %', correct_teacher_id;

  -- Get his primary class
  SELECT id INTO primary_class_id
  FROM classes
  WHERE teacher_id = correct_teacher_id
    AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;

  IF primary_class_id IS NULL THEN
    -- Try to find any class for this teacher (might have different teacher_id in classes table)
    SELECT c.id INTO primary_class_id
    FROM classes c
    JOIN teachers t ON t.email = 'donald@heroschool.com'
    WHERE c.is_active = true
    ORDER BY c.created_at DESC
    LIMIT 1;
  END IF;

  IF primary_class_id IS NULL THEN
    RAISE EXCEPTION 'No active class found for Donald Chapman';
  END IF;

  RAISE NOTICE 'Using class: %', primary_class_id;

  -- Delete ALL existing assignments for Donald (any teacher_id)
  DELETE FROM teacher_assignments
  WHERE teacher_id IN (
    SELECT id FROM teachers WHERE email = 'donald@heroschool.com'
  );

  RAISE NOTICE 'Cleaned up old assignments';

  -- Create new assignments with CORRECT teacher_id
  FOR curriculum_record IN
    SELECT c.id, c.lesson_title, c.lesson_number, c.lesson_date
    FROM curriculum c
    JOIN teachers t ON t.email = 'donald@heroschool.com'
    WHERE c.teacher_id IN (SELECT id FROM teachers WHERE email = 'donald@heroschool.com')
    ORDER BY c.lesson_number
  LOOP
    -- Calculate teaching date
    assignment_date := CURRENT_DATE + ((curriculum_record.lesson_number - 1) / 5) * 7 + ((curriculum_record.lesson_number - 1) % 5);

    -- Use curriculum's lesson_date if available
    IF curriculum_record.lesson_date IS NOT NULL THEN
      assignment_date := curriculum_record.lesson_date;
    END IF;

    -- Insert with CORRECT teacher_id
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
      correct_teacher_id,  -- This is the key fix!
      curriculum_record.id,
      primary_class_id,
      assignment_date,
      '09:00:00',
      '10:00:00',
      'scheduled',
      'Fixed assignment: ' || curriculum_record.lesson_title
    );

    created_count := created_count + 1;
  END LOOP;

  RAISE NOTICE 'Successfully created % assignments for teacher_id: %', created_count, correct_teacher_id;

END $$;

-- Verify
SELECT
  t.email,
  t.id as teacher_id,
  COUNT(ta.id) as assignment_count
FROM teachers t
LEFT JOIN teacher_assignments ta ON ta.teacher_id = t.id
WHERE t.email = 'donald@heroschool.com'
GROUP BY t.email, t.id;

-- Show sample assignments
SELECT
  ta.teaching_date,
  ta.status,
  c.lesson_number,
  c.lesson_title,
  cl.class_name
FROM teacher_assignments ta
JOIN curriculum c ON c.id = ta.curriculum_id
JOIN classes cl ON cl.id = ta.class_id
JOIN teachers t ON t.id = ta.teacher_id
WHERE t.email = 'donald@heroschool.com'
ORDER BY c.lesson_number
LIMIT 10;
