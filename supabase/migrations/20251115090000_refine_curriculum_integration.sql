-- =============================================
-- Refine curriculum schema and seed teacher data
-- =============================================
-- Adds relational columns for curriculum records so
-- they can be linked to classes and lesson metadata,
-- then ensures every active teacher has at least five
-- curriculum lessons and scheduled class sessions.

-- Extend curriculum table with relational metadata
ALTER TABLE public.curriculum
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS class TEXT,
  ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS stage TEXT,
  ADD COLUMN IF NOT EXISTS curriculum_stage TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS lesson_number INTEGER,
  ADD COLUMN IF NOT EXISTS objectives TEXT[],
  ADD COLUMN IF NOT EXISTS status TEXT,
  ADD COLUMN IF NOT EXISTS school TEXT;

-- Backfill newly added metadata where possible
UPDATE public.curriculum
SET title = lesson_title
WHERE title IS NULL;

UPDATE public.curriculum
SET stage = COALESCE(stage, curriculum_stage, 'Stage 1'),
    curriculum_stage = COALESCE(curriculum_stage, stage, 'Stage 1')
WHERE stage IS NULL OR curriculum_stage IS NULL;

UPDATE public.curriculum
SET status = COALESCE(status, 'scheduled')
WHERE status IS NULL;

UPDATE public.curriculum
SET school = COALESCE(school, 'HeroSchool Main Campus')
WHERE school IS NULL;

-- Ensure each active teacher has rich curriculum + sessions
DO $$
DECLARE
  teacher_rec RECORD;
  class_rec RECORD;
  existing_count INT;
  to_create INT;
  idx INT;
  lesson_title_text TEXT;
  lesson_date_val DATE;
  stage_label TEXT;
  level_label TEXT;
  subject_label TEXT;
  status_cycle TEXT[] := ARRAY['ready', 'building', 'scheduled', 'scheduled', 'scheduled'];
  topic_cycle TEXT[] := ARRAY['Communication Skills', 'Reading Explorers', 'Project Collaboration', 'Assessment Workshop', 'Global Cultures'];
  start_times TEXT[] := ARRAY['09:00', '11:00', '14:00', '16:00', '18:00'];
  end_times TEXT[] := ARRAY['10:15', '12:15', '15:15', '17:15', '19:15'];
  status_value TEXT;
  topic_value TEXT;
  start_slot TEXT;
  end_slot TEXT;
  required_lessons CONSTANT INT := 5;
  new_curriculum_id UUID;
  total_students INT;
  base_date DATE := CURRENT_DATE;
