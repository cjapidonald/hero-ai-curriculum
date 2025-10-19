-- Enhanced Dashboard Schema with Calendar, Attendance Tracking, Notes, and Notifications
-- This schema extends the existing dashboard-schema.sql

-- ============================================================================
-- ATTENDANCE TRACKING TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL,
  student_id UUID NOT NULL,
  class_session_id UUID, -- References calendar_sessions table
  date DATE NOT NULL,
  present BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, date, class_session_id)
);

CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_session ON attendance(class_session_id);

-- ============================================================================
-- CALENDAR/CLASS SESSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS calendar_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL,
  curriculum_id UUID, -- References curriculum table
  class_name TEXT NOT NULL, -- e.g., "Class A", "Advanced English"
  lesson_title TEXT,
  session_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  status TEXT DEFAULT 'scheduled', -- scheduled, completed, cancelled
  attendance_taken BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_calendar_teacher ON calendar_sessions(teacher_id);
CREATE INDEX idx_calendar_date ON calendar_sessions(session_date);
CREATE INDEX idx_calendar_class ON calendar_sessions(class_name);

-- ============================================================================
-- STUDENT NOTES TABLE (Cumulative notes per student)
-- ============================================================================
CREATE TABLE IF NOT EXISTS student_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL UNIQUE,
  teacher_id UUID NOT NULL,
  notes JSONB DEFAULT '[]'::jsonb, -- Array of note objects: [{date, session_id, note, teacher_name}]
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_student_notes_student ON student_notes(student_id);
CREATE INDEX idx_student_notes_teacher ON student_notes(teacher_id);

-- ============================================================================
-- ASSIGNMENTS TABLE (Enhanced with class-wide and individual assignments)
-- ============================================================================
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  assignment_type TEXT, -- 'homework', 'assessment', 'printable', 'custom'
  source_material_id UUID, -- References curriculum materials if applicable

  -- Assignment can be for whole class or individual student
  target_type TEXT NOT NULL, -- 'class', 'student'
  target_class TEXT, -- Class name if target_type = 'class'
  target_student_id UUID, -- Student ID if target_type = 'student'

  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_assignments_teacher ON assignments(teacher_id);
CREATE INDEX idx_assignments_class ON assignments(target_class);
CREATE INDEX idx_assignments_student ON assignments(target_student_id);

-- ============================================================================
-- STUDENT NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS student_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'assignment', 'note', 'assessment', 'announcement'
  title TEXT NOT NULL,
  message TEXT,
  related_id UUID, -- ID of related assignment, assessment, etc.
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_student ON student_notifications(student_id);
CREATE INDEX idx_notifications_read ON student_notifications(read);
CREATE INDEX idx_notifications_created ON student_notifications(created_at DESC);

-- ============================================================================
-- ATTENDANCE COUNTER (Track total attendance per student)
-- ============================================================================
-- Add attendance counter to dashboard_students if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'dashboard_students'
    AND column_name = 'total_attendance'
  ) THEN
    ALTER TABLE dashboard_students ADD COLUMN total_attendance INTEGER DEFAULT 0;
  END IF;
END $$;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to increment attendance when teacher marks present
CREATE OR REPLACE FUNCTION increment_student_attendance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.present = true THEN
    UPDATE dashboard_students
    SET total_attendance = COALESCE(total_attendance, 0) + 1,
        updated_at = NOW()
    WHERE id = NEW.student_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-increment attendance
DROP TRIGGER IF EXISTS trigger_increment_attendance ON attendance;
CREATE TRIGGER trigger_increment_attendance
  AFTER INSERT ON attendance
  FOR EACH ROW
  EXECUTE FUNCTION increment_student_attendance();

-- Function to append note to student_notes
CREATE OR REPLACE FUNCTION append_student_note(
  p_student_id UUID,
  p_teacher_id UUID,
  p_teacher_name TEXT,
  p_session_id UUID,
  p_note TEXT
) RETURNS void AS $$
DECLARE
  note_object JSONB;
BEGIN
  note_object := jsonb_build_object(
    'date', NOW(),
    'session_id', p_session_id,
    'note', p_note,
    'teacher_name', p_teacher_name
  );

  INSERT INTO student_notes (student_id, teacher_id, notes)
  VALUES (p_student_id, p_teacher_id, jsonb_build_array(note_object))
  ON CONFLICT (student_id)
  DO UPDATE SET
    notes = student_notes.notes || note_object,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to create notification for student
CREATE OR REPLACE FUNCTION create_student_notification(
  p_student_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_related_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO student_notifications (student_id, type, title, message, related_id)
  VALUES (p_student_id, p_type, p_title, p_message, p_related_id)
  RETURNING id INTO notification_id;

  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_notifications ENABLE ROW LEVEL SECURITY;

-- Permissive policies for now (adjust based on your auth setup)
CREATE POLICY "Allow all for attendance" ON attendance FOR ALL USING (true);
CREATE POLICY "Allow all for calendar_sessions" ON calendar_sessions FOR ALL USING (true);
CREATE POLICY "Allow all for student_notes" ON student_notes FOR ALL USING (true);
CREATE POLICY "Allow all for assignments" ON assignments FOR ALL USING (true);
CREATE POLICY "Allow all for student_notifications" ON student_notifications FOR ALL USING (true);

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

-- Sample calendar session
INSERT INTO calendar_sessions (teacher_id, class_name, lesson_title, session_date, start_time, end_time)
VALUES
  (
    (SELECT id FROM teachers WHERE email = 'donald@heroschool.com' LIMIT 1),
    'Class A',
    'Unit 1 - Introduction to Grammar',
    CURRENT_DATE,
    '09:00',
    '10:30'
  )
ON CONFLICT DO NOTHING;

-- Sample assignment for whole class
INSERT INTO assignments (teacher_id, title, description, assignment_type, target_type, target_class, due_date)
VALUES
  (
    (SELECT id FROM teachers WHERE email = 'donald@heroschool.com' LIMIT 1),
    'Grammar Worksheet 1',
    'Complete exercises 1-10 on page 25',
    'homework',
    'class',
    'Class A',
    CURRENT_DATE + INTERVAL '7 days'
  )
ON CONFLICT DO NOTHING;

-- Sample notification
INSERT INTO student_notifications (student_id, type, title, message)
VALUES
  (
    (SELECT id FROM dashboard_students WHERE email = 'emma@student.com' LIMIT 1),
    'assignment',
    'New Assignment',
    'Grammar Worksheet 1 has been assigned. Due in 7 days.'
  )
ON CONFLICT DO NOTHING;

COMMENT ON TABLE attendance IS 'Tracks daily attendance with incremental counter';
COMMENT ON TABLE calendar_sessions IS 'Teacher calendar with class sessions linked to curriculum';
COMMENT ON TABLE student_notes IS 'Cumulative notes per student (JSONB array prevents row creation per note)';
COMMENT ON TABLE assignments IS 'Class-wide and individual student assignments';
COMMENT ON TABLE student_notifications IS 'Student notification system';
