import { useState } from "react";
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
import { Save, CheckCircle2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

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
  strand: string;
  substrand: string;
}

interface Evaluation {
  student_id: string;
  skill_id: string;
  score: number | null;
  text_feedback: string;
}

export default function SkillsEvaluation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("ESL");
  const [evaluations, setEvaluations] = useState<Map<string, Evaluation>>(new Map());
  const [teacherId, setTeacherId] = useState<string>("");

  // Get current teacher ID
  useQuery({
    queryKey: ["current-teacher"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setTeacherId(user.id);
      }
      return user;
    },
  });

  // Fetch classes
  const { data: classes } = useQuery({
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

  // Save evaluation mutation
  const saveEvaluationMutation = useMutation({
    mutationFn: async (evaluation: Evaluation) => {
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
    onSuccess: () => {
      toast({
        title: "Evaluation saved",
        description: "Student skill evaluation has been recorded",
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

    const existing = evaluations.get(key) || {
      student_id: studentId,
      skill_id: skillId,
      score: null,
      text_feedback: "",
    };

    setEvaluations(new Map(evaluations.set(key, {
      ...existing,
      score,
    })));
  };

  const handleFeedbackChange = (studentId: string, skillId: string, value: string) => {
    const key = `${studentId}-${skillId}`;

    const existing = evaluations.get(key) || {
      student_id: studentId,
      skill_id: skillId,
      score: null,
      text_feedback: "",
    };

    setEvaluations(new Map(evaluations.set(key, {
      ...existing,
      text_feedback: value,
    })));
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

    saveEvaluationMutation.mutate(evaluation);
  };

  if (!classes?.length) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Skills Evaluation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              No classes found. Please contact an administrator.
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
          <div className="grid grid-cols-2 gap-4">
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
          </div>
        </CardContent>
      </Card>

      {selectedClass && students && students.length > 0 && skills && skills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Evaluation Grid</CardTitle>
            <p className="text-sm text-muted-foreground">
              Enter scores (0-100) or text feedback for each student-skill combination. Click Submit after each entry.
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-background z-10 min-w-[150px]">
                      Student
                    </TableHead>
                    {skills?.slice(0, 5).map((skill) => (
                      <TableHead key={skill.id} className="min-w-[200px]">
                        <div className="flex flex-col">
                          <span className="font-mono text-xs">{skill.skill_code}</span>
                          <span className="text-xs truncate">{skill.skill_name}</span>
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
                      {skills?.slice(0, 5).map((skill) => {
                        const key = `${student.id}-${skill.id}`;
                        const evaluation = evaluations.get(key);

                        return (
                          <TableCell key={skill.id}>
                            <div className="space-y-2">
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                placeholder="Score"
                                value={evaluation?.score ?? ""}
                                onChange={(e) => handleScoreChange(student.id, skill.id, e.target.value)}
                                className="w-full"
                              />
                              <Textarea
                                placeholder="Feedback"
                                value={evaluation?.text_feedback ?? ""}
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
                            </div>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {skills && skills.length > 5 && (
              <p className="text-sm text-muted-foreground mt-4">
                Showing 5 of {skills.length} skills. Scroll horizontally to see more or filter by strand.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
