-- HeroSchool Dashboard - Comprehensive Sample Data
-- Run this after dashboard-schema.sql to populate with realistic examples

-- =============================================
-- CLEAR EXISTING DATA (optional - uncomment if needed)
-- =============================================
-- TRUNCATE TABLE homework_completion CASCADE;
-- TRUNCATE TABLE skills_evaluation CASCADE;
-- TRUNCATE TABLE assessment CASCADE;
-- TRUNCATE TABLE curriculum CASCADE;
-- TRUNCATE TABLE blog_posts CASCADE;
-- TRUNCATE TABLE dashboard_students CASCADE;
-- TRUNCATE TABLE teachers CASCADE;

-- =============================================
-- TEACHERS (10 teachers)
-- =============================================
INSERT INTO teachers (name, surname, email, password, subject, phone, bio) VALUES
  ('Donald', 'Chapman', 'donald@heroschool.com', 'teacher123', 'English', '0981646304', 'Experienced Cambridge English teacher specializing in Young Learners'),
  ('Sarah', 'Johnson', 'sarah@heroschool.com', 'teacher123', 'English', '0981234567', 'Passionate about early childhood English education'),
  ('Michael', 'Chen', 'michael@heroschool.com', 'teacher123', 'English', '0981234568', 'Cambridge certified with 8 years experience'),
  ('Emma', 'Williams', 'emma.w@heroschool.com', 'teacher123', 'English', '0981234569', 'Specialist in A2 Flyers preparation'),
  ('James', 'Brown', 'james@heroschool.com', 'teacher123', 'English', '0981234570', 'Expert in phonics and early reading'),
  ('Lisa', 'Martinez', 'lisa@heroschool.com', 'teacher123', 'English', '0981234571', 'Cambridge examiner for Young Learners'),
  ('David', 'Garcia', 'david@heroschool.com', 'teacher123', 'English', '0981234572', 'Interactive teaching methods specialist'),
  ('Anna', 'Lee', 'anna@heroschool.com', 'teacher123', 'English', '0981234573', 'Bilingual educator with 10 years experience'),
  ('Tom', 'Wilson', 'tom@heroschool.com', 'teacher123', 'English', '0981234574', 'Technology-enhanced learning expert'),
  ('Maria', 'Rodriguez', 'maria@heroschool.com', 'teacher123', 'English', '0981234575', 'Specialist in mixed-ability classrooms');

-- =============================================
-- STUDENTS (30 students across different classes)
-- =============================================

-- Starters A Class (8 students)
INSERT INTO dashboard_students (name, surname, email, password, class, gender, subject, level, birthday, attendance_rate, parent_name, parent_zalo_nr, location, placement_test_speaking, placement_test_listening, placement_test_reading, placement_test_writing, sessions, sessions_left) VALUES
  ('Emma', 'Nguyen', 'emma@student.com', 'student123', 'Starters A', 'Female', 'English', 'Pre-A1', '2016-05-15', 95.5, 'Mrs. Nguyen Thu', '0987654321', 'Smart City Tower A', 'Good', 'Excellent', 'Good', 'Fair', 40, 20),
  ('Liam', 'Tran', 'liam@student.com', 'student123', 'Starters A', 'Male', 'English', 'Pre-A1', '2016-08-22', 88.3, 'Mr. Tran Van', '0987654322', 'Smart City Tower B', 'Fair', 'Good', 'Good', 'Fair', 38, 22),
  ('Olivia', 'Le', 'olivia@student.com', 'student123', 'Starters A', 'Female', 'English', 'Pre-A1', '2016-03-10', 92.0, 'Mrs. Le Thi', '0987654323', 'Smart City Tower C', 'Excellent', 'Good', 'Good', 'Good', 42, 18),
  ('Noah', 'Pham', 'noah@student.com', 'student123', 'Starters A', 'Male', 'English', 'Pre-A1', '2016-11-30', 87.5, 'Mrs. Pham Hong', '0987654324', 'Imperia Garden', 'Good', 'Fair', 'Fair', 'Fair', 35, 25),
  ('Sophia', 'Hoang', 'sophia@student.com', 'student123', 'Starters A', 'Female', 'English', 'Pre-A1', '2016-07-18', 94.2, 'Mr. Hoang Minh', '0987654325', 'Smart City Tower A', 'Good', 'Good', 'Excellent', 'Good', 41, 19),
  ('Mason', 'Dang', 'mason@student.com', 'student123', 'Starters A', 'Male', 'English', 'Pre-A1', '2016-09-05', 89.8, 'Mrs. Dang Lan', '0987654326', 'Vincom Mall Area', 'Fair', 'Good', 'Good', 'Fair', 37, 23),
  ('Ava', 'Vo', 'ava@student.com', 'student123', 'Starters A', 'Female', 'English', 'Pre-A1', '2016-12-12', 91.3, 'Mrs. Vo Thuy', '0987654327', 'Smart City Tower B', 'Good', 'Excellent', 'Good', 'Good', 39, 21),
  ('Lucas', 'Ngo', 'lucas@student.com', 'student123', 'Starters A', 'Male', 'English', 'Pre-A1', '2016-06-25', 86.7, 'Mr. Ngo Quang', '0987654328', 'Aeon Mall Area', 'Fair', 'Fair', 'Good', 'Fair', 34, 26),

