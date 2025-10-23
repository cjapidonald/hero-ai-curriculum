import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  CheckCircle2,
  UserCheck,
  Clock,
  Save,
  Sparkles,
  TimerReset,
  Shuffle,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format, isSameDay, parseISO } from 'date-fns';
import StudentDashboardModal from './StudentDashboardModal';
import { useAuth } from '@/contexts/auth-context';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface Student {
  id: string;
  full_name: string;
  enrollment_id: string;
  present: boolean;
}

type BehaviorEventType = 'points' | 'badge' | 'comment';

interface StudentBehaviorSummary {
  points: number;
  badges: string[];
  comments: { comment: string; recorded_at: string }[];
}

interface LessonResource {
  id: string;
  title: string;
  type: string;
  duration: number | null;
  notes: string | null;
  position: number;
}

interface LessonPlanData {
  resources: LessonResource[];
  total_duration: number;
}

interface ClassSession {
  id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  curriculum_id: string | null;
  lesson_id?: string | null;
  lesson_plan_data: LessonPlanData | null;
  lesson_plan_content?: {
    resources?: unknown[];
  } | null;
  class_id: string;
  class_name?: string;
  lesson_title?: string;
  lesson_subject?: string;
  lesson_status?: string | null;
  class_stage?: string;
}

interface MyClassViewProps {
  sessionId: string;
  onBack: () => void;
}

const behaviorBadges = [
  'Great Participation',
  'Team Player',
  'Needs Support',
  'Star of the Day',
];

const mapStoredResources = (resources: unknown[] = []): LessonResource[] => {
  return resources
    .map((resource, index) => {
      if (!resource || typeof resource !== 'object') {
        return null;
      }

      const typedResource = resource as Record<string, unknown>;
      const nestedResource = typedResource.resource as Record<string, unknown> | undefined;

      const id =
        (typedResource.id as string | undefined) ||
        (typedResource.resource_id as string | undefined) ||
        (nestedResource?.id as string | undefined);

      if (!id) {
        return null;
      }

      return {
        id,
        title:
          (typedResource.title as string | undefined) ||
          (nestedResource?.title as string | undefined) ||
          'Untitled Resource',
        type:
          (typedResource.type as string | undefined) ||
          (nestedResource?.resource_type as string | undefined) ||
          'resource',
        duration:
          (typedResource.duration as number | null | undefined) ??
          (nestedResource?.duration_minutes as number | null | undefined) ??
          null,
        notes: (typedResource.notes as string | null | undefined) ?? null,
        position: (typedResource.position as number | undefined) ?? index,
      };
    })
    .filter((resource): resource is LessonResource => resource !== null)
    .sort((a, b) => a.position - b.position)
    .map((resource, index) => ({ ...resource, position: index }));
};

const getLessonResources = (session: ClassSession | null): LessonResource[] => {
  if (!session) {
    return [];
  }

  const storedResources =
    session.lesson_plan_data?.resources || session.lesson_plan_content?.resources || [];

  return mapStoredResources(storedResources);
};

