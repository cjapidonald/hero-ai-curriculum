import { useEffect, useMemo, useRef, useState } from "react";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/hooks/use-theme";
import { useChartTheme, getTooltipStyles } from "@/lib/chart-theme";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Award, Calendar, CheckCircle2, MessageSquare, TrendingUp, Users } from "lucide-react";
import EvaluationsList from "@/components/teacher/EvaluationsList";

interface TeacherInsightPanelProps {
  open: boolean;
  teacherId: string | null;
  onOpenChange: (open: boolean) => void;
  initialTeacher?:
    | null
    | {
        id: string;
        name?: string | null;
        surname?: string | null;
        subject?: string | null;
        email?: string | null;
        phone?: string | null;
        bio?: string | null;
        profile_image_url?: string | null;
        assigned_classes?: string[] | null;
      };
}

interface TeacherProfile {
  id: string;
  name: string;
  surname: string;
  subject: string | null;
  email: string | null;
  phone: string | null;
  bio: string | null;
  profile_image_url: string | null;
  assigned_classes: string[] | null;
}

interface TeacherSummary {
  assigned_classes_count: number | null;
  hourly_rate: number | null;
  total_students: number | null;
  upcoming_assignments: number | null;
}

interface CalendarSession {
  id: string;
  class_name: string | null;
  lesson_title: string | null;
  session_date: string | null;
  start_time: string | null;
  end_time: string | null;
  status: string | null;
}

interface TeacherAssignment {
  id: string;
  teaching_date: string;
  start_time: string | null;
  end_time: string | null;
  status: string | null;
  location: string | null;
  classes?: {
    class_name: string | null;
    stage: string | null;
  } | null;
}

interface TeacherEvaluationRecord {
  id: string;
  teacher_id: string;
  admin_id: string | null;
  score: number;
  comment: string | null;
  created_at: string;
  admins?: {
    name: string | null;
    surname: string | null;
  } | null;
}

const toCurrency = (amount: number | null | undefined) => {
  if (!amount && amount !== 0) {
    return "—";
  }

  const formatter = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  });

  return formatter.format(amount);
};

