import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface AttendanceChartProps {
  studentId: string;
  attendanceRate: number;
}

interface PieLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
}

export default function AttendanceChart({ studentId, attendanceRate }: AttendanceChartProps) {
  const attendance = attendanceRate ? Number(attendanceRate) : 0;
  const absent = 100 - attendance;

  const data = [
    { name: 'Present', value: attendance },
    { name: 'Absent', value: absent },
  ];

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))'];

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

  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: PieLabelProps) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
    const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="font-semibold"
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Attendance Overview</CardTitle>
          <CardDescription>Your attendance record at a glance</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
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
