-- Migration: align class_sessions RLS policies with Supabase Auth identifiers

DROP POLICY IF EXISTS "Teachers can view their own class sessions" ON class_sessions;
DROP POLICY IF EXISTS "Teachers can create their own class sessions" ON class_sessions;
DROP POLICY IF EXISTS "Teachers can update their own class sessions" ON class_sessions;
DROP POLICY IF EXISTS "Teachers can delete their own class sessions" ON class_sessions;

CREATE POLICY "Teachers can view their own class sessions"
  ON class_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM teachers t
      WHERE t.id = class_sessions.teacher_id
        AND t.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can create their own class sessions"
  ON class_sessions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM teachers t
      WHERE t.id = class_sessions.teacher_id
        AND t.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update their own class sessions"
  ON class_sessions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM teachers t
      WHERE t.id = class_sessions.teacher_id
        AND t.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can delete their own class sessions"
  ON class_sessions FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM teachers t
      WHERE t.id = class_sessions.teacher_id
        AND t.auth_user_id = auth.uid()
    )
  );
