import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, CalendarDays, CheckSquare, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/integrations/supabase/client';

interface LessonRecord {
  id: string;
  lesson_title: string;
  subject: string | null;
  status: string | null;
  class_id: string | null;
  stage: string | null;
}

interface EnrollmentStudent {
  id: string;
  full_name: string;
}

interface HomeworkRecipientRow {
  student_id: string;
  students: { id: string; full_name: string } | null;
}

interface HomeworkRecord {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  resources: Record<string, unknown> | null;
  created_at: string;
  lesson_homework_students?: HomeworkRecipientRow[];
}

const LessonHomeworkManager = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { user, isTeacher } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [lesson, setLesson] = useState<LessonRecord | null>(null);
  const [students, setStudents] = useState<EnrollmentStudent[]>([]);
  const [homeworkItems, setHomeworkItems] = useState<HomeworkRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newHomework, setNewHomework] = useState({
    title: '',
    description: '',
    dueDate: '',
    resourceUrl: '',
  });
  const [selectedRecipients, setSelectedRecipients] = useState<Record<string, string>>({});

  const refreshHomework = async () => {
    if (!lessonId) {
      setHomeworkItems([]);
      return;
    }

    const { data, error } = await supabase
      .from('lesson_homework')
      .select(
        `id, title, description, due_date, resources, created_at, lesson_homework_students ( student_id, students ( id, full_name ) )`
      )
      .eq('lesson_id', lessonId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to refresh homework', error);
      return;
    }

    setHomeworkItems((data ?? []) as unknown as HomeworkRecord[]);
  };

  useEffect(() => {
    if (!lessonId || !user?.id || !isTeacher) {
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const { data: lessonData, error: lessonError } = await supabase
          .from('lessons')
          .select('id, lesson_title, subject, status, class_id, stage')
          .eq('id', lessonId)
          .single();

        if (lessonError) {
          throw lessonError;
        }

        setLesson(lessonData as LessonRecord);

        if (lessonData?.class_id) {
          const { data: enrollmentData, error: enrollmentError } = await supabase
            .from('enrollments')
            .select('student:students(id, full_name)')
            .eq('class_id', lessonData.class_id);

          if (enrollmentError) {
            throw enrollmentError;
          }

          const resolvedStudents = (enrollmentData ?? [])
            .map((row: { student: EnrollmentStudent | null }) => row.student)
            .filter((student): student is EnrollmentStudent => Boolean(student));
          setStudents(resolvedStudents);
        }

        await refreshHomework();
      } catch (error) {
        console.error('Failed to load homework manager', error);
        toast({
          title: 'Unable to load homework',
          description: 'We could not fetch homework assignments for this lesson.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [lessonId, user?.id, isTeacher, toast]);

  const updateLessonStatus = async (status: string, note: string) => {
    if (!lesson || !user?.id) {
      return;
    }

    if (lesson.status === status) {
      return;
    }

    await supabase
      .from('lessons')
      .update({ status })
      .eq('id', lesson.id);

    await supabase.from('lesson_status_history').insert({
      lesson_id: lesson.id,
      previous_status: lesson.status,
      new_status: status,
      changed_by: user.id,
      change_notes: note,
    });

    setLesson((current) =>
      current
        ? {
            ...current,
            status,
          }
        : current
    );
  };

  const assignedCount = useMemo(() => {
    const counts = new Map<string, number>();
    homeworkItems.forEach((item) => {
      const recipients = item.lesson_homework_students ?? [];
      counts.set(item.id, recipients.length);
    });
    return counts;
  }, [homeworkItems]);

  const handleCreateHomework = async () => {
    if (!lesson || !user?.id || !newHomework.title.trim()) {
      toast({
        title: 'Add a title',
        description: 'Homework items need a title before saving.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      await supabase.from('lesson_homework').insert({
        lesson_id: lesson.id,
        title: newHomework.title.trim(),
        description: newHomework.description.trim() || null,
        due_date: newHomework.dueDate || null,
        resources: newHomework.resourceUrl
          ? { links: [newHomework.resourceUrl.trim()], source: 'Curriculum homework manager' }
          : { source: 'Curriculum homework manager' },
        created_by: user.id,
      });

      await refreshHomework();
      await updateLessonStatus('In Progress', 'Homework prepared for learners.');
      toast({ title: 'Homework saved', description: 'Homework is ready to assign to students.' });
      setNewHomework({ title: '', description: '', dueDate: '', resourceUrl: '' });
    } catch (error) {
      console.error('Failed to create homework', error);
      toast({
        title: 'Unable to save homework',
        description: 'Please retry saving the homework assignment.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAssignHomework = async (homeworkId: string, studentId: string | null) => {
    if (!studentId) {
      toast({
        title: 'Select a learner',
        description: 'Choose a learner before assigning homework.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await supabase
        .from('lesson_homework_students')
        .upsert([{ homework_id: homeworkId, student_id: studentId }], { onConflict: 'homework_id,student_id' });
      await refreshHomework();
      await updateLessonStatus('In Progress', 'Homework assigned to individual learner.');
      toast({ title: 'Homework assigned', description: 'Learner notified of the homework task.' });
    } catch (error) {
      console.error('Failed to assign homework', error);
      toast({
        title: 'Unable to assign homework',
        description: 'Please retry delivering the homework.',
        variant: 'destructive',
      });
    }
  };

  const handleAssignHomeworkToClass = async (homeworkId: string) => {
    if (!students.length) {
      toast({
        title: 'No students enrolled',
        description: 'Add students to this class before assigning homework.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const rows = students.map((student) => ({ homework_id: homeworkId, student_id: student.id }));
      await supabase
        .from('lesson_homework_students')
        .upsert(rows, { onConflict: 'homework_id,student_id' });
      await refreshHomework();
      await updateLessonStatus('In Progress', 'Homework assigned to entire class.');
      toast({ title: 'Homework shared with class', description: 'All learners received the assignment.' });
    } catch (error) {
      console.error('Failed to assign homework to class', error);
      toast({
        title: 'Unable to assign to class',
        description: 'Please retry delivering the homework to the class.',
        variant: 'destructive',
      });
    }
  };

  if (!user || !isTeacher) {
    return <Navigate to="/login" replace />;
  }

  if (!lessonId) {
    return null;
  }

  return (
    <div className="container mx-auto max-w-5xl space-y-6 py-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Homework planner</h1>
          <p className="text-sm text-muted-foreground">
            Design, schedule, and assign homework aligned to your lesson outcomes.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : lesson ? (
        <div className="grid gap-6 lg:grid-cols-[2fr,3fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{lesson.lesson_title}</CardTitle>
                <CardDescription>
                  {lesson.subject ?? 'General'} • {lesson.stage ?? 'Stage TBD'}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                <p>
                  <span className="font-medium text-foreground">Current status:</span>{' '}
                  {lesson.status ?? 'Scheduled'}
                </p>
                <p>
                  <span className="font-medium text-foreground">Homework count:</span>{' '}
                  {homeworkItems.length}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Create homework</CardTitle>
                <CardDescription>Give learners clarity on expectations and due dates.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="hw-title">Title</Label>
                  <Input
                    id="hw-title"
                    value={newHomework.title}
                    onChange={(event) =>
                      setNewHomework((current) => ({ ...current, title: event.target.value }))
                    }
                    placeholder="E.g. Reading comprehension reflections"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hw-description">Instructions</Label>
                  <Textarea
                    id="hw-description"
                    value={newHomework.description}
                    onChange={(event) =>
                      setNewHomework((current) => ({ ...current, description: event.target.value }))
                    }
                    placeholder="Add instructions or success criteria."
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="hw-due-date">Due date</Label>
                    <Input
                      id="hw-due-date"
                      type="date"
                      value={newHomework.dueDate}
                      onChange={(event) =>
                        setNewHomework((current) => ({ ...current, dueDate: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hw-resource">Resource link</Label>
                    <Input
                      id="hw-resource"
                      placeholder="https://"
                      value={newHomework.resourceUrl}
                      onChange={(event) =>
                        setNewHomework((current) => ({ ...current, resourceUrl: event.target.value }))
                      }
                    />
                  </div>
                </div>
                <Button onClick={handleCreateHomework} disabled={saving} className="gap-2">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckSquare className="h-4 w-4" />}
                  <span>Save homework</span>
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Assignments and recipients</CardTitle>
              <CardDescription>Track who has received each homework task.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[640px] pr-4">
                <div className="space-y-4">
                  {homeworkItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No homework created yet. Design an assignment to start sharing it with learners.
                    </p>
                  ) : (
                    homeworkItems.map((item) => {
                      const recipients = item.lesson_homework_students ?? [];
                      const assignedStudents = recipients
                        .map((recipient) => recipient.students?.full_name)
                        .filter((name): name is string => Boolean(name));

                      const resourceLinks = Array.isArray(item.resources?.links)
                        ? (item.resources?.links as string[])
                        : [];

                      return (
                        <div key={item.id} className="rounded-lg border p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-semibold">{item.title}</h3>
                              <p className="text-xs text-muted-foreground">
                                Created {format(new Date(item.created_at), 'PPpp')}
                              </p>
                              {item.due_date ? (
                                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                  <CalendarDays className="h-3 w-3" /> Due {format(new Date(item.due_date), 'PP')}
                                </p>
                              ) : null}
                              {item.description ? (
                                <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                              ) : null}
                              {resourceLinks.length ? (
                                <div className="mt-2 space-y-1">
                                  {resourceLinks.map((link) => (
                                    <Button key={link} variant="link" asChild className="px-0 text-sm">
                                      <a href={link} target="_blank" rel="noreferrer">
                                        Open resource
                                      </a>
                                    </Button>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                            <Badge variant="outline">{assignedCount.get(item.id) ?? 0} assigned</Badge>
                          </div>

                          <div className="mt-4 space-y-2">
                            <Label className="text-xs uppercase text-muted-foreground">Assign to learner</Label>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                              <Select
                                value={selectedRecipients[item.id] ?? ''}
                                onValueChange={(value) =>
                                  setSelectedRecipients((current) => ({
                                    ...current,
                                    [item.id]: value,
                                  }))
                                }
                              >
                                <SelectTrigger className="sm:w-[240px]">
                                  <SelectValue placeholder="Choose learner" />
                                </SelectTrigger>
                                <SelectContent>
                                  {students.map((student) => (
                                    <SelectItem key={student.id} value={student.id}>
                                      {student.full_name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button
                                variant="secondary"
                                className="gap-2"
                                onClick={() =>
                                  handleAssignHomework(item.id, selectedRecipients[item.id] ?? null)
                                }
                              >
                                <Send className="h-4 w-4" />
                                Send to learner
                              </Button>
                            </div>
                          </div>

                          <div className="mt-4 space-y-2">
                            <Label className="text-xs uppercase text-muted-foreground">Assign to class</Label>
                            <Button
                              variant="outline"
                              className="gap-2"
                              onClick={() => handleAssignHomeworkToClass(item.id)}
                            >
                              <Send className="h-4 w-4" />
                              Share with class
                            </Button>
                          </div>

                          <div className="mt-4">
                            <Label className="text-xs uppercase text-muted-foreground">Recipients</Label>
                            {assignedStudents.length ? (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {assignedStudents.map((name) => (
                                  <Badge key={`${item.id}-${name}`} variant="secondary">
                                    {name}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <p className="mt-2 text-xs text-muted-foreground">Not assigned yet.</p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Lesson not found</CardTitle>
            <CardDescription>
              We could not locate this lesson. Return to the curriculum to try again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/teacher/dashboard?tab=curriculum')}>Back to curriculum</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LessonHomeworkManager;
