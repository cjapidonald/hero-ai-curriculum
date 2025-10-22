import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Label } from "@/components/ui/label";

interface SkillsProgressProps {
  studentId: string;
}

interface SkillProgress {
  skill_id: string;
  skill_name: string;
  skill_code: string;
  subject: string;
  strand: string;
  substrand: string;
  latest_score: number;
  average_score: number;
  evaluation_count: number;
  evaluations: Array<{
    score: number;
    text_feedback: string;
    evaluation_date: string;
    teacher_id: string;
  }>;
}

const COLORS = ['#0088FE', '#E0E0E0'];

export default function SkillsProgress({ studentId }: SkillsProgressProps) {
  const [skillsProgress, setSkillsProgress] = useState<SkillProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSkillId, setSelectedSkillId] = useState<string>("");

  useEffect(() => {
    const fetchSkillsProgress = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase.rpc("get_student_skill_progress", {
          p_student_id: studentId,
        });

        if (error) throw error;
        setSkillsProgress((data ?? []) as SkillProgress[]);
      } catch (error: any) {
        console.error("Error fetching skills progress:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      fetchSkillsProgress();
    }
  }, [studentId]);

  // Calculate overall percentage
  const overallPercentage = skillsProgress && skillsProgress.length > 0
    ? Math.round(
        skillsProgress.reduce((sum, skill) => sum + (skill.latest_score || 0), 0) / skillsProgress.length
      )
    : 0;

  // Data for donut chart
  const donutData = [
    { name: "Completed", value: overallPercentage },
    { name: "Remaining", value: 100 - overallPercentage },
  ];

  // Get selected skill details
  const selectedSkill = skillsProgress?.find(s => s.skill_id === selectedSkillId);

  // Data for line chart (skill progress over time)
  const lineChartData = selectedSkill?.evaluations?.map((evaluation, index) => ({
    name: `Attempt ${index + 1}`,
    score: evaluation.score,
    date: new Date(evaluation.evaluation_date).toLocaleDateString(),
  })) || [];

  // Group skills by subject for display
  const skillsBySubject = skillsProgress?.reduce((acc, skill) => {
    const subject = skill.subject || "Other";
    if (!acc[subject]) {
      acc[subject] = [];
    }
    acc[subject].push(skill);
    return acc;
  }, {} as Record<string, SkillProgress[]>) || {};

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
          <p className="text-lg font-semibold text-destructive">Failed to load skills data</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!skillsProgress || skillsProgress.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Skills Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No skill evaluations yet. Your teacher will add evaluations soon.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Progress Donut Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Skills Progress</CardTitle>
          <CardDescription>
            Your average performance across all evaluated skills
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center">
            <div className="relative">
              <ResponsiveContainer width={300} height={300}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx={150}
                    cy={150}
                    innerRadius={80}
                    outerRadius={120}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl font-bold">{overallPercentage}%</div>
                  <div className="text-sm text-muted-foreground">Average Score</div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{skillsProgress.length}</div>
              <div className="text-sm text-muted-foreground">Skills Evaluated</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {skillsProgress.reduce((sum, skill) => sum + skill.evaluation_count, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Evaluations</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Skill Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Individual Skill Progress</CardTitle>
          <CardDescription>
            Select a skill to see your progress over time
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Select Skill</Label>
            <Select value={selectedSkillId} onValueChange={setSelectedSkillId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a skill to view progress" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(skillsBySubject).map(([subject, skills]) => (
                  <div key={subject}>
                    <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                      {subject}
                    </div>
                    {skills.map((skill) => (
                      <SelectItem key={skill.skill_id} value={skill.skill_id}>
                        {skill.skill_code} - {skill.skill_name}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedSkill && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Latest Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedSkill.latest_score || 0}%</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Math.round(selectedSkill.average_score || 0)}%
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Attempts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedSkill.evaluation_count}</div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Progress Over Time</h3>
                {lineChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={lineChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#0088FE"
                        strokeWidth={2}
                        dot={{ r: 6 }}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground">No evaluation history available</p>
                )}
              </div>

              {/* Recent Feedback */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Recent Feedback</h3>
                <div className="space-y-3">
                  {selectedSkill.evaluations?.slice(0, 3).map((evaluation, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold">Score: {evaluation.score}%</span>
                          <span className="text-sm text-muted-foreground">
                            {new Date(evaluation.evaluation_date).toLocaleDateString()}
                          </span>
                        </div>
                        {evaluation.text_feedback && (
                          <p className="text-sm text-muted-foreground">{evaluation.text_feedback}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Skills Overview by Subject */}
      <Card>
        <CardHeader>
          <CardTitle>Skills Overview by Subject</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(skillsBySubject).map(([subject, skills]) => {
              const subjectAvg = Math.round(
                skills.reduce((sum, skill) => sum + (skill.latest_score || 0), 0) / skills.length
              );

              return (
                <div key={subject} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">{subject}</h3>
                    <span className="text-sm text-muted-foreground">
                      {subjectAvg}% avg • {skills.length} skills
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all"
                      style={{ width: `${subjectAvg}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
