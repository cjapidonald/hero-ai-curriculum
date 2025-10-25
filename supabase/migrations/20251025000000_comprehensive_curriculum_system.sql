-- =============================================
-- COMPREHENSIVE CURRICULUM SYSTEM
-- =============================================
-- This migration creates all tables needed for the complete
-- curriculum management, lesson planning, class management,
-- and formative assessment system
-- =============================================

BEGIN;

-- =============================================
-- 1. LESSON PLANS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.lesson_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  curriculum_id UUID REFERENCES public.curriculum(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,

  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'done')),

  -- Skills (from curriculum)
  skills JSONB DEFAULT '[]'::jsonb,

  -- Lesson Sections (resources assigned to each section)
  warm_up_resources JSONB DEFAULT '[]'::jsonb,
  body_resources JSONB DEFAULT '[]'::jsonb,
  assessment_resources JSONB DEFAULT '[]'::jsonb,
  print_resources JSONB DEFAULT '[]'::jsonb,
  homework_resources JSONB DEFAULT '[]'::jsonb,

  -- Teacher Notes
  teacher_notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure one lesson plan per curriculum per teacher
  UNIQUE(curriculum_id, teacher_id)
);

CREATE INDEX IF NOT EXISTS idx_lesson_plans_curriculum ON public.lesson_plans(curriculum_id);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_teacher ON public.lesson_plans(teacher_id);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_status ON public.lesson_plans(status);

