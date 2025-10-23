-- Create audit_logs table to track critical data changes
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id TEXT,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  changed_fields TEXT[] DEFAULT ARRAY[]::TEXT[],
  user_email TEXT,
  user_role TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure fast lookups by table and timestamp
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Enable row level security but keep demo-friendly access (matches existing tables)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow application clients to read audit history
CREATE POLICY IF NOT EXISTS "Allow all for audit logs"
  ON public.audit_logs
  FOR SELECT
  USING (true);

-- Allow application clients to write audit entries
CREATE POLICY IF NOT EXISTS "Allow insert for audit logs"
  ON public.audit_logs
  FOR INSERT
  WITH CHECK (true);
