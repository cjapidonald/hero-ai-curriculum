import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth-context";
import { Badge } from "@/components/ui/badge";

interface Class {
  id: string;
  class_name: string;
}

interface Student {
  id: string;
  name: string;
  surname: string;
}

interface Skill {
  id: string;
  skill_code: string;
  skill_name: string;
  subject: string;
  category: string | null;
  strand: string;
  substrand: string;
}

interface Evaluation {
  student_id: string;
  skill_id: string;
  score: number | null;
  text_feedback: string;
}

interface SkillEvaluationRecord {
  id: string;
  student_id: string;
  skill_id: string;
  score: number | null;
  text_feedback: string | null;
  created_at: string;
  skills: Skill | null;
}

export default function SkillsEvaluation() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("ESL");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [evaluations, setEvaluations] = useState<Map<string, Evaluation>>(new Map());
  const teacherId = user?.id ?? "";

  useEffect(() => {
    setEvaluations(new Map());
  }, [selectedClass, selectedSubject, selectedCategory]);

  // Fetch classes
  const {
    data: classes,
    isLoading: isLoadingClasses,
    isError: isClassesError,
  } = useQuery({
    queryKey: ["teacher-classes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("id, class_name")
        .eq("is_active", true)
        .order("class_name");

      if (error) throw error;
      return data as Class[];
    },
  });

  // Fetch students in selected class
  const { data: students } = useQuery({
    queryKey: ["class-students", selectedClass],
    queryFn: async () => {
      if (!selectedClass) return [];

      const { data, error } = await supabase
        .from("class_students")
        .select(`
          student_id,
          students:student_id (
            id,
            name,
            surname
          )
        `)
        .eq("class_id", selectedClass);

      if (error) throw error;

      return data
        .map(item => item.students)
        .filter(Boolean) as unknown as Student[];
    },
    enabled: !!selectedClass,
  });

  // Fetch skills for selected subject
  const { data: skills } = useQuery({
    queryKey: ["subject-skills", selectedSubject],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("skills")
        .select("id, skill_code, skill_name, subject, category, strand, substrand")
        .or(`subject.eq.${selectedSubject},category.eq.${selectedSubject}`)
        .eq("is_active", true)
        .order("skill_code");

      if (error) throw error;
      return data as Skill[];
    },
    enabled: !!selectedSubject,
  });

  const { data: evaluationHistory, isLoading: isLoadingEvaluations } = useQuery({
    queryKey: ["skill-evaluations-history", selectedClass, selectedSubject],
    queryFn: async () => {
      if (!selectedClass) return [];

      const { data, error } = await supabase
        .from("skill_evaluations")
        .select(`
          id,
          student_id,
          skill_id,
          score,
          text_feedback,
          created_at,
          skills:skill_id (
            id,
            skill_code,
            skill_name,
            subject,
            category,
            strand,
            substrand
          )
        `)
        .eq("class_id", selectedClass)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as SkillEvaluationRecord[];
    },
    enabled: !!selectedClass,
  });

  const getSkillCategory = (skill: Skill) => skill.category || skill.strand || skill.subject;

  const availableCategories = useMemo(() => {
    if (!skills) return [];
    const unique = new Set<string>();
    skills.forEach((skill) => {
      const category = getSkillCategory(skill);
      if (category) {
        unique.add(category);
      }
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [skills]);

  const filteredSkills = useMemo(() => {
    if (!skills) return [];
    if (!selectedCategory || selectedCategory === "all") return skills;
    return skills.filter((skill) => getSkillCategory(skill) === selectedCategory);
  }, [skills, selectedCategory]);

  const relevantSkillIds = useMemo(() => new Set(filteredSkills.map((skill) => skill.id)), [filteredSkills]);

  const evaluationHistoryBySkill = useMemo(() => {
    const map = new Map<string, SkillEvaluationRecord[]>();
    if (!evaluationHistory) return map;

    evaluationHistory.forEach((record) => {
      if (!relevantSkillIds.has(record.skill_id)) return;
      if (
        record.skills?.subject !== selectedSubject &&
        record.skills?.category !== selectedSubject
      ) {
        return;
      }

      const key = `${record.student_id}-${record.skill_id}`;
      const existing = map.get(key) ?? [];
      existing.push(record);
      map.set(key, existing);
    });

    map.forEach((records, key) => {
      records.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    });

    return map;
  }, [evaluationHistory, relevantSkillIds, selectedSubject]);

  const latestSavedEvaluations = useMemo(() => {
    const map = new Map<string, Evaluation>();
    evaluationHistoryBySkill.forEach((records, key) => {
      const latestRecord = records[records.length - 1];
      map.set(key, {
        student_id: latestRecord.student_id,
        skill_id: latestRecord.skill_id,
        score: latestRecord.score,
        text_feedback: latestRecord.text_feedback ?? "",
      });
    });
    return map;
  }, [evaluationHistoryBySkill]);

  const getExistingEvaluation = (
    studentId: string,
    skillId: string,
    fallback?: Evaluation
  ) => {
    const key = `${studentId}-${skillId}`;
    const existing = evaluations.get(key);
    if (existing) return existing;
    if (fallback) {
      return {
        student_id: fallback.student_id,
        skill_id: fallback.skill_id,
        score: fallback.score,
        text_feedback: fallback.text_feedback,
      };
    }
    return {
      student_id: studentId,
      skill_id: skillId,
      score: null,
      text_feedback: "",
    };
  };

  // Save evaluation mutation
  const saveEvaluationMutation = useMutation({
    mutationFn: async (evaluation: Evaluation) => {
      if (!teacherId) {
        throw new Error("Teacher authentication is required to save evaluations.");
      }

      const { data, error } = await supabase
        .from("skill_evaluations")
        .insert({
          student_id: evaluation.student_id,
          skill_id: evaluation.skill_id,
          teacher_id: teacherId,
          class_id: selectedClass,
          score: evaluation.score,
          text_feedback: evaluation.text_feedback,
        })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Evaluation saved",
        description: "Student skill evaluation has been recorded",
      });
      setEvaluations((prev) => {
        const next = new Map(prev);
        const key = `${variables.student_id}-${variables.skill_id}`;
        next.delete(key);
        return next;
      });
      void queryClient.invalidateQueries({
        queryKey: ["skill-evaluations-history", selectedClass, selectedSubject],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error saving evaluation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleScoreChange = (studentId: string, skillId: string, value: string) => {
    const key = `${studentId}-${skillId}`;
    const score = value ? parseFloat(value) : null;

    const fallback = latestSavedEvaluations.get(key);
    const existing = getExistingEvaluation(studentId, skillId, fallback);

    setEvaluations(
      new Map(
        evaluations.set(key, {
          ...existing,
          score,
        })
      )
    );
  };

  const handleFeedbackChange = (studentId: string, skillId: string, value: string) => {
    const key = `${studentId}-${skillId}`;

    const fallback = latestSavedEvaluations.get(key);
    const existing = getExistingEvaluation(studentId, skillId, fallback);

    setEvaluations(
      new Map(
        evaluations.set(key, {
          ...existing,
          text_feedback: value,
        })
      )
    );
  };

  const handleSubmit = (studentId: string, skillId: string) => {
    const key = `${studentId}-${skillId}`;
    const evaluation = evaluations.get(key);

    if (!evaluation || (evaluation.score === null && !evaluation.text_feedback)) {
      toast({
        title: "No data to save",
        description: "Please enter a score or feedback",
        variant: "destructive",
      });
      return;
    }

    if (!teacherId) {
      toast({
        title: "Authentication required",
        description: "Please log in as a teacher before submitting evaluations.",
        variant: "destructive",
      });
      return;
    }

    saveEvaluationMutation.mutate(evaluation);
  };

  const formatMilestoneLabel = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  if (isLoadingClasses) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Skills Evaluation</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isLoadingClasses && (!classes || classes.length === 0)) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Skills Evaluation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {isClassesError
                ? "There was a problem loading classes. Please try again later."
                : "No classes found. Please contact an administrator."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Skills Evaluation</h1>
        <p className="text-muted-foreground">
          Evaluate students on curriculum skills
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Class and Subject</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes?.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.class_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ESL">ESL</SelectItem>
                  <SelectItem value="Math">Math</SelectItem>
                  <SelectItem value="Science">Science</SelectItem>
                  <SelectItem value="Phonics">Phonics</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Skill Focus</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All skills" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Skills</SelectItem>
                  {availableCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedClass && students && students.length > 0 && filteredSkills && filteredSkills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Evaluation Grid</CardTitle>
            <p className="text-sm text-muted-foreground">
              Enter scores (milestones) or text feedback for each student-skill combination. Each submission creates a new milestone for that skill.
            </p>
          </CardHeader>
          <CardContent>
            <div className="max-h-[600px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-background z-10 min-w-[150px]">
                      Student
                    </TableHead>
                    {filteredSkills.map((skill) => (
                      <TableHead key={skill.id} className="min-w-[200px] align-top">
                        <div className="flex flex-col">
                          <span className="font-mono text-xs">{skill.skill_code}</span>
                          <span className="text-xs truncate">{skill.skill_name}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {getSkillCategory(skill)}
                          </span>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students?.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="sticky left-0 bg-background z-10 font-medium">
                        {student.name} {student.surname}
                      </TableCell>
                      {filteredSkills.map((skill) => {
                        const key = `${student.id}-${skill.id}`;
                        const draftEvaluation = evaluations.get(key);
                        const latestEvaluation = latestSavedEvaluations.get(key);
                        const history = evaluationHistoryBySkill.get(key) ?? [];
                        const scoreValue =
                          draftEvaluation?.score ?? latestEvaluation?.score ?? "";
                        const feedbackValue =
                          draftEvaluation?.text_feedback ?? latestEvaluation?.text_feedback ?? "";

                        return (
                          <TableCell key={skill.id}>
                            <div className="space-y-2">
                              <Input
                                type="number"
                                min="0"
                                placeholder="Milestone"
                                value={scoreValue}
                                onChange={(e) => handleScoreChange(student.id, skill.id, e.target.value)}
                                className="w-full"
                              />
                              <Textarea
                                placeholder="Feedback"
                                value={feedbackValue}
                                onChange={(e) => handleFeedbackChange(student.id, skill.id, e.target.value)}
                                rows={2}
                                className="w-full text-sm"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleSubmit(student.id, skill.id)}
                                disabled={saveEvaluationMutation.isPending}
                                className="w-full"
                              >
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Submit
                              </Button>
                              {history.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {history.slice(-4).map((entry) => (
                                    <Badge key={entry.id} variant="outline" className="text-[10px] font-normal">
                                      {entry.score ?? "—"} · {formatMilestoneLabel(entry.created_at)}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {isLoadingEvaluations && (
              <p className="text-sm text-muted-foreground mt-4">Loading previous milestones…</p>
            )}
          </CardContent>
        </Card>
      )}

      {selectedClass && filteredSkills.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>No Skills Available</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              No skills match the selected subject and category. Try choosing a different focus area.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
