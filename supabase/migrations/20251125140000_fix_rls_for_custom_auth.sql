-- Fix RLS policies for custom authentication system
-- The app uses custom auth (localStorage), not Supabase Auth
-- So policies checking auth.uid() or auth.role() don't work

BEGIN;

-- =============================================
-- CLASSES TABLE
-- =============================================
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users have full access to classes" ON public.classes;
DROP POLICY IF EXISTS "Allow all for classes management" ON public.classes;
DROP POLICY IF EXISTS "Classes are viewable by everyone" ON public.classes;

-- Create permissive policy for custom auth
CREATE POLICY "Allow all operations on classes"
ON public.classes
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- =============================================
-- STUDENTS TABLE
-- =============================================
DROP POLICY IF EXISTS "Authenticated users have full access to students" ON public.students;

CREATE POLICY "Allow all operations on students"
ON public.students
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- =============================================
-- CURRICULUM TABLE
-- =============================================
DROP POLICY IF EXISTS "Allow all for curriculum" ON public.curriculum;

CREATE POLICY "Allow all operations on curriculum"
ON public.curriculum
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- =============================================
-- TEACHERS TABLE
-- =============================================
DROP POLICY IF EXISTS "Allow all for teachers" ON public.teachers;

CREATE POLICY "Allow all operations on teachers"
ON public.teachers
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- =============================================
-- ENROLLMENTS TABLE
-- =============================================
DROP POLICY IF EXISTS "Public Read Access" ON public.enrollments;
DROP POLICY IF EXISTS "Service role can manage all enrollments" ON public.enrollments;

CREATE POLICY "Allow all operations on enrollments"
ON public.enrollments
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- =============================================
-- ATTENDANCE TABLE
-- =============================================
DROP POLICY IF EXISTS "Enable all access for attendance" ON public.attendance;

CREATE POLICY "Allow all operations on attendance"
ON public.attendance
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- =============================================
-- CLASS_SESSIONS TABLE
-- =============================================
DROP POLICY IF EXISTS "Enable read access for all users" ON public.class_sessions;

CREATE POLICY "Allow all operations on class_sessions"
ON public.class_sessions
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- =============================================
-- TEACHER_ASSIGNMENTS TABLE
-- =============================================
CREATE POLICY "Allow all operations on teacher_assignments"
ON public.teacher_assignments
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- =============================================
-- LESSON_RESOURCES TABLE
-- =============================================
CREATE POLICY "Allow all operations on lesson_resources"
ON public.lesson_resources
FOR ALL
TO public
USING (true)
WITH CHECK (true);

COMMIT;

-- Note: This migration enables full public access to these tables
-- Since the app uses custom authentication via direct table queries,
-- security is handled at the application layer, not at the database RLS layer
