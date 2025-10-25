import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pyqmjwwxkdumgxdpjjnw.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixCurriculumStageFormat() {
  console.log('Checking curriculum stage format on remote database...');

  // First, check current stage values
  const { data: currentStages, error: checkError } = await supabase
    .from('curriculum')
    .select('stage')
    .limit(1);

  if (checkError) {
    console.error('Error checking curriculum:', checkError);
    return;
  }

  console.log('Current stage format:', currentStages);

  // Update all 'Stage 1' to 'stage_1'
  const { data, error } = await supabase
    .from('curriculum')
    .update({ stage: 'stage_1' })
    .eq('stage', 'Stage 1')
    .select();

  if (error) {
    console.error('Error updating curriculum stage format:', error);
    return;
  }

  console.log(`✅ Updated ${data?.length || 0} curriculum entries to use 'stage_1' format`);

  // Verify the update
  const { data: verifyData, error: verifyError } = await supabase
    .from('curriculum')
    .select('id, lesson_title, stage, class')
    .eq('stage', 'stage_1')
    .eq('class', 'Alvin')
    .order('lesson_number');

  if (verifyError) {
    console.error('Error verifying update:', verifyError);
    return;
  }

  console.log('\n📚 Curriculum entries for Alvin class (stage_1):');
  verifyData?.forEach((lesson) => {
    console.log(`  - ${lesson.lesson_title} (${lesson.stage})`);
  });
}

fixCurriculumStageFormat();
