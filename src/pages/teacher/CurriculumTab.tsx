import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import {
  BookOpen,
  Calendar,
  ClipboardList,
  FileText,
  Play,
  School,
  Settings,
  StickyNote,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface CurriculumTabProps {
  teacherId: string;
  teacherName: string;
  onOpenLessonBuilder?: () => void;
}

interface CurriculumLesson {
  assignmentId?: string | null;
  id: string;
  subject: string | null;
  stage: string | null;
  className: string | null;
  school: string | null;
  classId: string | null;
  lessonNumber: number | null;
  lessonTitle: string;
  lessonDate: string | null;
  status: string | null;
  teachingDate: string | null;
  skills: string[];
  quickNotes: string | null;
  updatedAt: string | null;
  homeworkMaterials: Material[];
  printableMaterials: Material[];
}

interface Material {
  id: string;
  label: string;
  url: string | null;
}

type ActionType =
  | 'build'
  | 'start'
  | 'evaluate'
  | 'printables'
  | 'homework'
  | 'quiz'
  | 'assignment'
  | 'quick-view';

interface ActiveAction {
  type: ActionType;
  lesson: CurriculumLesson;
}

const STATUS_BADGE_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  Scheduled: 'secondary',
  'In Progress': 'default',
  Done: 'default',
  Archived: 'outline',
};

const buildMaterialsFromLesson = (lesson: Tables<'curriculum'>): {
  homeworkMaterials: Material[];
  printableMaterials: Material[];
} => {
  const homeworkMaterials: Material[] = [];
  const printableMaterials: Material[] = [];

  for (let index = 1; index <= 6; index += 1) {
    const nameKey = `hw${index}_name` as const;
    const urlKey = `hw${index}_url` as const;
    if (lesson[nameKey]) {
      homeworkMaterials.push({
        id: `${lesson.id}-hw-${index}`,
        label: lesson[nameKey] ?? `Homework ${index}`,
        url: lesson[urlKey],
      });
    }
  }

  for (let index = 1; index <= 4; index += 1) {
    const nameKey = `p${index}_name` as const;
    const urlKey = `p${index}_url` as const;
    if (lesson[nameKey]) {
      printableMaterials.push({
        id: `${lesson.id}-print-${index}`,
        label: lesson[nameKey] ?? `Printable ${index}`,
        url: lesson[urlKey],
      });
    }
  }

  return { homeworkMaterials, printableMaterials };
};