-- Starters B Class (8 students)
  ('Isabella', 'Bui', 'isabella@student.com', 'student123', 'Starters B', 'Female', 'English', 'Pre-A1', '2016-04-08', 93.1, 'Mrs. Bui Mai', '0987654329', 'Smart City Tower C', 'Excellent', 'Good', 'Good', 'Good', 40, 20),
  ('Ethan', 'Do', 'ethan@student.com', 'student123', 'Starters B', 'Male', 'English', 'Pre-A1', '2016-10-14', 90.5, 'Mr. Do Tuan', '0987654330', 'Imperia Garden', 'Good', 'Good', 'Fair', 'Good', 38, 22),
  ('Mia', 'Duong', 'mia@student.com', 'student123', 'Starters B', 'Female', 'English', 'Pre-A1', '2016-08-29', 88.9, 'Mrs. Duong Ha', '0987654331', 'Smart City Tower A', 'Good', 'Fair', 'Good', 'Fair', 36, 24),
  ('James', 'Trinh', 'james.s@student.com', 'student123', 'Starters B', 'Male', 'English', 'Pre-A1', '2016-05-17', 92.7, 'Mrs. Trinh Nga', '0987654332', 'Vincom Mall Area', 'Excellent', 'Excellent', 'Good', 'Good', 41, 19),
  ('Charlotte', 'Ly', 'charlotte@student.com', 'student123', 'Starters B', 'Female', 'English', 'Pre-A1', '2016-07-03', 95.8, 'Mr. Ly Thanh', '0987654333', 'Smart City Tower B', 'Excellent', 'Good', 'Excellent', 'Good', 43, 17),
  ('Benjamin', 'Mai', 'benjamin@student.com', 'student123', 'Starters B', 'Male', 'English', 'Pre-A1', '2016-11-20', 87.2, 'Mrs. Mai Linh', '0987654334', 'Aeon Mall Area', 'Fair', 'Good', 'Good', 'Fair', 35, 25),
  ('Amelia', 'Cao', 'amelia@student.com', 'student123', 'Starters B', 'Female', 'English', 'Pre-A1', '2016-09-11', 91.6, 'Mrs. Cao Huong', '0987654335', 'Smart City Tower C', 'Good', 'Good', 'Good', 'Good', 39, 21),
  ('Henry', 'Vu', 'henry@student.com', 'student123', 'Starters B', 'Male', 'English', 'Pre-A1', '2016-06-08', 89.4, 'Mr. Vu Hieu', '0987654336', 'Imperia Garden', 'Good', 'Fair', 'Fair', 'Good', 37, 23),

-- Movers A Class (7 students)
  ('Harper', 'Dinh', 'harper@student.com', 'student123', 'Movers A', 'Female', 'English', 'A1', '2015-03-22', 94.6, 'Mrs. Dinh Thao', '0987654337', 'Smart City Tower A', 'Excellent', 'Excellent', 'Good', 'Excellent', 50, 15),
  ('Alexander', 'Tang', 'alexander@student.com', 'student123', 'Movers A', 'Male', 'English', 'A1', '2015-09-15', 91.2, 'Mr. Tang Long', '0987654338', 'Vincom Mall Area', 'Good', 'Good', 'Excellent', 'Good', 48, 17),
  ('Evelyn', 'Phan', 'evelyn@student.com', 'student123', 'Movers A', 'Female', 'English', 'A1', '2015-07-28', 89.8, 'Mrs. Phan Yen', '0987654339', 'Smart City Tower B', 'Good', 'Fair', 'Good', 'Good', 46, 19),
  ('Daniel', 'Huynh', 'daniel@student.com', 'student123', 'Movers A', 'Male', 'English', 'A1', '2015-11-05', 93.5, 'Mrs. Huynh Van', '0987654340', 'Aeon Mall Area', 'Excellent', 'Good', 'Excellent', 'Good', 51, 14),
  ('Abigail', 'Truong', 'abigail@student.com', 'student123', 'Movers A', 'Female', 'English', 'A1', '2015-05-19', 90.7, 'Mr. Truong Duc', '0987654341', 'Smart City Tower C', 'Good', 'Excellent', 'Good', 'Good', 49, 16),
  ('Matthew', 'Quach', 'matthew@student.com', 'student123', 'Movers A', 'Male', 'English', 'A1', '2015-08-11', 88.3, 'Mrs. Quach Huyen', '0987654342', 'Imperia Garden', 'Fair', 'Good', 'Good', 'Fair', 45, 20),
  ('Emily', 'Luu', 'emily@student.com', 'student123', 'Movers A', 'Female', 'English', 'A1', '2015-12-30', 92.9, 'Mrs. Luu Trang', '0987654343', 'Smart City Tower A', 'Excellent', 'Good', 'Good', 'Excellent', 50, 15),

-- Flyers A Class (7 students)
  ('William', 'Bach', 'william@student.com', 'student123', 'Flyers A', 'Male', 'English', 'A2', '2014-04-12', 95.3, 'Mr. Bach Tien', '0987654344', 'Vincom Mall Area', 'Excellent', 'Excellent', 'Excellent', 'Good', 60, 10),
  ('Elizabeth', 'Kieu', 'elizabeth@student.com', 'student123', 'Flyers A', 'Female', 'English', 'A2', '2014-10-25', 93.7, 'Mrs. Kieu Nhung', '0987654345', 'Smart City Tower B', 'Excellent', 'Good', 'Excellent', 'Excellent', 58, 12),
  ('David', 'Ha', 'david.h@student.com', 'student123', 'Flyers A', 'Male', 'English', 'A2', '2014-06-18', 91.8, 'Mrs. Ha Lan', '0987654346', 'Aeon Mall Area', 'Good', 'Excellent', 'Good', 'Good', 56, 14),
  ('Sofia', 'Tong', 'sofia@student.com', 'student123', 'Flyers A', 'Female', 'English', 'A2', '2014-08-03', 94.1, 'Mr. Tong Binh', '0987654347', 'Smart City Tower C', 'Excellent', 'Good', 'Excellent', 'Good', 59, 11),
  ('Joseph', 'Khuu', 'joseph@student.com', 'student123', 'Flyers A', 'Male', 'English', 'A2', '2014-11-29', 89.5, 'Mrs. Khuu Dung', '0987654348', 'Imperia Garden', 'Good', 'Fair', 'Good', 'Fair', 54, 16),
  ('Victoria', 'Diep', 'victoria@student.com', 'student123', 'Flyers A', 'Female', 'English', 'A2', '2014-07-14', 92.6, 'Mrs. Diep Thanh', '0987654349', 'Smart City Tower A', 'Excellent', 'Excellent', 'Good', 'Excellent', 57, 13),
  ('Samuel', 'Ngan', 'samuel@student.com', 'student123', 'Flyers A', 'Male', 'English', 'A2', '2014-09-22', 90.2, 'Mr. Ngan Loc', '0987654350', 'Vincom Mall Area', 'Good', 'Good', 'Excellent', 'Good', 55, 15);

-- =============================================
-- CURRICULUM (15 lessons across different stages)
-- =============================================

