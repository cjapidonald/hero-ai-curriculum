export interface LessonSkillOption {
  id: string;
  label: string;
  subject: 'English' | 'Science' | 'Phonics' | 'Math';
  description: string;
}

export const LESSON_SKILL_OPTIONS: LessonSkillOption[] = [
  {
    id: 'english-communication',
    label: 'English Communication',
    subject: 'English',
    description: 'Speaking, listening, and vocabulary practice for Cambridge Pre-A1 learners.',
  },
  {
    id: 'storytelling-and-phonics',
    label: 'Storytelling & Phonics',
    subject: 'Phonics',
    description: 'Building decoding skills through letter-sound correspondence and shared reading.',
  },
  {
    id: 'science-discovery',
    label: 'Science Discovery',
    subject: 'Science',
    description: 'Hands-on investigations that build curiosity and observation skills.',
  },
  {
    id: 'mathematical-thinking',
    label: 'Mathematical Thinking',
    subject: 'Math',
    description: 'Number sense, patterning, and problem-solving for young learners.',
  },
  {
    id: 'phonics-fluency',
    label: 'Phonics Fluency',
    subject: 'Phonics',
    description: 'Practicing blends, digraphs, and fluency routines that reinforce Cambridge phonics goals.',
  },
  {
    id: 'creative-language',
    label: 'Creative Language Production',
    subject: 'English',
    description: 'Role-play, chants, and collaborative talk for confident communication.',
  },
];
