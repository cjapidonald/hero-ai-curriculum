-- =============================================
-- FIX CLASSES TABLE SCHEMA - REMOTE
-- =============================================
-- Issue: Column classes.name does not exist
-- Solution: Add missing columns and ensure compatibility
-- =============================================

-- Step 1: Check current classes table structure
SELECT 'Current classes table columns:' as info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'classes'
ORDER BY ordinal_position;

-- Step 2: Add missing 'name' column (alias for class_name)
ALTER TABLE classes
ADD COLUMN IF NOT EXISTS name TEXT;

-- Step 3: Populate 'name' with class_name values
UPDATE classes
SET name = class_name
WHERE name IS NULL;

-- Step 4: Create trigger to keep name and class_name in sync
CREATE OR REPLACE FUNCTION sync_class_name()
RETURNS TRIGGER AS $$
BEGIN
  -- If class_name changes, update name
  IF NEW.class_name IS DISTINCT FROM OLD.class_name THEN
    NEW.name := NEW.class_name;
  END IF;
  -- If name changes, update class_name
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

-- Step 5: Verify Donald's classes exist and have correct teacher_id
SELECT '=== DONALD''S CLASSES ===' as info;
SELECT
  id,
  class_name,
  name,
  teacher_id,
  teacher_name,
  is_active
FROM classes
WHERE teacher_id = '389ea82c-db4c-40be-aee0-6b39785813da';

-- Step 6: If no classes exist, create one for Donald
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
  updated_at = NOW()
RETURNING id, class_name, name, teacher_id;

-- Step 7: Verify fix
SELECT '=== VERIFICATION ===' as info;

SELECT 'Classes with name column' as check, COUNT(*) as count
FROM classes
WHERE name IS NOT NULL;

SELECT 'Donald''s classes' as check, COUNT(*) as count
FROM classes
WHERE teacher_id = '389ea82c-db4c-40be-aee0-6b39785813da'
  AND is_active = true;

-- Step 8: Show Donald's complete setup
SELECT
  c.id,
  c.class_name,
  c.name,
  c.teacher_name,
  COUNT(cs.id) as total_sessions
FROM classes c
LEFT JOIN class_sessions cs ON cs.class_id = c.id
WHERE c.teacher_id = '389ea82c-db4c-40be-aee0-6b39785813da'
GROUP BY c.id, c.class_name, c.name, c.teacher_name;

SELECT '✅ CLASSES TABLE FIXED! Donald should now see his classes!' as result;
