import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mqlihjzdfkhaomehxbye.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xbGloanpkZmtoYW9tZWh4YnllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MDY0MjIsImV4cCI6MjA3NjM4MjQyMn0.7y_UHl4QbRcHkvJMDQ9qwFPCtVJrIm_WXF5NaUkT5k8';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verifyEmma() {
  console.log('🔍 Checking for Emma...\n');

  const { data, error } = await supabase
    .from('dashboard_students')
    .select('*')
    .eq('email', 'emma@student.com')
    .maybeSingle();

  if (error) {
    console.error('❌ Error:', error.message);
  } else if (!data) {
    console.log('❌ Emma not found. Creating...\n');

    const { data: newStudent, error: insertError } = await supabase
      .from('dashboard_students')
      .insert([{
        name: 'Emma',
        surname: 'Wilson',
        email: 'emma@student.com',
        password: 'student123',
        class: '10A',
        subject: 'English',
        is_active: true
      }])
      .select()
      .single();

    if (insertError) {
      console.error('❌ Failed to create Emma:', insertError.message);
    } else {
      console.log('✅ Emma created:', newStudent);
    }
  } else {
    console.log('✅ Emma found:', data);
  }
}

verifyEmma();
