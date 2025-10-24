-- =============================================
-- IMPORTANT: Execute this in Supabase Dashboard SQL Editor
-- =============================================
-- Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
-- Paste this entire file and click "Run"
-- =============================================

-- Step 1: Create the trigger function
CREATE OR REPLACE FUNCTION sync_teacher_assignment_to_session()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.teacher_id IS NOT NULL AND NEW.teaching_date IS NOT NULL THEN
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
      updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create trigger
DROP TRIGGER IF EXISTS trigger_sync_assignment_to_session ON teacher_assignments;
CREATE TRIGGER trigger_sync_assignment_to_session
  AFTER INSERT OR UPDATE ON teacher_assignments
  FOR EACH ROW
  EXECUTE FUNCTION sync_teacher_assignment_to_session();

-- Step 3: Add unique constraint
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

-- Step 4: Sync existing data
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

-- Step 5: Verify results
SELECT
  COUNT(*) as total_sessions_created,
  COUNT(DISTINCT teacher_id) as teachers_with_sessions
FROM class_sessions;

SELECT
  'SUCCESS! Teachers should now see their assigned curriculums!' as message;
