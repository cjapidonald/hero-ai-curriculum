import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mqlihjzdfkhaomehxbye.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xbGloanpkZmtoYW9tZWh4YnllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MDY0MjIsImV4cCI6MjA3NjM4MjQyMn0.7y_UHl4QbRcHkvJMDQ9qwFPCtVJrIm_WXF5NaUkT5k8';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testLogin() {
  console.log('🔐 Testing Login Functionality\n');
  console.log('================================\n');

  // Test Admin Login
  console.log('1. Testing Admin Login');
  console.log('   Email: admin@heroschool.com');
  console.log('   Password: admin123');

  const { data: admin, error: adminError } = await supabase
    .from('admins')
    .select('*')
    .eq('email', 'admin@heroschool.com')
    .eq('password', 'admin123')
    .eq('is_active', true)
    .single();

  if (adminError || !admin) {
    console.log('   ❌ FAILED:', adminError?.message || 'No data returned');
  } else {
    console.log('   ✅ SUCCESS: Logged in as', admin.name, admin.surname);
  }

  // Test Teacher Login with email
  console.log('\n2. Testing Teacher Login (Email)');
  console.log('   Email: donald@heroschool.com');
  console.log('   Password: teacher123');

  const { data: teacherByEmail, error: teacherEmailError } = await supabase
    .from('teachers')
    .select('*')
    .eq('email', 'donald@heroschool.com')
    .eq('password', 'teacher123')
    .eq('is_active', true)
    .single();

  if (teacherEmailError || !teacherByEmail) {
    console.log('   ❌ FAILED:', teacherEmailError?.message || 'No data returned');
  } else {
    console.log('   ✅ SUCCESS: Logged in as', teacherByEmail.name, teacherByEmail.surname);
  }

  // Test Teacher Login with username
  console.log('\n3. Testing Teacher Login (Username)');
  console.log('   Username: donald');
  console.log('   Password: teacher123');

  const { data: teacherByUsername, error: teacherUsernameError } = await supabase
    .from('teachers')
    .select('*')
    .eq('username', 'donald')
    .eq('password', 'teacher123')
    .eq('is_active', true)
    .single();

  if (teacherUsernameError || !teacherByUsername) {
    console.log('   ❌ FAILED:', teacherUsernameError?.message || 'No data returned');
  } else {
    console.log('   ✅ SUCCESS: Logged in as', teacherByUsername.name, teacherByUsername.surname);
  }

  // Test Teacher Login with OR condition (like the app does)
  console.log('\n4. Testing Teacher Login (OR condition - email/username)');
  console.log('   Input: donald');
  console.log('   Password: teacher123');

  const { data: teacherOr, error: teacherOrError } = await supabase
    .from('teachers')
    .select('*')
    .or(`email.eq.donald,username.eq.donald`)
    .eq('password', 'teacher123')
    .eq('is_active', true)
    .single();

  if (teacherOrError || !teacherOr) {
    console.log('   ❌ FAILED:', teacherOrError?.message || 'No data returned');
  } else {
    console.log('   ✅ SUCCESS: Logged in as', teacherOr.name, teacherOr.surname);
  }

  // Test Student Login
  console.log('\n5. Testing Student Login');
  console.log('   Email: emma@student.com');
  console.log('   Password: student123');

  const { data: student, error: studentError } = await supabase
    .from('dashboard_students')
    .select('*')
    .eq('email', 'emma@student.com')
    .eq('password', 'student123')
    .eq('is_active', true)
    .single();

  if (studentError || !student) {
    console.log('   ❌ FAILED:', studentError?.message || 'No data returned');
  } else {
    console.log('   ✅ SUCCESS: Logged in as', student.name, student.surname);
  }

  console.log('\n================================');
  console.log('✅ Login tests complete!\n');

  console.log('📋 Summary of Working Credentials:');
  console.log('\nAdmin:');
  console.log('  Email: admin@heroschool.com');
  console.log('  Password: admin123');
  console.log('\nTeacher:');
  console.log('  Email: donald@heroschool.com OR Username: donald');
  console.log('  Password: teacher123');
  console.log('\nStudent:');
  console.log('  Email: emma@student.com');
  console.log('  Password: student123');
}

testLogin();
