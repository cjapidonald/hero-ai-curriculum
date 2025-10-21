import { createClient } from '@supabase/supabase-js';

const { VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY } = process.env;

if (!VITE_SUPABASE_URL || !VITE_SUPABASE_PUBLISHABLE_KEY) {
  console.error('Missing Supabase credentials. Please set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.');
  process.exit(1);
}

const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY);

const run = async () => {
  const lessonTitle = `Realtime Demo ${new Date().toISOString()}`;

  const { data, error } = await supabase
    .from('curriculum')
    .insert([
      {
        lesson_title: lessonTitle,
        teacher_name: 'Automation Bot',
        subject: 'Realtime QA',
        lesson_date: new Date().toISOString().split('T')[0],
        lesson_skills: 'verification',
        success_criteria: 'Verify realtime pipeline updates admin dashboard automatically.',
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Failed to insert demo curriculum row:', error);
    process.exit(1);
  }

  console.log('Inserted curriculum demo row:', {
    id: data.id,
    lesson_title: data.lesson_title,
    subject: data.subject,
  });

  console.log(
    '\nYou can open the Admin Dashboard → Curriculum tab to confirm the new entry appears instantly thanks to realtime sync.'
  );
};

run();
