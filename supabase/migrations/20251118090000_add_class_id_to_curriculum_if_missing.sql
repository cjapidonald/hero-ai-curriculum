DO $$
BEGIN
  -- Ensure curriculum table has a class_id column for linking lessons to classes
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'curriculum'
      AND column_name = 'class_id'
  ) THEN
    ALTER TABLE public.curriculum
      ADD COLUMN class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL;
  END IF;
END $$;
