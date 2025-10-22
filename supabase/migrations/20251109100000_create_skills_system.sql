-- The skills table already exists, just add the missing columns we need
DO $$
BEGIN
    -- Add subject column (map from category)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'skills' AND column_name = 'subject') THEN
        ALTER TABLE public.skills ADD COLUMN subject TEXT;
    END IF;

    -- Add strand column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'skills' AND column_name = 'strand') THEN
        ALTER TABLE public.skills ADD COLUMN strand TEXT;
    END IF;

    -- Add substrand column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'skills' AND column_name = 'substrand') THEN
        ALTER TABLE public.skills ADD COLUMN substrand TEXT;
    END IF;

    -- Add curriculum_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'skills' AND column_name = 'curriculum_id') THEN
        ALTER TABLE public.skills ADD COLUMN curriculum_id UUID;
        -- Add foreign key constraint separately
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                      WHERE constraint_schema = 'public'
                      AND table_name = 'skills'
                      AND constraint_name = 'skills_curriculum_id_fkey') THEN
            ALTER TABLE public.skills
            ADD CONSTRAINT skills_curriculum_id_fkey
            FOREIGN KEY (curriculum_id) REFERENCES public.curriculum(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- Create skill_evaluations table
CREATE TABLE IF NOT EXISTS public.skill_evaluations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    score NUMERIC, -- Can be percentage, points, or null
    text_feedback TEXT,
    evaluation_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better performance (only if columns exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'skills' AND column_name = 'curriculum_id') THEN
        CREATE INDEX IF NOT EXISTS idx_skills_curriculum ON public.skills(curriculum_id);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'skills' AND column_name = 'subject') THEN
        CREATE INDEX IF NOT EXISTS idx_skills_subject ON public.skills(subject);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_skill_evaluations_student ON public.skill_evaluations(student_id);
CREATE INDEX IF NOT EXISTS idx_skill_evaluations_skill ON public.skill_evaluations(skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_evaluations_class ON public.skill_evaluations(class_id);

-- Enable RLS
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_evaluations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for skills
CREATE POLICY "Everyone can view skills" ON public.skills
    FOR SELECT USING (true);

CREATE POLICY "Only admins can insert skills" ON public.skills
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admins
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Only admins can update skills" ON public.skills
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.admins
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Only admins can delete skills" ON public.skills
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.admins
            WHERE id = auth.uid()
        )
    );

-- RLS Policies for skill_evaluations
CREATE POLICY "Students can view their own evaluations" ON public.skill_evaluations
    FOR SELECT USING (
        student_id = auth.uid()
        OR teacher_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid())
    );

CREATE POLICY "Teachers can insert evaluations for their students" ON public.skill_evaluations
    FOR INSERT WITH CHECK (
        teacher_id = auth.uid()
        AND (
            EXISTS (SELECT 1 FROM public.teachers WHERE id = auth.uid())
            OR EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid())
        )
    );

CREATE POLICY "Teachers can update their own evaluations" ON public.skill_evaluations
    FOR UPDATE USING (
        teacher_id = auth.uid()
        AND (
            EXISTS (SELECT 1 FROM public.teachers WHERE id = auth.uid())
            OR EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid())
        )
    );

CREATE POLICY "Teachers and admins can delete evaluations" ON public.skill_evaluations
    FOR DELETE USING (
        teacher_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid())
    );

-- Create function to get student skill progress
CREATE OR REPLACE FUNCTION get_student_skill_progress(
    p_student_id UUID,
    p_skill_id UUID DEFAULT NULL
)
RETURNS TABLE (
    skill_id UUID,
    skill_name TEXT,
    skill_code TEXT,
    subject TEXT,
    strand TEXT,
    substrand TEXT,
    latest_score NUMERIC,
    average_score NUMERIC,
    evaluation_count BIGINT,
    evaluations JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id as skill_id,
        COALESCE(s.skill_name, s.description) as skill_name,
        s.skill_code,
        COALESCE(s.subject, s.category) as subject,
        s.strand,
        s.substrand,
        (
            SELECT se.score
            FROM public.skill_evaluations se
            WHERE se.student_id = p_student_id
                AND se.skill_id = s.id
                AND se.score IS NOT NULL
            ORDER BY se.evaluation_date DESC
            LIMIT 1
        ) as latest_score,
        (
            SELECT AVG(se.score)
            FROM public.skill_evaluations se
            WHERE se.student_id = p_student_id
                AND se.skill_id = s.id
                AND se.score IS NOT NULL
        ) as average_score,
        (
            SELECT COUNT(*)
            FROM public.skill_evaluations se
            WHERE se.student_id = p_student_id AND se.skill_id = s.id
        ) as evaluation_count,
        (
            SELECT JSONB_AGG(
                JSONB_BUILD_OBJECT(
                    'score', se.score,
                    'text_feedback', se.text_feedback,
                    'evaluation_date', se.evaluation_date,
                    'teacher_id', se.teacher_id
                ) ORDER BY se.evaluation_date ASC
            )
            FROM public.skill_evaluations se
            WHERE se.student_id = p_student_id AND se.skill_id = s.id
        ) as evaluations
    FROM public.skills s
    WHERE (p_skill_id IS NULL OR s.id = p_skill_id)
        AND EXISTS (
            SELECT 1 FROM public.skill_evaluations se
            WHERE se.student_id = p_student_id AND se.skill_id = s.id
        )
    ORDER BY COALESCE(s.subject, s.category), s.strand, s.substrand, s.skill_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get class skill overview
CREATE OR REPLACE FUNCTION get_class_skill_overview(
    p_class_id UUID,
    p_subject TEXT DEFAULT NULL
)
RETURNS TABLE (
    skill_id UUID,
    skill_name TEXT,
    skill_code TEXT,
    subject TEXT,
    student_count BIGINT,
    average_score NUMERIC,
    latest_evaluation_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id as skill_id,
        COALESCE(s.skill_name, s.description) as skill_name,
        s.skill_code,
        COALESCE(s.subject, s.category) as subject,
        COUNT(DISTINCT se.student_id) as student_count,
        AVG(se.score) as average_score,
        MAX(se.evaluation_date) as latest_evaluation_date
    FROM public.skills s
    LEFT JOIN public.skill_evaluations se ON se.skill_id = s.id AND se.class_id = p_class_id
    WHERE (p_subject IS NULL OR COALESCE(s.subject, s.category) = p_subject)
    GROUP BY s.id, COALESCE(s.skill_name, s.description), s.skill_code, COALESCE(s.subject, s.category), s.strand, s.substrand
    ORDER BY COALESCE(s.subject, s.category), s.strand, s.substrand, s.skill_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
