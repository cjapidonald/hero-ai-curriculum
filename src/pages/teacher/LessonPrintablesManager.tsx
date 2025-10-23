import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Download, Loader2, Send } from 'lucide-react';
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

interface PrintableRecipientRow {
  student_id: string;
  students: { id: string; full_name: string } | null;
}

interface PrintableRecord {
  id: string;
  title: string;
  file_url: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  lesson_printables_students?: PrintableRecipientRow[];
}

const LessonPrintablesManager = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { user, isTeacher } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [lesson, setLesson] = useState<LessonRecord | null>(null);
  const [students, setStudents] = useState<EnrollmentStudent[]>([]);
  const [printables, setPrintables] = useState<PrintableRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newPrintable, setNewPrintable] = useState({
    title: '',
    description: '',
    fileUrl: '',
  });
  const [selectedRecipients, setSelectedRecipients] = useState<Record<string, string>>({});

  const refreshPrintables = async () => {
    if (!lessonId) {
      setPrintables([]);
      return;
    }

    const { data, error } = await supabase
      .from('lesson_printables')
      .select(
        `id, title, file_url, metadata, created_at, lesson_printables_students ( student_id, students ( id, full_name ) )`
      )
      .eq('lesson_id', lessonId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to refresh printables', error);
      return;
    }

    setPrintables((data ?? []) as unknown as PrintableRecord[]);
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

        await refreshPrintables();
      } catch (error) {
        console.error('Failed to load printables manager', error);
        toast({
          title: 'Unable to load printables',
          description: 'We could not fetch printable resources for this lesson.',
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
    printables.forEach((printable) => {
      const recipients = printable.lesson_printables_students ?? [];
      counts.set(printable.id, recipients.length);
    });
    return counts;
  }, [printables]);

  const handleCreatePrintable = async () => {
    if (!lesson || !user?.id || !newPrintable.title.trim()) {
      toast({
        title: 'Add a title',
        description: 'Printables need a clear title before saving.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      await supabase.from('lesson_printables').insert({
        lesson_id: lesson.id,
        title: newPrintable.title.trim(),
        file_url: newPrintable.fileUrl.trim() || null,
        metadata: newPrintable.description
          ? { description: newPrintable.description.trim(), source: 'Curriculum printables manager' }
          : { source: 'Curriculum printables manager' },
        created_by: user.id,
      });

      await refreshPrintables();
      await updateLessonStatus('In Progress', 'Printable resources prepared for the lesson.');
      toast({ title: 'Printable saved', description: 'Resource ready to share with students.' });
      setNewPrintable({ title: '', description: '', fileUrl: '' });
    } catch (error) {
      console.error('Failed to create printable', error);
      toast({
        title: 'Unable to save printable',
        description: 'Please retry saving the printable resource.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAssignPrintable = async (printableId: string, studentId: string | null) => {
    if (!studentId) {
      toast({
        title: 'Select a learner',
        description: 'Choose a learner before assigning the printable.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await supabase
        .from('lesson_printables_students')
        .upsert(
          [{ printable_id: printableId, student_id: studentId }],
          { onConflict: 'printable_id,student_id' }
        );
      await refreshPrintables();
      await updateLessonStatus('In Progress', 'Printable distributed to learners.');
      toast({ title: 'Printable shared', description: 'Learner notified of the new printable.' });
    } catch (error) {
      console.error('Failed to assign printable', error);
      toast({
        title: 'Unable to assign printable',
        description: 'Please retry delivering the printable.',
        variant: 'destructive',
      });
    }
  };

  const handleAssignToClass = async (printableId: string) => {
    if (!students.length) {
      toast({
        title: 'No students enrolled',
        description: 'Add students to this class before assigning printables.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const rows = students.map((student) => ({ printable_id: printableId, student_id: student.id }));
      await supabase
        .from('lesson_printables_students')
        .upsert(rows, { onConflict: 'printable_id,student_id' });
      await refreshPrintables();
      await updateLessonStatus('In Progress', 'Printable shared with entire class.');
      toast({
        title: 'Printable shared with class',
        description: 'All learners now have access to the printable.',
      });
    } catch (error) {
      console.error('Failed to assign printable to class', error);
      toast({
        title: 'Unable to share with class',
        description: 'Please retry sending the printable to the class.',
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
          <h1 className="text-3xl font-bold">Manage lesson printables</h1>
          <p className="text-sm text-muted-foreground">
            Upload and distribute printable resources to your class in a single workspace.
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
                  <span className="font-medium text-foreground">Total printables:</span>{' '}
                  {printables.length}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Create printable</CardTitle>
                <CardDescription>Share PDFs, worksheets, or slides with your class instantly.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newPrintable.title}
                    onChange={(event) =>
                      setNewPrintable((current) => ({ ...current, title: event.target.value }))
                    }
                    placeholder="E.g. Fraction practice worksheet"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fileUrl">Link to file</Label>
                  <Input
                    id="fileUrl"
                    value={newPrintable.fileUrl}
                    onChange={(event) =>
                      setNewPrintable((current) => ({ ...current, fileUrl: event.target.value }))
                    }
                    placeholder="https://"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Notes</Label>
                  <Textarea
                    id="description"
                    value={newPrintable.description}
                    onChange={(event) =>
                      setNewPrintable((current) => ({ ...current, description: event.target.value }))
                    }
                    placeholder="Explain how to use the printable or add reminders."
                  />
                </div>
                <Button onClick={handleCreatePrintable} disabled={saving} className="gap-2">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  <span>Save printable</span>
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Printable distribution</CardTitle>
              <CardDescription>Share resources individually or with the whole class.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[640px] pr-4">
                <div className="space-y-4">
                  {printables.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No printables yet. Add a printable to share it with students.
                    </p>
                  ) : (
                    printables.map((printable) => {
                      const recipients = printable.lesson_printables_students ?? [];
                      const assignedStudents = recipients
                        .map((recipient) => recipient.students?.full_name)
                        .filter((name): name is string => Boolean(name));

                      return (
                        <div key={printable.id} className="rounded-lg border p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-semibold">{printable.title}</h3>
                              <p className="text-xs text-muted-foreground">
                                Created {format(new Date(printable.created_at), 'PPpp')}
                              </p>
                              {printable.file_url ? (
                                <Button variant="link" asChild className="px-0 text-sm">
                                  <a href={printable.file_url} target="_blank" rel="noreferrer">
                                    Open resource
                                  </a>
                                </Button>
                              ) : null}
                            </div>
                            <Badge variant="outline">{assignedCount.get(printable.id) ?? 0} assigned</Badge>
                          </div>

                          <div className="mt-4 space-y-2">
                            <Label className="text-xs uppercase text-muted-foreground">Assign to learner</Label>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                              <Select
                                value={selectedRecipients[printable.id] ?? ''}
                                onValueChange={(value) =>
                                  setSelectedRecipients((current) => ({
                                    ...current,
                                    [printable.id]: value,
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
                                  handleAssignPrintable(
                                    printable.id,
                                    selectedRecipients[printable.id] ?? null
                                  )
                                }
                              >
                                <Send className="h-4 w-4" />
                                Send to learner
                              </Button>
                            </div>
                          </div>

                          <div className="mt-4 space-y-2">
                            <Label className="text-xs uppercase text-muted-foreground">
                              Share with entire class
                            </Label>
                            <Button
                              variant="outline"
                              className="gap-2"
                              onClick={() => handleAssignToClass(printable.id)}
                            >
                              <Send className="h-4 w-4" />
                              Share with class
                            </Button>
                          </div>

                          <div className="mt-4">
                            <Label className="text-xs uppercase text-muted-foreground">
                              Recipients
                            </Label>
                            {assignedStudents.length ? (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {assignedStudents.map((name) => (
                                  <Badge key={`${printable.id}-${name}`} variant="secondary">
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

export default LessonPrintablesManager;
