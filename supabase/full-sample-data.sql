-- Hero School Dashboard - Full Sample Dataset
-- Run this after executing dashboard-schema.sql to seed every table with cohesive data.
-- The script is idempotent: run it multiple times without creating duplicates.

-- =============================================
-- USERS
-- =============================================
INSERT INTO public.users (email, full_name, role, phone)
VALUES
  ('admin@heroschool.com', 'Hero School Admin', 'admin', '0901122334'),
  ('donald@heroschool.com', 'Donald Chapman', 'teacher', '0981646304'),
  ('emma@student.com', 'Emma Nguyen', 'student', '0900000001')
ON CONFLICT (email) DO NOTHING;

-- =============================================
-- TEACHERS
-- =============================================
INSERT INTO public.teachers (name, surname, email, password, subject, phone, bio)
VALUES
  ('Donald', 'Chapman', 'donald@heroschool.com', 'teacher123', 'English', '0981646304', 'Experienced Cambridge English teacher specializing in Young Learners'),
  ('Sarah', 'Johnson', 'sarah@heroschool.com', 'teacher123', 'English', '0981234567', 'Passionate about early childhood English education'),
  ('Michael', 'Chen', 'michael@heroschool.com', 'teacher123', 'English', '0981234568', 'Cambridge certified with 8 years experience')
ON CONFLICT (email) DO NOTHING;

-- =============================================
-- PARENTS
-- =============================================
INSERT INTO public.parents (full_name, email, phone, preferred_contact, address, how_did_hear, agree_to_updates)
SELECT 'Mai Nguyen', 'mai.parent@example.com', '0900000001', 'phone', 'Smart City Tower A', 'Friend referral', true
WHERE NOT EXISTS (SELECT 1 FROM public.parents WHERE email = 'mai.parent@example.com');

INSERT INTO public.parents (full_name, email, phone, preferred_contact, address, how_did_hear, agree_to_updates)
SELECT 'Bao Tran', 'bao.tran@example.com', '0900000002', 'zalo', 'Imperia Garden Block B', 'Facebook', false
WHERE NOT EXISTS (SELECT 1 FROM public.parents WHERE email = 'bao.tran@example.com');

INSERT INTO public.parents (full_name, email, phone, preferred_contact, address, how_did_hear, agree_to_updates)
SELECT 'Lan Pham', 'lan.pham@example.com', '0900000003', 'email', 'Vincom Mall Residences', 'School event', true
WHERE NOT EXISTS (SELECT 1 FROM public.parents WHERE email = 'lan.pham@example.com');

-- =============================================
-- STUDENTS (Parent-linked)
-- =============================================
INSERT INTO public.students (parent_id, full_name, date_of_birth, age, current_level, assigned_stage, status, enrollment_date, profile_photo_url, notes)
SELECT p.id, 'Emma Nguyen', '2016-05-15', 9, 'some_english', 'stage_2', 'active', '2025-05-01', NULL, 'Enjoys speaking activities'
FROM public.parents p
WHERE p.email = 'mai.parent@example.com'
  AND NOT EXISTS (SELECT 1 FROM public.students WHERE full_name = 'Emma Nguyen');

INSERT INTO public.students (parent_id, full_name, date_of_birth, age, current_level, assigned_stage, status, enrollment_date, profile_photo_url, notes)
SELECT p.id, 'Liam Tran', '2015-11-20', 9, 'beginner', 'stage_1', 'active', '2025-05-01', NULL, 'Needs phonics support'
FROM public.parents p
WHERE p.email = 'bao.tran@example.com'
  AND NOT EXISTS (SELECT 1 FROM public.students WHERE full_name = 'Liam Tran');

INSERT INTO public.students (parent_id, full_name, date_of_birth, age, current_level, assigned_stage, status, enrollment_date, profile_photo_url, notes)
SELECT p.id, 'Olivia Pham', '2014-09-12', 10, 'confident', 'stage_3', 'active', '2025-05-01', NULL, 'Strong reader'
FROM public.parents p
WHERE p.email = 'lan.pham@example.com'
  AND NOT EXISTS (SELECT 1 FROM public.students WHERE full_name = 'Olivia Pham');

