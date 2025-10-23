import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CLASSROOM_OBSERVATION_RUBRIC } from '@/lib/rubric';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from 'recharts';
import { TrendingUp, Calendar, Award } from 'lucide-react';

interface PerformanceDashboardProps {
  teacherId: string;
}

type TimePeriod = '1week' | '1month' | '3months' | '6months' | '1year';

const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({ teacherId }) => {
  const { toast } = useToast();
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCriterion, setSelectedCriterion] = useState<string>('overall');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('6months');

  useEffect(() => {
    fetchEvaluations();
  }, [teacherId]);

  const fetchEvaluations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('teacher_evaluations')
        .select('*')
        .eq('teacher_id', teacherId)
        .order('evaluation_date', { ascending: true });

      if (error) throw error;
      setEvaluations(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load evaluations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getFilteredEvaluations = () => {
    const now = new Date();
    const periodMap: Record<TimePeriod, number> = {
      '1week': 7,
      '1month': 30,
      '3months': 90,
      '6months': 180,
      '1year': 365,
    };

    const daysAgo = periodMap[timePeriod];
    const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    return evaluations.filter(
      e => new Date(e.evaluation_date) >= cutoffDate
    );
  };

  const calculateOverallPerformance = () => {
    const filtered = getFilteredEvaluations();
    if (filtered.length === 0) return 0;

    const totalScore = filtered.reduce((sum, e) => sum + (e.overall_score || 0), 0);
    const avgScore = totalScore / filtered.length;

    // Convert to percentage (assuming max score is 5)
    return Math.round((avgScore / 5) * 100);
  };

  const getAttendancePerformance = () => {
    // Placeholder - you can integrate with actual attendance data
    return 95;
  };

  const prepareOverallTrendData = () => {
    const filtered = getFilteredEvaluations();

    return filtered.map(e => ({
      date: new Date(e.evaluation_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      }),
      score: e.overall_score || 0,
      fullDate: e.evaluation_date,
    }));
  };

  const prepareCriterionTrendData = (criterionId: string) => {
    const filtered = getFilteredEvaluations();

    return filtered.map(e => {
      const rubricScores = e.rubric_scores || {};
      const criterionScore = rubricScores[criterionId]?.score || 0;

      return {
        date: new Date(e.evaluation_date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        }),
        score: criterionScore,
        fullDate: e.evaluation_date,
      };
    });
  };

  const prepareSkillsBarData = () => {
    const filtered = getFilteredEvaluations();
    if (filtered.length === 0) return [];

    const latestEvaluation = filtered[filtered.length - 1];
    const rubricScores = latestEvaluation?.rubric_scores || {};

    const skillData: { name: string; fullName: string; category: string; score: number; maxScore: number }[] = [];

    CLASSROOM_OBSERVATION_RUBRIC.forEach(category => {
      category.criteria.forEach(criterion => {
        const score = rubricScores[criterion.id]?.score || 0;
        skillData.push({
          name: criterion.name.substring(0, 25) + (criterion.name.length > 25 ? '...' : ''),
          fullName: criterion.name,
          category: category.category,
          score: score,
          maxScore: 5,
        });
      });
    });

    return skillData;
  };

  const getAllCriteria = () => {
    const criteria: { id: string; name: string; category: string }[] = [];
    CLASSROOM_OBSERVATION_RUBRIC.forEach(category => {
      category.criteria.forEach(criterion => {
        criteria.push({
          id: criterion.id,
          name: criterion.name,
          category: category.category,
        });
      });
    });
    return criteria;
  };

  if (loading) {
    return <div className="text-center py-8">Loading performance data...</div>;
  }

  const overallPerformance = calculateOverallPerformance();
  const attendancePerformance = getAttendancePerformance();
  const overallTrendData = prepareOverallTrendData();
  const skillsBarData = prepareSkillsBarData();
  const allCriteria = getAllCriteria();

  const radialData = [
    {
      name: 'Performance',
      value: overallPerformance,
      fill: overallPerformance >= 80 ? '#22c55e' : overallPerformance >= 60 ? '#eab308' : '#ef4444',
    },
  ];

  const attendanceData = [
    {
      name: 'Attendance',
      value: attendancePerformance,
      fill: '#3b82f6',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Time Period Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Performance Dashboard</h2>
          <p className="text-muted-foreground mt-1">
            Track your teaching performance and growth over time
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={timePeriod} onValueChange={(val) => setTimePeriod(val as TimePeriod)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1week">Last Week</SelectItem>
              <SelectItem value="1month">Last Month</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* HUD Circle Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Overall Performance Circle */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Overall Performance
            </CardTitle>
            <CardDescription>Your average teaching score</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <ResponsiveContainer width="100%" height={250}>
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="90%"
                  data={radialData}
                  startAngle={90}
                  endAngle={-270}
                >
                  <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                  <RadialBar
                    background
                    dataKey="value"
                    cornerRadius={10}
                    fill={radialData[0].fill}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-5xl font-bold">{overallPerformance}%</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {getFilteredEvaluations().length} evaluations
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 text-center">
              <Badge variant={overallPerformance >= 80 ? 'default' : 'secondary'}>
                {overallPerformance >= 80 ? 'Excellent' : overallPerformance >= 60 ? 'Good' : 'Needs Improvement'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Circle */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Attendance
            </CardTitle>
            <CardDescription>Your attendance rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <ResponsiveContainer width="100%" height={250}>
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="90%"
                  data={attendanceData}
                  startAngle={90}
                  endAngle={-270}
                >
                  <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                  <RadialBar
                    background
                    dataKey="value"
                    cornerRadius={10}
                    fill={attendanceData[0].fill}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-5xl font-bold">{attendancePerformance}%</div>
                  <div className="text-sm text-muted-foreground mt-1">attendance rate</div>
                </div>
              </div>
            </div>
            <div className="mt-4 text-center">
              <Badge variant="default">Excellent</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Trend Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Performance Trend</CardTitle>
              <CardDescription>
                {selectedCriterion === 'overall'
                  ? 'Your overall score progression over time'
                  : `Tracking "${allCriteria.find(c => c.id === selectedCriterion)?.name}"`
                }
              </CardDescription>
            </div>
            <Select value={selectedCriterion} onValueChange={setSelectedCriterion}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select criterion" />
              </SelectTrigger>
              <SelectContent className="max-h-[400px]">
                <SelectItem value="overall">Overall Score</SelectItem>
                {allCriteria.map(criterion => (
                  <SelectItem key={criterion.id} value={criterion.id}>
                    {criterion.category} - {criterion.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={selectedCriterion === 'overall' ? overallTrendData : prepareCriterionTrendData(selectedCriterion)}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 5]} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 6 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Skills Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Skills Breakdown</CardTitle>
          <CardDescription>Latest evaluation scores by criterion</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={600}>
            <BarChart
              data={skillsBarData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 5]} />
              <YAxis type="category" dataKey="name" width={140} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white dark:bg-gray-800 p-3 border rounded shadow-lg">
                        <p className="font-semibold">{data.fullName}</p>
                        <p className="text-sm text-muted-foreground">{data.category}</p>
                        <p className="text-lg font-bold text-blue-600">
                          Score: {data.score} / {data.maxScore}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="score" fill="#3b82f6" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceDashboard;