-- Starters Lessons
INSERT INTO curriculum (teacher_name, subject, lesson_title, lesson_date, lesson_skills, success_criteria,
  wp1_type, wp1_url, wp1_name,
  wp2_type, wp2_url, wp2_name,
  ma1_type, ma1_url, ma1_name,
  ma2_type, ma2_url, ma2_name,
  ma3_type, ma3_url, ma3_name,
  hw1_type, hw1_url, hw1_name,
  hw2_type, hw2_url, hw2_name,
  p1_type, p1_url, p1_name) VALUES
  ('Donald Chapman', 'English', 'Numbers 1-10', '2025-06-02', 'Speaking, Counting, Recognition', 'Students can count from 1 to 10 and recognize written numbers',
    'pdf', 'https://example.com/warmup/number-song.pdf', 'Number Song Lyrics',
    'link', 'https://youtube.com/watch?v=example', 'Number Song Video',
    'pdf', 'https://example.com/activities/number-flashcards.pdf', 'Number Flashcards',
    'image', 'https://example.com/activities/counting-game.jpg', 'Counting Game Board',
    'pdf', 'https://example.com/activities/number-bingo.pdf', 'Number Bingo',
    'pdf', 'https://example.com/homework/count-color.pdf', 'Count and Color Worksheet',
    'pdf', 'https://example.com/homework/trace-numbers.pdf', 'Trace Numbers 1-10',
    'pdf', 'https://example.com/printables/number-cards.pdf', 'Printable Number Cards'),

  ('Sarah Johnson', 'English', 'Colors and Shapes', '2025-06-03', 'Vocabulary, Speaking, Recognition', 'Students can name 8 colors and 4 basic shapes',
    'pdf', 'https://example.com/warmup/color-song.pdf', 'Rainbow Song',
    'link', 'https://youtube.com/watch?v=colors', 'Colors Video',
    'pdf', 'https://example.com/activities/color-flashcards.pdf', 'Color Flashcards',
    'pdf', 'https://example.com/activities/shape-hunt.pdf', 'Shape Hunt Activity',
    'image', 'https://example.com/activities/color-mixing.jpg', 'Color Mixing Chart',
    'pdf', 'https://example.com/homework/color-worksheet.pdf', 'Color the Shapes',
    'pdf', 'https://example.com/homework/match-colors.pdf', 'Match Colors and Names',
    'pdf', 'https://example.com/printables/shape-templates.pdf', 'Shape Templates'),

  ('Michael Chen', 'English', 'Family Members', '2025-06-04', 'Speaking, Vocabulary, Listening', 'Students can name immediate family members and use possessive adjectives',
    'pdf', 'https://example.com/warmup/family-finger.pdf', 'Finger Family Song',
    'image', 'https://example.com/warmup/family-tree.jpg', 'Sample Family Tree',
    'pdf', 'https://example.com/activities/family-flashcards.pdf', 'Family Member Flashcards',
    'pdf', 'https://example.com/activities/family-story.pdf', 'My Family Story Template',
    'link', 'https://example.com/activities/family-game', 'Family Guessing Game',
    'pdf', 'https://example.com/homework/draw-family.pdf', 'Draw Your Family',
    'pdf', 'https://example.com/homework/family-sentences.pdf', 'Family Sentences Worksheet',
    'pdf', 'https://example.com/printables/family-cards.pdf', 'Family Member Cards'),

  ('Emma Williams', 'English', 'Animals on the Farm', '2025-06-05', 'Vocabulary, Animal Sounds, Speaking', 'Students can name 10 farm animals and make their sounds',
    'pdf', 'https://example.com/warmup/old-macdonald.pdf', 'Old MacDonald Song',
    'link', 'https://youtube.com/watch?v=farm', 'Farm Animals Video',
    'pdf', 'https://example.com/activities/animal-flashcards.pdf', 'Farm Animal Flashcards',
    'pdf', 'https://example.com/activities/animal-sounds.pdf', 'Animal Sound Matching',
    'image', 'https://example.com/activities/farm-scene.jpg', 'Farm Scene Picture',
    'pdf', 'https://example.com/homework/animal-worksheet.pdf', 'Name the Animals',
    'pdf', 'https://example.com/homework/animal-homes.pdf', 'Where Do They Live?',
    'pdf', 'https://example.com/printables/animal-masks.pdf', 'Animal Mask Templates'),

  ('James Brown', 'English', 'My Body Parts', '2025-06-09', 'Vocabulary, Speaking, TPR', 'Students can name 12 body parts and follow TPR commands',
    'pdf', 'https://example.com/warmup/head-shoulders.pdf', 'Head Shoulders Knees and Toes',
    'link', 'https://youtube.com/watch?v=body', 'Body Parts Song',
    'pdf', 'https://example.com/activities/body-flashcards.pdf', 'Body Parts Flashcards',
    'pdf', 'https://example.com/activities/simon-says.pdf', 'Simon Says Body Parts',
    'image', 'https://example.com/activities/body-poster.jpg', 'Body Parts Poster',
    'pdf', 'https://example.com/homework/label-body.pdf', 'Label the Body',
    'pdf', 'https://example.com/homework/body-actions.pdf', 'Body Actions Worksheet',
    'pdf', 'https://example.com/printables/body-puppet.pdf', 'Body Parts Puppet'),

