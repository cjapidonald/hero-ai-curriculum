import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mqlihjzdfkhaomehxbye.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xbGloanpkZmtoYW9tZWh4YnllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MDY0MjIsImV4cCI6MjA3NjM4MjQyMn0.7y_UHl4QbRcHkvJMDQ9qwFPCtVJrIm_WXF5NaUkT5k8';

const supabase = createClient(supabaseUrl, anonKey);

async function checkDonaldAuthMapping() {
  console.log('🔍 Checking Donald Chapman Auth Mapping...\n');
  console.log('='.repeat(70));

  const donaldEmail = 'donald@heroschool.com';
  const donaldTeacherId = '389ea82c-db4c-40be-aee0-6b39785813da';

  // Check teacher record
  console.log('\n1️⃣  Teacher Record:');
  const { data: teacher, error: teacherError } = await supabase
    .from('teachers')
    .select('id, name, surname, email, is_active')
    .eq('email', donaldEmail)
    .single();

  if (teacherError) {
    console.log('❌ Error:', teacherError.message);
  } else if (teacher) {
    console.log(`✅ Found: ${teacher.name} ${teacher.surname}`);
    console.log(`   Teacher ID: ${teacher.id}`);
    console.log(`   Email: ${teacher.email}`);
    console.log(`   Active: ${teacher.is_active}`);
  }

  // Check auth user
  console.log('\n2️⃣  Auth Users (looking for donald@heroschool.com):');
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) {
    console.log('❌ Cannot check auth users with anon key');
    console.log('   (This requires service_role key)');
  } else {
    const donaldAuth = authData.users.find(u => u.email === donaldEmail);
    if (donaldAuth) {
      console.log(`✅ Found auth user: ${donaldAuth.email}`);
      console.log(`   Auth UID: ${donaldAuth.id}`);
    } else {
      console.log('❌ No auth user found for donald@heroschool.com');
    }
  }

  // Check teacher_auth_mapping
  console.log('\n3️⃣  Teacher Auth Mapping:');
  const { data: mapping, error: mappingError } = await supabase
    .from('teacher_auth_mapping')
    .select('*')
    .eq('teacher_id', teacher?.id || donaldTeacherId);

  if (mappingError) {
    console.log('❌ Error:', mappingError.message);
    console.log('   Table might not exist');
  } else if (mapping && mapping.length > 0) {
    console.log('✅ Mapping found:');
    mapping.forEach(m => {
      console.log(`   Teacher ID: ${m.teacher_id}`);
      console.log(`   Auth UID: ${m.auth_uid}`);
    });
  } else {
    console.log('⚠️  No mapping found!');
    console.log('   This might be the problem!');
  }

  // Check teacher_assignments
  console.log('\n4️⃣  Teacher Assignments:');
  if (teacher) {
    const { count, error: countError } = await supabase
      .from('teacher_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('teacher_id', teacher.id);

    if (countError) {
      console.log('❌ Error:', countError.message);
    } else {
      console.log(`   Assignments for teacher.id (${teacher.id}): ${count || 0}`);
    }
  }

  const { count: count2, error: countError2 } = await supabase
    .from('teacher_assignments')
    .select('*', { count: 'exact', head: true })
    .eq('teacher_id', donaldTeacherId);

  if (countError2) {
    console.log('❌ Error:', countError2.message);
  } else {
    console.log(`   Assignments for donaldTeacherId (${donaldTeacherId}): ${count2 || 0}`);
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n💡 DIAGNOSIS:');
  console.log('   If teacher.id !== donaldTeacherId, the IDs don\'t match!');
  console.log('   If no auth mapping exists, that could be the issue.');
  console.log('   The CurriculumTab uses user.id from auth context,');
  console.log('   which needs to match the teacher_id in teacher_assignments.');
}

checkDonaldAuthMapping().catch(console.error);
