-- ============================================================
-- Align teacher standards access with client authentication
-- and provide sample progress data for Xhoana Strand.
-- ============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'teacher_standards'
      AND policyname = 'Authenticated users can read teacher standards'
  ) THEN
    DROP POLICY "Authenticated users can read teacher standards"
      ON public.teacher_standards;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'teacher_standards'
      AND policyname = 'App users can read teacher standards'
  ) THEN
    DROP POLICY "App users can read teacher standards"
      ON public.teacher_standards;
  END IF;
END $$;

CREATE POLICY "App users can read teacher standards"
  ON public.teacher_standards FOR SELECT
  USING (auth.role() IN ('anon', 'authenticated'));

-- ============================================================
-- Seed representative teacher_standard_progress records so
-- Xhoana Strand has meaningful sample data in the UI.
-- ============================================================
DO $$
DECLARE
  v_teacher_id UUID;
BEGIN
  SELECT id
    INTO v_teacher_id
  FROM public.teachers
  WHERE email = 'xhoana.strand@heroschool.com'
  LIMIT 1;

  IF v_teacher_id IS NULL THEN
    RAISE NOTICE 'Teacher Xhoana Strand not found; skipping sample progress seeding.';
    RETURN;
  END IF;

  WITH selected_standards AS (
    SELECT
      ts.id AS standard_id,
      ts.focus_area_number,
      CASE ts.focus_area_number
        WHEN '1.1' THEN 'approved'
        WHEN '1.2' THEN 'submitted'
        ELSE 'in_progress'
      END AS seeded_status,
      CASE ts.focus_area_number
        WHEN '1.1' THEN timezone('utc', now()) - INTERVAL '8 days'
        WHEN '1.2' THEN timezone('utc', now()) - INTERVAL '3 days'
        ELSE NULL
      END AS seeded_submitted_at,
      CASE ts.focus_area_number
        WHEN '1.1' THEN timezone('utc', now()) - INTERVAL '5 days'
        ELSE NULL
      END AS seeded_approved_at,
      CASE ts.focus_area_number
        WHEN '1.1' THEN 'Approved after classroom observation and mentoring session.'
        WHEN '1.2' THEN 'Submitted phonics differentiation plan for review.'
        ELSE 'Collecting formative assessment samples for upcoming submission.'
      END AS seeded_notes
    FROM public.teacher_standards ts
    WHERE ts.focus_area_number IN ('1.1', '1.2', '1.3')
    ORDER BY ts.focus_area_number
  )
  INSERT INTO public.teacher_standard_progress (
    teacher_id,
    standard_id,
    status,
    submitted_at,
    approved_at,
    notes
  )
  SELECT
    v_teacher_id,
    ss.standard_id,
    ss.seeded_status,
    ss.seeded_submitted_at,
    ss.seeded_approved_at,
    ss.seeded_notes
  FROM selected_standards ss
  ON CONFLICT (teacher_id, standard_id) DO UPDATE
    SET status = EXCLUDED.status,
        submitted_at = EXCLUDED.submitted_at,
        approved_at = EXCLUDED.approved_at,
        notes = EXCLUDED.notes,
        updated_at = timezone('utc', now());
END $$;
