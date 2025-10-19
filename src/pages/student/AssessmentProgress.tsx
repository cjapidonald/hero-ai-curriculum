import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { format, subMonths, subWeeks } from "date-fns";
import { Badge } from "@/components/ui/badge";
import type { Tables } from "@/integrations/supabase/types";

interface AssessmentProgressProps {
  studentId: string;
}

type TimeFilter = '1week' | '1month' | '3months' | '6months' | '9months';

type AssessmentRecord = Tables<"assessment">;

export default function AssessmentProgress({ studentId }: AssessmentProgressProps) {
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('1month');

  useEffect(() => {
    const getDateFilter = () => {
      const now = new Date();
      switch (timeFilter) {
        case '1week':
          return subWeeks(now, 1);
        case '1month':
          return subMonths(now, 1);
        case '3months':
          return subMonths(now, 3);
        case '6months':
          return subMonths(now, 6);
        case '9months':
          return subMonths(now, 9);
        default:
          return subMonths(now, 1);
      }
    };

    const fetchAssessments = async () => {
      try {
        setLoading(true);
        setError(null);
        const dateFilter = getDateFilter();

        const { data, error } = await supabase
          .from("assessment")
          .select("*")
          .eq("student_id", studentId)
          .eq("published", true)
          .gte("assessment_date", dateFilter.toISOString())
          .order("assessment_date", { ascending: true });

        if (error) throw error;
        setAssessments((data ?? []) as AssessmentRecord[]);
      } catch (error: any) {
        console.error("Error fetching assessments:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      fetchAssessments();
    }
  }, [studentId, timeFilter]);

  const prepareLineChartData = () =>
    assessments
      .filter((assessment) => Boolean(assessment.assessment_date))
      .map((assessment) => {
        const dateLabel = assessment.assessment_date
          ? format(new Date(assessment.assessment_date), "MMM dd")
          : "Unknown";
        return {
          date: dateLabel,
          score: assessment.total_score ?? 0,
          test: assessment.test_name,
        };
      });

  const prepareBarChartData = () =>
    assessments.map((assessment) => {
      const label =
        assessment.test_name.length > 20
          ? `${assessment.test_name.substring(0, 20)}...`
          : assessment.test_name;
      return {
        test: label,
        r1: assessment.r1_score ?? 0,
        r2: assessment.r2_score ?? 0,
        r3: assessment.r3_score ?? 0,
        r4: assessment.r4_score ?? 0,
        r5: assessment.r5_score ?? 0,
      };
    });

  const calculateAverageScore = () => {
    if (!assessments.length) return 0;
    const sum = assessments.reduce((acc, assessment) => acc + (assessment.total_score || 0), 0);
    return (sum / assessments.length).toFixed(2);
  };

  const getLatestScore = () => {
    if (!assessments.length) return 0;
    return assessments[assessments.length - 1].total_score || 0;
  };

  const lineChartData = prepareLineChartData();
  const barChartData = prepareBarChartData();

  const chartConfig = {
    score: {
      label: 'Total Score',
      color: 'hsl(var(--chart-1))',
    },
    r1: {
      label: 'Rubric 1',
      color: 'hsl(var(--chart-1))',
    },
    r2: {
      label: 'Rubric 2',
      color: 'hsl(var(--chart-2))',
    },
    r3: {
      label: 'Rubric 3',
      color: 'hsl(var(--chart-3))',
    },
    r4: {
      label: 'Rubric 4',
      color: 'hsl(var(--chart-4))',
    },
    r5: {
      label: 'Rubric 5',
      color: 'hsl(var(--chart-5))',
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-destructive">Failed to load assessments</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Assessment Performance</CardTitle>
          <CardDescription>Track your test scores and progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <label className="text-sm font-medium mb-2 block">Time Period</label>
            <Select value={timeFilter} onValueChange={(value) => setTimeFilter(value as TimeFilter)}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1week">Last Week</SelectItem>
                <SelectItem value="1month">Last Month</SelectItem>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="9months">Last 9 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Average Score</p>
              <p className="text-3xl font-bold text-primary">{calculateAverageScore()}</p>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Latest Score</p>
              <p className="text-3xl font-bold">{getLatestScore()}</p>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Assessments</p>
              <p className="text-3xl font-bold">{assessments.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Score Trend Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Score Trend</CardTitle>
          <CardDescription>Your assessment scores over time</CardDescription>
        </CardHeader>
        <CardContent>
          {lineChartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChartData}>
                  <CartesianGrid strokeDasharray="0" stroke="#e5e7eb" strokeOpacity={0.5} vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                    domain={[0, 5]}
                    ticks={[0, 1, 2, 3, 4, 5]}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="var(--color-score)"
                    strokeWidth={3}
                    dot={{ r: 5, fill: 'var(--color-score)' }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
              <p>No assessments available for the selected period</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rubric Breakdown Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Rubric Breakdown</CardTitle>
          <CardDescription>Performance by assessment criteria</CardDescription>
        </CardHeader>
        <CardContent>
          {barChartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="0" stroke="#e5e7eb" strokeOpacity={0.5} vertical={false} />
                  <XAxis
                    dataKey="test"
                    tick={{ fill: '#6b7280', fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                    domain={[0, 5]}
                    ticks={[0, 1, 2, 3, 4, 5]}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="r1" fill="var(--color-r1)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="r2" fill="var(--color-r2)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="r3" fill="var(--color-r3)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="r4" fill="var(--color-r4)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="r5" fill="var(--color-r5)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[350px] text-muted-foreground">
              <p>No rubric data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assessment List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Assessments</CardTitle>
          <CardDescription>Detailed view of your assessments</CardDescription>
        </CardHeader>
        <CardContent>
          {assessments.length > 0 ? (
            <div className="space-y-4">
              {assessments.map((assessment) => (
                <div
                  key={assessment.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">{assessment.test_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(assessment.assessment_date), 'MMMM dd, yyyy')}
                      </p>
                    </div>
                    <Badge variant="default" className="text-lg">
                      {assessment.total_score}
                    </Badge>
                  </div>
                  {assessment.feedback && (
                    <div className="mt-3 p-3 bg-muted/30 rounded-md">
                      <p className="text-sm font-medium mb-1">Teacher Feedback:</p>
                      <p className="text-sm text-muted-foreground">{assessment.feedback}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No assessments available for the selected period
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
