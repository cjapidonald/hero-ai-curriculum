-- Formative Assessment System Tables (Fixed)

-- Observation Criteria/Skills Table (renamed to avoid conflict with existing skills table)
CREATE TABLE IF NOT EXISTS observation_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stage_name TEXT NOT NULL DEFAULT 'Stage 1', -- Using stage name instead of foreign key
    category TEXT NOT NULL, -- Prerequisites, Planning and Preparation, Classroom Management, etc.
    code TEXT NOT NULL, -- 1.1, 1.2, 2.1, etc.
    name TEXT NOT NULL, -- Learning objectives and success criteria, etc.
    factor DECIMAL(3,1), -- 1, 1.5, 2, or NULL for pass/fail
    is_pass_fail BOOLEAN DEFAULT false, -- true for Prerequisites
    display_order INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(stage_name, code)
);

-- Student Observation Evaluations (4-5 evaluations per criteria per student)
CREATE TABLE IF NOT EXISTS student_observation_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    criteria_id UUID NOT NULL REFERENCES observation_criteria(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,

    -- For scored criteria
    score INTEGER, -- 1-4 scale (1=Below Standard, 2=Approaching, 3=Meeting, 4=Exceeding)
    max_score INTEGER DEFAULT 4,

    -- For pass/fail criteria
    passed BOOLEAN,

    comments TEXT,
    evaluation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Skill Homework Assignments
CREATE TABLE IF NOT EXISTS skill_homework (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    criteria_id UUID NOT NULL REFERENCES observation_criteria(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,

    title TEXT NOT NULL,
    description TEXT,
    resource_id UUID REFERENCES resources(id) ON DELETE SET NULL,

    due_date DATE,
    status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'overdue')),

    -- Student submission
    submitted_at TIMESTAMPTZ,
    submission_notes TEXT,

    -- Teacher feedback
    teacher_feedback TEXT,
    feedback_date TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student Notifications
CREATE TABLE IF NOT EXISTS student_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('homework_assigned', 'homework_graded', 'skill_improvement', 'general')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,

    -- Related entities
    homework_id UUID REFERENCES skill_homework(id) ON DELETE CASCADE,
    criteria_id UUID REFERENCES observation_criteria(id) ON DELETE SET NULL,

    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_observation_criteria_stage ON observation_criteria(stage_name);
CREATE INDEX IF NOT EXISTS idx_observation_criteria_category ON observation_criteria(category);
CREATE INDEX IF NOT EXISTS idx_student_obs_eval_student ON student_observation_evaluations(student_id);
CREATE INDEX IF NOT EXISTS idx_student_obs_eval_criteria ON student_observation_evaluations(criteria_id);
CREATE INDEX IF NOT EXISTS idx_student_obs_eval_class ON student_observation_evaluations(class_id);
CREATE INDEX IF NOT EXISTS idx_skill_homework_student ON skill_homework(student_id);
CREATE INDEX IF NOT EXISTS idx_skill_homework_criteria ON skill_homework(criteria_id);
CREATE INDEX IF NOT EXISTS idx_skill_homework_status ON skill_homework(status);
CREATE INDEX IF NOT EXISTS idx_student_notif_student ON student_notifications(student_id);
CREATE INDEX IF NOT EXISTS idx_student_notif_read ON student_notifications(is_read);

-- Trigger functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers only if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_observation_criteria_updated_at') THEN
        CREATE TRIGGER update_observation_criteria_updated_at BEFORE UPDATE ON observation_criteria
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_student_observation_evaluations_updated_at') THEN
        CREATE TRIGGER update_student_observation_evaluations_updated_at BEFORE UPDATE ON student_observation_evaluations
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_skill_homework_updated_at') THEN
        CREATE TRIGGER update_skill_homework_updated_at BEFORE UPDATE ON skill_homework
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Notification trigger function
CREATE OR REPLACE FUNCTION notify_skill_homework_assigned()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO student_notifications (student_id, type, title, message, homework_id, criteria_id)
    VALUES (
        NEW.student_id,
        'homework_assigned',
        'New Homework Assigned',
        'Your teacher has assigned you homework for: ' || (SELECT name FROM observation_criteria WHERE id = NEW.criteria_id),
        NEW.id,
        NEW.criteria_id
    );
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'skill_homework_assigned_notification') THEN
        CREATE TRIGGER skill_homework_assigned_notification
            AFTER INSERT ON skill_homework
            FOR EACH ROW
            EXECUTE FUNCTION notify_skill_homework_assigned();
    END IF;
