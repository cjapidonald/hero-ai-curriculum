-- ============================================================
-- Ensure teacher standards progress is accessible to app users
-- ============================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'teacher_standard_progress'
      AND policyname = 'Authenticated users can view standard progress'
  ) THEN
    DROP POLICY "Authenticated users can view standard progress"
      ON public.teacher_standard_progress;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'teacher_standard_progress'
      AND policyname = 'Authenticated users can insert standard progress'
  ) THEN
    DROP POLICY "Authenticated users can insert standard progress"
      ON public.teacher_standard_progress;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'teacher_standard_progress'
      AND policyname = 'Authenticated users can update standard progress'
  ) THEN
    DROP POLICY "Authenticated users can update standard progress"
      ON public.teacher_standard_progress;
  END IF;
END $$;

CREATE POLICY "App users can view standard progress"
  ON public.teacher_standard_progress FOR SELECT
  USING (auth.role() IN ('anon', 'authenticated'));

CREATE POLICY "App users can insert standard progress"
  ON public.teacher_standard_progress FOR INSERT
  WITH CHECK (auth.role() IN ('anon', 'authenticated'));

CREATE POLICY "App users can update standard progress"
  ON public.teacher_standard_progress FOR UPDATE
  USING (auth.role() IN ('anon', 'authenticated'))
  WITH CHECK (auth.role() IN ('anon', 'authenticated'));

-- ============================================================
-- Align storage bucket policies with the same access model
-- ============================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Authenticated users can upload teacher standards files'
  ) THEN
    DROP POLICY "Authenticated users can upload teacher standards files"
      ON storage.objects;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Owners can update teacher standards files'
  ) THEN
    DROP POLICY "Owners can update teacher standards files"
      ON storage.objects;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Owners can delete teacher standards files'
  ) THEN
    DROP POLICY "Owners can delete teacher standards files"
      ON storage.objects;
  END IF;
END $$;

CREATE POLICY "App users can upload teacher standards files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'teacher-standards'
    AND auth.role() IN ('anon', 'authenticated')
  );

CREATE POLICY "App users can update teacher standards files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'teacher-standards'
    AND auth.role() IN ('anon', 'authenticated')
  )
  WITH CHECK (
    bucket_id = 'teacher-standards'
    AND auth.role() IN ('anon', 'authenticated')
  );

CREATE POLICY "App users can delete teacher standards files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'teacher-standards'
    AND auth.role() IN ('anon', 'authenticated')
  );
