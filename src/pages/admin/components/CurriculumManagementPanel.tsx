import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import type { BadgeProps } from "@/components/ui/badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { formatStageLabel } from "@/lib/curriculum/status-utils";
import {
  BarChart2,
  BookOpen,
  Calendar,
  ClipboardCheck,
  ClipboardList,
  FileDown,
  FileText,
  Layers,
  PlayCircle,
  RefreshCw,
  Target,
  Users,
} from "lucide-react";


type CurriculumRow = Tables<"curriculum">;
type TeacherRow = Tables<"teachers">;
type LessonResourceRow = Tables<"lesson_resources">;
type TeacherAssignmentRow = Tables<"teacher_assignments">;
type TeacherNoteRow = Tables<"teacher_notes">;

type RawLesson = CurriculumRow & {
  lesson_resources?: (LessonResourceRow & {
    resource?: {
      id: string;
      title: string | null;
      resource_type: string | null;
      file_url: string | null;
      created_by: string | null;
    } | null;
  })[] | null;
  teacher_assignments?: Pick<TeacherAssignmentRow, "id" | "status" | "teaching_date">[] | null;
};

type LessonMaterial = {
  name: string;
  url: string | null;
  type?: string | null;
};

type LessonResource = {
  id: string;
  title: string;
  type: string;
  url: string | null;
  notes: string | null;
  createdBy: string | null;
};

type FormattedLesson = {
  id: string;
  subject: string | null;
  stage: string | null;
  className: string | null;
  lessonNumber: number | null;
  lessonTitle: string;
  lessonDate: string | null;
  status: string | null;
  teacherId: string | null;
  teacherName: string | null;
  updatedAt: string | null;
  objectives: string[];
  successCriteria: string | null;
  printables: LessonMaterial[];
  homework: LessonMaterial[];
  assessments: LessonMaterial[];
  resources: LessonResource[];
  assignmentStatuses: {
    id: string;
    status: string | null;
    teachingDate: string | null;
  }[];
};

type ContributionSummary = {
  total: number;
  byTeacher: {
    teacherId: string;
    name: string;
    count: number;
  }[];
};

type BehaviorSummary = ContributionSummary;

type PreviewTab = "overview" | "plan" | "printables" | "homework" | "quiz" | "assignment";

const MATERIAL_LIMITS: Record<string, number> = {
  printables: 4,
  homework: 6,
  assessments: 4,
};

type BadgeVariant = NonNullable<BadgeProps["variant"]>;

