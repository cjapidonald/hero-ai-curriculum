-- =============================================
-- AUDIT LOGGING SYSTEM
-- Tracks all changes to critical data
-- =============================================

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  action TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  old_data JSONB,
  new_data JSONB,
  changed_fields TEXT[],
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_role TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record ON audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- RLS policies
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- System can insert audit logs (no RLS for inserts)
CREATE POLICY "Allow system to insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

-- =============================================
-- Trigger function to log changes
-- =============================================
CREATE OR REPLACE FUNCTION log_audit_changes()
RETURNS TRIGGER AS $$
DECLARE
  user_info RECORD;
  changed_fields TEXT[];
  field_name TEXT;
BEGIN
  -- Get user information
  SELECT
    id,
    email,
    raw_user_meta_data->>'role' as role
  INTO user_info
  FROM auth.users
  WHERE id = auth.uid();

  -- For UPDATE, calculate changed fields
  IF TG_OP = 'UPDATE' THEN
    changed_fields := ARRAY[]::TEXT[];
    FOR field_name IN
      SELECT jsonb_object_keys(to_jsonb(NEW))
    LOOP
      IF to_jsonb(OLD)->field_name IS DISTINCT FROM to_jsonb(NEW)->field_name THEN
        changed_fields := array_append(changed_fields, field_name);
      END IF;
    END LOOP;
  END IF;

  -- Insert audit log
  INSERT INTO audit_logs (
    table_name,
    record_id,
    action,
    old_data,
    new_data,
    changed_fields,
    user_id,
    user_email,
    user_role
  ) VALUES (
    TG_TABLE_NAME,
    CASE
      WHEN TG_OP = 'DELETE' THEN OLD.id::TEXT
      ELSE NEW.id::TEXT
    END,
    TG_OP,
    CASE
      WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD)
      ELSE NULL
    END,
    CASE
      WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW)
      ELSE NULL
    END,
    changed_fields,
    user_info.id,
    user_info.email,
    user_info.role
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Apply audit triggers to critical tables
-- =============================================

-- Students
DROP TRIGGER IF EXISTS audit_dashboard_students ON dashboard_students;
CREATE TRIGGER audit_dashboard_students
  AFTER INSERT OR UPDATE OR DELETE ON dashboard_students
  FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

-- Teachers
DROP TRIGGER IF EXISTS audit_teachers ON teachers;
CREATE TRIGGER audit_teachers
  AFTER INSERT OR UPDATE OR DELETE ON teachers
  FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

-- Classes
DROP TRIGGER IF EXISTS audit_classes ON classes;
CREATE TRIGGER audit_classes
  AFTER INSERT OR UPDATE OR DELETE ON classes
  FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

-- Payments
DROP TRIGGER IF EXISTS audit_payments ON payments;
CREATE TRIGGER audit_payments
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

-- Assessment
DROP TRIGGER IF EXISTS audit_assessment ON assessment;
CREATE TRIGGER audit_assessment
  AFTER INSERT OR UPDATE OR DELETE ON assessment
  FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

-- Skills Evaluation
DROP TRIGGER IF EXISTS audit_skills_evaluation ON skills_evaluation;
CREATE TRIGGER audit_skills_evaluation
  AFTER INSERT OR UPDATE OR DELETE ON skills_evaluation
  FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

-- Curriculum
DROP TRIGGER IF EXISTS audit_curriculum ON curriculum;
CREATE TRIGGER audit_curriculum
  AFTER INSERT OR UPDATE OR DELETE ON curriculum
  FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

-- =============================================
-- Helper views for common audit queries
-- =============================================

-- Recent audit activity
CREATE OR REPLACE VIEW recent_audit_activity AS
SELECT
  id,
  table_name,
  record_id,
  action,
  user_email,
  user_role,
  changed_fields,
  created_at
FROM audit_logs
ORDER BY created_at DESC
LIMIT 100;

-- User activity summary
CREATE OR REPLACE VIEW user_activity_summary AS
SELECT
  user_email,
  user_role,
  COUNT(*) as total_actions,
  COUNT(*) FILTER (WHERE action = 'INSERT') as inserts,
  COUNT(*) FILTER (WHERE action = 'UPDATE') as updates,
  COUNT(*) FILTER (WHERE action = 'DELETE') as deletes,
  MAX(created_at) as last_action
FROM audit_logs
WHERE user_email IS NOT NULL
GROUP BY user_email, user_role
ORDER BY last_action DESC;

-- Table activity summary
CREATE OR REPLACE VIEW table_activity_summary AS
SELECT
  table_name,
  COUNT(*) as total_changes,
  COUNT(*) FILTER (WHERE action = 'INSERT') as inserts,
  COUNT(*) FILTER (WHERE action = 'UPDATE') as updates,
  COUNT(*) FILTER (WHERE action = 'DELETE') as deletes,
  MAX(created_at) as last_change
FROM audit_logs
GROUP BY table_name
ORDER BY total_changes DESC;

COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for all data changes';
COMMENT ON FUNCTION log_audit_changes() IS 'Trigger function to automatically log data changes';
