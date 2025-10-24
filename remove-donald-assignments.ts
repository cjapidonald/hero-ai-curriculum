import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mqlihjzdfkhaomehxbye.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xbGloanpkZmtoYW9tZWh4YnllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MDY0MjIsImV4cCI6MjA3NjM4MjQyMn0.7y_UHl4QbRcHkvJMDQ9qwFPCtVJrIm_WXF5NaUkT5k8';

const supabase = createClient(supabaseUrl, anonKey);

async function removeDonaldAssignments() {
  const donaldChapmanId = '389ea82c-db4c-40be-aee0-6b39785813da';

  console.log('🗑️  Removing all curriculum assignments for Donald Chapman...\n');
  console.log(`Database: ${supabaseUrl}`);
  console.log(`Donald Chapman UUID: ${donaldChapmanId}\n`);
  console.log('='.repeat(70));

  // Check before deletion
  console.log('\n📊 Checking current state...');
  const { count: beforeAssignments } = await supabase
    .from('teacher_assignments')
    .select('*', { count: 'exact', head: true })
    .eq('teacher_id', donaldChapmanId);

  const { count: beforeSessions } = await supabase
    .from('class_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('teacher_id', donaldChapmanId);

  console.log(`   teacher_assignments: ${beforeAssignments ?? 0}`);
  console.log(`   class_sessions: ${beforeSessions ?? 0}`);

  // Delete assignments (this will likely fail due to RLS)
  console.log('\n🗑️  Attempting to delete assignments...');
  const { error: assignmentError } = await supabase
    .from('teacher_assignments')
    .delete()
    .eq('teacher_id', donaldChapmanId);

  if (assignmentError) {
    console.log('❌ Failed to delete assignments:', assignmentError.message);
    console.log('\n⚠️  RLS policies are preventing deletion via anon key.');
    console.log('\n📝 SOLUTION: Run the SQL script in Supabase Dashboard instead:');
    console.log('   1. Go to: https://supabase.com/dashboard/project/mqlihjzdfkhaomehxbye/sql/new');
    console.log('   2. Copy contents of: REMOVE_DONALD_ASSIGNMENTS.sql');
    console.log('   3. Paste and click RUN');
    return;
  }

  // Delete sessions
  const { error: sessionError } = await supabase
    .from('class_sessions')
    .delete()
    .eq('teacher_id', donaldChapmanId);

  if (sessionError) {
    console.log('❌ Failed to delete sessions:', sessionError.message);
  }

  // Check after deletion
  console.log('\n📊 Checking after deletion...');
  const { count: afterAssignments } = await supabase
    .from('teacher_assignments')
    .select('*', { count: 'exact', head: true })
    .eq('teacher_id', donaldChapmanId);

  const { count: afterSessions } = await supabase
    .from('class_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('teacher_id', donaldChapmanId);

  console.log(`   teacher_assignments: ${afterAssignments ?? 0}`);
  console.log(`   class_sessions: ${afterSessions ?? 0}`);

  console.log('\n' + '='.repeat(70));
  if (afterAssignments === 0 && afterSessions === 0) {
    console.log('\n✅ All assignments removed successfully!');
  } else {
    console.log('\n⚠️  Some records may remain. Check manually in Supabase Dashboard.');
  }
}

removeDonaldAssignments().catch(console.error);
