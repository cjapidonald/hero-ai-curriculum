-- =============================================
-- SETUP ALVIN CLASS WITH STUDENTS
-- =============================================
-- This migration completes the Alvin class setup by:
-- 1. Ensuring teacher Xhoana exists
-- 2. Linking the Alvin class to teacher
-- 3. Creating sample students
-- =============================================

-- Ensure classes table has teacher_id column required for linking
ALTER TABLE classes
  ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL;

-- =============================================
-- 1. Ensure teacher Xhoana exists and get her ID
-- =============================================
DO $$
DECLARE
  v_teacher_id UUID;
  v_class_id UUID;
  v_has_name_column BOOLEAN;
BEGIN
  -- Check if the classes table still has a legacy `name` column
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'classes' AND column_name = 'name'
  ) INTO v_has_name_column;

  -- Get or create Xhoana
  SELECT id INTO v_teacher_id
  FROM teachers
  WHERE email = 'xhoana.strand@heroschool.com';

  IF v_teacher_id IS NULL THEN
    INSERT INTO teachers (
      name,
      surname,
      email,
      password,
      subject,
      phone,
      bio,
      is_active
    ) VALUES (
      'Xhoana',
      'Strand',
      'xhoana.strand@heroschool.com',
      'teacher123',
      'English',
      '0981234599',
      'Specialized in Stage 1 Alvin curriculum',
      true
    )
    RETURNING id INTO v_teacher_id;

    RAISE NOTICE 'Created teacher Xhoana with ID: %', v_teacher_id;
  ELSE
    RAISE NOTICE 'Teacher Xhoana exists with ID: %', v_teacher_id;
  END IF;

  -- =============================================
  -- 2. Update or create Alvin class
  -- =============================================

  -- Check if Alvin class exists (check both class_name and name fields)
  IF v_has_name_column THEN
    EXECUTE 'SELECT id FROM classes WHERE class_name = $1 OR name = $1 LIMIT 1'
      INTO v_class_id
      USING 'Alvin';
  ELSE
    SELECT id INTO v_class_id
    FROM classes
    WHERE class_name = 'Alvin'
    LIMIT 1;
  END IF;

  IF v_class_id IS NOT NULL THEN
    -- Update existing class to link with teacher
    UPDATE classes
    SET
      teacher_id = v_teacher_id,
      teacher_name = 'Xhoana Strand',
      is_active = true,
      updated_at = NOW()
    WHERE id = v_class_id;

    RAISE NOTICE 'Updated Alvin class with ID: % and linked to teacher', v_class_id;
  ELSE
    -- Create new class if it doesn't exist
    IF v_has_name_column THEN
      EXECUTE '
        INSERT INTO classes (
          class_name,
          name,
          stage,
          teacher_name,
          teacher_id,
          max_students,
          classroom_location,
          is_active,
          start_date
        ) VALUES (
          $1,
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          true,
          CURRENT_DATE
        )
        RETURNING id
      '
      INTO v_class_id
      USING
        'Alvin',
        'stage_1'::cambridge_stage,
        'Xhoana Strand',
        v_teacher_id,
        15,
        'Room A1';
    ELSE
      INSERT INTO classes (
        class_name,
        stage,
        teacher_name,
        teacher_id,
        max_students,
        classroom_location,
        is_active,
        start_date
      ) VALUES (
        'Alvin',
        'stage_1'::cambridge_stage,
        'Xhoana Strand',
        v_teacher_id,
        15,
        'Room A1',
        true,
        CURRENT_DATE
      )
      RETURNING id INTO v_class_id;
    END IF;

    RAISE NOTICE 'Created new Alvin class';
  END IF;

END $$;

-- =============================================
-- 3. Create sample students for Alvin class
-- =============================================

INSERT INTO dashboard_students (
  name,
  surname,
  email,
  password,
  class,
  gender,
  subject,
  level,
  birthday,
  attendance_rate,
  parent_name,
  parent_zalo_nr,
  location,
  is_active
) VALUES
('Emma', 'Nguyen', 'emma.nguyen@student.heroschool.com', 'student123', 'Alvin', 'Female', 'English', 'Stage 1', '2018-03-15', 95.5, 'Mai Nguyen', '+84 123 456 001', 'District 1, HCMC', true),
('Liam', 'Tran', 'liam.tran@student.heroschool.com', 'student123', 'Alvin', 'Male', 'English', 'Stage 1', '2018-05-22', 92.0, 'Tuan Tran', '+84 123 456 002', 'District 2, HCMC', true),
('Sophia', 'Le', 'sophia.le@student.heroschool.com', 'student123', 'Alvin', 'Female', 'English', 'Stage 1', '2018-07-10', 98.0, 'Lan Le', '+84 123 456 003', 'District 3, HCMC', true),
('Oliver', 'Pham', 'oliver.pham@student.heroschool.com', 'student123', 'Alvin', 'Male', 'English', 'Stage 1', '2018-02-28', 88.5, 'Hoa Pham', '+84 123 456 004', 'District 7, HCMC', true),
('Ava', 'Hoang', 'ava.hoang@student.heroschool.com', 'student123', 'Alvin', 'Female', 'English', 'Stage 1', '2018-09-14', 94.0, 'Minh Hoang', '+84 123 456 005', 'Binh Thanh, HCMC', true),
('Noah', 'Vo', 'noah.vo@student.heroschool.com', 'student123', 'Alvin', 'Male', 'English', 'Stage 1', '2018-11-05', 90.0, 'Linh Vo', '+84 123 456 006', 'District 5, HCMC', true),
('Isabella', 'Dang', 'isabella.dang@student.heroschool.com', 'student123', 'Alvin', 'Female', 'English', 'Stage 1', '2018-04-18', 96.5, 'Thu Dang', '+84 123 456 007', 'District 10, HCMC', true),
('Ethan', 'Bui', 'ethan.bui@student.heroschool.com', 'student123', 'Alvin', 'Male', 'English', 'Stage 1', '2018-06-30', 91.5, 'Hung Bui', '+84 123 456 008', 'Tan Binh, HCMC', true)
ON CONFLICT (email) DO UPDATE
SET
  class = EXCLUDED.class,
  level = EXCLUDED.level,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- =============================================
-- DONE - Verification queries
-- =============================================

-- This will show the results in the migration output
DO $$
DECLARE
  v_student_count INT;
  v_teacher_name TEXT;
  v_class_name TEXT;
BEGIN
  SELECT COUNT(*) INTO v_student_count
  FROM dashboard_students
  WHERE class = 'Alvin' AND is_active = true;

  SELECT name || ' ' || surname INTO v_teacher_name
  FROM teachers
  WHERE email = 'xhoana.strand@heroschool.com';

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'classes' AND column_name = 'name'
  ) THEN
    SELECT COALESCE(name, class_name) INTO v_class_name
    FROM classes
    WHERE (name = 'Alvin' OR class_name = 'Alvin')
    ORDER BY updated_at DESC, created_at DESC
    LIMIT 1;
  ELSE
    SELECT class_name INTO v_class_name
    FROM classes
    WHERE class_name = 'Alvin'
    ORDER BY updated_at DESC, created_at DESC
    LIMIT 1;
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'ALVIN CLASS SETUP COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Teacher: %', v_teacher_name;
  RAISE NOTICE 'Class: %', v_class_name;
  RAISE NOTICE 'Students enrolled: %', v_student_count;
  RAISE NOTICE '========================================';
END $$;
