DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'teacher_evaluations'
  ) THEN
    RAISE NOTICE 'teacher_evaluations table already exists, skipping creation.';
    RETURN;
  END IF;

  CREATE TABLE public.teacher_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES public.admins(id) ON DELETE SET NULL,
    score NUMERIC(5,2) NOT NULL,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  COMMENT ON TABLE public.teacher_evaluations IS 'Stores classroom observation evaluations for teachers.';
  COMMENT ON COLUMN public.teacher_evaluations.teacher_id IS 'The teacher being evaluated.';
  COMMENT ON COLUMN public.teacher_evaluations.admin_id IS 'Admin who created the evaluation.';

  -- Keep updated_at fresh
  CREATE TRIGGER update_teacher_evaluations_updated_at
    BEFORE UPDATE ON public.teacher_evaluations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  ALTER TABLE public.teacher_evaluations ENABLE ROW LEVEL SECURITY;

  -- Grant authenticated users read/write access; tighten as needed later.
  CREATE POLICY "Allow authenticated access"
    ON public.teacher_evaluations
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

  ALTER PUBLICATION supabase_realtime ADD TABLE public.teacher_evaluations;
END $$;