-- =============================================
-- DASHBOARD STUDENTS (for teacher view)
-- =============================================
INSERT INTO public.dashboard_students (name, surname, email, password, class, gender, subject, level, birthday, attendance_rate, parent_name, parent_zalo_nr, location, placement_test_speaking, placement_test_listening, placement_test_reading, placement_test_writing, sessions, sessions_left, profile_image_url)
VALUES
  ('Emma', 'Nguyen', 'emma@student.com', 'student123', 'Starters A', 'Female', 'English', 'Pre-A1', '2016-05-15', 95.5, 'Mai Nguyen', '0900000001', 'Smart City Tower A', 'Good', 'Excellent', 'Good', 'Good', 40, 20, NULL),
  ('Liam', 'Tran', 'liam@student.com', 'student123', 'Starters A', 'Male', 'English', 'Pre-A1', '2015-11-20', 88.3, 'Bao Tran', '0900000002', 'Imperia Garden Block B', 'Developing', 'Good', 'Fair', 'Fair', 38, 22, NULL),
  ('Olivia', 'Pham', 'olivia@student.com', 'student123', 'Movers A', 'Female', 'English', 'A1', '2014-09-12', 92.0, 'Lan Pham', '0900000003', 'Vincom Mall Residences', 'Excellent', 'Excellent', 'Good', 'Excellent', 42, 18, NULL)
ON CONFLICT (email) DO NOTHING;

-- =============================================
-- CLASSES
-- =============================================
INSERT INTO public.classes (class_name, stage, teacher_name, max_students, schedule_days, start_time, end_time, classroom_location, start_date, end_date)
SELECT 'Starters A', 'stage_1', 'Donald Chapman', 12, ARRAY['monday','wednesday']::public.class_day[], '17:00', '18:30', 'Room 101', '2025-05-05', '2025-08-30'
WHERE NOT EXISTS (SELECT 1 FROM public.classes WHERE class_name = 'Starters A');

INSERT INTO public.classes (class_name, stage, teacher_name, max_students, schedule_days, start_time, end_time, classroom_location, start_date, end_date)
SELECT 'Movers A', 'stage_3', 'Sarah Johnson', 12, ARRAY['tuesday','thursday']::public.class_day[], '16:30', '18:00', 'Room 203', '2025-05-06', '2025-08-31'
WHERE NOT EXISTS (SELECT 1 FROM public.classes WHERE class_name = 'Movers A');

INSERT INTO public.classes (class_name, stage, teacher_name, max_students, schedule_days, start_time, end_time, classroom_location, start_date, end_date)
SELECT 'Flyers A', 'stage_5', 'Michael Chen', 10, ARRAY['saturday']::public.class_day[], '09:00', '11:00', 'Room 305', '2025-05-10', '2025-09-15'
WHERE NOT EXISTS (SELECT 1 FROM public.classes WHERE class_name = 'Flyers A');

-- =============================================
-- ENROLLMENTS
-- =============================================
INSERT INTO public.enrollments (student_id, class_id, enrollment_date, completion_date, is_active, attendance_rate, progress_notes)
SELECT s.id, c.id, '2025-05-06', NULL, true, 95.5, 'Confident participation'
FROM public.students s
JOIN public.classes c ON c.class_name = 'Starters A'
WHERE s.full_name = 'Emma Nguyen'
  AND NOT EXISTS (SELECT 1 FROM public.enrollments e WHERE e.student_id = s.id AND e.class_id = c.id);

INSERT INTO public.enrollments (student_id, class_id, enrollment_date, completion_date, is_active, attendance_rate, progress_notes)
SELECT s.id, c.id, '2025-05-06', NULL, true, 88.3, 'Improving pronunciation'
FROM public.students s
JOIN public.classes c ON c.class_name = 'Starters A'
WHERE s.full_name = 'Liam Tran'
  AND NOT EXISTS (SELECT 1 FROM public.enrollments e WHERE e.student_id = s.id AND e.class_id = c.id);

INSERT INTO public.enrollments (student_id, class_id, enrollment_date, completion_date, is_active, attendance_rate, progress_notes)
SELECT s.id, c.id, '2025-05-10', NULL, true, 92.0, 'Strong reading skills'
FROM public.students s
JOIN public.classes c ON c.class_name = 'Movers A'
WHERE s.full_name = 'Olivia Pham'
  AND NOT EXISTS (SELECT 1 FROM public.enrollments e WHERE e.student_id = s.id AND e.class_id = c.id);

