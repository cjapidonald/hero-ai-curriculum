import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Award, Loader2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

interface ClassSessionRecord {
  id: string;
  session_date: string | null;
  status: string | null;
}

interface BehaviorEventRecord {
  id: string;
  student_id: string | null;
  event_type: 'points' | 'badge' | 'comment';
  points: number | null;
  badge: string | null;
  comment: string | null;
  recorded_at: string;
}

const LessonEvaluateFlow = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { user, isTeacher } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [lesson, setLesson] = useState<LessonRecord | null>(null);
  const [session, setSession] = useState<ClassSessionRecord | null>(null);
  const [students, setStudents] = useState<EnrollmentStudent[]>([]);
  const [events, setEvents] = useState<BehaviorEventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [evaluationForm, setEvaluationForm] = useState({
    studentId: '',
    summary: '',
    badge: '',
  });

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

        const { data: sessionData, error: sessionError } = await supabase
          .from('class_sessions')
          .select('id, session_date, status')
          .eq('lesson_id', lessonId)
          .order('session_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (sessionError) {
          throw sessionError;
        }

        if (sessionData) {
          setSession(sessionData as ClassSessionRecord);
          const { data: eventData, error: eventError } = await supabase
            .from('session_behavior_events')
            .select('id, student_id, event_type, points, badge, comment, recorded_at')
            .eq('session_id', sessionData.id)
            .order('recorded_at', { ascending: false });

          if (eventError) {
            throw eventError;
          }

          setEvents(eventData as BehaviorEventRecord[]);
        } else {
          setSession(null);
          setEvents([]);
        }
      } catch (error) {
        console.error('Failed to load evaluation workspace', error);
        toast({
          title: 'Unable to load evaluation',
          description: 'We could not fetch the latest session data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [lessonId, user?.id, isTeacher, toast]);

  const pointsByStudent = useMemo(() => {
    const totals = new Map<string, number>();
    events.forEach((event) => {
      if (event.event_type === 'points' && event.student_id) {
        const current = totals.get(event.student_id) ?? 0;
        totals.set(event.student_id, current + (event.points ?? 0));
      }
    });
    return totals;
  }, [events]);

  const commentsByStudent = useMemo(() => {
    const summary = new Map<string, string[]>();
    events.forEach((event) => {
      if (event.event_type === 'comment' && event.student_id && event.comment) {
        const entries = summary.get(event.student_id) ?? [];
        entries.push(`${format(new Date(event.recorded_at), 'p')}: ${event.comment}`);
        summary.set(event.student_id, entries);
      }
    });
    return summary;
  }, [events]);

  const badgesByStudent = useMemo(() => {
    const summary = new Map<string, string[]>();
    events.forEach((event) => {
      if (event.event_type === 'badge' && event.student_id && event.badge) {
        const entries = summary.get(event.student_id) ?? [];
        entries.push(event.badge);
        summary.set(event.student_id, entries);
      }
    });
    return summary;
  }, [events]);

  const handleRecordSummary = async () => {
    if (!evaluationForm.studentId || !session || !user?.id) {
      toast({
        title: 'Select a student',
        description: 'Choose a student to record feedback for.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        session_id: session.id,
        teacher_id: user.id,
      };

      if (evaluationForm.summary.trim()) {
        await supabase.from('session_behavior_events').insert({
          ...payload,
          student_id: evaluationForm.studentId,
          event_type: 'comment',
          comment: evaluationForm.summary.trim(),
        });
      }

      if (evaluationForm.badge.trim()) {
        await supabase.from('session_behavior_events').insert({
          ...payload,
          student_id: evaluationForm.studentId,
          event_type: 'badge',
          badge: evaluationForm.badge.trim(),
        });
      }

      const { data: eventData, error: refreshError } = await supabase
        .from('session_behavior_events')
        .select('id, student_id, event_type, points, badge, comment, recorded_at')
        .eq('session_id', session.id)
        .order('recorded_at', { ascending: false });

      if (refreshError) {
        throw refreshError;
      }

      setEvents((eventData ?? []) as BehaviorEventRecord[]);
      toast({ title: 'Feedback saved', description: 'Evaluation details recorded.' });
      setEvaluationForm({ studentId: '', summary: '', badge: '' });
    } catch (error) {
      console.error('Failed to record evaluation summary', error);
      toast({
        title: 'Unable to save feedback',
        description: 'Please retry submitting the evaluation.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFinalizeLesson = async () => {
    if (!lesson || !user?.id) {
      return;
    }

    setSaving(true);
    try {
      await supabase
        .from('lessons')
        .update({ status: 'Done' })
        .eq('id', lesson.id);

      setLesson((current) =>
        current
          ? {
              ...current,
              status: 'Done',
            }
          : current
      );

      await supabase.from('lesson_status_history').insert({
        lesson_id: lesson.id,
        previous_status: lesson.status,
        new_status: 'Done',
        changed_by: user.id,
        change_notes: 'Evaluation summary finalized in evaluation workspace.',
      });

      toast({
        title: 'Evaluation finalized',
        description: 'Lesson updated to Done and logged in status history.',
      });
      navigate('/teacher/dashboard?tab=curriculum');
    } catch (error) {
      console.error('Failed to finalize evaluation', error);
      toast({
        title: 'Unable to finalize evaluation',
        description: 'Please try again after a moment.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
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
          <h1 className="text-3xl font-bold">Evaluate learner skills</h1>
          <p className="text-sm text-muted-foreground">
            Review engagement metrics, record qualitative feedback, and close out the lesson.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : lesson ? (
        <div className="grid gap-6 lg:grid-cols-[3fr,2fr]">
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
                {session ? (
                  <p>
                    <span className="font-medium text-foreground">Latest session:</span>{' '}
                    {session.session_date
                      ? format(new Date(session.session_date), 'PPpp')
                      : 'Not recorded'}
                  </p>
                ) : (
                  <p>No active class session has been recorded.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Learner performance summary</CardTitle>
                <CardDescription>Automatic totals from points, badges, and comments.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Learner</TableHead>
                        <TableHead className="w-32">Points</TableHead>
                        <TableHead>Badges</TableHead>
                        <TableHead>Feedback notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                            No students enrolled in this class yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        students.map((student) => {
                          const points = pointsByStudent.get(student.id) ?? 0;
                          const badgeList = badgesByStudent.get(student.id) ?? [];
                          const commentList = commentsByStudent.get(student.id) ?? [];

                          return (
                            <TableRow key={student.id}>
                              <TableCell className="font-medium">{student.full_name}</TableCell>
                              <TableCell>{points}</TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {badgeList.length ? (
                                    badgeList.map((badge) => (
                                      <Badge key={`${student.id}-${badge}`} variant="outline">
                                        {badge}
                                      </Badge>
                                    ))
                                  ) : (
                                    <span className="text-xs text-muted-foreground">None</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <ScrollArea className="h-20 pr-2">
                                  <div className="space-y-1">
                                    {commentList.length ? (
                                      commentList.map((comment, index) => (
                                        <p key={`${student.id}-comment-${index}`} className="text-xs text-muted-foreground">
                                          {comment}
                                        </p>
                                      ))
                                    ) : (
                                      <span className="text-xs text-muted-foreground">No comments yet.</span>
                                    )}
                                  </div>
                                </ScrollArea>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Record final feedback</CardTitle>
                <CardDescription>Share final evaluation remarks or badges for individual learners.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="learner">Learner</Label>
                  <Select
                    value={evaluationForm.studentId}
                    onValueChange={(value) =>
                      setEvaluationForm((current) => ({ ...current, studentId: value }))
                    }
                  >
                    <SelectTrigger id="learner">
                      <SelectValue placeholder="Select a learner" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="summary">Feedback summary</Label>
                  <Textarea
                    id="summary"
                    value={evaluationForm.summary}
                    onChange={(event) =>
                      setEvaluationForm((current) => ({ ...current, summary: event.target.value }))
                    }
                    placeholder="Capture strengths, growth areas, or next steps."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="badge">Badge (optional)</Label>
                  <div className="flex items-center gap-2">
                    <Textarea
                      id="badge"
                      className="min-h-[44px]"
                      value={evaluationForm.badge}
                      onChange={(event) =>
                        setEvaluationForm((current) => ({ ...current, badge: event.target.value }))
                      }
                      placeholder="E.g. Collaboration Star, Reading Champion"
                    />
                    <Award className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>

                <Button onClick={handleRecordSummary} disabled={saving} className="gap-2">
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MessageSquare className="h-4 w-4" />
                  )}
                  <span>Save feedback</span>
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Timeline of evaluation events</CardTitle>
              <CardDescription>Includes comments, badges, and points from the live session.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[640px] pr-4">
                <div className="space-y-3">
                  {events.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No evaluation events captured for this session yet.
                    </p>
                  ) : (
                    events.map((event) => {
                      const learnerName =
                        event.student_id && students.find((student) => student.id === event.student_id)?.full_name;

                      return (
                        <div key={event.id} className="rounded-lg border p-3 text-sm">
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary" className="uppercase">
                              {event.event_type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(event.recorded_at), 'PPpp')}
                            </span>
                          </div>
                          {learnerName ? (
                            <p className="mt-2 text-muted-foreground">
                              <span className="font-medium text-foreground">Learner:</span> {learnerName}
                            </p>
                          ) : null}
                          {event.event_type === 'points' ? (
                            <p className="mt-2 text-muted-foreground">
                              <span className="font-medium text-foreground">Points:</span>{' '}
                              {event.points ?? 0}
                            </p>
                          ) : null}
                          {event.event_type === 'badge' ? (
                            <p className="mt-2 text-muted-foreground">
                              <span className="font-medium text-foreground">Badge:</span>{' '}
                              {event.badge ?? '—'}
                            </p>
                          ) : null}
                          {event.event_type === 'comment' ? (
                            <p className="mt-2 whitespace-pre-line text-muted-foreground">{event.comment}</p>
                          ) : null}
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </CardContent>
            <div className="border-t bg-muted/40 p-4">
              <Button onClick={handleFinalizeLesson} disabled={saving} className="w-full">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Finalize evaluation'}
              </Button>
            </div>
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

export default LessonEvaluateFlow;
