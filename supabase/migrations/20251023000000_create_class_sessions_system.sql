-- Migration: Create class_sessions system for integrated curriculum management
-- This migration creates the central hub for linking curriculum, classes, scheduling, and attendance

-- 1. Create class_sessions table (central hub)
CREATE TABLE IF NOT EXISTS class_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Foreign keys
  curriculum_id UUID REFERENCES curriculum(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE NOT NULL,

  -- Scheduling information
  session_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN (
    'scheduled',      -- Initial state - session is scheduled
    'building',       -- Teacher is building the lesson plan
    'ready',          -- Lesson plan is complete and ready to teach
    'in_progress',    -- Class is currently in session
    'completed',      -- Class has been completed
    'cancelled'       -- Class was cancelled
  )),

  -- Lesson plan tracking
  lesson_plan_completed BOOLEAN DEFAULT FALSE,
  lesson_plan_data JSONB DEFAULT '{}'::jsonb,  -- Stores the structured lesson plan

  -- Attendance tracking
  attendance_taken BOOLEAN DEFAULT FALSE,
  attendance_count INTEGER DEFAULT 0,
  total_students INTEGER DEFAULT 0,

  -- Additional fields
  notes TEXT,
  location TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_class_sessions_teacher ON class_sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_class_sessions_date ON class_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_class_sessions_class ON class_sessions(class_id);
CREATE INDEX IF NOT EXISTS idx_class_sessions_curriculum ON class_sessions(curriculum_id);
CREATE INDEX IF NOT EXISTS idx_class_sessions_status ON class_sessions(status);
CREATE INDEX IF NOT EXISTS idx_class_sessions_teacher_date ON class_sessions(teacher_id, session_date);

-- 3. Add class_session_id to attendance table
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS class_session_id UUID REFERENCES class_sessions(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance(class_session_id);

-- 4. Add class_session_id to lesson_resources table
ALTER TABLE lesson_resources ADD COLUMN IF NOT EXISTS class_session_id UUID REFERENCES class_sessions(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_lesson_resources_session ON lesson_resources(class_session_id);

-- 5. Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_class_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_class_sessions_updated_at
  BEFORE UPDATE ON class_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_class_sessions_updated_at();

-- 6. Create trigger to auto-update attendance count when attendance is taken
CREATE OR REPLACE FUNCTION update_class_session_attendance_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the attendance count for the class session
  UPDATE class_sessions
  SET
    attendance_count = (
      SELECT COUNT(*)
      FROM attendance
      WHERE class_session_id = NEW.class_session_id
      AND present = true
    ),
    attendance_taken = true,
    total_students = (
      SELECT COUNT(*)
      FROM attendance
      WHERE class_session_id = NEW.class_session_id
    )
  WHERE id = NEW.class_session_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_attendance_count
  AFTER INSERT OR UPDATE ON attendance
  FOR EACH ROW
  WHEN (NEW.class_session_id IS NOT NULL)
  EXECUTE FUNCTION update_class_session_attendance_count();

-- 7. Create view for teacher's upcoming sessions
CREATE OR REPLACE VIEW teacher_upcoming_sessions AS
SELECT
  cs.id,
  cs.session_date,
  cs.start_time,
  cs.end_time,
  cs.status,
  cs.lesson_plan_completed,
  cs.attendance_taken,
  cs.attendance_count,
  cs.total_students,
  c.class_name,
  c.stage,
  cur.lesson_title,
  cur.subject,
  t.name as teacher_name,
  t.email as teacher_email
FROM class_sessions cs
JOIN classes c ON cs.class_id = c.id
JOIN teachers t ON cs.teacher_id = t.id
LEFT JOIN curriculum cur ON cs.curriculum_id = cur.id
WHERE cs.status != 'cancelled'
ORDER BY cs.session_date ASC, cs.start_time ASC;

-- 8. Create RLS policies
ALTER TABLE class_sessions ENABLE ROW LEVEL SECURITY;

-- Teachers can view their own sessions
CREATE POLICY "Teachers can view their own class sessions"
  ON class_sessions FOR SELECT
  USING (auth.uid() = teacher_id);

-- Teachers can create sessions for their own classes
CREATE POLICY "Teachers can create their own class sessions"
  ON class_sessions FOR INSERT
  WITH CHECK (auth.uid() = teacher_id);

-- Teachers can update their own sessions
CREATE POLICY "Teachers can update their own class sessions"
  ON class_sessions FOR UPDATE
  USING (auth.uid() = teacher_id);

-- Teachers can delete their own sessions
CREATE POLICY "Teachers can delete their own class sessions"
  ON class_sessions FOR DELETE
  USING (auth.uid() = teacher_id);

-- Admins have full access
CREATE POLICY "Admins have full access to class sessions"
  ON class_sessions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE id = auth.uid()
    )
  );

-- 9. Add helpful comments
COMMENT ON TABLE class_sessions IS 'Central hub for managing scheduled class sessions with curriculum, lesson plans, and attendance';
COMMENT ON COLUMN class_sessions.status IS 'Tracks the lifecycle: scheduled → building → ready → in_progress → completed';
COMMENT ON COLUMN class_sessions.lesson_plan_data IS 'JSONB storing the structured lesson plan with resources, activities, and notes';
COMMENT ON COLUMN class_sessions.attendance_taken IS 'Indicates if attendance has been recorded for this session';

-- 10. Grant permissions
GRANT ALL ON class_sessions TO authenticated;
GRANT SELECT ON teacher_upcoming_sessions TO authenticated;
