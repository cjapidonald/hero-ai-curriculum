import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar as CalendarIcon, Users, CheckCircle2, XCircle, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';

interface CalendarTabProps {
  teacherId: string;
  teacherName: string;
}

interface CalendarSession {
  id: string;
  class_name: string;
  lesson_title: string;
  curriculum_id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  status: string;
  attendance_taken: boolean;
}

interface Student {
  id: string;
  name: string;
  surname: string;
  class: string;
  sessions_left: number;
}

interface AttendanceRecord {
  student_id: string;
  present: boolean;
  note: string;
}

const CalendarTab = ({ teacherId, teacherName }: CalendarTabProps) => {
  const [sessions, setSessions] = useState<CalendarSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<CalendarSession | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<{ [key: string]: AttendanceRecord }>({});
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSessions();
  }, [teacherId]);

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('calendar_sessions')
        .select('*')
        .eq('teacher_id', teacherId)
        .gte('session_date', new Date().toISOString().split('T')[0])
        .order('session_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const openAttendance = async (session: CalendarSession) => {
    try {
      setSelectedSession(session);

      // Fetch students for this class
      const { data: studentsData, error: studentsError } = await supabase
        .from('dashboard_students')
        .select('*')
        .eq('class', session.class_name)
        .order('name');

      if (studentsError) throw studentsError;
      setStudents(studentsData || []);

      // Initialize attendance records
      const attendanceInit: { [key: string]: AttendanceRecord } = {};
      studentsData?.forEach((student) => {
        attendanceInit[student.id] = {
          student_id: student.id,
          present: true, // Default to present
          note: '',
        };
      });
      setAttendance(attendanceInit);

      setIsAttendanceDialogOpen(true);
    } catch (error) {
      console.error('Error opening attendance:', error);
      toast({
        title: 'Error',
        description: 'Failed to load students',
        variant: 'destructive',
      });
    }
  };

  const toggleAttendance = (studentId: string) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        present: !prev[studentId].present,
      },
    }));
  };

  const updateNote = (studentId: string, note: string) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        note,
      },
    }));
  };

  const saveAttendance = async () => {
    if (!selectedSession) return;

    try {
      // For each student, save attendance and notes
      for (const student of students) {
        const record = attendance[student.id];

        // 1. Save attendance record
        const { error: attendanceError } = await supabase
          .from('attendance')
          .insert({
            teacher_id: teacherId,
            student_id: student.id,
            class_session_id: selectedSession.id,
            date: selectedSession.session_date,
            present: record.present,
            notes: record.note,
          })
          .select()
          .single();

        if (attendanceError && !attendanceError.message.includes('duplicate')) {
          throw attendanceError;
        }

        // 2. Append note to student_notes if note exists
        if (record.note.trim()) {
          const { error: noteError } = await supabase.rpc('append_student_note', {
            p_student_id: student.id,
            p_teacher_id: teacherId,
            p_teacher_name: teacherName,
            p_session_id: selectedSession.id,
            p_note: record.note,
          });

          if (noteError) {
            console.error('Error appending note:', noteError);
          }
        }

        // 3. Decrement sessions_left ONLY if present (not if absent)
        if (record.present) {
          const { error: sessionsError } = await supabase
            .from('dashboard_students')
            .update({
              sessions_left: Math.max(0, student.sessions_left - 1),
            })
            .eq('id', student.id);

          if (sessionsError) {
            console.error('Error updating sessions_left:', sessionsError);
          }
        }
      }

      // 4. Mark session as complete and attendance taken
      const { error: sessionError } = await supabase
        .from('calendar_sessions')
        .update({
          status: 'completed',
          attendance_taken: true,
        })
        .eq('id', selectedSession.id);

      if (sessionError) throw sessionError;

      toast({
        title: 'Success',
        description: `Attendance saved. Total attendance updated for present students.`,
      });

      setIsAttendanceDialogOpen(false);
      fetchSessions();
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast({
        title: 'Error',
        description: 'Failed to save attendance',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold mb-2">Class Calendar</h2>
          <p className="text-muted-foreground">
            Manage your class schedule and take attendance
          </p>
        </div>
      </div>

      {/* Sessions List */}
      <div className="grid gap-4">
        {sessions.length > 0 ? (
          sessions.map((session) => (
            <Card key={session.id} className="glass hover:glass-heavy transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CalendarIcon className="h-5 w-5 text-primary" />
                      <h3 className="text-xl font-semibold">{session.lesson_title || 'Class Session'}</h3>
                      {session.attendance_taken && (
                        <span className="status-badge success">
                          <CheckCircle2 className="h-3 w-3" />
                          Attendance Taken
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Class</p>
                        <p className="font-medium">{session.class_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Date</p>
                        <p className="font-medium">{format(new Date(session.session_date), 'MMM dd, yyyy')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Time</p>
                        <p className="font-medium">
                          {session.start_time} - {session.end_time}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <p className="font-medium capitalize">{session.status}</p>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => openAttendance(session)}
                    disabled={session.attendance_taken}
                    className="apple-button"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    {session.attendance_taken ? 'Completed' : 'Take Attendance'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="glass">
            <CardContent className="py-12 text-center">
              <CalendarIcon className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Upcoming Sessions</h3>
              <p className="text-muted-foreground">
                Your scheduled class sessions will appear here
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Attendance Dialog */}
      <Dialog open={isAttendanceDialogOpen} onOpenChange={setIsAttendanceDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto liquid-glass">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              Take Attendance - {selectedSession?.class_name}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {selectedSession?.lesson_title} •{' '}
              {selectedSession && format(new Date(selectedSession.session_date), 'MMM dd, yyyy')}
            </p>
          </DialogHeader>

          <div className="space-y-4 my-6">
            {students.map((student) => (
              <Card key={student.id} className="apple-card p-4">
                <div className="flex items-start gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <Checkbox
                      checked={attendance[student.id]?.present}
                      onCheckedChange={() => toggleAttendance(student.id)}
                      className="h-6 w-6"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-lg">
                          {student.name} {student.surname}
                        </p>
                        {!attendance[student.id]?.present && (
                          <span className="status-badge error">
                            <XCircle className="h-3 w-3" />
                            Absent
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Sessions left: {student.sessions_left}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <Label htmlFor={`note-${student.id}`} className="text-sm">
                    Notes for {student.name}
                  </Label>
                  <Textarea
                    id={`note-${student.id}`}
                    value={attendance[student.id]?.note || ''}
                    onChange={(e) => updateNote(student.id, e.target.value)}
                    placeholder="Add a note about this student's performance today..."
                    className="apple-input mt-1"
                    rows={2}
                  />
                </div>
              </Card>
            ))}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAttendanceDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={saveAttendance} className="apple-button">
              <Save className="mr-2 h-4 w-4" />
              Save Attendance & Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CalendarTab;
