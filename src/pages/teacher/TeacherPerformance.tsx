import { useEffect, useMemo, useState } from "react";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip as RechartsTooltip,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { AlertCircle, Clock, DollarSign, TrendingUp, MessageSquare, Award } from "lucide-react";

type TeacherPayrollRecord = Tables<"teacher_payroll">;
type TeacherRecord = Tables<"teachers">;

interface TeacherPerformanceProps {
  teacherId: string;
  teacherProfile?: TeacherRecord | null;
}

interface TeacherEvaluationRecord {
  id: string;
  teacher_id?: string;
  admin_id?: string | null;
  score: number;
  comment: string | null;
  created_at: string;
  admins?: {
    name: string | null;
    surname: string | null;
  } | null;
}

const chartColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const attendanceStatusLabels: Record<string, string> = {
  present: "Present",
  absent: "Absent",
  sick_leave: "Sick Leave",
  substitute: "Substitute",
  pending: "Pending",
};

const payoutStatusLabels: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  paid: "Paid",
};

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const payoutBadgeClass = (status: string | null | undefined) => {
  switch (status) {
    case "paid":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-100";
    case "approved":
      return "border-sky-500/40 bg-sky-500/10 text-sky-600 dark:border-sky-500/40 dark:bg-sky-500/20 dark:text-sky-100";
    default:
      return "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-100";
  }
};

const computeNet = (record: TeacherPayrollRecord) => {
  const hours = record.hours_taught ?? 0;
  const rate = record.hourly_rate ?? 0;
  const bonus = record.bonus_amount ?? 0;
  const deduction = record.deduction_amount ?? 0;
  return hours * rate + bonus - deduction;
};

const parseSessionDate = (sessionDate: string | null) => {
  try {
    return sessionDate ? parseISO(sessionDate) : null;
  } catch {
    return null;
  }
};

const formatStatus = (status: string | null | undefined, labels: Record<string, string>) =>
  status ? labels[status] ?? status.replace(/_/g, " ") : "Unknown";