-- =============================================
-- ATTENDANCE
-- =============================================
INSERT INTO public.attendance (enrollment_id, class_date, present, late, notes, recorded_by)
SELECT e.id, '2025-06-01', true, false, 'Active participation', t.id
FROM public.enrollments e
JOIN public.students s ON s.id = e.student_id
JOIN public.classes c ON c.id = e.class_id
JOIN public.teachers t ON t.email = 'donald@heroschool.com'
WHERE s.full_name = 'Emma Nguyen' AND c.class_name = 'Starters A'
  AND NOT EXISTS (SELECT 1 FROM public.attendance a WHERE a.enrollment_id = e.id AND a.class_date = '2025-06-01');

INSERT INTO public.attendance (enrollment_id, class_date, present, late, notes, recorded_by)
SELECT e.id, '2025-06-01', true, true, 'Arrived late due to traffic', t.id
FROM public.enrollments e
JOIN public.students s ON s.id = e.student_id
JOIN public.classes c ON c.id = e.class_id
JOIN public.teachers t ON t.email = 'donald@heroschool.com'
WHERE s.full_name = 'Liam Tran' AND c.class_name = 'Starters A'
  AND NOT EXISTS (SELECT 1 FROM public.attendance a WHERE a.enrollment_id = e.id AND a.class_date = '2025-06-01');

INSERT INTO public.attendance (enrollment_id, class_date, present, late, notes, recorded_by)
SELECT e.id, '2025-06-03', true, false, 'Excellent teamwork', t.id
FROM public.enrollments e
JOIN public.students s ON s.id = e.student_id
JOIN public.classes c ON c.id = e.class_id
JOIN public.teachers t ON t.email = 'sarah@heroschool.com'
WHERE s.full_name = 'Olivia Pham' AND c.class_name = 'Movers A'
  AND NOT EXISTS (SELECT 1 FROM public.attendance a WHERE a.enrollment_id = e.id AND a.class_date = '2025-06-03');

-- =============================================
-- CURRICULUM
-- =============================================
INSERT INTO public.curriculum (teacher_id, teacher_name, subject, lesson_title, lesson_date, lesson_skills, success_criteria, wp1_type, wp1_url, wp1_name, ma1_type, ma1_url, ma1_name, a1_type, a1_url, a1_name, hw1_type, hw1_url, hw1_name)
SELECT t.id, 'Donald Chapman', 'English', 'Unit 1 - Greetings', '2025-06-01', 'Speaking, Listening', 'Students greet classmates confidently',
       'pdf', 'https://example.com/resources/unit1-warmup.pdf', 'Greeting Flashcards',
       'pdf', 'https://example.com/resources/unit1-main.pdf', 'Role-play Dialogues',
       'pdf', 'https://example.com/resources/unit1-assessment.pdf', 'Exit Ticket',
       'pdf', 'https://example.com/resources/unit1-homework.pdf', 'Practice Worksheet'
FROM public.teachers t
WHERE t.email = 'donald@heroschool.com'
  AND NOT EXISTS (SELECT 1 FROM public.curriculum WHERE lesson_title = 'Unit 1 - Greetings');

INSERT INTO public.curriculum (teacher_id, teacher_name, subject, lesson_title, lesson_date, lesson_skills, success_criteria, wp1_type, wp1_url, wp1_name, ma1_type, ma1_url, ma1_name, a1_type, a1_url, a1_name, hw1_type, hw1_url, hw1_name)
SELECT t.id, 'Sarah Johnson', 'English', 'Unit 3 - My Town', '2025-06-04', 'Vocabulary, Writing', 'Students describe places in town',
       'pdf', 'https://example.com/resources/unit3-warmup.pdf', 'Town Bingo',
       'pdf', 'https://example.com/resources/unit3-main.pdf', 'Map Labelling',
       'pdf', 'https://example.com/resources/unit3-assessment.pdf', 'Picture Dictation',
       'pdf', 'https://example.com/resources/unit3-homework.pdf', 'Write About Your Town'
FROM public.teachers t
WHERE t.email = 'sarah@heroschool.com'
  AND NOT EXISTS (SELECT 1 FROM public.curriculum WHERE lesson_title = 'Unit 3 - My Town');

