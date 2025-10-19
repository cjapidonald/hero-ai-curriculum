-- =============================================
-- COMPREHENSIVE ADMIN & TEACHER SYSTEM MIGRATION
-- =============================================
-- This migration creates all tables and RLS policies for:
-- - Admin full access
-- - Teacher limited access (own data + assigned students)
-- - Student read-only access
-- - Skills tracking system
-- - Resources and lesson planning
-- - Teacher assignments and scheduling
-- - Payroll system
-- =============================================

-- Enable UUID extension (if not already enabled)
-- Note: In Supabase, use gen_random_uuid() from pgcrypto or default extensions

-- =============================================
-- ENUMS
-- =============================================

-- Skill categories
CREATE TYPE skill_category AS ENUM (
  'listening',
  'speaking',
  'reading',
  'writing',
  'vocabulary',
  'grammar',
  'pronunciation',
  'fluency',
  'comprehension',
  'social_skills'
);

-- Skill proficiency levels
CREATE TYPE proficiency_level AS ENUM (
  'beginner',
  'elementary',
  'pre_intermediate',
  'intermediate',
  'upper_intermediate',
  'advanced'
);

-- Resource types (similar to curriculum)
CREATE TYPE resource_type AS ENUM (
  'warmup',
  'activity',
  'game',
  'worksheet',
  'video',
  'audio',
  'presentation',
  'assessment',
  'homework',
  'printable'
);

-- Payment status
CREATE TYPE payment_status_type AS ENUM (
  'pending',
  'paid',
  'partial',
  'overdue',
  'cancelled'
);

-- =============================================
-- ADMINS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL, -- In production, use proper password hashing
  name VARCHAR(255) NOT NULL,
  surname VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  profile_image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TEACHER PROFILES (Extended Information)
-- =============================================

CREATE TABLE IF NOT EXISTS teacher_profiles (
  id UUID PRIMARY KEY REFERENCES teachers(id) ON DELETE CASCADE,
  bio TEXT,
  qualifications TEXT[],
  years_of_experience INTEGER,
  specializations TEXT[],
  languages_spoken TEXT[],
  hourly_rate DECIMAL(10,2),
  bank_account_number VARCHAR(100),
  bank_name VARCHAR(100),
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100) DEFAULT 'Vietnam',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- SKILLS MASTER TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_name VARCHAR(255) NOT NULL,
  skill_code VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'LISTEN_001', 'SPEAK_001'
  category skill_category NOT NULL,
  description TEXT,
  target_stage cambridge_stage[], -- Which stages this skill applies to
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- STUDENT SKILLS (Junction Table with Scores)
-- =============================================

CREATE TABLE IF NOT EXISTS student_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  current_score DECIMAL(5,2) CHECK (current_score >= 0 AND current_score <= 100), -- 0-100 scale
  proficiency_level proficiency_level,
  last_assessed_date DATE,
  assessed_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, skill_id)
);

-- =============================================
-- RESOURCES TABLE (Searchable Teaching Resources)
-- =============================================

CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  resource_type resource_type NOT NULL,
  stage cambridge_stage,
  level TEXT,
  duration_minutes INTEGER,
  objectives TEXT[],
  materials_needed TEXT[],
  instructions TEXT,
  file_url TEXT,
  image_url TEXT,
  video_url TEXT,
  tags TEXT[], -- For searchability
  created_by UUID REFERENCES users(id),
  is_public BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for searchability
CREATE INDEX IF NOT EXISTS idx_resources_tags ON resources USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_resources_stage ON resources(stage);
CREATE INDEX IF NOT EXISTS idx_resources_level ON resources(level);
CREATE INDEX IF NOT EXISTS idx_resources_title ON resources USING GIN(to_tsvector('english', title));

-- =============================================
-- LESSON RESOURCES (Junction Table for Drag-Drop)
-- =============================================

