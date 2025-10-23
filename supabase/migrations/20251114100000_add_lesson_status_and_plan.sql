
ALTER TABLE curriculum
ADD COLUMN status TEXT DEFAULT 'pending',
ADD COLUMN lesson_plan_content JSONB;
