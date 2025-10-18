# Sample Data Documentation

## 📊 Database Population Complete!

I've created comprehensive sample data for your HeroSchool dashboard system.

## 🎯 What's Included

### Teachers (10)
- Donald Chapman (donald@heroschool.com) - You!
- Sarah Johnson, Michael Chen, Emma Williams, James Brown
- Lisa Martinez, David Garcia, Anna Lee, Tom Wilson, Maria Rodriguez

**All use password:** `teacher123`

### Students (30 students across 4 classes)

**Starters A (8 students)**
- Emma Nguyen, Liam Tran, Olivia Le, Noah Pham
- Sophia Hoang, Mason Dang, Ava Vo, Lucas Ngo

**Starters B (8 students)**
- Isabella Bui, Ethan Do, Mia Duong, James Trinh
- Charlotte Ly, Benjamin Mai, Amelia Cao, Henry Vu

**Movers A (7 students)**
- Harper Dinh, Alexander Tang, Evelyn Phan, Daniel Huynh
- Abigail Truong, Matthew Quach, Emily Luu

**Flyers A (7 students)**
- William Bach, Elizabeth Kieu, David Ha, Sofia Tong
- Joseph Khuu, Victoria Diep, Samuel Ngan

**All students use password:** `student123`

### Curriculum (15 complete lessons)

**Starters Level:**
1. Numbers 1-10 (Donald Chapman)
2. Colors and Shapes (Sarah Johnson)
3. Family Members (Michael Chen)
4. Animals on the Farm (Emma Williams)
5. My Body Parts (James Brown)

**Movers Level:**
6. Daily Routines (Lisa Martinez)
7. Food and Drinks (David Garcia)
8. Sports and Hobbies (Anna Lee)
9. Weather and Seasons (Tom Wilson)
10. In the Town (Maria Rodriguez)

**Flyers Level:**
11. Past Tense Stories (Donald Chapman)
12. Future Plans and Predictions (Sarah Johnson)
13. Comparing Things (Michael Chen)
14. Environment and Nature (Emma Williams)
15. Technology and Communication (James Brown)

**Each lesson includes:**
- Warm-ups (WP1-4): Songs, videos, images
- Main Activities (MA1-5): Flashcards, games, activities
- Assessment materials (A1-4)
- Homework (HW1-6): Worksheets, practice sheets
- Printables (P1-4): Templates, cards, crafts

### Assessments (20 published assessments)

**Starters:**
- Unit 1: Numbers Test (Emma, Liam, Olivia)
- Unit 2: Colors Test (Emma, Sophia)
- More Starters assessments for Class B

**Movers:**
- Daily Routines Test (Harper, Alexander, Daniel)
- Food Preferences Test (Harper, Emily)

**Flyers:**
- Past Tense Writing (William, Elizabeth, Sofia)
- Future Tense Speaking (William, Victoria)
- Comparative Test (Elizabeth, David)

**All assessments include:**
- 5 rubric categories (r1-r5)
- Individual scores (0-5 scale)
- Teacher feedback
- Published status

### Skills Evaluations (40 detailed skill assessments)

**Categories:**
- Speaking (12 evaluations)
- Reading (10 evaluations)
- Writing (10 evaluations)
- Listening (8 evaluations)

**Examples:**
- "Say numbers 1-10" (Speaking)
- "Write numbers 1-10" (Writing)
- "Read color words" (Reading)
- "Listen and identify numbers" (Listening)

**Each skill has 6 evaluation points (e1-e6) with scores**

### Blog Posts (10 educational articles)

1. Engaging Young Learners Through Games
2. Preparing Students for Cambridge Starters
3. Using Technology in the ESL Classroom
4. Building Vocabulary Through Context
5. The Power of Storytelling
6. Managing Mixed-Ability Classrooms
7. Phonics vs Whole Language
8. Creating an English-Rich Environment
9. Assessment for Learning
10. Parent Communication

## 🚀 How to Load the Data

### Step 1: Run the Base Schema First
```sql
-- In Supabase SQL Editor, run:
supabase/dashboard-schema.sql
```

### Step 2: Load Sample Data
```sql
-- Then run:
supabase/sample-data.sql
```

### Step 3: Verify
The script will show you a count summary:
```
Teachers: 10
Students: 30
Curriculum Lessons: 15
Assessments: 20
Skills Evaluations: 40
Blog Posts: 10
```

