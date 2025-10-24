-- Remove all curriculum assignments for Donald Chapman
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/mqlihjzdfkhaomehxbye/sql/new

BEGIN;

-- Donald Chapman UUID
DO $$
DECLARE
  donald_id UUID := '389ea82c-db4c-40be-aee0-6b39785813da';
  assignment_count INT;
  session_count INT;
BEGIN
  -- Count before deletion
  SELECT COUNT(*) INTO assignment_count FROM teacher_assignments WHERE teacher_id = donald_id;
  SELECT COUNT(*) INTO session_count FROM class_sessions WHERE teacher_id = donald_id;

  RAISE NOTICE 'Before deletion: % assignments, % sessions', assignment_count, session_count;

  -- Delete class_sessions first (due to possible foreign key constraints)
  DELETE FROM class_sessions WHERE teacher_id = donald_id;

  -- Delete teacher_assignments
  DELETE FROM teacher_assignments WHERE teacher_id = donald_id;

  -- Verify deletion
  SELECT COUNT(*) INTO assignment_count FROM teacher_assignments WHERE teacher_id = donald_id;
  SELECT COUNT(*) INTO session_count FROM class_sessions WHERE teacher_id = donald_id;

  RAISE NOTICE 'After deletion: % assignments, % sessions', assignment_count, session_count;
  RAISE NOTICE '✅ All curriculum assignments removed for Donald Chapman';
END $$;

COMMIT;

-- Verify
SELECT 'Verification' as check;
SELECT COUNT(*) as remaining_assignments
FROM teacher_assignments
WHERE teacher_id = '389ea82c-db4c-40be-aee0-6b39785813da';

SELECT COUNT(*) as remaining_sessions
FROM class_sessions
WHERE teacher_id = '389ea82c-db4c-40be-aee0-6b39785813da';
