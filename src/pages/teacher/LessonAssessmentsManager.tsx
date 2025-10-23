import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, CalendarDays, ClipboardList, Loader2, Send } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

interface AssessmentRecipientRow {
  student_id: string;
  students: { id: string; full_name: string } | null;
}

interface UpcomingAssessmentRecord {
  id: string;
  title: string | null;
  description: string | null;
  assessment_type: string | null;
  scheduled_date: string | null;
  created_at: string;
  lesson_upcoming_assessments_students?: AssessmentRecipientRow[];
}

type AssessmentType = 'quiz' | 'assignment';

const LessonAssessmentsManager = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isTeacher } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const initialType = (searchParams.get('type') as AssessmentType) || 'quiz';

  const [lesson, setLesson] = useState<LessonRecord | null>(null);
  const [students, setStudents] = useState<EnrollmentStudent[]>([]);
  const [assessments, setAssessments] = useState<UpcomingAssessmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeType, setActiveType] = useState<AssessmentType>(initialType);
  const [newAssessment, setNewAssessment] = useState({
    title: '',
    description: '',
    scheduledDate: '',
  });
  const [selectedRecipients, setSelectedRecipients] = useState<Record<string, string>>({});

  const refreshAssessments = async (type: AssessmentType) => {
    if (!lessonId) {
      setAssessments([]);
      return;
    }

    const { data, error } = await supabase
      .from('lesson_upcoming_assessments')
      .select(
        `id, title, description, assessment_type, scheduled_date, created_at, lesson_upcoming_assessments_students ( student_id, students ( id, full_name ) )`
      )
      .eq('lesson_id', lessonId)
      .eq('assessment_type', type)
      .order('scheduled_date', { ascending: true });

    if (error) {
      console.error('Failed to refresh upcoming assessments', error);
      return;
    }

    setAssessments((data ?? []) as unknown as UpcomingAssessmentRecord[]);
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

        await refreshAssessments(activeType);
      } catch (error) {
        console.error('Failed to load assessments manager', error);
        toast({
          title: 'Unable to load assessments',
          description: 'We could not fetch upcoming assessments for this lesson.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [lessonId, user?.id, isTeacher, toast]);

  useEffect(() => {
    if (!lessonId || !user?.id || !isTeacher) {
      return;
    }

    refreshAssessments(activeType);
  }, [activeType, lessonId, user?.id, isTeacher]);

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
    assessments.forEach((item) => {
      const recipients = item.lesson_upcoming_assessments_students ?? [];
      counts.set(item.id, recipients.length);
    });
    return counts;
  }, [assessments]);

  const handleCreateAssessment = async () => {
    if (!lesson || !user?.id || !newAssessment.title.trim()) {
      toast({
        title: 'Add a title',
        description: 'Upcoming assessments need a title before saving.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      await supabase.from('lesson_upcoming_assessments').insert({
        lesson_id: lesson.id,
        assessment_type: activeType,
        title: newAssessment.title.trim(),
        description: newAssessment.description.trim() || null,
        scheduled_date: newAssessment.scheduledDate || null,
        created_by: user.id,
      });

      await refreshAssessments(activeType);
      await updateLessonStatus('Scheduled', 'Upcoming assessment planned for the lesson.');
      toast({ title: 'Assessment saved', description: 'Assessment added to the upcoming schedule.' });
      setNewAssessment({ title: '', description: '', scheduledDate: '' });
    } catch (error) {
      console.error('Failed to create assessment', error);
      toast({
        title: 'Unable to save assessment',
        description: 'Please retry saving the upcoming assessment.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAssignAssessment = async (assessmentId: string, studentId: string | null) => {
    if (!studentId) {
      toast({
        title: 'Select a learner',
        description: 'Choose a learner before sending the assessment reminder.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await supabase
        .from('lesson_upcoming_assessments_students')
        .upsert(
          [{ upcoming_assessment_id: assessmentId, student_id: studentId }],
          { onConflict: 'upcoming_assessment_id,student_id' }
        );
      await refreshAssessments(activeType);
      await updateLessonStatus('Scheduled', 'Upcoming assessment shared with learners.');
      toast({ title: 'Learner notified', description: 'The learner has been notified about the assessment.' });
    } catch (error) {
      console.error('Failed to assign assessment', error);
      toast({
        title: 'Unable to notify learner',
        description: 'Please retry sending the assessment reminder.',
        variant: 'destructive',
      });
    }
  };

  const handleNotifyClass = async (assessmentId: string) => {
    if (!students.length) {
      toast({
        title: 'No students enrolled',
        description: 'Add students to this class before sending reminders.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const rows = students.map((student) => ({ upcoming_assessment_id: assessmentId, student_id: student.id }));
      await supabase
        .from('lesson_upcoming_assessments_students')
        .upsert(rows, { onConflict: 'upcoming_assessment_id,student_id' });
      await refreshAssessments(activeType);
      await updateLessonStatus('Scheduled', 'Upcoming assessment shared with entire class.');
      toast({ title: 'Class notified', description: 'All learners received the upcoming assessment details.' });
    } catch (error) {
      console.error('Failed to notify class', error);
      toast({
        title: 'Unable to notify class',
        description: 'Please retry sending the assessment reminder to the class.',
        variant: 'destructive',
      });
    }
  };

  const handleTabChange = (value: AssessmentType) => {
    setActiveType(value);
    const params = new URLSearchParams(searchParams);
    params.set('type', value);
    setSearchParams(params);
    setNewAssessment({ title: '', description: '', scheduledDate: '' });
    setSelectedRecipients({});
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
          <h1 className="text-3xl font-bold">Upcoming assessments</h1>
          <p className="text-sm text-muted-foreground">
            Plan quizzes and assignments, then notify learners with a single click.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : lesson ? (
        <Tabs value={activeType} onValueChange={(value) => handleTabChange(value as AssessmentType)}>
          <TabsList className="grid w-full grid-cols-2 lg:w-[360px]">
            <TabsTrigger value="quiz" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              Quiz schedule
            </TabsTrigger>
            <TabsTrigger value="assignment" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              Assignments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quiz" className="mt-6">
            <AssessmentTab
              lesson={lesson}
              assessments={assessments}
              students={students}
              newAssessment={newAssessment}
              setNewAssessment={setNewAssessment}
              selectedRecipients={selectedRecipients}
              setSelectedRecipients={setSelectedRecipients}
              assignedCount={assignedCount}
              activeType={activeType}
              saving={saving}
              onCreate={handleCreateAssessment}
              onAssign={handleAssignAssessment}
              onNotifyClass={handleNotifyClass}
            />
          </TabsContent>

          <TabsContent value="assignment" className="mt-6">
            <AssessmentTab
              lesson={lesson}
              assessments={assessments}
              students={students}
              newAssessment={newAssessment}
              setNewAssessment={setNewAssessment}
              selectedRecipients={selectedRecipients}
              setSelectedRecipients={setSelectedRecipients}
              assignedCount={assignedCount}
              activeType={activeType}
              saving={saving}
              onCreate={handleCreateAssessment}
              onAssign={handleAssignAssessment}
              onNotifyClass={handleNotifyClass}
            />
          </TabsContent>
        </Tabs>
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

interface AssessmentTabProps {
  lesson: LessonRecord;
  assessments: UpcomingAssessmentRecord[];
  students: EnrollmentStudent[];
  newAssessment: {
    title: string;
    description: string;
    scheduledDate: string;
  };
  setNewAssessment: Dispatch<
    SetStateAction<{
      title: string;
      description: string;
      scheduledDate: string;
    }>
  >;
  selectedRecipients: Record<string, string>;
  setSelectedRecipients: Dispatch<SetStateAction<Record<string, string>>>;
  assignedCount: Map<string, number>;
  activeType: AssessmentType;
  saving: boolean;
  onCreate: () => Promise<void> | void;
  onAssign: (assessmentId: string, studentId: string | null) => Promise<void> | void;
  onNotifyClass: (assessmentId: string) => Promise<void> | void;
}

const AssessmentTab = ({
  lesson,
  assessments,
  students,
  newAssessment,
  setNewAssessment,
  selectedRecipients,
  setSelectedRecipients,
  assignedCount,
  activeType,
  saving,
  onCreate,
  onAssign,
  onNotifyClass,
}: AssessmentTabProps) => {
  return (
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
              <span className="font-medium text-foreground">Scheduled {activeType}s:</span>{' '}
              {assessments.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create {activeType}</CardTitle>
            <CardDescription>Capture details for the upcoming {activeType}.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="assessment-title">Title</Label>
              <Input
                id="assessment-title"
                value={newAssessment.title}
                onChange={(event) =>
                  setNewAssessment((current) => ({ ...current, title: event.target.value }))
                }
                placeholder={`E.g. Week 5 ${activeType}`}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assessment-description">Description</Label>
              <Textarea
                id="assessment-description"
                value={newAssessment.description}
                onChange={(event) =>
                  setNewAssessment((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Share key outcomes, rubric notes, or materials to review."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assessment-date">Scheduled date</Label>
              <Input
                id="assessment-date"
                type="date"
                value={newAssessment.scheduledDate}
                onChange={(event) =>
                  setNewAssessment((current) => ({ ...current, scheduledDate: event.target.value }))
                }
              />
            </div>
            <Button onClick={onCreate} className="gap-2" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardList className="h-4 w-4" />}
              <span>Save {activeType}</span>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming schedule</CardTitle>
          <CardDescription>Notify learners about dates and expectations.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[640px] pr-4">
            <div className="space-y-4">
              {assessments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No {activeType}s scheduled yet. Add an upcoming assessment to notify learners.
                </p>
              ) : (
                assessments.map((item) => {
                  const recipients = item.lesson_upcoming_assessments_students ?? [];
                  const assignedStudents = recipients
                    .map((recipient) => recipient.students?.full_name)
                    .filter((name): name is string => Boolean(name));

                  return (
                    <div key={item.id} className="rounded-lg border p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold">{item.title ?? `Upcoming ${activeType}`}</h3>
                          {item.scheduled_date ? (
                            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                              <CalendarDays className="h-3 w-3" /> Scheduled for {format(new Date(item.scheduled_date), 'PP')}
                            </p>
                          ) : null}
                          {item.description ? (
                            <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                          ) : null}
                          <p className="mt-2 text-xs text-muted-foreground">
                            Added {format(new Date(item.created_at), 'PPpp')}
                          </p>
                        </div>
                        <Badge variant="outline">{assignedCount.get(item.id) ?? 0} notified</Badge>
                      </div>

                      <div className="mt-4 space-y-2">
                        <Label className="text-xs uppercase text-muted-foreground">Notify learner</Label>
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
                              onAssign(item.id, selectedRecipients[item.id] ?? null)
                            }
                          >
                            <Send className="h-4 w-4" />
                            Notify learner
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        <Label className="text-xs uppercase text-muted-foreground">Notify class</Label>
                        <Button
                          variant="outline"
                          className="gap-2"
                          onClick={() => onNotifyClass(item.id)}
                        >
                          <Send className="h-4 w-4" />
                          Notify class
                        </Button>
                      </div>

                      <div className="mt-4">
                        <Label className="text-xs uppercase text-muted-foreground">Notifications sent</Label>
                        {assignedStudents.length ? (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {assignedStudents.map((name) => (
                              <Badge key={`${item.id}-${name}`} variant="secondary">
                                {name}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-2 text-xs text-muted-foreground">No notifications sent yet.</p>
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
  );
};

export default LessonAssessmentsManager;