BEGIN
  FOR teacher_rec IN
    SELECT t.*, row_number() OVER (ORDER BY t.name, t.surname) AS row_index
    FROM public.teachers t
    WHERE COALESCE(t.is_active, true)
  LOOP
    -- Locate or create a primary class for the teacher
    SELECT id, class_name, stage, level, max_students
    INTO class_rec
    FROM public.classes
    WHERE teacher_id = teacher_rec.id
      AND COALESCE(is_active, true)
    ORDER BY start_date DESC NULLS LAST
    LIMIT 1;

    IF class_rec.id IS NULL THEN
      INSERT INTO public.classes (
        class_name,
        stage,
        level,
        teacher_name,
        teacher_id,
        max_students,
        classroom_location,
        classroom,
        schedule,
        is_active,
        start_date
      )
      VALUES (
        teacher_rec.name || ' Cohort A',
        'stage_1'::public.cambridge_stage,
        'Pre-A1',
        teacher_rec.name || ' ' || teacher_rec.surname,
        teacher_rec.id,
        12,
        'Main Campus',
        'Room 101',
        'Mon & Wed 09:00-10:30',
        true,
        base_date
      )
      ON CONFLICT (class_name) DO UPDATE
      SET
        stage = EXCLUDED.stage,
        level = EXCLUDED.level,
        teacher_name = EXCLUDED.teacher_name,
        teacher_id = EXCLUDED.teacher_id,
        is_active = true,
        updated_at = NOW()
      RETURNING id, class_name, stage, level, max_students INTO class_rec;
    END IF;

    stage_label := COALESCE(
      CASE
        WHEN class_rec.stage IS NULL THEN 'Stage 1'
        ELSE 'Stage ' || split_part(class_rec.stage::text, '_', 2)
      END,
      'Stage 1'
    );

    level_label := COALESCE(class_rec.level, stage_label);
    subject_label := COALESCE(teacher_rec.subject, 'English');
    total_students := COALESCE(class_rec.max_students, 12);

    SELECT COUNT(*) INTO existing_count
    FROM public.curriculum
    WHERE teacher_id = teacher_rec.id;

    IF existing_count < required_lessons THEN
      to_create := required_lessons - existing_count;

      FOR idx IN 1..to_create LOOP
        topic_value := topic_cycle[((existing_count + idx - 1) % array_length(topic_cycle, 1)) + 1];
        status_value := status_cycle[((existing_count + idx - 1) % array_length(status_cycle, 1)) + 1];
        start_slot := start_times[((existing_count + idx - 1) % array_length(start_times, 1)) + 1];
        end_slot := end_times[((existing_count + idx - 1) % array_length(end_times, 1)) + 1];
        lesson_title_text := format('%s - Lesson %s: %s', class_rec.class_name, existing_count + idx, topic_value);
        lesson_date_val := base_date + (idx - 1) + (teacher_rec.row_index * 2);

        SELECT id INTO new_curriculum_id
        FROM public.curriculum
        WHERE teacher_id = teacher_rec.id
          AND lesson_title = lesson_title_text
        LIMIT 1;

        IF new_curriculum_id IS NULL THEN
          INSERT INTO public.curriculum (
            teacher_id,
            teacher_name,
            subject,
            lesson_title,
            title,
            lesson_date,
            class,
            class_id,
            stage,
            curriculum_stage,
            lesson_number,
            lesson_skills,
            success_criteria,
            description,
            objectives,
            status,
            school,
            wp1_type,
            wp1_name,
            wp1_url,
            ma1_type,
            ma1_name,
            ma1_url,
            a1_type,
            a1_name,
            a1_url,
            hw1_type,
            hw1_name,
            hw1_url
          )
          VALUES (
            teacher_rec.id,
            teacher_rec.name || ' ' || teacher_rec.surname,
            subject_label,
            lesson_title_text,
            lesson_title_text,
            lesson_date_val,
            class_rec.class_name,
            class_rec.id,
            stage_label,
            stage_label,
            existing_count + idx,
            topic_value || ' focus',
            format('Students demonstrate %s outcomes aligned to %s.', lower(topic_value), level_label),
            format('Auto-generated lesson for %s covering %s themes.', stage_label, lower(topic_value)),
            ARRAY[
              format('Introduce %s context with collaborative activities.', lower(topic_value)),
              format('Guide students to apply %s in real scenarios.', lower(topic_value))
            ],
            'scheduled',
            'HeroSchool Main Campus',
            'warmup',
            format('%s Warmup', topic_value),
            'https://resources.heroschool.com/warmup',
            'activity',
            format('%s Main Task', topic_value),
            'https://resources.heroschool.com/activity',
            'assessment',
            format('%s Exit Ticket', topic_value),
            'https://resources.heroschool.com/assessment',
            'homework',
            format('%s Home Practice', topic_value),
            'https://resources.heroschool.com/homework'
          )
          RETURNING id INTO new_curriculum_id;
        ELSE
          UPDATE public.curriculum
          SET
            lesson_date = lesson_date_val,
            class = class_rec.class_name,
            class_id = class_rec.id,
            stage = stage_label,
            curriculum_stage = stage_label,
            lesson_number = existing_count + idx,
            subject = subject_label,
            teacher_name = teacher_rec.name || ' ' || teacher_rec.surname,
            status = 'scheduled',
            school = 'HeroSchool Main Campus'
          WHERE id = new_curriculum_id;
        END IF;

        INSERT INTO public.class_sessions (
          teacher_id,
          class_id,
          curriculum_id,
          session_date,
          start_time,
          end_time,
          status,
          location,
          total_students,
          attendance_taken,
          attendance_count,
          lesson_plan_completed,
          lesson_plan_data,
          notes
        )
        SELECT
          teacher_rec.id,
          class_rec.id,
          new_curriculum_id,
          lesson_date_val,
          start_slot,
          end_slot,
          status_value,
          'Main Campus - Room 101',
          total_students,
          false,
          0,
          (status_value = 'ready'),
          CASE
            WHEN status_value = 'ready' THEN jsonb_build_object(
              'total_duration', 60,
              'resources', jsonb_build_array(
                jsonb_build_object('id', 'warmup', 'title', format('%s Warmup', topic_value), 'type', 'warmup', 'duration', 10, 'notes', 'Auto-generated warmup', 'position', 0),
                jsonb_build_object('id', 'activity', 'title', format('%s Main Task', topic_value), 'type', 'activity', 'duration', 35, 'notes', 'Guided practice sequence', 'position', 1),
                jsonb_build_object('id', 'assessment', 'title', format('%s Exit Ticket', topic_value), 'type', 'assessment', 'duration', 15, 'notes', 'Check for understanding', 'position', 2)
              )
            )
            ELSE NULL
          END,
          'Auto-generated session linked to curriculum'
        WHERE NOT EXISTS (
          SELECT 1 FROM public.class_sessions
          WHERE teacher_id = teacher_rec.id
            AND class_id = class_rec.id
            AND session_date = lesson_date_val
            AND start_time = start_slot
        );
      END LOOP;
    END IF;
  END LOOP;
END $$;
