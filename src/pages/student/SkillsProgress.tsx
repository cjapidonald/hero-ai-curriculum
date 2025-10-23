import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface SkillsProgressProps {
  studentId: string;
}

interface SkillProgressEvaluation {
  score: number | null;
  text_feedback: string | null;
  evaluation_date: string;
  teacher_id: string | null;
}

interface SkillProgress {
  skill_id: string;
  skill_name: string;
  skill_code: string;
  subject: string;
  strand?: string | null;
  substrand?: string | null;
  latest_score: number;
  average_score: number;
  evaluation_count: number;
  evaluations: SkillProgressEvaluation[];
}

interface SkillEvaluationResponse {
  skill_id: string | null;
  score: number | null;
  text_feedback: string | null;
  evaluation_date: string;
  teacher_id: string | null;
  skills: {
    skill_name?: string | null;
    skill_code?: string | null;
    subject?: string | null;
    strand?: string | null;
    substrand?: string | null;
    category?: string | null;
  } | null;
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

        const { data, error } = await supabase
          .from("skill_evaluations")
          .select(
            `
            skill_id,
            score,
            text_feedback,
            evaluation_date,
            teacher_id,
            skills (
              skill_name,
              skill_code,
              subject,
              strand,
              substrand,
              category
            )
          `,
          )
          .eq("student_id", studentId)
          .not("skill_id", "is", null)
          .order("evaluation_date", { ascending: true });

        if (error) throw error;

        const grouped = (data as SkillEvaluationResponse[] | null)?.reduce(
          (acc, evaluation) => {
            if (!evaluation.skill_id) {
              return acc;
            }

            if (!acc.has(evaluation.skill_id)) {
              const skillMeta = evaluation.skills;
              acc.set(evaluation.skill_id, {
                skill_id: evaluation.skill_id,
                skill_name:
                  skillMeta?.skill_name ||
                  skillMeta?.skill_code ||
                  "Untitled Skill",
                skill_code: skillMeta?.skill_code || "",
                subject:
                  skillMeta?.subject || skillMeta?.category || "General",
                strand: skillMeta?.strand,
                substrand: skillMeta?.substrand,
                evaluations: [] as SkillProgressEvaluation[],
              });
            }

            const skillProgress = acc.get(evaluation.skill_id)!;
            skillProgress.evaluations.push({
              score: evaluation.score,
              text_feedback: evaluation.text_feedback,
              evaluation_date: evaluation.evaluation_date,
              teacher_id: evaluation.teacher_id,
            });

            return acc;
          },
          new Map<string, Omit<SkillProgress, "latest_score" | "average_score" | "evaluation_count">>(),
        );

        const formattedSkills: SkillProgress[] = Array.from(
          grouped?.values() || [],
        ).map((skill) => {
          const scores = skill.evaluations
            .map((evaluation) => evaluation.score)
            .filter((score): score is number => typeof score === "number");

          const latest_score = scores.length
            ? Math.round(scores[scores.length - 1])
            : 0;
          const average_score = scores.length
            ? Math.round(
                scores.reduce((sum, value) => sum + value, 0) / scores.length,
              )
            : 0;

          return {
            ...skill,
            latest_score,
            average_score,
            evaluation_count: skill.evaluations.length,
          };
        });

        formattedSkills.sort((a, b) => a.skill_name.localeCompare(b.skill_name));
        setSkillsProgress(formattedSkills);

      } catch (error) {
        console.error("Error fetching skills progress:", error);
        setError(error instanceof Error ? error.message : "Failed to load skills data");
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      fetchSkillsProgress();
    }
  }, [studentId]);

  useEffect(() => {
    if (!selectedSkillId && skillsProgress.length > 0) {
      setSelectedSkillId(skillsProgress[0].skill_id);
    }
  }, [selectedSkillId, skillsProgress]);

  const overallPercentage = useMemo(() => {
    if (!skillsProgress.length) {
      return 0;
    }

    const total = skillsProgress.reduce(
      (sum, skill) => sum + (skill.latest_score || 0),
      0,
    );

    return Math.round(total / skillsProgress.length);
  }, [skillsProgress]);

  // Data for donut chart
  const donutData = [
    { name: "Completed", value: overallPercentage },
    { name: "Remaining", value: 100 - overallPercentage },
  ];

  // Get selected skill details
  const selectedSkill = skillsProgress?.find(s => s.skill_id === selectedSkillId);

  // Data for line chart (skill progress over time)
  const lineChartData = selectedSkill?.evaluations?.map((evaluation, index) => ({
    name: `Milestone ${index + 1}`,
    score: evaluation.score ?? 0,
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
        <CardHeader className="space-y-2">
          <CardTitle className="text-xl font-semibold">
            <Select value={selectedSkillId} onValueChange={setSelectedSkillId}>
              <SelectTrigger className="h-auto border-none bg-transparent px-0 py-0 text-left text-xl font-semibold focus:ring-0 focus:ring-offset-0">
                <SelectValue placeholder="Select a skill to view progress" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(skillsBySubject).map(([subject, skills]) => (
                  <div key={subject}>
                    <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                      {subject}
                    </div>
                    {skills.map((skill) => (
                      <SelectItem key={skill.skill_id} value={skill.skill_id}>
                        {skill.skill_code ? `${skill.skill_code} · ` : ""}
                        {skill.skill_name}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </CardTitle>
          <CardDescription>
            Track detailed milestones for each evaluated skill. Click the title to switch skills.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!selectedSkill && (
            <p className="text-sm text-muted-foreground">
              Select a skill from the dropdown above to explore progress milestones.
            </p>
          )}

          {selectedSkill && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Latest Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedSkill.latest_score ?? 0}%</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Math.round(selectedSkill.average_score ?? 0)}%
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
