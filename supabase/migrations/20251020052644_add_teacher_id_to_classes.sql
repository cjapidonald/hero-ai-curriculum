-- Add teacher_id column to classes table if it doesn't exist
-- This fixes the issue where classes.teacher_id does not exist

-- First, ensure the classes table exists
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add all necessary columns if they don't exist
DO $$
BEGIN
  -- Add level column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'classes' AND column_name = 'level'
  ) THEN
    ALTER TABLE classes ADD COLUMN level TEXT;
  END IF;

  -- Add stage column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'classes' AND column_name = 'stage'
  ) THEN
    ALTER TABLE classes ADD COLUMN stage TEXT;
  END IF;

  -- Add teacher_name column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'classes' AND column_name = 'teacher_name'
  ) THEN
    ALTER TABLE classes ADD COLUMN teacher_name TEXT;
  END IF;

  -- Add teacher_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'classes' AND column_name = 'teacher_id'
  ) THEN
    ALTER TABLE classes ADD COLUMN teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL;
  END IF;

  -- Add schedule column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'classes' AND column_name = 'schedule'
  ) THEN
    ALTER TABLE classes ADD COLUMN schedule TEXT;
  END IF;

  -- Add max_students column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'classes' AND column_name = 'max_students'
  ) THEN
    ALTER TABLE classes ADD COLUMN max_students INTEGER DEFAULT 12;
  END IF;

  -- Add current_students column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'classes' AND column_name = 'current_students'
  ) THEN
    ALTER TABLE classes ADD COLUMN current_students INTEGER DEFAULT 0;
  END IF;

  -- Add classroom column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'classes' AND column_name = 'classroom'
  ) THEN
    ALTER TABLE classes ADD COLUMN classroom TEXT;
  END IF;

  -- Add is_active column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'classes' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE classes ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;

  -- Add start_date column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'classes' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE classes ADD COLUMN start_date DATE;
  END IF;

  -- Add end_date column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'classes' AND column_name = 'end_date'
  ) THEN
    ALTER TABLE classes ADD COLUMN end_date DATE;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_level ON classes(level);
CREATE INDEX IF NOT EXISTS idx_classes_active ON classes(is_active);

-- Enable RLS on classes if not already enabled
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Classes are viewable by everyone" ON classes;
DROP POLICY IF EXISTS "Allow all for classes management" ON classes;

-- Create RLS policies
CREATE POLICY "Classes are viewable by everyone"
  ON classes FOR SELECT
  USING (true);

CREATE POLICY "Allow all for classes management"
  ON classes FOR ALL
  USING (true);

-- Update classes with teacher IDs based on teacher_name if needed
UPDATE classes c
SET teacher_id = t.id
FROM teachers t
WHERE c.teacher_id IS NULL
  AND c.teacher_name IS NOT NULL
  AND c.teacher_name = t.name || ' ' || t.surname;
