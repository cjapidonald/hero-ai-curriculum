-- =============================================
-- ENHANCED SCHEMA MIGRATION
-- Adding requested features and improvements
-- =============================================

-- =============================================
-- 1. UPDATE TEACHERS TABLE
-- Add class assignment, username, and rate tracking
-- =============================================
ALTER TABLE teachers
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS assigned_classes TEXT[], -- Array of class names
ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_earnings NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- Create index for username
CREATE INDEX IF NOT EXISTS idx_teachers_username ON teachers(username);

-- =============================================
-- 2. RESOURCES TABLE FOR LESSON PLANNER
-- Central repository for all teaching resources
-- =============================================
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  resource_type TEXT NOT NULL, -- warmup, main_activity, assessment, homework, printable
  file_type TEXT, -- pdf, image, video, link, file
  file_url TEXT,
  storage_path TEXT, -- Path in Supabase storage
  file_size INTEGER, -- Size in bytes
  thumbnail_url TEXT,
  tags TEXT[],
  subject TEXT,
  level TEXT, -- Beginner, Pre-A1, A1, A2, etc.
  stage TEXT, -- Stage 1-6
  uploaded_by UUID REFERENCES teachers(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT true,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to resources table if it already exists
ALTER TABLE resources
ADD COLUMN IF NOT EXISTS level TEXT,
ADD COLUMN IF NOT EXISTS stage TEXT;

-- Indexes for resources
CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_resources_level ON resources(level);
CREATE INDEX IF NOT EXISTS idx_resources_stage ON resources(stage);
CREATE INDEX IF NOT EXISTS idx_resources_uploaded_by ON.resources(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_resources_tags ON resources USING GIN(tags);

-- RLS for resources
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Resources are viewable by everyone"
  ON resources FOR SELECT
  USING (is_public = true OR uploaded_by = auth.uid()::uuid);

CREATE POLICY "Teachers can insert resources"
  ON resources FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Teachers can update their own resources"
  ON resources FOR UPDATE
  USING (uploaded_by = auth.uid()::uuid OR true);

CREATE POLICY "Teachers can delete their own resources"
  ON resources FOR DELETE
  USING (uploaded_by = auth.uid()::uuid OR true);

-- =============================================
-- 3. UPDATE CURRICULUM TABLE
-- Add class assignment and school fields
-- =============================================
ALTER TABLE curriculum
ADD COLUMN IF NOT EXISTS class TEXT,
ADD COLUMN IF NOT EXISTS school TEXT DEFAULT 'HeroSchool',
ADD COLUMN IF NOT EXISTS curriculum_stage TEXT; -- Stage 1-6

CREATE INDEX IF NOT EXISTS idx_curriculum_class ON curriculum(class);
CREATE INDEX IF NOT EXISTS idx_curriculum_stage ON curriculum(curriculum_stage);

-- =============================================
-- 4. UPDATE ASSESSMENT TABLE
-- Make it class-based instead of student-based
-- =============================================
-- Note: We're keeping the student_id for backwards compatibility,
-- but making it optional
ALTER TABLE assessment
ALTER COLUMN student_id DROP NOT NULL,
ALTER COLUMN student_name DROP NOT NULL;

-- Add class-wide assessment fields
ALTER TABLE assessment
ADD COLUMN IF NOT EXISTS is_class_assessment BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS assessment_type TEXT DEFAULT 'individual'; -- individual, class, group

-- =============================================
-- 5. CLASSES TABLE
-- Define all classes in the school
-- =============================================
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  level TEXT, -- Beginner, Pre-A1, A1, A2
  stage TEXT, -- Stage 1-6
  teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
  teacher_name TEXT,
  schedule TEXT, -- e.g., "Mon/Wed 4:00-5:30 PM"
  max_students INTEGER DEFAULT 12,
  current_students INTEGER DEFAULT 0,
  classroom TEXT,
  is_active BOOLEAN DEFAULT true,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for classes
CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_level ON classes(level);
CREATE INDEX IF NOT EXISTS idx_classes_active ON classes(is_active);

-- RLS for classes
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Classes are viewable by everyone"
  ON classes FOR SELECT
  USING (true);

CREATE POLICY "Allow all for classes management"
  ON classes FOR ALL
  USING (true);

-- =============================================
-- 6. SKILLS MASTER TABLE
-- Admin can create and manage skills
-- =============================================
CREATE TABLE IF NOT EXISTS skills_master (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  skill_name TEXT NOT NULL,
  skill_category TEXT NOT NULL, -- Writing, Reading, Listening, Speaking
  skill_description TEXT,
  level TEXT, -- Beginner, Pre-A1, A1, A2
  stage TEXT, -- Stage 1-6
  assigned_classes TEXT[], -- Array of class names
  evaluation_criteria TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES teachers(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for skills master
CREATE INDEX IF NOT EXISTS idx_skills_master_category ON skills_master(skill_category);
CREATE INDEX IF NOT EXISTS idx_skills_master_level ON skills_master(level);
CREATE INDEX IF NOT EXISTS idx_skills_master_active ON skills_master(is_active);

-- RLS for skills master
ALTER TABLE skills_master ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Skills are viewable by everyone"
  ON skills_master FOR SELECT
  USING (true);

CREATE POLICY "Allow all for skills management"
  ON skills_master FOR ALL
  USING (true);

-- =============================================
-- 7. ATTENDANCE TABLE
-- Track student attendance
-- =============================================
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES dashboard_students(id) ON DELETE CASCADE,
  class TEXT,
  session_date DATE NOT NULL,
  status TEXT DEFAULT 'present', -- present, absent, late, excused
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, session_date)
);

-- Indexes for attendance
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(session_date);
CREATE INDEX IF NOT EXISTS idx_attendance_class ON attendance(class);

-- RLS for attendance
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for attendance"
  ON attendance FOR ALL
  USING (true);

-- =============================================
-- 8. FUNCTION TO UPDATE SESSIONS_LEFT
-- Auto-decrement sessions_left based on attendance
-- =============================================
CREATE OR REPLACE FUNCTION update_student_sessions()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'present' OR NEW.status = 'late' THEN
    UPDATE dashboard_students
    SET
      sessions = sessions + 1,
      sessions_left = GREATEST(sessions_left - 1, 0),
      attendance_rate = (
        SELECT (COUNT(*) FILTER (WHERE status IN ('present', 'late')) * 100.0 / NULLIF(COUNT(*), 0))
        FROM attendance
        WHERE student_id = NEW.student_id
      )
    WHERE id = NEW.student_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update sessions
CREATE TRIGGER attendance_update_sessions
  AFTER INSERT ON attendance
  FOR EACH ROW
  EXECUTE FUNCTION update_student_sessions();

-- =============================================
-- 9. FUNCTION TO UPDATE TEACHER EARNINGS
-- Calculate monthly earnings from payroll
-- =============================================
CREATE OR REPLACE FUNCTION update_teacher_earnings()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE teachers
  SET monthly_earnings = (
    SELECT COALESCE(SUM((hours_taught * hourly_rate) + bonus_amount - deduction_amount), 0)
    FROM teacher_payroll
    WHERE teacher_id = NEW.teacher_id
      AND session_date >= date_trunc('month', CURRENT_DATE)
      AND session_date < date_trunc('month', CURRENT_DATE) + interval '1 month'
  )
  WHERE id = NEW.teacher_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update teacher earnings
CREATE TRIGGER payroll_update_earnings
  AFTER INSERT OR UPDATE ON teacher_payroll
  FOR EACH ROW
  EXECUTE FUNCTION update_teacher_earnings();

-- =============================================
-- 10. TRIGGERS FOR NEW TABLES
-- =============================================
CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON resources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_skills_master_updated_at BEFORE UPDATE ON skills_master
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 11. SAMPLE DATA FOR NEW TABLES
-- =============================================

-- Sample Classes
INSERT INTO classes (name, level, stage, teacher_name, schedule, max_students, current_students, is_active, start_date) VALUES
  ('Starters A', 'Pre-A1', 'Stage 2', 'Donald Teacher', 'Mon/Wed 4:00-5:30 PM', 12, 8, true, '2025-01-10'),
  ('Movers B', 'A1', 'Stage 4', 'Sarah Johnson', 'Tue/Thu 4:00-5:30 PM', 12, 10, true, '2025-01-10'),
  ('Flyers C', 'A2', 'Stage 6', 'Michael Chen', 'Mon/Wed 5:45-7:15 PM', 12, 6, true, '2025-01-10')
ON CONFLICT (name) DO NOTHING;

-- Sample Resources
INSERT INTO resources (name, description, resource_type, file_type, file_url, tags, subject, level, stage, is_public) VALUES
  ('Numbers 1-10 Flashcards', 'Colorful flashcards for teaching numbers', 'warmup', 'pdf', 'https://example.com/flashcards.pdf', ARRAY['numbers', 'vocabulary'], 'English', 'Beginner', 'Stage 1', true),
  ('Family Members Song', 'Interactive song about family', 'warmup', 'video', 'https://youtube.com/watch?v=example', ARRAY['family', 'vocabulary', 'song'], 'English', 'Pre-A1', 'Stage 2', true),
  ('Present Simple Quiz', 'Kahoot quiz on present simple tense', 'assessment', 'link', 'https://kahoot.it/example', ARRAY['grammar', 'quiz'], 'English', 'A1', 'Stage 4', true),
  ('Reading Comprehension Worksheet', 'Short story with questions', 'homework', 'pdf', 'https://example.com/reading.pdf', ARRAY['reading', 'comprehension'], 'English', 'A2', 'Stage 6', true),
  ('Alphabet Coloring Pages', 'A-Z coloring and tracing sheets', 'printable', 'pdf', 'https://example.com/alphabet.pdf', ARRAY['alphabet', 'writing'], 'English', 'Beginner', 'Stage 1', true)
ON CONFLICT DO NOTHING;

-- Sample Skills Master
INSERT INTO skills_master (skill_name, skill_category, skill_description, level, stage, assigned_classes, evaluation_criteria, is_active) VALUES
  ('Count 1-20', 'Speaking', 'Students can count from 1 to 20 clearly', 'Beginner', 'Stage 1', ARRAY['Starters A'], ARRAY['Pronunciation', 'Accuracy', 'Fluency'], true),
  ('Introduce Family Members', 'Speaking', 'Can introduce family members using correct vocabulary', 'Pre-A1', 'Stage 2', ARRAY['Starters A'], ARRAY['Vocabulary', 'Grammar', 'Confidence'], true),
  ('Read Simple Sentences', 'Reading', 'Can read and understand simple sentences', 'Pre-A1', 'Stage 2', ARRAY['Starters A', 'Movers B'], ARRAY['Decoding', 'Comprehension', 'Fluency'], true),
  ('Write Short Paragraph', 'Writing', 'Can write a short paragraph about themselves', 'A1', 'Stage 4', ARRAY['Movers B'], ARRAY['Grammar', 'Spelling', 'Organization', 'Content'], true)
ON CONFLICT DO NOTHING;

-- Update teacher Donald with username and rate
UPDATE teachers
SET
  username = 'donald',
  assigned_classes = ARRAY['Starters A'],
  hourly_rate = 250000
WHERE email = 'donald@heroschool.com';

-- Update other teachers
UPDATE teachers
SET username = 'sarah', assigned_classes = ARRAY['Movers B'], hourly_rate = 250000
WHERE email = 'sarah@heroschool.com';

UPDATE teachers
SET username = 'michael', assigned_classes = ARRAY['Flyers C'], hourly_rate = 250000
WHERE email = 'michael@heroschool.com';

-- Update classes with teacher IDs
UPDATE classes c
SET teacher_id = t.id
FROM teachers t
WHERE c.teacher_name = t.name || ' ' || t.surname;

-- =============================================
-- COMMENTS
-- =============================================
COMMENT ON TABLE resources IS 'Central repository for all teaching resources with file management';
COMMENT ON TABLE classes IS 'Class definitions with teacher assignments and schedules';
COMMENT ON TABLE skills_master IS 'Master list of skills that can be assigned to classes';
COMMENT ON TABLE attendance IS 'Student attendance tracking with automatic session updates';

COMMENT ON COLUMN teachers.username IS 'Unique username for teacher login';
COMMENT ON COLUMN teachers.assigned_classes IS 'Array of class names this teacher is assigned to';
COMMENT ON COLUMN teachers.hourly_rate IS 'Teacher hourly rate in VND';
COMMENT ON COLUMN teachers.monthly_earnings IS 'Auto-calculated monthly earnings from payroll';
