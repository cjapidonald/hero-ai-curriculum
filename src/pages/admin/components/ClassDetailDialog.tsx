import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/hooks/use-theme";
import { useChartTheme, getTooltipStyles } from "@/lib/chart-theme";
import {
  BookOpen,
  GraduationCap,
  Loader2,
  PieChart as PieChartIcon,
  Plus,
  RefreshCw,
  Trash2,
  Users,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ClassRecord {
  id: string;
  class_name: string;
  teacher_name: string | null;
  teacher_id: string | null;
  stage: string | null;
  schedule_days: string[] | null;
  schedule: string | null;
  start_time: string | null;
  end_time: string | null;
  current_students: number | null;
  max_students: number | null;
  is_active: boolean | null;
  classroom_location: string | null;
  level?: string | null;
}

interface EnrollmentRow {
  id: string;
  student_id: string;
  enrollment_date: string | null;
  is_active: boolean | null;
}

interface StudentRow {
  id: string;
  name: string;
  surname: string;
  class: string | null;
  level: string | null;
  attendance_rate: number | null;
  sessions_left: number | null;
}

interface StudentWithEnrollment extends StudentRow {
  enrollment_id: string | null;
  enrollment_date: string | null;
}

interface CurriculumLesson {
  id: string;
  lesson_title: string;
  lesson_date: string | null;
  stage: string | null;
  class_id: string | null;
  class: string | null;
}

interface TeacherOption {
  id: string;
  name: string;
  surname: string | null;
}

interface ClassDetailDialogProps {
  classId: string | null;
  open: boolean;
  onClose: () => void;
  onRefreshRequested?: () => void;
}

const stageOptions = [
  { value: "stage_1", label: "Stage 1" },
  { value: "stage_2", label: "Stage 2" },
  { value: "stage_3", label: "Stage 3" },
  { value: "stage_4", label: "Stage 4" },
  { value: "stage_5", label: "Stage 5" },
  { value: "stage_6", label: "Stage 6" },
];

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const formatDate = (value: string | null) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

const mapStageLabel = (stage?: string | null) => {
  if (!stage) return "Unassigned";
  const match = stageOptions.find((item) => item.value === stage);
  return match ? match.label : stage;
};

export function ClassDetailDialog({
  classId,
  open,
  onClose,
  onRefreshRequested,
}: ClassDetailDialogProps) {
  const { toast } = useToast();
  const { isDark } = useTheme();
  const chartTheme = useChartTheme(isDark);
  const tooltipStyles = getTooltipStyles(isDark);

  const [activeTab, setActiveTab] = useState<"overview" | "students" | "curriculum" | "settings">(
    "overview",
  );
  const [loading, setLoading] = useState(false);
  const [classInfo, setClassInfo] = useState<ClassRecord | null>(null);
  const [students, setStudents] = useState<StudentWithEnrollment[]>([]);
  const [availableStudents, setAvailableStudents] = useState<StudentRow[]>([]);
  const [scoreTrend, setScoreTrend] = useState<{ date: string; score: number }[]>([]);
  const [skillBreakdown, setSkillBreakdown] = useState<{ skill: string; average: number }[]>([]);
  const [curriculum, setCurriculum] = useState<CurriculumLesson[]>([]);
  const [availableCurriculum, setAvailableCurriculum] = useState<CurriculumLesson[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);

  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [studentMutationLoading, setStudentMutationLoading] = useState(false);
  const [selectedCurriculumId, setSelectedCurriculumId] = useState("");
  const [curriculumMutationLoading, setCurriculumMutationLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    class_name: "",
    teacher_id: "",
    teacher_name: "",
    stage: "stage_1",
    schedule_days: [] as string[],
    start_time: "",
    end_time: "",
    max_students: 15,
    classroom_location: "",
    is_active: true,
    level: "",
    schedule: "",
  });

  const classAverageScore = useMemo(() => {
    if (scoreTrend.length === 0) return null;
    const total = scoreTrend.reduce((sum, entry) => sum + entry.score, 0);
    return Number((total / scoreTrend.length).toFixed(1));
  }, [scoreTrend]);

  const highestScore = useMemo(() => {
    if (scoreTrend.length === 0) return null;
    return Math.max(...scoreTrend.map((entry) => entry.score));
  }, [scoreTrend]);

  const lowestScore = useMemo(() => {
    if (scoreTrend.length === 0) return null;
    return Math.min(...scoreTrend.map((entry) => entry.score));
  }, [scoreTrend]);

  const refreshParent = useCallback(() => {
    if (onRefreshRequested) {
      onRefreshRequested();
    }
  }, [onRefreshRequested]);

  const loadStudents = useCallback(
    async (classRecord: ClassRecord) => {
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from("enrollments")
        .select("id, student_id, enrollment_date, is_active")
        .eq("class_id", classRecord.id);

      if (enrollmentError) throw enrollmentError;

      const enrollments = (enrollmentData as EnrollmentRow[]) || [];
      if (enrollments.length === 0) {
        setStudents([]);
      } else {
        const studentIds = enrollments.map((row) => row.student_id);
        const { data: studentData, error: studentError } = await supabase
          .from("dashboard_students")
          .select(
            "id, name, surname, class, level, attendance_rate, sessions_left",
          )
          .in("id", studentIds);

        if (studentError) throw studentError;

        const byId = new Map(enrollments.map((row) => [row.student_id, row]));
        const merged = (studentData as StudentRow[]).map((student) => {
          const enrollment = byId.get(student.id);
          return {
            ...student,
            enrollment_id: enrollment?.id ?? null,
            enrollment_date: enrollment?.enrollment_date ?? null,
          };
        });

        merged.sort((a, b) => a.name.localeCompare(b.name));
        setStudents(merged);
      }

      const { data: availableData, error: availableError } = await supabase
        .from("dashboard_students")
        .select("id, name, surname, class, level, attendance_rate, sessions_left")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (availableError) throw availableError;

      const available =
        (availableData as StudentRow[]).filter((student) => !enrollments.find((row) => row.student_id === student.id)) ||
        [];
      setAvailableStudents(available);
    },
    [],
  );

  const loadPerformance = useCallback(
    async (classRecord: ClassRecord) => {
      const { data: assessmentData, error: assessmentError } = await supabase
        .from("assessment")
        .select("assessment_date, total_score")
        .eq("class", classRecord.class_name)
        .order("assessment_date", { ascending: true });

      if (assessmentError) throw assessmentError;

      const timeline =
        (assessmentData || []).map((item) => ({
          date: formatDate(item.assessment_date),
          score: Number(item.total_score) || 0,
        })) ?? [];
      setScoreTrend(timeline);

      const { data: skillsData, error: skillsError } = await supabase.rpc(
        "get_class_skill_overview",
        {
          p_class_id: classRecord.id,
        }
      );

      if (skillsError) throw skillsError;

      const subjectMap = new Map<string, { total: number; count: number }>();
      (skillsData ?? []).forEach((row: any) => {
        const subjectLabel = row.subject || row.skill_name || "Unspecified";
        if (row.average_score === null || row.average_score === undefined) {
          return;
        }

        const bucket = subjectMap.get(subjectLabel) ?? { total: 0, count: 0 };
        bucket.total += Number(row.average_score);
        bucket.count += 1;
        subjectMap.set(subjectLabel, bucket);
      });

      const breakdown = Array.from(subjectMap.entries()).map(([label, bucket]) => ({
        skill: label,
        average: bucket.count ? Number((bucket.total / bucket.count).toFixed(1)) : 0,
      }));

      breakdown.sort((a, b) => b.average - a.average);
      setSkillBreakdown(breakdown);
    },
    [],
  );

  const loadCurriculum = useCallback(
    async (classRecord: ClassRecord) => {
      const { data: assignedData, error: assignedError } = await supabase
        .from("curriculum")
        .select("id, lesson_title, lesson_date, stage, class_id, class")
        .eq("class_id", classRecord.id)
        .order("lesson_date", { ascending: true });

      if (assignedError) throw assignedError;

      setCurriculum((assignedData as CurriculumLesson[]) || []);

      const { data: unassignedData, error: unassignedError } = await supabase
        .from("curriculum")
        .select("id, lesson_title, lesson_date, stage, class_id, class")
        .is("class_id", null)
        .order("lesson_title", { ascending: true });

      if (unassignedError) throw unassignedError;

      setAvailableCurriculum((unassignedData as CurriculumLesson[]) || []);
    },
    [],
  );

  const loadClassDetails = useCallback(async () => {
    if (!open || !classId) return;

    try {
      setLoading(true);

      const { data: classData, error: classError } = await supabase
        .from("classes")
        .select("*")
        .eq("id", classId)
        .single();

      if (classError) throw classError;
      const classRecord = classData as ClassRecord;
      setClassInfo(classRecord);
      setSettingsForm({
        class_name: classRecord.class_name,
        teacher_id: classRecord.teacher_id || "",
        teacher_name: classRecord.teacher_name || "",
        stage: classRecord.stage || "stage_1",
        schedule_days: classRecord.schedule_days || [],
        start_time: classRecord.start_time || "",
        end_time: classRecord.end_time || "",
        max_students: classRecord.max_students || 15,
        classroom_location: classRecord.classroom_location || "",
        is_active: classRecord.is_active !== false,
        level: classRecord.level || "",
        schedule: classRecord.schedule || "",
      });

      await Promise.all([
        loadStudents(classRecord),
        loadPerformance(classRecord),
        loadCurriculum(classRecord),
      ]);
    } catch (error: any) {
      console.error("Error loading class details:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load class details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [classId, open, loadCurriculum, loadPerformance, loadStudents, toast]);

  useEffect(() => {
    loadClassDetails();
  }, [loadClassDetails]);

  useEffect(() => {
    if (!open) {
      setActiveTab("overview");
      setSelectedStudentId("");
      setSelectedCurriculumId("");
    }
  }, [open]);

  const handleAddStudent = async () => {
    if (!classInfo || !selectedStudentId) return;

    try {
      setStudentMutationLoading(true);
      const now = new Date().toISOString();

      const { error: enrollmentError } = await supabase.from("enrollments").insert([
        {
          class_id: classInfo.id,
          student_id: selectedStudentId,
          enrollment_date: now,
          is_active: true,
        },
      ]);

      if (enrollmentError) throw enrollmentError;

      const { error: studentUpdateError } = await supabase
        .from("dashboard_students")
        .update({ class: classInfo.class_name })
        .eq("id", selectedStudentId);

      if (studentUpdateError) throw studentUpdateError;

      const updatedCount = (students.length || 0) + 1;
      const { error: classUpdateError } = await supabase
        .from("classes")
        .update({ current_students: updatedCount })
        .eq("id", classInfo.id);

      if (classUpdateError) throw classUpdateError;

      toast({
        title: "Student added",
        description: "The student has been enrolled in this class.",
      });

      setSelectedStudentId("");
      await loadClassDetails();
      refreshParent();
    } catch (error: any) {
      console.error("Error adding student to class:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add student",
        variant: "destructive",
      });
    } finally {
      setStudentMutationLoading(false);
    }
  };

  const handleRemoveStudent = async (student: StudentWithEnrollment) => {
    if (!classInfo || !student.enrollment_id) return;
    if (!confirm(`Remove ${student.name} ${student.surname} from ${classInfo.class_name}?`)) {
      return;
    }

    try {
      setStudentMutationLoading(true);

      const { error: enrollmentDeleteError } = await supabase
        .from("enrollments")
        .delete()
        .eq("id", student.enrollment_id);

      if (enrollmentDeleteError) throw enrollmentDeleteError;

      const { error: studentUpdateError } = await supabase
        .from("dashboard_students")
        .update({ class: null })
        .eq("id", student.id);

      if (studentUpdateError) throw studentUpdateError;

      const updatedCount = Math.max(0, (students.length || 0) - 1);
      const { error: classUpdateError } = await supabase
        .from("classes")
        .update({ current_students: updatedCount })
        .eq("id", classInfo.id);

      if (classUpdateError) throw classUpdateError;

      toast({
        title: "Student removed",
        description: "The student has been removed from this class.",
      });

      await loadClassDetails();
      refreshParent();
    } catch (error: any) {
      console.error("Error removing student from class:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove student",
        variant: "destructive",
      });
    } finally {
      setStudentMutationLoading(false);
    }
  };

  const handleAssignCurriculum = async () => {
    if (!classInfo || !selectedCurriculumId) return;

    try {
      setCurriculumMutationLoading(true);
      const { error: updateError } = await supabase
        .from("curriculum")
        .update({ class_id: classInfo.id, class: classInfo.class_name })
        .eq("id", selectedCurriculumId);

      if (updateError) throw updateError;

      toast({
        title: "Curriculum assigned",
        description: "Lesson has been linked to this class.",
      });

      setSelectedCurriculumId("");
      await loadClassDetails();
    } catch (error: any) {
      console.error("Error assigning curriculum:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to assign curriculum",
        variant: "destructive",
      });
    } finally {
      setCurriculumMutationLoading(false);
    }
  };

  const handleUnassignCurriculum = async (lesson: CurriculumLesson) => {
    if (!confirm(`Unassign "${lesson.lesson_title}" from this class?`)) return;

    try {
      setCurriculumMutationLoading(true);
      const { error: updateError } = await supabase
        .from("curriculum")
        .update({ class_id: null, class: null })
        .eq("id", lesson.id);

      if (updateError) throw updateError;

      toast({
        title: "Curriculum unassigned",
        description: "Lesson is no longer linked to this class.",
      });

      await loadClassDetails();
    } catch (error: any) {
      console.error("Error unassigning curriculum:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to unassign curriculum",
        variant: "destructive",
      });
    } finally {
      setCurriculumMutationLoading(false);
    }
  };

  const toggleScheduleDay = (day: string) => {
    setSettingsForm((prev) => {
      const exists = prev.schedule_days.includes(day);
      return {
        ...prev,
        schedule_days: exists
          ? prev.schedule_days.filter((item) => item !== day)
          : [...prev.schedule_days, day],
      };
    });
  };

  const handleSaveSettings = async () => {
    if (!classInfo) return;

    try {
      setSettingsSaving(true);
      const payload = {
        ...settingsForm,
        schedule_days: settingsForm.schedule_days,
        is_active: settingsForm.is_active,
      };

      const { error: updateError, data: updatedData } = await supabase
        .from("classes")
        .update(payload)
        .eq("id", classInfo.id)
        .select()
        .single();

      if (updateError) throw updateError;

      toast({
        title: "Class updated",
        description: "Class details have been saved.",
      });

      setClassInfo(updatedData as ClassRecord);
      refreshParent();
    } catch (error: any) {
      console.error("Error saving class settings:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update class",
        variant: "destructive",
      });
    } finally {
      setSettingsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => (value ? loadClassDetails() : onClose())}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {classInfo?.class_name ?? "Class Details"}
          </DialogTitle>
          <DialogDescription>
            Manage enrollment, curriculum, and performance insights for this class.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading class information…</p>
          </div>
        ) : !classInfo ? (
          <div className="rounded-md border border-dashed p-8 text-center">
            <p className="font-medium">Class details unavailable.</p>
            <p className="text-sm text-muted-foreground">
              Try closing this window and opening the class again.
            </p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="mt-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="students">Students</TabsTrigger>
              <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6 space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Assigned Teacher</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {classInfo.teacher_name || "Not assigned"}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Stage: {mapStageLabel(classInfo.stage)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Enrollment</CardTitle>
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {students.length}/{classInfo.max_students ?? "—"}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Current student count
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Schedule</CardTitle>
                    <RefreshCw className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-semibold">
                      {classInfo.schedule_days?.length
                        ? classInfo.schedule_days.join(", ")
                        : "Not set"}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {classInfo.start_time && classInfo.end_time
                        ? `${classInfo.start_time} – ${classInfo.end_time}`
                        : "Time not configured"}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Status</CardTitle>
                    <PieChartIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <Badge variant={classInfo.is_active ? "default" : "secondary"}>
                      {classInfo.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-2">
                      {classInfo.classroom_location ? `Room: ${classInfo.classroom_location}` : "Location not set"}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card className="h-[320px]">
                  <CardHeader>
                    <CardTitle>Assessment Trend</CardTitle>
                    <CardDescription>
                      Average class performance across assessments.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[240px]">
                    {scoreTrend.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={scoreTrend}>
                          <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} />
                          <XAxis dataKey="date" stroke={chartTheme.axisColor} />
                          <YAxis stroke={chartTheme.axisColor} />
                          <Tooltip contentStyle={tooltipStyles} />
                          <Legend />
                          <Line type="monotone" dataKey="score" stroke={chartTheme.primary} strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        No assessment data yet.
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="h-[320px]">
                  <CardHeader>
                    <CardTitle>Skill Breakdown</CardTitle>
                    <CardDescription>
                      Average scores per skill from recent evaluations.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[240px]">
                    {skillBreakdown.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={skillBreakdown}>
                          <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} />
                          <XAxis dataKey="skill" stroke={chartTheme.axisColor} hide={skillBreakdown.length > 8} />
                          <YAxis stroke={chartTheme.axisColor} />
                          <Tooltip contentStyle={tooltipStyles} />
                          <Bar dataKey="average" fill={chartTheme.secondary} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        No skills data available.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Class Average Score</CardTitle>
                    <CardDescription>
                      Based on recorded assessments.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {classAverageScore !== null ? `${classAverageScore}` : "—"}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Mean total score across assessments.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Best Performance</CardTitle>
                    <CardDescription>Highest assessment score</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {highestScore !== null ? highestScore : "—"}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Aim to replicate this result consistently.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Lowest Performance</CardTitle>
                    <CardDescription>Lowest assessment score</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {lowestScore !== null ? lowestScore : "—"}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Use this to identify remediation needs.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="students" className="mt-6 space-y-6">
              <Card>
                <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle>Class Roster</CardTitle>
                    <CardDescription>Manage student enrollment for this class.</CardDescription>
                  </div>
                  <div className="flex w-full md:w-auto items-center gap-2">
                    <Select
                      value={selectedStudentId}
                      onValueChange={setSelectedStudentId}
                      disabled={studentMutationLoading}
                    >
                      <SelectTrigger className="md:w-[240px]">
                        <SelectValue placeholder="Select student to add" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableStudents.length === 0 ? (
                          <SelectItem value="__none" disabled>
                            All active students already assigned
                          </SelectItem>
                        ) : (
                          availableStudents.map((student) => (
                            <SelectItem key={student.id} value={student.id}>
                              {student.name} {student.surname}
                              {student.level ? ` • ${student.level}` : ""}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleAddStudent}
                      disabled={
                        studentMutationLoading || !selectedStudentId || availableStudents.length === 0
                      }
                    >
                      {studentMutationLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="mr-2 h-4 w-4" />
                      )}
                      Add
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Level</TableHead>
                          <TableHead>Attendance</TableHead>
                          <TableHead>Sessions Left</TableHead>
                          <TableHead>Enrolled</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              No students enrolled yet.
                            </TableCell>
                          </TableRow>
                        ) : (
                          students.map((student) => (
                            <TableRow key={student.id}>
                              <TableCell className="font-medium">
                                {student.name} {student.surname}
                              </TableCell>
                              <TableCell>{student.level ?? "—"}</TableCell>
                              <TableCell>
                                {student.attendance_rate !== null
                                  ? `${student.attendance_rate}%`
                                  : "—"}
                              </TableCell>
                              <TableCell>{student.sessions_left ?? "—"}</TableCell>
                              <TableCell>{formatDate(student.enrollment_date)}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleRemoveStudent(student)}
                                  disabled={studentMutationLoading}
                                >
                                  {studentMutationLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  )}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="curriculum" className="mt-6 space-y-6">
              <Card>
                <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle>Assigned Curriculum</CardTitle>
                    <CardDescription>
                      Lessons linked to this class for planning and delivery.
                    </CardDescription>
                  </div>
                  <div className="flex w-full md:w-auto items-center gap-2">
                    <Select
                      value={selectedCurriculumId}
                      onValueChange={setSelectedCurriculumId}
                      disabled={curriculumMutationLoading}
                    >
                      <SelectTrigger className="md:w-[260px]">
                        <SelectValue placeholder="Assign existing lesson" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCurriculum.length === 0 ? (
                          <SelectItem value="__none" disabled>
                            No unassigned lessons available
                          </SelectItem>
                        ) : (
                          availableCurriculum.map((lesson) => (
                            <SelectItem key={lesson.id} value={lesson.id}>
                              {lesson.lesson_title}
                              {lesson.stage ? ` • ${lesson.stage}` : ""}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleAssignCurriculum}
                      disabled={
                        curriculumMutationLoading ||
                        !selectedCurriculumId ||
                        availableCurriculum.length === 0
                      }
                    >
                      {curriculumMutationLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <BookOpen className="mr-2 h-4 w-4" />
                      )}
                      Assign
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Lesson</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Stage</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {curriculum.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                              No lessons assigned. Create curriculum entries or reuse existing ones.
                            </TableCell>
                          </TableRow>
                        ) : (
                          curriculum.map((lesson) => (
                            <TableRow key={lesson.id}>
                              <TableCell className="font-medium">{lesson.lesson_title}</TableCell>
                              <TableCell>{formatDate(lesson.lesson_date)}</TableCell>
                              <TableCell>{lesson.stage ?? "—"}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleUnassignCurriculum(lesson)}
                                  disabled={curriculumMutationLoading}
                                >
                                  {curriculumMutationLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  )}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Class Settings</CardTitle>
                  <CardDescription>Update timetable, capacity, and other details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="settings-class-name">
                        Class Name
                      </label>
                      <Input
                        id="settings-class-name"
                        value={settingsForm.class_name}
                        onChange={(event) =>
                          setSettingsForm((prev) => ({ ...prev, class_name: event.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="settings-teacher">
                        Teacher Name
                      </label>
                      <Input
                        id="settings-teacher"
                        value={settingsForm.teacher_name}
                        onChange={(event) =>
                          setSettingsForm((prev) => ({ ...prev, teacher_name: event.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="settings-stage">
                        Stage
                      </label>
                      <Select
                        value={settingsForm.stage}
                        onValueChange={(value) =>
                          setSettingsForm((prev) => ({ ...prev, stage: value }))
                        }
                      >
                        <SelectTrigger id="settings-stage">
                          <SelectValue placeholder="Select stage" />
                        </SelectTrigger>
                        <SelectContent>
                          {stageOptions.map((stage) => (
                            <SelectItem key={stage.value} value={stage.value}>
                              {stage.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="settings-level">
                        Level
                      </label>
                      <Input
                        id="settings-level"
                        value={settingsForm.level}
                        onChange={(event) =>
                          setSettingsForm((prev) => ({ ...prev, level: event.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="settings-start-time">
                        Start Time
                      </label>
                      <Input
                        id="settings-start-time"
                        type="time"
                        value={settingsForm.start_time}
                        onChange={(event) =>
                          setSettingsForm((prev) => ({ ...prev, start_time: event.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="settings-end-time">
                        End Time
                      </label>
                      <Input
                        id="settings-end-time"
                        type="time"
                        value={settingsForm.end_time}
                        onChange={(event) =>
                          setSettingsForm((prev) => ({ ...prev, end_time: event.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="settings-max-students">
                        Max Students
                      </label>
                      <Input
                        id="settings-max-students"
                        type="number"
                        value={settingsForm.max_students}
                        min={1}
                        onChange={(event) =>
                          setSettingsForm((prev) => ({
                            ...prev,
                            max_students: Number(event.target.value),
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="settings-location">
                        Classroom Location
                      </label>
                      <Input
                        id="settings-location"
                        value={settingsForm.classroom_location}
                        onChange={(event) =>
                          setSettingsForm((prev) => ({
                            ...prev,
                            classroom_location: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-sm font-medium">Schedule Days</span>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {daysOfWeek.map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleScheduleDay(day)}
                          className={`flex items-center justify-between rounded border px-3 py-2 text-sm transition ${
                            settingsForm.schedule_days.includes(day)
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {day.slice(0, 3)}
                          {settingsForm.schedule_days.includes(day) && <span>✓</span>}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="settings-schedule">
                      Additional Schedule Notes
                    </label>
                    <Input
                      id="settings-schedule"
                      value={settingsForm.schedule}
                      onChange={(event) =>
                        setSettingsForm((prev) => ({ ...prev, schedule: event.target.value }))
                      }
                      placeholder="e.g., Every Tuesday & Thursday"
                    />
                  </div>

                  <div className="flex items-center justify-between rounded border px-3 py-3">
                    <div>
                      <p className="font-medium text-sm">Active Class</p>
                      <p className="text-xs text-muted-foreground">
                        Toggle to deactivate this class without deleting data.
                      </p>
                    </div>
                    <Switch
                      checked={settingsForm.is_active}
                      onCheckedChange={(value) =>
                        setSettingsForm((prev) => ({ ...prev, is_active: value }))
                      }
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={loadClassDetails}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Reset
                    </Button>
                    <Button onClick={handleSaveSettings} disabled={settingsSaving}>
                      {settingsSaving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