-- =============================================
-- HOMEWORK COMPLETION
-- =============================================
INSERT INTO public.homework_completion (student_id, curriculum_id, homework_item, completed, completed_date, notes)
SELECT s.id, c.id, 'Unit 1 - Greetings Worksheet', true, '2025-06-02 18:00:00+07', 'Practiced with parent'
FROM public.students s
JOIN public.curriculum c ON c.lesson_title = 'Unit 1 - Greetings'
WHERE s.full_name = 'Emma Nguyen'
  AND NOT EXISTS (
    SELECT 1 FROM public.homework_completion h
    WHERE h.student_id = s.id AND h.curriculum_id = c.id AND h.homework_item = 'Unit 1 - Greetings Worksheet'
  );

INSERT INTO public.homework_completion (student_id, curriculum_id, homework_item, completed, completed_date, notes)
SELECT s.id, c.id, 'Unit 3 - Town Writing Task', false, NULL, 'Bring to next class'
FROM public.students s
JOIN public.curriculum c ON c.lesson_title = 'Unit 3 - My Town'
WHERE s.full_name = 'Olivia Pham'
  AND NOT EXISTS (
    SELECT 1 FROM public.homework_completion h
    WHERE h.student_id = s.id AND h.curriculum_id = c.id AND h.homework_item = 'Unit 3 - Town Writing Task'
  );

-- =============================================
-- ASSESSMENTS
-- =============================================
INSERT INTO public.assessment (teacher_id, student_id, student_name, class, test_name, rubrics, r1, r1_score, r2, r2_score, r3, r3_score, r4, r4_score, r5, r5_score, total_score, published, assessment_date, feedback)
SELECT t.id, ds.id, 'Emma Nguyen', 'Starters A', 'Speaking Check 1', 'Pronunciation & Fluency',
       'Pronunciation', 4.5, 'Fluency', 4.0, 'Vocabulary', 4.0, 'Comprehension', 4.5, 'Participation', 4.5,
       21.5, true, '2025-06-05', 'Consistently using new phrases'
FROM public.teachers t
JOIN public.dashboard_students ds ON ds.email = 'emma@student.com'
WHERE t.email = 'donald@heroschool.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.assessment a
    WHERE a.student_name = 'Emma Nguyen' AND a.test_name = 'Speaking Check 1'
  );

INSERT INTO public.assessment (teacher_id, student_id, student_name, class, test_name, rubrics, r1, r1_score, r2, r2_score, r3, r3_score, r4, r4_score, r5, r5_score, total_score, published, assessment_date, feedback)
SELECT t.id, ds.id, 'Olivia Pham', 'Movers A', 'Writing Task 1', 'Content & Accuracy',
       'Content', 4.0, 'Vocabulary', 4.5, 'Grammar', 4.0, 'Organization', 4.5, 'Presentation', 4.5,
       21.5, true, '2025-06-08', 'Detailed descriptions with neat handwriting'
FROM public.teachers t
JOIN public.dashboard_students ds ON ds.email = 'olivia@student.com'
WHERE t.email = 'sarah@heroschool.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.assessment a
    WHERE a.student_name = 'Olivia Pham' AND a.test_name = 'Writing Task 1'
  );

-- =============================================
-- SKILLS EVALUATIONS
-- =============================================
INSERT INTO public.skills_evaluation (teacher_id, student_id, student_name, class, skill_name, skill_category,
                                      e1, e1_score, e2, e2_score, e3, e3_score, e4, e4_score, e5, e5_score, e6, e6_score,
                                      average_score, evaluation_date, notes)
SELECT t.id, ds.id, 'Emma Nguyen', 'Starters A', 'Core Speaking Skills', 'Speaking',
       'Pronunciation', 4.5, 'Fluency', 4.0, 'Vocabulary Range', 4.0, 'Interaction', 4.5, 'Confidence', 4.5, 'Listening Response', 4.0,
       4.25, '2025-06-06', 'Responds naturally during role-plays'
FROM public.teachers t
JOIN public.dashboard_students ds ON ds.email = 'emma@student.com'
WHERE t.email = 'donald@heroschool.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.skills_evaluation se
    WHERE se.student_name = 'Emma Nguyen' AND se.skill_name = 'Core Speaking Skills'
  );