END $$;

-- Seed Stage 1 observation criteria
-- Pass/Fail criteria (Prerequisites)
INSERT INTO observation_criteria (stage_name, category, code, name, is_pass_fail, display_order)
VALUES
    ('Stage 1', 'Prerequisites', '1.1', 'Professionalism', true, 1),
    ('Stage 1', 'Prerequisites', '1.2', 'Safe Learning Environment', true, 2),
    ('Stage 1', 'Prerequisites', '1.3', 'Teacher''s understanding of Safeguarding policy', true, 3)
ON CONFLICT (stage_name, code) DO NOTHING;

-- Scored criteria with factors
INSERT INTO observation_criteria (stage_name, category, code, name, factor, is_pass_fail, display_order)
VALUES
    ('Stage 1', 'Planning and Preparation', '2.1', 'Learning objectives and success criteria', 1.5, false, 4),
    ('Stage 1', 'Planning and Preparation', '2.2', 'Planning for differentiated instructions', 1.5, false, 5),
    ('Stage 1', 'Classroom Management', '3.1', 'Learning environment', 1.0, false, 6),
    ('Stage 1', 'Classroom Management', '3.2', 'Classroom procedures', 1.0, false, 7),
    ('Stage 1', 'Classroom Management', '3.3', 'Building rapport', 1.0, false, 8),
    ('Stage 1', 'Classroom Management', '3.4', 'Student behaviour', 1.5, false, 9),
    ('Stage 1', 'Instructions', '4.1', 'Delivery of content', 2.0, false, 10),
    ('Stage 1', 'Instructions', '4.2', 'Enthusiasm, guidance, and student engagement', 2.0, false, 11),
    ('Stage 1', 'Instructions', '4.3', 'Assessment and feedback', 1.5, false, 12),
    ('Stage 1', 'Instructions', '4.4', 'Differentiation and scaffolding', 2.0, false, 13),
    ('Stage 1', 'Review and Consolidation', '5.1', 'Summary of key content', 1.0, false, 14),
    ('Stage 1', 'Review and Consolidation', '5.2', 'Evaluation of achieving the learning objectives', 1.0, false, 15),
    ('Stage 1', 'Review and Consolidation', '5.3', 'Follow-up activities (homework, further support, extension tasks, etc.)', 1.0, false, 16),
    ('Stage 1', 'Teacher''s Reflection', '6.1', 'Teacher''s reflection of the lesson', 1.0, false, 17),
    ('Stage 1', 'Teacher''s Reflection', '6.2', 'Suggestions for improvement', 1.0, false, 18),
    ('Stage 1', 'Bonus Point', '7.1', 'Material development on LMS and LMS usage', NULL, false, 19)
ON CONFLICT (stage_name, code) DO NOTHING;

-- Enable Row Level Security (with permissive policies for now)
ALTER TABLE observation_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_observation_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_notifications ENABLE ROW LEVEL SECURITY;

-- Simplified RLS Policies - Allow all authenticated users
-- You can tighten these later based on your authentication setup

DROP POLICY IF EXISTS "Allow all authenticated users" ON observation_criteria;
CREATE POLICY "Allow all authenticated users"
    ON observation_criteria FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all authenticated users" ON student_observation_evaluations;
CREATE POLICY "Allow all authenticated users"
    ON student_observation_evaluations FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all authenticated users" ON skill_homework;
CREATE POLICY "Allow all authenticated users"
    ON skill_homework FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all authenticated users" ON student_notifications;
CREATE POLICY "Allow all authenticated users"
    ON student_notifications FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
