-- Check Donald Chapman in REMOTE database
-- UUID: 389ea82c-db4c-40be-aee0-6b39785813da

-- Check teacher exists
SELECT 'Teacher' as item, id, name, surname, email, is_active
FROM teachers
WHERE id = '389ea82c-db4c-40be-aee0-6b39785813da';

-- Check classes
SELECT 'Classes' as item, id, class_name, stage
FROM classes
WHERE teacher_id = '389ea82c-db4c-40be-aee0-6b39785813da'
  AND is_active = true;

-- Check curriculum
SELECT 'Curriculum' as item, COUNT(*) as count
FROM curriculum
WHERE teacher_id = '389ea82c-db4c-40be-aee0-6b39785813da';

-- Check teacher_assignments
SELECT 'Assignments' as item, COUNT(*) as count
FROM teacher_assignments
WHERE teacher_id = '389ea82c-db4c-40be-aee0-6b39785813da';

-- Check class_sessions
SELECT 'Sessions' as item, COUNT(*) as count
FROM class_sessions
WHERE teacher_id = '389ea82c-db4c-40be-aee0-6b39785813da';

-- Show all assignments details
SELECT
    ta.id,
    ta.teaching_date,
    ta.start_time,
    ta.status,
    c.class_name,
    cur.lesson_title
FROM teacher_assignments ta
LEFT JOIN classes c ON c.id = ta.class_id
LEFT JOIN curriculum cur ON cur.id = ta.curriculum_id
WHERE ta.teacher_id = '389ea82c-db4c-40be-aee0-6b39785813da'
ORDER BY ta.teaching_date;
