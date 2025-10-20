-- =============================================
-- NOTIFICATION SYSTEM
-- Real-time notifications for users
-- =============================================

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- 'assignment', 'message', 'system', 'payment', 'class', 'achievement'
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  is_read BOOLEAN DEFAULT FALSE,
  action_url TEXT, -- Optional URL to navigate to when clicked
  metadata JSONB, -- Additional data specific to notification type
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- RLS policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- System can insert notifications
CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- Helper Functions
-- =============================================

-- Function to create notification for user
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT,
  p_priority TEXT DEFAULT 'normal',
  p_action_url TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    priority,
    action_url,
    metadata
  ) VALUES (
    p_user_id,
    p_title,
    p_message,
    p_type,
    p_priority,
    p_action_url,
    p_metadata
  ) RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE notifications
  SET is_read = TRUE, read_at = NOW()
  WHERE id = p_notification_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all notifications as read for user
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS VOID AS $$
BEGIN
  UPDATE notifications
  SET is_read = TRUE, read_at = NOW()
  WHERE user_id = auth.uid() AND is_read = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete old read notifications (cleanup)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM notifications
  WHERE is_read = TRUE
    AND read_at < NOW() - INTERVAL '30 days';

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Triggers for automatic notifications
-- =============================================

-- Notify student when payment is recorded
CREATE OR REPLACE FUNCTION notify_payment_recorded()
RETURNS TRIGGER AS $$
DECLARE
  v_student RECORD;
BEGIN
  -- Get student info
  SELECT id, name, surname, email
  INTO v_student
  FROM dashboard_students
  WHERE id::TEXT = NEW.student_id;

  IF v_student.id IS NOT NULL THEN
    -- Create notification for student
    PERFORM create_notification(
      (SELECT id FROM auth.users WHERE email = v_student.email LIMIT 1),
      'Payment Recorded',
      format('Payment of %s VND has been recorded for your account.', NEW.amount),
      'payment',
      'normal',
      '/student?tab=payments',
      jsonb_build_object(
        'payment_id', NEW.id,
        'amount', NEW.amount,
        'method', NEW.payment_method
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_payment ON payments;
CREATE TRIGGER trigger_notify_payment
  AFTER INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION notify_payment_recorded();

-- Notify student when assigned to a class
CREATE OR REPLACE FUNCTION notify_class_assignment()
RETURNS TRIGGER AS $$
DECLARE
  v_student RECORD;
  v_class RECORD;
BEGIN
  IF NEW.class IS NOT NULL AND (OLD.class IS NULL OR NEW.class != OLD.class) THEN
    -- Get class info
    SELECT name, level, schedule
    INTO v_class
    FROM classes
    WHERE name = NEW.class
    LIMIT 1;

    -- Get student user id
    SELECT id FROM auth.users WHERE email = NEW.email INTO v_student;

    IF v_student.id IS NOT NULL AND v_class.name IS NOT NULL THEN
      PERFORM create_notification(
        v_student.id,
        'Assigned to Class',
        format('You have been assigned to class: %s (%s)', v_class.name, v_class.level),
        'class',
        'high',
        '/student?tab=schedule',
        jsonb_build_object(
          'class_name', v_class.name,
          'level', v_class.level,
          'schedule', v_class.schedule
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_class_assignment ON dashboard_students;
CREATE TRIGGER trigger_notify_class_assignment
  AFTER UPDATE ON dashboard_students
  FOR EACH ROW
  EXECUTE FUNCTION notify_class_assignment();

-- =============================================
-- Views for common queries
-- =============================================

-- Unread notifications count per user
CREATE OR REPLACE VIEW unread_notification_counts AS
SELECT
  user_id,
  COUNT(*) as unread_count
FROM notifications
WHERE is_read = FALSE
GROUP BY user_id;

-- Recent notifications per user
CREATE OR REPLACE VIEW recent_notifications AS
SELECT
  id,
  user_id,
  title,
  message,
  type,
  priority,
  is_read,
  action_url,
  created_at
FROM notifications
ORDER BY created_at DESC
LIMIT 50;

COMMENT ON TABLE notifications IS 'User notifications for assignments, messages, and system alerts';
COMMENT ON FUNCTION create_notification IS 'Creates a new notification for a user';
COMMENT ON FUNCTION mark_notification_read IS 'Marks a specific notification as read';
COMMENT ON FUNCTION mark_all_notifications_read IS 'Marks all notifications as read for current user';
