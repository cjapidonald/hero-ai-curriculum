import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Tables } from '@/integrations/supabase/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Calendar, Clock, BookOpen, Play, Eye, Pencil, Plus } from 'lucide-react';
import { format, parseISO, isToday, isFuture, isPast } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import LessonBuilderModal from '@/components/teacher/LessonBuilderModal';
import ViewLessonPlanModal from '@/components/teacher/ViewLessonPlanModal';

interface ClassSession {
  id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'building' | 'ready' | 'in_progress' | 'completed' | 'cancelled';
  lesson_plan_completed: boolean;
  attendance_taken: boolean;
  attendance_count: number;
  total_students: number;
  class_id: string;
  curriculum_id: string | null;
  teacher_id: string;
  notes: string | null;
  location: string | null;
  // Joined data
  class_name?: string;
  class_stage?: string;
  class_level?: string | null;
  class_teacher?: string | null;
  lesson_title?: string;
  lesson_subject?: string;
  isCurriculumOnly?: boolean;
}

interface ClassDetail {
  name: string;
  stage: string | null;
  level: string | null;
  start_time: string | null;
  end_time: string | null;
  teacher_name: string | null;
  current_students: number | null;
  max_students: number | null;
  classroom: string | null;
  classroom_location: string | null;
}

type CurriculumRow = Tables<'curriculum'>;
type ClassRow = Tables<'classes'>;
type SessionQueryRow = ClassSession & {
  classes?: {
    class_name: ClassRow['class_name'] | null;
    stage: ClassRow['stage'] | null;
    level: ClassRow['level'];
    teacher_name: ClassRow['teacher_name'] | null;
  } | null;
  curriculum?: {
    lesson_title: CurriculumRow['lesson_title'] | null;
    subject: CurriculumRow['subject'] | null;
  } | null;
};

interface CurriculumManagementProps {
  teacherId: string;
  onStartClass?: (sessionId: string) => void;
}

