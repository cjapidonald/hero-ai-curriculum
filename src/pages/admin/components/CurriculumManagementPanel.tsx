import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { isPast, isToday, parseISO } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import LessonBuilderModal from '@/components/teacher/LessonBuilderModal';
import ViewLessonPlanModal from '@/components/teacher/ViewLessonPlanModal';
import MyClassView from '@/pages/teacher/MyClassView';
import CurriculumSessionTable from '@/components/curriculum/CurriculumSessionTable';
import type { CurriculumSessionRow } from '@/components/curriculum/CurriculumSessionTable';

interface AdminClassSession extends CurriculumSessionRow {
  attendance_taken: boolean;
  attendance_count: number;
  total_students: number;
  class_id: string;
  curriculum_id: string | null;
  teacher_id: string;
  notes: string | null;
  location: string | null;
  teacher_name?: string | null;
}

interface TeacherOption {
  id: string;
  name: string;
}

type TeacherRow = Tables<'teachers'>;
type ClassSessionRow = Tables<'class_sessions'>;

type SessionQueryRow = ClassSessionRow & {
  classes?: {
    class_name: string | null;
    stage: string | null;
    level: string | null;
    teacher_name: string | null;
    classroom: string | null;
    classroom_location: string | null;
  } | null;
  curriculum?: {
    lesson_title: string | null;
    subject: string | null;
  } | null;
  teacher?: {
    name: string | null;
    surname: string | null;
  } | null;
};