-- Movers Lessons
  ('Lisa Martinez', 'English', 'Daily Routines', '2025-06-10', 'Speaking, Time, Present Simple', 'Students can describe their daily routine using time expressions',
    'pdf', 'https://example.com/warmup/routine-song.pdf', 'What Do You Do? Song',
    'image', 'https://example.com/warmup/clock-faces.jpg', 'Clock Faces',
    'pdf', 'https://example.com/activities/routine-flashcards.pdf', 'Daily Routine Flashcards',
    'pdf', 'https://example.com/activities/time-matching.pdf', 'Match Time and Activity',
    'pdf', 'https://example.com/activities/my-day.pdf', 'My Day Timeline',
    'pdf', 'https://example.com/homework/routine-worksheet.pdf', 'Write Your Routine',
    'pdf', 'https://example.com/homework/time-practice.pdf', 'Time Practice Sheet',
    'pdf', 'https://example.com/printables/clock-template.pdf', 'Make a Clock'),

  ('David Garcia', 'English', 'Food and Drinks', '2025-06-11', 'Vocabulary, Likes/Dislikes, Ordering', 'Students can name 20 foods and express preferences',
    'pdf', 'https://example.com/warmup/food-song.pdf', 'Do You Like Broccoli? Song',
    'link', 'https://youtube.com/watch?v=food', 'Food Vocabulary Video',
    'pdf', 'https://example.com/activities/food-flashcards.pdf', 'Food and Drink Flashcards',
    'pdf', 'https://example.com/activities/restaurant-role.pdf', 'Restaurant Role Play',
    'image', 'https://example.com/activities/food-pyramid.jpg', 'Food Pyramid',
    'pdf', 'https://example.com/homework/food-survey.pdf', 'Family Food Survey',
    'pdf', 'https://example.com/homework/menu-design.pdf', 'Design a Menu',
    'pdf', 'https://example.com/printables/food-cards.pdf', 'Food Picture Cards'),

  ('Anna Lee', 'English', 'Sports and Hobbies', '2025-06-12', 'Speaking, Present Continuous, Vocabulary', 'Students can name 15 sports and talk about current actions',
    'pdf', 'https://example.com/warmup/sport-chant.pdf', 'Sports Chant',
    'image', 'https://example.com/warmup/sports-collage.jpg', 'Sports Collage',
    'pdf', 'https://example.com/activities/sport-flashcards.pdf', 'Sports Flashcards',
    'pdf', 'https://example.com/activities/mime-game.pdf', 'Sports Mime Game',
    'pdf', 'https://example.com/activities/sport-interview.pdf', 'Sports Interview Sheet',
    'pdf', 'https://example.com/homework/sport-worksheet.pdf', 'My Favorite Sport',
    'pdf', 'https://example.com/homework/continuous-practice.pdf', 'Present Continuous Practice',
    'pdf', 'https://example.com/printables/sport-badges.pdf', 'Sport Badge Templates'),

  ('Tom Wilson', 'English', 'Weather and Seasons', '2025-06-16', 'Vocabulary, Describing Weather, Seasons', 'Students can describe weather and name activities for each season',
    'pdf', 'https://example.com/warmup/weather-song.pdf', 'How is the Weather? Song',
    'link', 'https://youtube.com/watch?v=weather', 'Weather Song Video',
    'pdf', 'https://example.com/activities/weather-flashcards.pdf', 'Weather Flashcards',
    'pdf', 'https://example.com/activities/weather-wheel.pdf', 'Weather Wheel Craft',
    'image', 'https://example.com/activities/seasons-poster.jpg', 'Four Seasons Poster',
    'pdf', 'https://example.com/homework/weather-diary.pdf', 'Weather Diary Week',
    'pdf', 'https://example.com/homework/season-activities.pdf', 'Season Activities Sheet',
    'pdf', 'https://example.com/printables/weather-symbols.pdf', 'Weather Symbols'),

  ('Maria Rodriguez', 'English', 'In the Town', '2025-06-17', 'Vocabulary, Directions, Prepositions', 'Students can name 15 places in town and give simple directions',
    'pdf', 'https://example.com/warmup/town-song.pdf', 'Places in Town Song',
    'image', 'https://example.com/warmup/town-map.jpg', 'Town Map',
    'pdf', 'https://example.com/activities/place-flashcards.pdf', 'Places Flashcards',
    'pdf', 'https://example.com/activities/map-activity.pdf', 'Find the Place Map Activity',
    'pdf', 'https://example.com/activities/direction-game.pdf', 'Directions Board Game',
    'pdf', 'https://example.com/homework/my-town.pdf', 'Draw Your Town',
    'pdf', 'https://example.com/homework/directions-worksheet.pdf', 'Give Directions',
    'pdf', 'https://example.com/printables/town-buildings.pdf', 'Town Building Templates'),

-- Flyers Lessons
  ('Donald Chapman', 'English', 'Past Tense Stories', '2025-06-18', 'Past Simple, Story Writing, Sequencing', 'Students can write a short story using past simple tense',
    'pdf', 'https://example.com/warmup/past-chant.pdf', 'Past Tense Chant',
    'image', 'https://example.com/warmup/story-cards.jpg', 'Story Sequence Cards',
    'pdf', 'https://example.com/activities/verb-flashcards.pdf', 'Irregular Verb Flashcards',
    'pdf', 'https://example.com/activities/story-dice.pdf', 'Story Dice Game',
    'pdf', 'https://example.com/activities/writing-frame.pdf', 'Story Writing Frame',
    'pdf', 'https://example.com/homework/past-story.pdf', 'Write Your Past Story',
    'pdf', 'https://example.com/homework/verb-practice.pdf', 'Past Tense Verb Practice',
    'pdf', 'https://example.com/printables/story-strips.pdf', 'Story Comic Strips'),

  ('Sarah Johnson', 'English', 'Future Plans and Predictions', '2025-06-19', 'Will/Going to, Future Time, Speaking', 'Students can talk about future plans using will and going to',
    'pdf', 'https://example.com/warmup/future-song.pdf', 'What Will You Do? Song',
    'link', 'https://youtube.com/watch?v=future', 'Future Tense Video',
    'pdf', 'https://example.com/activities/future-cards.pdf', 'Future Activity Cards',
    'pdf', 'https://example.com/activities/prediction-game.pdf', 'Weather Prediction Game',
    'pdf', 'https://example.com/activities/planning-sheet.pdf', 'Weekend Plans Sheet',
    'pdf', 'https://example.com/homework/future-plans.pdf', 'My Future Plans',
    'pdf', 'https://example.com/homework/predictions.pdf', 'Make Predictions',
    'pdf', 'https://example.com/printables/future-cards.pdf', 'Future Time Cards'),

  ('Michael Chen', 'English', 'Comparing Things', '2025-06-23', 'Comparatives, Superlatives, Adjectives', 'Students can compare people, animals and objects using comparative and superlative forms',
    'pdf', 'https://example.com/warmup/comparison-song.pdf', 'Bigger, Faster, Stronger Song',
    'image', 'https://example.com/warmup/animal-sizes.jpg', 'Animal Size Comparison',
    'pdf', 'https://example.com/activities/adjective-cards.pdf', 'Adjective Flashcards',
    'pdf', 'https://example.com/activities/comparison-game.pdf', 'Top Trumps Comparison Game',
    'pdf', 'https://example.com/activities/survey-sheet.pdf', 'Class Comparison Survey',
    'pdf', 'https://example.com/homework/comparative-worksheet.pdf', 'Comparative Practice',
    'pdf', 'https://example.com/homework/superlatives.pdf', 'Superlative Sentences',
    'pdf', 'https://example.com/printables/comparison-cards.pdf', 'Comparison Picture Cards'),

  ('Emma Williams', 'English', 'Environment and Nature', '2025-06-24', 'Vocabulary, Present Perfect, Environmental Issues', 'Students can discuss environmental topics and use present perfect for experiences',
    'pdf', 'https://example.com/warmup/earth-song.pdf', 'Save the Earth Song',
    'link', 'https://youtube.com/watch?v=environment', 'Environment Documentary Clip',
    'pdf', 'https://example.com/activities/nature-flashcards.pdf', 'Nature Vocabulary Cards',
    'pdf', 'https://example.com/activities/eco-debate.pdf', 'Environmental Debate Cards',
    'image', 'https://example.com/activities/pollution-poster.jpg', 'Pollution Effects Poster',
    'pdf', 'https://example.com/homework/eco-project.pdf', 'Eco-Friendly Project',
    'pdf', 'https://example.com/homework/present-perfect.pdf', 'Present Perfect Practice',
    'pdf', 'https://example.com/printables/recycling-signs.pdf', 'Recycling Sign Templates'),

  ('James Brown', 'English', 'Technology and Communication', '2025-06-25', 'Vocabulary, Modal Verbs, Discussion', 'Students can discuss technology uses and express ability and permission',
    'pdf', 'https://example.com/warmup/tech-quiz.pdf', 'Technology Quick Quiz',
    'image', 'https://example.com/warmup/devices-poster.jpg', 'Modern Devices Poster',
    'pdf', 'https://example.com/activities/tech-flashcards.pdf', 'Technology Flashcards',
    'pdf', 'https://example.com/activities/modal-game.pdf', 'Can/Could/May Game',
    'pdf', 'https://example.com/activities/debate-sheet.pdf', 'Technology Debate Topics',
    'pdf', 'https://example.com/homework/tech-essay.pdf', 'Technology in My Life Essay',
    'pdf', 'https://example.com/homework/modal-practice.pdf', 'Modal Verbs Practice',
    'pdf', 'https://example.com/printables/device-cards.pdf', 'Device Picture Cards');

