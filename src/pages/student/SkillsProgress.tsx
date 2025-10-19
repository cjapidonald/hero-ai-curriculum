import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { format, subMonths, subWeeks } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

interface SkillsProgressProps {
  studentId: string;
}

type TimeFilter = '1week' | '1month' | '3months' | '6months' | '9months';
type SkillFilter = 'all' | 'Writing' | 'Reading' | 'Listening' | 'Speaking';

type SkillCategory = Exclude<SkillFilter, 'all'>;
type SkillsEvaluationRecord = Tables<"skills_evaluation">;

export default function SkillsProgress({ studentId }: SkillsProgressProps) {
  const [skillsData, setSkillsData] = useState<SkillsEvaluationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('1month');
  const [skillFilter, setSkillFilter] = useState<SkillFilter>('all');

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

    const fetchSkillsData = async () => {
      try {
        setLoading(true);
        const dateFilter = getDateFilter();

        let query = supabase
          .from("skills_evaluation")
          .select("*")
          .eq("student_id", studentId)
          .gte("evaluation_date", dateFilter.toISOString())
          .order("evaluation_date", { ascending: true });

        if (skillFilter !== 'all') {
          query = query.eq("skill_category", skillFilter);
        }

        const { data, error } = await query;

        if (error) throw error;
        setSkillsData((data ?? []) as SkillsEvaluationRecord[]);
      } catch (error) {
        console.error("Error fetching skills data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      fetchSkillsData();
    }
  }, [studentId, timeFilter, skillFilter]);

  const groupedChartData = useMemo(() => {
    const grouped: Record<string, { date: string } & Partial<Record<SkillCategory, number>>> = {};

    skillsData.forEach((skill) => {
      if (!skill.evaluation_date) return;
      const category = skill.skill_category as SkillCategory | null;
      if (!category) return;

      const dateKey = format(new Date(skill.evaluation_date), "MMM dd");
      if (!grouped[dateKey]) {
        grouped[dateKey] = { date: dateKey };
      }
      grouped[dateKey][category] = skill.average_score ?? 0;
    });

    return Object.values(grouped);
  }, [skillsData]);

  const calculateOverallAverage = () => {
    if (!skillsData.length) return 0;
    const sum = skillsData.reduce((acc, skill) => acc + (skill.average_score ?? 0), 0);
    return Number.isFinite(sum / skillsData.length) ? (sum / skillsData.length).toFixed(2) : "0.00";
  };

  const chartData = groupedChartData;

  const chartConfig = {
    Writing: {
      label: 'Writing',
      color: 'hsl(var(--chart-1))',
    },
    Reading: {
      label: 'Reading',
      color: 'hsl(var(--chart-2))',
    },
    Listening: {
      label: 'Listening',
      color: 'hsl(var(--chart-3))',
    },
    Speaking: {
      label: 'Speaking',
      color: 'hsl(var(--chart-4))',
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Skills Progress Tracker</CardTitle>
          <CardDescription>Monitor your progress across different skills</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Time Period</label>
              <Select value={timeFilter} onValueChange={(value) => setTimeFilter(value as TimeFilter)}>
                <SelectTrigger>
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

            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Skill Category</label>
              <Select value={skillFilter} onValueChange={(value) => setSkillFilter(value as SkillFilter)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Skills</SelectItem>
                  <SelectItem value="Writing">Writing</SelectItem>
                  <SelectItem value="Reading">Reading</SelectItem>
                  <SelectItem value="Listening">Listening</SelectItem>
                  <SelectItem value="Speaking">Speaking</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Overall Average */}
          <div className="bg-muted/50 p-4 rounded-lg mb-4">
            <p className="text-sm text-muted-foreground">Overall Average Score</p>
            <p className="text-3xl font-bold text-primary">{calculateOverallAverage()}</p>
          </div>
        </CardContent>
      </Card>

      {/* Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Progress Over Time</CardTitle>
          <CardDescription>
            {skillFilter === 'all' ? 'All skills' : skillFilter} performance trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
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
                  {skillFilter === 'all' ? (
                    <>
                      <Line
                        type="monotone"
                        dataKey="Writing"
                        stroke="var(--color-Writing)"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Reading"
                        stroke="var(--color-Reading)"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Listening"
                        stroke="var(--color-Listening)"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Speaking"
                        stroke="var(--color-Speaking)"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </>
                  ) : (
                    <Line
                      type="monotone"
                      dataKey={skillFilter}
                      stroke={`var(--color-${skillFilter})`}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
              <p>No data available for the selected period</p>
              <p className="text-sm mt-2">Try selecting a different time range</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Skills Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {['Writing', 'Reading', 'Listening', 'Speaking'].map((skill) => {
          const skillDataForCategory = skillsData.filter((entry) => entry.skill_category === skill);
          const latestScore = skillDataForCategory.length > 0
            ? skillDataForCategory[skillDataForCategory.length - 1].average_score
            : null;
          const hasScore = latestScore !== null && latestScore !== undefined;

          return (
            <Card key={skill}>
              <CardHeader>
                <CardTitle className="text-base">{skill}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {hasScore ? (latestScore ?? 0).toFixed(1) : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {skillDataForCategory.length} evaluation{skillDataForCategory.length !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
