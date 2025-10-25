import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mqlihjzdfkhaomehxbye.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xbGloanpkZmtoYW9tZWh4YnllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MDY0MjIsImV4cCI6MjA3NjM4MjQyMn0.7y_UHl4QbRcHkvJMDQ9qwFPCtVJrIm_WXF5NaUkT5k8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testTeacherViewAccess() {
  console.log('Testing Teacher View Access to Database Tables...\n');
  console.log('='.repeat(80));

  // Get a sample teacher
  const { data: teachers, error: teachersError } = await supabase
    .from('teachers')
    .select('id, name, surname, email')
    .eq('is_active', true)
    .limit(1);

  if (teachersError) {
    console.error('❌ FAILED: Cannot access teachers table');
    console.error('Error:', teachersError);
    return;
  }

  if (!teachers || teachers.length === 0) {
    console.error('❌ FAILED: No active teachers found');
    return;
  }

  const teacher = teachers[0];
  console.log(`✓ Teacher found: ${teacher.name} ${teacher.surname} (${teacher.email})`);
  console.log('  Teacher ID:', teacher.id);
  console.log('\n' + '='.repeat(80));

  // Test 1: Access classes table
  console.log('\nTest 1: Access CLASSES table');
  console.log('-'.repeat(80));
  const { data: classes, error: classesError } = await supabase
    .from('classes')
    .select('id, class_name, teacher_id, stage, is_active')
    .eq('teacher_id', teacher.id)
    .eq('is_active', true);

  if (classesError) {
    console.error('❌ FAILED: Cannot access classes');
    console.error('Error:', classesError);
  } else {
    console.log(`✓ SUCCESS: Found ${classes?.length || 0} classes for this teacher`);
    classes?.forEach(cls => {
      console.log(`  - ${cls.class_name} (${cls.stage})`);
    });
  }

  // Test 2: Access students table
  console.log('\n' + '-'.repeat(80));
  console.log('\nTest 2: Access STUDENTS table');
  console.log('-'.repeat(80));
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('id, name, surname, email')
    .limit(5);

  if (studentsError) {
    console.error('❌ FAILED: Cannot access students');
    console.error('Error:', studentsError);
  } else {
    console.log(`✓ SUCCESS: Found ${students?.length || 0} students`);
    students?.forEach(student => {
      console.log(`  - ${student.name} ${student.surname}`);
    });
  }

  // Test 3: Access dashboard_students table
  console.log('\n' + '-'.repeat(80));
  console.log('\nTest 3: Access DASHBOARD_STUDENTS table');
  console.log('-'.repeat(80));
  const { data: dashboardStudents, error: dashboardStudentsError } = await supabase
    .from('dashboard_students')
    .select('id, name, surname, class')
    .limit(5);

  if (dashboardStudentsError) {
    console.error('❌ FAILED: Cannot access dashboard_students');
    console.error('Error:', dashboardStudentsError);
  } else {
    console.log(`✓ SUCCESS: Found ${dashboardStudents?.length || 0} dashboard students`);
    dashboardStudents?.forEach(student => {
      console.log(`  - ${student.name} ${student.surname} (${student.class})`);
    });
  }

  // Test 4: Access curriculum table
  console.log('\n' + '-'.repeat(80));
  console.log('\nTest 4: Access CURRICULUM table');
  console.log('-'.repeat(80));
  const { data: curriculum, error: curriculumError } = await supabase
    .from('curriculum')
    .select('id, lesson_title, subject, stage, class')
    .limit(5);

  if (curriculumError) {
    console.error('❌ FAILED: Cannot access curriculum');
    console.error('Error:', curriculumError);
  } else {
    console.log(`✓ SUCCESS: Found ${curriculum?.length || 0} curriculum items`);
    curriculum?.forEach(item => {
      console.log(`  - ${item.lesson_title} (${item.stage} - ${item.class})`);
    });
  }

  // Test 5: Access enrollments table
  console.log('\n' + '-'.repeat(80));
  console.log('\nTest 5: Access ENROLLMENTS table');
  console.log('-'.repeat(80));
  const { data: enrollments, error: enrollmentsError } = await supabase
    .from('enrollments')
    .select('id, student_id, class_id')
    .limit(5);

  if (enrollmentsError) {
    console.error('❌ FAILED: Cannot access enrollments');
    console.error('Error:', enrollmentsError);
  } else {
    console.log(`✓ SUCCESS: Found ${enrollments?.length || 0} enrollments`);
  }

  // Test 6: Access class_sessions table
  console.log('\n' + '-'.repeat(80));
  console.log('\nTest 6: Access CLASS_SESSIONS table');
  console.log('-'.repeat(80));
  const { data: sessions, error: sessionsError } = await supabase
    .from('class_sessions')
    .select('id, teacher_id, class_id, session_date, status')
    .eq('teacher_id', teacher.id)
    .limit(5);

  if (sessionsError) {
    console.error('❌ FAILED: Cannot access class_sessions');
    console.error('Error:', sessionsError);
  } else {
    console.log(`✓ SUCCESS: Found ${sessions?.length || 0} class sessions for this teacher`);
    sessions?.forEach(session => {
      console.log(`  - ${session.session_date} (${session.status})`);
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ All table access tests completed!');
  console.log('If all tests show SUCCESS, teacher views should work properly.\n');
}

testTeacherViewAccess();
