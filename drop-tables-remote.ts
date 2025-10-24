import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function dropTables() {
  console.log('Connecting to Supabase...');

  const sql = `
    DROP TABLE IF EXISTS public.trial_bookings CASCADE;
    DROP TABLE IF EXISTS public.events CASCADE;
    DROP TABLE IF EXISTS public.inquiries CASCADE;
  `;

  try {
    // Note: This requires service role key for DDL operations
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('Error dropping tables:', error);
      console.log('\nThe publishable key cannot perform DDL operations.');
      console.log('Please use the Supabase Dashboard SQL Editor to run:');
      console.log(sql);
    } else {
      console.log('✓ Tables dropped successfully:', data);
    }
  } catch (err) {
    console.error('Error:', err);
    console.log('\nPlease run this SQL in the Supabase Dashboard SQL Editor:');
    console.log(sql);
  }
}

dropTables();
