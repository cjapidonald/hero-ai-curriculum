-- HeroSchool Database Schema
-- This file contains the complete database structure for the HeroSchool English Center

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- ENUMS
-- =============================================

-- English proficiency levels
CREATE TYPE english_level AS ENUM (
  'beginner',
  'some_english',
  'confident',
  'unsure'
);

-- Cambridge stages
CREATE TYPE cambridge_stage AS ENUM (
  'stage_1',
  'stage_2',
  'stage_3',
  'stage_4',
  'stage_5',
  'stage_6'
);

-- Cambridge exam types
CREATE TYPE cambridge_exam AS ENUM (
  'starters',
  'movers',
  'flyers'
);

-- Contact method preferences
CREATE TYPE contact_method AS ENUM (
  'zalo',
  'email',
  'phone'
);

-- Inquiry types
CREATE TYPE inquiry_type AS ENUM (
  'trial_class',
  'curriculum_info',
  'center_tour',
  'event_registration',
  'pricing',
  'other'
);

-- Student status
CREATE TYPE student_status AS ENUM (
  'inquiry',
  'trial',
  'active',
  'inactive',
  'graduated'
);

-- Class schedule days
CREATE TYPE class_day AS ENUM (
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
);

-- Event types
CREATE TYPE event_type AS ENUM (
  'workshop',
  'exam',
  'competition',
  'holiday_camp',
  'parent_meeting',
  'cultural_event'
);

-- =============================================
-- TABLES
-- =============================================

-- Parents/Guardians table
CREATE TABLE parents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20) NOT NULL,
  preferred_contact contact_method DEFAULT 'zalo',
  address TEXT,
  how_did_hear VARCHAR(100),
  agree_to_updates BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Students table
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  date_of_birth DATE,
  age INTEGER,
  current_level english_level,
  assigned_stage cambridge_stage,
  status student_status DEFAULT 'inquiry',
  enrollment_date DATE,
  profile_photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contact inquiries table
CREATE TABLE inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID REFERENCES parents(id) ON DELETE SET NULL,
  parent_name VARCHAR(255) NOT NULL,
  child_name VARCHAR(255) NOT NULL,
  child_age INTEGER NOT NULL,
  current_level english_level,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  preferred_contact contact_method DEFAULT 'zalo',
  how_did_hear VARCHAR(100),
  interested_in inquiry_type[],
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, contacted, converted, closed
  response_notes TEXT,
  responded_at TIMESTAMP WITH TIME ZONE,
  responded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Classes table
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_name VARCHAR(255) NOT NULL,
  stage cambridge_stage NOT NULL,
  teacher_name VARCHAR(255),
  max_students INTEGER DEFAULT 12,
  current_students INTEGER DEFAULT 0,
  schedule_days class_day[],
  start_time TIME,
  end_time TIME,
  classroom_location VARCHAR(100),
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student class enrollments
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  enrollment_date DATE DEFAULT CURRENT_DATE,
  completion_date DATE,
  is_active BOOLEAN DEFAULT true,
  attendance_rate DECIMAL(5,2), -- percentage
  progress_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, class_id)
);

-- Attendance tracking
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  class_date DATE NOT NULL,
  present BOOLEAN DEFAULT false,
  late BOOLEAN DEFAULT false,
  notes TEXT,
  recorded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(enrollment_id, class_date)
);

-- Cambridge exam results
CREATE TABLE exam_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  exam_type cambridge_exam NOT NULL,
  exam_date DATE NOT NULL,
  listening_shields INTEGER CHECK (listening_shields >= 1 AND listening_shields <= 5),
  reading_writing_shields INTEGER CHECK (reading_writing_shields >= 1 AND reading_writing_shields <= 5),
  speaking_shields INTEGER CHECK (speaking_shields >= 1 AND speaking_shields <= 5),
  total_shields INTEGER GENERATED ALWAYS AS (
    COALESCE(listening_shields, 0) +
    COALESCE(reading_writing_shields, 0) +
    COALESCE(speaking_shields, 0)
  ) STORED,
  certificate_number VARCHAR(100),
  certificate_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_type event_type NOT NULL,
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location VARCHAR(255),
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  age_min INTEGER,
  age_max INTEGER,
  price DECIMAL(10,2) DEFAULT 0,
  image_url TEXT,
  is_published BOOLEAN DEFAULT false,
  registration_deadline DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event registrations