-- =============================================
-- ASSESSMENTS (20 assessments)
-- =============================================

-- Starters A Assessments
INSERT INTO assessment (student_name, class, test_name, rubrics, r1, r1_score, r2, r2_score, r3, r3_score, r4, r4_score, r5, r5_score, published, assessment_date, feedback) VALUES
  ('Emma Nguyen', 'Starters A', 'Unit 1: Numbers Test', 'Speaking and Recognition', 'Pronunciation', 4.5, 'Fluency', 4.0, 'Number Recognition', 5.0, 'Counting Accuracy', 4.5, 'Confidence', 4.0, true, '2025-06-03', 'Excellent work! Very confident with numbers 1-10.'),
  ('Liam Tran', 'Starters A', 'Unit 1: Numbers Test', 'Speaking and Recognition', 'Pronunciation', 3.5, 'Fluency', 3.0, 'Number Recognition', 4.0, 'Counting Accuracy', 3.5, 'Confidence', 3.0, true, '2025-06-03', 'Good effort. Practice counting aloud at home.'),
  ('Olivia Le', 'Starters A', 'Unit 1: Numbers Test', 'Speaking and Recognition', 'Pronunciation', 4.0, 'Fluency', 4.5, 'Number Recognition', 4.5, 'Counting Accuracy', 4.0, 'Confidence', 4.5, true, '2025-06-03', 'Great job! Very enthusiastic participation.'),
  ('Emma Nguyen', 'Starters A', 'Unit 2: Colors Test', 'Vocabulary and Recognition', 'Color Naming', 5.0, 'Color Recognition', 4.5, 'Pronunciation', 4.5, 'Creativity', 5.0, 'Participation', 5.0, true, '2025-06-10', 'Outstanding! Knows all colors and uses them creatively.'),
  ('Sophia Hoang', 'Starters A', 'Unit 2: Colors Test', 'Vocabulary and Recognition', 'Color Naming', 4.5, 'Color Recognition', 4.5, 'Pronunciation', 4.0, 'Creativity', 4.5, 'Participation', 4.5, true, '2025-06-10', 'Excellent work with colors and shapes!'),

-- Starters B Assessments
  ('Isabella Bui', 'Starters B', 'Unit 1: Numbers Test', 'Speaking and Recognition', 'Pronunciation', 5.0, 'Fluency', 4.5, 'Number Recognition', 5.0, 'Counting Accuracy', 5.0, 'Confidence', 4.5, true, '2025-06-03', 'Perfect score! Exceptional understanding of numbers.'),
  ('James Trinh', 'Starters B', 'Unit 1: Numbers Test', 'Speaking and Recognition', 'Pronunciation', 4.5, 'Fluency', 4.5, 'Number Recognition', 5.0, 'Counting Accuracy', 4.5, 'Confidence', 4.0, true, '2025-06-03', 'Very strong performance. Great pronunciation!'),
  ('Charlotte Ly', 'Starters B', 'Unit 1: Numbers Test', 'Speaking and Recognition', 'Pronunciation', 5.0, 'Fluency', 5.0, 'Number Recognition', 5.0, 'Counting Accuracy', 5.0, 'Confidence', 5.0, true, '2025-06-03', 'Perfect in every category! Outstanding student.'),

-- Movers A Assessments
  ('Harper Dinh', 'Movers A', 'Daily Routines Test', 'Speaking and Time', 'Time Expression Use', 4.5, 'Routine Vocabulary', 5.0, 'Sentence Structure', 4.5, 'Fluency', 4.5, 'Accuracy', 4.5, true, '2025-06-12', 'Excellent understanding of daily routines and time.'),
  ('Alexander Tang', 'Movers A', 'Daily Routines Test', 'Speaking and Time', 'Time Expression Use', 4.0, 'Routine Vocabulary', 4.5, 'Sentence Structure', 4.0, 'Fluency', 4.0, 'Accuracy', 4.0, true, '2025-06-12', 'Good work! Keep practicing telling time.'),
  ('Daniel Huynh', 'Movers A', 'Daily Routines Test', 'Speaking and Time', 'Time Expression Use', 4.5, 'Routine Vocabulary', 4.5, 'Sentence Structure', 5.0, 'Fluency', 4.5, 'Accuracy', 4.5, true, '2025-06-12', 'Great sentence structures! Very impressive.'),
  ('Harper Dinh', 'Movers A', 'Food Preferences Test', 'Vocabulary and Expression', 'Food Vocabulary', 5.0, 'Likes/Dislikes Expression', 4.5, 'Pronunciation', 4.5, 'Conversational Skills', 5.0, 'Creativity', 4.5, true, '2025-06-15', 'Wonderful vocabulary range! Excellent conversation skills.'),
  ('Emily Luu', 'Movers A', 'Food Preferences Test', 'Vocabulary and Expression', 'Food Vocabulary', 4.5, 'Likes/Dislikes Expression', 5.0, 'Pronunciation', 4.5, 'Conversational Skills', 4.5, 'Creativity', 4.5, true, '2025-06-15', 'Great expressions! Very natural communication.'),

