-- =============================================================
-- Seed sample classes and curriculum lessons for teacher Donald
-- =============================================================

DO $$
DECLARE
  v_teacher_id UUID;
  v_class_starters UUID;
  v_class_movers UUID;
  v_class_flyers UUID;
  v_curriculum_starters UUID;
  v_curriculum_movers UUID;
  v_curriculum_flyers UUID;
BEGIN
  -- Ensure teacher Donald exists and capture the id
  SELECT id INTO v_teacher_id
  FROM public.teachers
  WHERE email = 'donald@heroschool.com'
  LIMIT 1;

  IF v_teacher_id IS NULL THEN
    INSERT INTO public.teachers (
      name,
      surname,
      email,
      username,
      password,
      phone,
      subject,
      is_active
    )
    VALUES (
      'Donald',
      'Cjapi',
      'donald@heroschool.com',
      'donald',
      'teacher123',
      '+84987654321',
      'English',
      true
    )
    RETURNING id INTO v_teacher_id;
  END IF;

  -- Safety check to avoid running the rest of the script without a teacher id
  IF v_teacher_id IS NULL THEN
    RAISE NOTICE 'Skipping Donald sample data seed because teacher id could not be resolved.';
    RETURN;
  END IF;

  -- Upsert Donald's core classes
  INSERT INTO public.classes (
    class_name,
    stage,
    teacher_name,
    teacher_id,
    max_students,
    classroom_location,
    classroom,
    schedule,
    level,
    is_active,
    start_date
  )
  VALUES (
    'Alvin Stage 1',
    'stage_1'::public.cambridge_stage,
    'Donald Cjapi',
    v_teacher_id,
    12,
    'Room B1',
    'B1',
    'Tue & Thu 09:00-10:30',
    'Pre-A1',
    true,
    CURRENT_DATE - 14
  )
  ON CONFLICT (class_name) DO UPDATE
  SET
    stage = EXCLUDED.stage,
    teacher_name = EXCLUDED.teacher_name,
    teacher_id = EXCLUDED.teacher_id,
    max_students = EXCLUDED.max_students,
    classroom_location = EXCLUDED.classroom_location,
    classroom = EXCLUDED.classroom,
    schedule = EXCLUDED.schedule,
    level = EXCLUDED.level,
    is_active = true,
    start_date = EXCLUDED.start_date,
    updated_at = NOW()
  RETURNING id INTO v_class_starters;

  IF v_class_starters IS NULL THEN
    SELECT id INTO v_class_starters FROM public.classes WHERE class_name = 'Alvin Stage 1' LIMIT 1;
  END IF;

  INSERT INTO public.classes (
    class_name,
    stage,
    teacher_name,
    teacher_id,
    max_students,
    classroom_location,
    classroom,
    schedule,
    level,
    is_active,
    start_date
  )
  VALUES (
    'Alvin Stage 2',
    'stage_2'::public.cambridge_stage,
    'Donald Cjapi',
    v_teacher_id,
    10,
    'Room B2',
    'B2',
    'Mon & Wed 14:00-15:30',
    'A1',
    true,
    CURRENT_DATE - 21
  )
  ON CONFLICT (class_name) DO UPDATE
  SET
    stage = EXCLUDED.stage,
    teacher_name = EXCLUDED.teacher_name,
    teacher_id = EXCLUDED.teacher_id,
    max_students = EXCLUDED.max_students,
    classroom_location = EXCLUDED.classroom_location,
    classroom = EXCLUDED.classroom,
    schedule = EXCLUDED.schedule,
    level = EXCLUDED.level,
    is_active = true,
    start_date = EXCLUDED.start_date,
    updated_at = NOW()
  RETURNING id INTO v_class_movers;

  IF v_class_movers IS NULL THEN
    SELECT id INTO v_class_movers FROM public.classes WHERE class_name = 'Alvin Stage 2' LIMIT 1;
  END IF;

  INSERT INTO public.classes (
    class_name,
    stage,
    teacher_name,
    teacher_id,
    max_students,
    classroom_location,
    classroom,
    schedule,
    level,
    is_active,
    start_date
  )
  VALUES (
    'Alvin Stage 3',
    'stage_3'::public.cambridge_stage,
    'Donald Cjapi',
    v_teacher_id,
    8,
    'Room C1',
    'C1',
    'Fri 16:00-17:30',
    'A2',
    true,
    CURRENT_DATE - 7
  )
  ON CONFLICT (class_name) DO UPDATE
  SET
    stage = EXCLUDED.stage,
    teacher_name = EXCLUDED.teacher_name,
    teacher_id = EXCLUDED.teacher_id,
    max_students = EXCLUDED.max_students,
    classroom_location = EXCLUDED.classroom_location,
    classroom = EXCLUDED.classroom,
    schedule = EXCLUDED.schedule,
    level = EXCLUDED.level,
    is_active = true,
    start_date = EXCLUDED.start_date,
    updated_at = NOW()
  RETURNING id INTO v_class_flyers;

  IF v_class_flyers IS NULL THEN
    SELECT id INTO v_class_flyers FROM public.classes WHERE class_name = 'Alvin Stage 3' LIMIT 1;
  END IF;

  -- Seed sample curriculum lessons for Donald
  INSERT INTO public.curriculum (
    teacher_id,
    teacher_name,
    class,
    class_id,
    stage,
    curriculum_stage,
    title,
    subject,
    lesson_title,
    lesson_date,
    lesson_skills,
    success_criteria,
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
  SELECT
    v_teacher_id,
    'Donald Cjapi',
    'Alvin Stage 1',
    v_class_starters,
    'Stage 1',
    'Stage 1',
    'Alvin Stage 1 - Unit 1: Welcome to Class',
    'English',
    'Alvin Stage 1 - Unit 1: Welcome to Class',
    CURRENT_DATE + 1,
    'Speaking, Listening',
    'Students can greet classmates and share one fact about themselves.',
    'video',
    'Warm-up: Hello Song',
    'https://videos.heroschool.com/hello-song',
    'activity',
    'Main Activity: Classroom Scavenger Hunt',
    'https://activities.heroschool.com/classroom-scavenger',
    'assessment',
    'Exit Ticket: Share One New Friend''s Name',
    'https://forms.heroschool.com/alvin-stage1-welcome-checkout',
    'homework',
    'Family Interview: My School Day',
    'https://printables.heroschool.com/family-interview'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.curriculum WHERE lesson_title = 'Alvin Stage 1 - Unit 1: Welcome to Class'
  );

  SELECT id INTO v_curriculum_starters
  FROM public.curriculum
  WHERE lesson_title = 'Alvin Stage 1 - Unit 1: Welcome to Class'
  LIMIT 1;

  INSERT INTO public.curriculum (
    teacher_id,
    teacher_name,
    class,
    class_id,
    stage,
    curriculum_stage,
    title,
    subject,
    lesson_title,
    lesson_date,
    lesson_skills,
    success_criteria,
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
  SELECT
    v_teacher_id,
    'Donald Cjapi',
    'Alvin Stage 2',
    v_class_movers,
    'Stage 2',
    'Stage 2',
    'Alvin Stage 2 - Project: My Town',
    'English',
    'Alvin Stage 2 - Project: My Town',
    CURRENT_DATE + 3,
    'Project Work, Writing',
    'Students can describe three key places in a town using complete sentences.',
    'presentation',
    'Warm-up: Town Vocabulary Cards',
    'https://slides.heroschool.com/town-vocabulary',
    'project',
    'Main Task: Build Our Ideal Town Map',
    'https://projects.heroschool.com/ideal-town-map',
    'assessment',
    'Gallery Walk Peer Feedback',
    'https://rubrics.heroschool.com/alvin-stage2-peer-feedback',
    'homework',
    'Write a Postcard from Your Town',
    'https://assignments.heroschool.com/postcard-template'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.curriculum WHERE lesson_title = 'Alvin Stage 2 - Project: My Town'
  );

  SELECT id INTO v_curriculum_movers
  FROM public.curriculum
  WHERE lesson_title = 'Alvin Stage 2 - Project: My Town'
  LIMIT 1;

  INSERT INTO public.curriculum (
    teacher_id,
    teacher_name,
    class,
    class_id,
    stage,
    curriculum_stage,
    title,
    subject,
    lesson_title,
    lesson_date,
    lesson_skills,
    success_criteria,
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
  SELECT
    v_teacher_id,
    'Donald Cjapi',
    'Alvin Stage 3',
    v_class_flyers,
    'Stage 3',
    'Stage 3',
    'Alvin Stage 3 - Reading Adventure',
    'English',
    'Alvin Stage 3 - Reading Adventure',
    CURRENT_DATE + 5,
    'Reading, Discussion',
    'Students can summarise a narrative text and identify the main problem and solution.',
    'reading',
    'Warm-up: Character Trait Match',
    'https://activities.heroschool.com/character-traits',
    'activity',
    'Main Activity: Jigsaw Reading Circles',
    'https://activities.heroschool.com/jigsaw-reading',
    'assessment',
    'Exit Quiz: Plot & Problem',
    'https://quizzes.heroschool.com/alvin-stage3-plot-problem',
    'homework',
    'Reading Log: Adventure Stories',
    'https://printables.heroschool.com/alvin-stage3-reading-log'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.curriculum WHERE lesson_title = 'Alvin Stage 3 - Reading Adventure'
  );

  SELECT id INTO v_curriculum_flyers
  FROM public.curriculum
  WHERE lesson_title = 'Alvin Stage 3 - Reading Adventure'
  LIMIT 1;

  -- Create linked class sessions so teachers can see scheduling examples
  IF v_class_starters IS NOT NULL AND v_curriculum_starters IS NOT NULL THEN
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
      notes
    )
    SELECT
      v_teacher_id,
      v_class_starters,
      v_curriculum_starters,
      CURRENT_DATE + 1,
      '09:00',
      '10:30',
      'scheduled',
      'Room B1',
      11,
      'Greet-and-meet session with scavenger hunt activity'
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.class_sessions
      WHERE teacher_id = v_teacher_id
        AND class_id = v_class_starters
        AND session_date = CURRENT_DATE + 1
        AND start_time = '09:00'
    );
  END IF;

  IF v_class_movers IS NOT NULL AND v_curriculum_movers IS NOT NULL THEN
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
      notes
    )
    SELECT
      v_teacher_id,
      v_class_movers,
      v_curriculum_movers,
      CURRENT_DATE + 3,
      '14:00',
      '15:30',
      'scheduled',
      'Room B2',
      9,
      'Project work block to build the class town map'
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.class_sessions
      WHERE teacher_id = v_teacher_id
        AND class_id = v_class_movers
        AND session_date = CURRENT_DATE + 3
        AND start_time = '14:00'
    );
  END IF;

  IF v_class_flyers IS NOT NULL AND v_curriculum_flyers IS NOT NULL THEN
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
      notes
    )
    SELECT
      v_teacher_id,
      v_class_flyers,
      v_curriculum_flyers,
      CURRENT_DATE + 5,
      '16:00',
      '17:30',
      'scheduled',
      'Room C1',
      8,
      'Reading circles and discussion on narrative structure'
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.class_sessions
      WHERE teacher_id = v_teacher_id
        AND class_id = v_class_flyers
        AND session_date = CURRENT_DATE + 5
        AND start_time = '16:00'
    );
  END IF;
END $$;
