-- ======================================================
-- CALENDAR SESSIONS SETUP & SAMPLE DATA FOR ADMIN FILTER
-- ======================================================

-- Create calendar_sessions table if it does not exist yet
CREATE TABLE IF NOT EXISTS public.calendar_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  class_name TEXT NOT NULL,
  lesson_title TEXT,
  session_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT DEFAULT 'scheduled',
  attendance_taken BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (teacher_id, session_date, start_time)
);

CREATE INDEX IF NOT EXISTS calendar_sessions_teacher_id_idx
  ON public.calendar_sessions (teacher_id);

CREATE INDEX IF NOT EXISTS calendar_sessions_session_date_idx
  ON public.calendar_sessions (session_date);

-- Ensure at least two demo teachers exist for calendar illustrations
DO $$
DECLARE
  donald_id UUID;
  sarah_id UUID;
BEGIN
  SELECT id INTO donald_id FROM public.teachers WHERE email = 'donald@heroschool.com' LIMIT 1;
  IF donald_id IS NULL THEN
    INSERT INTO public.teachers (name, surname, email, username, password, phone, subject, is_active)
    VALUES ('Donald', 'Cjapi', 'donald@heroschool.com', 'donald', 'teacher123', '+84987654321', 'English', true)
    RETURNING id INTO donald_id;
  END IF;

  SELECT id INTO sarah_id FROM public.teachers WHERE email = 'sarah@heroschool.com' LIMIT 1;
  IF sarah_id IS NULL THEN
    INSERT INTO public.teachers (name, surname, email, username, password, phone, subject, is_active)
    VALUES ('Sarah', 'Nguyen', 'sarah@heroschool.com', 'sarah', 'teacher123', '+84912345670', 'Science', true)
    RETURNING id INTO sarah_id;
  END IF;

  -- Fallback guard to avoid inserting sessions without teachers
  IF donald_id IS NULL OR sarah_id IS NULL THEN
    RAISE NOTICE 'Skipping calendar session seed: missing teacher ids';
    RETURN;
  END IF;

  INSERT INTO public.calendar_sessions (
    teacher_id,
    class_name,
    lesson_title,
    session_date,
    start_time,
    end_time,
    status,
    attendance_taken
  )
  VALUES
    (donald_id, 'Starters A', 'Unit 3: Fun with Phonics', (CURRENT_DATE + 1), '09:00', '10:30', 'scheduled', false),
    (donald_id, 'Starters A', 'Unit 3 Review Workshop', (CURRENT_DATE + 3), '09:00', '10:30', 'scheduled', false),
    (sarah_id, 'Movers B', 'Science Lab: Ecosystems', (CURRENT_DATE + 2), '14:00', '15:30', 'scheduled', false),
    (sarah_id, 'Movers B', 'STEM Project Check-in', (CURRENT_DATE + 5), '14:00', '15:30', 'scheduled', false)
  ON CONFLICT (teacher_id, session_date, start_time) DO NOTHING;
END $$;
