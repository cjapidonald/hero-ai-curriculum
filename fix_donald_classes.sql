-- Fix classes assignment for Teacher Donald Chapman
-- This will assign the teacher_id to the classes

-- First, let's find Donald Chapman's teacher ID
-- (Replace 'donald@heroschool.com' with the actual email if different)

-- Update the two new classes to assign them to Donald Chapman
UPDATE classes
SET teacher_id = (
  SELECT id FROM teachers
  WHERE email = 'donald@heroschool.com'
  OR (name = 'Donald' AND surname = 'Chapman')
  LIMIT 1
)
WHERE name IN ('Advanced Readers C', 'Grammar Masters D');

-- Also update the teacher_name field to match
UPDATE classes
SET teacher_name = (
  SELECT name || ' ' || surname FROM teachers
  WHERE email = 'donald@heroschool.com'
  OR (name = 'Donald' AND surname = 'Chapman')
  LIMIT 1
)
WHERE name IN ('Advanced Readers C', 'Grammar Masters D');

-- Verify the update
SELECT
  c.name,
  c.teacher_name,
  c.teacher_id,
  t.name || ' ' || t.surname as actual_teacher_name
FROM classes c
LEFT JOIN teachers t ON c.teacher_id = t.id
WHERE c.name IN ('Advanced Readers C', 'Grammar Masters D');
