import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LogOut, TrendingUp, Target, Calendar, BookOpen, Award, MapPin, Phone, User, MessageCircle, FileText, HelpCircle } from "lucide-react";
import SkillsProgress from "./SkillsProgress";
import AssessmentProgress from "./AssessmentProgress";
import AttendanceChart from "./AttendanceChart";
import HomeworkList from "./HomeworkList";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from "recharts";
import type { Tables } from "@/integrations/supabase/types";
import { DashboardSkeleton } from "@/components/ui/skeleton-loader";
import { NotificationCenter } from "@/components/NotificationCenter";
import { ProfileEditor } from "@/components/ProfileEditor";

type DashboardStudent = Tables<"dashboard_students">;
type SkillsEvaluationRecord = Tables<"skills_evaluation">;
type AssessmentRecord = Tables<"assessment">;

interface RadarDataPoint {
  subject: string;
  score: number;
  fullMark: number;
}

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const studentId = user?.id;
  const [studentData, setStudentData] = useState<DashboardStudent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentSkills, setRecentSkills] = useState<SkillsEvaluationRecord[]>([]);
  const [recentAssessments, setRecentAssessments] = useState<AssessmentRecord[]>([]);
  const [skillsRadarData, setSkillsRadarData] = useState<RadarDataPoint[]>([]);

  const fetchStudentData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      if (!user?.email) {
        throw new Error("Missing user email");
      }

      const { data, error: studentError } = await supabase
        .from("dashboard_students")
        .select("*")
        .eq("email", user.email)
        .single();

      if (studentError) throw new Error(`Failed to fetch student profile: ${studentError.message}`);
      if (!data) {
        setStudentData(null);
        setLoading(false);
        return;
      }

      const student = data as DashboardStudent;
      setStudentData(student);

      const { data: skillsData, error: skillsError } = await supabase
        .from("skills_evaluation")
        .select("*")
        .eq("student_id", student.id)
        .order("evaluation_date", { ascending: false })
        .limit(20);

      if (skillsError) {
        console.error('Error loading skills:', skillsError);
        setError(`Warning: Could not load skills data. ${skillsError.message}`);
      }

      if (skillsData) {
        const typedSkills = skillsData as SkillsEvaluationRecord[];
        setRecentSkills(typedSkills);

        const categoryAverages = typedSkills.reduce<Record<string, { total: number; count: number }>>((acc, skill) => {
          if (!skill.skill_category) {
            return acc;
          }

          const categoryKey = skill.skill_category;
          if (!acc[categoryKey]) {
            acc[categoryKey] = { total: 0, count: 0 };
          }

          acc[categoryKey].total += skill.average_score ?? 0;
          acc[categoryKey].count += 1;
          return acc;
        }, {});

        const radarData: RadarDataPoint[] = Object.entries(categoryAverages).map(([category, aggregate]) => ({
          subject: category,
          score: aggregate.count ? Number((aggregate.total / aggregate.count).toFixed(2)) : 0,
          fullMark: 5,
        }));
        setSkillsRadarData(radarData);
      }

      const { data: assessmentsData, error: assessmentsError } = await supabase
        .from("assessment")
        .select("*")
        .eq("student_id", student.id)
        .eq("published", true)
        .order("assessment_date", { ascending: false })
        .limit(5);

      if (assessmentsError) {
        console.error('Error loading assessments:', assessmentsError);
        setError(`Warning: Could not load assessment data. ${assessmentsError.message}`);
      }

      if (assessmentsData) {
        setRecentAssessments(assessmentsData as AssessmentRecord[]);
      }
    } catch (error: any) {
      console.error("Error fetching student data:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user || user.role !== "student") {
      navigate("/login");
      return;
    }

    if (!studentId) {
      return;
    }

    void fetchStudentData();
  }, [fetchStudentData, navigate, studentId, user]);

  useEffect(() => {
    if (!studentData?.id) {
      return;
    }

    const skillsChannel = supabase
      .channel('student-skills-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'skills_evaluation',
          filter: `student_id=eq.${studentData.id}`,
        },
        () => {
          void fetchStudentData();
        }
      )
      .subscribe();

    const assessmentChannel = supabase
      .channel('student-assessment-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assessment',
          filter: `student_id=eq.${studentData.id}`,
        },
        () => {
          void fetchStudentData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(skillsChannel);
      supabase.removeChannel(assessmentChannel);
    };
  }, [fetchStudentData, studentData?.id]);

  const averageAssessmentScore = useMemo(() => {
    if (!recentAssessments.length) return 0;
    const total = recentAssessments.reduce((acc, assessment) => acc + (assessment.total_score ?? 0), 0);
    return total / recentAssessments.length;
  }, [recentAssessments]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-background">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full animate-pulse bg-muted" />
              <div className="space-y-2">
                <div className="h-6 w-48 animate-pulse rounded bg-muted" />
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              </div>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-lg font-semibold text-destructive">Failed to load dashboard</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  if (!studentData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-lg font-semibold">No student profile found.</p>
          <Button variant="outline" onClick={() => navigate("/login")}>
            Return to Login
          </Button>
        </div>
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

  const dashboardStudentId = studentData.id;
  const attendanceRate = Number(studentData.attendance_rate ?? 0);
  const sessionsCompleted = Number(studentData.sessions ?? 0);
  const sessionsLeft = Number(studentData.sessions_left ?? 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {studentData.profile_image_url ? (
              <img
                src={studentData.profile_image_url}
                alt={`${user?.name} ${user?.surname}`}
                className="w-14 h-14 rounded-full border-2 border-primary/20 object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center border-2 border-primary/20">
                <span className="text-lg font-semibold text-white">
                  {user?.name?.[0]}
                  {user?.surname?.[0]}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">Welcome, {user?.name}!</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{studentData.class}</span>
                <span>•</span>
                <Badge variant="outline" className="text-xs">
                  {studentData.level}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ProfileEditor userType="student" />
            <NotificationCenter />
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Student Profile Card */}
        <Card className="mb-6 overflow-hidden border-2">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Performance</CardTitle>
              <Award className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {recentAssessments.length > 0 ? averageAssessmentScore.toFixed(1) : "N/A"}
              </div>
              <Progress
                value={recentAssessments.length > 0 ? (averageAssessmentScore / 5) * 100 : 0}
                className="mt-2 h-2"
              />
              <p className="text-xs text-muted-foreground mt-2">average assessment score</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and helpful links</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                <MessageCircle className="h-5 w-5" />
                <span className="text-sm">Contact Teacher</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                <FileText className="h-5 w-5" />
                <span className="text-sm">Submit Homework</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                <HelpCircle className="h-5 w-5" />
                <span className="text-sm">Get Help</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Placement Test Results */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Placement Test Results</CardTitle>
            <CardDescription>Your initial assessment scores across key skill areas</CardDescription>
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

        {/* Skills Overview Radar Chart */}
        {skillsRadarData.length > 0 && (
          <Card className="mb-6 overflow-hidden border-none bg-gradient-to-br from-slate-50/90 via-white/70 to-white/90 dark:from-slate-900/60 dark:via-slate-900/40 dark:to-slate-900/60 shadow-xl backdrop-blur-xl">
            <CardHeader>
              <CardTitle>Skills Overview</CardTitle>
              <CardDescription>Your current performance across all skill categories</CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.18),transparent_65%)]" />
              <ResponsiveContainer width="100%" height={350}>
                <RadarChart data={skillsRadarData}>
                  <defs>
                    <radialGradient id="radarFill" cx="50%" cy="50%" r="65%">
                      <stop offset="0%" stopColor="rgba(59,130,246,0.35)" />
                      <stop offset="100%" stopColor="rgba(139,92,246,0)" />
                    </radialGradient>
                    <linearGradient id="radarStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>
                  <PolarGrid stroke="rgba(148, 163, 184, 0.3)" radialLines={false} />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: "rgba(71,85,105,0.85)", fontSize: 12, fontWeight: 500 }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 5]}
                    tick={{ fill: "rgba(100,116,139,0.65)", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="url(#radarStroke)"
                    fill="url(#radarFill)"
                    strokeWidth={3}
                    fillOpacity={1}
                  />
                  <Tooltip
                    cursor={false}
                    wrapperStyle={{ outline: "none" }}
                    contentStyle={{
                      backgroundColor: "rgba(15,23,42,0.85)",
                      borderRadius: 16,
                      border: "none",
                      color: "#e2e8f0",
                      boxShadow: "0 20px 45px -25px rgba(15,23,42,0.7)",
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="skills" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="skills">Skills Progress</TabsTrigger>
            <TabsTrigger value="assessments">Assessments</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="homework">Homework</TabsTrigger>
          </TabsList>

          <TabsContent value="skills" className="space-y-4">
            <SkillsProgress studentId={dashboardStudentId} />
          </TabsContent>

          <TabsContent value="assessments" className="space-y-4">
            <AssessmentProgress studentId={dashboardStudentId} />
          </TabsContent>

          <TabsContent value="attendance" className="space-y-4">
            <AttendanceChart
              studentId={dashboardStudentId}
              attendanceRate={attendanceRate}
              sessionsCompleted={sessionsCompleted}
            />
          </TabsContent>

          <TabsContent value="homework" className="space-y-4">
            <HomeworkList studentId={dashboardStudentId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
