import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';

console.log('🔧 Authentication Fix & Test Script\n');
console.log('=====================================\n');

// Read current .env
const envContent = readFileSync('.env', 'utf-8');
const envVars = envContent.split('\n').reduce((acc, line) => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    let value = valueParts.join('=').trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    acc[key.trim()] = value;
  }
  return acc;
}, {} as Record<string, string>);

const SUPABASE_URL = envVars.VITE_SUPABASE_URL;
const SUPABASE_KEY = envVars.VITE_SUPABASE_PUBLISHABLE_KEY;

console.log('Current Configuration:');
console.log('  URL:', SUPABASE_URL);
console.log('  Key:', SUPABASE_KEY?.substring(0, 20) + '...\n');

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials in .env\n');
  process.exit(1);
}

// Test the API key
async function testApiKey() {
  console.log('🔍 Testing API Key...\n');

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Try a simple query
    const { data, error } = await supabase
      .from('admins')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ API Key Test Failed!');
      console.error('Error:', error.message, '\n');

      console.log('📝 TO FIX THIS:\n');
      console.log('1. Go to: https://supabase.com/dashboard/project/mqlihjzdfkhaomehxbye/settings/api');
      console.log('2. Find "Project API keys" section');
      console.log('3. Copy the "anon public" key');
      console.log('4. Paste it when prompted below\n');

      // Prompt for new key
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      readline.question('Paste the correct anon public key here (or press Enter to skip): ', (newKey: string) => {
        if (newKey && newKey.trim()) {
          // Update .env file
          const updatedEnv = envContent.replace(
            /VITE_SUPABASE_PUBLISHABLE_KEY="[^"]*"/,
            `VITE_SUPABASE_PUBLISHABLE_KEY="${newKey.trim()}"`
          );
          writeFileSync('.env', updatedEnv);
          console.log('\n✅ .env file updated!');
          console.log('Please run this script again or restart your dev server.\n');
        } else {
          console.log('\nSkipped. Please update the .env file manually.');
        }
        readline.close();
      });
    } else {
      console.log('✅ API Key is working!\n');

      // Now test the actual login credentials
      await testUsers(supabase);
    }
  } catch (error: any) {
    console.error('❌ Unexpected error:', error.message, '\n');
  }
}

async function testUsers(supabase: any) {
  console.log('👥 Testing User Accounts...\n');

  // Test admin
  console.log('Testing Admin Login...');
  const { data: admin, error: adminError } = await supabase
    .from('admins')
    .select('*')
    .eq('email', 'admin@heroschool.com')
    .eq('password', 'admin123')
    .eq('is_active', true)
    .maybeSingle();

  if (adminError || !admin) {
    console.log('  ❌ Admin login would fail');
    console.log('     Error:', adminError?.message || 'User not found');
  } else {
    console.log('  ✅ Admin login: admin@heroschool.com / admin123');
  }

  // Test teacher
  console.log('\nTesting Teacher Login...');
  const { data: teacher, error: teacherError } = await supabase
    .from('teachers')
    .select('*')
    .or('email.eq.donald@heroschool.com,username.eq.donald')
    .eq('password', 'teacher123')
    .eq('is_active', true)
    .maybeSingle();

  if (teacherError || !teacher) {
    console.log('  ❌ Teacher login would fail');
    console.log('     Error:', teacherError?.message || 'User not found');
  } else {
    console.log('  ✅ Teacher login: donald / teacher123');
  }

  // Test student
  console.log('\nTesting Student Login...');
  const { data: student, error: studentError } = await supabase
    .from('dashboard_students')
    .select('*')
    .eq('email', 'emma@student.com')
    .eq('password', 'student123')
    .eq('is_active', true)
    .maybeSingle();

  if (studentError || !student) {
    console.log('  ❌ Student login would fail');
    console.log('     Error:', studentError?.message || 'User not found');
  } else {
    console.log('  ✅ Student login: emma@student.com / student123');
  }

  console.log('\n=====================================');
  console.log('✅ Authentication test complete!');
}

testApiKey();
