-- Migration: Ensure teachers reference Supabase Auth users
-- Adds an auth_user_id column and supporting constraints for teacher mappings

ALTER TABLE teachers
  ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);

CREATE UNIQUE INDEX IF NOT EXISTS teachers_auth_user_id_key ON teachers(auth_user_id);

COMMENT ON COLUMN teachers.auth_user_id IS 'Reference to the Supabase auth.users record backing this teacher.';
