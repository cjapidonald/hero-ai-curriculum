BEGIN;

-- Clean up dependent functions prior to schema changes
DROP FUNCTION IF EXISTS get_student_skill_progress(UUID, UUID);
DROP FUNCTION IF EXISTS get_class_skill_overview(UUID, TEXT);

-- Preserve legacy data for reference
ALTER TABLE IF EXISTS public.curriculum RENAME TO curriculum_legacy;
ALTER TABLE IF EXISTS public.assessment RENAME TO assessments_legacy;
ALTER TABLE IF EXISTS public.skills_evaluation RENAME TO skills_evaluation_legacy;
ALTER TABLE IF EXISTS public.skill_evaluations RENAME TO skill_evaluations_legacy;
ALTER TABLE IF EXISTS public.skills RENAME TO skills_legacy;

-- Core lesson catalog
CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  lesson_number INTEGER,
  lesson_title TEXT NOT NULL,
  stage TEXT,
  lesson_date DATE,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'draft',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lessons_teacher ON public.lessons(teacher_id);
CREATE INDEX idx_lessons_class ON public.lessons(class_id);
CREATE INDEX idx_lessons_stage ON public.lessons(stage);

INSERT INTO public.lessons (
  id,
  subject,
  lesson_number,
  lesson_title,
  stage,
  lesson_date,
  class_id,
  teacher_id,
  status,
  description,
  created_at,
  updated_at
)
SELECT
  id,
  COALESCE(subject, 'General'),
  lesson_number,
  lesson_title,
  COALESCE(stage, curriculum_stage),
  CASE
    WHEN lesson_date::text IS NULL THEN NULL
    WHEN lesson_date::text ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN lesson_date::date
    ELSE NULL
  END,
  class_id,
  teacher_id,
  COALESCE(status, 'draft'),
  description,
  COALESCE(created_at, NOW()),
  COALESCE(updated_at, NOW())
FROM public.curriculum_legacy;

-- Update dependent tables from curriculum_id to lesson_id
DROP INDEX IF EXISTS public.idx_class_sessions_curriculum;
ALTER TABLE public.class_sessions DROP CONSTRAINT IF EXISTS class_sessions_curriculum_id_fkey;
ALTER TABLE public.class_sessions RENAME COLUMN curriculum_id TO lesson_id;
ALTER TABLE public.class_sessions
  ADD CONSTRAINT class_sessions_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_class_sessions_lesson ON public.class_sessions(lesson_id);
ALTER TABLE public.class_sessions
  ADD COLUMN curriculum_id UUID GENERATED ALWAYS AS (lesson_id) STORED;

