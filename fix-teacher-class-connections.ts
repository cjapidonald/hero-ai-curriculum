import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mqlihjzdfkhaomehxbye.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xbGloanpkZmtoYW9tZWh4YnllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MDY0MjIsImV4cCI6MjA3NjM4MjQyMn0.7y_UHl4QbRcHkvJMDQ9qwFPCtVJrIm_WXF5NaUkT5k8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixTeacherClassConnections() {
  console.log('Fixing teacher-class connections...\n');

  // Get all active teachers
  const { data: teachers, error: teachersError } = await supabase
    .from('teachers')
    .select('id, name, surname, email')
    .eq('is_active', true);

  if (teachersError) {
    console.error('Error fetching teachers:', teachersError);
    return;
  }

  console.log(`Found ${teachers?.length} active teachers\n`);

  // Get classes with NULL teacher_id but have teacher_name
  const { data: brokenClasses, error: classesError } = await supabase
    .from('classes')
    .select('id, class_name, teacher_name, stage')
    .is('teacher_id', null)
    .not('teacher_name', 'is', null)
    .eq('is_active', true);

  if (classesError) {
    console.error('Error fetching broken classes:', classesError);
    return;
  }

  console.log(`Found ${brokenClasses?.length} classes with NULL teacher_id\n`);

  // Map teacher names to find matches
  const teacherMap = new Map();
  for (const teacher of teachers || []) {
    const fullName = `${teacher.name} ${teacher.surname}`;
    teacherMap.set(fullName.toLowerCase(), teacher);
    // Also map by first name + surname variations
    teacherMap.set(teacher.name.toLowerCase(), teacher);
  }

  let fixedCount = 0;
  let notFoundCount = 0;

  for (const cls of brokenClasses || []) {
    const teacherName = cls.teacher_name.trim();
    const teacher = teacherMap.get(teacherName.toLowerCase());

    if (teacher) {
      console.log(`✓ Fixing "${cls.class_name}": Linking to ${teacher.name} ${teacher.surname} (${teacher.email})`);

      const { error: updateError } = await supabase
        .from('classes')
        .update({
          teacher_id: teacher.id,
          teacher_name: `${teacher.name} ${teacher.surname}` // Also fix the name
        })
        .eq('id', cls.id);

      if (updateError) {
        console.error(`  ✗ Error updating class:`, updateError);
      } else {
        fixedCount++;
      }
    } else {
      console.log(`✗ Teacher not found for "${cls.class_name}": ${teacherName}`);
      notFoundCount++;
    }
  }

  // Fix name mismatches
  console.log('\n' + '='.repeat(80));
  console.log('Fixing teacher name mismatches...\n');

  const { data: allClasses, error: allClassesError } = await supabase
    .from('classes')
    .select('id, class_name, teacher_id, teacher_name')
    .not('teacher_id', 'is', null)
    .eq('is_active', true);

  if (allClassesError) {
    console.error('Error fetching all classes:', allClassesError);
    return;
  }

  let nameMismatchFixed = 0;

  for (const cls of allClasses || []) {
    const teacher = teachers?.find(t => t.id === cls.teacher_id);
    if (teacher) {
      const correctName = `${teacher.name} ${teacher.surname}`;
      if (cls.teacher_name && cls.teacher_name !== correctName) {
        console.log(`✓ Fixing name mismatch for "${cls.class_name}": "${cls.teacher_name}" → "${correctName}"`);

        const { error: updateError } = await supabase
          .from('classes')
          .update({ teacher_name: correctName })
          .eq('id', cls.id);

        if (updateError) {
          console.error(`  ✗ Error updating name:`, updateError);
        } else {
          nameMismatchFixed++;
        }
      }
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('Summary:');
  console.log(`  Classes fixed (teacher_id assigned): ${fixedCount}`);
  console.log(`  Classes not found: ${notFoundCount}`);
  console.log(`  Name mismatches fixed: ${nameMismatchFixed}`);
  console.log(`  Total fixes: ${fixedCount + nameMismatchFixed}`);
}

fixTeacherClassConnections();
