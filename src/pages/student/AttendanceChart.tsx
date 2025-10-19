import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Legend } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface AttendanceChartProps {
  studentId: string;
  attendanceRate: number;
  sessionsCompleted: number;
}

export default function AttendanceChart({ studentId, attendanceRate, sessionsCompleted }: AttendanceChartProps) {
  const attendance = attendanceRate ? Number(attendanceRate) : 0;
  const absent = 100 - attendance;

  const data = [
    { name: 'Present', value: attendance },
    { name: 'Absent', value: absent },
  ];

  const COLORS = ['url(#attendancePresentGradient)', 'rgba(148,163,184,0.25)'];

  const chartConfig = {
    Present: {
      label: 'Present',
      color: 'hsl(var(--chart-1))',
    },
    Absent: {
      label: 'Absent',
      color: 'hsl(var(--chart-2))',
    },
  };

  if (sessionsCompleted === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Attendance Overview</CardTitle>
          <CardDescription>Your attendance record at a glance</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[400px]">
          <div className="text-center text-muted-foreground">
            <p>No attendance data yet.</p>
            <p className="text-sm">Your attendance will be tracked once you attend your first class.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-none bg-gradient-to-br from-white/85 via-white/40 to-white/15 dark:from-slate-900/70 dark:via-slate-900/40 dark:to-slate-900/10 backdrop-blur-xl shadow-xl">
        <CardHeader>
          <CardTitle>Attendance Overview</CardTitle>
          <CardDescription>Your attendance record at a glance</CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="relative h-[340px]">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.18),transparent_65%)]" />
            <ChartContainer
              config={chartConfig}
              className="h-full w-full rounded-full bg-gradient-to-br from-white/60 via-white/25 to-white/5 dark:from-slate-900/60 dark:via-slate-900/30 dark:to-slate-900/5 backdrop-blur-xl border border-white/40 dark:border-slate-800 shadow-[0_25px_55px_-35px_rgba(15,23,42,0.9)]"
            >
              <PieChart>
                <defs>
                  <linearGradient id="attendancePresentGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  startAngle={210}
                  endAngle={-150}
                  innerRadius={95}
                  outerRadius={125}
                  paddingAngle={attendance > 0 && absent > 0 ? 6 : 0}
                  cornerRadius={attendance > 0 ? 18 : 0}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <ChartTooltip
                  content={
                    <ChartTooltipContent className="border border-slate-700/60 bg-slate-900/75 text-slate-100 backdrop-blur-xl" />
                  }
                />
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12, fontWeight: 500, paddingTop: 24 }}
                />
              </PieChart>
            </ChartContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1">
              <span className="text-4xl font-semibold text-slate-900 dark:text-slate-100">
                {attendance.toFixed(0)}%
              </span>
              <span className="text-sm tracking-wide text-muted-foreground">Present</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Attendance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{attendance.toFixed(1)}%</div>
            <p className="text-sm text-muted-foreground mt-1">Classes attended</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Absence Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{absent.toFixed(1)}%</div>
            <p className="text-sm text-muted-foreground mt-1">Classes missed</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {attendance >= 90 && (
              <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="font-semibold text-green-800 dark:text-green-200">Excellent Attendance!</p>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  Keep up the great work! Your attendance is outstanding.
                </p>
              </div>
            )}
            {attendance >= 75 && attendance < 90 && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="font-semibold text-blue-800 dark:text-blue-200">Good Attendance</p>
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                  You're doing well! Try to maintain or improve your attendance rate.
                </p>
              </div>
            )}
            {attendance >= 50 && attendance < 75 && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="font-semibold text-yellow-800 dark:text-yellow-200">Needs Improvement</p>
                <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                  Your attendance could be better. Try to attend classes more regularly.
                </p>
              </div>
            )}
            {attendance < 50 && (
              <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="font-semibold text-red-800 dark:text-red-200">Poor Attendance</p>
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  Your attendance is concerning. Please speak with your teacher.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