-- Flyers A Assessments
  ('William Bach', 'Flyers A', 'Past Tense Writing', 'Writing and Grammar', 'Past Tense Accuracy', 5.0, 'Story Structure', 4.5, 'Vocabulary Range', 5.0, 'Spelling', 4.5, 'Creativity', 5.0, true, '2025-06-20', 'Excellent storytelling! Strong command of past tense.'),
  ('Elizabeth Kieu', 'Flyers A', 'Past Tense Writing', 'Writing and Grammar', 'Past Tense Accuracy', 4.5, 'Story Structure', 5.0, 'Vocabulary Range', 4.5, 'Spelling', 5.0, 'Creativity', 4.5, true, '2025-06-20', 'Very well-structured story. Great use of linking words.'),
  ('Sofia Tong', 'Flyers A', 'Past Tense Writing', 'Writing and Grammar', 'Past Tense Accuracy', 4.5, 'Story Structure', 4.5, 'Vocabulary Range', 5.0, 'Spelling', 4.5, 'Creativity', 5.0, true, '2025-06-20', 'Impressive vocabulary! Very engaging story.'),
  ('William Bach', 'Flyers A', 'Future Tense Speaking', 'Speaking and Grammar', 'Will/Going to Use', 5.0, 'Fluency', 4.5, 'Accuracy', 5.0, 'Pronunciation', 4.5, 'Confidence', 5.0, true, '2025-06-22', 'Outstanding! Very confident with future forms.'),
  ('Victoria Diep', 'Flyers A', 'Future Tense Speaking', 'Speaking and Grammar', 'Will/Going to Use', 4.5, 'Fluency', 5.0, 'Accuracy', 4.5, 'Pronunciation', 5.0, 'Confidence', 4.5, true, '2025-06-22', 'Excellent fluency and pronunciation!'),
  ('Elizabeth Kieu', 'Flyers A', 'Comparative Test', 'Grammar and Vocabulary', 'Comparative Forms', 5.0, 'Superlative Forms', 4.5, 'Adjective Range', 5.0, 'Accuracy', 4.5, 'Application', 5.0, true, '2025-06-26', 'Perfect understanding of comparatives and superlatives!'),
  ('David Ha', 'Flyers A', 'Comparative Test', 'Grammar and Vocabulary', 'Comparative Forms', 4.0, 'Superlative Forms', 4.0, 'Adjective Range', 4.5, 'Accuracy', 4.0, 'Application', 4.0, true, '2025-06-26', 'Good grasp of the concept. Practice irregular forms.');

-- =============================================
-- SKILLS EVALUATION (40 skill evaluations)
-- =============================================

-- Speaking Skills - Starters
INSERT INTO skills_evaluation (student_name, class, skill_name, skill_category,
  e1, e1_score, e2, e2_score, e3, e3_score, e4, e4_score, e5, e5_score, e6, e6_score, evaluation_date) VALUES
  ('Emma Nguyen', 'Starters A', 'Say numbers 1-10', 'Speaking', 'Can count 1-5', 5.0, 'Can count 6-10', 5.0, 'Can say random numbers', 4.5, 'Clear pronunciation', 4.5, 'Speaks confidently', 4.0, 'Correct intonation', 4.0, '2025-06-03'),
  ('Emma Nguyen', 'Starters A', 'Name colors', 'Speaking', 'Knows primary colors', 5.0, 'Knows secondary colors', 4.5, 'Can describe objects', 5.0, 'Clear pronunciation', 4.5, 'Uses in sentences', 4.5, 'Confident naming', 5.0, '2025-06-10'),
  ('Olivia Le', 'Starters A', 'Say numbers 1-10', 'Speaking', 'Can count 1-5', 5.0, 'Can count 6-10', 4.5, 'Can say random numbers', 4.5, 'Clear pronunciation', 4.0, 'Speaks confidently', 4.5, 'Correct intonation', 4.5, '2025-06-03'),
  ('Sophia Hoang', 'Starters A', 'Name colors', 'Speaking', 'Knows primary colors', 5.0, 'Knows secondary colors', 4.5, 'Can describe objects', 4.5, 'Clear pronunciation', 4.0, 'Uses in sentences', 4.0, 'Confident naming', 4.5, '2025-06-10'),
  ('Charlotte Ly', 'Starters B', 'Say numbers 1-10', 'Speaking', 'Can count 1-5', 5.0, 'Can count 6-10', 5.0, 'Can say random numbers', 5.0, 'Clear pronunciation', 5.0, 'Speaks confidently', 5.0, 'Correct intonation', 5.0, '2025-06-03'),

-- Reading Skills - Starters
  ('Emma Nguyen', 'Starters A', 'Read numbers 1-10', 'Reading', 'Recognizes 1-5', 5.0, 'Recognizes 6-10', 5.0, 'Matches number to word', 4.5, 'Reading speed', 4.0, 'Accuracy', 4.5, 'Confidence', 4.0, '2025-06-03'),
  ('Olivia Le', 'Starters A', 'Read color words', 'Reading', 'Reads primary colors', 4.5, 'Reads secondary colors', 4.0, 'Matches word to color', 4.5, 'Reading fluency', 4.0, 'Pronunciation while reading', 4.0, 'Reading confidence', 4.5, '2025-06-10'),
  ('Isabella Bui', 'Starters B', 'Read numbers 1-10', 'Reading', 'Recognizes 1-5', 5.0, 'Recognizes 6-10', 5.0, 'Matches number to word', 5.0, 'Reading speed', 4.5, 'Accuracy', 5.0, 'Confidence', 4.5, '2025-06-03'),

-- Writing Skills - Starters
  ('Emma Nguyen', 'Starters A', 'Write numbers 1-10', 'Writing', 'Can write 1-5', 4.5, 'Can write 6-10', 4.0, 'Correct formation', 4.5, 'Neat handwriting', 4.0, 'Can copy numbers', 5.0, 'Can write from memory', 4.0, '2025-06-03'),
  ('Sophia Hoang', 'Starters A', 'Write color words', 'Writing', 'Can copy words', 5.0, 'Correct spelling', 4.5, 'Neat handwriting', 5.0, 'Letter formation', 4.5, 'Can write independently', 4.0, 'Uses correct capitalization', 4.0, '2025-06-10'),
  ('Charlotte Ly', 'Starters B', 'Write numbers 1-10', 'Writing', 'Can write 1-5', 5.0, 'Can write 6-10', 5.0, 'Correct formation', 5.0, 'Neat handwriting', 5.0, 'Can copy numbers', 5.0, 'Can write from memory', 4.5, '2025-06-03'),

