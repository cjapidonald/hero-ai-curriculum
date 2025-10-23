import { LESSON_SKILL_OPTIONS } from './lessonSkills';

export interface SampleLesson {
  id: string;
  lessonNumber: number;
  title: string;
  subject: string;
  stage: string;
  date: string;
  summary: string;
  objectives: string[];
  skills: string[];
  successCriteria: string;
}

export interface SampleClassCurriculum {
  classId: string;
  className: string;
  stage: string;
  subject: string;
  teacherId: string;
  teacherName: string;
  lessons: SampleLesson[];
}

const SKILL_LABELS = new Map(LESSON_SKILL_OPTIONS.map((skill) => [skill.id, skill.label]));

const mapSkillIdsToLabels = (ids: string[]): string[] => {
  return ids
    .map((id) => SKILL_LABELS.get(id) || id)
    .filter((label, index, self) => Boolean(label) && self.indexOf(label) === index);
};

const baseAlvinLessons: Omit<SampleClassCurriculum, 'teacherId' | 'teacherName'> = {
  classId: 'sample-class-alvin-stage-1',
  className: 'Alvin',
  stage: 'Stage 1 (Pre-A1)',
  subject: 'Cambridge Integrated Studies',
  lessons: [
    {
      id: 'sample-alvin-lesson-1',
      lessonNumber: 1,
      title: 'Welcome to Alvin Stage 1',
      subject: 'English',
      stage: 'Stage 1 (Pre-A1)',
      date: '2024-01-15',
      summary: 'Introduce classroom routines with songs, chants, and phonics warm-ups that build Cambridge Pre-A1 confidence.',
      objectives: [
        'Follow classroom routines using simple English commands',
        'Blend the sounds /s/, /a/, /t/, /p/ to read CVC words',
        'Sing along to the Cambridge starter chant with correct rhythm',
      ],
      skills: mapSkillIdsToLabels(['english-communication', 'storytelling-and-phonics', 'phonics-fluency']),
      successCriteria: 'Students respond to classroom routines, blend target sounds, and participate in chants with confidence.',
    },
    {
      id: 'sample-alvin-lesson-2',
      lessonNumber: 2,
      title: 'Number Stories and Patterns',
      subject: 'Math',
      stage: 'Stage 1 (Pre-A1)',
      date: '2024-01-22',
      summary: 'Use manipulatives and storytelling to explore numbers 1-10, making patterns and comparing sets.',
      objectives: [
        'Count objects to 10 using concrete manipulatives',
        'Represent numbers in different ways (tally marks, dots, numerals)',
        'Identify and create AB and ABC patterns in the classroom',
      ],
      skills: mapSkillIdsToLabels(['mathematical-thinking', 'english-communication']),
      successCriteria: 'Learners explain number stories with manipulatives and create repeating patterns independently.',
    },
    {
      id: 'sample-alvin-lesson-3',
      lessonNumber: 3,
      title: 'Our Five Senses Investigation',
      subject: 'Science',
      stage: 'Stage 1 (Pre-A1)',
      date: '2024-01-29',
      summary: 'Learners investigate the five senses through stations, describing discoveries with structured language frames.',
      objectives: [
        'Name the five senses and link each to a body part',
        'Describe observations using sentence frames (I can see/hear/feel...)',
        'Record sensory data using pictographs in learning journals',
      ],
      skills: mapSkillIdsToLabels(['science-discovery', 'english-communication']),
      successCriteria: 'Students explain which senses they used at each station and record observations accurately.',
    },
  ],
};

export const buildSampleCurriculumForTeacher = (
  teacherId: string,
  teacherName: string
): SampleClassCurriculum[] => {
  if (teacherName.toLowerCase().includes('donald')) {
    return [
      {
        ...baseAlvinLessons,
        teacherId,
        teacherName,
      },
    ];
  }

  return [];
};
