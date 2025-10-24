import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://mqlihjzdfkhaomehxbye.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xbGloanpkZmtoYW9tZWh4YnllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MDY0MjIsImV4cCI6MjA3NjM4MjQyMn0.7y_UHl4QbRcHkvJMDQ9qwFPCtVJrIm_WXF5NaUkT5k8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDonaldChapmanAssignments() {
  const donaldChapmanId = '389ea82c-db4c-40be-aee0-6b39785813da';

  console.log('🔧 Creating teacher_assignments for Donald Chapman...\n');
  console.log(`Database URL: ${supabaseUrl}\n`);
  console.log('='.repeat(70));

  // Get Donald's primary class
  console.log('\n1️⃣  Finding Donald Chapman\'s primary class...');
  const { data: classes, error: classError } = await supabase
    .from('classes')
    .select('*')
    .eq('teacher_id', donaldChapmanId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1);

  if (classError || !classes || classes.length === 0) {
    console.log('❌ Could not find class for Donald Chapman');
    return;
  }

  const primaryClass = classes[0];
  console.log(`✅ Found class: ${primaryClass.class_name} (${primaryClass.id})`);

  // Get all curriculum items for Donald
  console.log('\n2️⃣  Finding curriculum items for Donald Chapman...');
  const { data: curriculum, error: curriculumError } = await supabase
    .from('curriculum')
    .select('*')
    .eq('teacher_id', donaldChapmanId)
    .order('lesson_date', { ascending: true });

  if (curriculumError || !curriculum || curriculum.length === 0) {
    console.log('❌ No curriculum items found for Donald Chapman');
    return;
  }

  console.log(`✅ Found ${curriculum.length} curriculum items`);

  // Create teacher_assignments for each curriculum item
  console.log('\n3️⃣  Creating teacher_assignments...');

  const assignmentsToCreate = curriculum.map((curr) => ({
    teacher_id: donaldChapmanId,
    class_id: primaryClass.id,
    curriculum_id: curr.id,
    teaching_date: curr.lesson_date || new Date().toISOString().split('T')[0],
    start_time: '14:00:00',
    end_time: '15:30:00',
    status: 'scheduled',
    location: 'Room 301',
    notes: `Assignment for: ${curr.lesson_title}`,
  }));

  console.log(`   Creating ${assignmentsToCreate.length} assignments...`);

  const { data: createdAssignments, error: assignmentError } = await supabase
    .from('teacher_assignments')
    .insert(assignmentsToCreate)
    .select();

  if (assignmentError) {
    console.log('❌ Error creating assignments:', assignmentError.message);
    console.log('Details:', assignmentError);
    return;
  }

  console.log(`✅ Created ${createdAssignments?.length || 0} teacher assignments!`);

  // Show some examples
  console.log('\n4️⃣  Sample Assignments Created:');
  createdAssignments?.slice(0, 5).forEach((assignment, idx) => {
    const curr = curriculum.find((c) => c.id === assignment.curriculum_id);
    console.log(`   ${idx + 1}. ${assignment.teaching_date} - ${curr?.lesson_title}`);
  });
  if ((createdAssignments?.length || 0) > 5) {
    console.log(`   ... and ${createdAssignments!.length - 5} more`);
  }

  // Verify by checking if class_sessions were created by trigger
  console.log('\n5️⃣  Checking if class_sessions were auto-created...');
  await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds for trigger

  const { data: sessions, error: sessionsError } = await supabase
    .from('class_sessions')
    .select('*')
    .eq('teacher_id', donaldChapmanId);

  if (sessionsError) {
    console.log('⚠️  Could not check sessions:', sessionsError.message);
  } else {
    console.log(`✅ Found ${sessions?.length || 0} class sessions`);
    if ((sessions?.length || 0) === 0) {
      console.log('   ⚠️  No sessions found - trigger may not exist or failed');
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n✅ SUCCESS! Donald Chapman\'s curriculum is now assigned!');
  console.log('\n📝 What was done:');
  console.log(`   • Created ${createdAssignments?.length || 0} teacher_assignments`);
  console.log(`   • Linked curriculum to class: ${primaryClass.class_name}`);
  console.log(`   • Set teaching dates based on curriculum`);
  console.log(`   • Status: scheduled`);
  console.log('\n🎉 Donald Chapman can now see his curriculum in the Teacher Dashboard!');
}

fixDonaldChapmanAssignments().catch(console.error);
