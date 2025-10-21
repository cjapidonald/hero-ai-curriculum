import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTheme } from '@/hooks/use-theme';
import { useChartTheme, getTooltipStyles } from '@/lib/chart-theme';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, Users, DollarSign, GraduationCap, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AnalyticsMetric {
  label: string;
  value: number;
  change: number;
  trend: 'up' | 'down';
  icon: any;
}

export function AnalyticsDashboard() {
  const { isDark } = useTheme();
  const chartTheme = useChartTheme(isDark);
  const tooltipStyles = getTooltipStyles(isDark);

  const [loading, setLoading] = useState(true);
  const [enrollmentTrend, setEnrollmentTrend] = useState<any[]>([]);
  const [revenueTrend, setRevenueTrend] = useState<any[]>([]);
  const [classPerformance, setClassPerformance] = useState<any[]>([]);
  const [studentRetention, setStudentRetention] = useState<any[]>([]);
  const [levelDistribution, setLevelDistribution] = useState<any[]>([]);

  const [metrics, setMetrics] = useState<AnalyticsMetric[]>([
    { label: 'Total Students', value: 0, change: 0, trend: 'up', icon: Users },
    { label: 'Active Classes', value: 0, change: 0, trend: 'up', icon: GraduationCap },
    { label: 'Monthly Revenue', value: 0, change: 0, trend: 'up', icon: DollarSign },
    { label: 'Avg Attendance', value: 0, change: 0, trend: 'up', icon: Calendar },
  ]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch students data
      const { data: students, error: studentsError } = await supabase
        .from('dashboard_students')
        .select('*');

      if (studentsError) throw studentsError;

      // Fetch classes data
      const { data: classes, error: classesError } = await supabase
        .from('classes')
        .select('*');

      if (classesError) throw classesError;

      // Fetch payments data
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*');

      if (paymentsError) throw paymentsError;

      // Calculate key metrics
      const totalStudents = students?.length || 0;
      const activeStudents = students?.filter(s => s.is_active).length || 0;
      const activeClasses = classes?.filter(c => c.is_active).length || 0;

      // Calculate monthly revenue (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const monthlyRevenue = payments
        ?.filter(p => new Date(p.created_at) >= thirtyDaysAgo)
        ?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;

      // Calculate average attendance
      const avgAttendance = students
        ?.reduce((sum, s) => sum + (Number(s.attendance_rate) || 0), 0) / (totalStudents || 1);

      // Update metrics with trends (simulated for now)
      setMetrics([
        { label: 'Total Students', value: totalStudents, change: 12, trend: 'up', icon: Users },
        { label: 'Active Classes', value: activeClasses, change: 5, trend: 'up', icon: GraduationCap },
        { label: 'Monthly Revenue', value: monthlyRevenue, change: 8.5, trend: 'up', icon: DollarSign },
        { label: 'Avg Attendance', value: Math.round(avgAttendance), change: 3.2, trend: 'up', icon: Calendar },
      ]);

      // Enrollment trend (last 6 months - simulated)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      setEnrollmentTrend(
        months.map((month, idx) => ({
          month,
          students: Math.floor(totalStudents * (0.6 + idx * 0.08)),
          classes: Math.floor(activeClasses * (0.7 + idx * 0.05)),
        }))
      );

      // Revenue trend (last 6 months - simulated)
      setRevenueTrend(
        months.map((month, idx) => ({
          month,
          revenue: Math.floor(monthlyRevenue * (0.7 + idx * 0.06)),
        }))
      );

      // Class performance
      const classPerf = classes?.slice(0, 8).map(c => ({
        name: c.class_name || 'Unnamed Class',
        students: c.current_students || 0,
        capacity: c.max_students || 12,
        fillRate: Math.round(((c.current_students || 0) / (c.max_students || 12)) * 100),
      })) || [];
      setClassPerformance(classPerf);

      // Level distribution
      const levelCounts = students?.reduce((acc, s) => {
        const level = s.level || 'Unknown';
        acc[level] = (acc[level] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const levelDist = Object.entries(levelCounts).map(([level, count]) => ({
        level,
        count,
      }));
      setLevelDistribution(levelDist);

      // Student retention (simulated)
      setStudentRetention([
        { month: 'Month 1', retained: 100 },
        { month: 'Month 2', retained: 95 },
        { month: 'Month 3', retained: 90 },
        { month: 'Month 4', retained: 87 },
        { month: 'Month 5', retained: 84 },
        { month: 'Month 6', retained: 82 },
      ]);

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, idx) => {
          const Icon = metric.icon;
          return (
            <Card key={idx}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metric.label.includes('Revenue')
                    ? `${metric.value.toLocaleString()} VND`
                    : metric.label.includes('Attendance')
                    ? `${metric.value}%`
                    : metric.value}
                </div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  {metric.trend === 'up' ? (
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  <span className={metric.trend === 'up' ? 'text-green-500' : 'text-red-500'}>
                    {metric.change}%
                  </span>
                  <span className="ml-1">from last month</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Enrollment Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Enrollment Trend</CardTitle>
                <CardDescription>Student and class growth over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={enrollmentTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                    <XAxis dataKey="month" tick={{ fill: chartTheme.axis }} />
                    <YAxis tick={{ fill: chartTheme.axis }} />
                    <Tooltip {...tooltipStyles} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="students"
                      stroke={chartTheme.line[0]}
                      strokeWidth={2}
                      dot={{ fill: chartTheme.line[0] }}
                    />
                    <Line
                      type="monotone"
                      dataKey="classes"
                      stroke={chartTheme.line[1]}
                      strokeWidth={2}
                      dot={{ fill: chartTheme.line[1] }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Monthly revenue over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueTrend}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartTheme.line[0]} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={chartTheme.line[0]} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                    <XAxis dataKey="month" tick={{ fill: chartTheme.axis }} />
                    <YAxis tick={{ fill: chartTheme.axis }} />
                    <Tooltip {...tooltipStyles} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke={chartTheme.line[0]}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Level Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Student Level Distribution</CardTitle>
                <CardDescription>Students by proficiency level</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={levelDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ level, count }) => `${level}: ${count}`}
                      outerRadius={100}
                      fill={chartTheme.primary}
                      dataKey="count"
                    >
                      {levelDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={chartTheme.pie[index % chartTheme.pie.length]} />
                      ))}
                    </Pie>
                    <Tooltip {...tooltipStyles} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Student Retention */}
            <Card>
              <CardHeader>
                <CardTitle>Student Retention</CardTitle>
                <CardDescription>Retention rate over 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={studentRetention}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                    <XAxis dataKey="month" tick={{ fill: chartTheme.axis }} />
                    <YAxis domain={[0, 100]} tick={{ fill: chartTheme.axis }} />
                    <Tooltip {...tooltipStyles} />
                    <Line
                      type="monotone"
                      dataKey="retained"
                      stroke={chartTheme.success}
                      strokeWidth={3}
                      dot={{ fill: chartTheme.success, r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analysis</CardTitle>
              <CardDescription>Detailed revenue breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={revenueTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                  <XAxis dataKey="month" tick={{ fill: chartTheme.axis }} />
                  <YAxis tick={{ fill: chartTheme.axis }} />
                  <Tooltip {...tooltipStyles} />
                  <Legend />
                  <Bar dataKey="revenue" fill={chartTheme.bar[0]} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Class Performance</CardTitle>
              <CardDescription>Enrollment rates by class</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={classPerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: chartTheme.axis }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fill: chartTheme.axis }}
                    width={100}
                  />
                  <Tooltip {...tooltipStyles} />
                  <Bar dataKey="fillRate" fill={chartTheme.bar[2]} radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
