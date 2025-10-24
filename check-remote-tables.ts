import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mqlihjzdfkhaomehxbye.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xbGloanpkZmtoYW9tZWh4YnllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MDY0MjIsImV4cCI6MjA3NjM4MjQyMn0.7y_UHl4QbRcHkvJMDQ9qwFPCtVJrIm_WXF5NaUkT5k8';

const supabase = createClient(supabaseUrl, anonKey);

async function checkRemoteTables() {
  console.log('🔍 Checking REMOTE database tables...\n');
  console.log('Database: https://mqlihjzdfkhaomehxbye.supabase.co\n');
  console.log('='.repeat(70));

  // Check critical tables that admin dashboard needs
  const tablesToCheck = [
    'teachers',
    'dashboard_students',
    'classes',
    'payments',
    'events',
    'curriculum',
    'curriculum_legacy',
    'lessons',
  ];

  console.log('\n📋 Checking table existence and accessibility...\n');

  for (const table of tablesToCheck) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${table}: ERROR - ${error.message}`);
      } else {
        console.log(`✅ ${table}: OK (${count ?? 0} rows)`);
      }
    } catch (err: any) {
      console.log(`❌ ${table}: EXCEPTION - ${err.message}`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n🔍 Testing specific admin dashboard queries...\n');

  // Test the exact queries from AdminDashboard
  console.log('1. Testing teachers query...');
  const { data: teachers, error: teachersError } = await supabase
    .from('teachers')
    .select('*')
    .eq('is_active', true);

  if (teachersError) {
    console.log(`   ❌ Teachers query failed: ${teachersError.message}`);
  } else {
    console.log(`   ✅ Teachers query OK: ${teachers?.length ?? 0} active teachers`);
  }

  console.log('\n2. Testing dashboard_students query...');
  const { data: students, error: studentsError } = await supabase
    .from('dashboard_students')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (studentsError) {
    console.log(`   ❌ Dashboard_students query failed: ${studentsError.message}`);
  } else {
    console.log(`   ✅ Dashboard_students query OK: ${students?.length ?? 0} students`);
  }

  console.log('\n3. Testing classes query...');
  const { data: classes, error: classesError } = await supabase
    .from('classes')
    .select('id, class_name, teacher_name, stage, schedule_days, start_time, end_time, current_students, max_students, is_active')
    .eq('is_active', true);

  if (classesError) {
    console.log(`   ❌ Classes query failed: ${classesError.message}`);
  } else {
    console.log(`   ✅ Classes query OK: ${classes?.length ?? 0} active classes`);
  }

  console.log('\n4. Testing payments query...');
  const { data: payments, error: paymentsError } = await supabase
    .from('payments')
    .select('id, payment_date, receipt_number, payment_for, payment_method, amount')
    .order('payment_date', { ascending: false })
    .limit(10);

  if (paymentsError) {
    console.log(`   ❌ Payments query failed: ${paymentsError.message}`);
  } else {
    console.log(`   ✅ Payments query OK: ${payments?.length ?? 0} payments`);
  }

  console.log('\n5. Testing events query...');
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: true });

  if (eventsError) {
    console.log(`   ❌ Events query failed: ${eventsError.message}`);
  } else {
    console.log(`   ✅ Events query OK: ${events?.length ?? 0} events`);
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n📊 DIAGNOSIS:\n');

  const hasErrors = [teachersError, studentsError, classesError, paymentsError, eventsError]
    .some(err => err !== null);

  if (hasErrors) {
    console.log('❌ Admin dashboard has ERRORS preventing it from loading!');
    console.log('\nLikely causes:');
    console.log('1. Migration 20251118130000_normalize_lessons_schema.sql failed partway');
    console.log('2. Some views or tables were renamed/broken during migration');
    console.log('3. RLS policies may be blocking access');
    console.log('\nRecommended fix:');
    console.log('- Roll back the failed migration in Supabase SQL Editor');
    console.log('- Or fix the broken view/table');
  } else {
    console.log('✅ All queries succeeded! Admin dashboard should work.');
    console.log('\nIf admin dashboard still doesn\'t load:');
    console.log('1. Check browser console for JavaScript errors');
    console.log('2. Check network tab for failed requests');
    console.log('3. Try clearing browser cache');
  }
}

checkRemoteTables().catch(console.error);