## 🧪 Test Logins

### Teacher Logins
```
Email: donald@heroschool.com
Password: teacher123

Or try: sarah@heroschool.com, michael@heroschool.com, etc.
All use password: teacher123
```

### Student Logins
```
Email: emma@student.com
Password: student123

Or try: liam@student.com, harper@student.com, william@student.com, etc.
All use password: student123
```

## 📈 Data Details

### Student Information Includes:
- Full demographics (name, age, gender, class, level)
- Placement test scores (Speaking, Listening, Reading, Writing)
- Attendance rates (86% - 96% realistic range)
- Sessions tracking (34-60 completed sessions)
- Parent contact info (admin only)
- Location in Smart City area

### Curriculum Materials Format:
```
Each material has:
- type: 'pdf', 'link', 'image', or 'file'
- url: Example URL to resource
- name: Descriptive name

Example:
wp1_type: 'pdf'
wp1_url: 'https://example.com/warmup/number-song.pdf'
wp1_name: 'Number Song Lyrics'
```

### Assessment Scoring:
```
Each rubric (r1-r5) scored on 5-point scale:
1.0 = Poor
2.0 = Fair
3.0 = Good
4.0 = Very Good
5.0 = Excellent

Total score = average of all rubrics
```

### Skills Evaluation:
```
Each evaluation (e1-e6) scored on 5-point scale
Average calculated automatically
Tracks progress across 4 main categories:
- Speaking
- Reading
- Writing
- Listening
```

## 🎨 Realistic Features

### Attendance Rates
- Range: 86.7% to 95.8%
- Reflects real classroom attendance patterns

### Test Scores
- Varied performance levels
- Higher achieving students (Emma, Charlotte, William)
- Average performers
- Students who need support

### Class Distribution
- Balanced gender distribution
- Age-appropriate class assignments
- Realistic parent names (Vietnamese context)
- Smart City area locations

### Curriculum Materials
- Scaffolded difficulty (Starters → Movers → Flyers)
- Variety of material types
- Realistic lesson structure
- Cambridge-aligned topics

## 💡 Using the Data

### View All Students in a Class
```sql
SELECT * FROM dashboard_students
WHERE class = 'Starters A'
ORDER BY name;
```

### See All Assessments for a Student
```sql
SELECT * FROM assessment
WHERE student_name = 'Emma Nguyen'
AND published = true
ORDER BY assessment_date;
```

### Get Skills by Category
```sql
SELECT * FROM skills_evaluation
WHERE student_name = 'William Bach'
AND skill_category = 'Speaking'
ORDER BY evaluation_date;
```

### View Curriculum for a Level
```sql
SELECT lesson_title, teacher_name, lesson_date
FROM curriculum
WHERE subject = 'English'
AND lesson_title LIKE '%Starters%'
ORDER BY lesson_date;
```

### Teacher's Students
```sql
SELECT s.*, c.lesson_title
FROM dashboard_students s
LEFT JOIN curriculum c ON c.teacher_name LIKE '%Chapman%'
WHERE s.class IN ('Starters A', 'Flyers A');
```

## 📚 What You Can Do Now

### As Teacher (Donald)
✅ View all 30 students in My Classes tab
✅ See 15 curriculum lessons you and others created
✅ Review 20 published assessments
✅ Check 40 skill evaluations across all categories
✅ Read 10 blog posts

### As Student (Emma)
✅ See personal details
✅ View published assessments
✅ Check skills progress
✅ Access homework materials (when implemented)
✅ View stats and progress (when implemented)

## 🔄 Resetting Data

To clear and reload:
```sql
-- Uncomment the TRUNCATE lines at the top of sample-data.sql
-- Then run the whole file again
```

## 📊 Data Statistics

```
Total Records: 125+

Teachers: 10
Students: 30
Lessons: 15
  - Starters: 5
  - Movers: 5
  - Flyers: 5

Assessments: 20
  - Starters: 8
  - Movers: 5
  - Flyers: 7

Skills: 40
  - Speaking: 12
  - Reading: 10
  - Writing: 10
  - Listening: 8

Blog Posts: 10

Materials per lesson: 20+ items
  - Warm-ups: 4
  - Main Activities: 5
  - Assessments: 4
  - Homework: 6
  - Printables: 4
```

---

**Your database is now fully populated and ready to test!** 🎉

Login as a teacher or student to see the data in action.