INSERT INTO public.skills_evaluation (teacher_id, student_id, student_name, class, skill_name, skill_category,
                                      e1, e1_score, e2, e2_score, e3, e3_score, e4, e4_score, e5, e5_score, e6, e6_score,
                                      average_score, evaluation_date, notes)
SELECT t.id, ds.id, 'Olivia Pham', 'Movers A', 'Reading Comprehension', 'Reading',
       'Finding Details', 4.5, 'Main Idea', 4.5, 'Inference', 4.0, 'Vocabulary Use', 4.5, 'Pronunciation', 4.0, 'Participation', 4.0,
       4.25, '2025-06-09', 'Excellent at explaining answers'
FROM public.teachers t
JOIN public.dashboard_students ds ON ds.email = 'olivia@student.com'
WHERE t.email = 'sarah@heroschool.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.skills_evaluation se
    WHERE se.student_name = 'Olivia Pham' AND se.skill_name = 'Reading Comprehension'
  );

-- =============================================
-- STUDENT PROGRESS LOGS
-- =============================================
INSERT INTO public.student_progress (student_id, enrollment_id, assessment_date, skill_area, level_score, notes, assessed_by)
SELECT s.id, e.id, '2025-06-07', 'Speaking', 4.3, 'Improved question formation', t.id
FROM public.students s
JOIN public.enrollments e ON e.student_id = s.id
JOIN public.classes c ON c.id = e.class_id
JOIN public.teachers t ON t.email = 'donald@heroschool.com'
WHERE s.full_name = 'Emma Nguyen' AND c.class_name = 'Starters A'
  AND NOT EXISTS (
    SELECT 1 FROM public.student_progress sp
    WHERE sp.student_id = s.id AND sp.skill_area = 'Speaking' AND sp.assessment_date = '2025-06-07'
  );

INSERT INTO public.student_progress (student_id, enrollment_id, assessment_date, skill_area, level_score, notes, assessed_by)
SELECT s.id, e.id, '2025-06-10', 'Writing', 4.4, 'Uses complex sentences', t.id
FROM public.students s
JOIN public.enrollments e ON e.student_id = s.id
JOIN public.classes c ON c.id = e.class_id
JOIN public.teachers t ON t.email = 'sarah@heroschool.com'
WHERE s.full_name = 'Olivia Pham' AND c.class_name = 'Movers A'
  AND NOT EXISTS (
    SELECT 1 FROM public.student_progress sp
    WHERE sp.student_id = s.id AND sp.skill_area = 'Writing' AND sp.assessment_date = '2025-06-10'
  );

-- =============================================
-- EVENTS
-- =============================================
INSERT INTO public.events (title, description, event_type, event_date, start_time, end_time, location, max_participants, price, image_url, is_published, registration_deadline)
SELECT 'Summer Speaking Workshop', 'Interactive speaking activities for Starters level students', 'workshop',
       '2025-07-10', '09:00', '11:00', 'Hero School Main Campus', 30, 15.00,
       'https://example.com/images/workshop.jpg', true, '2025-07-05'
WHERE NOT EXISTS (SELECT 1 FROM public.events WHERE title = 'Summer Speaking Workshop');

INSERT INTO public.events (title, description, event_type, event_date, start_time, end_time, location, max_participants, price, image_url, is_published, registration_deadline)
SELECT 'Cambridge Flyers Mock Exam', 'Practice exam under real conditions', 'exam',
       '2025-07-20', '08:30', '10:30', 'Hero School Test Center', 25, 25.00,
       'https://example.com/images/mock-exam.jpg', true, '2025-07-15'
WHERE NOT EXISTS (SELECT 1 FROM public.events WHERE title = 'Cambridge Flyers Mock Exam');

-- =============================================
-- EVENT REGISTRATIONS
-- =============================================
INSERT INTO public.event_registrations (event_id, student_id, parent_name, child_name, child_age, phone, email, payment_status, attended, notes)
SELECT e.id, s.id, 'Mai Nguyen', 'Emma Nguyen', 9, '0900000001', 'mai.parent@example.com', 'paid', true, 'Arrived early'
FROM public.events e
JOIN public.students s ON s.full_name = 'Emma Nguyen'
WHERE e.title = 'Summer Speaking Workshop'
  AND NOT EXISTS (
    SELECT 1 FROM public.event_registrations er
    WHERE er.event_id = e.id AND er.student_id = s.id
  );