export const TeacherInsightPanel = ({
  open,
  teacherId,
  onOpenChange,
  initialTeacher,
}: TeacherInsightPanelProps) => {
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();
  const { isDark } = useTheme();
  const chartTheme = useChartTheme(isDark);
  const tooltipStyles = getTooltipStyles(isDark);

  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [summary, setSummary] = useState<TeacherSummary | null>(null);
  const [sessions, setSessions] = useState<CalendarSession[]>([]);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [evaluations, setEvaluations] = useState<TeacherEvaluationRecord[]>([]);
  const [scoreValue, setScoreValue] = useState<number[]>([80]);
  const [comment, setComment] = useState("");
  const [savingEvaluation, setSavingEvaluation] = useState(false);
  const initialTeacherAppliedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      setProfile(null);
      setSummary(null);
      setSessions([]);
      setAssignments([]);
      setEvaluations([]);
      setScoreValue([80]);
      setComment("");
      initialTeacherAppliedRef.current = false;
      return;
    }

    if (!teacherId) {
      return;
    }

    let isMounted = true;
    const loadInsights = async () => {
      try {
        setLoading(true);

        const today = new Date().toISOString().split("T")[0];

        const [
          profileRes,
          summaryRes,
          sessionsRes,
          assignmentsRes,
          evaluationsRes,
        ] = await Promise.all([
          supabase
            .from("teachers")
            .select("*")
            .eq("id", teacherId)
            .maybeSingle(),
          supabase
            .from("teacher_dashboard_view")
            .select("*")
            .eq("teacher_id", teacherId)
            .maybeSingle(),
          supabase
            .from("calendar_sessions")
            .select(
              "id, class_name, lesson_title, session_date, start_time, end_time, status",
            )
            .eq("teacher_id", teacherId)
            .gte("session_date", today)
            .order("session_date", { ascending: true })
            .order("start_time", { ascending: true })
            .limit(8),
          supabase
            .from("teacher_assignments")
            .select(
              `
              id,
              teaching_date,
              start_time,
              end_time,
              status,
              location,
              classes:teacher_assignments_class_id_fkey (
                class_name,
                stage
              )
            `,
            )
            .eq("teacher_id", teacherId)
            .order("teaching_date", { ascending: true })
            .limit(8),
          supabase
            .from("teacher_evaluations")
            .select(
              `
              id,
              teacher_id,
              admin_id,
              score,
              comment,
              created_at,
              admins:admins!teacher_evaluations_admin_id_fkey (
                name,
                surname
              )
            `,
            )
            .eq("teacher_id", teacherId)
            .order("created_at", { ascending: false })
            .limit(20),
        ]);

        if (!isMounted) {
          return;
        }

        if (profileRes.error) {
          console.error("Error loading teacher profile:", profileRes.error);
        } else if (profileRes.data) {
          const data = profileRes.data as TeacherProfile;
          setProfile(data);
        }

        if (summaryRes.error) {
          console.error("Error loading teacher summary:", summaryRes.error);
        } else if (summaryRes.data) {
          setSummary(summaryRes.data as TeacherSummary);
        }

        if (sessionsRes.error) {
          console.error("Error loading sessions:", sessionsRes.error);
        } else {
          setSessions((sessionsRes.data as CalendarSession[]) ?? []);
        }

        if (assignmentsRes.error) {
          console.error("Error loading assignments:", assignmentsRes.error);
        } else {
          setAssignments((assignmentsRes.data as TeacherAssignment[]) ?? []);
        }

        if (evaluationsRes.error) {
          if (evaluationsRes.error.code !== "42P01") {
            console.error("Error loading evaluations:", evaluationsRes.error);
          }
        } else {
          setEvaluations((evaluationsRes.data as TeacherEvaluationRecord[]) ?? []);
        }
      } catch (error) {
        console.error("Unexpected error loading teacher insights:", error);
        toast({
          title: "Unable to load teacher dashboard",
          description:
            "Something went wrong while gathering teacher data. Please try again shortly.",
          variant: "destructive",
        });
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadInsights();

    return () => {
      isMounted = false;
    };
  }, [open, teacherId, initialTeacher, toast]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (initialTeacher && !initialTeacherAppliedRef.current) {
      setProfile({
        id: initialTeacher.id,
        name: initialTeacher.name ?? "",
        surname: initialTeacher.surname ?? "",
        subject: initialTeacher.subject ?? null,
        email: initialTeacher.email ?? null,
        phone: initialTeacher.phone ?? null,
        bio: initialTeacher.bio ?? null,
        profile_image_url: initialTeacher.profile_image_url ?? null,
        assigned_classes: initialTeacher.assigned_classes ?? null,
      });
      initialTeacherAppliedRef.current = true;
    }
  }, [initialTeacher, open]);

  const evaluationStats = useMemo(() => {
    if (!evaluations.length) {
      return {
        average: 0,
        latestScore: null as number | null,
        latestComment: null as string | null,
        latestAt: null as string | null,
        delta: null as number | null,
        trend: [] as { label: string; score: number }[],
      };
    }

    const total = evaluations.reduce((acc, record) => acc + (record.score ?? 0), 0);
    const average = total / evaluations.length;
    const latest = evaluations[0];
    const previous = evaluations[1];
    const delta =
      previous && typeof previous.score === "number"
        ? latest.score - previous.score
        : null;

    const trend = [...evaluations]
      .reverse()
      .map((record) => ({
        label: format(parseISO(record.created_at), "MMM d"),
        score: record.score,
      }));

    return {
      average,
      latestScore: latest.score,
      latestComment: latest.comment,
      latestAt: latest.created_at,
      delta,
      trend,
    };
  }, [evaluations]);

  const handleEvaluationSubmit = async () => {
    if (!teacherId || !isAdmin) {
      return;
    }

    try {
      setSavingEvaluation(true);
      const payload = {
        teacher_id: teacherId,
        admin_id: user?.id ?? null,
        score: scoreValue[0],
        comment: comment.trim() ? comment.trim() : null,
      };

      const { error } = await supabase.from("teacher_evaluations").insert(payload);

      if (error) {
        if (error.code === "42P01") {
          toast({
            title: "Evaluation table missing",
            description:
              "Please run the latest database migrations to enable teacher evaluations.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: "Evaluation saved",
        description: "Your feedback has been shared with the teacher.",
      });

      setComment("");
      setScoreValue([80]);

      const { data, error: refreshError } = await supabase
        .from("teacher_evaluations")
        .select(
          `
          id,
          teacher_id,
          admin_id,
          score,
          comment,
          created_at,
          admins:admins!teacher_evaluations_admin_id_fkey (
            name,
            surname
          )
        `,
        )
        .eq("teacher_id", teacherId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!refreshError && data) {
        setEvaluations(data as TeacherEvaluationRecord[]);
      }
    } catch (error) {
      console.error("Error saving evaluation:", error);
      toast({
        title: "Unable to save evaluation",
        description:
          "Please double-check your connection and try submitting the evaluation again.",
        variant: "destructive",
      });
    } finally {
      setSavingEvaluation(false);
    }
  };

  if (!teacherId) {
    return null;
  }

  const resolvedProfile = profile ?? (initialTeacher
    ? {
        id: initialTeacher.id,
        name: initialTeacher.name ?? "",
        surname: initialTeacher.surname ?? "",
        subject: initialTeacher.subject ?? null,
        email: initialTeacher.email ?? null,
        phone: initialTeacher.phone ?? null,
        bio: initialTeacher.bio ?? null,
        profile_image_url: initialTeacher.profile_image_url ?? null,
        assigned_classes: initialTeacher.assigned_classes ?? null,
      }
    : null);

  const fullName = resolvedProfile
    ? `${resolvedProfile.name} ${resolvedProfile.surname}`.trim()
    : "Teacher";

  const avatarFallback = resolvedProfile
    ? `${resolvedProfile.name?.charAt(0) ?? "T"}${resolvedProfile.surname?.charAt(0) ?? "E"}`
        .toUpperCase()
    : "TE";

  const evaluationDeltaLabel =
    evaluationStats.delta === null
      ? "Awaiting next review"
      : evaluationStats.delta > 0
        ? `▲ ${evaluationStats.delta.toFixed(1)} since last`
        : evaluationStats.delta < 0
          ? `▼ ${Math.abs(evaluationStats.delta).toFixed(1)} since last`
          : "No change since last";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Teacher Dashboard Overview</DialogTitle>
          <DialogDescription>
            Detailed performance, scheduling, and evaluation insights for {fullName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <Card>
            <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 border">
                  {resolvedProfile?.profile_image_url ? (
                    <AvatarImage
                      src={resolvedProfile.profile_image_url}
                      alt={fullName}
                    />
                  ) : null}
                  <AvatarFallback>{avatarFallback}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl">{fullName}</CardTitle>
                  <CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>{resolvedProfile?.subject ?? "Subject pending"}</span>
                    <Separator orientation="vertical" className="h-4" />
                    <span>{resolvedProfile?.email ?? "No email on file"}</span>
                    {resolvedProfile?.phone ? (
                      <>
                        <Separator orientation="vertical" className="h-4" />
                        <span>{resolvedProfile.phone}</span>
                      </>
                    ) : null}
                  </CardDescription>
                </div>
              </div>
              {resolvedProfile?.assigned_classes?.length ? (
                <div className="flex flex-wrap gap-2">
                  {resolvedProfile.assigned_classes.slice(0, 4).map((className) => (
                    <Badge key={className} variant="secondary">
                      {className}
                    </Badge>
                  ))}
                  {resolvedProfile.assigned_classes.length > 4 ? (
                    <Badge variant="outline">
                      +{resolvedProfile.assigned_classes.length - 4} more
                    </Badge>
                  ) : null}
                </div>
              ) : null}
            </CardHeader>
            {resolvedProfile?.bio ? (
              <CardContent>
                <p className="text-sm text-muted-foreground">{resolvedProfile.bio}</p>
              </CardContent>
            ) : null}
          </Card>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Award className="h-4 w-4 text-purple-500" />
                  Average Score
                </CardTitle>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-semibold">
                    {evaluationStats.latestScore !== null
                      ? evaluationStats.average.toFixed(1)
                      : "—"}
                  </span>
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    / 100
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{evaluationDeltaLabel}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Users className="h-4 w-4 text-sky-500" />
                  Total Students
                </CardTitle>
                <div className="text-3xl font-semibold">
                  {summary?.total_students ?? "—"}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Across {summary?.assigned_classes_count ?? 0} class
                  {(summary?.assigned_classes_count ?? 0) === 1 ? "" : "es"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Calendar className="h-4 w-4 text-emerald-500" />
                  Upcoming Sessions
                </CardTitle>
                <div className="text-3xl font-semibold">
                  {summary?.upcoming_assignments ?? sessions.length}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {sessions.length
                    ? `${sessions.length} scheduled in the next weeks`
                    : "No sessions scheduled"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <TrendingUp className="h-4 w-4 text-amber-500" />
                  Hourly Rate
                </CardTitle>
                <div className="text-3xl font-semibold">
                  {toCurrency(summary?.hourly_rate ?? null)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Rate pulled from payroll settings
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Evaluation Trend</CardTitle>
                <CardDescription>
                  Track feedback momentum and overall sentiment for this teacher.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[260px]">
                {evaluationStats.trend.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={evaluationStats.trend}>
                      <defs>
                        <linearGradient id="evaluationGradient" x1="0" x2="0" y1="0" y2="1">
                          <stop
                            offset="0%"
                            stopColor={chartTheme.primary}
                            stopOpacity={0.6}
                          />
                          <stop
                            offset="100%"
                            stopColor={chartTheme.primary}
                            stopOpacity={0.05}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                      <XAxis
                        dataKey="label"
                        stroke={chartTheme.axis}
                        fontSize={12}
                        tickLine={false}
                        axisLine={{ stroke: chartTheme.grid }}
                      />
                      <YAxis
                        stroke={chartTheme.axis}
                        fontSize={12}
                        tickLine={false}
                        axisLine={{ stroke: chartTheme.grid }}
                        domain={[0, 100]}
                      />
                      <Tooltip {...tooltipStyles} />
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke={chartTheme.primary}
                        fill="url(#evaluationGradient)"
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                        activeDot={{ r: 4.5 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-center text-sm text-muted-foreground">
                    <AlertCircle className="mb-3 h-8 w-8 text-muted-foreground/80" />
                    No evaluations yet. Be the first to share feedback for this teacher.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Evaluate Teacher</CardTitle>
                <CardDescription>
                  Assign a score and explain the context so the teacher can reflect.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                    <span>Score</span>
                    <span>{scoreValue[0]} / 100</span>
                  </div>
                  <div className="pt-3">
                    <Slider
                      value={scoreValue}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={setScoreValue}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Why does this score fit?
                  </label>
                  <Textarea
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder="Highlight standout moments, key achievements, or areas of growth."
                    rows={4}
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={handleEvaluationSubmit}
                  disabled={!isAdmin || savingEvaluation}
                >
                  {savingEvaluation ? "Saving..." : "Evaluate Teacher"}
                </Button>
                {!isAdmin ? (
                  <p className="text-xs text-muted-foreground">
                    Only administrators can submit official evaluations.
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Schedule</CardTitle>
                <CardDescription>
                  Snapshot of the teacher&apos;s next confirmed sessions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className="h-12 animate-pulse rounded bg-muted/60" />
                    ))}
                  </div>
                ) : sessions.length ? (
                  <ScrollArea className="h-[260px] pr-2">
                    <div className="space-y-3">
                      {sessions.map((session) => (
                        <div
                          key={session.id}
                          className="rounded-lg border bg-muted/30 p-3 shadow-sm"
                        >
                          <div className="flex items-center justify-between gap-2 text-sm font-semibold">
                            <span>{session.class_name ?? "Unassigned class"}</span>
                            <Badge variant="outline" className="capitalize">
                              {session.status ?? "scheduled"}
                            </Badge>
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>
                                {session.session_date
                                  ? format(parseISO(session.session_date), "PPP")
                                  : "Date pending"}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>
                                {session.start_time ?? "??:??"} – {session.end_time ?? "??:??"}
                              </span>
                            </div>
                            {session.lesson_title ? (
                              <div className="mt-1 flex items-center gap-2">
                                <MessageSquare className="h-3.5 w-3.5" />
                                <span>{session.lesson_title}</span>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                    <Calendar className="h-6 w-6" />
                    No upcoming sessions scheduled.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Evaluation History</CardTitle>
                <CardDescription>
                  Feedback shared with the teacher appears instantly on their dashboard.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EvaluationsList mode="admin" teacherId={teacherId} />
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
