-- Drop the old teacher_evaluations table
DROP TABLE IF EXISTS public.teacher_evaluations;

-- Create the new teacher_evaluations table for the classroom observation form
CREATE TABLE public.teacher_evaluations (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    evaluator_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- Assuming evaluators are users
    campus TEXT,
    position TEXT,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    evaluation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    subject TEXT,
    topic_lesson TEXT,
    status TEXT NOT NULL DEFAULT 'draft', -- e.g., 'draft', 'submitted_to_teacher', 'teacher_reviewed', 'finalized', 'archived'
    total_score NUMERIC(5, 2),
    ranking TEXT,
    highlights_strengths TEXT,
    improvements_to_make TEXT,
    teacher_signature_at TIMESTAMPTZ,
    evaluator_signature_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.teacher_evaluations IS 'Stores classroom observation evaluations for teachers.';

-- Create a table for the rubric items
CREATE TABLE public.evaluation_rubric_items (
    id SERIAL PRIMARY KEY,
    section TEXT NOT NULL,
    criteria TEXT NOT NULL,
    factor NUMERIC(3, 1),
    score_type TEXT NOT NULL, -- 'pass_fail' or 'point_scale'
    "order" INTEGER NOT NULL
);

COMMENT ON TABLE public.evaluation_rubric_items IS 'Defines the items in the classroom observation rubric.';

-- Create a table for the scores and comments for each item in an evaluation
CREATE TABLE public.evaluation_item_scores (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    evaluation_id UUID NOT NULL REFERENCES public.teacher_evaluations(id) ON DELETE CASCADE,
    rubric_item_id INTEGER NOT NULL REFERENCES public.evaluation_rubric_items(id) ON DELETE CASCADE,
    score NUMERIC(3, 1),
    evaluator_comment TEXT,
    teacher_comment TEXT,
    UNIQUE(evaluation_id, rubric_item_id)
);

COMMENT ON TABLE public.evaluation_item_scores IS 'Stores scores and comments for each rubric item in a teacher evaluation.';

-- Populate the rubric items table
INSERT INTO public.evaluation_rubric_items (section, criteria, factor, score_type, "order") VALUES
('PREREQUISITES', 'Professionalism', NULL, 'pass_fail', 1),
('PREREQUISITES', 'Safe Learning Environment', NULL, 'pass_fail', 2),
('PREREQUISITES', 'Teacher''s understanding of Safeguarding policy', NULL, 'pass_fail', 3),
('PLANNING AND PREPARATION', 'Learning objectives and success criteria', 1.5, 'point_scale', 4),
('PLANNING AND PREPARATION', 'Planning for differentiated instructions', 1.5, 'point_scale', 5),
('CLASSROOM MANAGEMENT', 'Learning environment', 1.0, 'point_scale', 6),
('CLASSROOM MANAGEMENT', 'Classroom procedures', 1.0, 'point_scale', 7),
('CLASSROOM MANAGEMENT', 'Building rapport', 1.0, 'point_scale', 8),
('CLASSROOM MANAGEMENT', 'Student behaviour', 1.5, 'point_scale', 9),
('INSTRUCTIONS', 'Delivery of content', 2.0, 'point_scale', 10),
('INSTRUCTIONS', 'Enthusiasm, guidance, and student engagement', 2.0, 'point_scale', 11),
('INSTRUCTIONS', 'Assessment and feedback', 1.5, 'point_scale', 12),
('INSTRUCTIONS', 'Differentiation and scaffolding', 2.0, 'point_scale', 13),
('REVIEW AND CONSOLIDATION', 'Summary of key content', 1.0, 'point_scale', 14),
('REVIEW AND CONSOLIDATION', 'Evaluation of achieving the learning objectives', 1.0, 'point_scale', 15),
('REVIEW AND CONSOLIDATION', 'Follow-up activities (homework, further support, extension tasks, etc.)', 1.0, 'point_scale', 16),
('TEACHER''S REFLECTION', 'Teacher''s reflection of the lesson', 1.0, 'point_scale', 17),
('TEACHER''S REFLECTION', 'Suggestions for improvement', 1.0, 'point_scale', 18),
('BONUS POINT', 'Material development on LMS and LMS usage', NULL, 'point_scale', 19);

-- RLS policies
ALTER TABLE public.teacher_evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for teacher evaluations" ON public.teacher_evaluations FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.evaluation_rubric_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for evaluation rubric items" ON public.evaluation_rubric_items FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.evaluation_item_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for evaluation item scores" ON public.evaluation_item_scores FOR ALL USING (true) WITH CHECK (true);

-- Grants
GRANT ALL ON TABLE public.teacher_evaluations TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.evaluation_rubric_items TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.evaluation_item_scores TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE evaluation_rubric_items_id_seq TO anon, authenticated, service_role;

-- Update trigger for updated_at
CREATE TRIGGER update_teacher_evaluations_updated_at
  BEFORE UPDATE ON public.teacher_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
