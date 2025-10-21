/**
 * Script to verify Alvin class setup
 * Run with: npx tsx verify-alvin.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mqlihjzdfkhaomehxbye.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xbGloanpkZmtoYW9tZWh4YnllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MDY0MjIsImV4cCI6MjA3NjM4MjQyMn0.7y_UHl4QbRcHkvJMDQ9qwFPCtVJrIm_WXF5NaUkT5k8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyAlvinSetup() {
  console.log('🔍 Verifying Alvin class setup...\n');

  try {
    // 1. Get Teacher Info
    console.log('1️⃣  Teacher Information:');
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .select('id, name, surname, email, subject')
      .eq('email', 'xhoana.strand@heroschool.com')
      .single();

    if (teacherError) throw teacherError;

    console.log(`   Name: ${teacher.name} ${teacher.surname}`);
    console.log(`   Email: ${teacher.email}`);
    console.log(`   Subject: ${teacher.subject}`);
    console.log(`   ID: ${teacher.id}`);

    // 2. Get Class Info
    console.log('\n2️⃣  Class Information:');
    const { data: classes, error: classError } = await supabase
      .from('classes')
      .select('*')
      .eq('teacher_id', teacher.id);

    if (classError) {
      console.log(`   ⚠️  Error fetching classes: ${classError.message}`);
    } else if (!classes || classes.length === 0) {
      console.log('   ❌ No classes found for this teacher!');
      console.log('   ℹ️  This is why Xhoana cannot see the class.');
    } else {
      console.log(`   ✅ Found ${classes.length} class(es):`);
      classes.forEach((c: any) => {
        console.log(`      - ${c.class_name || c.name} (ID: ${c.id.substring(0, 8)}...)`);
        console.log(`        Stage: ${c.stage}`);
        console.log(`        Teacher Name: ${c.teacher_name}`);
        console.log(`        Active: ${c.is_active}`);
      });
    }

    // 3. Get Students
    console.log('\n3️⃣  Students in Alvin Class:');
    const { data: students, error: studentsError } = await supabase
      .from('dashboard_students')
      .select('id, name, surname, class, level')
      .eq('class', 'Alvin')
      .eq('is_active', true);

    if (studentsError) throw studentsError;

    console.log(`   Found ${students.length} students:`);
    students.forEach((s: any) => {
      console.log(`      - ${s.name} ${s.surname} (${s.level})`);
    });

    // 4. Simulate what MyClasses component does
    console.log('\n4️⃣  Simulating MyClasses Component Logic:');
    if (classes && classes.length > 0) {
      const teacherClassNames = classes.map((c: any) => c.name || c.class_name).filter(Boolean);
      console.log(`   Class names extracted: ${teacherClassNames.join(', ')}`);

      const { data: matchedStudents, error: matchError } = await supabase
        .from('dashboard_students')
        .select('id, name, surname, class')
        .eq('is_active', true)
        .in('class', teacherClassNames);

      if (matchError) {
        console.log(`   ⚠️  Error: ${matchError.message}`);
      } else {
        console.log(`   ✅ MyClasses component would show ${matchedStudents.length} students`);
        if (matchedStudents.length === 0) {
          console.log('   ❌ PROBLEM: No students matched!');
          console.log(`   ℹ️  Looking for students with class in: ${teacherClassNames.join(', ')}`);
        }
      }
    } else {
      console.log('   ❌ No classes found, so MyClasses would show empty state');
    }

    // 5. Check Skills
    console.log('\n5️⃣  Skills Information:');
    const { data: skills, error: skillsError } = await supabase
      .from('skills')
      .select('skill_code, skill_name', { count: 'exact' })
      .contains('target_stage', ['stage_1']);

    if (skillsError) {
      console.log(`   ⚠️  Error fetching skills: ${skillsError.message}`);
    } else {
      console.log(`   ✅ Found ${skills.length} Stage 1 skills`);
    }

    console.log('\n========================================');
    console.log('Summary:');
    console.log('========================================');
    console.log(`✅ Teacher exists: ${teacher.name} ${teacher.surname}`);
    console.log(`${classes && classes.length > 0 ? '✅' : '❌'} Teacher has classes: ${classes ? classes.length : 0}`);
    console.log(`✅ Students exist: ${students.length}`);
    console.log(`${skills && skills.length > 0 ? '✅' : '⚠️ '} Skills exist: ${skills ? skills.length : 0}`);
    console.log('========================================\n');

  } catch (error) {
    console.error('\n❌ Error:', error);
  }
}

verifyAlvinSetup();
