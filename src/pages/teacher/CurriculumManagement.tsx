import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  lesson_title?: string;
  lesson_subject?: string;
}

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

  const loadData = async () => {
    setLoading(true);
    try {
      // Load teacher's classes
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('id, class_name, stage')
        .eq('teacher_id', teacherId)
        .eq('is_active', true);

      if (classesError) throw classesError;

      setClasses(
        (classesData || []).map((c) => ({
          id: c.id,
          name: c.class_name,
        }))
      );

      // Load class sessions with joined data
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('class_sessions')
        .select(`
          *,
          classes:class_id (
            class_name,
            stage
          ),
          curriculum:curriculum_id (
            lesson_title,
            subject
          )
        `)
        .eq('teacher_id', teacherId)
        .order('session_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (sessionsError) throw sessionsError;

      const formattedSessions = (sessionsData || []).map((session: any) => ({
        ...session,
        class_name: session.classes?.class_name,
        class_stage: session.classes?.stage,
        lesson_title: session.curriculum?.lesson_title,
        lesson_subject: session.curriculum?.subject,
      }));

      setSessions(formattedSessions);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load sessions',
        variant: 'destructive',
      });
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
    const variants: Record<string, { variant: any; label: string }> = {
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
    return ['scheduled', 'building'].includes(session.status);
  };

  const canStartClass = (session: ClassSession) => {
    return session.status === 'ready' && isToday(parseISO(session.session_date));
  };

  const handleBuildLesson = (session: ClassSession) => {
    setSelectedSession(session);
    setLessonBuilderOpen(true);
  };

  const handleViewLesson = (session: ClassSession) => {
    setSelectedSession(session);
    setViewLessonPlanOpen(true);
  };

  const handleStartClass = async (session: ClassSession) => {
    try {
      // Update status to in_progress
      const { error } = await supabase
        .from('class_sessions')
        .update({ status: 'in_progress' })
        .eq('id', session.id);

      if (error) throw error;

      toast({
        title: 'Class Started',
        description: 'Redirecting to class view...',
      });

      // Navigate to MyClassView
      if (onStartClass) {
        onStartClass(session.id);
      }
    } catch (error: any) {
      console.error('Error starting class:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to start class',
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

          {/* Sessions Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Lesson</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No sessions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSessions.map((session) => (
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
                        <div>
                          <div className="font-medium">{session.class_name}</div>
                          <div className="text-sm text-muted-foreground">{session.class_stage}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{session.lesson_title || 'No lesson'}</div>
                          <div className="text-sm text-muted-foreground">
                            {session.lesson_subject}
                          </div>
                        </div>
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
                              Build
                            </Button>
                          )}
                          {session.lesson_plan_completed && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewLesson(session)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          )}
                          {canStartClass(session) && (
                            <Button
                              size="sm"
                              onClick={() => handleStartClass(session)}
                            >
                              <Play className="w-4 h-4 mr-1" />
                              Start
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
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
