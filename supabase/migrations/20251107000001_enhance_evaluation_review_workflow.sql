-- Enhance teacher_evaluations table for review workflow
-- Add new columns for tracking review status and timestamps

-- Add columns to teacher_evaluations
ALTER TABLE public.teacher_evaluations
ADD COLUMN IF NOT EXISTS rubric_scores JSONB,
ADD COLUMN IF NOT EXISTS context_explanation TEXT,
ADD COLUMN IF NOT EXISTS overall_score NUMERIC(5, 2),
ADD COLUMN IF NOT EXISTS teacher_reviewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS admin_final_review_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS requires_attention BOOLEAN DEFAULT FALSE;

-- Update status values to include review workflow states
-- Possible statuses: 'draft', 'pending_teacher_review', 'pending_admin_review', 'completed', 'archived'
COMMENT ON COLUMN public.teacher_evaluations.status IS 'Evaluation status: draft, pending_teacher_review, pending_admin_review, completed, archived';
COMMENT ON COLUMN public.teacher_evaluations.requires_attention IS 'Red flag for admin when teacher has responded';

-- Add teacher_score column to evaluation_item_scores for teacher's adjusted score
ALTER TABLE public.evaluation_item_scores
ADD COLUMN IF NOT EXISTS teacher_score NUMERIC(3, 1),
ADD COLUMN IF NOT EXISTS teacher_response_at TIMESTAMPTZ;

COMMENT ON COLUMN public.evaluation_item_scores.teacher_score IS 'Teacher''s self-assessment score for this criterion';
COMMENT ON COLUMN public.evaluation_item_scores.teacher_comment IS 'Teacher''s response and reflection on this criterion';

-- Create notifications table for evaluation updates
CREATE TABLE IF NOT EXISTS public.evaluation_notifications (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    evaluation_id UUID NOT NULL REFERENCES public.teacher_evaluations(id) ON DELETE CASCADE,
    recipient_type TEXT NOT NULL, -- 'teacher' or 'admin'
    recipient_id UUID NOT NULL, -- teacher_id or admin_id
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.evaluation_notifications IS 'Notifications for evaluation workflow updates';

-- RLS for notifications
ALTER TABLE public.evaluation_notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.evaluation_notifications;
DROP POLICY IF EXISTS "System can create notifications" ON public.evaluation_notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.evaluation_notifications;

CREATE POLICY "Users can view their own notifications"
    ON public.evaluation_notifications
    FOR SELECT
    USING (true);

CREATE POLICY "System can create notifications"
    ON public.evaluation_notifications
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
    ON public.evaluation_notifications
    FOR UPDATE
    USING (true);

GRANT ALL ON TABLE public.evaluation_notifications TO anon, authenticated, service_role;

-- Create function to send notification when teacher responds
CREATE OR REPLACE FUNCTION notify_admin_on_teacher_response()
RETURNS TRIGGER AS $$
BEGIN
    -- Set requires_attention flag when teacher responds
    IF NEW.teacher_reviewed_at IS NOT NULL AND OLD.teacher_reviewed_at IS NULL THEN
        UPDATE public.teacher_evaluations
        SET requires_attention = TRUE,
            status = 'pending_admin_review'
        WHERE id = NEW.id;

        -- Create notification for admin
        INSERT INTO public.evaluation_notifications (
            evaluation_id,
            recipient_type,
            recipient_id,
            message
        )
        SELECT
            NEW.id,
            'admin',
            NEW.evaluator_id,
            'Teacher has responded to evaluation - review required';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for teacher response notifications
DROP TRIGGER IF EXISTS trigger_notify_admin_on_teacher_response ON public.teacher_evaluations;
CREATE TRIGGER trigger_notify_admin_on_teacher_response
    AFTER UPDATE ON public.teacher_evaluations
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_on_teacher_response();
