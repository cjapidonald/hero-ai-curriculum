-- Update curriculum stage format from 'Stage 1' to 'stage_1'
UPDATE curriculum
SET stage = 'stage_1'
WHERE stage = 'Stage 1';

-- Verify the update
SELECT
    COUNT(*) as total_stage_1_lessons,
    COUNT(CASE WHEN class = 'Alvin' THEN 1 END) as alvin_lessons
FROM curriculum
WHERE stage = 'stage_1';
