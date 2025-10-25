-- Drop Curriculum, Classes, Assessments, Assignments, and Skills System
-- This migration removes all tables related to curriculum, classes, skills, assessments, and assignments
-- Keeps: resources, lesson builder components, teachers, students, teacher_notes (modified)

-- Step 1: Drop dependent tables first (in order of dependencies)

-- Drop notifications that depend on skill_homework
DROP TABLE IF EXISTS student_notifications CASCADE;

-- Drop skill-related tables
DROP TABLE IF EXISTS skill_homework CASCADE;
DROP TABLE IF EXISTS student_skills CASCADE;
DROP TABLE IF EXISTS skill_evaluations CASCADE;
DROP TABLE IF EXISTS skills_evaluation CASCADE;
DROP TABLE IF EXISTS skills CASCADE;

-- Drop assessment tables
DROP TABLE IF EXISTS assessment CASCADE;
DROP TABLE IF EXISTS exam_results CASCADE;
DROP TABLE IF EXISTS homework_completion CASCADE;

-- Drop attendance and session-related tables
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS lesson_resources CASCADE;
DROP TABLE IF EXISTS class_sessions CASCADE;
DROP TABLE IF EXISTS calendar_sessions CASCADE;
DROP TABLE IF EXISTS teacher_assignments CASCADE;

-- Drop student progress and observation tables that depend on classes
DROP TABLE IF EXISTS student_progress CASCADE;
DROP TABLE IF EXISTS student_observation_evaluations CASCADE;

-- Drop teacher evaluations that depend on classes
-- Note: We're keeping teacher_evaluations table but removing class_id foreign key
-- First, let's check if we should keep teacher_evaluations
-- For now, we'll modify it to remove class dependency
ALTER TABLE IF EXISTS teacher_evaluations DROP CONSTRAINT IF EXISTS teacher_evaluations_class_id_fkey CASCADE;
ALTER TABLE IF EXISTS teacher_evaluations DROP COLUMN IF EXISTS class_id CASCADE;

-- Drop payment tables that depend on enrollments
-- We'll keep payments but remove enrollment dependency
ALTER TABLE IF EXISTS payments DROP CONSTRAINT IF EXISTS payments_enrollment_id_fkey CASCADE;
ALTER TABLE IF EXISTS payments DROP COLUMN IF EXISTS enrollment_id CASCADE;

-- Drop enrollments table
DROP TABLE IF EXISTS enrollments CASCADE;

-- Remove foreign key constraints from teacher_notes before dropping curriculum and skills
ALTER TABLE IF EXISTS teacher_notes DROP CONSTRAINT IF EXISTS teacher_notes_related_curriculum_id_fkey CASCADE;
ALTER TABLE IF EXISTS teacher_notes DROP CONSTRAINT IF EXISTS teacher_notes_related_skill_id_fkey CASCADE;
ALTER TABLE IF EXISTS teacher_notes DROP COLUMN IF EXISTS related_curriculum_id CASCADE;
ALTER TABLE IF EXISTS teacher_notes DROP COLUMN IF EXISTS related_skill_id CASCADE;

-- Drop curriculum table
DROP TABLE IF EXISTS curriculum CASCADE;

-- Drop classes table
DROP TABLE IF EXISTS classes CASCADE;

-- Step 2: Log the cleanup (audit_logs has specific action constraints, so we skip this)

-- Step 3: Create a simple log table for tracking the cleanup
CREATE TABLE IF NOT EXISTS curriculum_rebuild_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cleanup_date TIMESTAMPTZ DEFAULT NOW(),
    tables_dropped TEXT[] DEFAULT ARRAY[
        'student_notifications',
        'skill_homework',
        'student_skills',
        'skill_evaluations',
        'skills_evaluation',
        'skills',
        'assessment',
        'exam_results',
        'homework_completion',
        'attendance',
        'lesson_resources',
        'class_sessions',
        'calendar_sessions',
        'teacher_assignments',
        'student_progress',
        'student_observation_evaluations',
        'enrollments',
        'curriculum',
        'classes'
    ],
    notes TEXT DEFAULT 'Preparing for curriculum system rebuild'
);

INSERT INTO curriculum_rebuild_log (notes)
VALUES ('All curriculum-related tables dropped. Resources and lesson builder preserved. Ready for rebuild.');

-- Add comment
COMMENT ON TABLE curriculum_rebuild_log IS 'Tracks the cleanup of old curriculum system before rebuild';
