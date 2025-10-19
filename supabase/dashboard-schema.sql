-- HeroSchool Teacher & Student Dashboard Schema
-- Additional tables for the learning management system

-- =============================================
-- DROP EXISTING TABLES (if re-running)
-- =============================================
DROP TABLE IF EXISTS skills_evaluation CASCADE;
DROP TABLE IF EXISTS assessment CASCADE;
DROP TABLE IF EXISTS curriculum CASCADE;
DROP TABLE IF EXISTS dashboard_students CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;

-- =============================================
-- TEACHERS TABLE
-- =============================================
CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  surname TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT, -- For demo purposes, will use simple auth
  subject TEXT,
  phone TEXT,
  bio TEXT,
  profile_image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- STUDENTS TABLE (Extended version for dashboard)
-- =============================================
CREATE TABLE dashboard_students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  surname TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT, -- For demo purposes
  class TEXT,
  gender TEXT,
  subject TEXT,
  level TEXT,
  birthday DATE,
  attendance_rate NUMERIC(5,2) DEFAULT 0,
  parent_name TEXT,
  parent_zalo_nr TEXT,
  location TEXT,
  placement_test_speaking TEXT,
  placement_test_listening TEXT,
  placement_test_reading TEXT,
  placement_test_writing TEXT,
  sessions INTEGER DEFAULT 0,
  sessions_left INTEGER DEFAULT 0,
  profile_image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- CURRICULUM TABLE
