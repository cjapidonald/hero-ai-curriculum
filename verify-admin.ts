import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verifyAdmin() {
  console.log('🔍 Checking if admin user exists...\n');

  try {
    // Check if admin exists
    const { data: admins, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', 'admin@heroschool.com');

    if (error) {
      console.error('❌ Error querying admins table:', error.message);
      console.error('Details:', error);
      return;
    }

    if (!admins || admins.length === 0) {
      console.log('❌ Admin user not found!');
      console.log('\n📝 Creating admin user...\n');

      const { data: newAdmin, error: insertError } = await supabase
        .from('admins')
        .insert([
          {
            email: 'admin@heroschool.com',
            password: 'admin123',
            name: 'Admin',
            surname: 'HeroSchool',
            phone: '+84123456789',
            is_active: true
          }
        ])
        .select();

      if (insertError) {
        console.error('❌ Error creating admin user:', insertError.message);
        console.error('Details:', insertError);
        return;
      }

      console.log('✅ Admin user created successfully!');
      console.log(newAdmin);
    } else {
      console.log('✅ Admin user found!');
      console.log('\nAdmin details:');
      console.log('- Email:', admins[0].email);
      console.log('- Password:', admins[0].password);
      console.log('- Name:', admins[0].name, admins[0].surname);
      console.log('- Active:', admins[0].is_active);
      console.log('- Last Login:', admins[0].last_login || 'Never');
    }

    // Also check teachers
    console.log('\n🔍 Checking teacher accounts...\n');

    const { data: teachers, error: teacherError } = await supabase
      .from('teachers')
      .select('*');

    if (teacherError) {
      console.error('❌ Error querying teachers table:', teacherError.message);
    } else {
      console.log(`✅ Found ${teachers?.length || 0} teacher(s)`);
      if (teachers && teachers.length > 0) {
        teachers.forEach((teacher: any, index: number) => {
          console.log(`\nTeacher ${index + 1}:`);
          console.log('- Name:', teacher.name, teacher.surname);
          console.log('- Email:', teacher.email || 'Not set');
          console.log('- Username:', teacher.username || 'Not set');
          console.log('- Password:', teacher.password || 'Not set');
          console.log('- Active:', teacher.is_active);
        });
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

verifyAdmin();