CREATE TABLE event_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  parent_name VARCHAR(255) NOT NULL,
  child_name VARCHAR(255) NOT NULL,
  child_age INTEGER,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  payment_status VARCHAR(50) DEFAULT 'pending', -- pending, paid, refunded
  attended BOOLEAN,
  notes TEXT,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, student_id)
);

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50), -- cash, bank_transfer, card, etc.
  payment_date DATE DEFAULT CURRENT_DATE,
  payment_for VARCHAR(100), -- tuition, materials, exam_fee, event, etc.
  term VARCHAR(50), -- e.g., "Term 1 2025"
  receipt_number VARCHAR(100) UNIQUE,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Progress tracking (AI-powered)
CREATE TABLE student_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  assessment_date DATE DEFAULT CURRENT_DATE,
  skill_area VARCHAR(100) NOT NULL, -- listening, speaking, reading, writing, vocabulary, grammar
  level_score DECIMAL(5,2), -- 0-100 scale
  notes TEXT,
  assessed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trial class bookings
CREATE TABLE trial_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_name VARCHAR(255) NOT NULL,
  child_name VARCHAR(255) NOT NULL,
  child_age INTEGER NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  preferred_date DATE,
  preferred_time TIME,
  current_level english_level,
  assigned_class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  scheduled_date DATE,
  scheduled_time TIME,
  status VARCHAR(50) DEFAULT 'pending', -- pending, scheduled, completed, no_show, converted
  attended BOOLEAN,
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User accounts (for staff/admin)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL, -- admin, teacher, receptionist
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES for better query performance
-- =============================================

CREATE INDEX idx_students_parent_id ON students(parent_id);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX idx_enrollments_class_id ON enrollments(class_id);
CREATE INDEX idx_enrollments_active ON enrollments(is_active);
CREATE INDEX idx_attendance_enrollment_id ON attendance(enrollment_id);
CREATE INDEX idx_attendance_date ON attendance(class_date);
CREATE INDEX idx_exam_results_student_id ON exam_results(student_id);
CREATE INDEX idx_inquiries_status ON inquiries(status);
CREATE INDEX idx_inquiries_created_at ON inquiries(created_at);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_published ON events(is_published);
CREATE INDEX idx_trial_bookings_status ON trial_bookings(status);
CREATE INDEX idx_payments_student_id ON payments(student_id);
CREATE INDEX idx_payments_date ON payments(payment_date);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Public read access to events (for website display)
CREATE POLICY "Events are viewable by everyone"
  ON events FOR SELECT
  USING (is_published = true);

-- Public insert for inquiries (contact form)
CREATE POLICY "Anyone can submit inquiries"
  ON inquiries FOR INSERT
  WITH CHECK (true);

-- Public insert for trial bookings
CREATE POLICY "Anyone can book trial classes"
  ON trial_bookings FOR INSERT
  WITH CHECK (true);

-- Public insert for event registrations
CREATE POLICY "Anyone can register for events"
  ON event_registrations FOR INSERT
  WITH CHECK (true);