const STATUS_VARIANTS: Record<string, { label: string; variant: BadgeVariant }> = {
  building: { label: "Planning", variant: "secondary" },
  draft: { label: "Draft", variant: "outline" },
  ready: { label: "Ready", variant: "default" },
  scheduled: { label: "Scheduled", variant: "secondary" },
  in_progress: { label: "In Progress", variant: "default" },
  completed: { label: "Taught", variant: "outline" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

const formatDate = (value: string | null) => {
  if (!value) return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return format(parsed, "PP");
};

const buildMaterials = (
  lesson: CurriculumRow,
  prefix: "p" | "hw" | "a",
  limit: number,
): LessonMaterial[] => {
  const materials: LessonMaterial[] = [];

  for (let index = 1; index <= limit; index += 1) {
    const name = lesson[`${prefix}${index}_name` as keyof CurriculumRow];
    const url = lesson[`${prefix}${index}_url` as keyof CurriculumRow];
    const type = lesson[`${prefix}${index}_type` as keyof CurriculumRow];

    if (typeof name === "string" && name.trim().length > 0) {
      materials.push({
        name,
        url: typeof url === "string" ? url : null,
        type: typeof type === "string" ? type : null,
      });
    }
  }

  return materials;
};

const normalizeStatus = (status?: string | null) => {
  if (!status) return "draft";
  return status.toLowerCase();
};

const getStatusDisplay = (status?: string | null) => {
  const normalized = normalizeStatus(status);
  const mapping = STATUS_VARIANTS[normalized];

  if (mapping) {
    return mapping;
  }

  return {
    label: status || "Scheduled",
    variant: "secondary" as BadgeVariant,
  };
};

const CurriculumManagementPanel = () => {
  const [lessons, setLessons] = useState<FormattedLesson[]>([]);
  const [filters, setFilters] = useState({
    subject: "all",
    status: "all",
    stage: "all",
    search: "",
  });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [contributionSummary, setContributionSummary] = useState<ContributionSummary>({ total: 0, byTeacher: [] });
  const [behaviorSummary, setBehaviorSummary] = useState<BehaviorSummary>({ total: 0, byTeacher: [] });
  const [teacherDirectory, setTeacherDirectory] = useState<Record<string, string>>({});
  const [previewLesson, setPreviewLesson] = useState<FormattedLesson | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTab, setPreviewTab] = useState<PreviewTab>("overview");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const { toast } = useToast();

  const collectObjectives = (value: CurriculumRow["objectives"]) => {
    if (Array.isArray(value)) {
      return value.filter((objective): objective is string => typeof objective === "string" && objective.trim().length > 0);
    }

    if (typeof value === "string") {
      return value
        .split(",")
        .map((objective) => objective.trim())
        .filter((objective) => objective.length > 0);
    }

    return [];
  };

  const openPreview = (lesson: FormattedLesson, tab: PreviewTab) => {
    setPreviewLesson(lesson);
    setPreviewTab(tab);
    setPreviewOpen(true);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const [
        { data: lessonsData, error: lessonsError },
        { data: teachersData, error: teachersError },
        { data: behaviorData, error: behaviorError },
      ] = await Promise.all([
        supabase
          .from("curriculum")
          .select(
            `
              *,
              lesson_resources:lesson_resources (
                id,
                added_by,
                notes,
                position,
                resource:resource_id (
                  id,
                  title,
                  resource_type,
                  file_url,
                  created_by
                )
              ),
              teacher_assignments:teacher_assignments (
                id,
                status,
                teaching_date
              )
            `,
          )
          .order("lesson_date", { ascending: false })
          .limit(250),
        supabase.from("teachers").select("id, name, surname"),
        supabase
          .from("teacher_notes")
          .select("id, teacher_id, note_type")
          .eq("note_type", "behavior"),
      ]);

      if (lessonsError) throw lessonsError;
      if (teachersError) throw teachersError;
      if (behaviorError) throw behaviorError;

      const teacherMap: Record<string, string> = {};
      (teachersData as TeacherRow[] | null)?.forEach((teacher) => {
        const fullName = `${teacher.name ?? ""} ${teacher.surname ?? ""}`.trim();
        teacherMap[teacher.id] = fullName.length > 0 ? fullName : "Unknown teacher";
      });
      setTeacherDirectory(teacherMap);

      const formattedLessons: FormattedLesson[] = ((lessonsData as RawLesson[] | null) ?? []).map((lesson) => {
        const resources = ((lesson.lesson_resources ?? []) as RawLesson["lesson_resources"])?.slice().sort((a, b) => {
          const positionA = typeof a?.position === "number" ? a.position : 0;
          const positionB = typeof b?.position === "number" ? b.position : 0;
          return positionA - positionB;
        });

        const mappedResources: LessonResource[] = (resources ?? []).map((resource) => ({
          id: resource?.resource?.id || resource.id,
          title: resource?.resource?.title || "Untitled resource",
          type: resource?.resource?.resource_type || "resource",
          url: resource?.resource?.file_url || null,
          notes: resource?.notes ?? null,
          createdBy: resource?.resource?.created_by || resource?.added_by || null,
        }));

        return {
          id: lesson.id,
          subject: lesson.subject,
          stage: formatStageLabel(lesson.stage ?? lesson.curriculum_stage) ?? lesson.stage ?? lesson.curriculum_stage,
          className: lesson.class ?? null,
          lessonNumber: lesson.lesson_number,
          lessonTitle: lesson.lesson_title,
          lessonDate: lesson.lesson_date,
          status: lesson.status,
          teacherId: lesson.teacher_id,
          teacherName: lesson.teacher_name,
          updatedAt: lesson.updated_at,
          objectives: collectObjectives(lesson.objectives),
          successCriteria: lesson.success_criteria,
          printables: buildMaterials(lesson, "p", MATERIAL_LIMITS.printables),
          homework: buildMaterials(lesson, "hw", MATERIAL_LIMITS.homework),
          assessments: buildMaterials(lesson, "a", MATERIAL_LIMITS.assessments),
          resources: mappedResources,
          assignmentStatuses: (lesson.teacher_assignments ?? []).map((assignment) => ({
            id: assignment.id,
            status: assignment.status,
            teachingDate: assignment.teaching_date,
          })),
        };
      });

      const counts: Record<string, number> = {};
      formattedLessons.forEach((lesson) => {
        const key = normalizeStatus(lesson.status);
        counts[key] = (counts[key] ?? 0) + 1;
      });
      setStatusCounts(counts);

      const contributionsByTeacher = new Map<string, number>();
      let totalContributions = 0;

      formattedLessons.forEach((lesson) => {
        lesson.resources.forEach((resource) => {
          if (!resource.createdBy) return;
          totalContributions += 1;
          const current = contributionsByTeacher.get(resource.createdBy) ?? 0;
          contributionsByTeacher.set(resource.createdBy, current + 1);
        });
      });

      const contributionBreakdown = Array.from(contributionsByTeacher.entries())
        .map(([teacherId, count]) => ({
          teacherId,
          count,
          name: teacherMap[teacherId] ?? "Unknown teacher",
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setContributionSummary({
        total: totalContributions,
        byTeacher: contributionBreakdown,
      });

      const behaviorCounts = new Map<string, number>();
      ((behaviorData as TeacherNoteRow[] | null) ?? []).forEach((note) => {
        if (!note.teacher_id) return;
        const current = behaviorCounts.get(note.teacher_id) ?? 0;
        behaviorCounts.set(note.teacher_id, current + 1);
      });

      const behaviorBreakdown = Array.from(behaviorCounts.entries())
        .map(([teacherId, count]) => ({
          teacherId,
          count,
          name: teacherMap[teacherId] ?? "Unknown teacher",
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setBehaviorSummary({
        total: ((behaviorData as TeacherNoteRow[] | null) ?? []).length,
        byTeacher: behaviorBreakdown,
      });

      setLessons(formattedLessons);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Unable to load curriculum overview", error);
      const message =
        error instanceof Error ? error.message : "An unexpected error occurred while loading curriculum data.";
      setErrorMessage(message);
      toast({
        title: "Unable to load curriculum",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredLessons = useMemo(() => {
    const searchTerm = filters.search.trim().toLowerCase();

    return lessons.filter((lesson) => {
      const matchesSubject = filters.subject === "all" || lesson.subject === filters.subject;
      const matchesStage = filters.stage === "all" || lesson.stage === filters.stage;
      const matchesStatus = filters.status === "all" || normalizeStatus(lesson.status) === filters.status;
      const matchesSearch =
        searchTerm.length === 0 ||
        [
          lesson.lessonTitle,
          lesson.subject ?? "",
          lesson.className ?? "",
          lesson.teacherName ?? teacherDirectory[lesson.teacherId ?? ""] ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(searchTerm);

      return matchesSubject && matchesStage && matchesStatus && matchesSearch;
    });
  }, [filters, lessons, teacherDirectory]);

  const subjects = useMemo(() => {
    const uniqueSubjects = new Set<string>();
    lessons.forEach((lesson) => {
      if (lesson.subject) {
        uniqueSubjects.add(lesson.subject);
      }
    });
    return Array.from(uniqueSubjects).sort();
  }, [lessons]);

  const stages = useMemo(() => {
    const uniqueStages = new Set<string>();
    lessons.forEach((lesson) => {
      if (lesson.stage) {
        uniqueStages.add(lesson.stage);
      }
    });
    return Array.from(uniqueStages).sort();
  }, [lessons]);

  const statuses = useMemo(() => {
    const uniqueStatuses = new Set<string>();
    lessons.forEach((lesson) => {
      uniqueStatuses.add(normalizeStatus(lesson.status));
    });
    return Array.from(uniqueStatuses).sort();
  }, [lessons]);

  const totalLessons = lessons.length;
  const readyCount = (statusCounts.ready ?? 0) + (statusCounts.completed ?? 0);
  const progressValue = totalLessons > 0 ? Math.round((readyCount / totalLessons) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Curriculum Oversight</h2>
          <p className="text-sm text-muted-foreground">
            Monitor curriculum readiness, teacher contributions, and resource coverage across the organisation.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              Updated {format(lastUpdated, "PPpp")}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={() => loadData()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers className="h-4 w-4 text-primary" />
              Lesson progress
            </CardTitle>
            <CardDescription>Curriculum readiness across all lessons</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Ready or completed</span>
                <span className="font-medium">{progressValue}%</span>
              </div>
              <Progress value={progressValue} className="mt-2" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(statusCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([status, count]) => {
                  const display = getStatusDisplay(status);
                  return (
                    <div key={status} className="flex items-center justify-between rounded-md border px-3 py-2">
                      <span className="text-muted-foreground">{display.label}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart2 className="h-4 w-4 text-primary" />
              Teacher contributions
            </CardTitle>
            <CardDescription>Total lesson plan resources shared</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md border px-3 py-2">
              <p className="text-xs text-muted-foreground">Total contributions</p>
              <p className="text-lg font-semibold">{contributionSummary.total}</p>
            </div>
            <div className="space-y-2">
              {contributionSummary.byTeacher.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No teacher contributions have been linked to lessons yet.
                </p>
              ) : (
                contributionSummary.byTeacher.map((item) => (
                  <div key={item.teacherId} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2">
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className="text-xs text-muted-foreground">{item.count} resources</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-primary" />
              Behaviour insights
            </CardTitle>
            <CardDescription>Teacher-submitted behaviour follow ups</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md border px-3 py-2">
              <p className="text-xs text-muted-foreground">Behaviour logs</p>
              <p className="text-lg font-semibold">{behaviorSummary.total}</p>
            </div>
            <div className="space-y-2">
              {behaviorSummary.byTeacher.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No behaviour notes recorded for this period.
                </p>
              ) : (
                behaviorSummary.byTeacher.map((item) => (
                  <div key={item.teacherId} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2">
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className="text-xs text-muted-foreground">{item.count} notes</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardTitle className="text-lg">Lesson catalogue</CardTitle>
              <CardDescription>Browse lessons, view linked resources, and monitor readiness.</CardDescription>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Input
                placeholder="Search by lesson, class, or teacher"
                value={filters.search}
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                className="w-full sm:w-64"
              />
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Select
                  value={filters.subject}
                  onValueChange={(value) => setFilters((current) => ({ ...current, subject: value }))}
                >
                  <SelectTrigger className="w-full sm:w-44">
                    <SelectValue placeholder="Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All subjects</SelectItem>
                    {subjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filters.stage}
                  onValueChange={(value) => setFilters((current) => ({ ...current, stage: value }))}
                >
                  <SelectTrigger className="w-full sm:w-44">
                    <SelectValue placeholder="Stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All stages</SelectItem>
                    {stages.map((stage) => (
                      <SelectItem key={stage} value={stage}>
                        {stage}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters((current) => ({ ...current, status: value }))}
                >
                  <SelectTrigger className="w-full sm:w-44">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {statuses.map((status) => {
                      const display = getStatusDisplay(status);
                      return (
                        <SelectItem key={status} value={status}>
                          {display.label}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Loading curriculum lessons…</div>
          ) : errorMessage ? (
            <div className="py-12 text-center text-sm text-destructive">{errorMessage}</div>
          ) : filteredLessons.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No lessons match the selected filters. Try adjusting your search.
            </div>
          ) : (
            <ScrollArea className="max-h-[520px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lesson</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Resources</TableHead>
                    <TableHead className="min-w-[340px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLessons.map((lesson) => {
                    const statusDisplay = getStatusDisplay(lesson.status);
                    const scheduledDate = formatDate(lesson.lessonDate);
                    const teacherName =
                      lesson.teacherName ||
                      (lesson.teacherId ? teacherDirectory[lesson.teacherId] : null) ||
                      "Unassigned";

                    return (
                      <TableRow key={lesson.id} className="align-top">
                        <TableCell>
                          <div className="font-medium flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            {lesson.lessonTitle}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            {lesson.subject && <span>{lesson.subject}</span>}
                            {lesson.stage && <Badge variant="outline">{lesson.stage}</Badge>}
                            {lesson.className && <span>• {lesson.className}</span>}
                            {lesson.lessonNumber && <span>• Lesson {lesson.lessonNumber}</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          {scheduledDate ? (
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {scheduledDate}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Date TBD</span>
                          )}
                          {lesson.updatedAt && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Updated {formatDate(lesson.updatedAt) ?? "recently"}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusDisplay.variant}>{statusDisplay.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{teacherName}</div>
                          <p className="text-xs text-muted-foreground">
                            {lesson.assignmentStatuses.length} assignment{lesson.assignmentStatuses.length === 1 ? "" : "s"}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-xs text-muted-foreground">
                            <p>{lesson.resources.length} saved plan resources</p>
                            <p>{lesson.printables.length} printables</p>
                            <p>{lesson.homework.length} homework tasks</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="secondary" onClick={() => openPreview(lesson, "plan")}>
                              <Layers className="mr-2 h-4 w-4" /> Build lesson
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled
                              title="Lesson delivery is launched from the teacher dashboard"
                            >
                              <PlayCircle className="mr-2 h-4 w-4" /> Start lesson
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => openPreview(lesson, "overview")}>
                              <ClipboardCheck className="mr-2 h-4 w-4" /> Evaluate
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={lesson.printables.length === 0}
                              title={lesson.printables.length === 0 ? "No printables attached" : undefined}
                              onClick={() => openPreview(lesson, "printables")}
                            >
                              <FileDown className="mr-2 h-4 w-4" /> Printables
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={lesson.homework.length === 0}
                              title={lesson.homework.length === 0 ? "No homework linked" : undefined}
                              onClick={() => openPreview(lesson, "homework")}
                            >
                              <FileText className="mr-2 h-4 w-4" /> Homework
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={lesson.assessments.length === 0}
                              title={lesson.assessments.length === 0 ? "No quiz materials linked" : undefined}
                              onClick={() => openPreview(lesson, "quiz")}
                            >
                              <Target className="mr-2 h-4 w-4" /> Quiz
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={lesson.assignmentStatuses.length === 0}
                              title={lesson.assignmentStatuses.length === 0 ? "No assignments created" : undefined}
                              onClick={() => openPreview(lesson, "assignment")}
                            >
                              <ClipboardList className="mr-2 h-4 w-4" /> Assignment
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl">
          {previewLesson && (
            <>
              <DialogHeader>
                <DialogTitle>{previewLesson.lessonTitle}</DialogTitle>
                <DialogDescription>
                  {previewLesson.subject ?? "General"} · {previewLesson.stage ?? "Stage"}
                </DialogDescription>
              </DialogHeader>
              <Tabs value={previewTab} onValueChange={(value) => setPreviewTab(value as PreviewTab)} className="mt-4">
                <TabsList className="grid w-full grid-cols-6 text-xs">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="plan">Lesson plan</TabsTrigger>
                  <TabsTrigger value="printables">Printables</TabsTrigger>
                  <TabsTrigger value="homework">Homework</TabsTrigger>
                  <TabsTrigger value="quiz">Quiz</TabsTrigger>
                  <TabsTrigger value="assignment">Assignment</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Lesson details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <p>
                          <span className="text-muted-foreground">Subject:</span> {previewLesson.subject ?? "—"}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Stage:</span> {previewLesson.stage ?? "—"}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Class:</span> {previewLesson.className ?? "—"}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Scheduled:</span> {formatDate(previewLesson.lessonDate) ?? "TBC"}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Teacher:</span> {previewLesson.teacherName ?? "Unassigned"}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Status:</span> {getStatusDisplay(previewLesson.status).label}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Success criteria</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        {previewLesson.successCriteria ? (
                          <p>{previewLesson.successCriteria}</p>
                        ) : (
                          <p className="text-muted-foreground">No success criteria documented.</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Learning objectives</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {previewLesson.objectives.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No objectives captured yet.</p>
                      ) : (
                        <ul className="list-disc space-y-2 pl-4 text-sm">
                          {previewLesson.objectives.map((objective) => (
                            <li key={objective}>{objective}</li>
                          ))}
                        </ul>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="plan" className="space-y-4">
                  {previewLesson.resources.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No resources have been added to this lesson plan.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {previewLesson.resources.map((resource) => (
                        <Card key={resource.id}>
                          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="font-medium">{resource.title}</p>
                              <p className="text-xs text-muted-foreground capitalize">{resource.type}</p>
                              {resource.notes && (
                                <p className="mt-2 text-sm text-muted-foreground">{resource.notes}</p>
                              )}
                            </div>
                            {resource.url && (
                              <Button asChild size="sm" variant="outline">
                                <a href={resource.url} target="_blank" rel="noreferrer">
                                  <FileDown className="mr-2 h-4 w-4" /> Open resource
                                </a>
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="printables" className="space-y-3">
                  {previewLesson.printables.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No printable materials attached.</p>
                  ) : (
                    <div className="space-y-2">
                      {previewLesson.printables.map((item) => (
                        <Card key={`${item.name}-${item.url ?? "link"}`}>
                          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="font-medium">{item.name}</p>
                              {item.type && (
                                <p className="text-xs text-muted-foreground capitalize">{item.type}</p>
                              )}
                            </div>
                            {item.url && (
                              <Button asChild size="sm" variant="outline">
                                <a href={item.url} target="_blank" rel="noreferrer">
                                  <FileDown className="mr-2 h-4 w-4" /> Download
                                </a>
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="homework" className="space-y-3">
                  {previewLesson.homework.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No homework tasks recorded.</p>
                  ) : (
                    <div className="space-y-2">
                      {previewLesson.homework.map((item) => (
                        <Card key={`${item.name}-${item.url ?? "link"}`}>
                          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="font-medium">{item.name}</p>
                              {item.type && (
                                <p className="text-xs text-muted-foreground capitalize">{item.type}</p>
                              )}
                            </div>
                            {item.url && (
                              <Button asChild size="sm" variant="outline">
                                <a href={item.url} target="_blank" rel="noreferrer">
                                  <FileDown className="mr-2 h-4 w-4" /> Open link
                                </a>
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="quiz" className="space-y-3">
                  {previewLesson.assessments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No assessment materials linked yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {previewLesson.assessments.map((item) => (
                        <Card key={`${item.name}-${item.url ?? "link"}`}>
                          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="font-medium">{item.name}</p>
                              {item.type && (
                                <p className="text-xs text-muted-foreground capitalize">{item.type}</p>
                              )}
                            </div>
                            {item.url && (
                              <Button asChild size="sm" variant="outline">
                                <a href={item.url} target="_blank" rel="noreferrer">
                                  <FileDown className="mr-2 h-4 w-4" /> View assessment
                                </a>
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="assignment" className="space-y-3">
                  {previewLesson.assignmentStatuses.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No teacher assignments linked to this lesson.</p>
                  ) : (
                    <div className="space-y-2">
                      {previewLesson.assignmentStatuses.map((assignment) => {
                        const assignmentStatus = getStatusDisplay(assignment.status);
                        return (
                          <Card key={assignment.id}>
                            <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="font-medium">Assignment {assignment.id.slice(0, 8)}</p>
                                <p className="text-xs text-muted-foreground">
                                  Teaching date: {formatDate(assignment.teachingDate) ?? "TBC"}
                                </p>
                              </div>
                              <Badge variant={assignmentStatus.variant}>{assignmentStatus.label}</Badge>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CurriculumManagementPanel;
