import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Loader2, Play, StopCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  lesson_date: string | null;
  description: string | null;
}

interface ClassSessionRecord {
  id: string;
  status: string | null;
  session_date: string | null;
  start_time: string | null;
  end_time: string | null;
}

interface EnrollmentStudent {
  id: string;
  full_name: string;
}

interface BehaviorEventRecord {
  id: string;
  event_type: 'points' | 'badge' | 'comment';
  points: number | null;
  badge: string | null;
  comment: string | null;
  recorded_at: string;
  student_id: string | null;
}

const formatDateTime = (value: string | null) => {
  if (!value) {
    return '—';
  }

  try {
    return format(new Date(value), 'PPpp');
  } catch (error) {
    return value;
  }
};

const LessonStartFlow = () => {
  const navigate = useNavigate();
  const { lessonId } = useParams<{ lessonId: string }>();
  const { user, isTeacher } = useAuth();
  const { toast } = useToast();

  const [lesson, setLesson] = useState<LessonRecord | null>(null);
  const [session, setSession] = useState<ClassSessionRecord | null>(null);
  const [students, setStudents] = useState<EnrollmentStudent[]>([]);
  const [events, setEvents] = useState<BehaviorEventRecord[]>([]);
  const [loadingLesson, setLoadingLesson] = useState(true);
  const [saving, setSaving] = useState(false);
  const [eventForm, setEventForm] = useState({
    studentId: 'all',
    eventType: 'points' as 'points' | 'badge' | 'comment',
    points: 1,
    badge: '',
    comment: '',
  });

  useEffect(() => {
    if (!lessonId || !user?.id || !isTeacher) {
      return;
    }

    const loadLesson = async () => {
      setLoadingLesson(true);
      try {
        const { data: lessonData, error: lessonError } = await supabase
          .from('lessons')
          .select(
            'id, lesson_title, subject, status, class_id, stage, lesson_date, description'
          )
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
        } else {
          setStudents([]);
        }

        const { data: sessionData, error: sessionError } = await supabase
          .from('class_sessions')
          .select('id, status, session_date, start_time, end_time')
          .eq('lesson_id', lessonId)
          .order('session_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (sessionError) {
          throw sessionError;
        }

        if (sessionData) {
          setSession(sessionData as ClassSessionRecord);
          await loadEvents(sessionData.id);
        } else {
          setSession(null);
          setEvents([]);
        }
      } catch (error) {
        console.error('Failed to load lesson start data', error);
        toast({
          title: 'Unable to load lesson',
          description: 'We could not fetch the lesson workspace. Please retry.',
          variant: 'destructive',
        });
      } finally {
        setLoadingLesson(false);
      }
    };

    const loadEvents = async (sessionId: string) => {
      const { data: eventData, error: eventError } = await supabase
        .from('session_behavior_events')
        .select('id, event_type, points, badge, comment, recorded_at, student_id')
        .eq('session_id', sessionId)
        .order('recorded_at', { ascending: false });

      if (eventError) {
        console.error('Failed to load behavior events', eventError);
        return;
      }

      setEvents(eventData as BehaviorEventRecord[]);
    };

    loadLesson();
  }, [lessonId, user?.id, isTeacher, toast]);

  const sessionStatusBadge = useMemo(() => {
    if (!session) {
      return <Badge variant="outline">No session</Badge>;
    }

    const normalizedStatus = session.status ?? 'In Progress';
    return <Badge>{normalizedStatus}</Badge>;
  }, [session]);

  const handleCreateSession = async () => {
    if (!lesson || !user?.id) {
      return;
    }

    setSaving(true);
    try {
      const now = new Date();
      const iso = now.toISOString();
      const { data, error } = await supabase
        .from('class_sessions')
        .insert({
          lesson_id: lesson.id,
          class_id: lesson.class_id,
          teacher_id: user.id,
          session_date: iso,
          start_time: iso,
          end_time: iso,
          status: 'In Progress',
        })
        .select('id, status, session_date, start_time, end_time')
        .single();

      if (error) {
        throw error;
      }

      setSession(data as ClassSessionRecord);
      setLesson((current) =>
        current
          ? {
              ...current,
              status: 'In Progress',
            }
          : current
      );
      await refreshEvents(data.id);
      await supabase
        .from('lessons')
        .update({ status: 'In Progress' })
        .eq('id', lesson.id);
      await supabase.from('lesson_status_history').insert({
        lesson_id: lesson.id,
        previous_status: lesson.status,
        new_status: 'In Progress',
        changed_by: user.id,
        change_notes: 'Lesson session started from start flow workspace.',
      });

      toast({
        title: 'Lesson started',
        description: 'Session created and lesson marked as in progress.',
      });
    } catch (error) {
      console.error('Failed to start session', error);
      toast({
        title: 'Unable to start session',
        description: 'Please retry starting the lesson.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteLesson = async () => {
    if (!lesson || !session || !user?.id) {
      return;
    }

    setSaving(true);
    try {
      const nowIso = new Date().toISOString();
      await supabase
        .from('class_sessions')
        .update({
          status: 'Completed',
          end_time: nowIso,
        })
        .eq('id', session.id);

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

      setSession((current) =>
        current
          ? {
              ...current,
              status: 'Completed',
              end_time: nowIso,
            }
          : current
      );

      await supabase.from('lesson_status_history').insert({
        lesson_id: lesson.id,
        previous_status: lesson.status,
        new_status: 'Done',
        changed_by: user.id,
        change_notes: 'Marked as completed from the start lesson workspace.',
      });

      toast({
        title: 'Lesson completed',
        description: 'Lesson status updated to done.',
      });

      navigate('/teacher/dashboard?tab=curriculum');
    } catch (error) {
      console.error('Failed to complete lesson', error);
      toast({
        title: 'Unable to complete lesson',
        description: 'We could not mark the lesson as done. Please retry.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const refreshEvents = async (sessionId: string) => {
    const { data, error } = await supabase
      .from('session_behavior_events')
      .select('id, event_type, points, badge, comment, recorded_at, student_id')
      .eq('session_id', sessionId)
      .order('recorded_at', { ascending: false });

    if (error) {
      console.error('Failed to refresh behavior events', error);
      return;
    }

    setEvents(data as BehaviorEventRecord[]);
  };

  const handleLogEvent = async () => {
    if (!session || !user?.id) {
      toast({
        title: 'Session required',
        description: 'Create a session before logging behavior events.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        session_id: session.id,
        teacher_id: user.id,
        event_type: eventForm.eventType,
      };

      if (eventForm.studentId !== 'all') {
        payload.student_id = eventForm.studentId;
      }

      if (eventForm.eventType === 'points') {
        payload.points = Number(eventForm.points) || 0;
      }

      if (eventForm.eventType === 'badge') {
        payload.badge = eventForm.badge.trim();
      }

      if (eventForm.eventType === 'comment') {
        payload.comment = eventForm.comment.trim();
      }

      await supabase.from('session_behavior_events').insert(payload);
      await refreshEvents(session.id);
      toast({
        title: 'Event logged',
        description: 'The classroom event has been recorded.',
      });

      setEventForm({
        studentId: 'all',
        eventType: eventForm.eventType,
        points: 1,
        badge: '',
        comment: '',
      });
    } catch (error) {
      console.error('Failed to log behavior event', error);
      toast({
        title: 'Unable to record event',
        description: 'Please retry saving the classroom event.',
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
          <h1 className="text-3xl font-bold">Start lesson flow</h1>
          <p className="text-sm text-muted-foreground">
            Launch the live lesson experience, capture behavior highlights, and mark completion.
          </p>
        </div>
      </div>

      {loadingLesson ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : lesson ? (
        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{lesson.lesson_title}</CardTitle>
                <CardDescription>
                  {lesson.subject ?? 'General'} • {lesson.stage ?? 'Stage TBD'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  <span className="font-medium text-foreground">Lesson date:</span>{' '}
                  {formatDateTime(lesson.lesson_date)}
                </p>
                <p>
                  <span className="font-medium text-foreground">Current status:</span>{' '}
                  {lesson.status ?? 'Scheduled'}
                </p>
                {lesson.description ? <p>{lesson.description}</p> : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle>Live session controls</CardTitle>
                  <CardDescription>
                    Manage the classroom session timeline and update status as you go.
                  </CardDescription>
                </div>
                {sessionStatusBadge}
              </CardHeader>
              <CardContent className="space-y-4">
                {!session ? (
                  <Button onClick={handleCreateSession} disabled={saving} className="gap-2">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                    Start session
                  </Button>
                ) : (
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>
                      <span className="font-medium text-foreground">Started:</span>{' '}
                      {formatDateTime(session.start_time)}
                    </p>
                    <p>
                      <span className="font-medium text-foreground">Last updated:</span>{' '}
                      {formatDateTime(session.end_time)}
                    </p>
                    <Button
                      variant="secondary"
                      onClick={handleCompleteLesson}
                      disabled={saving}
                      className="gap-2"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <StopCircle className="h-4 w-4" />
                      )}
                      Mark lesson complete
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Log classroom event</CardTitle>
                <CardDescription>
                  Capture quick notes, points, or badges for learners during the session.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="student">Student</Label>
                    <Select
                      value={eventForm.studentId}
                      onValueChange={(value) =>
                        setEventForm((current) => ({ ...current, studentId: value }))
                      }
                    >
                      <SelectTrigger id="student">
                        <SelectValue placeholder="All students" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Whole class</SelectItem>
                        {students.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event-type">Event type</Label>
                    <Select
                      value={eventForm.eventType}
                      onValueChange={(value: 'points' | 'badge' | 'comment') =>
                        setEventForm((current) => ({ ...current, eventType: value }))
                      }
                    >
                      <SelectTrigger id="event-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="points">Points awarded</SelectItem>
                        <SelectItem value="badge">Badge unlocked</SelectItem>
                        <SelectItem value="comment">Teacher comment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {eventForm.eventType === 'points' ? (
                  <div className="space-y-2">
                    <Label htmlFor="points">Points</Label>
                    <Input
                      id="points"
                      type="number"
                      value={eventForm.points}
                      onChange={(event) =>
                        setEventForm((current) => ({
                          ...current,
                          points: Number(event.target.value),
                        }))
                      }
                    />
                  </div>
                ) : null}

                {eventForm.eventType === 'badge' ? (
                  <div className="space-y-2">
                    <Label htmlFor="badge">Badge name</Label>
                    <Input
                      id="badge"
                      value={eventForm.badge}
                      onChange={(event) =>
                        setEventForm((current) => ({
                          ...current,
                          badge: event.target.value,
                        }))
                      }
                    />
                  </div>
                ) : null}

                {eventForm.eventType === 'comment' ? (
                  <div className="space-y-2">
                    <Label htmlFor="comment">Comment</Label>
                    <Textarea
                      id="comment"
                      value={eventForm.comment}
                      onChange={(event) =>
                        setEventForm((current) => ({
                          ...current,
                          comment: event.target.value,
                        }))
                      }
                    />
                  </div>
                ) : null}

                <Button onClick={handleLogEvent} disabled={saving} className="gap-2">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Log event
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="max-h-[600px]">
            <CardHeader>
              <CardTitle>Recent behavior events</CardTitle>
              <CardDescription>Automatically synced to the lesson timeline.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[480px] pr-4">
                <div className="space-y-3">
                  {events.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No classroom events logged yet.
                    </p>
                  ) : (
                    events.map((event) => {
                      const studentName =
                        event.student_id && students.find((student) => student.id === event.student_id)?.full_name;

                      return (
                        <div key={event.id} className="rounded-lg border p-3 text-sm">
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary" className="uppercase">
                              {event.event_type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDateTime(event.recorded_at)}
                            </span>
                          </div>
                          {studentName ? (
                            <p className="mt-2 text-muted-foreground">
                              <span className="font-medium text-foreground">Learner:</span> {studentName}
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
          </Card>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Lesson not found</CardTitle>
            <CardDescription>
              We could not locate the requested lesson. Return to the curriculum tab to try again.
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

export default LessonStartFlow;
