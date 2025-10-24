-- =============================================
-- 🚨 RUN THIS IN SUPABASE DASHBOARD NOW! 🚨
-- =============================================
-- This fixes the "column classes.name does not exist" error
-- Go to: https://supabase.com/dashboard/project/mqlihjzdfkhaomehxbye/sql/new
-- Copy ALL of this and click RUN
-- =============================================

-- Step 1: Add missing 'name' column to classes table
ALTER TABLE classes ADD COLUMN IF NOT EXISTS name TEXT;

-- Step 2: Populate 'name' with existing class_name values
UPDATE classes SET name = class_name WHERE name IS NULL;

-- Step 3: Create trigger to keep name and class_name in sync
CREATE OR REPLACE FUNCTION sync_class_name()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.class_name IS DISTINCT FROM OLD.class_name THEN
    NEW.name := NEW.class_name;
  END IF;
  IF NEW.name IS DISTINCT FROM OLD.name AND NEW.name IS NOT NULL THEN
    NEW.class_name := NEW.name;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_class_name ON classes;
CREATE TRIGGER trigger_sync_class_name
  BEFORE INSERT OR UPDATE ON classes
  FOR EACH ROW
  EXECUTE FUNCTION sync_class_name();

-- Step 4: Ensure Donald's class exists with both class_name AND name
INSERT INTO classes (
  class_name,
  name,
  stage,
  level,
  teacher_name,
  teacher_id,
  max_students,
  current_students,
  classroom,
  classroom_location,
  schedule,
  start_date,
  is_active
) VALUES (
  'Donald Chapman - English Excellence',
  'Donald Chapman - English Excellence',
  'stage_4',
  'B1',
  'Donald Chapman',
  '389ea82c-db4c-40be-aee0-6b39785813da',
  15,
  0,
  'Room 301',
  'Main Building - 3rd Floor',
  'Mon, Wed, Fri - 14:00-15:30',
  CURRENT_DATE,
  true
)
ON CONFLICT (class_name) DO UPDATE
SET
  name = EXCLUDED.name,
  teacher_id = EXCLUDED.teacher_id,
  teacher_name = EXCLUDED.teacher_name,
  is_active = true,
  updated_at = NOW();

-- Step 5: Update all curriculum items to use Donald's class
UPDATE curriculum
SET class_id = (SELECT id FROM classes WHERE teacher_id = '389ea82c-db4c-40be-aee0-6b39785813da' LIMIT 1)
WHERE teacher_id = '389ea82c-db4c-40be-aee0-6b39785813da'
  AND class_id IS NULL;

-- Step 6: Update all class_sessions to use Donald's class
UPDATE class_sessions
SET class_id = (SELECT id FROM classes WHERE teacher_id = '389ea82c-db4c-40be-aee0-6b39785813da' LIMIT 1)
WHERE teacher_id = '389ea82c-db4c-40be-aee0-6b39785813da'
  AND class_id IS NULL;

-- Step 7: Update all teacher_assignments to use Donald's class
UPDATE teacher_assignments
SET class_id = (SELECT id FROM classes WHERE teacher_id = '389ea82c-db4c-40be-aee0-6b39785813da' LIMIT 1)
WHERE teacher_id = '389ea82c-db4c-40be-aee0-6b39785813da'
  AND class_id IS NULL;

-- ===== VERIFICATION =====

SELECT '===== VERIFICATION RESULTS =====' as step;

-- Check classes table now has 'name' column
SELECT 'Classes with name column:' as check, COUNT(*) as count
FROM classes WHERE name IS NOT NULL;

-- Check Donald's classes
SELECT 'Donald''s classes:' as check, COUNT(*) as count
FROM classes
WHERE teacher_id = '389ea82c-db4c-40be-aee0-6b39785813da'
  AND is_active = true;

-- Show Donald's class details
SELECT
  'DONALD''S CLASS DETAILS' as info,
  id,
  class_name,
  name,
  teacher_name,
  stage,
  level
FROM classes
WHERE teacher_id = '389ea82c-db4c-40be-aee0-6b39785813da';

-- Check Donald's curriculum
SELECT 'Donald''s curriculum items:' as check, COUNT(*) as count
FROM curriculum
WHERE teacher_id = '389ea82c-db4c-40be-aee0-6b39785813da';

-- Check Donald's class_sessions
SELECT 'Donald''s class sessions:' as check, COUNT(*) as count
FROM class_sessions
WHERE teacher_id = '389ea82c-db4c-40be-aee0-6b39785813da';

-- Show Donald's schedule
SELECT
  'DONALD''S SCHEDULE' as info,
  cs.session_date::text as date,
  cs.start_time::text as time,
  c.class_name as class,
  cur.lesson_title as lesson
FROM class_sessions cs
LEFT JOIN classes c ON c.id = cs.class_id
LEFT JOIN curriculum cur ON cur.id = cs.curriculum_id
WHERE cs.teacher_id = '389ea82c-db4c-40be-aee0-6b39785813da'
ORDER BY cs.session_date, cs.start_time
LIMIT 10;

SELECT '✅ FIX COMPLETE! Donald should now see his classes and curriculum!' as result;
