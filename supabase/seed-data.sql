-- HeroSchool Database Seed Script
-- This script populates all tables with realistic, connected dummy data

-- =============================================
-- CLEAR EXISTING DATA (Use with caution!)
-- =============================================
TRUNCATE TABLE
  homework_completion,
  skills_evaluation,
  assessment,
  curriculum,
  student_notifications,
  assignments,
  student_notes,
  attendance,
  calendar_sessions,
  blog_posts,
  dashboard_students,
  teachers,
  student_progress,
  exam_results,
  event_registrations,
  trial_bookings,
  payments,
  enrollments,
  classes,
  inquiries,
  students,
  parents,
  events,
  users
CASCADE;

-- =============================================
-- USERS (Staff/Admin)
-- =============================================
INSERT INTO users (email, full_name, role, phone) VALUES
  ('admin@heroschool.com', 'Admin Director', 'admin', '0901234567'),
  ('donald@heroschool.com', 'Donald Teacher', 'teacher', '0901234568'),
  ('sarah@heroschool.com', 'Sarah Johnson', 'teacher', '0901234569'),
  ('michael@heroschool.com', 'Michael Chen', 'teacher', '0901234570'),
  ('reception@heroschool.com', 'Linda Nguyen', 'receptionist', '0901234571');

-- =============================================
-- TEACHERS
-- =============================================
INSERT INTO teachers (name, surname, email, password, subject, phone, bio, profile_image_url) VALUES
  ('Donald', 'Teacher', 'donald@heroschool.com', 'teacher123', 'English', '0901234568', 'Experienced teacher specializing in Cambridge English for young learners. 5+ years of experience.', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Donald'),
  ('Sarah', 'Johnson', 'sarah@heroschool.com', 'teacher123', 'English', '0901234569', 'Passionate about creating engaging learning experiences. Cambridge certified examiner.', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah'),
  ('Michael', 'Chen', 'michael@heroschool.com', 'teacher123', 'English', '0901234570', 'Specialist in phonics and early childhood English education. 8 years teaching experience.', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael'),
  ('Emily', 'Williams', 'emily@heroschool.com', 'teacher123', 'English', '0901234572', 'Expert in gamification and interactive learning methods for young ESL students.', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily');

-- =============================================
-- PARENTS
-- =============================================
INSERT INTO parents (full_name, email, phone, preferred_contact, address, how_did_hear, agree_to_updates) VALUES
  ('Mrs. Nguyen Thi Mai', 'mai.nguyen@email.com', '0987654321', 'zalo', '123 Le Loi St, District 1, HCMC', 'Facebook', true),
  ('Mr. Tran Van Minh', 'minh.tran@email.com', '0987654322', 'phone', '456 Nguyen Hue Blvd, District 1, HCMC', 'Friend Referral', true),
  ('Mrs. Le Thi Lan', 'lan.le@email.com', '0987654323', 'email', '789 Hai Ba Trung St, District 3, HCMC', 'Google Search', true),
  ('Mr. Pham Thanh Son', 'son.pham@email.com', '0987654324', 'zalo', '321 Pasteur St, District 1, HCMC', 'Facebook', true),
  ('Mrs. Hoang Kim Oanh', 'oanh.hoang@email.com', '0987654325', 'zalo', '654 Vo Van Tan St, District 3, HCMC', 'Instagram', true),
  ('Mr. Vu Quoc Bao', 'bao.vu@email.com', '0987654326', 'phone', '987 Ly Thuong Kiet St, District 10, HCMC', 'Friend Referral', true),
  ('Mrs. Dang Thuy Linh', 'linh.dang@email.com', '0987654327', 'email', '147 Dien Bien Phu St, Binh Thanh, HCMC', 'Billboard', true),
  ('Mr. Ngo Minh Tuan', 'tuan.ngo@email.com', '0987654328', 'zalo', '258 Cach Mang Thang 8 St, District 3, HCMC', 'Google Search', true);

-- =============================================
-- EVENTS
-- =============================================
INSERT INTO events (title, description, event_type, event_date, start_time, end_time, location, max_participants, current_participants, age_min, age_max, price, is_published, registration_deadline) VALUES
  ('Summer English Camp 2025', 'Intensive English immersion program with fun activities, games, and outdoor learning', 'holiday_camp', '2025-07-15', '09:00', '16:00', 'HeroSchool Main Campus', 30, 12, 7, 12, 2500000, true, '2025-07-01'),
  ('Cambridge Starters Mock Exam', 'Practice exam for students preparing for Cambridge Starters certification', 'exam', '2025-06-20', '14:00', '16:00', 'HeroSchool Main Campus', 20, 8, 6, 8, 200000, true, '2025-06-15'),
  ('Halloween English Party 2025', 'Celebrate Halloween with English games, storytelling, and costume competition', 'cultural_event', '2025-10-31', '14:00', '17:00', 'HeroSchool Main Campus', 50, 23, 5, 12, 300000, true, '2025-10-25'),
  ('Parent-Teacher Meeting - Term 2', 'Discuss student progress, achievements, and upcoming term plans', 'parent_meeting', '2025-05-30', '18:00', '20:00', 'HeroSchool Main Campus', 100, 45, 0, 99, 0, true, '2025-05-28'),
  ('English Spelling Bee Competition', 'Annual spelling bee competition for all levels with exciting prizes', 'competition', '2025-08-15', '13:00', '16:00', 'HeroSchool Main Campus', 40, 18, 7, 13, 150000, true, '2025-08-10');

-- =============================================
-- CLASSES
-- =============================================
INSERT INTO classes (class_name, stage, teacher_name, max_students, current_students, schedule_days, start_time, end_time, classroom_location, start_date, end_date, is_active) VALUES
  ('Starters A - Morning', 'stage_1', 'Donald Teacher', 12, 8, ARRAY['monday','wednesday','friday']::class_day[], '09:00', '10:30', 'Room 101', '2025-01-10', '2025-06-30', true),
  ('Starters B - Afternoon', 'stage_1', 'Sarah Johnson', 12, 7, ARRAY['tuesday','thursday']::class_day[], '14:00', '15:30', 'Room 102', '2025-01-10', '2025-06-30', true),
  ('Movers A - Morning', 'stage_3', 'Michael Chen', 12, 9, ARRAY['monday','wednesday','friday']::class_day[], '10:45', '12:15', 'Room 103', '2025-01-10', '2025-06-30', true),
  ('Movers B - Afternoon', 'stage_3', 'Emily Williams', 12, 6, ARRAY['tuesday','thursday','saturday']::class_day[], '15:45', '17:15', 'Room 104', '2025-01-10', '2025-06-30', true),
  ('Flyers A - Morning', 'stage_5', 'Donald Teacher', 10, 5, ARRAY['monday','wednesday','friday']::class_day[], '08:00', '09:30', 'Room 105', '2025-01-10', '2025-06-30', true);

-- =============================================
-- STUDENTS (Main Schema)
-- =============================================
INSERT INTO students (parent_id, full_name, date_of_birth, age, current_level, assigned_stage, status, enrollment_date, profile_photo_url) VALUES
  ((SELECT id FROM parents WHERE phone = '0987654321'), 'Emma Nguyen', '2016-05-15', 9, 'some_english', 'stage_1', 'active', '2025-01-10', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma'),
  ((SELECT id FROM parents WHERE phone = '0987654322'), 'Liam Tran', '2015-08-22', 9, 'confident', 'stage_3', 'active', '2025-01-10', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Liam'),
  ((SELECT id FROM parents WHERE phone = '0987654323'), 'Olivia Le', '2016-03-10', 9, 'some_english', 'stage_1', 'active', '2025-01-10', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Olivia'),
  ((SELECT id FROM parents WHERE phone = '0987654324'), 'Noah Pham', '2015-11-30', 9, 'confident', 'stage_3', 'active', '2025-01-10', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Noah'),
  ((SELECT id FROM parents WHERE phone = '0987654325'), 'Ava Hoang', '2016-07-18', 8, 'beginner', 'stage_1', 'active', '2025-01-10', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ava'),
  ((SELECT id FROM parents WHERE phone = '0987654326'), 'Ethan Vu', '2014-12-05', 10, 'confident', 'stage_5', 'active', '2025-01-10', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ethan'),
  ((SELECT id FROM parents WHERE phone = '0987654327'), 'Sophia Dang', '2015-04-20', 10, 'some_english', 'stage_3', 'active', '2025-01-10', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia'),
  ((SELECT id FROM parents WHERE phone = '0987654328'), 'Mason Ngo', '2016-09-14', 8, 'some_english', 'stage_1', 'active', '2025-01-10', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mason');

-- =============================================
-- DASHBOARD STUDENTS (Extended for Dashboard)
-- =============================================
INSERT INTO dashboard_students (name, surname, email, password, class, gender, subject, level, birthday, attendance_rate, parent_name, parent_zalo_nr, location, placement_test_speaking, placement_test_listening, placement_test_reading, placement_test_writing, sessions, sessions_left, profile_image_url) VALUES
  ('Emma', 'Nguyen', 'emma@student.com', 'student123', 'Starters A - Morning', 'Female', 'English', 'Pre-A1', '2016-05-15', 95.5, 'Mrs. Nguyen Thi Mai', '0987654321', 'District 1', 'B1', 'A2', 'B1', 'A2', 40, 20, 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma'),
  ('Liam', 'Tran', 'liam@student.com', 'student123', 'Movers A - Morning', 'Male', 'English', 'A1', '2015-08-22', 88.3, 'Mr. Tran Van Minh', '0987654322', 'District 1', 'A2', 'B1', 'A2', 'A1', 50, 15, 'https://api.dicebear.com/7.x/avataaars/svg?seed=Liam'),
  ('Olivia', 'Le', 'olivia@student.com', 'student123', 'Starters A - Morning', 'Female', 'English', 'Pre-A1', '2016-03-10', 92.0, 'Mrs. Le Thi Lan', '0987654323', 'District 3', 'B1', 'B1', 'A2', 'B1', 35, 25, 'https://api.dicebear.com/7.x/avataaars/svg?seed=Olivia'),
  ('Noah', 'Pham', 'noah@student.com', 'student123', 'Movers A - Morning', 'Male', 'English', 'A1', '2015-11-30', 90.5, 'Mr. Pham Thanh Son', '0987654324', 'District 1', 'A2', 'A2', 'A2', 'A1', 48, 18, 'https://api.dicebear.com/7.x/avataaars/svg?seed=Noah'),
  ('Ava', 'Hoang', 'ava@student.com', 'student123', 'Starters B - Afternoon', 'Female', 'English', 'Pre-A1', '2016-07-18', 85.0, 'Mrs. Hoang Kim Oanh', '0987654325', 'District 3', 'A1', 'A2', 'A1', 'A1', 38, 22, 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ava'),
  ('Ethan', 'Vu', 'ethan@student.com', 'student123', 'Flyers A - Morning', 'Male', 'English', 'A2', '2014-12-05', 93.0, 'Mr. Vu Quoc Bao', '0987654326', 'District 10', 'B1', 'B1', 'A2', 'B1', 55, 10, 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ethan'),
  ('Sophia', 'Dang', 'sophia@student.com', 'student123', 'Movers B - Afternoon', 'Female', 'English', 'A1', '2015-04-20', 87.5, 'Mrs. Dang Thuy Linh', '0987654327', 'Binh Thanh', 'A2', 'A2', 'A2', 'A1', 45, 20, 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia'),
  ('Mason', 'Ngo', 'mason@student.com', 'student123', 'Starters A - Morning', 'Male', 'English', 'Pre-A1', '2016-09-14', 89.0, 'Mr. Ngo Minh Tuan', '0987654328', 'District 3', 'A2', 'A2', 'A1', 'A2', 42, 23, 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mason');

-- =============================================
-- ENROLLMENTS
-- =============================================
DO $$
DECLARE
  student_emma UUID;
  student_liam UUID;
  student_olivia UUID;
  student_noah UUID;
  student_ava UUID;
  student_ethan UUID;
  student_sophia UUID;
  student_mason UUID;
  class_starters_a UUID;
  class_movers_a UUID;
  class_starters_b UUID;
  class_movers_b UUID;
  class_flyers_a UUID;
BEGIN
  -- Get student IDs
  SELECT id INTO student_emma FROM students WHERE full_name = 'Emma Nguyen';
  SELECT id INTO student_liam FROM students WHERE full_name = 'Liam Tran';
  SELECT id INTO student_olivia FROM students WHERE full_name = 'Olivia Le';
  SELECT id INTO student_noah FROM students WHERE full_name = 'Noah Pham';
  SELECT id INTO student_ava FROM students WHERE full_name = 'Ava Hoang';
  SELECT id INTO student_ethan FROM students WHERE full_name = 'Ethan Vu';
  SELECT id INTO student_sophia FROM students WHERE full_name = 'Sophia Dang';
  SELECT id INTO student_mason FROM students WHERE full_name = 'Mason Ngo';

  -- Get class IDs
  SELECT id INTO class_starters_a FROM classes WHERE class_name = 'Starters A - Morning';
  SELECT id INTO class_movers_a FROM classes WHERE class_name = 'Movers A - Morning';
  SELECT id INTO class_starters_b FROM classes WHERE class_name = 'Starters B - Afternoon';
  SELECT id INTO class_movers_b FROM classes WHERE class_name = 'Movers B - Afternoon';
  SELECT id INTO class_flyers_a FROM classes WHERE class_name = 'Flyers A - Morning';

  -- Insert enrollments
  INSERT INTO enrollments (student_id, class_id, enrollment_date, is_active, attendance_rate) VALUES
    (student_emma, class_starters_a, '2025-01-10', true, 95.5),
    (student_liam, class_movers_a, '2025-01-10', true, 88.3),
    (student_olivia, class_starters_a, '2025-01-10', true, 92.0),
    (student_noah, class_movers_a, '2025-01-10', true, 90.5),
    (student_ava, class_starters_b, '2025-01-10', true, 85.0),
    (student_ethan, class_flyers_a, '2025-01-10', true, 93.0),
    (student_sophia, class_movers_b, '2025-01-10', true, 87.5),
    (student_mason, class_starters_a, '2025-01-10', true, 89.0);
END $$;

-- =============================================
-- CURRICULUM (Sample Lessons)
-- =============================================
INSERT INTO curriculum (teacher_id, teacher_name, subject, lesson_title, lesson_date, lesson_skills, success_criteria,
  wp1_type, wp1_name, wp1_url,
  ma1_type, ma1_name, ma1_url,
  hw1_type, hw1_name, hw1_url
) VALUES
  ((SELECT id FROM teachers WHERE email = 'donald@heroschool.com'), 'Donald Teacher', 'English', 'Numbers 1-20', '2025-06-01', 'Speaking, Counting, Pronunciation', 'Students can count from 1 to 20 and recognize written numbers',
    'pdf', 'Number Song Lyrics', 'https://example.com/number-song.pdf',
    'link', 'Counting Game', 'https://example.com/counting-game',
    'pdf', 'Numbers Practice Worksheet', 'https://example.com/numbers-hw.pdf'
  ),
  ((SELECT id FROM teachers WHERE email = 'sarah@heroschool.com'), 'Sarah Johnson', 'English', 'Colors and Shapes', '2025-06-05', 'Vocabulary, Speaking, Listening', 'Students can name 8 colors and 5 basic shapes',
    'image', 'Color Flashcards', 'https://example.com/colors.jpg',
    'pdf', 'Shapes Activity', 'https://example.com/shapes.pdf',
    'pdf', 'Color the Shapes', 'https://example.com/color-shapes-hw.pdf'
  ),
  ((SELECT id FROM teachers WHERE email = 'michael@heroschool.com'), 'Michael Chen', 'English', 'Family Members', '2025-06-08', 'Vocabulary, Speaking, Reading', 'Students can introduce their family members in English',
    'pdf', 'Family Tree Template', 'https://example.com/family-tree.pdf',
    'link', 'Family Song', 'https://youtube.com/family-song',
    'pdf', 'My Family Worksheet', 'https://example.com/family-hw.pdf'
  );

-- =============================================
-- ASSESSMENTS
-- =============================================
INSERT INTO assessment (teacher_id, student_id, class, student_name, test_name, rubrics,
  r1, r1_score, r2, r2_score, r3, r3_score, r4, r4_score, r5, r5_score,
  total_score, published, assessment_date, feedback
) VALUES
  ((SELECT id FROM teachers WHERE email = 'donald@heroschool.com'),
   (SELECT id FROM dashboard_students WHERE email = 'emma@student.com'),
   'Starters A - Morning', 'Emma Nguyen', 'Unit 1 - Numbers & Colors Test',
   'Speaking, Listening, Vocabulary, Grammar, Comprehension',
   'Pronunciation', 4.5, 'Fluency', 4.2, 'Vocabulary Use', 4.8, 'Grammar Accuracy', 4.0, 'Comprehension', 4.5,
   4.4, true, '2025-05-15', 'Excellent progress! Emma shows strong vocabulary skills.'),

  ((SELECT id FROM teachers WHERE email = 'donald@heroschool.com'),
   (SELECT id FROM dashboard_students WHERE email = 'emma@student.com'),
   'Starters A - Morning', 'Emma Nguyen', 'Unit 2 - Family & Friends Test',
   'Speaking, Listening, Vocabulary, Grammar, Comprehension',
   'Pronunciation', 4.7, 'Fluency', 4.5, 'Vocabulary Use', 4.9, 'Grammar Accuracy', 4.3, 'Comprehension', 4.6,
   4.6, true, '2025-05-28', 'Great improvement in fluency!'),

  ((SELECT id FROM teachers WHERE email = 'michael@heroschool.com'),
   (SELECT id FROM dashboard_students WHERE email = 'liam@student.com'),
   'Movers A - Morning', 'Liam Tran', 'Unit 1 - Present Simple Test',
   'Speaking, Listening, Vocabulary, Grammar, Comprehension',
   'Pronunciation', 4.0, 'Fluency', 3.8, 'Vocabulary Use', 4.2, 'Grammar Accuracy', 3.9, 'Comprehension', 4.1,
   4.0, true, '2025-05-15', 'Good work. Focus on fluency exercises.'),

  ((SELECT id FROM teachers WHERE email = 'michael@heroschool.com'),
   (SELECT id FROM dashboard_students WHERE email = 'liam@student.com'),
   'Movers A - Morning', 'Liam Tran', 'Unit 2 - Past Simple Test',
   'Speaking, Listening, Vocabulary, Grammar, Comprehension',
   'Pronunciation', 4.2, 'Fluency', 4.0, 'Vocabulary Use', 4.3, 'Grammar Accuracy', 4.1, 'Comprehension', 4.2,
   4.16, true, '2025-05-28', 'Much better fluency this time!'),

  ((SELECT id FROM teachers WHERE email = 'donald@heroschool.com'),
   (SELECT id FROM dashboard_students WHERE email = 'olivia@student.com'),
   'Starters A - Morning', 'Olivia Le', 'Unit 1 - Numbers & Colors Test',
   'Speaking, Listening, Vocabulary, Grammar, Comprehension',
   'Pronunciation', 4.3, 'Fluency', 4.0, 'Vocabulary Use', 4.5, 'Grammar Accuracy', 3.8, 'Comprehension', 4.2,
   4.16, true, '2025-05-15', 'Good effort. Practice grammar exercises.');

-- =============================================
-- SKILLS EVALUATION (Multiple entries over time)
-- =============================================
INSERT INTO skills_evaluation (teacher_id, student_id, student_name, class, skill_name, skill_category,
  e1, e1_score, e2, e2_score, e3, e3_score, e4, e4_score, e5, e5_score, e6, e6_score,
  average_score, evaluation_date, notes
) VALUES
  -- Emma's Writing Skills Progress
  ((SELECT id FROM teachers WHERE email = 'donald@heroschool.com'),
   (SELECT id FROM dashboard_students WHERE email = 'emma@student.com'),
   'Emma Nguyen', 'Starters A - Morning', 'Sentence Writing', 'Writing',
   'Letter Formation', 4.0, 'Spelling', 3.5, 'Capitalization', 3.8, 'Punctuation', 3.2, 'Sentence Structure', 3.5, 'Creativity', 4.2,
   3.7, '2025-02-15', 'Good start with basic writing'),

  ((SELECT id FROM teachers WHERE email = 'donald@heroschool.com'),
   (SELECT id FROM dashboard_students WHERE email = 'emma@student.com'),
   'Emma Nguyen', 'Starters A - Morning', 'Sentence Writing', 'Writing',
   'Letter Formation', 4.3, 'Spelling', 3.9, 'Capitalization', 4.0, 'Punctuation', 3.7, 'Sentence Structure', 4.0, 'Creativity', 4.5,
   4.07, '2025-03-15', 'Showing improvement in all areas'),

  ((SELECT id FROM teachers WHERE email = 'donald@heroschool.com'),
   (SELECT id FROM dashboard_students WHERE email = 'emma@student.com'),
   'Emma Nguyen', 'Starters A - Morning', 'Sentence Writing', 'Writing',
   'Letter Formation', 4.5, 'Spelling', 4.2, 'Capitalization', 4.3, 'Punctuation', 4.0, 'Sentence Structure', 4.3, 'Creativity', 4.7,
   4.33, '2025-04-15', 'Excellent progress'),

  ((SELECT id FROM teachers WHERE email = 'donald@heroschool.com'),
   (SELECT id FROM dashboard_students WHERE email = 'emma@student.com'),
   'Emma Nguyen', 'Starters A - Morning', 'Sentence Writing', 'Writing',
   'Letter Formation', 4.7, 'Spelling', 4.5, 'Capitalization', 4.5, 'Punctuation', 4.3, 'Sentence Structure', 4.5, 'Creativity', 4.8,
   4.55, '2025-05-15', 'Outstanding writing skills'),

  -- Emma's Reading Skills Progress
  ((SELECT id FROM teachers WHERE email = 'donald@heroschool.com'),
   (SELECT id FROM dashboard_students WHERE email = 'emma@student.com'),
   'Emma Nguyen', 'Starters A - Morning', 'Reading Comprehension', 'Reading',
   'Phonics', 3.8, 'Word Recognition', 3.5, 'Fluency', 3.3, 'Comprehension', 3.6, 'Vocabulary', 3.9, 'Inference', 3.2,
   3.55, '2025-02-15', 'Building reading foundation'),

  ((SELECT id FROM teachers WHERE email = 'donald@heroschool.com'),
   (SELECT id FROM dashboard_students WHERE email = 'emma@student.com'),
   'Emma Nguyen', 'Starters A - Morning', 'Reading Comprehension', 'Reading',
   'Phonics', 4.2, 'Word Recognition', 3.9, 'Fluency', 3.7, 'Comprehension', 4.0, 'Vocabulary', 4.3, 'Inference', 3.7,
   3.97, '2025-03-15', 'Reading confidence growing'),

  ((SELECT id FROM teachers WHERE email = 'donald@heroschool.com'),
   (SELECT id FROM dashboard_students WHERE email = 'emma@student.com'),
   'Emma Nguyen', 'Starters A - Morning', 'Reading Comprehension', 'Reading',
   'Phonics', 4.5, 'Word Recognition', 4.3, 'Fluency', 4.0, 'Comprehension', 4.4, 'Vocabulary', 4.6, 'Inference', 4.2,
   4.33, '2025-04-15', 'Strong reader'),

  ((SELECT id FROM teachers WHERE email = 'donald@heroschool.com'),
   (SELECT id FROM dashboard_students WHERE email = 'emma@student.com'),
   'Emma Nguyen', 'Starters A - Morning', 'Reading Comprehension', 'Reading',
   'Phonics', 4.8, 'Word Recognition', 4.6, 'Fluency', 4.4, 'Comprehension', 4.7, 'Vocabulary', 4.9, 'Inference', 4.5,
   4.65, '2025-05-15', 'Excellent reading ability'),

  -- Emma's Listening Skills Progress
  ((SELECT id FROM teachers WHERE email = 'donald@heroschool.com'),
   (SELECT id FROM dashboard_students WHERE email = 'emma@student.com'),
   'Emma Nguyen', 'Starters A - Morning', 'Listening Skills', 'Listening',
   'Sound Recognition', 4.0, 'Following Instructions', 3.7, 'Comprehension', 3.8, 'Note-taking', 3.3, 'Retention', 3.6, 'Critical Listening', 3.5,
   3.65, '2025-02-15', 'Developing listening skills'),

  ((SELECT id FROM teachers WHERE email = 'donald@heroschool.com'),
   (SELECT id FROM dashboard_students WHERE email = 'emma@student.com'),
   'Emma Nguyen', 'Starters A - Morning', 'Listening Skills', 'Listening',
   'Sound Recognition', 4.3, 'Following Instructions', 4.0, 'Comprehension', 4.2, 'Note-taking', 3.8, 'Retention', 4.0, 'Critical Listening', 3.9,
   4.03, '2025-03-15', 'Better focus during listening'),

  ((SELECT id FROM teachers WHERE email = 'donald@heroschool.com'),
   (SELECT id FROM dashboard_students WHERE email = 'emma@student.com'),
   'Emma Nguyen', 'Starters A - Morning', 'Listening Skills', 'Listening',
   'Sound Recognition', 4.5, 'Following Instructions', 4.4, 'Comprehension', 4.5, 'Note-taking', 4.2, 'Retention', 4.4, 'Critical Listening', 4.3,
   4.38, '2025-04-15', 'Excellent listening comprehension'),

  ((SELECT id FROM teachers WHERE email = 'donald@heroschool.com'),
   (SELECT id FROM dashboard_students WHERE email = 'emma@student.com'),
   'Emma Nguyen', 'Starters A - Morning', 'Listening Skills', 'Listening',
   'Sound Recognition', 4.7, 'Following Instructions', 4.6, 'Comprehension', 4.7, 'Note-taking', 4.5, 'Retention', 4.6, 'Critical Listening', 4.6,
   4.62, '2025-05-15', 'Outstanding listening ability'),

  -- Emma's Speaking Skills Progress
  ((SELECT id FROM teachers WHERE email = 'donald@heroschool.com'),
   (SELECT id FROM dashboard_students WHERE email = 'emma@student.com'),
   'Emma Nguyen', 'Starters A - Morning', 'Oral Communication', 'Speaking',
   'Pronunciation', 3.5, 'Fluency', 3.2, 'Vocabulary Use', 3.8, 'Grammar', 3.3, 'Interaction', 3.6, 'Confidence', 3.4,
   3.47, '2025-02-15', 'Building speaking confidence'),

  ((SELECT id FROM teachers WHERE email = 'donald@heroschool.com'),
   (SELECT id FROM dashboard_students WHERE email = 'emma@student.com'),
   'Emma Nguyen', 'Starters A - Morning', 'Oral Communication', 'Speaking',
   'Pronunciation', 3.9, 'Fluency', 3.6, 'Vocabulary Use', 4.2, 'Grammar', 3.7, 'Interaction', 4.0, 'Confidence', 3.8,
   3.87, '2025-03-15', 'More confident speaker'),

  ((SELECT id FROM teachers WHERE email = 'donald@heroschool.com'),
   (SELECT id FROM dashboard_students WHERE email = 'emma@student.com'),
   'Emma Nguyen', 'Starters A - Morning', 'Oral Communication', 'Speaking',
   'Pronunciation', 4.2, 'Fluency', 4.0, 'Vocabulary Use', 4.5, 'Grammar', 4.1, 'Interaction', 4.4, 'Confidence', 4.3,
   4.25, '2025-04-15', 'Great improvement in speaking'),

  ((SELECT id FROM teachers WHERE email = 'donald@heroschool.com'),
   (SELECT id FROM dashboard_students WHERE email = 'emma@student.com'),
   'Emma Nguyen', 'Starters A - Morning', 'Oral Communication', 'Speaking',
   'Pronunciation', 4.5, 'Fluency', 4.3, 'Vocabulary Use', 4.8, 'Grammar', 4.4, 'Interaction', 4.7, 'Confidence', 4.6,
   4.55, '2025-05-15', 'Excellent communicator'),

  -- Liam's Skills (All 4 categories, showing progress)
  -- Writing
  ((SELECT id FROM teachers WHERE email = 'michael@heroschool.com'),
   (SELECT id FROM dashboard_students WHERE email = 'liam@student.com'),
   'Liam Tran', 'Movers A - Morning', 'Paragraph Writing', 'Writing',
   'Organization', 3.5, 'Grammar', 3.3, 'Vocabulary', 3.7, 'Coherence', 3.4, 'Creativity', 3.8, 'Mechanics', 3.5,
   3.53, '2025-02-15', 'Developing writing skills'),
  ((SELECT id FROM teachers WHERE email = 'michael@heroschool.com'),
   (SELECT id FROM dashboard_students WHERE email = 'liam@student.com'),
   'Liam Tran', 'Movers A - Morning', 'Paragraph Writing', 'Writing',
   'Organization', 3.8, 'Grammar', 3.6, 'Vocabulary', 4.0, 'Coherence', 3.7, 'Creativity', 4.1, 'Mechanics', 3.8,
   3.83, '2025-03-15', 'Improving steadily'),
  ((SELECT id FROM teachers WHERE email = 'michael@heroschool.com'),
   (SELECT id FROM dashboard_students WHERE email = 'liam@student.com'),
   'Liam Tran', 'Movers A - Morning', 'Paragraph Writing', 'Writing',
   'Organization', 4.0, 'Grammar', 3.9, 'Vocabulary', 4.2, 'Coherence', 4.0, 'Creativity', 4.3, 'Mechanics', 4.0,
   4.07, '2025-04-15', 'Good progress'),
  ((SELECT id FROM teachers WHERE email = 'michael@heroschool.com'),
   (SELECT id FROM dashboard_students WHERE email = 'liam@student.com'),
   'Liam Tran', 'Movers A - Morning', 'Paragraph Writing', 'Writing',
   'Organization', 4.2, 'Grammar', 4.1, 'Vocabulary', 4.4, 'Coherence', 4.2, 'Creativity', 4.5, 'Mechanics', 4.2,
   4.27, '2025-05-15', 'Well-structured writing'),

  -- Reading
  ((SELECT id FROM teachers WHERE email = 'michael@heroschool.com'),
   (SELECT id FROM dashboard_students WHERE email = 'liam@student.com'),
   'Liam Tran', 'Movers A - Morning', 'Reading Analysis', 'Reading',
   'Decoding', 3.6, 'Fluency', 3.4, 'Comprehension', 3.7, 'Analysis', 3.3, 'Vocabulary', 3.8, 'Inference', 3.5,
   3.55, '2025-02-15', 'Building reading stamina'),
  ((SELECT id FROM teachers WHERE email = 'michael@heroschool.com'),
   (SELECT id FROM dashboard_students WHERE email = 'liam@student.com'),
   'Liam Tran', 'Movers A - Morning', 'Reading Analysis', 'Reading',
   'Decoding', 3.9, 'Fluency', 3.7, 'Comprehension', 4.0, 'Analysis', 3.6, 'Vocabulary', 4.1, 'Inference', 3.8,
   3.85, '2025-03-15', 'Better comprehension'),
  ((SELECT id FROM teachers WHERE email = 'michael@heroschool.com'),
   (SELECT id FROM dashboard_students WHERE email = 'liam@student.com'),
   'Liam Tran', 'Movers A - Morning', 'Reading Analysis', 'Reading',
   'Decoding', 4.1, 'Fluency', 4.0, 'Comprehension', 4.2, 'Analysis', 3.9, 'Vocabulary', 4.3, 'Inference', 4.0,
   4.08, '2025-04-15', 'Strong analytical skills'),
  ((SELECT id FROM teachers WHERE email = 'michael@heroschool.com'),
   (SELECT id FROM dashboard_students WHERE email = 'liam@student.com'),
   'Liam Tran', 'Movers A - Morning', 'Reading Analysis', 'Reading',
   'Decoding', 4.3, 'Fluency', 4.2, 'Comprehension', 4.4, 'Analysis', 4.1, 'Vocabulary', 4.5, 'Inference', 4.3,
   4.30, '2025-05-15', 'Excellent reader'),

  -- Listening
  ((SELECT id FROM teachers WHERE email = 'michael@heroschool.com'),
   (SELECT id FROM dashboard_students WHERE email = 'liam@student.com'),
   'Liam Tran', 'Movers A - Morning', 'Active Listening', 'Listening',
   'Attention', 3.4, 'Comprehension', 3.5, 'Note-taking', 3.2, 'Response', 3.6, 'Retention', 3.4, 'Critical Analysis', 3.3,
   3.40, '2025-02-15', 'Needs more focus'),
  ((SELECT id FROM teachers WHERE email = 'michael@heroschool.com'),
   (SELECT id FROM dashboard_students WHERE email = 'liam@student.com'),
   'Liam Tran', 'Movers A - Morning', 'Active Listening', 'Listening',
   'Attention', 3.7, 'Comprehension', 3.8, 'Note-taking', 3.5, 'Response', 3.9, 'Retention', 3.7, 'Critical Analysis', 3.6,
   3.70, '2025-03-15', 'Better attention span'),
  ((SELECT id FROM teachers WHERE email = 'michael@heroschool.com'),
   (SELECT id FROM dashboard_students WHERE email = 'liam@student.com'),
   'Liam Tran', 'Movers A - Morning', 'Active Listening', 'Listening',
   'Attention', 3.9, 'Comprehension', 4.0, 'Note-taking', 3.8, 'Response', 4.1, 'Retention', 3.9, 'Critical Analysis', 3.8,
   3.92, '2025-04-15', 'Much improved'),
  ((SELECT id FROM teachers WHERE email = 'michael@heroschool.com'),
   (SELECT id FROM dashboard_students WHERE email = 'liam@student.com'),
   'Liam Tran', 'Movers A - Morning', 'Active Listening', 'Listening',
   'Attention', 4.1, 'Comprehension', 4.2, 'Note-taking', 4.0, 'Response', 4.3, 'Retention', 4.1, 'Critical Analysis', 4.0,
   4.12, '2025-05-15', 'Great listening skills'),

  -- Speaking
  ((SELECT id FROM teachers WHERE email = 'michael@heroschool.com'),
   (SELECT id FROM dashboard_students WHERE email = 'liam@student.com'),
   'Liam Tran', 'Movers A - Morning', 'Presentation Skills', 'Speaking',
   'Clarity', 3.3, 'Fluency', 3.2, 'Vocabulary', 3.6, 'Grammar', 3.4, 'Confidence', 3.5, 'Engagement', 3.4,
   3.40, '2025-02-15', 'Building confidence'),
  ((SELECT id FROM teachers WHERE email = 'michael@heroschool.com'),
   (SELECT id FROM dashboard_students WHERE email = 'liam@student.com'),
   'Liam Tran', 'Movers A - Morning', 'Presentation Skills', 'Speaking',
   'Clarity', 3.6, 'Fluency', 3.5, 'Vocabulary', 3.9, 'Grammar', 3.7, 'Confidence', 3.8, 'Engagement', 3.7,
   3.70, '2025-03-15', 'More comfortable speaking'),
  ((SELECT id FROM teachers WHERE email = 'michael@heroschool.com'),
   (SELECT id FROM dashboard_students WHERE email = 'liam@student.com'),
   'Liam Tran', 'Movers A - Morning', 'Presentation Skills', 'Speaking',
   'Clarity', 3.9, 'Fluency', 3.8, 'Vocabulary', 4.2, 'Grammar', 4.0, 'Confidence', 4.1, 'Engagement', 4.0,
   4.00, '2025-04-15', 'Confident speaker'),
  ((SELECT id FROM teachers WHERE email = 'michael@heroschool.com'),
   (SELECT id FROM dashboard_students WHERE email = 'liam@student.com'),
   'Liam Tran', 'Movers A - Morning', 'Presentation Skills', 'Speaking',
   'Clarity', 4.1, 'Fluency', 4.0, 'Vocabulary', 4.4, 'Grammar', 4.2, 'Confidence', 4.3, 'Engagement', 4.2,
   4.20, '2025-05-15', 'Excellent presentation skills');

-- =============================================
-- CALENDAR SESSIONS
-- =============================================
INSERT INTO calendar_sessions (teacher_id, class_name, lesson_title, session_date, start_time, end_time, status, attendance_taken) VALUES
  ((SELECT id FROM teachers WHERE email = 'donald@heroschool.com'), 'Starters A - Morning', 'Numbers 1-20', '2025-06-01', '09:00', '10:30', 'completed', true),
  ((SELECT id FROM teachers WHERE email = 'donald@heroschool.com'), 'Starters A - Morning', 'Colors Review', '2025-06-03', '09:00', '10:30', 'completed', true),
  ((SELECT id FROM teachers WHERE email = 'donald@heroschool.com'), 'Starters A - Morning', 'Animals Vocabulary', '2025-06-05', '09:00', '10:30', 'scheduled', false),
  ((SELECT id FROM teachers WHERE email = 'sarah@heroschool.com'), 'Starters B - Afternoon', 'Alphabet Song', '2025-06-02', '14:00', '15:30', 'completed', true),
  ((SELECT id FROM teachers WHERE email = 'michael@heroschool.com'), 'Movers A - Morning', 'Present Simple Tense', '2025-06-01', '10:45', '12:15', 'completed', true);

-- =============================================
-- ATTENDANCE
-- =============================================
INSERT INTO attendance (teacher_id, student_id, class_session_id, date, present, notes) VALUES
  ((SELECT id FROM teachers WHERE email = 'donald@heroschool.com'),
   (SELECT id FROM dashboard_students WHERE email = 'emma@student.com'),
   (SELECT id FROM calendar_sessions WHERE lesson_title = 'Numbers 1-20' LIMIT 1),
   '2025-06-01', true, 'Very engaged'),

  ((SELECT id FROM teachers WHERE email = 'donald@heroschool.com'),
   (SELECT id FROM dashboard_students WHERE email = 'olivia@student.com'),
   (SELECT id FROM calendar_sessions WHERE lesson_title = 'Numbers 1-20' LIMIT 1),
   '2025-06-01', true, NULL),

  ((SELECT id FROM teachers WHERE email = 'donald@heroschool.com'),
   (SELECT id FROM dashboard_students WHERE email = 'mason@student.com'),
   (SELECT id FROM calendar_sessions WHERE lesson_title = 'Numbers 1-20' LIMIT 1),
   '2025-06-01', false, 'Sick leave'),

  ((SELECT id FROM teachers WHERE email = 'michael@heroschool.com'),
   (SELECT id FROM dashboard_students WHERE email = 'liam@student.com'),
   (SELECT id FROM calendar_sessions WHERE lesson_title = 'Present Simple Tense' LIMIT 1),
   '2025-06-01', true, 'Excellent participation');

-- =============================================
-- PAYMENTS
-- =============================================
DO $$
DECLARE
  student_emma UUID;
  student_liam UUID;
  enrollment_emma UUID;
  enrollment_liam UUID;
BEGIN
  SELECT id INTO student_emma FROM students WHERE full_name = 'Emma Nguyen';
  SELECT id INTO student_liam FROM students WHERE full_name = 'Liam Tran';
  SELECT id INTO enrollment_emma FROM enrollments WHERE student_id = student_emma LIMIT 1;
  SELECT id INTO enrollment_liam FROM enrollments WHERE student_id = student_liam LIMIT 1;

  INSERT INTO payments (student_id, enrollment_id, amount, payment_method, payment_date, payment_for, term, receipt_number) VALUES
    (student_emma, enrollment_emma, 3500000, 'bank_transfer', '2025-01-05', 'tuition', 'Term 1 2025', 'RCP-2025-0001'),
    (student_emma, enrollment_emma, 500000, 'cash', '2025-01-05', 'materials', 'Term 1 2025', 'RCP-2025-0002'),
    (student_liam, enrollment_liam, 4000000, 'bank_transfer', '2025-01-06', 'tuition', 'Term 1 2025', 'RCP-2025-0003'),
    (student_liam, enrollment_liam, 500000, 'bank_transfer', '2025-01-06', 'materials', 'Term 1 2025', 'RCP-2025-0004');
END $$;

-- =============================================
-- EXAM RESULTS
-- =============================================
INSERT INTO exam_results (student_id, exam_type, exam_date, listening_shields, reading_writing_shields, speaking_shields, notes) VALUES
  ((SELECT id FROM students WHERE full_name = 'Emma Nguyen'), 'starters', '2025-05-20', 5, 5, 4, 'Excellent performance!'),
  ((SELECT id FROM students WHERE full_name = 'Liam Tran'), 'movers', '2025-05-20', 4, 4, 4, 'Good result, consistent across all areas');

-- =============================================
-- BLOG POSTS
-- =============================================
INSERT INTO blog_posts (title, content, author, author_id, category, published, published_date, tags) VALUES
  ('5 Tips for Teaching Young Learners',
   'Teaching young English learners requires patience, creativity, and the right strategies. Here are my top 5 tips: 1) Use visual aids extensively, 2) Incorporate games and songs, 3) Keep activities short and varied, 4) Provide positive reinforcement, 5) Create a routine students can rely on. These methods have proven effective in my classroom over the years.',
   'Donald Teacher',
   (SELECT id FROM teachers WHERE email = 'donald@heroschool.com'),
   'Teaching Tips',
   true,
   CURRENT_DATE - INTERVAL '5 days',
   ARRAY['teaching', 'young learners', 'methodology']),

  ('Cambridge Exam Preparation Guide',
   'Preparing students for Cambridge Young Learners exams requires systematic approach. Focus on all four skills equally, use official materials, conduct regular mock tests, and build confidence through positive feedback. Remember that exam preparation should still be fun!',
   'Sarah Johnson',
   (SELECT id FROM teachers WHERE email = 'sarah@heroschool.com'),
   'Exam Prep',
   true,
   CURRENT_DATE - INTERVAL '2 days',
   ARRAY['cambridge', 'exams', 'preparation']);

-- =============================================
-- NOTIFICATIONS
-- =============================================
INSERT INTO student_notifications (student_id, type, title, message, read) VALUES
  ((SELECT id FROM dashboard_students WHERE email = 'emma@student.com'),
   'assessment',
   'New Assessment Published',
   'Your Unit 2 - Family & Friends Test results are now available. Great work!',
   false),

  ((SELECT id FROM dashboard_students WHERE email = 'emma@student.com'),
   'assignment',
   'Homework Assigned',
   'Numbers Practice Worksheet is due on June 8th',
   false),

  ((SELECT id FROM dashboard_students WHERE email = 'liam@student.com'),
   'assessment',
   'New Assessment Published',
   'Your Unit 2 - Past Simple Test results are now available.',
   false);

-- =============================================
-- ASSIGNMENTS
-- =============================================
INSERT INTO assignments (teacher_id, title, description, assignment_type, target_type, target_class, due_date) VALUES
  ((SELECT id FROM teachers WHERE email = 'donald@heroschool.com'),
   'Numbers Practice Worksheet',
   'Complete exercises 1-15 practicing numbers 1-20',
   'homework',
   'class',
   'Starters A - Morning',
   CURRENT_DATE + INTERVAL '7 days'),

  ((SELECT id FROM teachers WHERE email = 'sarah@heroschool.com'),
   'Color the Animals',
   'Complete the animal coloring activity and label each animal in English',
   'homework',
   'class',
   'Starters B - Afternoon',
   CURRENT_DATE + INTERVAL '5 days'),

  ((SELECT id FROM teachers WHERE email = 'michael@heroschool.com'),
   'Grammar Practice: Present Simple',
   'Complete the online quiz and workbook pages 15-18',
   'homework',
   'class',
   'Movers A - Morning',
   CURRENT_DATE + INTERVAL '3 days');

-- =============================================
-- INQUIRIES
-- =============================================
INSERT INTO inquiries (parent_name, child_name, child_age, current_level, phone, email, preferred_contact, how_did_hear, interested_in, message, status) VALUES
  ('Mrs. Vo Kim Chi', 'Alex Vo', 7, 'beginner', '0988888888', 'chi.vo@email.com', 'zalo', 'Facebook', ARRAY['trial_class', 'curriculum_info']::inquiry_type[], 'I would like to book a trial class for my son Alex. He is 7 years old and just starting to learn English.', 'pending'),
  ('Mr. Truong Quoc Huy', 'Jenny Truong', 8, 'some_english', '0977777777', 'huy.truong@email.com', 'phone', 'Google Search', ARRAY['trial_class']::inquiry_type[], 'My daughter has studied some English at school. I want to enroll her in Cambridge preparation classes.', 'contacted');

-- =============================================
-- TRIAL BOOKINGS
-- =============================================
INSERT INTO trial_bookings (parent_name, child_name, child_age, phone, email, preferred_date, current_level, assigned_class_id, status) VALUES
  ('Mrs. Vo Kim Chi', 'Alex Vo', 7, '0988888888', 'chi.vo@email.com', CURRENT_DATE + INTERVAL '10 days', 'beginner', (SELECT id FROM classes WHERE class_name = 'Starters A - Morning'), 'scheduled'),
  ('Mr. Truong Quoc Huy', 'Jenny Truong', 8, '0977777777', 'huy.truong@email.com', CURRENT_DATE + INTERVAL '8 days', 'some_english', (SELECT id FROM classes WHERE class_name = 'Starters A - Morning'), 'scheduled');

COMMENT ON TABLE dashboard_students IS 'Dashboard-specific student table with comprehensive dummy data for testing';
