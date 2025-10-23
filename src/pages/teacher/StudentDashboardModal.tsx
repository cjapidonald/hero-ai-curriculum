import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, TrendingUp, Target, User, MapPin, BookOpen, Phone } from 'lucide-react';
import AttendanceChart from '@/pages/student/AttendanceChart';
import HomeworkList from '@/pages/student/HomeworkList';

interface StudentDashboardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId?: string | null;
  studentName?: string;
}

type DashboardStudent = Tables<'dashboard_students'>;
export function StudentDashboardModal({
  open,
  onOpenChange,
  studentId,
  studentName,
}: StudentDashboardModalProps) {
  const [studentData, setStudentData] = useState<DashboardStudent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchStudentData = async () => {
      if (!studentId || !open) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data, error: studentError } = await supabase
          .from('dashboard_students')
          .select('*')
          .eq('id', studentId)
          .single();

        if (studentError) {
          throw new Error(studentError.message);
        }

        if (!isMounted) {
          return;
        }

        setStudentData((data as DashboardStudent) ?? null);
      } catch (fetchError) {
        console.error('Error loading student dashboard:', fetchError);
        if (isMounted) {
          setError(fetchError instanceof Error ? fetchError.message : 'Failed to load student data');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void fetchStudentData();

    return () => {
      isMounted = false;
    };
  }, [open, studentId]);

  const placementScoreValue = (score?: string | null) => {
    switch (score) {
      case 'B1':
        return 75;
      case 'A2':
        return 50;
      case 'A1':
        return 25;
      default:
        return 0;
    }
  };

  const attendanceRate = Number(studentData?.attendance_rate ?? 0);
  const sessionsCompleted = Number(studentData?.sessions ?? 0);
  const sessionsLeft = Number(studentData?.sessions_left ?? 0);
  const effectiveStudentId = studentId ?? studentData?.id ?? '';

  const resolvedName = studentData
    ? `${studentData.name} ${studentData.surname}`
    : studentName ?? 'Student';

  const resolvedEmail = studentData?.email ?? '';

  const dialogTitle = loading ? 'Loading student dashboard...' : resolvedName;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            {studentData?.class ? `Class: ${studentData.class}` : 'View student progress details'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-6 py-6">
            <Skeleton className="h-40 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-32 w-full" />
              ))}
            </div>
            <Skeleton className="h-80 w-full" />
          </div>
        ) : error ? (
          <div className="py-12 text-center text-destructive">{error}</div>
        ) : !studentData ? (
          <div className="py-12 text-center text-muted-foreground">No student information available.</div>
        ) : (
          <div className="space-y-6 py-4">
            <Card className="overflow-hidden border-2">
              <div className="h-20 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20" />
              <CardContent className="pt-0">
                <div className="flex flex-col md:flex-row gap-6 -mt-10">
                  <div className="flex flex-col items-center md:items-start">
                    {studentData.profile_image_url ? (
                      <img
                        src={studentData.profile_image_url}
                        alt={resolvedName}
                        className="w-24 h-24 rounded-full border-4 border-background object-cover shadow-lg"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center border-4 border-background shadow-lg">
                        <span className="text-3xl font-semibold text-white">
                          {studentData.name?.[0]}
                          {studentData.surname?.[0]}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 pt-4">
                    <h2 className="text-2xl font-bold mb-1">{resolvedName}</h2>
                    <p className="text-muted-foreground mb-4">{resolvedEmail}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Level</p>
                          <p className="font-medium">{studentData.level || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Class</p>
                          <p className="font-medium">{studentData.class}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Location</p>
                          <p className="font-medium">{studentData.location || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Parent Contact</p>
                          <p className="font-medium text-xs">{studentData.parent_zalo_nr || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                  <Calendar className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {studentData.attendance_rate ? `${Number(studentData.attendance_rate).toFixed(1)}%` : 'N/A'}
                  </div>
                  <Progress value={attendanceRate} className="mt-2 h-2" />
                  <p className="text-xs text-muted-foreground mt-2">{sessionsCompleted} sessions completed</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Sessions Left</CardTitle>
                  <Target className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{sessionsLeft}</div>
                  <Progress
                    value={sessionsLeft + sessionsCompleted ? (sessionsLeft / (sessionsLeft + sessionsCompleted)) * 100 : 0}
                    className="mt-2 h-2"
                  />
                  <p className="text-xs text-muted-foreground mt-2">remaining this term</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Current Level</CardTitle>
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">{studentData.level || 'N/A'}</div>
                  <p className="text-xs text-muted-foreground mt-2">English proficiency</p>
                  <div className="mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {studentData.gender || 'Student'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

            </div>

            <Card>
              <CardHeader>
                <CardTitle>Placement Test Results</CardTitle>
                <CardDescription>Initial assessment scores across key skill areas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Speaking</span>
                      <Badge variant="outline">{studentData.placement_test_speaking || 'N/A'}</Badge>
                    </div>
                    <Progress value={placementScoreValue(studentData.placement_test_speaking)} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Listening</span>
                      <Badge variant="outline">{studentData.placement_test_listening || 'N/A'}</Badge>
                    </div>
                    <Progress value={placementScoreValue(studentData.placement_test_listening)} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Reading</span>
                      <Badge variant="outline">{studentData.placement_test_reading || 'N/A'}</Badge>
                    </div>
                    <Progress value={placementScoreValue(studentData.placement_test_reading)} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Writing</span>
                      <Badge variant="outline">{studentData.placement_test_writing || 'N/A'}</Badge>
                    </div>
                    <Progress value={placementScoreValue(studentData.placement_test_writing)} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {effectiveStudentId && (
              <Tabs defaultValue="attendance" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="attendance">Attendance</TabsTrigger>
                  <TabsTrigger value="homework">Homework</TabsTrigger>
                </TabsList>

                <TabsContent value="attendance" className="space-y-4">
                  <AttendanceChart
                    studentId={effectiveStudentId}
                    attendanceRate={attendanceRate}
                    sessionsCompleted={sessionsCompleted}
                  />
                </TabsContent>

                <TabsContent value="homework" className="space-y-4">
                  <HomeworkList studentId={effectiveStudentId} />
                </TabsContent>
              </Tabs>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default StudentDashboardModal;
