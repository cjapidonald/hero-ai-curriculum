-- =============================================
-- VERIFICATION QUERIES
-- =============================================
-- Run these in Supabase SQL Editor to verify the sync worked
-- =============================================

-- 1. Check how many teachers have class_sessions
SELECT
  'Teachers with sessions' as metric,
  COUNT(DISTINCT teacher_id) as count
FROM class_sessions;

-- 2. Check total sessions created
SELECT
  'Total class sessions' as metric,
  COUNT(*) as count
FROM class_sessions;

-- 3. Check all teachers with their session counts
SELECT
  t.name || ' ' || t.surname as teacher_name,
  t.email,
  COUNT(cs.id) as total_sessions,
  COUNT(DISTINCT cs.class_id) as total_classes,
  MIN(cs.session_date) as earliest_session,
  MAX(cs.session_date) as latest_session
FROM teachers t
LEFT JOIN class_sessions cs ON cs.teacher_id = t.id
WHERE t.is_active = true
GROUP BY t.id, t.name, t.surname, t.email
ORDER BY total_sessions DESC;

-- 4. Check Donald's specific sessions (replace with actual email)
SELECT
  cs.session_date,
  cs.start_time,
  cs.end_time,
  c.class_name,
  cur.lesson_title,
  cur.subject,
  cs.status,
  cs.lesson_plan_completed,
  cs.location
FROM class_sessions cs
LEFT JOIN classes c ON c.id = cs.class_id
LEFT JOIN curriculum cur ON cur.id = cs.curriculum_id
JOIN teachers t ON t.id = cs.teacher_id
WHERE t.email LIKE '%donald%' OR t.name LIKE '%Donald%'
ORDER BY cs.session_date, cs.start_time;

-- 5. Check if sync is working (should be 0 rows if perfect sync)
SELECT
  t.name as teacher_name,
  ta.teaching_date,
  cur.lesson_title,
  'MISSING IN class_sessions' as issue
FROM teacher_assignments ta
JOIN teachers t ON t.id = ta.teacher_id
LEFT JOIN curriculum cur ON cur.id = ta.curriculum_id
WHERE ta.curriculum_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM class_sessions cs
    WHERE cs.teacher_id = ta.teacher_id
      AND cs.session_date = ta.teaching_date
      AND cs.curriculum_id = ta.curriculum_id
  );

-- 6. Check teachers with classes assigned
SELECT
  t.name || ' ' || t.surname as teacher_name,
  COUNT(c.id) as total_classes,
  STRING_AGG(c.class_name, ', ') as class_names
FROM teachers t
LEFT JOIN classes c ON c.teacher_id = t.id AND c.is_active = true
WHERE t.is_active = true
GROUP BY t.id, t.name, t.surname
HAVING COUNT(c.id) > 0
ORDER BY total_classes DESC;

-- 7. Check trigger exists
SELECT
  tgname as trigger_name,
  tgenabled as enabled,
  'trigger_sync_assignment_to_session' as expected_name
FROM pg_trigger
WHERE tgname IN ('trigger_sync_assignment_to_session', 'trigger_sync_assignment_deletion')
ORDER BY tgname;

-- 8. Get teacher UUIDs for testing
SELECT
  name || ' ' || surname as teacher_name,
  email,
  id as teacher_uuid
FROM teachers
WHERE is_active = true
ORDER BY name;