const TeacherPerformance = ({ teacherId, teacherProfile }: TeacherPerformanceProps) => {
  const [records, setRecords] = useState<TeacherPayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [evaluations, setEvaluations] = useState<TeacherEvaluationRecord[]>([]);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);

  useEffect(() => {
    if (!teacherId) return;

    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      setEvaluationError(null);

      const payrollPromise = supabase
        .from("teacher_payroll")
        .select("*")
        .eq("teacher_id", teacherId)
        .order("session_date", { ascending: false });

      const evaluationsPromise = supabase
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

      const [payrollResult, evaluationResult] = await Promise.allSettled([
        payrollPromise,
        evaluationsPromise,
      ]);

      if (!isMounted) {
        return;
      }

      if (payrollResult.status === "fulfilled") {
        const { data, error: queryError } = payrollResult.value;
        if (queryError) {
          console.error("Error loading teacher payroll:", queryError);
          setError("Unable to load payroll information right now.");
          setRecords([]);
        } else {
          setRecords((data as TeacherPayrollRecord[]) ?? []);
        }
      } else {
        console.error("Unexpected payroll error:", payrollResult.reason);
        setError("Unable to load payroll information right now.");
        setRecords([]);
      }

      if (evaluationResult.status === "fulfilled") {
        const { data, error: evalError } = evaluationResult.value;
        if (evalError) {
          if (evalError.code === "42P01") {
            setEvaluationError("Teacher evaluations are not enabled yet. Please contact your administrator.");
            setEvaluations([]);
          } else {
            console.error("Error loading evaluations:", evalError);
            setEvaluationError("Unable to load evaluations at the moment.");
            setEvaluations([]);
          }
        } else {
          setEvaluations((data as TeacherEvaluationRecord[]) ?? []);
        }
      } else {
        console.error("Unexpected evaluation error:", evaluationResult.reason);
        setEvaluationError("Unable to load evaluations at the moment.");
        setEvaluations([]);
      }

      setLoading(false);
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [teacherId]);

  const stats = useMemo(() => {
    if (!records.length) {
      return {
        totalHours: 0,
        totalNet: 0,
        totalBonus: 0,
        totalDeduction: 0,
        attendanceRate: 0,
        attendanceBreakdown: [] as { status: string; value: number }[],
        earningsByClass: [] as { name: string; value: number }[],
        upcomingTotal: 0,
        upcomingSessions: [] as TeacherPayrollRecord[],
        monthHours: 0,
        monthNet: 0,
        latestMonthLabel: null as string | null,
      };
    }

    const totals = records.reduce(
      (acc, record) => {
        const net = computeNet(record);
        acc.totalHours += record.hours_taught ?? 0;
        acc.totalNet += net;
        acc.totalBonus += record.bonus_amount ?? 0;
        acc.totalDeduction += record.deduction_amount ?? 0;
        const statusKey = record.attendance_status ?? "pending";
        acc.attendanceCounts[statusKey] = (acc.attendanceCounts[statusKey] ?? 0) + 1;

        const classKey = record.class_name ?? "Unassigned";
        acc.classTotals[classKey] = (acc.classTotals[classKey] ?? 0) + net;

        if (record.payout_status !== "paid") {
          acc.upcomingTotal += net;
          acc.upcomingSessions.push(record);
        }

        const parsedDate = parseSessionDate(record.session_date);
        if (parsedDate && (!acc.latestDate || parsedDate > acc.latestDate)) {
          acc.latestDate = parsedDate;
        }

        return acc;
      },
      {
        totalHours: 0,
        totalNet: 0,
        totalBonus: 0,
        totalDeduction: 0,
        attendanceCounts: {} as Record<string, number>,
        classTotals: {} as Record<string, number>,
        upcomingTotal: 0,
        upcomingSessions: [] as TeacherPayrollRecord[],
        latestDate: null as Date | null,
      },
    );

    const attendanceBreakdown = Object.entries(totals.attendanceCounts).map(([status, value]) => ({
      status,
      value,
    }));

    const earningsByClass = Object.entries(totals.classTotals)
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));

    const latestMonthLabel = totals.latestDate ? format(totals.latestDate, "MMMM yyyy") : null;

    const monthRecords = totals.latestDate
      ? records.filter((record) => {
          const recordDate = parseSessionDate(record.session_date);
          return (
            recordDate &&
            recordDate.getMonth() === totals.latestDate!.getMonth() &&
            recordDate.getFullYear() === totals.latestDate!.getFullYear()
          );
        })
      : [];

    const monthHours = monthRecords.reduce((acc, record) => acc + (record.hours_taught ?? 0), 0);
    const monthNet = monthRecords.reduce((acc, record) => acc + computeNet(record), 0);

    const totalSessions = records.length;
    const presentSessions = totals.attendanceCounts.present ?? 0;
    const attendanceRate = totalSessions > 0 ? (presentSessions / totalSessions) * 100 : 0;

    return {
      totalHours: totals.totalHours,
      totalNet: totals.totalNet,
      totalBonus: totals.totalBonus,
      totalDeduction: totals.totalDeduction,
      attendanceRate,
      attendanceBreakdown,
      earningsByClass,
      upcomingTotal: totals.upcomingTotal,
      upcomingSessions: totals.upcomingSessions,
      monthHours,
      monthNet,
      latestMonthLabel,
    };
  }, [records]);

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

  const attendanceChartConfig = useMemo<ChartConfig>(() => {
    const config: ChartConfig = {};

    stats.attendanceBreakdown.forEach((item, index) => {
      const label = formatStatus(item.status, attendanceStatusLabels);
      config[label] = {
        label,
        color: chartColors[index % chartColors.length],
      };
    });

    return config;
  }, [stats.attendanceBreakdown]);

  const earningsChartConfig = useMemo<ChartConfig>(() => {
    const config: ChartConfig = {};

    stats.earningsByClass.forEach((item, index) => {
      config[item.name] = {
        label: item.name,
        color: chartColors[index % chartColors.length],
      };
    });

    return config;
  }, [stats.earningsByClass]);

  const attendanceChartData = stats.attendanceBreakdown.map((item) => ({
    name: formatStatus(item.status, attendanceStatusLabels),
    value: item.value,
  }));

  const upcomingSessions = stats.upcomingSessions.slice(0, 5);
  const evaluationDeltaLabel =
    evaluationStats.delta === null
      ? "Awaiting next review"
      : evaluationStats.delta > 0
        ? `▲ ${evaluationStats.delta.toFixed(1)} since last`
        : evaluationStats.delta < 0
          ? `▼ ${Math.abs(evaluationStats.delta).toFixed(1)} since last`
          : "No change since last";

  const evaluationLastUpdated = evaluationStats.latestAt
    ? formatDistanceToNow(parseISO(evaluationStats.latestAt), { addSuffix: true })
    : null;

  const evaluationSection = (
    <Card>
      <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle>Evaluation Feedback</CardTitle>
          <CardDescription>
            Scores and notes shared by admin so you can track your teaching impact.
          </CardDescription>
        </div>
        {evaluationLastUpdated ? (
          <Badge variant="secondary" className="whitespace-nowrap">
            Updated {evaluationLastUpdated}
          </Badge>
        ) : null}
      </CardHeader>
      <CardContent>
        {evaluationError ? (
          <p className="text-sm text-destructive">{evaluationError}</p>
        ) : evaluations.length ? (
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="space-y-4 rounded-lg border bg-muted/40 p-4 lg:col-span-2">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <Award className="h-4 w-4 text-purple-500" />
                  <span>Average Score</span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-bold">
                    {evaluationStats.average.toFixed(1)}
                  </span>
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    / 100
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{evaluationDeltaLabel}</p>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Latest score</span>
                  <Badge variant="outline">
                    {evaluationStats.latestScore !== null ? `${evaluationStats.latestScore}/100` : "—"}
                  </Badge>
                </div>
                {evaluationStats.latestComment ? (
                  <p className="rounded-md border bg-background/80 p-3 leading-relaxed">
                    “{evaluationStats.latestComment}”
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Latest evaluation did not include written comments.
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-4 lg:col-span-3">
              <div className="h-[200px] rounded-lg border bg-background/40 p-2">
                {evaluationStats.trend.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={evaluationStats.trend}>
                      <defs>
                        <linearGradient id="teacherEvaluationGradient" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.6} />
                          <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="label" />
                      <YAxis domain={[0, 100]} />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          borderColor: "hsl(var(--border))",
                          borderRadius: 12,
                        }}
                        formatter={(value: number) => [`${value.toFixed(1)}`, "Score"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke="hsl(var(--chart-1))"
                        strokeWidth={2.5}
                        fill="url(#teacherEvaluationGradient)"
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    Complete more evaluations to unlock the trend view.
                  </div>
                )}
              </div>
              <div className="space-y-3">
                {evaluations.slice(0, 3).map((evaluation) => {
                  const createdAt = parseISO(evaluation.created_at);
                  const relative = formatDistanceToNow(createdAt, { addSuffix: true });
                  const evaluatorName = evaluation.admins
                    ? `${evaluation.admins.name ?? ""} ${evaluation.admins.surname ?? ""}`.trim()
                    : "Admin";
                  return (
                    <div
                      key={evaluation.id}
                      className="rounded-lg border bg-muted/30 p-3"
                    >
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{relative}</span>
                        <Badge variant="outline">Score {evaluation.score}</Badge>
                      </div>
                      <div className="mt-2 flex items-start gap-2 text-sm">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <p className="leading-relaxed">
                          {evaluation.comment ?? "No written comment for this evaluation."}
                        </p>
                      </div>
                      <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">
                        {`By ${evaluatorName}`}
                      </p>
                    </div>
                  );
                })}
                {evaluations.length > 3 ? (
                  <p className="text-xs text-muted-foreground">
                    Showing the latest feedback. Older evaluations remain available in admin records.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-sm text-muted-foreground">
            <MessageSquare className="h-6 w-6" />
            No evaluations yet. Once admin shares feedback, it will appear here.
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Evaluation Feedback</CardTitle>
            <CardDescription>Loading the latest evaluation insights...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-20 animate-pulse rounded-lg bg-muted" />
              <div className="h-32 animate-pulse rounded-lg bg-muted" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Performance & Payroll</CardTitle>
            <CardDescription>Loading your recent payroll information...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-32 animate-pulse rounded-lg bg-muted" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        {evaluationSection}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Performance & Payroll</CardTitle>
              <CardDescription>Stay updated with your teaching impact and payouts.</CardDescription>
            </div>
            <Badge variant="destructive" className="gap-1">
              <AlertCircle size={14} />
              Attention
            </Badge>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!records.length) {
    return (
      <div className="space-y-6">
        {evaluationSection}
        <Card>
          <CardHeader>
            <CardTitle>Performance & Payroll</CardTitle>
            <CardDescription>Once admin logs your sessions, your payroll details appear here.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              There are no payroll records yet. Please check back after your next class or contact admin if this seems
              incorrect.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const profile = teacherProfile ?? null;

  return (
    <div className="space-y-6">
      {evaluationSection}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latest Cycle Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.monthHours.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.latestMonthLabel ? stats.latestMonthLabel : "Recent sessions"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currencyFormatter.format(stats.monthNet)}</div>
            <p className="text-xs text-muted-foreground">Net pay for the latest cycle</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.attendanceRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Based on recorded sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Payout</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currencyFormatter.format(stats.upcomingTotal)}</div>
            <p className="text-xs text-muted-foreground">Awaiting admin confirmation</p>
          </CardContent>
        </Card>
      </div>

      {profile && (
        <Card>
          <CardHeader>
            <CardTitle>Teacher Profile</CardTitle>
            <CardDescription>Your teaching style and contact details</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 overflow-hidden rounded-full border">
                {profile.profile_image_url ? (
                  <img
                    src={profile.profile_image_url}
                    alt={`${profile.name} ${profile.surname}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-primary/10 text-lg font-semibold text-primary">
                    {profile.name.charAt(0)}
                    {profile.surname.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold">
                  {profile.name} {profile.surname}
                </h3>
                <p className="text-sm text-muted-foreground">{profile.subject ?? "Teacher"}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>{profile.email}</span>
                  {profile.phone && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span>{profile.phone}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            {profile.bio && (
              <p className="text-sm text-muted-foreground md:w-1/2">{profile.bio}</p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Attendance Breakdown</CardTitle>
            <CardDescription>How your recorded sessions are distributed</CardDescription>
          </CardHeader>
          <CardContent>
            {attendanceChartData.length > 0 ? (
              <ChartContainer config={attendanceChartConfig} className="h-[320px] w-full">
                <PieChart>
                  <Pie
                    data={attendanceChartData}
                    innerRadius={70}
                    outerRadius={120}
                    dataKey="value"
                    nameKey="name"
                    paddingAngle={2}
                  >
                    {attendanceChartData.map((entry, index) => (
                      <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
                Attendance data will appear once sessions are recorded.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Earnings by Class</CardTitle>
            <CardDescription>Net earnings grouped by class name</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.earningsByClass.length > 0 ? (
              <ChartContainer config={earningsChartConfig} className="h-[320px] w-full">
                <BarChart data={stats.earningsByClass}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        hideLabel
                        formatter={(value) => currencyFormatter.format(Number(value ?? 0))}
                      />
                    }
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {stats.earningsByClass.map((entry, index) => (
                      <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
                Earnings data will appear once sessions are approved.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {upcomingSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Awaiting Payout</CardTitle>
            <CardDescription>Sessions that still need finance approval</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingSessions.map((record) => (
              <div
                key={record.id}
                className="flex flex-col gap-2 rounded-lg border p-3 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold">{record.class_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {record.lesson_title ?? "Session"} •{" "}
                    {record.session_date ? format(parseISO(record.session_date), "dd MMM yyyy") : "Date TBD"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={payoutBadgeClass(record.payout_status)}>
                    {formatStatus(record.payout_status ?? "pending", payoutStatusLabels)}
                  </Badge>
                  <Badge variant="outline">
                    {formatStatus(record.attendance_status ?? "present", attendanceStatusLabels)}
                  </Badge>
                  <span className="text-sm font-semibold">
                    {currencyFormatter.format(computeNet(record))}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
          <CardDescription>A detailed log of your latest recorded sessions</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Lesson</TableHead>
                <TableHead>Attendance</TableHead>
                <TableHead className="text-right">Hours</TableHead>
                <TableHead className="text-right">Net Pay</TableHead>
                <TableHead className="text-right">Payout Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.slice(0, 10).map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    {record.session_date ? format(parseISO(record.session_date), "dd MMM yyyy") : "—"}
                  </TableCell>
                  <TableCell className="font-medium">{record.class_name}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{record.lesson_title ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {formatStatus(record.attendance_status ?? "present", attendanceStatusLabels)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{(record.hours_taught ?? 0).toFixed(1)}</TableCell>
                  <TableCell className="text-right font-semibold">{currencyFormatter.format(computeNet(record))}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className={payoutBadgeClass(record.payout_status)}>
                      {formatStatus(record.payout_status ?? "pending", payoutStatusLabels)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherPerformance;
