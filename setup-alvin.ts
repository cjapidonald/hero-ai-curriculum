/**
 * Script to setup Alvin class with teacher and students
 * Run with: npx tsx setup-alvin.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://mqlihjzdfkhaomehxbye.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xbGloanpkZmtoYW9tZWh4YnllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MDY0MjIsImV4cCI6MjA3NjM4MjQyMn0.7y_UHl4QbRcHkvJMDQ9qwFPCtVJrIm_WXF5NaUkT5k8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupAlvinClass() {
  console.log('🚀 Setting up Alvin class...\n');

  try {
    // Step 1: Create/Update Teacher Xhoana
    console.log('1️⃣  Creating/updating teacher Xhoana Strand...');

    const { data: existingTeacher } = await supabase
      .from('teachers')
      .select('id, name, surname, email')
      .eq('email', 'xhoana.strand@heroschool.com')
      .single();

    let teacherId: string;

    if (existingTeacher) {
      console.log(`   ✅ Teacher exists: ${existingTeacher.name} ${existingTeacher.surname}`);
      teacherId = existingTeacher.id;
    } else {
      const { data: newTeacher, error: teacherError } = await supabase
        .from('teachers')
        .insert({
          name: 'Xhoana',
          surname: 'Strand',
          email: 'xhoana.strand@heroschool.com',
          password: 'teacher123',
          subject: 'English',
          phone: '0981234599',
          bio: 'Specialized in Stage 1 Alvin curriculum - comprehensive English, Math, Science and Phonics instruction',
          is_active: true,
        })
        .select()
        .single();

      if (teacherError) throw teacherError;
      if (!newTeacher) throw new Error('Failed to create teacher');

      teacherId = newTeacher.id;
      console.log(`   ✅ Created new teacher: ${newTeacher.name} ${newTeacher.surname}`);
    }

    // Step 2: Create/Update Alvin Class
    console.log('\n2️⃣  Creating/updating Alvin class...');

    // Try to find existing class using class_name field (which we know exists)
    const { data: existingClasses } = await supabase
      .from('classes')
      .select('id, class_name')
      .eq('class_name', 'Alvin');

    if (existingClasses && existingClasses.length > 0) {
      const existingClass = existingClasses[0];

      // Try to update with teacher_id first
      let updateData: any = {
        teacher_name: 'Xhoana Strand',
        is_active: true,
      };

      // Try including teacher_id - if it fails, we'll update without it
      const { error: updateError } = await supabase
        .from('classes')
        .update({
          ...updateData,
          teacher_id: teacherId,
        })
        .eq('id', existingClass.id);

      if (updateError) {
        console.log(`   ⚠️  Warning updating class with teacher_id: ${updateError.message}`);
        // Try without teacher_id
        const { error: updateError2 } = await supabase
          .from('classes')
          .update(updateData)
          .eq('id', existingClass.id);

        if (updateError2) {
          console.log(`   ⚠️  Warning updating class: ${updateError2.message}`);
        } else {
          console.log(`   ✅ Updated existing class: ${existingClass.class_name} (without teacher_id)`);
        }
      } else {
        console.log(`   ✅ Updated existing class: ${existingClass.class_name} (with teacher_id)`);
      }
    } else {
      const { error: classError } = await supabase
        .from('classes')
        .insert({
          class_name: 'Alvin',
          stage: 'stage_1',
          teacher_name: 'Xhoana Strand',
          max_students: 15,
          is_active: true,
          start_date: new Date().toISOString().split('T')[0],
        });

      if (classError) {
        console.log(`   ⚠️  Warning creating class: ${classError.message}`);
        console.log(`   ℹ️  Class might already exist`);
      } else {
        console.log('   ✅ Created new Alvin class');
      }
    }

    // Step 3: Create Students
    console.log('\n3️⃣  Creating students for Alvin class...');

    const students = [
      { name: 'Emma', surname: 'Nguyen', email: 'emma.nguyen@student.heroschool.com', gender: 'Female', birthday: '2018-03-15', attendance_rate: 95.5, parent_name: 'Mai Nguyen', parent_zalo_nr: '+84 123 456 001', location: 'District 1, HCMC' },
      { name: 'Liam', surname: 'Tran', email: 'liam.tran@student.heroschool.com', gender: 'Male', birthday: '2018-05-22', attendance_rate: 92.0, parent_name: 'Tuan Tran', parent_zalo_nr: '+84 123 456 002', location: 'District 2, HCMC' },
      { name: 'Sophia', surname: 'Le', email: 'sophia.le@student.heroschool.com', gender: 'Female', birthday: '2018-07-10', attendance_rate: 98.0, parent_name: 'Lan Le', parent_zalo_nr: '+84 123 456 003', location: 'District 3, HCMC' },
      { name: 'Oliver', surname: 'Pham', email: 'oliver.pham@student.heroschool.com', gender: 'Male', birthday: '2018-02-28', attendance_rate: 88.5, parent_name: 'Hoa Pham', parent_zalo_nr: '+84 123 456 004', location: 'District 7, HCMC' },
      { name: 'Ava', surname: 'Hoang', email: 'ava.hoang@student.heroschool.com', gender: 'Female', birthday: '2018-09-14', attendance_rate: 94.0, parent_name: 'Minh Hoang', parent_zalo_nr: '+84 123 456 005', location: 'Binh Thanh, HCMC' },
      { name: 'Noah', surname: 'Vo', email: 'noah.vo@student.heroschool.com', gender: 'Male', birthday: '2018-11-05', attendance_rate: 90.0, parent_name: 'Linh Vo', parent_zalo_nr: '+84 123 456 006', location: 'District 5, HCMC' },
      { name: 'Isabella', surname: 'Dang', email: 'isabella.dang@student.heroschool.com', gender: 'Female', birthday: '2018-04-18', attendance_rate: 96.5, parent_name: 'Thu Dang', parent_zalo_nr: '+84 123 456 007', location: 'District 10, HCMC' },
      { name: 'Ethan', surname: 'Bui', email: 'ethan.bui@student.heroschool.com', gender: 'Male', birthday: '2018-06-30', attendance_rate: 91.5, parent_name: 'Hung Bui', parent_zalo_nr: '+84 123 456 008', location: 'Tan Binh, HCMC' },
    ];

    let createdCount = 0;
    let updatedCount = 0;

    for (const student of students) {
      const { data: existing } = await supabase
        .from('dashboard_students')
        .select('id')
        .eq('email', student.email)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('dashboard_students')
          .update({
            class: 'Alvin',
            level: 'Stage 1',
            is_active: true,
          })
          .eq('id', existing.id);

        if (error) throw error;
        updatedCount++;
        console.log(`   📝 Updated: ${student.name} ${student.surname}`);
      } else {
        const { error } = await supabase
          .from('dashboard_students')
          .insert({
            ...student,
            class: 'Alvin',
            password: 'student123',
            subject: 'English',
            level: 'Stage 1',
            sessions: 0,
            sessions_left: 20,
            is_active: true,
          });

        if (error) throw error;
        createdCount++;
        console.log(`   ✅ Created: ${student.name} ${student.surname}`);
      }
    }

    // Step 4: Verify
    console.log('\n4️⃣  Verifying setup...');

    const { data: studentCount } = await supabase
      .from('dashboard_students')
      .select('id', { count: 'exact' })
      .eq('class', 'Alvin')
      .eq('is_active', true);

    const { data: classInfoList } = await supabase
      .from('classes')
      .select('id, class_name, teacher_name, stage')
      .eq('class_name', 'Alvin');

    const classInfo = classInfoList && classInfoList.length > 0 ? classInfoList[0] : null;

    console.log('\n========================================');
    console.log('✨ ALVIN CLASS SETUP COMPLETE ✨');
    console.log('========================================');
    console.log(`👨‍🏫 Teacher: Xhoana Strand`);
    console.log(`📚 Class: ${classInfo?.class_name} (${classInfo?.stage})`);
    console.log(`👥 Students: ${createdCount} created, ${updatedCount} updated`);
    console.log(`📊 Total active students: ${studentCount?.length || 0}`);
    console.log('========================================\n');

    console.log('✅ Setup completed successfully!');
    console.log('\n🔐 Login credentials:');
    console.log('   Teacher: xhoana.strand@heroschool.com / teacher123');
    console.log('   Student: emma.nguyen@student.heroschool.com / student123\n');

  } catch (error) {
    console.error('\n❌ Error during setup:', error);
    process.exit(1);
  }
}

// Run the setup
setupAlvinClass();
