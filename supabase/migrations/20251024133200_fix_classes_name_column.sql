-- Fix classes table - add missing name column
ALTER TABLE classes ADD COLUMN IF NOT EXISTS name TEXT;

-- Populate name from class_name
UPDATE classes SET name = class_name WHERE name IS NULL;

-- Create trigger to keep them in sync
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

-- Ensure Donald's class exists
INSERT INTO classes (
  class_name, name, stage, level, teacher_name, teacher_id,
  max_students, classroom, classroom_location, schedule,
  start_date, is_active
) VALUES (
  'Donald Chapman - English Excellence',
  'Donald Chapman - English Excellence',
  'stage_4', 'B1', 'Donald Chapman', '389ea82c-db4c-40be-aee0-6b39785813da',
  15, 'Room 301', 'Main Building - 3rd Floor', 'Mon, Wed, Fri - 14:00-15:30',
  CURRENT_DATE, true
)
ON CONFLICT (class_name) DO UPDATE
SET name = EXCLUDED.name, teacher_id = EXCLUDED.teacher_id, 
    teacher_name = EXCLUDED.teacher_name, is_active = true;