-- Listening Skills - Starters
  ('Emma Nguyen', 'Starters A', 'Listen and identify numbers', 'Listening', 'Understands 1-5', 5.0, 'Understands 6-10', 4.5, 'Follows instructions', 4.5, 'Responds quickly', 4.0, 'Distinguishes similar sounds', 4.0, 'Sustained attention', 4.5, '2025-06-03'),
  ('Olivia Le', 'Starters A', 'Listen to color descriptions', 'Listening', 'Identifies colors by name', 4.5, 'Follows color instructions', 4.5, 'Comprehends descriptions', 4.0, 'Response accuracy', 4.5, 'Attention span', 4.0, 'Can repeat instructions', 4.0, '2025-06-10'),

-- Speaking Skills - Movers
  ('Harper Dinh', 'Movers A', 'Describe daily routine', 'Speaking', 'Uses time expressions', 4.5, 'Correct verb forms', 5.0, 'Natural fluency', 4.5, 'Pronunciation', 4.5, 'Sentence variety', 4.5, 'Confidence', 5.0, '2025-06-12'),
  ('Daniel Huynh', 'Movers A', 'Describe daily routine', 'Speaking', 'Uses time expressions', 4.5, 'Correct verb forms', 4.5, 'Natural fluency', 4.5, 'Pronunciation', 4.5, 'Sentence variety', 5.0, 'Confidence', 4.5, '2025-06-12'),
  ('Emily Luu', 'Movers A', 'Express food preferences', 'Speaking', 'Uses like/dislike', 5.0, 'Food vocabulary range', 4.5, 'Explains reasons', 4.5, 'Fluency', 4.5, 'Pronunciation', 4.5, 'Natural expression', 5.0, '2025-06-15'),

-- Reading Skills - Movers
  ('Harper Dinh', 'Movers A', 'Read about daily routines', 'Reading', 'Understands main ideas', 5.0, 'Identifies details', 4.5, 'Vocabulary comprehension', 5.0, 'Reading speed', 4.5, 'Can answer questions', 4.5, 'Makes inferences', 4.0, '2025-06-12'),
  ('Alexander Tang', 'Movers A', 'Read food menus', 'Reading', 'Identifies food items', 4.5, 'Understands descriptions', 4.5, 'Comprehends prices', 5.0, 'Reading fluency', 4.0, 'Can make choices', 4.5, 'Asks clarifying questions', 4.0, '2025-06-15'),

-- Writing Skills - Movers
  ('Harper Dinh', 'Movers A', 'Write about daily routine', 'Writing', 'Uses time markers', 4.5, 'Correct present simple', 4.5, 'Sentence structure', 5.0, 'Spelling accuracy', 4.5, 'Punctuation', 4.0, 'Text organization', 4.5, '2025-06-12'),
  ('Daniel Huynh', 'Movers A', 'Write food preferences', 'Writing', 'Uses linking words', 5.0, 'Vocabulary range', 4.5, 'Spelling', 4.5, 'Grammar accuracy', 4.5, 'Creative expression', 5.0, 'Text coherence', 4.5, '2025-06-15'),

-- Listening Skills - Movers
  ('Harper Dinh', 'Movers A', 'Listen to routines description', 'Listening', 'Main idea comprehension', 5.0, 'Detail recognition', 4.5, 'Time comprehension', 4.5, 'Can sequence events', 4.5, 'Note-taking ability', 4.0, 'Sustained listening', 5.0, '2025-06-12'),
  ('Emily Luu', 'Movers A', 'Listen to food orders', 'Listening', 'Identifies food items', 4.5, 'Understands quantities', 5.0, 'Recognizes preferences', 4.5, 'Comprehends prices', 4.5, 'Follows instructions', 4.5, 'Response accuracy', 5.0, '2025-06-15'),

-- Speaking Skills - Flyers
  ('William Bach', 'Flyers A', 'Tell stories in past tense', 'Speaking', 'Past tense accuracy', 5.0, 'Story coherence', 4.5, 'Vocabulary range', 5.0, 'Fluency', 4.5, 'Pronunciation', 4.5, 'Engaging delivery', 5.0, '2025-06-20'),
  ('Elizabeth Kieu', 'Flyers A', 'Tell stories in past tense', 'Speaking', 'Past tense accuracy', 4.5, 'Story coherence', 5.0, 'Vocabulary range', 4.5, 'Fluency', 5.0, 'Pronunciation', 5.0, 'Engaging delivery', 4.5, '2025-06-20'),
  ('William Bach', 'Flyers A', 'Discuss future plans', 'Speaking', 'Will/Going to use', 5.0, 'Time expressions', 4.5, 'Reason explanation', 5.0, 'Fluency', 4.5, 'Confidence', 5.0, 'Interaction quality', 4.5, '2025-06-22'),
  ('Victoria Diep', 'Flyers A', 'Discuss future plans', 'Speaking', 'Will/Going to use', 4.5, 'Time expressions', 5.0, 'Reason explanation', 4.5, 'Fluency', 5.0, 'Confidence', 4.5, 'Interaction quality', 5.0, '2025-06-22'),

-- Reading Skills - Flyers
  ('William Bach', 'Flyers A', 'Read past tense stories', 'Reading', 'Comprehension', 5.0, 'Vocabulary understanding', 5.0, 'Inferences', 4.5, 'Reading speed', 4.5, 'Critical thinking', 5.0, 'Can summarize', 4.5, '2025-06-20'),
  ('Elizabeth Kieu', 'Flyers A', 'Read future predictions', 'Reading', 'Main idea identification', 5.0, 'Detail extraction', 4.5, 'Future form recognition', 5.0, 'Vocabulary range', 4.5, 'Can evaluate', 4.5, 'Reading fluency', 5.0, '2025-06-22'),

-- Writing Skills - Flyers
  ('William Bach', 'Flyers A', 'Write past tense narratives', 'Writing', 'Past tense accuracy', 5.0, 'Story structure', 4.5, 'Vocabulary range', 5.0, 'Spelling', 4.5, 'Punctuation', 5.0, 'Creative ideas', 5.0, '2025-06-20'),
  ('Elizabeth Kieu', 'Flyers A', 'Write past tense narratives', 'Writing', 'Past tense accuracy', 4.5, 'Story structure', 5.0, 'Vocabulary range', 4.5, 'Spelling', 5.0, 'Punctuation', 4.5, 'Creative ideas', 4.5, '2025-06-20'),
  ('Sofia Tong', 'Flyers A', 'Write future predictions', 'Writing', 'Future form accuracy', 4.5, 'Logical structure', 4.5, 'Vocabulary sophistication', 5.0, 'Grammar accuracy', 4.5, 'Coherence', 4.5, 'Originality', 5.0, '2025-06-22'),

