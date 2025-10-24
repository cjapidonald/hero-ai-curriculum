import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mqlihjzdfkhaomehxbye.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xbGloanpkZmtoYW9tZWh4YnllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MDY0MjIsImV4cCI6MjA3NjM4MjQyMn0.7y_UHl4QbRcHkvJMDQ9qwFPCtVJrIm_WXF5NaUkT5k8';

const supabase = createClient(supabaseUrl, anonKey);

async function verifyAssignments() {
  const donaldChapmanId = '389ea82c-db4c-40be-aee0-6b39785813da';

  console.log('🔍 Verifying Donald Chapman assignments in REMOTE database...\n');
  console.log(`Database URL: ${supabaseUrl}`);
  console.log(`Using key type: ANON (subject to RLS)`);
  console.log(`Donald Chapman UUID: ${donaldChapmanId}\n`);
  console.log('='.repeat(70));

  // Direct count query
  console.log('\n📊 Counting records directly...');

  const { count: assignmentCount, error: assignmentError } = await supabase
    .from('teacher_assignments')
    .select('*', { count: 'exact', head: true })
    .eq('teacher_id', donaldChapmanId);

  if (assignmentError) {
    console.log('❌ Error counting assignments:', assignmentError.message);
  } else {
    console.log(`   teacher_assignments: ${assignmentCount ?? 0}`);
  }

  const { count: sessionCount, error: sessionError } = await supabase
    .from('class_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('teacher_id', donaldChapmanId);

  if (sessionError) {
    console.log('❌ Error counting sessions:', sessionError.message);
  } else {
    console.log(`   class_sessions: ${sessionCount ?? 0}`);
  }

  // Try to fetch actual data
  console.log('\n📝 Fetching assignment details...');
  const { data: assignments, error: fetchError } = await supabase
    .from('teacher_assignments')
    .select('*')
    .eq('teacher_id', donaldChapmanId)
    .limit(5);

  if (fetchError) {
    console.log('❌ Error fetching assignments:', fetchError.message);
    console.log('   This might be due to RLS policies blocking read access');
  } else if (assignments && assignments.length > 0) {
    console.log(`✅ Successfully fetched ${assignments.length} assignments (showing first 5)`);
    assignments.forEach((a, idx) => {
      console.log(`   ${idx + 1}. Date: ${a.teaching_date}, Status: ${a.status}`);
    });
  } else {
    console.log('⚠️  Query succeeded but returned 0 assignments');
    console.log('   Possible reasons:');
    console.log('   1. Migration rolled back due to subsequent migration error');
    console.log('   2. RLS policies blocking read access');
    console.log('   3. Assignments were not actually created');
  }

  console.log('\n' + '='.repeat(70));

  if (assignmentCount === 0) {
    console.log('\n⚠️  ISSUE: No assignments found!');
    console.log('\nPossible solutions:');
    console.log('1. Check if migration actually committed (look for transaction rollback)');
    console.log('2. Try running the SQL directly in Supabase SQL Editor');
    console.log('3. Check RLS policies on teacher_assignments table');
    console.log('4. Use service_role key to bypass RLS (add to .env)');
  } else {
    console.log(`\n✅ Found ${assignmentCount} assignments!`);
    console.log('Donald Chapman should be able to see curriculum now.');
  }
}

verifyAssignments().catch(console.error);
