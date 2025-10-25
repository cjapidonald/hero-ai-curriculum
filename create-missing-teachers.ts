import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mqlihjzdfkhaomehxbye.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xbGloanpkZmtoYW9tZWh4YnllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MDY0MjIsImV4cCI6MjA3NjM4MjQyMn0.7y_UHl4QbRcHkvJMDQ9qwFPCtVJrIm_WXF5NaUkT5k8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createMissingTeachers() {
  console.log('Creating missing teachers...\n');

  // Define the missing teachers
  const missingTeachers = [
    {
      name: 'Rachel',
      surname: 'Green',
      email: 'rachel.green@heroschool.com',
      password: 'rachel123', // Temporary password - teacher should change on first login
      subject: 'English',
      username: 'rachel.green'
    },
    {
      name: 'David',
      surname: 'Brown',
      email: 'david.brown@heroschool.com',
      password: 'david123',
      subject: 'English',
      username: 'david.brown'
    },
    {
      name: 'Emily',
      surname: 'Davis',
      email: 'emily.davis@heroschool.com',
      password: 'emily123',
      subject: 'English',
      username: 'emily.davis'
    },
    {
      name: 'Mike',
      surname: 'Chen',
      email: 'mike.chen@heroschool.com',
      password: 'mike123',
      subject: 'English',
      username: 'mike.chen'
    }
  ];

  const createdTeachers = [];

  for (const teacher of missingTeachers) {
    console.log(`Creating teacher: ${teacher.name} ${teacher.surname}...`);

    // Check if teacher already exists
    const { data: existing } = await supabase
      .from('teachers')
      .select('id, name, surname, email')
      .eq('email', teacher.email)
      .single();

    if (existing) {
      console.log(`  ✓ Teacher already exists: ${existing.id}`);
      createdTeachers.push(existing);
      continue;
    }

    // Create the teacher
    const { data, error } = await supabase
      .from('teachers')
      .insert([teacher])
      .select()
      .single();

    if (error) {
      console.error(`  ✗ Error creating teacher:`, error);
    } else {
      console.log(`  ✓ Created teacher: ${data.id}`);
      createdTeachers.push(data);
    }
  }

  // Now link the classes to the newly created teachers
  console.log('\n' + '='.repeat(80));
  console.log('Linking classes to newly created teachers...\n');

  const classTeacherMap = [
    { className: 'Flyers A', teacherName: 'Rachel Green' },
    { className: 'Flyers B', teacherName: 'David Brown' },
    { className: 'Movers A', teacherName: 'Emily Davis' },
    { className: 'Starters B', teacherName: 'Mike Chen' }
  ];

  let linkedCount = 0;

  for (const mapping of classTeacherMap) {
    const teacher = createdTeachers.find(t =>
      `${t.name} ${t.surname}` === mapping.teacherName
    );

    if (teacher) {
      console.log(`Linking "${mapping.className}" to ${teacher.name} ${teacher.surname}...`);

      const { error } = await supabase
        .from('classes')
        .update({
          teacher_id: teacher.id,
          teacher_name: `${teacher.name} ${teacher.surname}`
        })
        .eq('class_name', mapping.className)
        .eq('is_active', true);

      if (error) {
        console.error(`  ✗ Error linking class:`, error);
      } else {
        console.log(`  ✓ Linked successfully`);
        linkedCount++;
      }
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('Summary:');
  console.log(`  Teachers created: ${createdTeachers.length}`);
  console.log(`  Classes linked: ${linkedCount}`);
}

createMissingTeachers();
