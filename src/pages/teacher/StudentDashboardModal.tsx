import { useEffect, useMemo, useState } from 'react';
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
import { Calendar, TrendingUp, Target, Award, User, MapPin, BookOpen, Phone } from 'lucide-react';
import SkillsProgress from '@/pages/student/SkillsProgress';
import AssessmentProgress from '@/pages/student/AssessmentProgress';
import AttendanceChart from '@/pages/student/AttendanceChart';
import HomeworkList from '@/pages/student/HomeworkList';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';

interface StudentDashboardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId?: string | null;
  studentName?: string;
}

type DashboardStudent = Tables<'dashboard_students'>;
type SkillsEvaluationRecord = Tables<'skills_evaluation'>;
type AssessmentRecord = Tables<'assessment'>;

interface RadarDataPoint {
  subject: string;
  score: number;
  fullMark: number;
}

export function StudentDashboardModal({
  open,
  onOpenChange,
  studentId,
  studentName,
}: StudentDashboardModalProps) {
  const [studentData, setStudentData] = useState<DashboardStudent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skillsRadarData, setSkillsRadarData] = useState<RadarDataPoint[]>([]);
  const [recentAssessments, setRecentAssessments] = useState<AssessmentRecord[]>([]);

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

        if (!data) {
          setSkillsRadarData([]);
          setRecentAssessments([]);
          return;
        }

        const { data: skillsData, error: skillsError } = await supabase
          .from('skills_evaluation')
          .select('*')
          .eq('student_id', studentId)
          .order('evaluation_date', { ascending: false })
          .limit(20);

        if (skillsError) {
          console.error('Failed to load skills data:', skillsError);
        }

        if (skillsData) {
          const typedSkills = skillsData as SkillsEvaluationRecord[];
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

          if (isMounted) {
            setSkillsRadarData(radarData);
          }
        }

        const { data: assessmentsData, error: assessmentsError } = await supabase
          .from('assessment')
          .select('*')
          .eq('student_id', studentId)
          .eq('published', true)
          .order('assessment_date', { ascending: false })
          .limit(5);

        if (assessmentsError) {
          console.error('Failed to load assessments:', assessmentsError);
        }

        if (isMounted) {
          setRecentAssessments((assessmentsData as AssessmentRecord[]) ?? []);
        }
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

  const averageAssessmentScore = useMemo(() => {
    if (!recentAssessments.length) return 0;
    const total = recentAssessments.reduce((acc, assessment) => acc + (assessment.total_score ?? 0), 0);
    return total / recentAssessments.length;
  }, [recentAssessments]);

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

              <Card className="border-l-4 border-l-orange-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Overall Performance</CardTitle>
                  <Award className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">
                    {recentAssessments.length > 0 ? averageAssessmentScore.toFixed(1) : 'N/A'}
                  </div>
                  <Progress
                    value={recentAssessments.length > 0 ? (averageAssessmentScore / 5) * 100 : 0}
                    className="mt-2 h-2"
                  />
                  <p className="text-xs text-muted-foreground mt-2">average assessment score</p>
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

            {skillsRadarData.length > 0 && (
              <Card className="overflow-hidden border-none bg-gradient-to-br from-slate-50/90 via-white/70 to-white/90 dark:from-slate-900/60 dark:via-slate-900/40 dark:to-slate-900/60 shadow-xl backdrop-blur-xl">
                <CardHeader>
                  <CardTitle>Skills Overview</CardTitle>
                  <CardDescription>Performance across skill categories</CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.18),transparent_65%)]" />
                  <ResponsiveContainer width="100%" height={350}>
                    <RadarChart data={skillsRadarData}>
                      <defs>
                        <radialGradient id="teacherRadarFill" cx="50%" cy="50%" r="65%">
                          <stop offset="0%" stopColor="rgba(59,130,246,0.35)" />
                          <stop offset="100%" stopColor="rgba(139,92,246,0)" />
                        </radialGradient>
                        <linearGradient id="teacherRadarStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#38bdf8" />
                          <stop offset="100%" stopColor="#a855f7" />
                        </linearGradient>
                      </defs>
                      <PolarGrid stroke="rgba(148, 163, 184, 0.3)" radialLines={false} />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: 'rgba(71,85,105,0.85)', fontSize: 12, fontWeight: 500 }}
                      />
                      <PolarRadiusAxis
                        angle={90}
                        domain={[0, 5]}
                        tick={{ fill: 'rgba(100,116,139,0.65)', fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Radar
                        name="Score"
                        dataKey="score"
                        stroke="url(#teacherRadarStroke)"
                        fill="url(#teacherRadarFill)"
                        strokeWidth={3}
                        fillOpacity={1}
                      />
                      <Tooltip
                        cursor={false}
                        wrapperStyle={{ outline: 'none' }}
                        contentStyle={{
                          backgroundColor: 'rgba(15,23,42,0.85)',
                          borderRadius: 16,
                          border: 'none',
                          color: '#e2e8f0',
                          boxShadow: '0 20px 45px -25px rgba(15,23,42,0.7)',
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {effectiveStudentId && (
              <Tabs defaultValue="skills" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="skills">Skills Progress</TabsTrigger>
                  <TabsTrigger value="assessments">Assessments</TabsTrigger>
                  <TabsTrigger value="attendance">Attendance</TabsTrigger>
                  <TabsTrigger value="homework">Homework</TabsTrigger>
                </TabsList>

                <TabsContent value="skills" className="space-y-4">
                  <SkillsProgress studentId={effectiveStudentId} />
                </TabsContent>

                <TabsContent value="assessments" className="space-y-4">
                  <AssessmentProgress studentId={effectiveStudentId} />
                </TabsContent>

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
