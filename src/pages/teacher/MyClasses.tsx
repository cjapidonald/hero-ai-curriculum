import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Calendar, Clock, ClipboardCheck, Search } from 'lucide-react';
import TakeAttendanceDialog from '@/components/teacher/TakeAttendanceDialog';
import StudentDashboardModal from './StudentDashboardModal';

interface Student {
  id: string;
  name: string;
  surname: string;
  class: string;
  attendance_rate: number;
  sessions_left: number;
  enrollment_id?: string | null;
}

interface MyClassesProps {
  teacherId: string;
}

const MyClasses = ({ teacherId }: MyClassesProps) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classes, setClasses] = useState<string[]>([]);
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedStudentName, setSelectedStudentName] = useState<string>('');

  useEffect(() => {
    loadStudents();

    // Set up real-time subscription for student updates
    const studentsChannel = supabase
      .channel('students-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dashboard_students',
        },
        () => {
          loadStudents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(studentsChannel);
    };
  }, [teacherId]);

  const loadStudents = async () => {
    setLoading(true);
    setError(null);

    try {
      // First, get classes assigned to this teacher
      const { data: teacherClasses, error: classesError } = await supabase
        .from('classes')
        .select('id, class_name')
        .eq('teacher_id', teacherId)
        .eq('is_active', true);

      if (classesError) {
        throw new Error(`Failed to load classes: ${classesError.message}`);
      }

      const classMap: Record<string, string> = {};
      (teacherClasses || []).forEach((classRow: any) => {
        const displayName = classRow?.class_name || classRow?.name;
        if (displayName && classRow?.id) {
          classMap[displayName] = classRow.id;
        }
      });

      const teacherClassNames = Object.keys(classMap);
      setClasses(teacherClassNames);

      // If teacher has no classes, show empty state
      if (teacherClassNames.length === 0) {
        setStudents([]);
        setLoading(false);
        return;
      }

      // Now get students only from those classes
      const { data, error: studentsError } = await supabase
        .from('dashboard_students')
        .select('id, name, surname, class, attendance_rate, sessions_left')
        .eq('is_active', true)
        .in('class', teacherClassNames)
        .order('class', { ascending: true })
        .order('name', { ascending: true });

      if (studentsError) {
        throw new Error(`Failed to load students: ${studentsError.message}`);
      }

      const studentList = data || [];
      let enrollmentMap = new Map<string, string>();

      if (studentList.length > 0) {
        const studentIds = studentList.map((student) => student.id);
        const classIds = Object.values(classMap);

        if (classIds.length > 0) {
          const { data: enrollmentData, error: enrollmentError } = await supabase
            .from('enrollments')
            .select('id, student_id, class_id')
            .in('student_id', studentIds)
            .in('class_id', classIds)
            .eq('is_active', true);

          if (enrollmentError) {
            console.error('Error loading enrollments:', enrollmentError);
          } else if (enrollmentData) {
            enrollmentMap = new Map(
              enrollmentData.map((enrollment) => [
                `${enrollment.student_id}-${enrollment.class_id}`,
                enrollment.id,
              ]),
            );
          }
        }
      }

      const augmentedStudents = studentList.map((student) => {
        const className = student.class ?? '';
        const classId = classMap[className];
        const enrollmentKey = classId ? `${student.id}-${classId}` : '';
        return {
          ...student,
          enrollment_id: enrollmentKey ? enrollmentMap.get(enrollmentKey) ?? null : null,
        };
      });

      setStudents(augmentedStudents);
    } catch (err: any) {
      console.error('Error loading students:', err);
      setError(err.message || 'Failed to load your classes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTakeAttendance = (className: string) => {
    setSelectedClass(className);
    setAttendanceDialogOpen(true);
  };

  const handleStudentClick = (student: Student) => {
    setSelectedStudentId(student.id);
    setSelectedStudentName(`${student.name} ${student.surname}`.trim());
    setDashboardOpen(true);
  };

  const handleDashboardOpenChange = (open: boolean) => {
    setDashboardOpen(open);
    if (!open) {
      setSelectedStudentId(null);
      setSelectedStudentName('');
    }
  };

  const handleAttendanceSaved = () => {
    // Reload students to get updated sessions_left and attendance_rate
    loadStudents();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your classes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="text-destructive mb-4">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Failed to load classes</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadStudents} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Filter students based on search query
  const filteredStudents = students.filter((student) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      student.name.toLowerCase().includes(query) ||
      student.surname.toLowerCase().includes(query) ||
      student.class.toLowerCase().includes(query)
    );
  });

  // Get filtered classes
  const filteredClasses = classes.filter((className) =>
    filteredStudents.some((s) => s.class === className)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold mb-2">My Classes</h2>
          <p className="text-muted-foreground">
            Overview of all your classes and students
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search students or classes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Class Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredClasses.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {searchQuery && filteredClasses.length !== classes.length
                ? `of ${classes.length} total`
                : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredStudents.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {searchQuery && filteredStudents.length !== students.length
                ? `of ${students.length} total`
                : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Attendance</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredStudents.length > 0
                ? (filteredStudents.reduce((sum, s) => sum + (s.attendance_rate || 0), 0) / filteredStudents.length).toFixed(1)
                : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Classes List */}
      <div className="grid gap-6">
        {filteredClasses.map((className) => {
          const classStudents = filteredStudents.filter(s => s.class === className);
          const avgAttendance = classStudents.length > 0
            ? (classStudents.reduce((sum, s) => sum + (s.attendance_rate || 0), 0) / classStudents.length).toFixed(1)
            : 0;

          return (
            <Card key={className}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{className}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-normal text-muted-foreground">
                      {classStudents.length} students
                    </span>
                    <Button
                      size="sm"
                      onClick={() => handleTakeAttendance(className)}
                      className="ml-2"
                    >
                      <ClipboardCheck className="h-4 w-4 mr-2" />
                      Take Attendance
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>
                  Average Attendance: {avgAttendance}%
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {classStudents.map((student) => (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() => handleStudentClick(student)}
                      className="text-left p-3 border rounded-lg hover:bg-muted/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                      <div className="font-medium">
                        {student.name} {student.surname}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Attendance: {student.attendance_rate?.toFixed(1) || 0}%
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Sessions left: {student.sessions_left || 0}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {students.length === 0 && !searchQuery && (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No students yet</h3>
            <p className="text-muted-foreground">
              Students will appear here once they are assigned to your classes
            </p>
          </CardContent>
        </Card>
      )}

      {filteredStudents.length === 0 && searchQuery && (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No results found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search query
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setSearchQuery('')}
            >
              Clear Search
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Attendance Dialog */}
      <TakeAttendanceDialog
        open={attendanceDialogOpen}
        onOpenChange={setAttendanceDialogOpen}
        className={selectedClass}
        teacherId={teacherId}
        students={students.filter((s) => s.class === selectedClass)}
        onAttendanceSaved={handleAttendanceSaved}
      />

      <StudentDashboardModal
        open={dashboardOpen}
        onOpenChange={handleDashboardOpenChange}
        studentId={selectedStudentId}
        studentName={selectedStudentName}
      />
    </div>
  );
};

export default MyClasses;
