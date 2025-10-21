-- =============================================
-- SETUP DEMO USERS FOR TESTING
-- =============================================
-- This migration ensures all demo users exist with correct credentials

-- =============================================
-- 1. ENSURE ADMIN USER EXISTS
-- =============================================
INSERT INTO public.admins (email, password, name, surname, phone, is_active)
VALUES ('admin@heroschool.com', 'admin123', 'Admin', 'HeroSchool', '+84123456789', true)
ON CONFLICT (email) DO UPDATE
SET
  password = 'admin123',
  is_active = true,
  name = 'Admin',
  surname = 'HeroSchool';

-- =============================================
-- 2. ENSURE TEACHER DONALD EXISTS WITH LOGIN CREDENTIALS
-- =============================================
-- First check if donald exists, if not create them
DO $$
DECLARE
  donald_id UUID;
BEGIN
  -- Try to find donald
  SELECT id INTO donald_id FROM public.teachers WHERE name = 'Donald' LIMIT 1;

  IF donald_id IS NULL THEN
    -- Create donald if doesn't exist
    INSERT INTO public.teachers (
      name,
      surname,
      email,
      username,
      password,
      phone,
      subject,
      is_active
    )
    VALUES (
      'Donald',
      'Cjapi',
      'donald@heroschool.com',
      'donald',
      'teacher123',
      '+84987654321',
      'English',
      true
    )
    RETURNING id INTO donald_id;

    RAISE NOTICE 'Created teacher Donald with ID: %', donald_id;
  ELSE
    -- Update donald with login credentials
    UPDATE public.teachers
    SET
      email = 'donald@heroschool.com',
      username = 'donald',
      password = 'teacher123',
      is_active = true,
      surname = COALESCE(surname, 'Cjapi'),
      phone = COALESCE(phone, '+84987654321'),
      subject = COALESCE(subject, 'English')
    WHERE id = donald_id;

    RAISE NOTICE 'Updated teacher Donald with ID: %', donald_id;
  END IF;
END $$;

-- =============================================
-- 3. ENSURE STUDENT EMMA EXISTS WITH LOGIN CREDENTIALS
-- =============================================
-- Create the dashboard_students table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.dashboard_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  surname VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  password VARCHAR(255),
  class VARCHAR(100),
  subject VARCHAR(100),
  phone VARCHAR(20),
  profile_image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.dashboard_students ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for students
DROP POLICY IF EXISTS "Students can view themselves" ON public.dashboard_students;
CREATE POLICY "Students can view themselves"
  ON public.dashboard_students FOR SELECT
  USING (true);

-- Insert or update Emma
INSERT INTO public.dashboard_students (name, surname, email, password, class, subject, is_active)
VALUES ('Emma', 'Wilson', 'emma@student.com', 'student123', '10A', 'English', true)
ON CONFLICT (email) DO UPDATE
SET
  password = 'student123',
  is_active = true,
  name = 'Emma',
  surname = 'Wilson',
  class = '10A',
  subject = 'English';

-- =============================================
-- VERIFICATION OUTPUT
-- =============================================
SELECT 'Demo users setup complete!' AS status;

-- Show created users
SELECT 'ADMIN:' AS type, email, password, is_active FROM public.admins WHERE email = 'admin@heroschool.com'
UNION ALL
SELECT 'TEACHER:' AS type, email, password, is_active FROM public.teachers WHERE email = 'donald@heroschool.com'
UNION ALL
SELECT 'STUDENT:' AS type, email, password, is_active FROM public.dashboard_students WHERE email = 'emma@student.com';