DROP INDEX IF EXISTS public.idx_lesson_resources_curriculum;
DROP INDEX IF EXISTS public.idx_lesson_resources_position;
ALTER TABLE public.lesson_resources DROP CONSTRAINT IF EXISTS lesson_resources_curriculum_id_fkey;
ALTER TABLE public.lesson_resources RENAME COLUMN curriculum_id TO lesson_id;
CREATE INDEX IF NOT EXISTS idx_lesson_resources_lesson ON public.lesson_resources(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_resources_lesson_position ON public.lesson_resources(lesson_id, position);
ALTER TABLE public.lesson_resources
  ADD CONSTRAINT lesson_resources_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;
ALTER TABLE public.lesson_resources
  ADD COLUMN curriculum_id UUID GENERATED ALWAYS AS (lesson_id) STORED;

ALTER TABLE public.homework_completion DROP CONSTRAINT IF EXISTS homework_completion_curriculum_id_fkey;
ALTER TABLE public.homework_completion RENAME COLUMN curriculum_id TO lesson_id;
ALTER TABLE public.homework_completion
  ADD CONSTRAINT homework_completion_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;
ALTER TABLE public.homework_completion
  ADD COLUMN curriculum_id UUID GENERATED ALWAYS AS (lesson_id) STORED;

ALTER TABLE public.teacher_assignments DROP CONSTRAINT IF EXISTS teacher_assignments_curriculum_id_fkey;
ALTER TABLE public.teacher_assignments RENAME COLUMN curriculum_id TO lesson_id;
ALTER TABLE public.teacher_assignments
  ADD CONSTRAINT teacher_assignments_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE SET NULL;
ALTER TABLE public.teacher_assignments
  ADD COLUMN curriculum_id UUID GENERATED ALWAYS AS (lesson_id) STORED;

ALTER TABLE public.teacher_notes DROP CONSTRAINT IF EXISTS teacher_notes_related_curriculum_id_fkey;
ALTER TABLE public.teacher_notes RENAME COLUMN related_curriculum_id TO related_lesson_id;
ALTER TABLE public.teacher_notes
  ADD CONSTRAINT teacher_notes_related_lesson_id_fkey FOREIGN KEY (related_lesson_id) REFERENCES public.lessons(id) ON DELETE SET NULL;
ALTER TABLE public.teacher_notes
  ADD COLUMN related_curriculum_id UUID GENERATED ALWAYS AS (related_lesson_id) STORED;

-- Lesson components capture the structure of each plan
CREATE TABLE public.lesson_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  component_type TEXT NOT NULL CHECK (component_type IN ('warm_up','body','assessment','homework','printables','extension')),
  title TEXT,
  notes TEXT,
  auto_metadata JSONB,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lesson_components_lesson ON public.lesson_components(lesson_id);
CREATE INDEX idx_lesson_components_type ON public.lesson_components(component_type);

-- Skill libraries scoped to each lesson
CREATE TABLE public.lesson_skill_libraries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID UNIQUE NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  created_by UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.lesson_skill_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id UUID NOT NULL REFERENCES public.lesson_skill_libraries(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  skill_code TEXT,
  category TEXT,
  description TEXT,
  target_stage TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lesson_skill_items_library ON public.lesson_skill_items(library_id);
CREATE INDEX idx_lesson_skill_items_category ON public.lesson_skill_items(category);

CREATE OR REPLACE VIEW public.lesson_overview AS
SELECT
  l.id,
  l.subject,
  l.lesson_number,
  l.lesson_title,
  l.stage,
  l.lesson_date,
  l.class_id,
  l.teacher_id,
  l.status,
  l.description,
  l.created_at,
  l.updated_at,
  c.class_name,
  c.stage AS class_stage,
  c.level AS class_level,
  c.teacher_name
FROM public.lessons l
LEFT JOIN public.classes c ON c.id = l.class_id;

CREATE OR REPLACE VIEW public.curriculum AS
SELECT
  COALESCE(l.id, legacy.id) AS id,
  legacy.a1_name,
  legacy.a1_type,
  legacy.a1_url,
  legacy.a2_name,
  legacy.a2_type,
  legacy.a2_url,
  legacy.a3_name,
  legacy.a3_type,
  legacy.a3_url,
  legacy.a4_name,
  legacy.a4_type,
  legacy.a4_url,
  COALESCE(l.created_at, legacy.created_at) AS created_at,
  legacy.hw1_name,
  legacy.hw1_type,
  legacy.hw1_url,
  legacy.hw2_name,
  legacy.hw2_type,
  legacy.hw2_url,
  legacy.hw3_name,
  legacy.hw3_type,
  legacy.hw3_url,
  legacy.hw4_name,
  legacy.hw4_type,
  legacy.hw4_url,
  legacy.hw5_name,
  legacy.hw5_type,
  legacy.hw5_url,
  legacy.hw6_name,
  legacy.hw6_type,
  legacy.hw6_url,
  COALESCE(l.class_id, legacy.class_id) AS class_id,
  legacy.class,
  legacy.curriculum_stage,
  COALESCE(l.description, legacy.description) AS description,
  COALESCE(l.lesson_date::text, legacy.lesson_date) AS lesson_date,
  COALESCE(l.lesson_number, legacy.lesson_number) AS lesson_number,
  legacy.lesson_skills,
  COALESCE(l.lesson_title, legacy.lesson_title) AS lesson_title,
  legacy.objectives,
  legacy.ma1_name,
  legacy.ma1_type,
  legacy.ma1_url,
  legacy.ma2_name,
  legacy.ma2_type,
  legacy.ma2_url,
  legacy.ma3_name,
  legacy.ma3_type,
  legacy.ma3_url,
  legacy.ma4_name,
  legacy.ma4_type,
  legacy.ma4_url,
  legacy.ma5_name,
  legacy.ma5_type,
  legacy.ma5_url,
  legacy.p1_name,
  legacy.p1_type,
  legacy.p1_url,
  legacy.p2_name,
  legacy.p2_type,
  legacy.p2_url,
  legacy.p3_name,
  legacy.p3_type,
  legacy.p3_url,
  legacy.p4_name,
  legacy.p4_type,
  legacy.p4_url,
  legacy.school,
  COALESCE(l.stage, legacy.stage) AS stage,
  COALESCE(l.status, legacy.status) AS status,
  COALESCE(l.subject, legacy.subject) AS subject,
  legacy.success_criteria,
  COALESCE(l.teacher_id, legacy.teacher_id) AS teacher_id,
  legacy.teacher_name,
  COALESCE(l.updated_at, legacy.updated_at) AS updated_at
FROM public.curriculum_legacy legacy
FULL OUTER JOIN public.lessons l ON l.id = legacy.id;

WITH distinct_lesson_skills AS (
  SELECT DISTINCT s.curriculum_id
  FROM public.skills_legacy s
  WHERE s.curriculum_id IS NOT NULL
), inserted_libraries AS (
  INSERT INTO public.lesson_skill_libraries (lesson_id, title, description, created_by)
  SELECT
    d.curriculum_id,
    COALESCE(l.lesson_title, 'Imported Skill Library'),
    'Imported from legacy skills table',
    l.teacher_id
  FROM distinct_lesson_skills d
  JOIN public.lessons l ON l.id = d.curriculum_id
  ON CONFLICT (lesson_id) DO UPDATE
    SET title = EXCLUDED.title
  RETURNING id, lesson_id
)
INSERT INTO public.lesson_skill_items (
  library_id,
  skill_name,
  skill_code,
  category,
  description,
  target_stage,
  is_active
)
SELECT
  lib.id,
  COALESCE(s.skill_name, s.description),
  s.skill_code,
  COALESCE(s.subject, s.category),
  s.description,
  s.target_stage,
  COALESCE(s.is_active, TRUE)
FROM public.skills_legacy s
JOIN inserted_libraries lib ON lib.lesson_id = s.curriculum_id;

INSERT INTO public.lesson_skill_evaluations (
  id,
  lesson_id,
  student_id,
  teacher_id,
  class_id,
  score,
  text_feedback,
  evaluation_date,
  created_at
)
SELECT
  id,
  curriculum_id,
  student_id,
  teacher_id,
  class_id,
  score,
  text_feedback,
  evaluation_date,
  created_at
FROM public.skill_evaluations_legacy;

-- Evaluations aligned to lesson skill libraries
CREATE TABLE public.lesson_skill_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  library_item_id UUID REFERENCES public.lesson_skill_items(id) ON DELETE SET NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  score NUMERIC,
  text_feedback TEXT,
  evaluation_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lesson_skill_evaluations_student ON public.lesson_skill_evaluations(student_id);
CREATE INDEX idx_lesson_skill_evaluations_class ON public.lesson_skill_evaluations(class_id);
CREATE INDEX idx_lesson_skill_evaluations_lesson ON public.lesson_skill_evaluations(lesson_id);

-- Teacher resource contributions per lesson
CREATE TABLE public.teacher_resource_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  resource_type TEXT,
  resource_url TEXT,
  title TEXT,
  notes TEXT,
  contribution_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_teacher_resource_contributions_teacher ON public.teacher_resource_contributions(teacher_id);
CREATE INDEX idx_teacher_resource_contributions_lesson ON public.teacher_resource_contributions(lesson_id);

CREATE OR REPLACE VIEW public.teacher_resource_contribution_counts AS
SELECT
  teacher_id,
  COUNT(*) AS total_contributions,
  COUNT(DISTINCT lesson_id) AS lessons_contributed
FROM public.teacher_resource_contributions
GROUP BY teacher_id;

-- Behaviour tracking per session
CREATE TABLE public.session_behavior_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.class_sessions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('points','badge','comment')),
  points INTEGER DEFAULT 0,
  badge TEXT,
  comment TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_session_behavior_events_session ON public.session_behavior_events(session_id);
CREATE INDEX idx_session_behavior_events_student ON public.session_behavior_events(student_id);

-- Seating map snapshots and timer logs
CREATE TABLE public.session_seating_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.class_sessions(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  seat_map JSONB,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.session_timer_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.class_sessions(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  timer_type TEXT,
  duration_seconds INTEGER,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_session_timer_logs_session ON public.session_timer_logs(session_id);

-- Lesson status history for workflow tracking
CREATE TABLE public.lesson_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT,
  changed_by UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  change_notes TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lesson_status_history_lesson ON public.lesson_status_history(lesson_id);

-- Homework, printables, and upcoming assessments
CREATE TABLE public.lesson_homework (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  resources JSONB,
  created_by UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.lesson_homework_students (
  homework_id UUID NOT NULL REFERENCES public.lesson_homework(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (homework_id, student_id)
);

CREATE TABLE public.lesson_printables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_url TEXT,
  metadata JSONB,
  created_by UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.lesson_printables_students (
  printable_id UUID NOT NULL REFERENCES public.lesson_printables(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (printable_id, student_id)
);

CREATE TABLE public.lesson_upcoming_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  assessment_type TEXT,
  scheduled_date DATE,
  title TEXT,
  description TEXT,
  created_by UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.lesson_upcoming_assessments_students (
  upcoming_assessment_id UUID NOT NULL REFERENCES public.lesson_upcoming_assessments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  notified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (upcoming_assessment_id, student_id)
);

-- Helper function to set updated_at
CREATE OR REPLACE FUNCTION public.set_current_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_lessons_updated_at
BEFORE UPDATE ON public.lessons
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp();

CREATE TRIGGER trg_lesson_components_updated_at
BEFORE UPDATE ON public.lesson_components
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp();

CREATE TRIGGER trg_lesson_skill_libraries_updated_at
BEFORE UPDATE ON public.lesson_skill_libraries
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp();

CREATE TRIGGER trg_lesson_skill_items_updated_at
BEFORE UPDATE ON public.lesson_skill_items
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp();

-- Row Level Security policies for teachers and admins
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_skill_libraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_skill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_skill_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_resource_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_behavior_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_seating_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_timer_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_homework_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_printables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_printables_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_upcoming_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_upcoming_assessments_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers and admins can view lessons" ON public.lessons
  FOR SELECT USING (
    teacher_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_id AND c.teacher_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.admins a WHERE a.id = auth.uid())
  );

CREATE POLICY "Teachers can insert lessons" ON public.lessons
  FOR INSERT WITH CHECK (
    teacher_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.admins a WHERE a.id = auth.uid())
  );

CREATE POLICY "Teachers can update their lessons" ON public.lessons
  FOR UPDATE USING (
    teacher_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.admins a WHERE a.id = auth.uid())
  )
  WITH CHECK (
    teacher_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.admins a WHERE a.id = auth.uid())
  );

CREATE POLICY "Admins can delete lessons" ON public.lessons
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.admins a WHERE a.id = auth.uid())
  );

