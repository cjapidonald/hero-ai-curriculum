
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Target, Calendar, BookOpen, MapPin, Phone, User } from "lucide-react";
import AttendanceChart from "@/pages/student/AttendanceChart";
import HomeworkList from "@/pages/student/HomeworkList";
import type { Tables } from "@/integrations/supabase/types";

type DashboardStudent = Tables<"dashboard_students">;
interface StudentDashboardViewerProps {
    studentId: string;
}

export default function StudentDashboardViewer({ studentId }: StudentDashboardViewerProps) {
  const [studentData, setStudentData] = useState<DashboardStudent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        if (!studentId) {
          throw new Error("Missing student ID");
        }

        const { data, error } = await supabase
          .from("dashboard_students")
          .select("*")
          .eq("id", studentId)
          .single();

        if (error) throw error;
        if (!data) {
          setStudentData(null);
          return;
        }

        const student = data as DashboardStudent;
        setStudentData(student);
      } catch (error) {
        console.error("Error fetching student data:", error);
      } finally {
        setLoading(false);
      }
    };

    void fetchStudentData();
  }, [studentId]);

  if (loading) {
    return (
      <div className="min-h-[280px] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading student dashboard...</p>
        </div>
      </div>
    );
  }

  if (!studentData) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <p className="text-lg font-semibold">No student profile found.</p>
      </div>
    );
  }

  const calculateAge = (birthday: string | null) => {
    if (!birthday) return "N/A";
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const placementScoreValue = (score?: string | null) => {
    switch (score) {
      case "B1":
        return 75;
      case "A2":
        return 50;
      case "A1":
        return 25;
      default:
        return 0;
    }
  };

  const attendanceRate = Number(studentData.attendance_rate ?? 0);
  const sessionsCompleted = Number(studentData.sessions ?? 0);
  const sessionsLeft = Number(studentData.sessions_left ?? 0);

  return (
    <div className="h-full w-full bg-gradient-to-b from-background via-muted/30 to-background">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6">
        {/* Student Profile Card */}
        <Card className="overflow-hidden border-2">
          <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20" />
          <CardContent className="pt-0">
            <div className="flex flex-col md:flex-row gap-6 -mt-12">
              <div className="flex flex-col items-center md:items-start">
                {studentData.profile_image_url ? (
                  <img
                    src={studentData.profile_image_url}
                    alt={`${studentData.name} ${studentData.surname}`}
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
                <h2 className="text-2xl font-bold mb-1">
                  {studentData.name} {studentData.surname}
                </h2>
                <p className="text-muted-foreground mb-4">{studentData.email}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Age</p>
                      <p className="font-medium">{calculateAge(studentData.birthday)} years old</p>
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
                      <p className="font-medium">{studentData.location || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Parent Contact</p>
                      <p className="font-medium text-xs">{studentData.parent_zalo_nr}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              <Calendar className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {studentData.attendance_rate ? `${Number(studentData.attendance_rate).toFixed(1)}%` : "N/A"}
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
              <div className="text-3xl font-bold text-purple-600">{studentData.level || "N/A"}</div>
              <p className="text-xs text-muted-foreground mt-2">English proficiency</p>
              <div className="mt-2">
                <Badge variant="secondary" className="text-xs">
                  {studentData.gender || "Student"}
                </Badge>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Placement Test Results */}
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
                  <Badge variant="outline">{studentData.placement_test_speaking || "N/A"}</Badge>
                </div>
                <Progress value={placementScoreValue(studentData.placement_test_speaking)} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Listening</span>
                  <Badge variant="outline">{studentData.placement_test_listening || "N/A"}</Badge>
                </div>
                <Progress value={placementScoreValue(studentData.placement_test_listening)} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Reading</span>
                  <Badge variant="outline">{studentData.placement_test_reading || "N/A"}</Badge>
                </div>
                <Progress value={placementScoreValue(studentData.placement_test_reading)} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Writing</span>
                  <Badge variant="outline">{studentData.placement_test_writing || "N/A"}</Badge>
                </div>
                <Progress value={placementScoreValue(studentData.placement_test_writing)} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="attendance" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="homework">Homework</TabsTrigger>
          </TabsList>

          <TabsContent value="attendance" className="space-y-4">
            <AttendanceChart
              studentId={studentId}
              attendanceRate={attendanceRate}
              sessionsCompleted={sessionsCompleted}
            />
          </TabsContent>

          <TabsContent value="homework" className="space-y-4">
            <HomeworkList studentId={studentId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