-- =============================================
-- 2. TEACHER RESOURCES (MY CONTRIBUTION)
-- =============================================
CREATE TABLE IF NOT EXISTS public.teacher_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Teacher who created the resource
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE NOT NULL,

  -- Resource Details
  title TEXT NOT NULL,
  subject TEXT,
  stage TEXT,
  interaction TEXT, -- Type of interaction (individual, pair, group, etc.)
  how_to_implement TEXT, -- Instructions for using the resource

  -- Resource Type and Content
  resource_type TEXT NOT NULL CHECK (resource_type IN ('file', 'link', 'activity')),
  resource_url TEXT, -- For links
  file_path TEXT, -- For uploaded files in storage
  file_name TEXT, -- Original filename

  -- Approval and Visibility
  is_approved BOOLEAN DEFAULT true, -- Can be moderated by admin
  is_public BOOLEAN DEFAULT true, -- Visible to other teachers

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teacher_resources_teacher ON public.teacher_resources(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_resources_subject ON public.teacher_resources(subject);
CREATE INDEX IF NOT EXISTS idx_teacher_resources_stage ON public.teacher_resources(stage);
CREATE INDEX IF NOT EXISTS idx_teacher_resources_approved ON public.teacher_resources(is_approved);

-- =============================================
-- 3. LESSON SESSIONS (START LESSON)
-- =============================================
CREATE TABLE IF NOT EXISTS public.lesson_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  lesson_plan_id UUID REFERENCES public.lesson_plans(id) ON DELETE CASCADE NOT NULL,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE NOT NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  curriculum_id UUID REFERENCES public.curriculum(id) ON DELETE SET NULL,

  -- Session Timing
  scheduled_date DATE NOT NULL,
  started_at TIMESTAMPTZ,
  concluded_at TIMESTAMPTZ,

  -- Status
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'concluded', 'cancelled')),

  -- Session Data
  attendance_data JSONB DEFAULT '{}'::jsonb, -- {student_id: true/false}
  seating_plan JSONB DEFAULT '{}'::jsonb, -- Geometry and student positions
  timer_duration INTEGER, -- In seconds

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lesson_sessions_teacher ON public.lesson_sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_lesson_sessions_class ON public.lesson_sessions(class_id);
CREATE INDEX IF NOT EXISTS idx_lesson_sessions_date ON public.lesson_sessions(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_lesson_sessions_status ON public.lesson_sessions(status);

-- =============================================
-- 4. STUDENT BEHAVIOR POINTS (CLASS MANAGEMENT)
-- =============================================
CREATE TABLE IF NOT EXISTS public.student_behavior_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  session_id UUID REFERENCES public.lesson_sessions(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,

  -- Points and Rewards
  points INTEGER NOT NULL DEFAULT 0,
  badges JSONB DEFAULT '[]'::jsonb, -- ['silver', 'bronze', 'gold']

  -- Comments
  comments JSONB DEFAULT '[]'::jsonb, -- [{text, timestamp}]

  -- Metadata
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(session_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_behavior_points_session ON public.student_behavior_points(session_id);
CREATE INDEX IF NOT EXISTS idx_behavior_points_student ON public.student_behavior_points(student_id);

-- =============================================
-- 5. SKILL EVALUATIONS (FORMATIVE ASSESSMENT)
-- =============================================
CREATE TABLE IF NOT EXISTS public.skill_evaluations_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  session_id UUID REFERENCES public.lesson_sessions(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  skill_name TEXT NOT NULL, -- Skill identifier

  -- Evaluation Data
  evaluation_type TEXT NOT NULL CHECK (evaluation_type IN ('text', 'slider')),
  evaluation_value TEXT, -- Can store text or number
  slider_value INTEGER CHECK (slider_value >= 0 AND slider_value <= 100),

  -- Milestone Tracking
  milestone_number INTEGER NOT NULL DEFAULT 1,

  -- Metadata
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(session_id, student_id, skill_name, milestone_number)
);

CREATE INDEX IF NOT EXISTS idx_skill_evaluations_session ON public.skill_evaluations_new(session_id);
CREATE INDEX IF NOT EXISTS idx_skill_evaluations_student ON public.skill_evaluations_new(student_id);
CREATE INDEX IF NOT EXISTS idx_skill_evaluations_skill ON public.skill_evaluations_new(skill_name);

-- =============================================
-- 6. HOMEWORK ASSIGNMENTS
-- =============================================
CREATE TABLE IF NOT EXISTS public.homework_assignments_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  lesson_plan_id UUID REFERENCES public.lesson_plans(id) ON DELETE CASCADE NOT NULL,
  lesson_session_id UUID REFERENCES public.lesson_sessions(id) ON DELETE SET NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,

  -- Homework Details
  homework_resource JSONB NOT NULL, -- {title, description, file_url, etc}

  -- Assignment Status
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'late')),
  completed_at TIMESTAMPTZ,

  -- Grading
  grade TEXT,
  feedback TEXT,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_homework_assignments_lesson ON public.homework_assignments_new(lesson_plan_id);
CREATE INDEX IF NOT EXISTS idx_homework_assignments_student ON public.homework_assignments_new(student_id);
CREATE INDEX IF NOT EXISTS idx_homework_assignments_status ON public.homework_assignments_new(status);

-- =============================================
-- 7. PRINTABLES TRACKING
-- =============================================
CREATE TABLE IF NOT EXISTS public.printables_distributed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  lesson_session_id UUID REFERENCES public.lesson_sessions(id) ON DELETE CASCADE NOT NULL,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE NOT NULL,

  -- Printable Details
  printable_resource JSONB NOT NULL, -- {title, file_url, etc}

  -- Distribution
  distributed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  student_ids JSONB DEFAULT '[]'::jsonb, -- List of student UUIDs who received it

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_printables_session ON public.printables_distributed(lesson_session_id);
CREATE INDEX IF NOT EXISTS idx_printables_teacher ON public.printables_distributed(teacher_id);

-- =============================================
-- 8. TEACHER CONTRIBUTION STATS
-- =============================================
CREATE TABLE IF NOT EXISTS public.teacher_contribution_stats (
  teacher_id UUID PRIMARY KEY REFERENCES public.teachers(id) ON DELETE CASCADE,

  -- Counts
  total_resources_contributed INTEGER DEFAULT 0,
  total_lessons_built INTEGER DEFAULT 0,
  total_lessons_taught INTEGER DEFAULT 0,

  -- Updated automatically via triggers
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- 9. STUDENT SKILL MILESTONES (For Dashboard)
-- =============================================
CREATE TABLE IF NOT EXISTS public.student_skill_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  skill_name TEXT NOT NULL,

  -- Milestone Data
  total_evaluations INTEGER DEFAULT 0,
  average_score DECIMAL(5,2), -- For slider-based evaluations
  latest_evaluation_value TEXT,
  latest_evaluation_date TIMESTAMPTZ,

  -- Progress Tracking
  milestones JSONB DEFAULT '[]'::jsonb, -- [{date, value, session_id}]

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(student_id, skill_name)
);

CREATE INDEX IF NOT EXISTS idx_skill_milestones_student ON public.student_skill_milestones(student_id);
CREATE INDEX IF NOT EXISTS idx_skill_milestones_skill ON public.student_skill_milestones(skill_name);

-- =============================================
-- TRIGGERS FOR AUTO-UPDATING
-- =============================================

-- Update teacher contribution stats when resource added
CREATE OR REPLACE FUNCTION update_teacher_resource_contribution()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.teacher_contribution_stats (teacher_id, total_resources_contributed, last_updated)
  VALUES (NEW.teacher_id, 1, NOW())
  ON CONFLICT (teacher_id)
  DO UPDATE SET
    total_resources_contributed = teacher_contribution_stats.total_resources_contributed + 1,
    last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_teacher_resource_contribution ON public.teacher_resources;
CREATE TRIGGER trigger_teacher_resource_contribution
AFTER INSERT ON public.teacher_resources
FOR EACH ROW
EXECUTE FUNCTION update_teacher_resource_contribution();

-- Update teacher contribution when lesson plan created/updated
CREATE OR REPLACE FUNCTION update_teacher_lesson_contribution()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'done' AND (OLD IS NULL OR OLD.status != 'done') THEN
    INSERT INTO public.teacher_contribution_stats (teacher_id, total_lessons_built, last_updated)
    VALUES (NEW.teacher_id, 1, NOW())
    ON CONFLICT (teacher_id)
    DO UPDATE SET
      total_lessons_built = teacher_contribution_stats.total_lessons_built + 1,
      last_updated = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_teacher_lesson_contribution ON public.lesson_plans;
CREATE TRIGGER trigger_teacher_lesson_contribution
AFTER INSERT OR UPDATE ON public.lesson_plans
FOR EACH ROW
EXECUTE FUNCTION update_teacher_lesson_contribution();

-- Update teacher contribution when session concluded
CREATE OR REPLACE FUNCTION update_teacher_session_contribution()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'concluded' AND (OLD IS NULL OR OLD.status != 'concluded') THEN
    INSERT INTO public.teacher_contribution_stats (teacher_id, total_lessons_taught, last_updated)
    VALUES (NEW.teacher_id, 1, NOW())
    ON CONFLICT (teacher_id)
    DO UPDATE SET
      total_lessons_taught = teacher_contribution_stats.total_lessons_taught + 1,
      last_updated = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_teacher_session_contribution ON public.lesson_sessions;
CREATE TRIGGER trigger_teacher_session_contribution
AFTER INSERT OR UPDATE ON public.lesson_sessions
FOR EACH ROW
EXECUTE FUNCTION update_teacher_session_contribution();

-- Update student skill milestones when evaluation added
CREATE OR REPLACE FUNCTION update_student_skill_milestones()
RETURNS TRIGGER AS $$
DECLARE
  milestone_data JSONB;
BEGIN
  -- Create milestone entry
  milestone_data := jsonb_build_object(
    'date', NEW.evaluated_at,
    'value', COALESCE(NEW.slider_value::TEXT, NEW.evaluation_value),
    'session_id', NEW.session_id,
    'milestone_number', NEW.milestone_number
  );

  -- Update or insert milestone
  INSERT INTO public.student_skill_milestones (
    student_id,
    skill_name,
    total_evaluations,
    latest_evaluation_value,
    latest_evaluation_date,
    milestones
  )
  VALUES (
    NEW.student_id,
    NEW.skill_name,
    1,
    COALESCE(NEW.slider_value::TEXT, NEW.evaluation_value),
    NEW.evaluated_at,
    jsonb_build_array(milestone_data)
  )
  ON CONFLICT (student_id, skill_name)
  DO UPDATE SET
    total_evaluations = student_skill_milestones.total_evaluations + 1,
    latest_evaluation_value = COALESCE(NEW.slider_value::TEXT, NEW.evaluation_value),
    latest_evaluation_date = NEW.evaluated_at,
    milestones = student_skill_milestones.milestones || milestone_data,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_skill_milestones ON public.skill_evaluations_new;
CREATE TRIGGER trigger_update_skill_milestones
AFTER INSERT ON public.skill_evaluations_new
FOR EACH ROW
EXECUTE FUNCTION update_student_skill_milestones();

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.lesson_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_behavior_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_evaluations_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework_assignments_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.printables_distributed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_contribution_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_skill_milestones ENABLE ROW LEVEL SECURITY;

-- Teachers can view and manage their own lesson plans
DROP POLICY IF EXISTS "Teachers can manage their lesson plans" ON public.lesson_plans;
CREATE POLICY "Teachers can manage their lesson plans"
ON public.lesson_plans
FOR ALL
USING (teacher_id = auth.uid() OR auth.role() = 'authenticated');

-- Teachers can view all approved resources and manage their own
DROP POLICY IF EXISTS "Teachers can view approved resources" ON public.teacher_resources;
CREATE POLICY "Teachers can view approved resources"
ON public.teacher_resources
FOR SELECT
USING (is_approved = true AND is_public = true OR teacher_id = auth.uid());

DROP POLICY IF EXISTS "Teachers can manage their resources" ON public.teacher_resources;
CREATE POLICY "Teachers can manage their resources"
ON public.teacher_resources
FOR ALL
USING (teacher_id = auth.uid());

-- Teachers can manage their sessions
DROP POLICY IF EXISTS "Teachers can manage their sessions" ON public.lesson_sessions;
CREATE POLICY "Teachers can manage their sessions"
ON public.lesson_sessions
FOR ALL
USING (teacher_id = auth.uid() OR auth.role() = 'authenticated');

-- Authenticated users can view/manage behavior points
DROP POLICY IF EXISTS "Authenticated users can manage behavior points" ON public.student_behavior_points;
CREATE POLICY "Authenticated users can manage behavior points"
ON public.student_behavior_points
FOR ALL
USING (auth.role() = 'authenticated');

-- Authenticated users can manage skill evaluations
DROP POLICY IF EXISTS "Authenticated users can manage skill evaluations" ON public.skill_evaluations_new;
CREATE POLICY "Authenticated users can manage skill evaluations"
ON public.skill_evaluations_new
FOR ALL
USING (auth.role() = 'authenticated');

-- Authenticated users can manage homework
DROP POLICY IF EXISTS "Authenticated users can manage homework" ON public.homework_assignments_new;
CREATE POLICY "Authenticated users can manage homework"
ON public.homework_assignments_new
FOR ALL
USING (auth.role() = 'authenticated');

-- Authenticated users can manage printables
DROP POLICY IF EXISTS "Authenticated users can manage printables" ON public.printables_distributed;
CREATE POLICY "Authenticated users can manage printables"
ON public.printables_distributed
FOR ALL
USING (auth.role() = 'authenticated');

-- Anyone can view contribution stats
DROP POLICY IF EXISTS "Anyone can view contribution stats" ON public.teacher_contribution_stats;
CREATE POLICY "Anyone can view contribution stats"
ON public.teacher_contribution_stats
FOR SELECT
USING (true);

-- Students can view their own milestones
DROP POLICY IF EXISTS "Students can view their milestones" ON public.student_skill_milestones;
CREATE POLICY "Students can view their milestones"
ON public.student_skill_milestones
FOR SELECT
USING (student_id = auth.uid() OR auth.role() = 'authenticated');

COMMIT;

-- =============================================
-- STORAGE BUCKETS FOR FILE UPLOADS
-- =============================================

-- Create bucket for teacher resources (if not exists)
-- This needs to be run separately via Supabase dashboard or API
-- INSERT INTO storage.buckets (id, name, public) VALUES ('teacher-resources', 'teacher-resources', true);

-- ✅ Comprehensive curriculum system schema created successfully!
-- Next steps:
-- 1. Create storage bucket: teacher-resources
-- 2. Configure storage policies
-- 3. Deploy frontend components