const CurriculumManagement = ({ teacherId, onStartClass }: CurriculumManagementProps) => {
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('upcoming');
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [classDetails, setClassDetails] = useState<Record<string, ClassDetail>>({});
  const [usingCurriculumFallback, setUsingCurriculumFallback] = useState(false);

  // Modal states
  const [lessonBuilderOpen, setLessonBuilderOpen] = useState(false);
  const [viewLessonPlanOpen, setViewLessonPlanOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ClassSession | null>(null);

  const { toast } = useToast();

  const formatStageLabel = (stage?: string | null) => {
    if (!stage) return null;
    if (stage.toLowerCase().startsWith('stage_')) {
      const suffix = stage.split('_')[1];
      return `Stage ${suffix}`;
    }
    return stage;
  };

  useEffect(() => {
    loadData();

    // Real-time subscription
    const channel = supabase
      .channel('class-sessions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'class_sessions',
          filter: `teacher_id=eq.${teacherId}`,
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teacherId]);

  useEffect(() => {
    applyFilters();
  }, [sessions, selectedClassId, selectedStatus, dateFilter]);

  const VALID_SESSION_STATUSES: ClassSession['status'][] = [
    'scheduled',
    'building',
    'ready',
    'in_progress',
    'completed',
    'cancelled',
  ];

  const normalizeDate = (value?: string | null) => {
    if (!value) {
      return format(new Date(), 'yyyy-MM-dd');
    }

    const parsed = parseISO(value);
    if (!Number.isNaN(parsed.getTime())) {
      return format(parsed, 'yyyy-MM-dd');
    }

    const fallbackDate = new Date(value);
    if (!Number.isNaN(fallbackDate.getTime())) {
      return format(fallbackDate, 'yyyy-MM-dd');
    }

    return format(new Date(), 'yyyy-MM-dd');
  };

  const determineStatus = (status: string | null, sessionDate: Date): ClassSession['status'] => {
    if (status && VALID_SESSION_STATUSES.includes(status as ClassSession['status'])) {
      return status as ClassSession['status'];
    }

    if (isToday(sessionDate)) {
      return 'ready';
    }

    if (isPast(sessionDate)) {
      return 'completed';
    }

    return 'scheduled';
  };

  const getErrorMessage = (error: unknown) => {
    if (error instanceof Error) {
      return error.message;
    }

    return String(error);
  };

  const loadCurriculumFallback = async (
    existingClassDetails: Record<string, ClassDetail>,
    existingClasses: { id: string; name: string }[],
  ) => {
    try {
      const { data: curriculumData, error: curriculumError } = await supabase
        .from('curriculum')
        .select(
          `id, lesson_title, lesson_date, status, class_id, class, stage, curriculum_stage, subject, teacher_name, description`
        )
        .eq('teacher_id', teacherId)
        .order('lesson_date', { ascending: true });

      if (curriculumError) {
        throw curriculumError;
      }

      const lessons: CurriculumRow[] = (curriculumData as CurriculumRow[]) || [];

      if (lessons.length === 0) {
        setSessions([]);
        setUsingCurriculumFallback(false);
        return;
      }

      const updatedClassDetails: Record<string, ClassDetail> = {
        ...existingClassDetails,
      };
      const classEntries = new Map(existingClasses.map((c) => [c.id, c.name]));

      const fallbackSessions: ClassSession[] = lessons.map((lesson) => {
        const fallbackClassId = lesson.class_id || `curriculum-${lesson.id}`;

        if (!updatedClassDetails[fallbackClassId]) {
          updatedClassDetails[fallbackClassId] = {
            name: lesson.class || 'Curriculum Lesson',
            stage: lesson.stage || lesson.curriculum_stage,
            level: lesson.curriculum_stage || lesson.stage,
            start_time: null,
            end_time: null,
            teacher_name: lesson.teacher_name,
            current_students: null,
            max_students: null,
            classroom: null,
            classroom_location: null,
          };
        }

        if (!classEntries.has(fallbackClassId)) {
          classEntries.set(fallbackClassId, updatedClassDetails[fallbackClassId].name);
        }

        const normalizedDate = normalizeDate(lesson.lesson_date ?? undefined);
        const dateForStatus = parseISO(normalizedDate);
        const derivedStatus = determineStatus(lesson.status ?? null, dateForStatus);
        const classData = updatedClassDetails[fallbackClassId];

        return {
          id: `curriculum-${lesson.id}`,
          session_date: normalizedDate,
          start_time: classData.start_time || '09:00',
          end_time: classData.end_time || '10:30',
          status: derivedStatus,
          lesson_plan_completed: false,
          attendance_taken: false,
          attendance_count: 0,
          total_students:
            classData.current_students ?? classData.max_students ?? 0,
          class_id: fallbackClassId,
          curriculum_id: lesson.id,
          teacher_id: teacherId,
          notes: lesson.description,
          location: classData.classroom_location || classData.classroom,
          class_name: classData.name,
          class_stage: classData.stage || undefined,
          class_level: classData.level,
          class_teacher: classData.teacher_name,
          lesson_title: lesson.lesson_title,
          lesson_subject: lesson.subject,
          isCurriculumOnly: true,
        };
      });

      setClassDetails(updatedClassDetails);
      setClasses(
        Array.from(classEntries.entries()).map(([id, name]) => ({ id, name }))
      );
      setSessions(fallbackSessions);
      setUsingCurriculumFallback(true);
    } catch (fallbackError: unknown) {
      console.error('Error loading curriculum fallback:', fallbackError);
      setUsingCurriculumFallback(false);
      toast({
        title: 'Unable to load curriculum data',
        description: getErrorMessage(fallbackError) ||
          'Failed to load curriculum lessons for this teacher.',
        variant: 'destructive',
      });
    }
  };

  const loadData = async () => {
    setLoading(true);
    setUsingCurriculumFallback(false);

    let localClassDetails: Record<string, ClassDetail> = {};
    let localClassList: { id: string; name: string }[] = [];

    try {
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select(
          'id, class_name, stage, level, start_time, end_time, teacher_name, current_students, max_students, classroom, classroom_location'
        )
        .eq('teacher_id', teacherId)
        .eq('is_active', true);

      if (classesError) throw classesError;

      const classRecords: ClassRow[] = (classesData as ClassRow[]) || [];

      localClassList = classRecords.map((c) => ({
        id: c.id,
        name: c.class_name,
      }));

      const details: Record<string, ClassDetail> = {};
      classRecords.forEach((c) => {
        details[c.id] = {
          name: c.class_name,
          stage: c.stage,
          level: c.level,
          start_time: c.start_time,
          end_time: c.end_time,
          teacher_name: c.teacher_name,
          current_students: c.current_students,
          max_students: c.max_students,
          classroom: c.classroom,
          classroom_location: c.classroom_location,
        };
      });

      localClassDetails = details;

      setClasses(localClassList);
      setClassDetails(details);

      const { data: sessionsData, error: sessionsError } = await supabase
        .from('class_sessions')
        .select(`
          *,
          classes:class_id (
            class_name,
            stage,
            level,
            teacher_name
          ),
          curriculum:curriculum_id (
            lesson_title,
            subject
          )
        `)
        .eq('teacher_id', teacherId)
        .order('session_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (sessionsError) {
        console.warn('Falling back to curriculum data due to session load error:', sessionsError);
        await loadCurriculumFallback(localClassDetails, localClassList);
        return;
      }

      if (!sessionsData || sessionsData.length === 0) {
        await loadCurriculumFallback(localClassDetails, localClassList);
        return;
      }

      const sessionRecords: SessionQueryRow[] = (sessionsData as SessionQueryRow[]) || [];

      const formattedSessions = sessionRecords.map((session) => ({
        ...session,
        class_name: session.classes?.class_name ?? session.class_name,
        class_stage: session.classes?.stage ?? session.class_stage,
        class_level: session.classes?.level ?? session.class_level,
        class_teacher: session.classes?.teacher_name ?? session.class_teacher,
        lesson_title: session.curriculum?.lesson_title ?? session.lesson_title,
        lesson_subject: session.curriculum?.subject ?? session.lesson_subject,
      }));

      setSessions(formattedSessions);
    } catch (error: unknown) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: getErrorMessage(error) || 'Failed to load sessions',
        variant: 'destructive',
      });

      const fallbackDetails = Object.keys(localClassDetails).length
        ? localClassDetails
        : classDetails;
      const fallbackClasses = localClassList.length ? localClassList : classes;

      if (!usingCurriculumFallback) {
        await loadCurriculumFallback(fallbackDetails, fallbackClasses);
      }
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...sessions];

    // Class filter
    if (selectedClassId !== 'all') {
      filtered = filtered.filter((s) => s.class_id === selectedClassId);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter((s) => s.status === selectedStatus);
    }

    // Date filter
    const today = new Date();
    if (dateFilter === 'upcoming') {
      filtered = filtered.filter((s) => {
        const sessionDate = parseISO(s.session_date);
        return isFuture(sessionDate) || isToday(sessionDate);
      });
    } else if (dateFilter === 'past') {
      filtered = filtered.filter((s) => {
        const sessionDate = parseISO(s.session_date);
        return isPast(sessionDate) && !isToday(sessionDate);
      });
    } else if (dateFilter === 'today') {
      filtered = filtered.filter((s) => isToday(parseISO(s.session_date)));
    }

    setFilteredSessions(filtered);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'outline' | 'destructive'; label: string }> = {
      scheduled: { variant: 'secondary', label: 'Scheduled' },
      building: { variant: 'default', label: 'Building' },
      ready: { variant: 'default', label: 'Ready' },
      in_progress: { variant: 'default', label: 'In Progress' },
      completed: { variant: 'outline', label: 'Completed' },
      cancelled: { variant: 'destructive', label: 'Cancelled' },
    };

    const config = variants[status] || variants.scheduled;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const canBuildLesson = (session: ClassSession) => {
    if (session.isCurriculumOnly) {
      return false;
    }

    return ['scheduled', 'building'].includes(session.status);
  };

  const canStartClass = (session: ClassSession) => {
    if (session.isCurriculumOnly) {
      return false;
    }

    const sessionDate = parseISO(session.session_date);
    if (session.status === 'in_progress') {
      return true;
    }

    if (session.status === 'ready' && isToday(sessionDate)) {
      return true;
    }

    if (
      session.status === 'scheduled' &&
      session.lesson_plan_completed &&
      isToday(sessionDate)
    ) {
      return true;
    }

    return false;
  };

  const handleBuildLesson = (session: ClassSession) => {
    if (session.isCurriculumOnly) {
      return;
    }

    setSelectedSession(session);
    setLessonBuilderOpen(true);
  };

  const handleViewLesson = (session: ClassSession) => {
    if (session.isCurriculumOnly) {
      return;
    }

    setSelectedSession(session);
    setViewLessonPlanOpen(true);
  };

  const handleStartClass = async (session: ClassSession) => {
    try {
      if (session.status !== 'in_progress') {
        const { error } = await supabase
          .from('class_sessions')
          .update({ status: 'in_progress' })
          .eq('id', session.id);

        if (error) throw error;

        toast({
          title: 'Class Started',
          description: 'Redirecting to live class tools...',
        });
      } else {
        toast({
          title: 'Resuming Class',
          description: 'Returning to attendance and lesson plan.',
        });
      }

      // Navigate to MyClassView
      if (onStartClass) {
        onStartClass(session.id);
      }
    } catch (error: unknown) {
      console.error('Error starting class:', error);
      toast({
        title: 'Error',
        description: getErrorMessage(error) || 'Failed to start class',
        variant: 'destructive',
      });
    }
  };

  const handleLessonSaved = () => {
    setLessonBuilderOpen(false);
    loadData(); // Reload to get updated status
    toast({
      title: 'Lesson Saved',
      description: 'Your lesson plan has been saved successfully.',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading sessions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Curriculum Management</CardTitle>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Schedule Session
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="building">Building</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="past">Past</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {usingCurriculumFallback && (
            <div className="mb-4 rounded-lg border border-dashed border-muted-foreground/40 bg-muted/40 p-4 text-sm text-muted-foreground">
              No scheduled class sessions were found for this teacher. Displaying
              lessons directly from the curriculum library so you can review upcoming plans.
            </div>
          )}

          {/* Sessions Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Lesson &amp; Subject</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No sessions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSessions.map((session) => {
                    const stageLabel = formatStageLabel(session.class_stage);
                    const gradeLabel = session.class_level || stageLabel || 'Stage TBD';
                    const subjectLabel = session.lesson_subject || 'General English';
                    const teacherLabel = session.class_teacher || 'Assigned Teacher';
                    const startLabel = session.status === 'in_progress' ? 'Resume Lesson' : 'Start Lesson';

                    return (
                      <TableRow key={session.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">
                                {format(parseISO(session.session_date), 'EEE, MMM d')}
                              </div>
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {session.start_time} - {session.end_time}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{session.lesson_title || 'No lesson assigned'}</div>
                          <div className="text-sm text-muted-foreground">{subjectLabel}</div>
                          {session.isCurriculumOnly && (
                            <Badge variant="outline" className="mt-2">Curriculum Lesson</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{session.class_name || 'Unassigned class'}</div>
                          <div className="text-sm text-muted-foreground">{stageLabel || 'Stage TBD'}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{teacherLabel}</div>
                          <div className="text-sm text-muted-foreground">Lead Instructor</div>
                        </TableCell>
                        <TableCell>
                          {gradeLabel ? (
                            <Badge variant="secondary">{gradeLabel}</Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(session.status)}</TableCell>
                        <TableCell>
                          {session.attendance_taken ? (
                            <div className="text-sm">
                              {session.attendance_count} / {session.total_students}
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">Not taken</div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {canBuildLesson(session) && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleBuildLesson(session)}
                              >
                                <Pencil className="w-4 h-4 mr-1" />
                                Build Plan
                              </Button>
                            )}
                            {session.lesson_plan_completed && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewLesson(session)}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View Plan
                              </Button>
                            )}
                            {canStartClass(session) && (
                              <Button
                                size="sm"
                                onClick={() => handleStartClass(session)}
                              >
                                <Play className="w-4 h-4 mr-1" />
                                {startLabel}
                              </Button>
                            )}
                          </div>
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

      {/* Modals */}
      {selectedSession && (
        <>
          <LessonBuilderModal
            open={lessonBuilderOpen}
            onOpenChange={setLessonBuilderOpen}
            session={selectedSession}
            onSave={handleLessonSaved}
          />
          <ViewLessonPlanModal
            open={viewLessonPlanOpen}
            onOpenChange={setViewLessonPlanOpen}
            session={selectedSession}
            onEdit={() => {
              setViewLessonPlanOpen(false);
              setLessonBuilderOpen(true);
            }}
          />
        </>
      )}
    </div>
  );
};

export default CurriculumManagement;
