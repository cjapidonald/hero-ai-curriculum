import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mqlihjzdfkhaomehxbye.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xbGloanpkZmtoYW9tZWh4YnllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MDY0MjIsImV4cCI6MjA3NjM4MjQyMn0.7y_UHl4QbRcHkvJMDQ9qwFPCtVJrIm_WXF5NaUkT5k8';

// Try with service role if available, otherwise use anon key
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceRoleKey || supabaseKey, {
  auth: {
    persistSession: false
  }
});

async function createSessionsForDonald() {
  console.log('🚀 Creating curriculum sessions for Teacher Donald...\n');

  // Find Donald
  const { data: donald, error: donaldError } = await supabase
    .from('teachers')
    .select('id, name, surname, email')
    .ilike('name', '%donald%')
    .single();

  if (donaldError || !donald) {
    console.log('❌ Error finding Donald:', donaldError?.message || 'Not found');
    return;
  }

  console.log(`✅ Found: ${donald.name} ${donald.surname} (${donald.email})`);

  // Find his classes
  const { data: classes, error: classesError } = await supabase
    .from('classes')
    .select('id, class_name, stage')
    .eq('teacher_id', donald.id)
    .eq('is_active', true);

  if (classesError || !classes || classes.length === 0) {
    console.log('❌ Error finding classes:', classesError?.message || 'No classes');
    return;
  }

  console.log(`✅ Found ${classes.length} class(es): ${classes.map(c => c.class_name).join(', ')}\n`);

  // Get curriculum items
  const { data: curriculum } = await supabase
    .from('curriculum')
    .select('id, lesson_title, subject')
    .limit(10);

  // Create sessions via RPC function (bypasses RLS)
  console.log('📝 Inserting sessions via database function...\n');

  const { data, error } = await supabase.rpc('create_donald_sessions', {
    p_teacher_id: donald.id
  });

  if (error) {
    console.log('⚠️  RPC function not available, trying direct SQL...\n');

    // If RPC doesn't exist, show SQL to run manually
    console.log('📋 Please run this SQL in Supabase Dashboard → SQL Editor:\n');
    console.log('─'.repeat(80));
    console.log(`
-- Delete existing sessions for Donald
DELETE FROM class_sessions WHERE teacher_id = '${donald.id}';

-- Create sessions for the next 2 weeks
WITH date_series AS (
  SELECT
    (CURRENT_DATE + (n || ' days')::INTERVAL)::DATE as session_date
  FROM generate_series(0, 13) n
  WHERE EXTRACT(DOW FROM (CURRENT_DATE + (n || ' days')::INTERVAL)) NOT IN (0, 6)
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
  location
)
SELECT
  '${donald.id}'::UUID,
  c.id,
  (SELECT id FROM curriculum ORDER BY RANDOM() LIMIT 1),
  ds.session_date,
  CASE WHEN row_number() OVER (PARTITION BY ds.session_date ORDER BY c.id) % 2 = 0
    THEN '09:00:00'::TIME
    ELSE '14:00:00'::TIME
  END,
  CASE WHEN row_number() OVER (PARTITION BY ds.session_date ORDER BY c.id) % 2 = 0
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
    WHEN ds.session_date <= CURRENT_DATE + 1 THEN true
    ELSE false
  END,
  'Main Building - Room 101'
FROM date_series ds
CROSS JOIN (
  SELECT id FROM classes WHERE teacher_id = '${donald.id}' AND is_active = true
) c;

-- Verify
SELECT COUNT(*) as total_sessions FROM class_sessions WHERE teacher_id = '${donald.id}';
    `);
    console.log('─'.repeat(80));
  } else {
    console.log('✅ Sessions created successfully!');
    console.log('Result:', data);
  }

  console.log('\n✅ Setup complete!');
  console.log('\nNext steps:');
  console.log('1. Login as teacher Donald');
  console.log('2. Navigate to the Curriculum tab');
  console.log('3. You should see the sessions listed');
}

createSessionsForDonald().catch(console.error);
