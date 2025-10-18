import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, Clock } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  surname: string;
  class: string;
  attendance_rate: number;
}

interface MyClassesProps {
  teacherId: string;
}

const MyClasses = ({ teacherId }: MyClassesProps) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<string[]>([]);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('dashboard_students')
      .select('*')
      .eq('is_active', true)
      .order('class', { ascending: true })
      .order('name', { ascending: true });

    if (data) {
      setStudents(data);
      const uniqueClasses = [...new Set(data.map(s => s.class).filter(Boolean))];
      setClasses(uniqueClasses);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="text-center py-8">Loading your classes...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">My Classes</h2>
        <p className="text-muted-foreground">
          Overview of all your classes and students
        </p>
      </div>

      {/* Class Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classes.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Attendance</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {students.length > 0
                ? (students.reduce((sum, s) => sum + (s.attendance_rate || 0), 0) / students.length).toFixed(1)
                : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Classes List */}
      <div className="grid gap-6">
        {classes.map((className) => {
          const classStudents = students.filter(s => s.class === className);
          const avgAttendance = classStudents.length > 0
            ? (classStudents.reduce((sum, s) => sum + (s.attendance_rate || 0), 0) / classStudents.length).toFixed(1)
            : 0;

          return (
            <Card key={className}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{className}</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {classStudents.length} students
                  </span>
                </CardTitle>
                <CardDescription>
                  Average Attendance: {avgAttendance}%
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {classStudents.map((student) => (
                    <div
                      key={student.id}
                      className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="font-medium">
                        {student.name} {student.surname}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Attendance: {student.attendance_rate?.toFixed(1) || 0}%
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {students.length === 0 && (
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
    </div>
  );
};

export default MyClasses;
