import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mqlihjzdfkhaomehxbye.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xbGloanpkZmtoYW9tZWh4YnllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MDY0MjIsImV4cCI6MjA3NjM4MjQyMn0.7y_UHl4QbRcHkvJMDQ9qwFPCtVJrIm_WXF5NaUkT5k8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyAndSetup() {
  console.log('🔍 Verifying curriculum setup for Teacher Donald...\n');
  console.log('═'.repeat(80));

  // 1. Check if table exists and RLS policies
  console.log('\n📋 STEP 1: Checking class_sessions table...');
  const { data: existingCheck, error: checkError } = await supabase
    .from('class_sessions')
    .select('id')
    .limit(1);

  if (checkError) {
    if (checkError.code === '42P01') {
      console.log('❌ class_sessions table does NOT exist!');
      console.log('\n⚠️  ACTION REQUIRED:');
      console.log('You MUST run the migration first. Go to:');
      console.log('https://supabase.com/dashboard/project/mqlihjzdfkhaomehxbye/sql/new\n');
      console.log('And run the SQL from:');
      console.log('supabase/migrations/20251023000000_create_class_sessions_system.sql\n');
      return;
    } else {
      console.log('⚠️  Error:', checkError.message);
      console.log('This might be an RLS (Row Level Security) issue.');
    }
  } else {
    console.log('✅ class_sessions table exists!');
  }

  // 2. Find Donald
  console.log('\n📋 STEP 2: Finding Teacher Donald...');
  const { data: donald, error: donaldError } = await supabase
    .from('teachers')
    .select('id, name, surname, email')
    .ilike('name', '%donald%')
    .single();

  if (donaldError || !donald) {
    console.log('❌ Teacher Donald not found!');
    console.log('Error:', donaldError?.message);
    return;
  }

  console.log(`✅ Found: ${donald.name} ${donald.surname}`);
  console.log(`   Email: ${donald.email}`);
  console.log(`   ID: ${donald.id}`);

  // 3. Find Donald's classes
  console.log('\n📋 STEP 3: Finding Donald\'s classes...');
  const { data: classes, error: classesError } = await supabase
    .from('classes')
    .select('id, class_name, stage, teacher_id')
    .eq('teacher_id', donald.id)
    .eq('is_active', true);

  if (classesError || !classes || classes.length === 0) {
    console.log('❌ No active classes found for Donald!');
    console.log('Error:', classesError?.message);
    return;
  }

  console.log(`✅ Found ${classes.length} class(es):`);
  classes.forEach(c => {
    console.log(`   - ${c.class_name} (${c.stage}) - ID: ${c.id}`);
  });

  // 4. Check for existing sessions
  console.log('\n📋 STEP 4: Checking existing curriculum sessions...');
  const { data: existingSessions, error: sessionsError } = await supabase
    .from('class_sessions')
    .select('id, session_date, status, class_id')
    .eq('teacher_id', donald.id);

  if (sessionsError) {
    console.log('⚠️  Cannot check existing sessions:', sessionsError.message);
    console.log('   This is likely an RLS policy issue.');
  } else {
    console.log(`Found ${existingSessions?.length || 0} existing session(s)`);
    if (existingSessions && existingSessions.length > 0) {
      console.log('\n✅ Sessions already exist for Donald!');
      console.log('\n📊 Sample sessions:');
      existingSessions.slice(0, 5).forEach(s => {
        console.log(`   - ${s.session_date} | Status: ${s.status}`);
      });
      console.log('\n✅ Donald should be able to see these in the Curriculum tab.');
      console.log('\nIf he still cannot see them:');
      console.log('1. Make sure he is logged in as donald@heroschool.com');
      console.log('2. Navigate to the Curriculum tab');
      console.log('3. Check browser console for any errors (F12)');
      console.log('4. Try different filters (All Classes, All Statuses, All Dates)');
      return;
    }
  }

  // 5. Get curriculum items
  console.log('\n📋 STEP 5: Finding curriculum items...');
  const { data: curriculum } = await supabase
    .from('curriculum')
    .select('id, lesson_title')
    .limit(10);

  if (!curriculum || curriculum.length === 0) {
    console.log('⚠️  No curriculum items found. Sessions will be created without curriculum links.');
  } else {
    console.log(`✅ Found ${curriculum.length} curriculum items to use`);
  }

  // 6. Provide SQL to run
  console.log('\n═'.repeat(80));
  console.log('\n⚠️  NO SESSIONS FOUND - YOU NEED TO CREATE THEM\n');
  console.log('Copy and paste this SQL into Supabase Dashboard SQL Editor:');
  console.log('https://supabase.com/dashboard/project/mqlihjzdfkhaomehxbye/sql/new\n');
  console.log('─'.repeat(80));

  const sqlScript = `
-- Clean up any existing sessions for Donald
DELETE FROM class_sessions WHERE teacher_id = '${donald.id}';

-- Create test sessions for the next 2 weeks
WITH date_series AS (
  SELECT
    (CURRENT_DATE + (n || ' days')::INTERVAL)::DATE as session_date
  FROM generate_series(-3, 10) n  -- Include past 3 days for completed sessions
  WHERE EXTRACT(DOW FROM (CURRENT_DATE + (n || ' days')::INTERVAL)) NOT IN (0, 6)
),
class_list AS (
  SELECT id, class_name FROM classes
  WHERE teacher_id = '${donald.id}' AND is_active = true
)
INSERT INTO class_sessions (
  teacher_id,
  class_id,
  curriculum_id,
  session_date,
  start_time,
  end_time,
  status,
  lesson_plan_completed,
  attendance_taken,
  attendance_count,
  total_students,
  location,
  notes
)
SELECT
  '${donald.id}'::UUID,
  cl.id,
  (SELECT id FROM curriculum ORDER BY RANDOM() LIMIT 1),
  ds.session_date,
  CASE
    WHEN ROW_NUMBER() OVER (PARTITION BY ds.session_date ORDER BY cl.id) % 2 = 0
    THEN '09:00:00'::TIME
    ELSE '14:00:00'::TIME
  END,
  CASE
    WHEN ROW_NUMBER() OVER (PARTITION BY ds.session_date ORDER BY cl.id) % 2 = 0
    THEN '10:30:00'::TIME
    ELSE '15:30:00'::TIME
  END,
  CASE
    WHEN ds.session_date < CURRENT_DATE THEN 'completed'
    WHEN ds.session_date = CURRENT_DATE THEN 'ready'
    WHEN ds.session_date = CURRENT_DATE + 1 THEN 'building'
    ELSE 'scheduled'
  END,
  CASE
    WHEN ds.session_date <= CURRENT_DATE THEN true
    ELSE false
  END,
  CASE
    WHEN ds.session_date < CURRENT_DATE THEN true
    ELSE false
  END,
  CASE
    WHEN ds.session_date < CURRENT_DATE THEN 15
    ELSE 0
  END,
  18, -- total students
  'Main Building - Room 101',
  'Test session created for curriculum management'
FROM date_series ds
CROSS JOIN class_list cl;

-- Verify what was created
SELECT
  cs.id,
  cs.session_date,
  cs.start_time || ' - ' || cs.end_time as time_slot,
  c.class_name,
  cs.status,
  cs.lesson_plan_completed,
  cs.attendance_taken,
  cu.lesson_title
FROM class_sessions cs
JOIN classes c ON cs.class_id = c.id
LEFT JOIN curriculum cu ON cs.curriculum_id = cu.id
WHERE cs.teacher_id = '${donald.id}'
ORDER BY cs.session_date, cs.start_time;
`;

  console.log(sqlScript);
  console.log('─'.repeat(80));
  console.log('\n✅ After running this SQL:');
  console.log('   1. Login as donald@heroschool.com');
  console.log('   2. Go to Curriculum tab');
  console.log('   3. You should see ~14 sessions (past 3 days + next 10 days)');
  console.log('   4. Sessions will have different statuses:');
  console.log('      - Completed (past dates)');
  console.log('      - Ready (today)');
  console.log('      - Building (tomorrow)');
  console.log('      - Scheduled (future dates)');
  console.log('\n═'.repeat(80));
}

verifyAndSetup().catch(console.error);
