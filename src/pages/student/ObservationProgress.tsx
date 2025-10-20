import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Award } from 'lucide-react';

interface ObservationProgressProps {
  studentId: string;
}

interface Evaluation {
  id: string;
  criteria_id: string;
  score: number | null;
  passed: boolean | null;
  evaluation_date: string;
  comments: string | null;
}

interface Criteria {
  id: string;
  code: string;
  name: string;
  category: string;
  factor: number | null;
  is_pass_fail: boolean;
}

interface CriteriaWithEvaluations extends Criteria {
  evaluations: Evaluation[];
  average: number | null;
  trend: 'up' | 'down' | 'stable';
  latestScore: number | null;
}

const ObservationProgress = ({ studentId }: ObservationProgressProps) => {
  const [criteriaData, setCriteriaData] = useState<CriteriaWithEvaluations[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, [studentId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch all criteria
      const { data: criteriaList, error: criteriaError } = await supabase
        .from('observation_criteria')
        .select('*')
        .eq('stage_name', 'Stage 1')
        .order('display_order');

      if (criteriaError) throw criteriaError;

      // Fetch student evaluations
      const { data: evaluations, error: evalError } = await supabase
        .from('student_observation_evaluations')
        .select('*')
        .eq('student_id', studentId)
        .order('evaluation_date', { ascending: true });

      if (evalError) throw evalError;

      // Combine data
      const combined = (criteriaList || []).map(criterion => {
        const criterionEvals = (evaluations || []).filter(e => e.criteria_id === criterion.id);
        
        // Calculate average for scored criteria
        const scores = criterionEvals.map(e => e.score).filter(s => s !== null) as number[];
        const average = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
        
        // Determine trend
        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (scores.length >= 2) {
          const recent = scores.slice(-2);
          if (recent[1] > recent[0]) trend = 'up';
          else if (recent[1] < recent[0]) trend = 'down';
        }

        const latestScore = scores.length > 0 ? scores[scores.length - 1] : null;

        return {
          ...criterion,
          evaluations: criterionEvals,
          average,
          trend,
          latestScore,
        };
      });

      setCriteriaData(combined);
    } catch (error) {
      console.error('Error fetching observation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', ...Array.from(new Set(criteriaData.map(c => c.category)))];
  
  const filteredData = selectedCategory === 'all' 
    ? criteriaData 
    : criteriaData.filter(c => c.category === selectedCategory);

  // Prepare chart data
  const categoryAverages = criteriaData.reduce((acc, criterion) => {
    if (!acc[criterion.category]) {
      acc[criterion.category] = { total: 0, count: 0 };
    }
    if (criterion.average !== null) {
      acc[criterion.category].total += criterion.average;
      acc[criterion.category].count++;
    }
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  const chartData = Object.entries(categoryAverages).map(([category, data]) => ({
    category: category.length > 20 ? category.substring(0, 20) + '...' : category,
    average: data.count > 0 ? (data.total / data.count).toFixed(2) : 0,
  }));

  // Radar chart data for scored criteria
  const radarData = criteriaData
    .filter(c => !c.is_pass_fail && c.latestScore !== null)
    .map(c => ({
      criteria: c.code,
      score: c.latestScore,
      fullMark: 4,
    }));

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getScoreBadge = (score: number | null) => {
    if (score === null) return <Badge variant="secondary">Not Evaluated</Badge>;
    if (score >= 3.5) return <Badge className="bg-green-600">Exceeding ({score})</Badge>;
    if (score >= 2.5) return <Badge className="bg-blue-600">Meeting ({score})</Badge>;
    if (score >= 1.5) return <Badge className="bg-yellow-600">Approaching ({score})</Badge>;
    return <Badge className="bg-red-600">Below Standard ({score})</Badge>;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Observation Criteria Progress</h2>
        <p className="text-muted-foreground">
          Track your performance on classroom observation criteria
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(category => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category)}
          >
            {category === 'all' ? 'All Categories' : category}
          </Button>
        ))}
      </div>

      {/* Overview Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Average by Category</CardTitle>
            <CardDescription>Your average score in each category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
                <YAxis domain={[0, 4]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="average" fill="#3b82f6" name="Average Score" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Radar</CardTitle>
            <CardDescription>Visual overview of your latest scores</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="criteria" />
                <PolarRadiusAxis angle={90} domain={[0, 4]} />
                <Radar name="Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Criteria List */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Progress</CardTitle>
          <CardDescription>Individual criteria performance and trends</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredData.length > 0 ? (
            <div className="space-y-4">
              {filteredData.map(criterion => (
                <div key={criterion.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold">{criterion.code}</span>
                        <h4 className="font-semibold">{criterion.name}</h4>
                        {getTrendIcon(criterion.trend)}
                      </div>
                      <p className="text-sm text-muted-foreground">{criterion.category}</p>
                    </div>
                    <div className="text-right space-y-1">
                      {criterion.is_pass_fail ? (
                        <Badge variant={criterion.evaluations.some(e => e.passed) ? 'default' : 'secondary'}>
                          {criterion.evaluations.some(e => e.passed) ? 'Pass' : 'Not Evaluated'}
                        </Badge>
                      ) : (
                        <>
                          {getScoreBadge(criterion.latestScore)}
                          {criterion.average !== null && (
                            <p className="text-xs text-muted-foreground">
                              Avg: {criterion.average.toFixed(2)}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Evaluation History */}
                  {criterion.evaluations.length > 0 && (
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-xs font-semibold mb-1">Evaluation History:</p>
                      <div className="flex gap-2 flex-wrap">
                        {criterion.evaluations.slice(-5).map((eval, idx) => (
                          <div key={eval.id} className="text-xs bg-muted px-2 py-1 rounded">
                            {new Date(eval.evaluation_date).toLocaleDateString()}: 
                            {eval.score !== null ? ` ${eval.score}/4` : eval.passed ? ' Pass' : ' Fail'}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Latest Comment */}
                  {criterion.evaluations.length > 0 && criterion.evaluations[criterion.evaluations.length - 1].comments && (
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-xs font-semibold">Latest Feedback:</p>
                      <p className="text-sm text-muted-foreground">
                        {criterion.evaluations[criterion.evaluations.length - 1].comments}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Award className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Evaluations Yet</h3>
              <p className="text-muted-foreground">
                Your teacher hasn't evaluated you on these criteria yet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ObservationProgress;
