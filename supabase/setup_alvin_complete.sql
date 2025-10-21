-- =============================================
-- COMPLETE ALVIN CLASS SETUP WITH STUDENTS
-- =============================================
-- This script ensures:
-- 1. Teacher Xhoana exists
-- 2. Alvin class exists and is linked to Xhoana
-- 3. Skills are created
-- 4. Sample students are created and enrolled in Alvin class
-- =============================================

-- =============================================
-- 1. Ensure Teacher Xhoana Strand exists
-- =============================================
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
  'Specialized in Stage 1 Alvin curriculum - comprehensive English, Math, Science and Phonics instruction',
  true
)
ON CONFLICT (email) DO UPDATE
SET
  name = EXCLUDED.name,
  surname = EXCLUDED.surname,
  subject = EXCLUDED.subject,
  phone = EXCLUDED.phone,
  bio = EXCLUDED.bio,
  is_active = EXCLUDED.is_active,
  updated_at = NOW()
RETURNING id, name, surname, email;

-- =============================================
-- 2. Create/Update Alvin Class with teacher_id
-- =============================================

-- First, let's check if the classes table has teacher_id column
-- If the Alvin class exists, update it with the correct teacher_id
-- If it doesn't exist, create it

DO $$
DECLARE
  v_teacher_id UUID;
  v_class_id UUID;
BEGIN
  -- Get Xhoana's teacher ID
  SELECT id INTO v_teacher_id
  FROM teachers
  WHERE email = 'xhoana.strand@heroschool.com';

  IF v_teacher_id IS NULL THEN
    RAISE EXCEPTION 'Teacher Xhoana Strand not found';
  END IF;

  -- Check if Alvin class exists
  SELECT id INTO v_class_id
  FROM classes
  WHERE class_name = 'Alvin' OR name = 'Alvin';

  IF v_class_id IS NULL THEN
    -- Create new Alvin class
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
      'Alvin',
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

    RAISE NOTICE 'Created Alvin class with ID: %', v_class_id;
  ELSE
    -- Update existing class
    UPDATE classes
    SET
      teacher_id = v_teacher_id,
      teacher_name = 'Xhoana Strand',
      stage = 'stage_1'::cambridge_stage,
      is_active = true,
      updated_at = NOW()
    WHERE id = v_class_id;

    RAISE NOTICE 'Updated existing Alvin class with ID: %', v_class_id;
  END IF;
END $$;

-- =============================================
-- 3. Create Sample Students for Alvin Class
-- =============================================

-- Create 8 sample students in the Alvin class
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
-- Student 1
(
  'Emma',
  'Nguyen',
  'emma.nguyen@student.heroschool.com',
  'student123',
  'Alvin',
  'Female',
  'English',
  'Stage 1',
  '2018-03-15',
  95.5,
  'Mai Nguyen',
  '+84 123 456 001',
  'District 1, HCMC',
  true
),
-- Student 2
(
  'Liam',
  'Tran',
  'liam.tran@student.heroschool.com',
  'student123',
  'Alvin',
  'Male',
  'English',
  'Stage 1',
  '2018-05-22',
  92.0,
  'Tuan Tran',
  '+84 123 456 002',
  'District 2, HCMC',
  true
),
-- Student 3
(
  'Sophia',
  'Le',
  'sophia.le@student.heroschool.com',
  'student123',
  'Alvin',
  'Female',
  'English',
  'Stage 1',
  '2018-07-10',
  98.0,
  'Lan Le',
  '+84 123 456 003',
  'District 3, HCMC',
  true
),
-- Student 4
(
  'Oliver',
  'Pham',
  'oliver.pham@student.heroschool.com',
  'student123',
  'Alvin',
  'Male',
  'English',
  'Stage 1',
  '2018-02-28',
  88.5,
  'Hoa Pham',
  '+84 123 456 004',
  'District 7, HCMC',
  true
),
-- Student 5
(
  'Ava',
  'Hoang',
  'ava.hoang@student.heroschool.com',
  'student123',
  'Alvin',
  'Female',
  'English',
  'Stage 1',
  '2018-09-14',
  94.0,
  'Minh Hoang',
  '+84 123 456 005',
  'Binh Thanh, HCMC',
  true
),
-- Student 6
(
  'Noah',
  'Vo',
  'noah.vo@student.heroschool.com',
  'student123',
  'Alvin',
  'Male',
  'English',
  'Stage 1',
  '2018-11-05',
  90.0,
  'Linh Vo',
  '+84 123 456 006',
  'District 5, HCMC',
  true
),
-- Student 7
(
  'Isabella',
  'Dang',
  'isabella.dang@student.heroschool.com',
  'student123',
  'Alvin',
  'Female',
  'English',
  'Stage 1',
  '2018-04-18',
  96.5,
  'Thu Dang',
  '+84 123 456 007',
  'District 10, HCMC',
  true
),
-- Student 8
(
  'Ethan',
  'Bui',
  'ethan.bui@student.heroschool.com',
  'student123',
  'Alvin',
  'Male',
  'English',
  'Stage 1',
  '2018-06-30',
  91.5,
  'Hung Bui',
  '+84 123 456 008',
  'Tan Binh, HCMC',
  true
)
ON CONFLICT (email) DO UPDATE
SET
  class = EXCLUDED.class,
  level = EXCLUDED.level,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- =============================================
-- 4. Verify the setup
-- =============================================

-- Show teacher info
SELECT 'Teacher Created/Updated:' as info, id, name, surname, email, subject
FROM teachers
WHERE email = 'xhoana.strand@heroschool.com';

-- Show class info
SELECT 'Class Created/Updated:' as info, id, class_name, name, teacher_name, stage, max_students
FROM classes
WHERE class_name = 'Alvin' OR name = 'Alvin';

-- Show students count
SELECT 'Students in Alvin class:' as info, COUNT(*) as student_count
FROM dashboard_students
WHERE class = 'Alvin' AND is_active = true;

-- Show all students
SELECT 'Student List:' as info, name, surname, email, gender, birthday
FROM dashboard_students
WHERE class = 'Alvin' AND is_active = true
ORDER BY name;

-- =============================================
-- DONE
-- =============================================
