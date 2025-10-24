import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mqlihjzdfkhaomehxbye.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xbGloanpkZmtoYW9tZWh4YnllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MDY0MjIsImV4cCI6MjA3NjM4MjQyMn0.7y_UHl4QbRcHkvJMDQ9qwFPCtVJrIm_WXF5NaUkT5k8';

const supabase = createClient(supabaseUrl, anonKey);

async function checkAllDonaldTeachers() {
  console.log('🔍 Checking for ALL teachers named Donald or with surname cjapi/chapman...\n');
  console.log('Database: REMOTE (https://mqlihjzdfkhaomehxbye.supabase.co)\n');
  console.log('='.repeat(70));

  // Check for Donald in name
  const { data: donaldByName, error: error1 } = await supabase
    .from('teachers')
    .select('*')
    .ilike('name', '%donald%');

  // Check for cjapi in surname
  const { data: cjapiTeachers, error: error2 } = await supabase
    .from('teachers')
    .select('*')
    .ilike('surname', '%cjapi%');

  // Check for chapman in surname
  const { data: chapmanTeachers, error: error3 } = await supabase
    .from('teachers')
    .select('*')
    .ilike('surname', '%chapman%');

  console.log('\n📋 Teachers with "Donald" in name:');
  if (error1) {
    console.log('❌ Error:', error1.message);
  } else if (donaldByName && donaldByName.length > 0) {
    donaldByName.forEach((teacher, idx) => {
      console.log(`\n${idx + 1}. ${teacher.name} ${teacher.surname}`);
      console.log(`   UUID: ${teacher.id}`);
      console.log(`   Email: ${teacher.email}`);
      console.log(`   Active: ${teacher.is_active}`);
      console.log(`   Created: ${teacher.created_at}`);
    });
  } else {
    console.log('   No teachers found with "Donald" in name');
  }

  console.log('\n📋 Teachers with "cjapi" in surname:');
  if (error2) {
    console.log('❌ Error:', error2.message);
  } else if (cjapiTeachers && cjapiTeachers.length > 0) {
    cjapiTeachers.forEach((teacher, idx) => {
      console.log(`\n${idx + 1}. ${teacher.name} ${teacher.surname}`);
      console.log(`   UUID: ${teacher.id}`);
      console.log(`   Email: ${teacher.email}`);
      console.log(`   Active: ${teacher.is_active}`);
      console.log(`   Created: ${teacher.created_at}`);
    });
  } else {
    console.log('   No teachers found with "cjapi" in surname');
  }

  console.log('\n📋 Teachers with "chapman" in surname:');
  if (error3) {
    console.log('❌ Error:', error3.message);
  } else if (chapmanTeachers && chapmanTeachers.length > 0) {
    chapmanTeachers.forEach((teacher, idx) => {
      console.log(`\n${idx + 1}. ${teacher.name} ${teacher.surname}`);
      console.log(`   UUID: ${teacher.id}`);
      console.log(`   Email: ${teacher.email}`);
      console.log(`   Active: ${teacher.is_active}`);
      console.log(`   Created: ${teacher.created_at}`);
    });
  } else {
    console.log('   No teachers found with "chapman" in surname');
  }

  // Get total count of all teachers
  const { count, error: countError } = await supabase
    .from('teachers')
    .select('*', { count: 'exact', head: true });

  console.log('\n' + '='.repeat(70));
  console.log(`\n📊 Total teachers in remote database: ${count ?? 'unknown'}`);

  console.log('\n⚠️  IMPORTANT NOTE:');
  console.log('I only DELETED teacher_assignments records, NOT teacher records!');
  console.log('All teacher profiles remain intact.');
  console.log('The migration only cleared old assignments and created new ones.');
}

checkAllDonaldTeachers().catch(console.error);
