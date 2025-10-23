import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Tables } from '@/integrations/supabase/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { format, parseISO, isToday, isFuture, isPast } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import LessonBuilderModal from '@/components/teacher/LessonBuilderModal';
import ViewLessonPlanModal from '@/components/teacher/ViewLessonPlanModal';
import CurriculumSessionTable from '@/components/curriculum/CurriculumSessionTable';
import type { CurriculumSessionRow } from '@/components/curriculum/CurriculumSessionTable';

interface ClassSession extends CurriculumSessionRow {
  attendance_taken: boolean;
  attendance_count: number;
  total_students: number;
  class_id: string;
  curriculum_id: string | null;
  teacher_id: string;
  notes: string | null;
  location: string | null;
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

    if (error && typeof error === 'object') {
      const errorObject = error as { message?: unknown; error_description?: unknown; hint?: unknown };
      if (typeof errorObject.message === 'string') {
        return errorObject.message;
      }
      if (typeof errorObject.error_description === 'string') {
        return errorObject.error_description;
      }
      if (typeof errorObject.hint === 'string') {
        return errorObject.hint;
      }
    }

    return String(error);
  };

  const loadCurriculumFallback = async (
    existingClassDetails: Record<string, ClassDetail>,
    existingClasses: { id: string; name: string }[],
  ) => {
    try {
      const selectCurriculum = (includeStatus: boolean) =>
        supabase
          .from('curriculum')
          .select(
            includeStatus
              ? `id, lesson_title, lesson_date, status, class_id, class_name:class, stage, curriculum_stage, subject, teacher_name, description`
              : `id, lesson_title, lesson_date, class_id, class_name:class, stage, curriculum_stage, subject, teacher_name, description`
          )
          .eq('teacher_id', teacherId)
          .order('lesson_date', { ascending: true });

      let curriculumResult = await selectCurriculum(true);

      if (
        curriculumResult.error &&
        typeof curriculumResult.error.message === 'string' &&
        curriculumResult.error.message.toLowerCase().includes('column curriculum.status')
      ) {
        curriculumResult = await selectCurriculum(false);
      }

      const { data: curriculumData, error: curriculumError } = curriculumResult;

      if (curriculumError) {
        throw curriculumError;
      }

      type CurriculumFallbackRow = CurriculumRow & {
        class_name?: string | null;
        status?: string | null;
      };

      const lessons: CurriculumFallbackRow[] = (curriculumData as CurriculumFallbackRow[]) || [];

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
            name: lesson.class_name || lesson.class || 'Curriculum Lesson',
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
          classEntries.set(
            fallbackClassId,
            updatedClassDetails[fallbackClassId].name,
          );
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
          lesson_plan_completed: ['ready', 'in_progress', 'completed'].includes(derivedStatus),
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

  const canBuildLesson = (session: ClassSession) => {
    if (session.isCurriculumOnly) {
      return false;
    }

    return true;
  };

  const canStartClass = (session: ClassSession) => {
    if (session.isCurriculumOnly) {
      return false;
    }

    if (!session.lesson_plan_completed) {
      return false;
    }

    if (['completed', 'cancelled'].includes(session.status)) {
      return false;
    }

    const sessionDate = parseISO(session.session_date);
    if (session.status === 'in_progress') {
      return true;
    }

    if (isToday(sessionDate) || isPast(sessionDate)) {
      return true;
    }

    return false;
  };

  const handleBuildLesson = async (session: ClassSession) => {
    if (session.isCurriculumOnly) {
      return;
    }

    try {
      if (!session.lesson_plan_completed && session.status === 'scheduled') {
        await supabase
          .from('class_sessions')
          .update({ status: 'building' })
          .eq('id', session.id);
      }
    } catch (error: unknown) {
      console.error('Error updating session status:', error);
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

  const handleLessonSaved = async (lessonPlanData: Record<string, unknown>) => {
    if (!selectedSession) {
      toast({
        title: 'Unable to save lesson',
        description: 'No session is currently selected.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('class_sessions')
        .update({
          lesson_plan_data: lessonPlanData,
          lesson_plan_completed: true,
          status: 'ready',
        })
        .eq('id', selectedSession.id);

      if (error) throw error;

      setLessonBuilderOpen(false);
      await loadData(); // Reload to get updated status
      toast({
        title: 'Lesson Saved',
        description: 'Your lesson plan has been saved successfully.',
      });
    } catch (error: unknown) {
      console.error('Error saving lesson plan:', error);
      toast({
        title: 'Error saving lesson plan',
        description: getErrorMessage(error) || 'Failed to save lesson plan.',
        variant: 'destructive',
      });
    }
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
                <SelectItem value="building">Planning</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Taught</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
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

          <CurriculumSessionTable
            sessions={filteredSessions}
            loading={loading}
            emptyState="No sessions found"
            canBuildLesson={canBuildLesson}
            canStartLesson={canStartClass}
            onBuildLesson={handleBuildLesson}
            onViewLesson={handleViewLesson}
            onStartLesson={handleStartClass}
          />
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
