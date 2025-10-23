import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://mqlihjzdfkhaomehxbye.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xbGloanpkZmtoYW9tZWh4YnllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MDY0MjIsImV4cCI6MjA3NjM4MjQyMn0.7y_UHl4QbRcHkvJMDQ9qwFPCtVJrIm_WXF5NaUkT5k8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupCurriculumSessions() {
  console.log('🔍 Setting up curriculum sessions for teacher Donald...\n');

  // 1. Check if class_sessions table exists
  console.log('1️⃣ Checking if class_sessions table exists...');
  const { data: tables, error: tablesError } = await supabase
    .from('class_sessions')
    .select('id')
    .limit(1);

  if (tablesError && tablesError.code === '42P01') {
    console.log('❌ ERROR: class_sessions table does not exist!');
    console.log('📝 Please run the migration first:');
    console.log('   1. Go to Supabase Dashboard → SQL Editor');
    console.log('   2. Copy the contents of supabase/migrations/20251023000000_create_class_sessions_system.sql');
    console.log('   3. Execute the SQL\n');
    return;
  }

  if (tablesError) {
    console.log('❌ Error checking table:', tablesError.message);
    return;
  }

  console.log('✅ class_sessions table exists\n');

  // 2. Find teacher Donald
  console.log('2️⃣ Finding teacher Donald...');
  const { data: teachers, error: teacherError } = await supabase
    .from('teachers')
    .select('id, name, surname, email')
    .ilike('name', '%donald%');

  if (teacherError) {
    console.log('❌ Error finding teacher:', teacherError.message);
    return;
  }

  if (!teachers || teachers.length === 0) {
    console.log('❌ Teacher Donald not found');
    return;
  }

  const donald = teachers[0];
  console.log(`✅ Found teacher: ${donald.name} ${donald.surname} (${donald.email})`);
  console.log(`   ID: ${donald.id}\n`);

  // 3. Find Donald's classes
  console.log('3️⃣ Finding Donald\'s classes...');
  const { data: classes, error: classesError } = await supabase
    .from('classes')
    .select('id, class_name, stage')
    .eq('teacher_id', donald.id)
    .eq('is_active', true);

  if (classesError) {
    console.log('❌ Error finding classes:', classesError.message);
    return;
  }

  if (!classes || classes.length === 0) {
    console.log('❌ No classes found for teacher Donald');
    return;
  }

  console.log(`✅ Found ${classes.length} class(es):`);
  classes.forEach((c) => {
    console.log(`   - ${c.class_name} (${c.stage})`);
  });
  console.log('');

  // 4. Get some curriculum items
  console.log('4️⃣ Finding curriculum items...');
  const { data: curriculum, error: curriculumError } = await supabase
    .from('curriculum')
    .select('id, lesson_title, subject')
    .limit(10);

  if (curriculumError) {
    console.log('❌ Error finding curriculum:', curriculumError.message);
    return;
  }

  if (!curriculum || curriculum.length === 0) {
    console.log('⚠️  No curriculum items found, creating sessions without curriculum link');
  } else {
    console.log(`✅ Found ${curriculum.length} curriculum item(s)\n`);
  }

  // 5. Delete existing sessions for Donald
  console.log('5️⃣ Cleaning up existing sessions...');
  const { error: deleteError } = await supabase
    .from('class_sessions')
    .delete()
    .eq('teacher_id', donald.id);

  if (deleteError) {
    console.log('⚠️  Warning cleaning up:', deleteError.message);
  } else {
    console.log('✅ Cleaned up old sessions\n');
  }

  // 6. Create class sessions for the next 2 weeks
  console.log('6️⃣ Creating class sessions...');
  const sessions = [];
  const today = new Date();

  for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
    const sessionDate = new Date(today);
    sessionDate.setDate(today.getDate() + dayOffset);

    // Skip weekends
    const dayOfWeek = sessionDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    for (const classItem of classes) {
      // Pick a curriculum item (rotate through them)
      const curriculumItem = curriculum && curriculum.length > 0
        ? curriculum[dayOffset % curriculum.length]
        : null;

      // Create 1-2 sessions per day for each class
      const sessionTimes = [
        { start: '09:00', end: '10:30' },
        { start: '14:00', end: '15:30' }
      ];

      // Alternate which session time we use
      const timeSlot = sessionTimes[dayOffset % 2];

      const session = {
        teacher_id: donald.id,
        class_id: classItem.id,
        curriculum_id: curriculumItem?.id || null,
        session_date: sessionDate.toISOString().split('T')[0],
        start_time: timeSlot.start,
        end_time: timeSlot.end,
        status: dayOffset < 3 ? 'scheduled' : (dayOffset < 7 ? 'building' : 'scheduled'),
        lesson_plan_completed: false,
        attendance_taken: false,
        location: 'Main Building - Room 101'
      };

      sessions.push(session);
    }
  }

  console.log(`📝 Creating ${sessions.length} sessions...`);
  const { data: createdSessions, error: insertError } = await supabase
    .from('class_sessions')
    .insert(sessions)
    .select();

  if (insertError) {
    console.log('❌ Error creating sessions:', insertError.message);
    console.log('Full error:', JSON.stringify(insertError, null, 2));
    return;
  }

  console.log(`✅ Created ${createdSessions?.length || 0} sessions successfully!\n`);

  // 7. Summary
  console.log('📊 Summary:');
  console.log(`   Teacher: ${donald.name} ${donald.surname}`);
  console.log(`   Classes: ${classes.length}`);
  console.log(`   Sessions created: ${createdSessions?.length || 0}`);
  console.log('');
  console.log('✅ Setup complete! Teacher Donald should now see sessions in the Curriculum tab.');
  console.log('');
  console.log('Next steps:');
  console.log('   1. Login as teacher Donald');
  console.log('   2. Go to the Curriculum tab');
  console.log('   3. You should see the scheduled sessions');
  console.log('   4. Click "Build" to create a lesson plan');
  console.log('   5. Click "View" to see the lesson plan');
  console.log('   6. Click "Start" to begin a class session');
}

setupCurriculumSessions().catch(console.error);