-- Shared policy helper via WITH CHECK to ensure access is limited to linked lessons
CREATE POLICY "Teachers can manage lesson components" ON public.lesson_components
  FOR ALL USING (
    EXISTS (
      SELECT 1
      FROM public.lessons l
      WHERE l.id = lesson_id
        AND (
          l.teacher_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.classes c WHERE c.id = l.class_id AND c.teacher_id = auth.uid())
          OR EXISTS (SELECT 1 FROM public.admins a WHERE a.id = auth.uid())
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.lessons l
      WHERE l.id = lesson_id
        AND (
          l.teacher_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.classes c WHERE c.id = l.class_id AND c.teacher_id = auth.uid())
          OR EXISTS (SELECT 1 FROM public.admins a WHERE a.id = auth.uid())
        )
    )
  );

CREATE POLICY "Teachers can manage lesson skill libraries" ON public.lesson_skill_libraries
  FOR ALL USING (
    lesson_id IN (
      SELECT l.id
      FROM public.lessons l
      WHERE l.teacher_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.classes c WHERE c.id = l.class_id AND c.teacher_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.admins a WHERE a.id = auth.uid())
    )
  )
  WITH CHECK (
    lesson_id IN (
      SELECT l.id
      FROM public.lessons l
      WHERE l.teacher_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.classes c WHERE c.id = l.class_id AND c.teacher_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.admins a WHERE a.id = auth.uid())
    )
  );

