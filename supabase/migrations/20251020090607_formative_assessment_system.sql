-- Formative Assessment System Tables

-- Skills/Evaluation Criteria Table
CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stage_id UUID NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
    category TEXT NOT NULL, -- Prerequisites, Planning and Preparation, Classroom Management, etc.
    code TEXT NOT NULL, -- 1.1, 1.2, 2.1, etc.
    name TEXT NOT NULL, -- Learning objectives and success criteria, etc.
    factor DECIMAL(3,1), -- 1, 1.5, 2, or NULL for pass/fail
    is_pass_fail BOOLEAN DEFAULT false, -- true for Prerequisites
    display_order INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(stage_id, code)
);

-- Student Skill Evaluations (4-5 evaluations per skill per student)
CREATE TABLE IF NOT EXISTS student_skill_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,

    -- For scored skills
    score INTEGER, -- 1-4 scale or custom scale
    max_score INTEGER DEFAULT 4,

    -- For pass/fail skills
    passed BOOLEAN,

    comments TEXT,
    evaluation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Homework Assignments for Skills
CREATE TABLE IF NOT EXISTS homework_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,

    title TEXT NOT NULL,
    description TEXT,
    resource_id UUID REFERENCES resources(id) ON DELETE SET NULL, -- Link to resource if assigned from resources

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

-- Notifications for Students
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('homework_assigned', 'homework_graded', 'skill_improvement', 'general')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,

    -- Related entities
    homework_id UUID REFERENCES homework_assignments(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skills(id) ON DELETE SET NULL,

    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_skills_stage ON skills(stage_id);
CREATE INDEX idx_skills_category ON skills(category);
CREATE INDEX idx_student_evaluations_student ON student_skill_evaluations(student_id);
CREATE INDEX idx_student_evaluations_skill ON student_skill_evaluations(skill_id);
CREATE INDEX idx_student_evaluations_class ON student_skill_evaluations(class_id);
CREATE INDEX idx_homework_student ON homework_assignments(student_id);
CREATE INDEX idx_homework_skill ON homework_assignments(skill_id);
CREATE INDEX idx_homework_status ON homework_assignments(status);
CREATE INDEX idx_notifications_student ON notifications(student_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_skills_updated_at BEFORE UPDATE ON skills
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_skill_evaluations_updated_at BEFORE UPDATE ON student_skill_evaluations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_homework_assignments_updated_at BEFORE UPDATE ON homework_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create notification when homework is assigned
CREATE OR REPLACE FUNCTION notify_homework_assigned()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notifications (student_id, type, title, message, homework_id, skill_id)
    VALUES (
        NEW.student_id,
        'homework_assigned',
        'New Homework Assigned',
        'Your teacher has assigned you homework for: ' || (SELECT name FROM skills WHERE id = NEW.skill_id),
        NEW.id,
        NEW.skill_id
    );
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER homework_assigned_notification
    AFTER INSERT ON homework_assignments
    FOR EACH ROW
    EXECUTE FUNCTION notify_homework_assigned();

-- Seed initial skills data for Stage 1 based on classroom observation form
-- Note: You'll need to get the actual stage_id for Stage 1
-- This is an example - adjust the stage_id as needed

-- Prerequisites
INSERT INTO skills (stage_id, category, code, name, is_pass_fail, display_order)
SELECT id, 'Prerequisites', '1.1', 'Professionalism', true, 1 FROM stages WHERE name = 'Stage 1' LIMIT 1;

INSERT INTO skills (stage_id, category, code, name, is_pass_fail, display_order)
SELECT id, 'Prerequisites', '1.2', 'Safe Learning Environment', true, 2 FROM stages WHERE name = 'Stage 1' LIMIT 1;

INSERT INTO skills (stage_id, category, code, name, is_pass_fail, display_order)
SELECT id, 'Prerequisites', '1.3', 'Teacher''s understanding of Safeguarding policy', true, 3 FROM stages WHERE name = 'Stage 1' LIMIT 1;

-- Planning and Preparation
INSERT INTO skills (stage_id, category, code, name, factor, display_order)
SELECT id, 'Planning and Preparation', '2.1', 'Learning objectives and success criteria', 1.5, 4 FROM stages WHERE name = 'Stage 1' LIMIT 1;

INSERT INTO skills (stage_id, category, code, name, factor, display_order)
SELECT id, 'Planning and Preparation', '2.2', 'Planning for differentiated instructions', 1.5, 5 FROM stages WHERE name = 'Stage 1' LIMIT 1;

-- Classroom Management
INSERT INTO skills (stage_id, category, code, name, factor, display_order)
SELECT id, 'Classroom Management', '3.1', 'Learning environment', 1.0, 6 FROM stages WHERE name = 'Stage 1' LIMIT 1;

INSERT INTO skills (stage_id, category, code, name, factor, display_order)
SELECT id, 'Classroom Management', '3.2', 'Classroom procedures', 1.0, 7 FROM stages WHERE name = 'Stage 1' LIMIT 1;

INSERT INTO skills (stage_id, category, code, name, factor, display_order)
SELECT id, 'Classroom Management', '3.3', 'Building rapport', 1.0, 8 FROM stages WHERE name = 'Stage 1' LIMIT 1;

INSERT INTO skills (stage_id, category, code, name, factor, display_order)
SELECT id, 'Classroom Management', '3.4', 'Student behaviour', 1.5, 9 FROM stages WHERE name = 'Stage 1' LIMIT 1;

-- Instructions
INSERT INTO skills (stage_id, category, code, name, factor, display_order)
SELECT id, 'Instructions', '4.1', 'Delivery of content', 2.0, 10 FROM stages WHERE name = 'Stage 1' LIMIT 1;

INSERT INTO skills (stage_id, category, code, name, factor, display_order)
SELECT id, 'Instructions', '4.2', 'Enthusiasm, guidance, and student engagement', 2.0, 11 FROM stages WHERE name = 'Stage 1' LIMIT 1;

INSERT INTO skills (stage_id, category, code, name, factor, display_order)
SELECT id, 'Instructions', '4.3', 'Assessment and feedback', 1.5, 12 FROM stages WHERE name = 'Stage 1' LIMIT 1;

INSERT INTO skills (stage_id, category, code, name, factor, display_order)
SELECT id, 'Instructions', '4.4', 'Differentiation and scaffolding', 2.0, 13 FROM stages WHERE name = 'Stage 1' LIMIT 1;

-- Review and Consolidation
INSERT INTO skills (stage_id, category, code, name, factor, display_order)
SELECT id, 'Review and Consolidation', '5.1', 'Summary of key content', 1.0, 14 FROM stages WHERE name = 'Stage 1' LIMIT 1;

INSERT INTO skills (stage_id, category, code, name, factor, display_order)
SELECT id, 'Review and Consolidation', '5.2', 'Evaluation of achieving the learning objectives', 1.0, 15 FROM stages WHERE name = 'Stage 1' LIMIT 1;

INSERT INTO skills (stage_id, category, code, name, factor, display_order)
SELECT id, 'Review and Consolidation', '5.3', 'Follow-up activities (homework, further support, extension tasks, etc.)', 1.0, 16 FROM stages WHERE name = 'Stage 1' LIMIT 1;

-- Teacher's Reflection
INSERT INTO skills (stage_id, category, code, name, factor, display_order)
SELECT id, 'Teacher''s Reflection', '6.1', 'Teacher''s reflection of the lesson', 1.0, 17 FROM stages WHERE name = 'Stage 1' LIMIT 1;

INSERT INTO skills (stage_id, category, code, name, factor, display_order)
SELECT id, 'Teacher''s Reflection', '6.2', 'Suggestions for improvement', 1.0, 18 FROM stages WHERE name = 'Stage 1' LIMIT 1;

-- Bonus Point
INSERT INTO skills (stage_id, category, code, name, factor, display_order)
SELECT id, 'Bonus Point', '7.1', 'Material development on LMS and LMS usage', NULL, 19 FROM stages WHERE name = 'Stage 1' LIMIT 1;

-- Grant permissions (adjust based on your RLS policies)
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_skill_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for skills (readable by all authenticated users)
CREATE POLICY "Skills are viewable by authenticated users"
    ON skills FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Teachers can manage skills"
    ON skills FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'teacher' OR auth.jwt() ->> 'role' = 'admin');

-- RLS Policies for evaluations
CREATE POLICY "Teachers can view all evaluations in their classes"
    ON student_skill_evaluations FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM teachers t
            WHERE t.user_id = auth.uid()
            AND t.id = teacher_id
        )
        OR
        EXISTS (
            SELECT 1 FROM students s
            WHERE s.user_id = auth.uid()
            AND s.id = student_id
        )
    );

