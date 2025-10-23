import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle2, UserCheck, Clock, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format, parseISO } from 'date-fns';
import StudentDashboardModal from './StudentDashboardModal';

interface Student {
  id: string;
  full_name: string;
  enrollment_id: string;
  present: boolean;
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
  lesson_plan_data: LessonPlanData | null;
  class_id: string;
  class_name?: string;
  lesson_title?: string;
  lesson_subject?: string;
  class_stage?: string;
}

interface MyClassViewProps {
  sessionId: string;
  onBack: () => void;
}

const MyClassView = ({ sessionId, onBack }: MyClassViewProps) => {
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

  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [sessionId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load session data
      const { data: sessionData, error: sessionError } = await supabase
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
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      const formattedSession: ClassSession = {
        ...sessionData,
        class_name: sessionData.classes?.class_name,
        class_stage: sessionData.classes?.stage,
        lesson_title: sessionData.curriculum?.lesson_title,
        lesson_subject: sessionData.curriculum?.subject,
      };

      setSession(formattedSession);

      // Load students enrolled in this class
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

      // Check for existing attendance records
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
      setAttendanceSaved(existingAttendance && existingAttendance.length > 0);
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

  const handleToggleAttendance = (studentId: string) => {
    setStudents(
      students.map((s) =>
        s.id === studentId ? { ...s, present: !s.present } : s
      )
    );
  };

  const handleMarkAllPresent = () => {
    setStudents(students.map((s) => ({ ...s, present: true })));
  };

  const handleMarkAllAbsent = () => {
    setStudents(students.map((s) => ({ ...s, present: false })));
  };

  const handleViewStudent = (student: Student) => {
    setSelectedStudent({ id: student.id, name: student.full_name });
    setIsStudentModalOpen(true);
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    try {
      // Delete existing attendance records for this session
      await supabase
        .from('attendance')
        .delete()
        .eq('class_session_id', sessionId);

      // Insert new attendance records
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

  const handleEndClass = async () => {
    try {
      // Update session status to completed
      const { error } = await supabase
        .from('class_sessions')
        .update({ status: 'completed' })
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        title: 'Lesson Marked as Taught',
        description: 'This session is now recorded as taught.',
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

  const lessonResources = session.lesson_plan_data?.resources
    ?.sort((a, b) => a.position - b.position) || [];
  const presentCount = students.filter((s) => s.present).length;

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
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
          <Button onClick={handleEndClass} size="lg">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Mark as Taught
          </Button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Left: Lesson Plan */}
        <Card className="order-1">
          <CardHeader>
            <CardTitle>Lesson Plan</CardTitle>
          </CardHeader>
          <CardContent>
            {lessonResources.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No lesson plan available
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
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
          </CardContent>
        </Card>

        {/* Right: Attendance & Students */}
        <Card className="order-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Students & Attendance</CardTitle>
              <div className="flex items-center gap-2 text-sm">
                <UserCheck className="w-4 h-4" />
                <span className="font-semibold">
                  {presentCount} / {students.length}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleMarkAllPresent}>
                  Mark All Present
                </Button>
                <Button variant="outline" size="sm" onClick={handleMarkAllAbsent}>
                  Mark All Absent
                </Button>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/70 transition-colors"
                  >
                    <Checkbox
                      checked={student.present}
                      onCheckedChange={() => handleToggleAttendance(student.id)}
                      aria-label={`Mark ${student.full_name} present`}
                    />
                    <button
                      type="button"
                      onClick={() => handleViewStudent(student)}
                      className="flex-1 text-left"
                    >
                      <p className="font-medium hover:underline">{student.full_name}</p>
                      <p className="text-xs text-muted-foreground">Click to open dashboard</p>
                    </button>
                    {student.present && <Badge variant="default">Present</Badge>}
                  </div>
                ))}
              </div>

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
          </CardContent>
        </Card>
      </div>

      {/* Formal Assessment Section */}
      <Card>
        <CardHeader>
          <CardTitle>Formal Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <div className="text-4xl mb-4">🚧</div>
            <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
            <p>
              Track student progress during class activities with formal assessment tools.
              This feature will allow you to evaluate students in real-time and provide
              immediate feedback.
            </p>
          </div>
        </CardContent>
      </Card>

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