INSERT INTO public.event_registrations (event_id, student_id, parent_name, child_name, child_age, phone, email, payment_status, attended, notes)
SELECT e.id, s.id, 'Lan Pham', 'Olivia Pham', 10, '0900000003', 'lan.pham@example.com', 'pending', NULL, 'Preparing for exam'
FROM public.events e
JOIN public.students s ON s.full_name = 'Olivia Pham'
WHERE e.title = 'Cambridge Flyers Mock Exam'
  AND NOT EXISTS (
    SELECT 1 FROM public.event_registrations er
    WHERE er.event_id = e.id AND er.student_id = s.id
  );

-- =============================================
-- EXAM RESULTS
-- =============================================
INSERT INTO public.exam_results (student_id, exam_type, exam_date, listening_shields, reading_writing_shields, speaking_shields, certificate_number, certificate_url, notes)
SELECT s.id, 'starters', '2025-05-15', 5, 4, 5, 'CERT-STAR-0001', 'https://example.com/certificates/emma-nguyen.pdf', 'Excellent first attempt'
FROM public.students s
WHERE s.full_name = 'Emma Nguyen'
  AND NOT EXISTS (SELECT 1 FROM public.exam_results er WHERE er.student_id = s.id AND er.exam_type = 'starters');

INSERT INTO public.exam_results (student_id, exam_type, exam_date, listening_shields, reading_writing_shields, speaking_shields, certificate_number, certificate_url, notes)
SELECT s.id, 'movers', '2025-05-18', 4, 5, 4, 'CERT-MOV-0003', 'https://example.com/certificates/olivia-pham.pdf', 'Ready for Flyers next term'
FROM public.students s
WHERE s.full_name = 'Olivia Pham'
  AND NOT EXISTS (SELECT 1 FROM public.exam_results er WHERE er.student_id = s.id AND er.exam_type = 'movers');

-- =============================================
-- INQUIRIES
-- =============================================
INSERT INTO public.inquiries (parent_id, parent_name, child_name, child_age, current_level, phone, email, preferred_contact, how_did_hear, interested_in, message, status, response_notes, responded_at)
SELECT p.id, 'Mai Nguyen', 'Emma Nguyen', 9, 'some_english', '0900000001', 'mai.parent@example.com', 'phone', 'Friend referral',
       ARRAY['trial_class','curriculum_info']::public.inquiry_type[], 'Interested in additional speaking club', 'completed', 'Invited to Saturday speaking club', '2025-05-15 09:00:00+07'
FROM public.parents p
WHERE p.email = 'mai.parent@example.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.inquiries i
    WHERE i.parent_name = 'Mai Nguyen' AND i.child_name = 'Emma Nguyen'
  );

INSERT INTO public.inquiries (parent_id, parent_name, child_name, child_age, current_level, phone, email, preferred_contact, how_did_hear, interested_in, message, status)
SELECT p.id, 'Bao Tran', 'Liam Tran', 9, 'beginner', '0900000002', 'bao.tran@example.com', 'zalo', 'Facebook',
       ARRAY['pricing','trial_class']::public.inquiry_type[], 'Looking for homework support sessions', 'pending'
FROM public.parents p
WHERE p.email = 'bao.tran@example.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.inquiries i
    WHERE i.parent_name = 'Bao Tran' AND i.child_name = 'Liam Tran'
  );

-- =============================================
-- PAYMENTS
-- =============================================
INSERT INTO public.payments (student_id, enrollment_id, amount, payment_method, payment_date, payment_for, term, receipt_number, notes, created_by)
SELECT s.id, e.id, 3500000.00, 'bank transfer', '2025-05-10', 'Term 1 Tuition', 'Term 1', 'RCPT-2025-0001', 'Paid in full', t.id
FROM public.students s
JOIN public.enrollments e ON e.student_id = s.id
JOIN public.classes c ON c.id = e.class_id
JOIN public.teachers t ON t.email = 'donald@heroschool.com'
WHERE s.full_name = 'Emma Nguyen' AND c.class_name = 'Starters A'
  AND NOT EXISTS (SELECT 1 FROM public.payments p WHERE p.receipt_number = 'RCPT-2025-0001');