CREATE POLICY "Teachers can manage lesson skill items" ON public.lesson_skill_items
  FOR ALL USING (
    EXISTS (
      SELECT 1
      FROM public.lesson_skill_libraries lib
      JOIN public.lessons l ON l.id = lib.lesson_id
      WHERE lib.id = library_id
        AND (
          l.teacher_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.classes c WHERE c.id = l.class_id AND c.teacher_id = auth.uid())
          OR EXISTS (SELECT 1 FROM public.admins a WHERE a.id = auth.uid())
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.lesson_skill_libraries lib
      JOIN public.lessons l ON l.id = lib.lesson_id
      WHERE lib.id = library_id
        AND (
          l.teacher_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.classes c WHERE c.id = l.class_id AND c.teacher_id = auth.uid())
          OR EXISTS (SELECT 1 FROM public.admins a WHERE a.id = auth.uid())
        )
    )
  );

CREATE POLICY "Teachers can manage lesson skill evaluations" ON public.lesson_skill_evaluations
  FOR ALL USING (
    EXISTS (
      SELECT 1
      FROM public.lessons l
      WHERE l.id = lesson_id
        AND (
          l.teacher_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.classes c WHERE c.id = l.class_id AND c.teacher_id = auth.uid())
          OR EXISTS (SELECT 1 FROM public.admins a WHERE a.id = auth.uid())
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.lessons l
      WHERE l.id = lesson_id
        AND (
          l.teacher_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.classes c WHERE c.id = l.class_id AND c.teacher_id = auth.uid())
          OR EXISTS (SELECT 1 FROM public.admins a WHERE a.id = auth.uid())
        )
    )
  );

