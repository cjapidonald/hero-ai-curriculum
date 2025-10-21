-- Check if admin exists
SELECT 'ADMINS:' as table_name;
SELECT * FROM public.admins;

-- Check teachers
SELECT 'TEACHERS:' as table_name;
SELECT id, name, surname, email, username, password, is_active FROM public.teachers;

-- Check students
SELECT 'STUDENTS:' as table_name;
SELECT id, name, surname, email, password, is_active FROM public.dashboard_students LIMIT 10;