-- =============================================
CREATE TABLE curriculum (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
  teacher_name TEXT,
  subject TEXT,
  lesson_title TEXT NOT NULL,
  lesson_date DATE,
  lesson_skills TEXT,
  success_criteria TEXT,

  -- Warm up activities (wp = warm up)
  wp1_type TEXT, -- file, link, image, pdf
  wp1_url TEXT,
  wp1_name TEXT,
  wp2_type TEXT,
  wp2_url TEXT,
  wp2_name TEXT,
  wp3_type TEXT,
  wp3_url TEXT,
  wp3_name TEXT,
  wp4_type TEXT,
  wp4_url TEXT,
  wp4_name TEXT,

  -- Main activities
  ma1_type TEXT,
  ma1_url TEXT,
  ma1_name TEXT,
  ma2_type TEXT,
  ma2_url TEXT,
  ma2_name TEXT,
  ma3_type TEXT,
  ma3_url TEXT,
  ma3_name TEXT,
  ma4_type TEXT,
  ma4_url TEXT,
  ma4_name TEXT,
  ma5_type TEXT,
  ma5_url TEXT,
  ma5_name TEXT,

  -- Assessment activities
  a1_type TEXT,
  a1_url TEXT,
  a1_name TEXT,
  a2_type TEXT,
  a2_url TEXT,
  a2_name TEXT,
  a3_type TEXT,
  a3_url TEXT,
  a3_name TEXT,
  a4_type TEXT,
  a4_url TEXT,
  a4_name TEXT,

  -- Homework
  hw1_type TEXT,
  hw1_url TEXT,
  hw1_name TEXT,
  hw2_type TEXT,
  hw2_url TEXT,
  hw2_name TEXT,
  hw3_type TEXT,
  hw3_url TEXT,
  hw3_name TEXT,
  hw4_type TEXT,
  hw4_url TEXT,
  hw4_name TEXT,
  hw5_type TEXT,
  hw5_url TEXT,
  hw5_name TEXT,
  hw6_type TEXT,
  hw6_url TEXT,
  hw6_name TEXT,

  -- Print worksheets
  p1_type TEXT,
  p1_url TEXT,
  p1_name TEXT,
  p2_type TEXT,
  p2_url TEXT,
  p2_name TEXT,
  p3_type TEXT,
  p3_url TEXT,
  p3_name TEXT,
  p4_type TEXT,
  p4_url TEXT,
  p4_name TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ASSESSMENT TABLE
-- =============================================
CREATE TABLE assessment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
  student_id UUID REFERENCES dashboard_students(id) ON DELETE CASCADE,
  class TEXT,
  student_name TEXT NOT NULL,
  test_name TEXT NOT NULL,
  rubrics TEXT,
  r1 TEXT,
  r1_score NUMERIC(5,2),
  r2 TEXT,
  r2_score NUMERIC(5,2),
  r3 TEXT,
  r3_score NUMERIC(5,2),
  r4 TEXT,
  r4_score NUMERIC(5,2),
  r5 TEXT,
  r5_score NUMERIC(5,2),
  total_score NUMERIC(5,2),
  published BOOLEAN DEFAULT false,
  assessment_date DATE DEFAULT CURRENT_DATE,
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- SKILLS EVALUATION TABLE
-- =============================================
CREATE TABLE skills_evaluation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
  student_id UUID REFERENCES dashboard_students(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  class TEXT,
  skill_name TEXT NOT NULL,
  skill_category TEXT, -- Writing, Reading, Listening, Speaking

  -- Evaluations
  e1 TEXT,
  e1_score NUMERIC(5,2),
  e2 TEXT,
  e2_score NUMERIC(5,2),
  e3 TEXT,
  e3_score NUMERIC(5,2),
  e4 TEXT,
  e4_score NUMERIC(5,2),
  e5 TEXT,
  e5_score NUMERIC(5,2),
  e6 TEXT,
  e6_score NUMERIC(5,2),

  average_score NUMERIC(5,2),
  evaluation_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TEACHER PAYROLL & ATTENDANCE
-- =============================================
CREATE TABLE teacher_payroll (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  class_name TEXT NOT NULL,
  lesson_title TEXT,
  attendance_status TEXT DEFAULT 'present', -- present, absent, substitute, sick_leave
  hours_taught NUMERIC(5,2) DEFAULT 0,
  hourly_rate NUMERIC(10,2) DEFAULT 0,
  bonus_amount NUMERIC(10,2) DEFAULT 0,
  deduction_amount NUMERIC(10,2) DEFAULT 0,
  payout_status TEXT DEFAULT 'pending', -- pending, approved, paid
  payout_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- HOMEWORK COMPLETION TRACKING
-- =============================================
CREATE TABLE homework_completion (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES dashboard_students(id) ON DELETE CASCADE,
  curriculum_id UUID REFERENCES curriculum(id) ON DELETE CASCADE,
  homework_item TEXT, -- hw1, hw2, hw3, etc.
  completed BOOLEAN DEFAULT false,
  completed_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, curriculum_id, homework_item)
);

-- =============================================
-- BLOG POSTS FOR TEACHERS
-- =============================================
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author TEXT,
  author_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
  category TEXT,
  image_url TEXT,
  published BOOLEAN DEFAULT false,
  published_date DATE,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_teachers_email ON teachers(email);
CREATE INDEX idx_dashboard_students_email ON dashboard_students(email);
CREATE INDEX idx_dashboard_students_class ON dashboard_students(class);
CREATE INDEX idx_curriculum_teacher ON curriculum(teacher_id);
CREATE INDEX idx_curriculum_date ON curriculum(lesson_date);
CREATE INDEX idx_assessment_student ON assessment(student_id);
CREATE INDEX idx_assessment_published ON assessment(published);
CREATE INDEX idx_skills_student ON skills_evaluation(student_id);
CREATE INDEX idx_skills_category ON skills_evaluation(skill_category);
CREATE INDEX idx_teacher_payroll_teacher ON teacher_payroll(teacher_id);
CREATE INDEX idx_teacher_payroll_date ON teacher_payroll(session_date);
CREATE INDEX idx_teacher_payroll_status ON teacher_payroll(payout_status);
CREATE INDEX idx_homework_student ON homework_completion(student_id);
CREATE INDEX idx_blog_published ON blog_posts(published);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills_evaluation ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework_completion ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Allow public read access to published blog posts
CREATE POLICY "Published blogs are viewable by everyone"
  ON blog_posts FOR SELECT
  USING (published = true);

-- For now, allow all operations (we'll add auth later)
CREATE POLICY "Allow all for teachers"
  ON teachers FOR ALL
  USING (true);

CREATE POLICY "Allow all for students"
  ON dashboard_students FOR ALL
  USING (true);

CREATE POLICY "Allow all for curriculum"
  ON curriculum FOR ALL
  USING (true);

CREATE POLICY "Allow all for assessment"
  ON assessment FOR ALL
  USING (true);

CREATE POLICY "Allow all for skills"
  ON skills_evaluation FOR ALL
  USING (true);

CREATE POLICY "Teachers can view payroll"
  ON teacher_payroll FOR SELECT
  USING (true);

CREATE POLICY "Allow all for homework"
  ON homework_completion FOR ALL
  USING (true);

CREATE POLICY "Allow all for blog posts"
  ON blog_posts FOR ALL
  USING (true);

-- =============================================
-- TRIGGERS
-- =============================================
CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON teachers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON dashboard_students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_curriculum_updated_at BEFORE UPDATE ON curriculum
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessment_updated_at BEFORE UPDATE ON assessment
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_skills_updated_at BEFORE UPDATE ON skills_evaluation
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teacher_payroll_updated_at BEFORE UPDATE ON teacher_payroll
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blog_updated_at BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- SAMPLE DATA
-- =============================================

-- Sample Teachers
INSERT INTO teachers (name, surname, email, password, subject) VALUES
  ('Donald', 'Teacher', 'donald@heroschool.com', 'teacher123', 'English'),
  ('Sarah', 'Johnson', 'sarah@heroschool.com', 'teacher123', 'English'),
  ('Michael', 'Chen', 'michael@heroschool.com', 'teacher123', 'English');

-- Sample Students
INSERT INTO dashboard_students (name, surname, email, password, class, gender, subject, level, birthday, attendance_rate, parent_name, parent_zalo_nr, sessions, sessions_left) VALUES
  ('Emma', 'Nguyen', 'emma@student.com', 'student123', 'Starters A', 'Female', 'English', 'Pre-A1', '2016-05-15', 95.5, 'Mrs. Nguyen', '0987654321', 40, 20),
  ('Liam', 'Tran', 'liam@student.com', 'student123', 'Movers B', 'Male', 'English', 'A1', '2015-08-22', 88.3, 'Mr. Tran', '0987654322', 50, 15),
  ('Olivia', 'Le', 'olivia@student.com', 'student123', 'Starters A', 'Female', 'English', 'Pre-A1', '2016-03-10', 92.0, 'Mrs. Le', '0987654323', 35, 25);

-- Sample Curriculum
INSERT INTO curriculum (teacher_name, subject, lesson_title, lesson_date, lesson_skills, success_criteria, hw1_type, hw1_url, hw1_name) VALUES
  ('Donald Teacher', 'English', 'Numbers 1-10', '2025-06-01', 'Speaking, Counting', 'Students can count from 1 to 10', 'pdf', 'https://example.com/hw1.pdf', 'Numbers Worksheet');

-- Sample Blog Post
INSERT INTO blog_posts (title, content, author, category, published, published_date) VALUES
  ('Teaching Tips: Engaging Young Learners', 'Here are some effective strategies for keeping young English learners engaged in class...', 'Donald Teacher', 'Teaching Tips', true, CURRENT_DATE);

-- Sample Assessment
INSERT INTO assessment (student_name, class, test_name, rubrics, r1, r1_score, r2, r2_score, published) VALUES
  ('Emma Nguyen', 'Starters A', 'Unit 1 Test', 'Speaking and Listening', 'Pronunciation', 4.5, 'Fluency', 4.0, true);

-- Sample Skills
INSERT INTO skills_evaluation (student_name, class, skill_name, skill_category, e1, e1_score, e2, e2_score) VALUES
  ('Emma Nguyen', 'Starters A', 'Say numbers 1-10', 'Speaking', 'Can count 1-5', 4.0, 'Can count 6-10', 3.5);

COMMENT ON TABLE teachers IS 'Teacher accounts and profiles';
COMMENT ON TABLE dashboard_students IS 'Student accounts with detailed tracking information';
COMMENT ON TABLE curriculum IS 'Lesson plans with all activities and materials';
COMMENT ON TABLE assessment IS 'Student assessments with rubric-based scoring';
COMMENT ON TABLE skills_evaluation IS 'Detailed skill tracking across four strands';
COMMENT ON TABLE homework_completion IS 'Track which homework items students have completed';
COMMENT ON TABLE blog_posts IS 'Educational blog posts for teachers';
