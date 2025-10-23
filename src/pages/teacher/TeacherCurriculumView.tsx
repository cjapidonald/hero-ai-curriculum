import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { buildSampleCurriculumForTeacher, SampleClassCurriculum, SampleLesson } from '@/constants/sampleTeacherCurriculum';
import { CheckCircle2, Plus, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TeacherCurriculumViewProps {
  teacherId: string;
  teacherName: string;
  onEditLesson: (lessonId: string) => void;
  onCreateLesson: (defaults: {
    className: string;
    stage?: string;
    subject?: string;
    skills?: string[];
    lessonTitle?: string;
    successCriteria?: string;
  }) => void;
}

interface CurriculumLesson extends SampleLesson {
  source: 'database' | 'sample';
}

interface ClassWithLessons extends Omit<SampleClassCurriculum, 'lessons'> {
  lessons: CurriculumLesson[];
}

const formatDate = (value?: string | null) => {
  if (!value) return 'To be scheduled';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const buildClassesFromDatabase = (
  classes: any[] | null,
  lessons: any[] | null
): ClassWithLessons[] => {
  const classMap = new Map<string, ClassWithLessons>();

  (classes || []).forEach((cls) => {
    const className = cls.class_name || cls.name || 'Unassigned Class';
    classMap.set(className, {
      classId: cls.id,
      className,
      stage: cls.stage || 'Stage 1',
      subject: cls.subject || 'English',
      teacherId: cls.teacher_id,
      teacherName: cls.teacher_name || '',
      lessons: [],
    });
  });

  (lessons || []).forEach((lesson) => {
    const className = lesson.class || 'Unassigned Class';
    if (!classMap.has(className)) {
      classMap.set(className, {
        classId: lesson.class_id || `unassigned-${className}`,
        className,
        stage: lesson.curriculum_stage || lesson.stage || 'Stage 1',
        subject: lesson.subject || 'English',
        teacherId: lesson.teacher_id || '',
        teacherName: lesson.teacher_name || '',
        lessons: [],
      });
    }

    const skillList = typeof lesson.lesson_skills === 'string'
      ? lesson.lesson_skills
          .split(',')
          .map((skill: string) => skill.trim())
          .filter(Boolean)
      : Array.isArray(lesson.lesson_skills)
        ? lesson.lesson_skills
        : [];

    const curriculumLesson: CurriculumLesson = {
      id: lesson.id,
      lessonNumber: lesson.lesson_number || 0,
      title: lesson.lesson_title || 'Untitled Lesson',
      subject: lesson.subject || 'English',
      stage: lesson.curriculum_stage || lesson.stage || 'Stage 1',
      date: lesson.lesson_date || '',
      summary: lesson.description || lesson.lesson_summary || 'This lesson has been scheduled but needs a summary.',
      objectives: Array.isArray(lesson.objectives)
        ? lesson.objectives
        : (typeof lesson.objectives === 'string'
            ? lesson.objectives
                .split('\n')
                .map((item: string) => item.trim())
                .filter(Boolean)
            : []),
      skills: skillList,
      successCriteria: lesson.success_criteria || 'Success criteria will be defined in the lesson builder.',
      source: 'database',
    };

    classMap.get(className)?.lessons.push(curriculumLesson);
  });

  return Array.from(classMap.values()).map((classItem) => ({
    ...classItem,
    lessons: classItem.lessons.sort((a, b) => a.lessonNumber - b.lessonNumber),
  }));
};

const TeacherCurriculumView = ({ teacherId, teacherName, onEditLesson, onCreateLesson }: TeacherCurriculumViewProps) => {
  const [classes, setClasses] = useState<ClassWithLessons[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [classesRes, lessonsRes] = await Promise.all([
          supabase
            .from('classes')
            .select('id, class_name, name, stage, subject, teacher_id, teacher_name, is_active')
            .eq('teacher_id', teacherId)
            .eq('is_active', true)
            .order('class_name'),
          supabase
            .from('curriculum')
            .select('*')
            .eq('teacher_id', teacherId)
            .order('lesson_date', { ascending: true }),
        ]);

        if (!isMounted) return;

        if (classesRes.error) {
          throw classesRes.error;
        }

        if (lessonsRes.error) {
          throw lessonsRes.error;
        }

        const grouped = buildClassesFromDatabase(classesRes.data, lessonsRes.data);

        if (grouped.length === 0) {
          const samples = buildSampleCurriculumForTeacher(teacherId, teacherName).map((sampleClass) => ({
            ...sampleClass,
            lessons: sampleClass.lessons.map((lesson) => ({ ...lesson, source: 'sample' as const })),
          }));
          setClasses(samples);
        } else {
          setClasses(grouped);
        }
      } catch (err: any) {
        console.error('Error loading teacher curriculum:', err);
        if (!isMounted) return;

        const samples = buildSampleCurriculumForTeacher(teacherId, teacherName).map((sampleClass) => ({
          ...sampleClass,
          lessons: sampleClass.lessons.map((lesson) => ({ ...lesson, source: 'sample' as const })),
        }));

        if (samples.length > 0) {
          setClasses(samples);
          setError(
            'We could not load curriculum data from Supabase, so a sample Alvin Stage 1 curriculum is shown for Teacher Donald.'
          );
        } else {
          setError('We could not load your curriculum data. Please try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [teacherId, teacherName]);

  const hasSampleData = useMemo(() => classes.some((cls) => cls.lessons.some((lesson) => lesson.source === 'sample')), [classes]);

  if (loading) {
    return (
      <div className="grid gap-4">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={`skeleton-${index}`} className="p-6">
            <Skeleton className="h-6 w-1/3 mb-4" />
            <Skeleton className="h-4 w-2/3 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-6" />
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((__, idx) => (
                <Skeleton key={idx} className="h-20 w-full" />
              ))}
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No curriculum found yet</CardTitle>
          <CardDescription>
            Once you create lessons for your classes, they will appear here grouped by class.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={() => onCreateLesson({ className: 'New Class' })}>
            <Plus className="mr-2 h-4 w-4" />
            Add your first lesson
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {hasSampleData && (
        <Card className="border-amber-300 bg-amber-50/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <CheckCircle2 className="h-5 w-5" />
              Sample Alvin Stage 1 Curriculum
            </CardTitle>
            <CardDescription className="text-amber-800">
              This curated sample shows how Teacher Donald’s Alvin class can be organized. Use the templates below to create your
              own live lessons in the builder.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {classes.map((classItem) => (
        <Card key={classItem.classId} className="shadow-sm border-muted">
          <CardHeader className="border-b border-muted/40 bg-muted/20">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-2xl">{classItem.className} Curriculum</CardTitle>
                <CardDescription>
                  {classItem.stage} • {classItem.subject}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Teacher {teacherName}</Badge>
                <Badge variant="outline">Lessons: {classItem.lessons.length}</Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pt-6">
            {classItem.lessons.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No lessons created yet. Use the button below to add your first lesson.
              </div>
            ) : (
              classItem.lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className={cn(
                    'rounded-lg border p-4 transition-colors',
                    lesson.source === 'sample'
                      ? 'border-primary/30 bg-primary/5 hover:border-primary/60'
                      : 'border-border hover:border-primary/40'
                  )}
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-medium text-primary">Lesson {lesson.lessonNumber}</span>
                        <span>• {formatDate(lesson.date)}</span>
                        <span>• {lesson.stage}</span>
                        <span>• {lesson.subject}</span>
                      </div>
                      <h3 className="text-xl font-semibold">{lesson.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
                        {lesson.summary}
                      </p>
                      {lesson.objectives.length > 0 && (
                        <div className="rounded-md bg-muted/60 p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                            Lesson objectives
                          </p>
                          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                            {lesson.objectives.map((objective) => (
                              <li key={objective}>{objective}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {lesson.skills.length > 0 ? (
                          lesson.skills.map((skill) => (
                            <Badge key={skill} variant="outline" className="bg-background">
                              {skill}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">No skills tagged yet</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 min-w-[200px]">
                      {lesson.source === 'sample' ? (
                        <Button
                          variant="default"
                          onClick={() =>
                            onCreateLesson({
                              className: classItem.className,
                              stage: classItem.stage,
                              subject: lesson.subject || classItem.subject,
                              skills: lesson.skills,
                              lessonTitle: lesson.title,
                              successCriteria: lesson.successCriteria,
                            })
                          }
                        >
                          <ArrowUpRight className="mr-2 h-4 w-4" />
                          Use in Lesson Builder
                        </Button>
                      ) : (
                        <Button variant="outline" onClick={() => onEditLesson(lesson.id)}>
                          <ArrowUpRight className="mr-2 h-4 w-4" />
                          Open in Lesson Builder
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>

          <CardFooter className="border-t border-muted/40 bg-muted/10">
            <Button
              variant="secondary"
              onClick={() =>
                onCreateLesson({
                  className: classItem.className,
                  stage: classItem.stage,
                  subject: classItem.subject,
                  skills: [],
                })
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Lesson
            </Button>
          </CardFooter>
        </Card>
      ))}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
};

export default TeacherCurriculumView;
