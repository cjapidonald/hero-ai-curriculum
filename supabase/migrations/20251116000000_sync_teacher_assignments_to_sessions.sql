-- =============================================
-- SYNC TEACHER ASSIGNMENTS TO CLASS SESSIONS
-- =============================================
-- This migration creates the missing link between admin assignments
-- (teacher_assignments table) and teacher curriculum view (class_sessions table)
--
-- Problem: Admin creates assignments in teacher_assignments, but teachers
-- query class_sessions table. Without this sync, teachers see nothing!
--
-- Solution:
-- 1. Create trigger to auto-sync new assignments
-- 2. Sync existing assignments to class_sessions
-- 3. Handle updates and deletions
-- =============================================

-- =============================================
-- 1. CREATE TRIGGER FUNCTION TO SYNC ON INSERT/UPDATE
-- =============================================

CREATE OR REPLACE FUNCTION sync_teacher_assignment_to_session()
RETURNS TRIGGER AS $$
BEGIN
  -- When a teacher_assignment is created or updated, ensure a class_session exists
  -- Only create if we have the required fields
  IF NEW.teacher_id IS NOT NULL AND NEW.teaching_date IS NOT NULL THEN

    -- Insert or update the class_session
    INSERT INTO class_sessions (
      teacher_id,
      class_id,
      curriculum_id,
      session_date,
      start_time,
      end_time,
      status,
      notes,
      location,
      created_at,
      updated_at
    ) VALUES (
      NEW.teacher_id,
      NEW.class_id,
      NEW.curriculum_id,
      NEW.teaching_date,
      COALESCE(NEW.start_time, '09:00:00'::TIME),
      COALESCE(NEW.end_time, '10:30:00'::TIME),
      CASE
        WHEN NEW.status = 'scheduled' THEN 'scheduled'
        WHEN NEW.status = 'completed' THEN 'completed'
        WHEN NEW.status = 'cancelled' THEN 'cancelled'
        ELSE 'scheduled'
      END,
      NEW.notes,
      NEW.location,
      NOW(),
      NOW()
    )
    ON CONFLICT (teacher_id, session_date, curriculum_id)
    DO UPDATE SET
      class_id = EXCLUDED.class_id,
      start_time = EXCLUDED.start_time,
      end_time = EXCLUDED.end_time,
      status = EXCLUDED.status,
      notes = EXCLUDED.notes,
      location = EXCLUDED.location,
      updated_at = NOW()
    WHERE class_sessions.teacher_id = EXCLUDED.teacher_id
      AND class_sessions.session_date = EXCLUDED.session_date
      AND class_sessions.curriculum_id = EXCLUDED.curriculum_id;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 2. CREATE TRIGGER ON teacher_assignments
-- =============================================

-- Drop trigger if it exists (for migration reruns)
DROP TRIGGER IF EXISTS trigger_sync_assignment_to_session ON teacher_assignments;

-- Create trigger that fires after insert or update
CREATE TRIGGER trigger_sync_assignment_to_session
  AFTER INSERT OR UPDATE ON teacher_assignments
  FOR EACH ROW
  EXECUTE FUNCTION sync_teacher_assignment_to_session();

-- =============================================
-- 3. CREATE TRIGGER FUNCTION TO HANDLE DELETIONS
-- =============================================

CREATE OR REPLACE FUNCTION sync_teacher_assignment_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- When a teacher_assignment is deleted or cancelled, update the class_session status
  -- Don't delete the class_session (teacher may have built lesson plan)
  -- Just mark it as cancelled

  IF OLD.curriculum_id IS NOT NULL THEN
    UPDATE class_sessions
    SET
      status = 'cancelled',
      notes = COALESCE(notes, '') || ' [Assignment cancelled]',
      updated_at = NOW()
    WHERE teacher_id = OLD.teacher_id
      AND session_date = OLD.teaching_date
      AND curriculum_id = OLD.curriculum_id
      AND status NOT IN ('completed', 'in_progress'); -- Don't cancel ongoing/completed sessions
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS trigger_sync_assignment_deletion ON teacher_assignments;

-- Create deletion trigger
CREATE TRIGGER trigger_sync_assignment_deletion
  BEFORE DELETE ON teacher_assignments
  FOR EACH ROW
  EXECUTE FUNCTION sync_teacher_assignment_deletion();

-- =============================================
-- 4. ADD UNIQUE CONSTRAINT TO PREVENT DUPLICATES
-- =============================================

-- Add unique constraint to class_sessions if not exists
-- This prevents multiple sessions for same teacher/date/curriculum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'unique_teacher_date_curriculum'
  ) THEN
    ALTER TABLE class_sessions
    ADD CONSTRAINT unique_teacher_date_curriculum
    UNIQUE (teacher_id, session_date, curriculum_id);
  END IF;
END $$;

-- =============================================
-- 5. SYNC EXISTING DATA (ONE-TIME MIGRATION)
-- =============================================

-- Sync all existing teacher_assignments to class_sessions
-- This is a one-time operation to populate class_sessions from existing assignments

INSERT INTO class_sessions (
  teacher_id,
  class_id,
  curriculum_id,
  session_date,
  start_time,
  end_time,
  status,
  notes,
  location,
  created_at,
  updated_at
)
SELECT
  ta.teacher_id,
  ta.class_id,
  ta.curriculum_id,
  ta.teaching_date,
  COALESCE(ta.start_time, '09:00:00'::TIME),
  COALESCE(ta.end_time, '10:30:00'::TIME),
  CASE
    WHEN ta.status = 'scheduled' THEN 'scheduled'
    WHEN ta.status = 'completed' THEN 'completed'
    WHEN ta.status = 'cancelled' THEN 'cancelled'
    ELSE 'scheduled'
  END,
  ta.notes,
  ta.location,
  ta.created_at,
  NOW()
FROM teacher_assignments ta
WHERE ta.teacher_id IS NOT NULL
  AND ta.teaching_date IS NOT NULL
  AND ta.curriculum_id IS NOT NULL
ON CONFLICT (teacher_id, session_date, curriculum_id)
DO UPDATE SET
  class_id = EXCLUDED.class_id,
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  status = EXCLUDED.status,
  notes = EXCLUDED.notes,
  location = EXCLUDED.location,
  updated_at = NOW();

-- =============================================
-- 6. CREATE INDEX FOR PERFORMANCE
-- =============================================

-- Add index on teacher_assignments for faster lookups
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_teacher_date
  ON teacher_assignments(teacher_id, teaching_date);

-- =============================================
-- 7. LOG RESULTS
-- =============================================

-- Show how many records were synced
DO $$
DECLARE
  sync_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO sync_count
  FROM class_sessions cs
  WHERE EXISTS (
    SELECT 1 FROM teacher_assignments ta
    WHERE ta.teacher_id = cs.teacher_id
      AND ta.teaching_date = cs.session_date
      AND ta.curriculum_id = cs.curriculum_id
  );

  RAISE NOTICE 'Successfully synced % teacher assignments to class sessions', sync_count;
END $$;

-- =============================================
-- MIGRATION COMPLETE
-- =============================================
--
-- What was fixed:
-- 1. ✅ Teacher assignments now automatically create class sessions
-- 2. ✅ Existing assignments have been synced to class sessions
-- 3. ✅ Updates to assignments will update class sessions
-- 4. ✅ Deleted assignments will cancel (not delete) class sessions
-- 5. ✅ Unique constraint prevents duplicate sessions
--
-- Teachers should now see their assigned curriculums!
-- =============================================