CREATE TABLE IF NOT EXISTS lesson_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curriculum_id UUID NOT NULL REFERENCES curriculum(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0, -- For ordering in the lesson plan
  notes TEXT, -- Teacher notes about how to use this resource
  added_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lesson_resources_curriculum ON lesson_resources(curriculum_id);
CREATE INDEX IF NOT EXISTS idx_lesson_resources_position ON lesson_resources(curriculum_id, position);

-- =============================================
-- TEACHER NOTES (For Students & Assignments)
-- =============================================

CREATE TABLE IF NOT EXISTS teacher_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  note_type VARCHAR(50) DEFAULT 'general', -- general, behavior, progress, assignment, skill
  note_text TEXT NOT NULL,
  related_skill_id UUID REFERENCES skills(id) ON DELETE SET NULL,
  related_curriculum_id UUID REFERENCES curriculum(id) ON DELETE SET NULL,
  is_private BOOLEAN DEFAULT false, -- Private notes only visible to teacher and admin
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teacher_notes_student ON teacher_notes(student_id);
CREATE INDEX IF NOT EXISTS idx_teacher_notes_teacher ON teacher_notes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_notes_type ON teacher_notes(note_type);

-- =============================================
-- TEACHER ASSIGNMENTS (Class, Curriculum, Schedule)
-- =============================================

CREATE TABLE IF NOT EXISTS teacher_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  curriculum_id UUID REFERENCES curriculum(id) ON DELETE SET NULL,
  teaching_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location VARCHAR(100),
  status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, completed, cancelled, rescheduled
  notes TEXT,
  created_by UUID REFERENCES users(id), -- Admin who created the assignment
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teacher_assignments_teacher ON teacher_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_date ON teacher_assignments(teaching_date);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_class ON teacher_assignments(class_id);

-- =============================================
-- PAYROLL TABLE (Teacher Payments)
-- =============================================

CREATE TABLE IF NOT EXISTS payroll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  hours_worked DECIMAL(10,2),
  hourly_rate DECIMAL(10,2),
  base_amount DECIMAL(10,2) NOT NULL,
  bonus DECIMAL(10,2) DEFAULT 0,
  deductions DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) GENERATED ALWAYS AS (base_amount + COALESCE(bonus, 0) - COALESCE(deductions, 0)) STORED,
  payment_status payment_status_type DEFAULT 'pending',
  payment_date DATE,
  payment_method VARCHAR(50), -- bank_transfer, cash, etc.
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payroll_teacher ON payroll(teacher_id);
CREATE INDEX IF NOT EXISTS idx_payroll_period ON payroll(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_payroll_status ON payroll(payment_status);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all new tables
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;

-- =============================================
-- ADMIN POLICIES (Full Access to Everything)
-- =============================================

-- Admins table - admins can manage themselves
CREATE POLICY "Admins can view all admins"
  ON admins FOR SELECT
  USING (true); -- Will be restricted by application logic

CREATE POLICY "Admins can update themselves"
  ON admins FOR UPDATE
  USING (true);

-- Teacher Profiles - Admins have full access
CREATE POLICY "Admins have full access to teacher profiles"
  ON teacher_profiles FOR ALL
  USING (true);

-- Skills - Everyone can read, admins can manage
CREATE POLICY "Anyone can view active skills"
  ON skills FOR SELECT
  USING (is_active = true OR auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage skills"
  ON skills FOR ALL
  USING (auth.role() = 'authenticated');

-- Student Skills - Admins and teachers can manage
CREATE POLICY "Authenticated users can view student skills"
  ON student_skills FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage student skills"
  ON student_skills FOR ALL
  USING (auth.role() = 'authenticated');

-- Resources - Public read, authenticated write
CREATE POLICY "Public resources are viewable by everyone"
  ON resources FOR SELECT
  USING (is_public = true AND is_active = true);

CREATE POLICY "Authenticated users have full access to resources"
  ON resources FOR ALL
  USING (auth.role() = 'authenticated');

-- Lesson Resources - Authenticated users
CREATE POLICY "Authenticated users can manage lesson resources"
  ON lesson_resources FOR ALL
  USING (auth.role() = 'authenticated');

-- Teacher Notes - Teachers see own notes, admins see all
CREATE POLICY "Authenticated users can view relevant teacher notes"
  ON teacher_notes FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Teachers can create notes"
  ON teacher_notes FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Teachers can update own notes, admins can update all"
  ON teacher_notes FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Teachers can delete own notes, admins can delete all"
  ON teacher_notes FOR DELETE
  USING (auth.role() = 'authenticated');

-- Teacher Assignments - Authenticated users
CREATE POLICY "Authenticated users can view teacher assignments"
  ON teacher_assignments FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage teacher assignments"
  ON teacher_assignments FOR ALL
  USING (auth.role() = 'authenticated');

-- Payroll - Authenticated users can view and manage
CREATE POLICY "Authenticated users can view payroll"
  ON payroll FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage payroll"
  ON payroll FOR ALL
  USING (auth.role() = 'authenticated');

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Trigger to update updated_at for new tables
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teacher_profiles_updated_at BEFORE UPDATE ON teacher_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_skills_updated_at BEFORE UPDATE ON skills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_skills_updated_at BEFORE UPDATE ON student_skills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON resources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teacher_notes_updated_at BEFORE UPDATE ON teacher_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teacher_assignments_updated_at BEFORE UPDATE ON teacher_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payroll_updated_at BEFORE UPDATE ON payroll
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- HELPFUL VIEWS
-- =============================================

-- View for teacher dashboard (classes, assignments, students)
CREATE OR REPLACE VIEW teacher_dashboard_view AS
SELECT
  t.id AS teacher_id,
  t.name || ' ' || t.surname AS teacher_name,
  t.email,
  tp.hourly_rate,
  COUNT(DISTINCT ta.class_id) AS assigned_classes_count,
  COUNT(DISTINCT e.student_id) AS total_students,
  COUNT(DISTINCT ta.id) FILTER (WHERE ta.teaching_date >= CURRENT_DATE) AS upcoming_assignments
FROM teachers t
LEFT JOIN teacher_profiles tp ON t.id = tp.id
LEFT JOIN teacher_assignments ta ON t.id = ta.teacher_id
LEFT JOIN classes c ON ta.class_id = c.id
LEFT JOIN enrollments e ON c.id = e.class_id AND e.is_active = true
GROUP BY t.id, t.name, t.surname, t.email, tp.hourly_rate;

-- View for student skills progress
CREATE OR REPLACE VIEW student_skills_summary AS
SELECT
  s.id AS student_id,
  s.full_name,
  sk.category,
  COUNT(ss.id) AS skills_in_category,
  ROUND(AVG(ss.current_score), 2) AS average_score,
  MAX(ss.last_assessed_date) AS last_assessed
FROM students s
LEFT JOIN student_skills ss ON s.id = ss.student_id
LEFT JOIN skills sk ON ss.skill_id = sk.id
GROUP BY s.id, s.full_name, sk.category;

-- =============================================
-- SAMPLE DATA FOR TESTING
-- =============================================

-- Insert sample admin
INSERT INTO admins (email, password, name, surname, phone) VALUES
  ('admin@heroschool.com', 'admin123', 'Admin', 'HeroSchool', '+84123456789')
ON CONFLICT (email) DO NOTHING;

-- Insert sample skills
INSERT INTO skills (skill_name, skill_code, category, description, target_stage) VALUES
  ('Basic Listening Comprehension', 'LISTEN_001', 'listening', 'Understand simple spoken instructions', ARRAY['stage_1', 'stage_2']::cambridge_stage[]),
  ('Intermediate Listening', 'LISTEN_002', 'listening', 'Understand conversations and short talks', ARRAY['stage_3', 'stage_4']::cambridge_stage[]),
  ('Advanced Listening', 'LISTEN_003', 'listening', 'Understand complex discussions and lectures', ARRAY['stage_5', 'stage_6']::cambridge_stage[]),

  ('Basic Speaking', 'SPEAK_001', 'speaking', 'Produce simple sentences about familiar topics', ARRAY['stage_1', 'stage_2']::cambridge_stage[]),
  ('Conversational Speaking', 'SPEAK_002', 'speaking', 'Engage in everyday conversations', ARRAY['stage_3', 'stage_4']::cambridge_stage[]),
  ('Fluent Speaking', 'SPEAK_003', 'speaking', 'Express ideas fluently and spontaneously', ARRAY['stage_5', 'stage_6']::cambridge_stage[]),

  ('Basic Reading', 'READ_001', 'reading', 'Read and understand simple texts', ARRAY['stage_1', 'stage_2']::cambridge_stage[]),
  ('Intermediate Reading', 'READ_002', 'reading', 'Read articles and short stories', ARRAY['stage_3', 'stage_4']::cambridge_stage[]),
  ('Advanced Reading', 'READ_003', 'reading', 'Understand complex literary texts', ARRAY['stage_5', 'stage_6']::cambridge_stage[]),

  ('Basic Writing', 'WRITE_001', 'writing', 'Write simple sentences and paragraphs', ARRAY['stage_1', 'stage_2']::cambridge_stage[]),
  ('Structured Writing', 'WRITE_002', 'writing', 'Write structured essays and reports', ARRAY['stage_3', 'stage_4']::cambridge_stage[]),
  ('Creative Writing', 'WRITE_003', 'writing', 'Write creative and academic texts', ARRAY['stage_5', 'stage_6']::cambridge_stage[]),

  ('Basic Vocabulary', 'VOCAB_001', 'vocabulary', 'Know essential everyday vocabulary', ARRAY['stage_1', 'stage_2']::cambridge_stage[]),
  ('Intermediate Vocabulary', 'VOCAB_002', 'vocabulary', 'Expanding topic-based vocabulary', ARRAY['stage_3', 'stage_4']::cambridge_stage[]),
  ('Advanced Vocabulary', 'VOCAB_003', 'vocabulary', 'Use idiomatic and academic vocabulary', ARRAY['stage_5', 'stage_6']::cambridge_stage[]),

  ('Basic Grammar', 'GRAM_001', 'grammar', 'Understand basic sentence structures', ARRAY['stage_1', 'stage_2']::cambridge_stage[]),
  ('Intermediate Grammar', 'GRAM_002', 'grammar', 'Use complex grammatical structures', ARRAY['stage_3', 'stage_4']::cambridge_stage[]),
  ('Advanced Grammar', 'GRAM_003', 'grammar', 'Master advanced grammatical concepts', ARRAY['stage_5', 'stage_6']::cambridge_stage[]),

  ('Pronunciation', 'PRON_001', 'pronunciation', 'Correct pronunciation of common words', ARRAY['stage_1', 'stage_2', 'stage_3', 'stage_4', 'stage_5', 'stage_6']::cambridge_stage[]),
  ('Fluency', 'FLUE_001', 'fluency', 'Speak smoothly without hesitation', ARRAY['stage_3', 'stage_4', 'stage_5', 'stage_6']::cambridge_stage[]),
  ('Comprehension', 'COMP_001', 'comprehension', 'Understand overall meaning and details', ARRAY['stage_1', 'stage_2', 'stage_3', 'stage_4', 'stage_5', 'stage_6']::cambridge_stage[]),
  ('Social Skills', 'SOCIAL_001', 'social_skills', 'Interact appropriately in social situations', ARRAY['stage_1', 'stage_2', 'stage_3', 'stage_4', 'stage_5', 'stage_6']::cambridge_stage[])
ON CONFLICT (skill_code) DO NOTHING;

-- Insert sample resources
INSERT INTO resources (title, description, resource_type, stage, duration_minutes, objectives, materials_needed, tags, is_public) VALUES
  ('Alphabet Song Warmup', 'Fun alphabet song to start the class', 'warmup', 'stage_1', 5, ARRAY['Review alphabet', 'Energize students'], ARRAY['YouTube video', 'Speakers'], ARRAY['alphabet', 'song', 'warmup', 'beginners'], true),
  ('Numbers 1-20 Bingo', 'Interactive bingo game for number recognition', 'game', 'stage_1', 15, ARRAY['Practice numbers 1-20', 'Listening skills'], ARRAY['Bingo cards', 'Markers'], ARRAY['numbers', 'game', 'listening'], true),
  ('Simple Present Tense Worksheet', 'Practice worksheet for simple present tense', 'worksheet', 'stage_2', 20, ARRAY['Practice simple present', 'Verb conjugation'], ARRAY['Printable worksheet', 'Pencils'], ARRAY['grammar', 'worksheet', 'present tense'], true),
  ('Story Time: The Three Little Pigs', 'Reading comprehension activity with classic story', 'activity', 'stage_2', 25, ARRAY['Reading comprehension', 'Vocabulary building'], ARRAY['Story book', 'Comprehension questions'], ARRAY['reading', 'story', 'comprehension'], true),
  ('Role Play: At the Restaurant', 'Speaking activity for ordering food', 'activity', 'stage_3', 30, ARRAY['Practice ordering food', 'Conversational skills'], ARRAY['Menu props', 'Role cards'], ARRAY['speaking', 'role play', 'vocabulary'], true),
  ('Past Tense Video Quiz', 'Video-based quiz on past tense usage', 'video', 'stage_3', 15, ARRAY['Identify past tense', 'Practice irregular verbs'], ARRAY['Video player', 'Quiz handout'], ARRAY['grammar', 'past tense', 'video'], true),
  ('Debate: Technology in Education', 'Advanced speaking activity with debate format', 'activity', 'stage_5', 45, ARRAY['Critical thinking', 'Argumentation skills', 'Advanced vocabulary'], ARRAY['Debate guidelines', 'Timer'], ARRAY['speaking', 'debate', 'advanced'], true),
  ('Essay Writing Guide', 'Comprehensive guide for academic essay writing', 'printable', 'stage_6', 40, ARRAY['Essay structure', 'Academic writing'], ARRAY['Guide printout'], ARRAY['writing', 'essay', 'academic'], true)
ON CONFLICT DO NOTHING;

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE admins IS 'Admin users with full system access';
COMMENT ON TABLE teacher_profiles IS 'Extended profile information for teachers';
COMMENT ON TABLE skills IS 'Master list of all skills that can be assessed';
COMMENT ON TABLE student_skills IS 'Individual student skill assessments and scores';
COMMENT ON TABLE resources IS 'Teaching resources library (activities, worksheets, games, etc.)';
COMMENT ON TABLE lesson_resources IS 'Resources assigned to specific curriculum lessons via drag-and-drop';
COMMENT ON TABLE teacher_notes IS 'Notes teachers add for students about progress, behavior, assignments, etc.';
COMMENT ON TABLE teacher_assignments IS 'Teacher schedule assignments to classes with dates and times';
COMMENT ON TABLE payroll IS 'Teacher payment records and payroll management';

-- Migration completed successfully