CREATE POLICY "Teachers can create evaluations"
    ON student_skill_evaluations FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM teachers t
            WHERE t.user_id = auth.uid()
            AND t.id = teacher_id
        )
    );

CREATE POLICY "Teachers can update their evaluations"
    ON student_skill_evaluations FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM teachers t
            WHERE t.user_id = auth.uid()
            AND t.id = teacher_id
        )
    );

-- RLS Policies for homework
CREATE POLICY "Students can view their homework"
    ON homework_assignments FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM students s
            WHERE s.user_id = auth.uid()
            AND s.id = student_id
        )
        OR
        EXISTS (
            SELECT 1 FROM teachers t
            WHERE t.user_id = auth.uid()
            AND t.id = teacher_id
        )
    );

CREATE POLICY "Teachers can create homework"
    ON homework_assignments FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM teachers t
            WHERE t.user_id = auth.uid()
            AND t.id = teacher_id
        )
    );

CREATE POLICY "Teachers can update homework"
    ON homework_assignments FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM teachers t
            WHERE t.user_id = auth.uid()
            AND t.id = teacher_id
        )
    );

CREATE POLICY "Students can update their homework submission"
    ON homework_assignments FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM students s
            WHERE s.user_id = auth.uid()
            AND s.id = student_id
        )
    );

-- RLS Policies for notifications
CREATE POLICY "Students can view their notifications"
    ON notifications FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM students s
            WHERE s.user_id = auth.uid()
            AND s.id = student_id
        )
    );

CREATE POLICY "Students can update their notifications"
    ON notifications FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM students s
            WHERE s.user_id = auth.uid()
            AND s.id = student_id
        )
    );
