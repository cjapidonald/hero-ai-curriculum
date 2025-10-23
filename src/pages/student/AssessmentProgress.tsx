import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, Line, ComposedChart, Area } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { format, subMonths, subWeeks } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface AssessmentProgressProps {
  studentId: string;
}

type TimeFilter = '1week' | '1month' | '3months' | '6months' | '9months';

interface EvaluationRecord {
  score: number | null;
  evaluation_date: string | null;
  text_feedback?: string | null;
  skills: {
    skill_name?: string | null;
    subject?: string | null;
  } | null;
}

export default function AssessmentProgress({ studentId }: AssessmentProgressProps) {
  const [evaluations, setEvaluations] = useState<EvaluationRecord[]>([]);
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

    const fetchEvaluations = async () => {
      try {
        setLoading(true);
        setError(null);
        const dateFilter = getDateFilter();

        const { data, error } = await supabase
          .from("skill_evaluations")
          .select(
            `score, text_feedback, evaluation_date, skills:skill_id (skill_name, subject)`
          )
          .eq("student_id", studentId)
          .gte("evaluation_date", dateFilter.toISOString())
          .order("evaluation_date", { ascending: true });

        if (error) throw error;
        setEvaluations((data ?? []) as EvaluationRecord[]);
      } catch (error: any) {
        console.error("Error fetching evaluations:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      fetchEvaluations();
    }
  }, [studentId, timeFilter]);

  const prepareLineChartData = () => {
    const grouped = evaluations.reduce<Record<string, { total: number; count: number }>>((acc, evaluation) => {
      if (!evaluation.evaluation_date || evaluation.score === null) {
        return acc;
      }

      const dateKey = new Date(evaluation.evaluation_date).toISOString().slice(0, 10);
      if (!acc[dateKey]) {
        acc[dateKey] = { total: 0, count: 0 };
      }

      acc[dateKey].total += Number(evaluation.score);
      acc[dateKey].count += 1;
      return acc;
    }, {});

    return Object.entries(grouped)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, bucket]) => ({
        date: format(new Date(date), "MMM dd"),
        score: bucket.count ? Number((bucket.total / bucket.count).toFixed(2)) : 0,
      }));
  };

  const prepareBarChartData = () => {
    const grouped = evaluations.reduce<Record<string, { total: number; count: number }>>((acc, evaluation) => {
      if (evaluation.score === null) {
        return acc;
      }

      const label = evaluation.skills?.skill_name || evaluation.skills?.subject || "Unspecified";
      if (!acc[label]) {
        acc[label] = { total: 0, count: 0 };
      }

      acc[label].total += Number(evaluation.score);
      acc[label].count += 1;
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([label, bucket]) => ({
        label,
        average: bucket.count ? Number((bucket.total / bucket.count).toFixed(2)) : 0,
      }))
      .sort((a, b) => b.average - a.average);
  };

  const calculateAverageScore = () => {
    if (!evaluations.length) return 0;
    const sum = evaluations.reduce((acc, evaluation) => acc + (evaluation.score || 0), 0);
    return evaluations.length ? (sum / evaluations.length).toFixed(2) : "0";
  };

  const getLatestScore = () => {
    if (!evaluations.length) return 0;
    return evaluations[evaluations.length - 1].score || 0;
  };

  const lineChartData = prepareLineChartData();
  const barChartData = prepareBarChartData();

  const chartConfig = {
    score: {
      label: 'Average Score',
      color: 'hsl(var(--chart-1))',
    },
    average: {
      label: 'Average Score',
      color: 'hsl(var(--chart-2))',
    },
  } as const;

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
          <p className="text-lg font-semibold text-destructive">Failed to load evaluations</p>
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
          <CardTitle>Evaluation Performance</CardTitle>
          <CardDescription>Track your curriculum-aligned evaluations over time</CardDescription>
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
              <p className="text-sm text-muted-foreground">Total Evaluations</p>
              <p className="text-3xl font-bold">{evaluations.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Score Trend Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Score Trend</CardTitle>
          <CardDescription>Your evaluation scores over time</CardDescription>
        </CardHeader>
        <CardContent>
          {lineChartData.length > 0 ? (
            <ChartContainer
              config={chartConfig}
              className="h-[320px] w-full rounded-3xl bg-gradient-to-br from-white/85 via-white/40 to-white/15 dark:from-slate-900/70 dark:via-slate-900/40 dark:to-slate-900/10 backdrop-blur-xl border border-white/40 dark:border-slate-800 shadow-[0_25px_55px_-35px_rgba(15,23,42,0.9)] px-4 py-6"
            >
              <ComposedChart data={lineChartData}>
                <defs>
                  <linearGradient id="assessmentScoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-score)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--color-score)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(148,163,184,0.25)" vertical={false} strokeDasharray="4 8" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "rgba(71,85,105,0.85)", fontSize: 12, fontWeight: 500 }}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(148,163,184,0.3)" }}
                />
                <YAxis
                  tick={{ fill: "rgba(71,85,105,0.75)", fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(148,163,184,0.3)" }}
                  domain={[0, 100]}
                  ticks={[0, 20, 40, 60, 80, 100]}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent className="border border-slate-700/60 bg-slate-900/75 text-slate-100 backdrop-blur-xl" />
                  }
                />
                <Area type="monotone" dataKey="score" fill="url(#assessmentScoreGradient)" stroke="none" />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="var(--color-score)"
                  strokeWidth={4}
                  dot={false}
                  activeDot={{ r: 8, strokeWidth: 2, fill: "#fff" }}
                />
              </ComposedChart>
            </ChartContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
              <p>No evaluations available for the selected period</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Skill Breakdown Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Skill Breakdown</CardTitle>
          <CardDescription>Average performance by evaluated skill</CardDescription>
        </CardHeader>
        <CardContent>
          {barChartData.length > 0 ? (
            <ChartContainer
              config={chartConfig}
              className="h-[360px] w-full rounded-3xl bg-gradient-to-br from-white/85 via-white/40 to-white/15 dark:from-slate-900/70 dark:via-slate-900/40 dark:to-slate-900/10 backdrop-blur-xl border border-white/40 dark:border-slate-800 shadow-[0_25px_55px_-35px_rgba(15,23,42,0.9)] px-4 py-6"
            >
              <BarChart data={barChartData}>
                <defs>
                  <linearGradient id="evaluationSkillGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-average)" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="var(--color-average)" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(148,163,184,0.25)" vertical={false} strokeDasharray="4 8" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "rgba(71,85,105,0.75)", fontSize: 11, fontWeight: 500 }}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(148,163,184,0.3)" }}
                  angle={-30}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  tick={{ fill: "rgba(71,85,105,0.75)", fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(148,163,184,0.3)" }}
                  domain={[0, 100]}
                  ticks={[0, 20, 40, 60, 80, 100]}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent className="border border-slate-700/60 bg-slate-900/75 text-slate-100 backdrop-blur-xl" />
                  }
                />
                <Bar dataKey="average" fill="url(#evaluationSkillGradient)" radius={[8, 8, 8, 8]} />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[350px] text-muted-foreground">
              <p>No skill evaluation data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assessment List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Evaluations</CardTitle>
          <CardDescription>Detailed view of your latest skill evaluations</CardDescription>
        </CardHeader>
        <CardContent>
          {evaluations.length > 0 ? (
            <div className="space-y-4">
              {evaluations.map((evaluation, index) => (
                <div
                  key={`${evaluation.evaluation_date}-${index}`}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">
                        {evaluation.skills?.skill_name || evaluation.skills?.subject || 'Curriculum Skill'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {evaluation.evaluation_date
                          ? format(new Date(evaluation.evaluation_date), 'MMMM dd, yyyy')
                          : 'Date unavailable'}
                      </p>
                    </div>
                    <Badge variant="default" className="text-lg">
                      {evaluation.score ?? 'N/A'}
                    </Badge>
                  </div>
                  {evaluation.text_feedback && (
                    <div className="mt-3 p-3 bg-muted/30 rounded-md">
                      <p className="text-sm font-medium mb-1">Teacher Feedback:</p>
                      <p className="text-sm text-muted-foreground">{evaluation.text_feedback}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No evaluations available for the selected period
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