CREATE POLICY "Teachers can manage resource contributions" ON public.teacher_resource_contributions
  FOR ALL USING (
    EXISTS (
      SELECT 1
      FROM public.lessons l
      WHERE l.id = lesson_id
        AND (
          l.teacher_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.classes c WHERE c.id = l.class_id AND c.teacher_id = auth.uid())
          OR EXISTS (SELECT 1 FROM public.admins a WHERE a.id = auth.uid())
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.lessons l
      WHERE l.id = lesson_id
        AND (
          l.teacher_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.classes c WHERE c.id = l.class_id AND c.teacher_id = auth.uid())
          OR EXISTS (SELECT 1 FROM public.admins a WHERE a.id = auth.uid())
        )
    )
  );

CREATE POLICY "Teachers can read session behaviour events" ON public.session_behavior_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.class_sessions s
      WHERE s.id = session_id
        AND (
          s.teacher_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.admins a WHERE a.id = auth.uid())
        )
    )
  );

CREATE POLICY "Teachers can insert session behaviour events" ON public.session_behavior_events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.class_sessions s
      WHERE s.id = session_id
        AND (
          s.teacher_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.admins a WHERE a.id = auth.uid())
        )
    )
  );

CREATE POLICY "Teachers can manage seating logs" ON public.session_seating_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1
      FROM public.class_sessions s
      WHERE s.id = session_id
        AND (
          s.teacher_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.admins a WHERE a.id = auth.uid())
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.class_sessions s
      WHERE s.id = session_id
        AND (
          s.teacher_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.admins a WHERE a.id = auth.uid())
        )
    )
  );

CREATE POLICY "Teachers can manage timer logs" ON public.session_timer_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1
      FROM public.class_sessions s
      WHERE s.id = session_id
        AND (
          s.teacher_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.admins a WHERE a.id = auth.uid())
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.class_sessions s
      WHERE s.id = session_id
        AND (
          s.teacher_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.admins a WHERE a.id = auth.uid())
        )
    )
  );

CREATE POLICY "Teachers can read lesson status history" ON public.lesson_status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.lessons l
      WHERE l.id = lesson_id
        AND (
          l.teacher_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.classes c WHERE c.id = l.class_id AND c.teacher_id = auth.uid())
          OR EXISTS (SELECT 1 FROM public.admins a WHERE a.id = auth.uid())
        )
    )
  );

CREATE POLICY "Teachers can insert lesson status history" ON public.lesson_status_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.lessons l
      WHERE l.id = lesson_id
        AND (
          l.teacher_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.classes c WHERE c.id = l.class_id AND c.teacher_id = auth.uid())
          OR EXISTS (SELECT 1 FROM public.admins a WHERE a.id = auth.uid())
        )
    )
  );

CREATE POLICY "Teachers can manage lesson homework" ON public.lesson_homework
  FOR ALL USING (
    EXISTS (
      SELECT 1
      FROM public.lessons l
      WHERE l.id = lesson_id
        AND (
          l.teacher_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.classes c WHERE c.id = l.class_id AND c.teacher_id = auth.uid())
          OR EXISTS (SELECT 1 FROM public.admins a WHERE a.id = auth.uid())
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.lessons l
      WHERE l.id = lesson_id
        AND (
          l.teacher_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.classes c WHERE c.id = l.class_id AND c.teacher_id = auth.uid())
          OR EXISTS (SELECT 1 FROM public.admins a WHERE a.id = auth.uid())
        )
    )
  );