INSERT INTO public.payments (student_id, enrollment_id, amount, payment_method, payment_date, payment_for, term, receipt_number, notes, created_by)
SELECT s.id, e.id, 3600000.00, 'cash', '2025-05-12', 'Course Materials', 'Summer Term', 'RCPT-2025-0002', 'Includes course book', t.id
FROM public.students s
JOIN public.enrollments e ON e.student_id = s.id
JOIN public.classes c ON c.id = e.class_id
JOIN public.teachers t ON t.email = 'sarah@heroschool.com'
WHERE s.full_name = 'Olivia Pham' AND c.class_name = 'Movers A'
  AND NOT EXISTS (SELECT 1 FROM public.payments p WHERE p.receipt_number = 'RCPT-2025-0002');

-- =============================================
-- BLOG POSTS
-- =============================================
INSERT INTO public.blog_posts (title, content, author, author_id, category, published, published_date, tags)
SELECT '5 Warm-up Games for Young Learners',
       'Try these quick games to energize your classroom and build speaking confidence. Each activity requires minimal prep and keeps learners engaged...',
       'Donald Chapman', t.id, 'Teaching Tips', true, '2025-06-01', ARRAY['warm-up','young learners','speaking']
FROM public.teachers t
WHERE t.email = 'donald@heroschool.com'
  AND NOT EXISTS (SELECT 1 FROM public.blog_posts WHERE title = '5 Warm-up Games for Young Learners');

INSERT INTO public.blog_posts (title, content, author, author_id, category, published, published_date, tags)
SELECT 'Supporting Reluctant Readers',
       'Reluctant readers need structure and encouragement. Here are strategies to build confidence through predictable routines and choice...',
       'Sarah Johnson', t.id, 'Reading Skills', true, '2025-06-04', ARRAY['reading','motivation','classroom strategies']
FROM public.teachers t
WHERE t.email = 'sarah@heroschool.com'
  AND NOT EXISTS (SELECT 1 FROM public.blog_posts WHERE title = 'Supporting Reluctant Readers');

-- =============================================
-- TRIAL BOOKINGS
-- =============================================
INSERT INTO public.trial_bookings (parent_name, child_name, child_age, phone, email, preferred_date, preferred_time, current_level, assigned_class_id, scheduled_date, scheduled_time, status, attended, feedback)
SELECT 'Lan Pham', 'Olivia Pham', 10, '0900000003', 'lan.pham+trial@example.com', '2025-06-28', '15:00', 'confident', c.id, '2025-07-01', '15:00', 'completed', true, 'Ready to join Flyers'
FROM public.classes c
WHERE c.class_name = 'Flyers A'
  AND NOT EXISTS (
    SELECT 1 FROM public.trial_bookings tb
    WHERE tb.child_name = 'Olivia Pham' AND tb.scheduled_date = '2025-07-01'
  );

INSERT INTO public.trial_bookings (parent_name, child_name, child_age, phone, email, preferred_date, preferred_time, current_level, assigned_class_id, scheduled_date, scheduled_time, status)
SELECT 'Bao Tran', 'Liam Tran', 9, '0900000002', 'bao.tran+trial@example.com', '2025-06-25', '16:00', 'beginner', c.id, '2025-06-27', '16:00', 'scheduled'
FROM public.classes c
WHERE c.class_name = 'Starters A'
  AND NOT EXISTS (
    SELECT 1 FROM public.trial_bookings tb
    WHERE tb.child_name = 'Liam Tran' AND tb.scheduled_date = '2025-06-27'
  );

-- =============================================
-- PAYLOAD VERIFICATION (optional checks)
-- =============================================
-- Uncomment the queries below to verify inserted data after running the script.
-- SELECT COUNT(*) AS teacher_count FROM public.teachers;
-- SELECT COUNT(*) AS student_count FROM public.students;
-- SELECT COUNT(*) AS enrollment_count FROM public.enrollments;
-- SELECT COUNT(*) AS curriculum_count FROM public.curriculum;
-- SELECT COUNT(*) AS assessment_count FROM public.assessment;
