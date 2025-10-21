import { createClient } from '@supabase/supabase-js';

const { VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY } = process.env;

if (!VITE_SUPABASE_URL || !VITE_SUPABASE_PUBLISHABLE_KEY) {
  console.error('Missing Supabase credentials.');
  process.exit(1);
}

const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY);

const run = async () => {
  const { data, error } = await supabase.from('curriculum').select('*').limit(1);

  if (error) {
    console.error('Failed to fetch curriculum sample row:', error);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('No curriculum rows found.');
    return;
  }

  console.log('Sample curriculum row keys:', Object.keys(data[0]));
  console.log('Sample curriculum row:', data[0]);
};

run();