-- Authenticated users (staff) have full access
CREATE POLICY "Authenticated users have full access to parents"
  ON parents FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users have full access to students"
  ON students FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users have full access to classes"
  ON classes FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users have full access to enrollments"
  ON enrollments FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users have full access to attendance"
  ON attendance FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users have full access to exam results"
  ON exam_results FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users have full access to payments"
  ON payments FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users have full access to progress"
  ON student_progress FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage inquiries"
  ON inquiries FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage trial bookings"
  ON trial_bookings FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage events"
  ON events FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage event registrations"
  ON event_registrations FOR ALL
  USING (auth.role() = 'authenticated');

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_parents_updated_at BEFORE UPDATE ON parents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON enrollments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exam_results_updated_at BEFORE UPDATE ON exam_results
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trial_bookings_updated_at BEFORE UPDATE ON trial_bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update class participant count
CREATE OR REPLACE FUNCTION update_class_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.is_active = true THEN
    UPDATE classes
    SET current_students = current_students + 1
    WHERE id = NEW.class_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.is_active = true AND NEW.is_active = false THEN
    UPDATE classes
    SET current_students = current_students - 1
    WHERE id = NEW.class_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.is_active = false AND NEW.is_active = true THEN
    UPDATE classes
    SET current_students = current_students + 1
    WHERE id = NEW.class_id;
  ELSIF TG_OP = 'DELETE' AND OLD.is_active = true THEN
    UPDATE classes
    SET current_students = current_students - 1
    WHERE id = OLD.class_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_class_count AFTER INSERT OR UPDATE OR DELETE ON enrollments
  FOR EACH ROW EXECUTE FUNCTION update_class_participant_count();

-- Function to update event participant count
CREATE OR REPLACE FUNCTION update_event_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE events
    SET current_participants = current_participants + 1
    WHERE id = NEW.event_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE events
    SET current_participants = current_participants - 1
    WHERE id = OLD.event_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_event_count AFTER INSERT OR DELETE ON event_registrations
  FOR EACH ROW EXECUTE FUNCTION update_event_participant_count();

-- =============================================
-- VIEWS for common queries
-- =============================================

-- View for active students with their current class
CREATE VIEW active_students_with_classes AS
SELECT
  s.id,
  s.full_name AS student_name,
  s.age,
  s.current_level,
  s.assigned_stage,
  p.full_name AS parent_name,
  p.phone AS parent_phone,
  p.email AS parent_email,
  c.class_name,
  c.stage AS class_stage,
  c.teacher_name,
  e.attendance_rate,
  e.enrollment_date
FROM students s
JOIN parents p ON s.parent_id = p.id
LEFT JOIN enrollments e ON s.id = e.student_id AND e.is_active = true
LEFT JOIN classes c ON e.class_id = c.id
WHERE s.status = 'active';

-- View for upcoming events
CREATE VIEW upcoming_events AS
SELECT
  id,
  title,
  description,
  event_type,
  event_date,
  start_time,
  end_time,
  location,
  max_participants,
  current_participants,
  (max_participants - current_participants) AS spots_remaining,
  price,
  image_url,
  age_min,
  age_max
FROM events
WHERE is_published = true
  AND event_date >= CURRENT_DATE
ORDER BY event_date, start_time;

-- =============================================
-- SAMPLE DATA (Optional - for testing)
-- =============================================

-- Insert sample events
INSERT INTO events (title, description, event_type, event_date, start_time, end_time, location, max_participants, age_min, age_max, price, is_published) VALUES
  ('Summer English Camp 2025', 'Intensive English immersion program with fun activities', 'holiday_camp', '2025-07-15', '09:00', '16:00', 'HeroSchool Main Campus', 30, 7, 12, 2500000, true),
  ('Cambridge Starters Mock Exam', 'Practice exam for students preparing for Starters', 'exam', '2025-06-20', '14:00', '16:00', 'HeroSchool Main Campus', 20, 6, 8, 0, true),
  ('Parent-Teacher Meeting', 'Discuss student progress and upcoming term plans', 'parent_meeting', '2025-05-30', '18:00', '20:00', 'HeroSchool Main Campus', 100, 0, 99, 0, true);

COMMENT ON DATABASE postgres IS 'HeroSchool English Center - Complete database schema for managing students, classes, exams, events, and operations';
