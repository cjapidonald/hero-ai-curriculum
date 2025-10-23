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
import EvaluationsList from "@/components/teacher/EvaluationsList";
import PerformanceDashboard from "@/components/teacher/PerformanceDashboard";

type TeacherPayrollRecord = Tables<"teacher_payroll">;
type TeacherRecord = Tables<"teachers">;

interface TeacherPerformanceProps {
  teacherId: string;
  teacherProfile?: TeacherRecord | null;
}

interface TeacherMetricsProps {
  records: TeacherPayrollRecord[];
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

const TeacherMetrics = ({ records, teacherProfile }: TeacherMetricsProps) => {
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

  const attendanceChartData = stats.attendanceBreakdown.map((item) => ({
    name: formatStatus(item.status, attendanceStatusLabels),
    value: item.value,
  }));

  const attendanceChartConfig: ChartConfig = stats.attendanceBreakdown.reduce(
    (acc, item, index) => {
      const key = formatStatus(item.status, attendanceStatusLabels);
      acc[key] = {
        label: key,
        color: chartColors[index % chartColors.length],
      };
      return acc;
    },
    {} as ChartConfig,
  );

  const earningsChartConfig: ChartConfig = stats.earningsByClass.reduce(
    (acc, item, index) => {
      acc[item.name] = {
        label: item.name,
        color: chartColors[index % chartColors.length],
      };
      return acc;
    },
    {} as ChartConfig,
  );

  const upcomingSessions = stats.upcomingSessions.slice(0, 5);
  const profile = teacherProfile ?? null;

  return (
    <div className="space-y-6">
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
                    {profile.name?.charAt(0)}
                    {profile.surname?.charAt(0)}
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

const TeacherPerformance = ({ teacherId, teacherProfile }: TeacherPerformanceProps) => {
  const [records, setRecords] = useState<TeacherPayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teacherId) return;

    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      const payrollPromise = supabase
        .from("teacher_payroll")
        .select("*")
        .eq("teacher_id", teacherId)
        .order("session_date", { ascending: false });

      const [payrollResult] = await Promise.allSettled([
        payrollPromise,
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

      setLoading(false);
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [teacherId]);

  const evaluationSection = (
    <Card>
      <CardHeader>
        <CardTitle>Evaluation Feedback</CardTitle>
      </CardHeader>
      <CardContent>
        <EvaluationsList mode="teacher" />
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

  return (
    <div className="space-y-6">
      <PerformanceDashboard teacherId={teacherId} />
      {evaluationSection}
      <TeacherMetrics records={records} teacherProfile={teacherProfile} />
    </div>
  );
};

export default TeacherPerformance;