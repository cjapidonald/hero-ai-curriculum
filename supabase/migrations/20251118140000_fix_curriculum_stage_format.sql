-- Fix curriculum stage format to match classes table
-- Changes 'Stage 1' to 'stage_1' for consistency

DO $$
BEGIN
  -- Update only if there are records with 'Stage 1'
  IF EXISTS (SELECT 1 FROM curriculum WHERE stage = 'Stage 1' LIMIT 1) THEN
    UPDATE curriculum
    SET stage = 'stage_1'
    WHERE stage = 'Stage 1';

    RAISE NOTICE 'Updated curriculum stage format from "Stage 1" to "stage_1"';
  ELSE
    RAISE NOTICE 'No curriculum records found with "Stage 1" format';
  END IF;
END $$;