-- Listening Skills - Flyers
  ('William Bach', 'Flyers A', 'Listen to past events', 'Listening', 'Comprehends main events', 5.0, 'Identifies details', 4.5, 'Sequences correctly', 5.0, 'Note-taking', 4.5, 'Can retell', 5.0, 'Critical listening', 4.5, '2025-06-20'),
  ('Elizabeth Kieu', 'Flyers A', 'Listen to future discussions', 'Listening', 'Understands predictions', 4.5, 'Identifies reasons', 5.0, 'Comprehends opinions', 4.5, 'Can summarize', 5.0, 'Evaluates arguments', 4.5, 'Active listening', 5.0, '2025-06-22'),
  ('Victoria Diep', 'Flyers A', 'Listen to comparisons', 'Listening', 'Identifies comparatives', 5.0, 'Recognizes superlatives', 4.5, 'Understands context', 5.0, 'Draws conclusions', 4.5, 'Can question', 4.5, 'Sustained attention', 5.0, '2025-06-26'),
  ('David Ha', 'Flyers A', 'Listen to comparisons', 'Listening', 'Identifies comparatives', 4.0, 'Recognizes superlatives', 4.0, 'Understands context', 4.5, 'Draws conclusions', 4.0, 'Can question', 4.0, 'Sustained attention', 4.5, '2025-06-26');

-- =============================================
-- BLOG POSTS (10 posts)
-- =============================================

INSERT INTO blog_posts (title, content, author, category, published, published_date, tags) VALUES
  ('Engaging Young Learners Through Games',
   'Teaching young learners requires creativity and energy. Games are one of the most effective tools in your teaching arsenal. Here are some proven strategies for using games effectively in the Cambridge Young Learners classroom...',
   'Donald Chapman', 'Teaching Tips', true, '2025-06-01', ARRAY['games', 'young learners', 'engagement']),

  ('Preparing Students for Cambridge Starters',
   'The Pre-A1 Starters exam is the first step in the Cambridge journey. This guide covers everything you need to know about preparing your students for success, from vocabulary building to test-taking strategies...',
   'Sarah Johnson', 'Exam Preparation', true, '2025-06-05', ARRAY['starters', 'exam prep', 'cambridge']),

  ('Using Technology in the ESL Classroom',
   'Digital tools can transform your teaching. From interactive whiteboards to educational apps, discover how to integrate technology effectively while maintaining engagement and learning outcomes...',
   'Tom Wilson', 'Technology', true, '2025-06-08', ARRAY['technology', 'digital tools', 'modern teaching']),

  ('Building Vocabulary Through Context',
   'Vocabulary acquisition is crucial for language development. Learn how to teach new words in meaningful contexts rather than through rote memorization, making learning more effective and enjoyable...',
   'Lisa Martinez', 'Teaching Methods', true, '2025-06-10', ARRAY['vocabulary', 'context', 'teaching methods']),

  ('The Power of Storytelling in Language Learning',
   'Stories captivate young minds and provide natural language input. Discover techniques for using storytelling to teach grammar, vocabulary, and cultural concepts in an engaging way...',
   'Anna Lee', 'Storytelling', true, '2025-06-12', ARRAY['storytelling', 'engagement', 'cultural learning']),

  ('Managing Mixed-Ability Classrooms',
   'Every class has students at different levels. Learn practical strategies for differentiating instruction, providing appropriate challenges, and ensuring all students make progress...',
   'Maria Rodriguez', 'Classroom Management', true, '2025-06-15', ARRAY['differentiation', 'mixed-ability', 'classroom management']),

  ('Phonics vs Whole Language: Finding Balance',
   'The debate continues, but the answer lies in combining approaches. Explore how to integrate systematic phonics instruction with meaning-based whole language activities for optimal reading development...',
   'James Brown', 'Reading Instruction', true, '2025-06-18', ARRAY['phonics', 'reading', 'literacy']),

  ('Creating an English-Rich Environment',
   'Transform your classroom into an immersive English environment. From word walls to interactive displays, learn how to surround students with meaningful English input throughout the school day...',
   'David Garcia', 'Classroom Setup', true, '2025-06-20', ARRAY['environment', 'immersion', 'classroom design']),

  ('Assessment for Learning: Beyond Tests',
   'Assessment should inform instruction, not just measure outcomes. Discover formative assessment techniques that help you understand student progress and adjust your teaching in real-time...',
   'Emma Williams', 'Assessment', true, '2025-06-22', ARRAY['assessment', 'formative', 'feedback']),

  ('Parent Communication: Building Partnerships',
   'Strong parent relationships enhance student success. Learn effective strategies for communicating progress, addressing concerns, and involving parents in their child''s English learning journey...',
   'Michael Chen', 'Parent Relations', true, '2025-06-24', ARRAY['parents', 'communication', 'partnerships']);

-- Calculate average scores for skills evaluations
UPDATE skills_evaluation
SET average_score = (
  COALESCE(e1_score, 0) +
  COALESCE(e2_score, 0) +
  COALESCE(e3_score, 0) +
  COALESCE(e4_score, 0) +
  COALESCE(e5_score, 0) +
  COALESCE(e6_score, 0)
) / 6.0;

-- Calculate total scores for assessments
UPDATE assessment
SET total_score = (
  COALESCE(r1_score, 0) +
  COALESCE(r2_score, 0) +
  COALESCE(r3_score, 0) +
  COALESCE(r4_score, 0) +
  COALESCE(r5_score, 0)
) / 5.0;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Check data counts
SELECT 'Teachers' as table_name, COUNT(*) as count FROM teachers
UNION ALL
SELECT 'Students', COUNT(*) FROM dashboard_students
UNION ALL
SELECT 'Curriculum Lessons', COUNT(*) FROM curriculum
UNION ALL
SELECT 'Assessments', COUNT(*) FROM assessment
UNION ALL
SELECT 'Skills Evaluations', COUNT(*) FROM skills_evaluation
UNION ALL
SELECT 'Blog Posts', COUNT(*) FROM blog_posts;

COMMENT ON DATABASE postgres IS 'HeroSchool - Populated with comprehensive sample data including 10 teachers, 30 students, 15 lessons, 20 assessments, 40 skill evaluations, and 10 blog posts';
