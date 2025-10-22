import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Award, TrendingUp, Layers } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

interface SkillsProps {
  teacherId: string;
}

type DashboardStudentOption = Pick<Tables<"dashboard_students">, "id" | "name" | "surname" | "class">;

interface SkillMeta {
  id: string;
  skill_name: string | null;
  skill_code: string | null;
  subject: string | null;
  strand: string | null;
  substrand: string | null;
}

interface SkillEvaluationRow {
  id: string;
  score: number | null;
  text_feedback: string | null;
  evaluation_date: string | null;
  student_id: string | null;
  class_id: string | null;
  skill: SkillMeta | null;
  student: DashboardStudentOption | null;
}

const Skills = ({ teacherId }: SkillsProps) => {
  const { toast } = useToast();
  const [evaluations, setEvaluations] = useState<SkillEvaluationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectFilter, setSubjectFilter] = useState<string>("all");

  const fetchEvaluations = useCallback(async () => {
    if (!teacherId) {
      setEvaluations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("skill_evaluations")
        .select(
          `
            id,
            score,
            text_feedback,
            evaluation_date,
            student_id,
            class_id,
            skill:skill_id (
              id,
              skill_name,
              skill_code,
              subject,
              strand,
              substrand
            )
          `
        )
        .eq("teacher_id", teacherId)
        .order("evaluation_date", { ascending: false })
        .limit(100);

      if (error) throw error;

      const rows = (data ?? []) as Array<{
        id: string;
        score: number | null;
        text_feedback: string | null;
        evaluation_date: string | null;
        student_id: string | null;
        class_id: string | null;
        skill: SkillMeta | null;
      }>;

      const studentIds = Array.from(
        new Set(rows.map((row) => row.student_id).filter((id): id is string => Boolean(id)))
      );

      let studentLookup = new Map<string, DashboardStudentOption>();
      if (studentIds.length) {
        const { data: studentData, error: studentError } = await supabase
          .from("dashboard_students")
          .select("id, name, surname, class")
          .in("id", studentIds);

        if (studentError) throw studentError;

        studentLookup = new Map(
          (studentData ?? []).map((student) => [student.id, student as DashboardStudentOption])
        );
      }

      const typedRows: SkillEvaluationRow[] = rows.map((row) => ({
        id: row.id,
        score: row.score,
        text_feedback: row.text_feedback,
        evaluation_date: row.evaluation_date,
        student_id: row.student_id,
        class_id: row.class_id,
        skill: row.skill ?? null,
        student: row.student_id ? studentLookup.get(row.student_id) ?? null : null,
      }));

      setEvaluations(typedRows);
    } catch (error) {
      console.error("Error loading skill evaluations:", error);
      toast({
        title: "Error loading skill evaluations",
        description:
          error instanceof Error ? error.message : "Unexpected error retrieving evaluations.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [teacherId, toast]);

  useEffect(() => {
    void fetchEvaluations();
  }, [fetchEvaluations]);

  useEffect(() => {
    if (!teacherId) return;

    const channel = supabase
      .channel(`teacher-skill-evaluations-${teacherId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'skill_evaluations',
          filter: `teacher_id=eq.${teacherId}`,
        },
        () => {
          void fetchEvaluations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchEvaluations, teacherId]);

  const subjectOptions = useMemo(() => {
    const subjects = new Set<string>();
    evaluations.forEach((evaluation) => {
      const subject = evaluation.skill?.subject || "General";
      subjects.add(subject);
    });
    return Array.from(subjects).sort();
  }, [evaluations]);

  useEffect(() => {
    if (subjectFilter !== "all" && !subjectOptions.includes(subjectFilter)) {
      setSubjectFilter("all");
    }
  }, [subjectFilter, subjectOptions]);

  const filteredEvaluations = useMemo(() => {
    if (subjectFilter === "all") {
      return evaluations;
    }

    return evaluations.filter((evaluation) => {
      const subject = evaluation.skill?.subject || "General";
      return subject === subjectFilter;
    });
  }, [evaluations, subjectFilter]);

  const summary = useMemo(() => {
    if (!evaluations.length) {
      return {
        totalEvaluations: 0,
        scoredEvaluations: 0,
        averageScore: 0,
        topSubject: undefined as string | undefined,
        topSubjectScore: undefined as number | undefined,
      };
    }

    const scoredEvaluations = evaluations.filter(
      (evaluation) => typeof evaluation.score === "number" && !Number.isNaN(Number(evaluation.score))
    );

    const averageScore = scoredEvaluations.length
      ? scoredEvaluations.reduce((sum, evaluation) => sum + Number(evaluation.score ?? 0), 0) /
        scoredEvaluations.length
      : 0;

    const subjectAggregate = new Map<string, { total: number; count: number }>();
    scoredEvaluations.forEach((evaluation) => {
      const subject = evaluation.skill?.subject || "General";
      const bucket = subjectAggregate.get(subject) ?? { total: 0, count: 0 };
      bucket.total += Number(evaluation.score ?? 0);
      bucket.count += 1;
      subjectAggregate.set(subject, bucket);
    });

    const subjects = Array.from(subjectAggregate.entries()).map(([subject, bucket]) => ({
      subject,
      average: bucket.count ? bucket.total / bucket.count : 0,
    }));

    subjects.sort((a, b) => b.average - a.average);
    const topSubject = subjects[0];

    return {
      totalEvaluations: evaluations.length,
      scoredEvaluations: scoredEvaluations.length,
      averageScore,
      topSubject: topSubject?.subject,
      topSubjectScore: topSubject?.average,
    };
  }, [evaluations]);

  const renderEvaluationDate = (dateString: string | null) => {
    if (!dateString) {
      return "—";
    }

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return format(date, "PP");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Skills Evaluation</h2>
        <p className="text-muted-foreground">
          Monitor recent skill evaluations, review feedback, and keep track of subject progress across your classes.
        </p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="w-full md:w-56">
            <SelectValue placeholder="Filter by subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {subjectOptions.map((subject) => (
              <SelectItem key={subject} value={subject}>
                {subject}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button asChild>
          <Link to="/teacher/skills-evaluation">
            Record New Evaluation
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Evaluations</CardTitle>
            <Award className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary.totalEvaluations}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.scoredEvaluations} with recorded scores
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {summary.scoredEvaluations ? summary.averageScore.toFixed(1) : "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Across scored evaluations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Subject</CardTitle>
            <Layers className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {summary.topSubject ? (
                <>
                  {summary.topSubject}
                  {typeof summary.topSubjectScore === "number" && (
                    <span className="ml-1 text-base text-muted-foreground">
                      ({summary.topSubjectScore.toFixed(1)})
                    </span>
                  )}
                </>
              ) : (
                "—"
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {subjectOptions.length} subject{subjectOptions.length === 1 ? "" : "s"} tracked
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Evaluations</CardTitle>
          <CardDescription>
            Showing {filteredEvaluations.length} of {evaluations.length} recorded evaluations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredEvaluations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
              <p className="text-lg font-semibold">No skill evaluations found</p>
              <p className="text-sm text-muted-foreground max-w-md">
                Once you record evaluations, they will appear here along with student feedback and subject trends.
              </p>
              <Button asChild>
                <Link to="/teacher/skills-evaluation">Record your first evaluation</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Date</TableHead>
                    <TableHead className="whitespace-nowrap">Student</TableHead>
                    <TableHead className="whitespace-nowrap">Class</TableHead>
                    <TableHead className="whitespace-nowrap">Skill</TableHead>
                    <TableHead className="whitespace-nowrap">Subject</TableHead>
                    <TableHead className="whitespace-nowrap">Score</TableHead>
                    <TableHead className="w-[320px]">Feedback</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvaluations.map((evaluation) => {
                    const subject = evaluation.skill?.subject || "General";
                    const skillName = evaluation.skill?.skill_name || "Unnamed skill";
                    const skillCode = evaluation.skill?.skill_code;
                    return (
                      <TableRow key={evaluation.id}>
                        <TableCell className="whitespace-nowrap text-sm font-medium">
                          {renderEvaluationDate(evaluation.evaluation_date)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {evaluation.student
                            ? `${evaluation.student.name} ${evaluation.student.surname}`
                            : "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {evaluation.student?.class || "—"}
                        </TableCell>
                        <TableCell className="min-w-[200px] text-sm">
                          <div className="font-medium">{skillName}</div>
                          {skillCode && (
                            <p className="text-xs text-muted-foreground">Code: {skillCode}</p>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          <Badge variant="secondary">{subject}</Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm font-medium">
                          {typeof evaluation.score === "number"
                            ? evaluation.score.toFixed(1)
                            : "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {evaluation.text_feedback ? evaluation.text_feedback : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Skills;
