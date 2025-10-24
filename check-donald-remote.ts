import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://mqlihjzdfkhaomehxbye.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xbGloanpkZmtoYW9tZWh4YnllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MDY0MjIsImV4cCI6MjA3NjM4MjQyMn0.7y_UHl4QbRcHkvJMDQ9qwFPCtVJrIm_WXF5NaUkT5k8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDonaldChapman() {
  const donaldChapmanId = '389ea82c-db4c-40be-aee0-6b39785813da';

  console.log('🔍 Checking REMOTE database for Donald Chapman...\n');
  console.log(`Database URL: ${supabaseUrl}\n`);
  console.log(`Donald Chapman UUID: ${donaldChapmanId}\n`);
  console.log('='.repeat(70));

  // Check teacher
  console.log('\n1️⃣  Checking Teacher Record...');
  const { data: teacher, error: teacherError } = await supabase
    .from('teachers')
    .select('*')
    .eq('id', donaldChapmanId)
    .single();

  if (teacherError) {
    console.log('❌ Error:', teacherError.message);
  } else if (teacher) {
    console.log('✅ Teacher found:');
    console.log(`   Name: ${teacher.name} ${teacher.surname}`);
    console.log(`   Email: ${teacher.email}`);
    console.log(`   Active: ${teacher.is_active}`);
  } else {
    console.log('❌ Teacher NOT found');
  }

  // Check classes
  console.log('\n2️⃣  Checking Classes...');
  const { data: classes, error: classesError } = await supabase
    .from('classes')
    .select('*')
    .eq('teacher_id', donaldChapmanId)
    .eq('is_active', true);

  if (classesError) {
    console.log('❌ Error:', classesError.message);
  } else {
    console.log(`✅ Found ${classes?.length || 0} active classes`);
    classes?.forEach((cls, idx) => {
      console.log(`   ${idx + 1}. ${cls.class_name} (${cls.stage})`);
    });
  }

  // Check curriculum
  console.log('\n3️⃣  Checking Curriculum...');
  const { data: curriculum, error: curriculumError } = await supabase
    .from('curriculum')
    .select('*')
    .eq('teacher_id', donaldChapmanId);

  if (curriculumError) {
    console.log('❌ Error:', curriculumError.message);
  } else {
    console.log(`✅ Found ${curriculum?.length || 0} curriculum items`);
    curriculum?.slice(0, 3).forEach((curr, idx) => {
      console.log(`   ${idx + 1}. ${curr.lesson_title}`);
    });
    if ((curriculum?.length || 0) > 3) {
      console.log(`   ... and ${curriculum!.length - 3} more`);
    }
  }

  // Check teacher_assignments
  console.log('\n4️⃣  Checking Teacher Assignments...');
  const { data: assignments, error: assignmentsError } = await supabase
    .from('teacher_assignments')
    .select(`
      *,
      curriculum:curriculum_id (lesson_title),
      classes:class_id (class_name)
    `)
    .eq('teacher_id', donaldChapmanId);

  if (assignmentsError) {
    console.log('❌ Error:', assignmentsError.message);
  } else {
    console.log(`✅ Found ${assignments?.length || 0} teacher assignments`);
    assignments?.forEach((assignment, idx) => {
      const curr: any = assignment.curriculum;
      const cls: any = assignment.classes;
      console.log(`   ${idx + 1}. ${assignment.teaching_date} - ${curr?.lesson_title || 'No curriculum'}`);
      console.log(`      Class: ${cls?.class_name || 'No class'}`);
      console.log(`      Status: ${assignment.status}`);
    });
  }

  // Check class_sessions
  console.log('\n5️⃣  Checking Class Sessions...');
  const { data: sessions, error: sessionsError } = await supabase
    .from('class_sessions')
    .select('*')
    .eq('teacher_id', donaldChapmanId);

  if (sessionsError) {
    console.log('❌ Error:', sessionsError.message);
  } else {
    console.log(`✅ Found ${sessions?.length || 0} class sessions`);
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n📊 SUMMARY:');
  console.log(`   Teachers: ${teacher ? 1 : 0}`);
  console.log(`   Classes: ${classes?.length || 0}`);
  console.log(`   Curriculum: ${curriculum?.length || 0}`);
  console.log(`   Assignments: ${assignments?.length || 0}`);
  console.log(`   Sessions: ${sessions?.length || 0}`);

  if ((assignments?.length || 0) === 0) {
    console.log('\n⚠️  WARNING: No teacher_assignments found!');
    console.log('   This is why Donald Chapman cannot see curriculum.');
    console.log('   Curriculum items must be assigned via teacher_assignments table.');
  } else {
    console.log('\n✅ Donald Chapman should be able to see curriculum!');
  }
}

checkDonaldChapman().catch(console.error);
