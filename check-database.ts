import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mqlihjzdfkhaomehxbye.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xbGloanpkZmtoYW9tZWh4YnllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MDY0MjIsImV4cCI6MjA3NjM4MjQyMn0.7y_UHl4QbRcHkvJMDQ9qwFPCtVJrIm_WXF5NaUkT5k8';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkDatabase() {
  console.log('🔍 Checking database users...\n');

  // Check admins
  console.log('=== ADMINS ===');
  const { data: admins, error: adminError } = await supabase
    .from('admins')
    .select('*');

  if (adminError) {
    console.error('❌ Error querying admins:', adminError.message);
  } else {
    console.log(`Found ${admins?.length || 0} admins`);
    admins?.forEach(admin => {
      console.log(`  - ${admin.name} ${admin.surname} (${admin.email}) | password: ${admin.password} | active: ${admin.is_active}`);
    });
  }

  // Check teachers
  console.log('\n=== TEACHERS ===');
  const { data: teachers, error: teacherError } = await supabase
    .from('teachers')
    .select('id, name, surname, email, username, password, is_active');

  if (teacherError) {
    console.error('❌ Error querying teachers:', teacherError.message);
  } else {
    console.log(`Found ${teachers?.length || 0} teachers`);
    teachers?.forEach(teacher => {
      console.log(`  - ${teacher.name} ${teacher.surname} (${teacher.email || 'no email'}) | username: ${teacher.username || 'none'} | password: ${teacher.password || 'none'} | active: ${teacher.is_active}`);
    });
  }

  // Check students
  console.log('\n=== STUDENTS ===');
  const { data: students, error: studentError } = await supabase
    .from('dashboard_students')
    .select('id, name, surname, email, password, is_active')
    .limit(5);

  if (studentError) {
    console.error('❌ Error querying students:', studentError.message);
  } else {
    console.log(`Found ${students?.length || 0} students (showing first 5)`);
    students?.forEach(student => {
      console.log(`  - ${student.name} ${student.surname} (${student.email}) | password: ${student.password || 'none'} | active: ${student.is_active}`);
    });
  }
}

checkDatabase();