CREATE POLICY "Teachers can manage lesson homework students" ON public.lesson_homework_students
  FOR ALL USING (
    EXISTS (
      SELECT 1
      FROM public.lesson_homework hw
      JOIN public.lessons l ON l.id = hw.lesson_id
      WHERE hw.id = homework_id
        AND (
          l.teacher_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.classes c WHERE c.id = l.class_id AND c.teacher_id = auth.uid())
          OR EXISTS (SELECT 1 FROM public.admins a WHERE a.id = auth.uid())
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.lesson_homework hw
      JOIN public.lessons l ON l.id = hw.lesson_id
      WHERE hw.id = homework_id
        AND (
          l.teacher_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.classes c WHERE c.id = l.class_id AND c.teacher_id = auth.uid())
          OR EXISTS (SELECT 1 FROM public.admins a WHERE a.id = auth.uid())
        )
    )
  );

CREATE POLICY "Teachers can manage lesson printables" ON public.lesson_printables
  FOR ALL USING (
    EXISTS (
      SELECT 1
      FROM public.lessons l
      WHERE l.id = lesson_id
        AND (
          l.teacher_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.classes c WHERE c.id = l.class_id AND c.teacher_id = auth.uid())
          OR EXISTS (SELECT 1 FROM public.admins a WHERE a.id = auth.uid())
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.lessons l
      WHERE l.id = lesson_id
        AND (
          l.teacher_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.classes c WHERE c.id = l.class_id AND c.teacher_id = auth.uid())
          OR EXISTS (SELECT 1 FROM public.admins a WHERE a.id = auth.uid())
        )
    )
  );

CREATE POLICY "Teachers can manage lesson printable students" ON public.lesson_printables_students
  FOR ALL USING (
    EXISTS (
      SELECT 1
      FROM public.lesson_printables lp
      JOIN public.lessons l ON l.id = lp.lesson_id
      WHERE lp.id = printable_id
        AND (
          l.teacher_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.classes c WHERE c.id = l.class_id AND c.teacher_id = auth.uid())
          OR EXISTS (SELECT 1 FROM public.admins a WHERE a.id = auth.uid())
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.lesson_printables lp
      JOIN public.lessons l ON l.id = lp.lesson_id
      WHERE lp.id = printable_id
        AND (
          l.teacher_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.classes c WHERE c.id = l.class_id AND c.teacher_id = auth.uid())
          OR EXISTS (SELECT 1 FROM public.admins a WHERE a.id = auth.uid())
        )
    )
  );

CREATE POLICY "Teachers can manage lesson upcoming assessments" ON public.lesson_upcoming_assessments
  FOR ALL USING (
    EXISTS (
      SELECT 1
      FROM public.lessons l
      WHERE l.id = lesson_id
        AND (
          l.teacher_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.classes c WHERE c.id = l.class_id AND c.teacher_id = auth.uid())
          OR EXISTS (SELECT 1 FROM public.admins a WHERE a.id = auth.uid())
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.lessons l
      WHERE l.id = lesson_id
        AND (
          l.teacher_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.classes c WHERE c.id = l.class_id AND c.teacher_id = auth.uid())
          OR EXISTS (SELECT 1 FROM public.admins a WHERE a.id = auth.uid())
        )
    )
  );

CREATE POLICY "Teachers can manage lesson upcoming assessment students" ON public.lesson_upcoming_assessments_students
  FOR ALL USING (
    EXISTS (
      SELECT 1
      FROM public.lesson_upcoming_assessments ua
      JOIN public.lessons l ON l.id = ua.lesson_id
      WHERE ua.id = upcoming_assessment_id
        AND (
          l.teacher_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.classes c WHERE c.id = l.class_id AND c.teacher_id = auth.uid())
          OR EXISTS (SELECT 1 FROM public.admins a WHERE a.id = auth.uid())
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.lesson_upcoming_assessments ua
      JOIN public.lessons l ON l.id = ua.lesson_id
      WHERE ua.id = upcoming_assessment_id
        AND (
          l.teacher_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.classes c WHERE c.id = l.class_id AND c.teacher_id = auth.uid())
          OR EXISTS (SELECT 1 FROM public.admins a WHERE a.id = auth.uid())
        )
    )
  );

COMMIT;
