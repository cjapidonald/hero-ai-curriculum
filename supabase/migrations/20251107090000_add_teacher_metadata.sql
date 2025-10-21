-- Add teacher metadata columns required by admin dashboard

ALTER TABLE teachers
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS assigned_classes TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monthly_earnings NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- Ensure existing rows have an empty array instead of NULL for assigned_classes
UPDATE teachers
SET assigned_classes = ARRAY[]::TEXT[]
WHERE assigned_classes IS NULL;