const CurriculumTab = ({ teacherId, teacherName, onOpenLessonBuilder }: CurriculumTabProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [lessons, setLessons] = useState<CurriculumLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeAction, setActiveAction] = useState<ActiveAction | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Scheduled' | 'In Progress' | 'Done'>('all');
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;

    const loadLessons = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('teacher_assignments')
          .select(`
            id,
            curriculum_id,
            class_id,
            status,
            teaching_date,
            curriculum:curriculum_id (
              id,
              subject,
              stage,
              class,
              school,
              lesson_title,
              lesson_number,
              lesson_date,
              lesson_skills,
              updated_at,
              status,
              hw1_name,
              hw1_url,
              hw2_name,
              hw2_url,
              hw3_name,
              hw3_url,
              hw4_name,
              hw4_url,
              hw5_name,
              hw5_url,
              hw6_name,
              hw6_url,
              p1_name,
              p1_url,
              p2_name,
              p2_url,
              p3_name,
              p3_url,
              p4_name,
              p4_url
            ),
            classes:class_id (
              class_name,
              stage
            )
          `)
          .eq('teacher_id', teacherId)
          .order('teaching_date', { ascending: true });

        if (error) {
          throw error;
        }

        if (!isMounted) {
          return;
        }

        const mappedLessons: CurriculumLesson[] = (data || [])
          .filter((assignment): assignment is typeof assignment & { curriculum: Tables<'curriculum'> } => Boolean(assignment.curriculum))
          .map((assignment) => {
            const { curriculum, classes } = assignment;
            const skills = (curriculum.lesson_skills || '')
              .split(',')
              .map((skill) => skill.trim())
              .filter(Boolean);

            const { homeworkMaterials, printableMaterials } = buildMaterialsFromLesson(curriculum);

            return {
              assignmentId: assignment.id,
              id: curriculum.id,
              subject: curriculum.subject,
              stage: curriculum.stage ?? classes?.stage ?? curriculum.curriculum_stage ?? null,
              className: classes?.class_name ?? curriculum.class ?? null,
              school: curriculum.school,
              classId: assignment.class_id,
              lessonNumber: curriculum.lesson_number,
              lessonTitle: curriculum.lesson_title,
              lessonDate: curriculum.lesson_date,
              status: assignment.status ?? curriculum.status ?? 'Scheduled',
              teachingDate: assignment.teaching_date,
              skills,
              quickNotes: curriculum.description,
              updatedAt: curriculum.updated_at,
              homeworkMaterials,
              printableMaterials,
            };
          });

        setLessons(mappedLessons);
      } catch (lessonError) {
        console.error('Failed to load curriculum lessons', lessonError);
        toast({
          title: 'Unable to load curriculum',
          description:
            lessonError instanceof Error
              ? lessonError.message
              : 'Please try again later.',
          variant: 'destructive',
        });
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadLessons();

    return () => {
      isMounted = false;
    };
  }, [teacherId, toast]);

  const filteredLessons = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return lessons.filter((lesson) => {
      const statusMatches =
        statusFilter === 'all' || (lesson.status ?? 'Scheduled').toLowerCase() === statusFilter.toLowerCase();

      if (!statusMatches) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        lesson.lessonTitle,
        lesson.subject,
        lesson.stage,
        lesson.className,
        lesson.skills.join(' '),
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query));
    });
  }, [lessons, searchQuery, statusFilter]);

  const handleAction = (type: ActionType, lesson: CurriculumLesson) => {
    if (type === 'build') {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('curriculumId', lesson.id);
      if (lesson.assignmentId) {
        newParams.set('assignmentId', lesson.assignmentId);
      }
      newParams.set('tab', 'lessonBuilder');
      setSearchParams(newParams, { replace: false });
      onOpenLessonBuilder?.();
      return;
    }

    if (type === 'quick-view') {
      setActiveAction({ type, lesson });
      return;
    }

    setActiveAction({ type, lesson });
  };

  const renderStatusBadge = (status: string | null) => {
    const normalizedStatus = status ?? 'Scheduled';
    const variant = STATUS_BADGE_VARIANT[normalizedStatus] ?? 'default';

    return (
      <Badge
        variant={variant}
        className={cn(
          'uppercase tracking-wide text-xs',
          (status ?? '').toLowerCase() === 'done' && 'bg-emerald-600/90 text-white'
        )}
      >
        {normalizedStatus}
      </Badge>
    );
  };

  const renderActionDialog = () => {
    if (!activeAction || activeAction.type === 'build') {
      return null;
    }

    const { lesson, type } = activeAction;

    const titleMap: Record<ActionType, string> = {
      'quick-view': 'Curriculum Quick View',
      start: 'Start Lesson Experience',
      evaluate: 'Evaluate Learners',
      printables: 'Lesson Printables',
      homework: 'Homework Planner',
      quiz: 'Create Quiz',
      assignment: 'Create Assignment',
      build: 'Build Lesson',
    };

    const iconMap: Partial<Record<ActionType, JSX.Element>> = {
      'quick-view': <BookOpen className="h-5 w-5" />,
      start: <Play className="h-5 w-5" />,
      evaluate: <ClipboardList className="h-5 w-5" />,
      printables: <FileText className="h-5 w-5" />,
      homework: <StickyNote className="h-5 w-5" />,
      quiz: <Settings className="h-5 w-5" />,
      assignment: <Users className="h-5 w-5" />,
    };

    const renderMaterials = (materials: Material[], emptyLabel: string) => {
      if (!materials.length) {
        return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
      }

      return (
        <ul className="space-y-2 text-sm">
          {materials.map((material) => (
            <li key={material.id} className="flex items-center justify-between gap-2">
              <span>{material.label}</span>
              {material.url ? (
                <Button variant="outline" size="sm" asChild>
                  <a href={material.url} target="_blank" rel="noreferrer">
                    Open
                  </a>
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      );
    };

    return (
      <Dialog open onOpenChange={(open) => (open ? null : setActiveAction(null))}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              {iconMap[type]}
              <span>{titleMap[type]}</span>
            </DialogTitle>
            <DialogDescription>
              {lesson.lessonTitle}
            </DialogDescription>
          </DialogHeader>

          {type === 'quick-view' ? (
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Subject</p>
                    <p className="text-muted-foreground">{lesson.subject || '—'}</p>
                  </div>
                  <div>
                    <p className="font-medium">Class / Stage</p>
                    <p className="text-muted-foreground">
                      {lesson.className || '—'}
                      {lesson.stage ? ` • ${lesson.stage}` : ''}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Lesson Number</p>
                    <p className="text-muted-foreground">{lesson.lessonNumber ?? '—'}</p>
                  </div>
                  <div>
                    <p className="font-medium">Lesson Date</p>
                    <p className="text-muted-foreground">
                      {lesson.lessonDate ? format(new Date(lesson.lessonDate), 'PPP') : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Teaching Date</p>
                    <p className="text-muted-foreground">
                      {lesson.teachingDate ? format(new Date(lesson.teachingDate), 'PPP') : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Status</p>
                    <div className="mt-1">{renderStatusBadge(lesson.status)}</div>
                  </div>
                </div>

                <div>
                  <p className="font-medium mb-2">Skills</p>
                  {lesson.skills.length ? (
                    <div className="flex flex-wrap gap-2">
                      {lesson.skills.map((skill) => (
                        <Badge key={skill} variant="outline">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No skills linked yet.</p>
                  )}
                </div>

                {lesson.quickNotes ? (
                  <div>
                    <p className="font-medium mb-2">Notes</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {lesson.quickNotes}
                    </p>
                  </div>
                ) : null}

                <div>
                  <p className="font-medium mb-2">Printables</p>
                  {renderMaterials(lesson.printableMaterials, 'No printable materials attached yet.')}
                </div>

                <div>
                  <p className="font-medium mb-2">Homework</p>
                  {renderMaterials(lesson.homeworkMaterials, 'No homework assigned yet.')}
                </div>
              </div>
            </ScrollArea>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                The {titleMap[type]} flow is powered by the selections made in the Lesson Builder. Choose materials and activities
                there to activate this workflow for every teacher assigned to the curriculum.
              </p>
              <div className="rounded-lg border bg-muted/30 p-4 text-sm space-y-2">
                <p className="font-medium">Next steps</p>
                <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                  <li>Confirm lesson resources and sequencing in Lesson Builder.</li>
                  <li>Activate the workflow for the selected class and stage.</li>
                  <li>Collaborate with co-teachers and share updates in real time.</li>
                </ul>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">Curriculum</h2>
          <p className="text-muted-foreground">
            {teacherName}, keep your curriculum lessons, resources, and collaboration tools aligned.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search lessons, classes, or skills..."
            className="w-64"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Badge className="bg-primary/10 text-primary">{statusFilter === 'all' ? 'All statuses' : statusFilter}</Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Status filter</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {['all', 'Scheduled', 'In Progress', 'Done'].map((status) => (
                <DropdownMenuItem
                  key={status}
                  onSelect={() => setStatusFilter(status as typeof statusFilter)}
                  className={cn(statusFilter === status && 'font-semibold text-primary')}
                >
                  {status === 'all' ? 'All statuses' : status}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-lg border bg-background shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[220px]">Lesson</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Skills</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  Loading curriculum lessons…
                </TableCell>
              </TableRow>
            ) : filteredLessons.length ? (
              filteredLessons.map((lesson) => (
                <TableRow key={`${lesson.id}-${lesson.assignmentId ?? 'unassigned'}`} className="hover:bg-muted/40">
                  <TableCell>
                    <div className="font-medium">{lesson.lessonTitle}</div>
                    <p className="text-xs text-muted-foreground">Lesson {lesson.lessonNumber ?? '—'}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      {lesson.subject || '—'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {lesson.className || 'Unassigned'}
                      </span>
                      <span className="flex items-center gap-1">
                        <School className="h-3 w-3" /> {lesson.stage || '—'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      <div className="flex flex-col">
                        <span>
                          {lesson.lessonDate ? format(new Date(lesson.lessonDate), 'PP') : '—'}
                        </span>
                        <span>
                          {lesson.teachingDate ? format(new Date(lesson.teachingDate), 'PP') : '—'}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{renderStatusBadge(lesson.status)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {lesson.skills.slice(0, 3).map((skill) => (
                        <Badge key={skill} variant="outline" className="text-[11px]">
                          {skill}
                        </Badge>
                      ))}
                      {lesson.skills.length > 3 ? (
                        <Badge variant="outline" className="text-[11px]">
                          +{lesson.skills.length - 3}
                        </Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleAction('quick-view', lesson)}>
                        Quick view
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            Manage
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuLabel>Lesson actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => handleAction('build', lesson)}>
                            Build Lesson
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleAction('start', lesson)}>
                            Start Lesson
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleAction('evaluate', lesson)}>
                            Evaluate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => handleAction('printables', lesson)}>
                            Printables
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleAction('homework', lesson)}>
                            Homework
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => handleAction('quiz', lesson)}>
                            Add Quiz
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleAction('assignment', lesson)}>
                            Add Assignment
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <FileText className="h-6 w-6" />
                    <p>No curriculum lessons found for your classes yet.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {renderActionDialog()}
    </div>
  );
};

export default CurriculumTab;