const MyClassView = ({ sessionId, onBack }: MyClassViewProps) => {
  const { user } = useAuth();
  const [session, setSession] = useState<ClassSession | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [attendanceSaved, setAttendanceSaved] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [studentBehavior, setStudentBehavior] = useState<Record<string, StudentBehaviorSummary>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [bulkSelection, setBulkSelection] = useState<Set<string>>(new Set());
  const [highlightedStudentId, setHighlightedStudentId] = useState<string | null>(null);
  const [randomStudentId, setRandomStudentId] = useState<string | null>(null);
  const [timerMinutes, setTimerMinutes] = useState<number>(5);
  const [timerRemaining, setTimerRemaining] = useState<number>(5 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerType, setTimerType] = useState('focus');
  const [timerStartTime, setTimerStartTime] = useState<Date | null>(null);
  const [seatMap, setSeatMap] = useState<{ studentId: string; name: string }[][]>([]);
  const [seatingLayout, setSeatingLayout] = useState<'rows' | 'pairs' | 'pods' | 'circle'>('rows');

  const { toast } = useToast();

  useEffect(() => {
    void loadData();
  }, [sessionId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from('class_sessions')
        .select(`
          *,
          classes:class_id (
            class_name,
            stage
          ),
          lesson:lesson_id (
            lesson_title,
            subject,
            status
          )
        `)
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      const formattedSession: ClassSession = {
        ...sessionData,
        class_name: sessionData.classes?.class_name,
        class_stage: sessionData.classes?.stage,
        lesson_title: sessionData.lesson?.lesson_title,
        lesson_subject: sessionData.lesson?.subject,
        lesson_status: sessionData.lesson?.status,
        lesson_id: sessionData.lesson_id ?? sessionData.curriculum_id,
        curriculum_id: sessionData.curriculum_id,
      };

      setSession(formattedSession);

      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select(`
          id,
          student_id,
          students:student_id (
            id,
            full_name
          )
        `)
        .eq('class_id', formattedSession.class_id)
        .eq('is_active', true);

      if (enrollmentsError) throw enrollmentsError;

      const { data: existingAttendance, error: attendanceError } = await supabase
        .from('attendance')
        .select('enrollment_id, present')
        .eq('class_session_id', sessionId);

      if (attendanceError) throw attendanceError;

      const attendanceMap = new Map(
        (existingAttendance || []).map((a) => [a.enrollment_id, a.present])
      );

      const studentsList: Student[] = (enrollmentsData || []).map((enrollment: any) => ({
        id: enrollment.students.id,
        full_name: enrollment.students.full_name,
        enrollment_id: enrollment.id,
        present: attendanceMap.get(enrollment.id) ?? false,
      }));

      setStudents(studentsList);
      setAttendanceSaved(Boolean(existingAttendance && existingAttendance.length > 0));
      setBulkSelection(new Set());
      setSeatMap([]);

      const { data: behaviorEvents, error: behaviorError } = await supabase
        .from('session_behavior_events')
        .select('*')
        .eq('session_id', sessionId)
        .order('recorded_at', { ascending: false });

      if (behaviorError) throw behaviorError;

      const behaviorMap: Record<string, StudentBehaviorSummary> = {};

      (behaviorEvents || []).forEach((event) => {
        if (!event.student_id) {
          return;
        }

        const summary =
          behaviorMap[event.student_id] || ({
            points: 0,
            badges: [],
            comments: [],
          } as StudentBehaviorSummary);

        if (event.event_type === 'points') {
          summary.points += event.points ?? 0;
        }

        if (event.event_type === 'badge' && event.badge) {
          if (!summary.badges.includes(event.badge)) {
            summary.badges.push(event.badge);
          }
        }

        if (event.event_type === 'comment' && event.comment) {
          summary.comments.push({ comment: event.comment, recorded_at: event.recorded_at });
        }

        behaviorMap[event.student_id] = summary;
      });

      setStudentBehavior(behaviorMap);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load class data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceChange = (studentId: string, present: boolean) => {
    setStudents((current) =>
      current.map((student) =>
        student.id === studentId ? { ...student, present } : student
      )
    );
    setAttendanceSaved(false);
  };

  const handleMarkAllPresent = () => {
    setStudents((current) => current.map((student) => ({ ...student, present: true })));
    setAttendanceSaved(false);
  };

  const handleMarkAllAbsent = () => {
    setStudents((current) => current.map((student) => ({ ...student, present: false })));
    setAttendanceSaved(false);
  };

  const handleViewStudent = (student: Student) => {
    setSelectedStudent({ id: student.id, name: student.full_name });
    setIsStudentModalOpen(true);
  };

  const handleBulkSelectionChange = (studentId: string, checked: boolean) => {
    setBulkSelection((current) => {
      const updated = new Set(current);
      if (checked) {
        updated.add(studentId);
      } else {
        updated.delete(studentId);
      }
      return updated;
    });
  };

  const handleBulkAttendanceUpdate = (present: boolean) => {
    if (bulkSelection.size === 0) {
      toast({
        title: 'Select students first',
        description: 'Choose students using the bulk selection checkboxes.',
        variant: 'destructive',
      });
      return;
    }

    setStudents((current) =>
      current.map((student) =>
        bulkSelection.has(student.id) ? { ...student, present } : student
      )
    );
    setAttendanceSaved(false);
  };

  const clearBulkSelection = () => {
    setBulkSelection(new Set());
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    try {
      await supabase
        .from('attendance')
        .delete()
        .eq('class_session_id', sessionId);

      const attendanceRecords = students.map((student) => ({
        enrollment_id: student.enrollment_id,
        class_session_id: sessionId,
        class_date: session?.session_date,
        present: student.present,
        late: false,
      }));

      const { error } = await supabase.from('attendance').insert(attendanceRecords);

      if (error) throw error;

      const presentCount = students.filter((student) => student.present).length;

      const { error: sessionUpdateError } = await supabase
        .from('class_sessions')
        .update({
          attendance_taken: true,
          attendance_count: presentCount,
          total_students: students.length,
        })
        .eq('id', sessionId);

      if (sessionUpdateError) throw sessionUpdateError;

      setAttendanceSaved(true);
      toast({
        title: 'Attendance Saved',
        description: 'Attendance has been recorded successfully',
      });
    } catch (error: any) {
      console.error('Error saving attendance:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save attendance',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateLessonStatus = async (status: string) => {
    if (!session?.lesson_id) {
      return;
    }

    try {
      const { error } = await supabase
        .from('lessons')
        .update({ status })
        .eq('id', session.lesson_id);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error updating lesson status from lesson dashboard:', error);
    }
  };

  const recordLessonHistory = async (newStatus: string) => {
    if (!session?.lesson_id) {
      return;
    }

    try {
      const { error } = await supabase.from('lesson_status_history').insert({
        lesson_id: session.lesson_id,
        previous_status: session.lesson_status,
        new_status: newStatus,
        changed_by: user?.id ?? null,
        change_notes: 'Lesson concluded via live class tools',
      });

      if (error) {
        console.error('Failed to record lesson status history:', error);
      }
    } catch (historyError) {
      console.error('Unexpected error recording lesson history:', historyError);
    }
  };

  const handleConcludeLesson = async () => {
    if (!session) {
      return;
    }

    const sessionDate = parseISO(session.session_date);
    if (!isSameDay(new Date(), sessionDate)) {
      toast({
        title: 'Not available',
        description: 'Lessons can only be concluded on the day they are scheduled.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('class_sessions')
        .update({ status: 'completed' })
        .eq('id', sessionId);

      if (error) throw error;

      await updateLessonStatus('completed');
      await recordLessonHistory('completed');

      toast({
        title: 'Lesson concluded',
        description: 'Session completion recorded. Payroll hooks will process automatically.',
      });

      onBack();
    } catch (error: any) {
      console.error('Error ending class:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to end class',
        variant: 'destructive',
      });
    }
  };

  const adjustStudentPoints = async (student: Student, delta: number) => {
    try {
      const { error } = await supabase.from('session_behavior_events').insert({
        session_id: sessionId,
        student_id: student.id,
        teacher_id: user?.id ?? null,
        event_type: 'points' as BehaviorEventType,
        points: delta,
      });

      if (error) throw error;

      setStudentBehavior((current) => {
        const summary = current[student.id] ?? { points: 0, badges: [], comments: [] };
        return {
          ...current,
          [student.id]: {
            ...summary,
            points: summary.points + delta,
          },
        };
      });

      toast({
        title: delta > 0 ? 'Point added' : 'Point removed',
        description: `${student.full_name} now has updated points for this session.`,
      });
    } catch (error: any) {
      console.error('Error adjusting points:', error);
      toast({
        title: 'Unable to adjust points',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const assignBehaviorBadge = async (student: Student, badge: string) => {
    try {
      const { error } = await supabase.from('session_behavior_events').insert({
        session_id: sessionId,
        student_id: student.id,
        teacher_id: user?.id ?? null,
        event_type: 'badge' as BehaviorEventType,
        badge,
      });

      if (error) throw error;

      setStudentBehavior((current) => {
        const summary = current[student.id] ?? { points: 0, badges: [], comments: [] };
        const badges = summary.badges.includes(badge)
          ? summary.badges
          : [...summary.badges, badge];
        return {
          ...current,
          [student.id]: {
            ...summary,
            badges,
          },
        };
      });

      toast({
        title: 'Badge recorded',
        description: `${badge} noted for ${student.full_name}.`,
      });
    } catch (error: any) {
      console.error('Error assigning badge:', error);
      toast({
        title: 'Unable to assign badge',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const submitBehaviorComment = async (student: Student) => {
    const draft = commentDrafts[student.id]?.trim();
    if (!draft) {
      toast({
        title: 'Comment required',
        description: 'Write a quick note before submitting.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase.from('session_behavior_events').insert({
        session_id: sessionId,
        student_id: student.id,
        teacher_id: user?.id ?? null,
        event_type: 'comment' as BehaviorEventType,
        comment: draft,
      });

      if (error) throw error;

      setStudentBehavior((current) => {
        const summary = current[student.id] ?? { points: 0, badges: [], comments: [] };
        return {
          ...current,
          [student.id]: {
            ...summary,
            comments: [
              { comment: draft, recorded_at: new Date().toISOString() },
              ...summary.comments,
            ],
          },
        };
      });

      setCommentDrafts((current) => ({ ...current, [student.id]: '' }));

      toast({
        title: 'Comment added',
        description: `Saved note for ${student.full_name}.`,
      });
    } catch (error: any) {
      console.error('Error submitting comment:', error);
      toast({
        title: 'Unable to save comment',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const randomizeStudent = () => {
    if (students.length === 0) {
      return;
    }

    const available = students.filter((student) => student.present);
    const pool = available.length > 0 ? available : students;
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    setRandomStudentId(chosen.id);
    setHighlightedStudentId(chosen.id);
    toast({
      title: 'Random pick ready',
      description: `${chosen.full_name} has been selected.`,
    });
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const secs = Math.max(seconds % 60, 0)
      .toString()
      .padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const finalizeTimer = useCallback(
    async (completed: boolean) => {
      if (!timerStartTime) {
        setTimerRunning(false);
        setTimerRemaining(timerMinutes * 60);
        return;
      }

      const endTime = new Date();
      const durationSeconds = Math.max(
        1,
        Math.round((endTime.getTime() - timerStartTime.getTime()) / 1000)
      );

      try {
        const { error } = await supabase.from('session_timer_logs').insert({
          session_id: sessionId,
          teacher_id: user?.id ?? null,
          timer_type: timerType,
          duration_seconds: durationSeconds,
          started_at: timerStartTime.toISOString(),
          completed_at: endTime.toISOString(),
        });

        if (error) {
          throw error;
        }

        toast({
          title: completed ? 'Timer completed' : 'Timer stopped',
          description: `Logged ${durationSeconds} seconds for this session.`,
        });
      } catch (error: any) {
        console.error('Error logging timer:', error);
        toast({
          title: 'Unable to log timer',
          description: error.message || 'Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setTimerRunning(false);
        setTimerStartTime(null);
        setTimerRemaining(timerMinutes * 60);
      }
    },
    [sessionId, timerMinutes, timerStartTime, timerType, toast, user?.id]
  );

  useEffect(() => {
    if (!timerRunning) {
      return;
    }

    const interval = setInterval(() => {
      setTimerRemaining((current) => {
        if (current <= 1) {
          clearInterval(interval);
          void finalizeTimer(true);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerRunning, finalizeTimer]);

  useEffect(() => {
    if (!timerRunning) {
      setTimerRemaining(timerMinutes * 60);
    }
  }, [timerMinutes, timerRunning]);

  const handleStartTimer = () => {
    if (timerRunning) {
      return;
    }

    const durationSeconds = Math.max(5, timerMinutes * 60);
    setTimerRemaining(durationSeconds);
    setTimerStartTime(new Date());
    setTimerRunning(true);
    toast({
      title: 'Timer started',
      description: `Counting down ${formatTimer(durationSeconds)} for ${timerType}.`,
    });
  };

  const handleStopTimer = () => {
    if (!timerRunning) {
      return;
    }
    void finalizeTimer(false);
  };

  const generateSeatMap = () => {
    if (students.length === 0) {
      setSeatMap([]);
      return;
    }

    const sortedStudents = [...students].sort((a, b) =>
      a.full_name.localeCompare(b.full_name)
    );

    if (seatingLayout === 'circle') {
      setSeatMap([
        sortedStudents.map((student) => ({
          studentId: student.id,
          name: student.full_name,
        })),
      ]);
      return;
    }

    const chunkSize = seatingLayout === 'pairs' ? 2 : seatingLayout === 'pods' ? 4 : 4;
    const rows: { studentId: string; name: string }[][] = [];
    let currentRow: { studentId: string; name: string }[] = [];

    sortedStudents.forEach((student, index) => {
      currentRow.push({ studentId: student.id, name: student.full_name });
      const isRowComplete = currentRow.length === chunkSize;
      const isLastStudent = index === sortedStudents.length - 1;

      if (isRowComplete || isLastStudent) {
        rows.push(currentRow);
        currentRow = [];
      }
    });

    setSeatMap(rows);
  };

  const saveSeatingPlan = async () => {
    if (seatMap.length === 0) {
      toast({
        title: 'Generate a layout first',
        description: 'Create a seating plan before saving it.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const payload = {
        session_id: sessionId,
        teacher_id: user?.id ?? null,
        seat_map: {
          geometry: seatingLayout,
          rows: seatMap,
          generated_at: new Date().toISOString(),
        },
      };

      const { error } = await supabase.from('session_seating_logs').insert(payload);

      if (error) throw error;

      toast({
        title: 'Seating saved',
        description: 'The seating snapshot has been logged for this session.',
      });
    } catch (error: any) {
      console.error('Error saving seating plan:', error);
      toast({
        title: 'Unable to save seating',
        description: error.message || 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const seatMapColumns = useMemo(() => {
    if (seatingLayout === 'circle') {
      return Math.max(seatMap[0]?.length ?? students.length, 1);
    }
    if (seatingLayout === 'pairs') {
      return 2;
    }
    if (seatingLayout === 'pods') {
      return 4;
    }
    return 4;
  }, [seatMap, seatingLayout, students.length]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Loading class...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Session not found</div>
      </div>
    );
  }

  const lessonResources = getLessonResources(session);
  const presentCount = useMemo(
    () => students.filter((student) => student.present).length,
    [students]
  );
  const isSameDaySession = useMemo(
    () => isSameDay(new Date(), parseISO(session.session_date)),
    [session.session_date]
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mb-6">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Curriculum
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{session.class_name} - {session.lesson_title}</h1>
            <p className="text-muted-foreground mt-1">
              {format(parseISO(session.session_date), 'EEEE, MMMM d, yyyy')} | {session.start_time} - {session.end_time}
            </p>
          </div>
          <Button onClick={handleConcludeLesson} size="lg" disabled={!isSameDaySession}>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Conclude Lesson
          </Button>
        </div>
        {!isSameDaySession && (
          <p className="mt-2 text-sm text-muted-foreground">
            Lessons can only be concluded on the scheduled day to ensure payroll accuracy.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div className="xl:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Attendance &amp; Behaviour</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Use the bulk selection to mark groups quickly, then capture in-lesson interactions.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <UserCheck className="w-4 h-4" />
                  <span className="font-semibold">
                    {presentCount} / {students.length}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={handleMarkAllPresent}>
                    Mark All Present
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleMarkAllAbsent}>
                    Mark All Absent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAttendanceUpdate(true)}
                  >
                    Set Selected Present
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAttendanceUpdate(false)}
                  >
                    Set Selected Absent
                  </Button>
                  <Button variant="ghost" size="sm" onClick={clearBulkSelection}>
                    Clear Selection
                  </Button>
                  {bulkSelection.size > 0 && (
                    <Badge variant="secondary">{bulkSelection.size} selected</Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[560px] overflow-y-auto pr-2">
                  {students.map((student) => {
                    const summary = studentBehavior[student.id] ?? {
                      points: 0,
                      badges: [],
                      comments: [],
                    };
                    const lastComment = summary.comments[0];
                    return (
                      <div
                        key={student.id}
                        className={cn(
                          'border rounded-lg p-4 space-y-3 transition-colors bg-background',
                          highlightedStudentId === student.id && 'border-primary shadow-lg'
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={bulkSelection.has(student.id)}
                              onCheckedChange={(checked) =>
                                handleBulkSelectionChange(student.id, Boolean(checked))
                              }
                              aria-label={`Select ${student.full_name} for bulk action`}
                            />
                            <div>
                              <p className="font-semibold leading-tight">{student.full_name}</p>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <Badge variant="outline">{summary.points} pts</Badge>
                                {student.id === randomStudentId && (
                                  <Badge variant="default">Random Pick</Badge>
                                )}
                                {summary.badges.map((badge) => (
                                  <Badge key={badge} variant="secondary">
                                    {badge}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={student.present}
                              onCheckedChange={(checked) =>
                                handleAttendanceChange(student.id, Boolean(checked))
                              }
                              aria-label={`Toggle attendance for ${student.full_name}`}
                            />
                            <Badge variant={student.present ? 'default' : 'secondary'}>
                              {student.present ? 'Present' : 'Absent'}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => adjustStudentPoints(student, -1)}
                          >
                            −1
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => adjustStudentPoints(student, 1)}
                          >
                            +1
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleViewStudent(student)}>
                            View Dashboard
                          </Button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {behaviorBadges.map((badge) => {
                            const isActive = summary.badges.includes(badge);
                            return (
                              <Button
                                key={badge}
                                size="sm"
                                variant={isActive ? 'default' : 'secondary'}
                                onClick={() => assignBehaviorBadge(student, badge)}
                              >
                                <Sparkles className="w-3 h-3 mr-1" />
                                {badge}
                              </Button>
                            );
                          })}
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Input
                              value={commentDrafts[student.id] ?? ''}
                              onChange={(event) =>
                                setCommentDrafts((current) => ({
                                  ...current,
                                  [student.id]: event.target.value,
                                }))
                              }
                              placeholder="Leave a quick note"
                            />
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => submitBehaviorComment(student)}
                            >
                              Save
                            </Button>
                          </div>
                          {lastComment && (
                            <p className="text-xs text-muted-foreground">Latest: {lastComment.comment}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  <Button onClick={handleSaveAttendance} disabled={saving} className="w-full">
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : attendanceSaved ? 'Update Attendance' : 'Save Attendance'}
                  </Button>

                  {attendanceSaved && (
                    <p className="text-sm text-center text-muted-foreground">
                      Last saved: {new Date().toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lesson Plan</CardTitle>
            </CardHeader>
            <CardContent>
              {lessonResources.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">No lesson plan available</div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {lessonResources.map((resource, index) => (
                    <div key={resource.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium">
                            {index + 1}. {resource.title}
                          </h4>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline">{resource.type}</Badge>
                            {resource.duration && (
                              <Badge variant="secondary">
                                <Clock className="w-3 h-3 mr-1" />
                                {resource.duration} min
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {resource.notes && (
                        <div className="mt-3 p-3 bg-muted rounded-md">
                          <p className="text-sm">
                            <span className="font-semibold">Notes:</span> {resource.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <Button className="mt-4 w-full" onClick={handleConcludeLesson} disabled={!isSameDaySession}>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Conclude &amp; Log Lesson
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Classroom Tools</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <TimerReset className="w-4 h-4" /> Timer
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    min={1}
                    value={timerMinutes}
                    onChange={(event) => {
                      const parsed = parseInt(event.target.value, 10);
                      setTimerMinutes(Number.isNaN(parsed) ? 1 : Math.max(parsed, 1));
                    }}
                    placeholder="Minutes"
                  />
                  <Select value={timerType} onValueChange={setTimerType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Timer type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="focus">Focus</SelectItem>
                      <SelectItem value="group-work">Group Work</SelectItem>
                      <SelectItem value="break">Break</SelectItem>
                      <SelectItem value="assessment">Assessment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-3 text-lg font-semibold">
                  <span>{formatTimer(timerRemaining)}</span>
                  {timerRunning && <Badge variant="default">Running</Badge>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleStartTimer} disabled={timerRunning}>
                    Start
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleStopTimer} disabled={!timerRunning}>
                    Stop
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Shuffle className="w-4 h-4" /> Randomiser
                </h3>
                <Button size="sm" variant="secondary" onClick={randomizeStudent}>
                  Choose Student
                </Button>
                {randomStudentId && (
                  <p className="text-sm text-muted-foreground">
                    Ready to respond: {
                      students.find((student) => student.id === randomStudentId)?.full_name || 'Student'
                    }
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Seating Geometry
                </h3>
                <Select value={seatingLayout} onValueChange={(value) => setSeatingLayout(value as typeof seatingLayout)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose layout" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rows">Rows</SelectItem>
                    <SelectItem value="pairs">Pairs</SelectItem>
                    <SelectItem value="pods">Pods</SelectItem>
                    <SelectItem value="circle">Circle</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button size="sm" onClick={generateSeatMap}>
                    Generate Plan
                  </Button>
                  <Button size="sm" variant="outline" onClick={saveSeatingPlan}>
                    Save Layout
                  </Button>
                </div>
                {seatMap.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Generate a seating arrangement to snapshot it for this session.
                  </p>
                ) : (
                  <div
                    className="grid gap-3"
                    style={{ gridTemplateColumns: `repeat(${seatMapColumns}, minmax(0, 1fr))` }}
                  >
                    {seatMap.flat().map((seat) => (
                      <div
                        key={seat.studentId}
                        className={cn(
                          'border rounded-md px-2 py-3 text-sm text-center bg-muted/40',
                          highlightedStudentId === seat.studentId && 'border-primary'
                        )}
                      >
                        {seat.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <StudentDashboardModal
        open={isStudentModalOpen}
        onOpenChange={(open) => {
          setIsStudentModalOpen(open);
          if (!open) {
            setSelectedStudent(null);
          }
        }}
        studentId={selectedStudent?.id}
        studentName={selectedStudent?.name}
      />
    </div>
  );
};

export default MyClassView;
