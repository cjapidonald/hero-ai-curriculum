import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mqlihjzdfkhaomehxbye.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xbGloanpkZmtoYW9tZWh4YnllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MDY0MjIsImV4cCI6MjA3NjM4MjQyMn0.7y_UHl4QbRcHkvJMDQ9qwFPCtVJrIm_WXF5NaUkT5k8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTeacherClassConnection() {
  console.log('Checking teacher-class connection on remote database...\n');

  // Check classes
  const { data: classes, error: classesError } = await supabase
    .from('classes')
    .select('id, class_name, teacher_id, teacher_name, is_active, stage')
    .eq('is_active', true);

  if (classesError) {
    console.error('Error fetching classes:', classesError);
    return;
  }

  console.log(`Found ${classes?.length || 0} active classes\n`);

  // Check teachers
  const { data: teachers, error: teachersError } = await supabase
    .from('teachers')
    .select('id, name, surname, email, is_active')
    .eq('is_active', true);

  if (teachersError) {
    console.error('Error fetching teachers:', teachersError);
    return;
  }

  console.log(`Found ${teachers?.length || 0} active teachers\n`);

  // Check for issues
  console.log('Class-Teacher Connection Analysis:');
  console.log('='.repeat(80));

  for (const cls of classes || []) {
    const teacher = teachers?.find(t => t.id === cls.teacher_id);
    const actualTeacherName = teacher ? `${teacher.name} ${teacher.surname}` : null;

    let status = 'OK';
    let issue = '';

    if (!cls.teacher_id) {
      status = 'ERROR';
      issue = 'No teacher_id assigned';
    } else if (!teacher) {
      status = 'ERROR';
      issue = 'Teacher ID references non-existent teacher';
    } else if (cls.teacher_name && cls.teacher_name !== actualTeacherName) {
      status = 'WARNING';
      issue = `Name mismatch: "${cls.teacher_name}" vs "${actualTeacherName}"`;
    }

    console.log(`\nClass: ${cls.class_name} (${cls.stage})`);
    console.log(`  Teacher ID: ${cls.teacher_id || 'NULL'}`);
    console.log(`  Teacher Name (stored): ${cls.teacher_name || 'NULL'}`);
    console.log(`  Teacher Name (actual): ${actualTeacherName || 'NULL'}`);
    console.log(`  Status: ${status}`);
    if (issue) console.log(`  Issue: ${issue}`);
  }

  // Check for orphaned teachers (teachers with no classes)
  console.log('\n' + '='.repeat(80));
  console.log('Teachers without classes:');
  for (const teacher of teachers || []) {
    const hasClass = classes?.some(c => c.teacher_id === teacher.id);
    if (!hasClass) {
      console.log(`  - ${teacher.name} ${teacher.surname} (${teacher.email})`);
    }
  }
}

checkTeacherClassConnection();