const CurriculumManagementPanel = () => {
  const [sessions, setSessions] = useState<AdminClassSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<AdminClassSession[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('upcoming');
  const [loading, setLoading] = useState<boolean>(true);
  const [lessonBuilderOpen, setLessonBuilderOpen] = useState(false);
  const [viewLessonPlanOpen, setViewLessonPlanOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<AdminClassSession | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const { toast } = useToast();

  const getErrorMessage = (error: unknown) => {
    if (error instanceof Error) {
      return error.message;
    }

    if (error && typeof error === 'object') {
      const errorObject = error as {
        message?: unknown;
        error_description?: unknown;
        hint?: unknown;
      };

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

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: teacherData, error: teacherError }, { data: sessionsData, error: sessionsError }] = await Promise.all([
        supabase
          .from('teachers')
          .select('id, name, surname')
          .eq('is_active', true),
        supabase
          .from('class_sessions')
          .select(`
            *,
            classes:class_id (
              class_name,
              stage,
              level,
              teacher_name,
              classroom,
              classroom_location
            ),
            curriculum:curriculum_id (
              lesson_title,
              subject
            ),
            teacher:teacher_id (
              name,
              surname
            )
          `)
          .order('session_date', { ascending: true })
          .order('start_time', { ascending: true }),
      ]);

      if (teacherError) throw teacherError;
      if (sessionsError) throw sessionsError;

      const teacherOptions: TeacherOption[] = ((teacherData as TeacherRow[]) || []).map((teacher) => ({
        id: teacher.id,
        name: `${teacher.name} ${teacher.surname}`.trim(),
      }));
      setTeachers(teacherOptions);

      const formattedSessions: AdminClassSession[] = ((sessionsData as SessionQueryRow[]) || []).map((session) => {
        const classLocation =
          session.location ||
          session.classes?.classroom_location ||
          session.classes?.classroom ||
          null;

        const teacherNameFromJoin = session.teacher
          ? `${session.teacher.name || ''} ${session.teacher.surname || ''}`.trim()
          : null;

        return {
          ...session,
          location: classLocation,
          class_name: session.classes?.class_name ?? session.class_name,
          class_stage: session.classes?.stage ?? session.class_stage,
          class_level: session.classes?.level ?? session.class_level,
          class_teacher: session.classes?.teacher_name ?? session.class_teacher,
          lesson_title: session.curriculum?.lesson_title ?? session.lesson_title,
          lesson_subject: session.curriculum?.subject ?? session.lesson_subject,
          teacher_name: teacherNameFromJoin || session.classes?.teacher_name || session.teacher_name,
        };
      });

      setSessions(formattedSessions);
    } catch (error) {
      console.error('Error loading curriculum data for admin:', error);
      toast({
        title: 'Error loading curriculum',
        description: error instanceof Error ? error.message : 'Unable to load sessions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredByTeacher = useMemo(() => {
    if (selectedTeacher === 'all') {
      return sessions;
    }
    return sessions.filter((session) => session.teacher_id === selectedTeacher);
  }, [sessions, selectedTeacher]);

  useEffect(() => {
    let filtered = [...filteredByTeacher];

    if (selectedStatus !== 'all') {
      filtered = filtered.filter((session) => session.status === selectedStatus);
    }

    const now = new Date();
    if (dateFilter === 'today') {
      filtered = filtered.filter((session) => isToday(parseISO(session.session_date)));
    } else if (dateFilter === 'upcoming') {
      filtered = filtered.filter((session) => {
        const date = parseISO(session.session_date);
        return date >= now || isToday(date);
      });
    } else if (dateFilter === 'past') {
      filtered = filtered.filter((session) => {
        const date = parseISO(session.session_date);
        return isPast(date) && !isToday(date);
      });
    }

    setFilteredSessions(filtered);
  }, [filteredByTeacher, selectedStatus, dateFilter]);

  const handleBuildLesson = async (session: AdminClassSession) => {
    try {
      if (!session.lesson_plan_completed && session.status === 'scheduled') {
        await supabase
          .from('class_sessions')
          .update({ status: 'building' })
          .eq('id', session.id);
      }
    } catch (error) {
      console.error('Error updating session status before building:', error);
    }

    setSelectedSession(session);
    setLessonBuilderOpen(true);
  };

  const handleViewLesson = (session: AdminClassSession) => {
    setSelectedSession(session);
    setViewLessonPlanOpen(true);
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
      await loadData();
      toast({
        title: 'Lesson Saved',
        description: 'Lesson plan has been updated successfully.',
      });
    } catch (error) {
      console.error('Error saving lesson plan from admin dashboard:', error);
      toast({
        title: 'Error saving lesson plan',
        description: getErrorMessage(error) || 'Failed to save lesson plan.',
        variant: 'destructive',
      });
    }
  };

  const handleStartLesson = async (session: AdminClassSession) => {
    try {
      if (session.status !== 'in_progress') {
        await supabase
          .from('class_sessions')
          .update({ status: 'in_progress' })
          .eq('id', session.id);
      }

      toast({
        title: 'Class Started',
        description: 'Opening lesson dashboard...',
      });
      setActiveSessionId(session.id);
    } catch (error) {
      console.error('Error starting lesson from admin dashboard:', error);
      toast({
        title: 'Unable to start lesson',
        description: error instanceof Error ? error.message : 'Unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };

  const handleBackFromClass = () => {
    setActiveSessionId(null);
    loadData();
  };

  const canStartLesson = (session: AdminClassSession) => {
    if (!session.lesson_plan_completed) {
      return false;
    }

    if (['completed', 'cancelled'].includes(session.status)) {
      return false;
    }

    if (session.status === 'in_progress') {
      return true;
    }

    const sessionDate = parseISO(session.session_date);
    return isToday(sessionDate) || isPast(sessionDate);
  };

  if (activeSessionId) {
    return <MyClassView sessionId={activeSessionId} onBack={handleBackFromClass} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Curriculum Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4 mb-6">
          <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="All Teachers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teachers</SelectItem>
              {teachers.map((teacher) => (
                <SelectItem key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[180px]">
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
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="past">Past</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <CurriculumSessionTable
          sessions={filteredSessions}
          loading={loading}
          emptyState="No sessions match the selected filters."
          onBuildLesson={handleBuildLesson}
          onViewLesson={handleViewLesson}
          onStartLesson={handleStartLesson}
          canStartLesson={canStartLesson}
        />
      </CardContent>

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
    </Card>
  );
};

export default CurriculumManagementPanel;
