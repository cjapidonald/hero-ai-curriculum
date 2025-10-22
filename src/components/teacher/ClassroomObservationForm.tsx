import React, { useState, useEffect, useContext } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { AuthContext } from '@/contexts/AuthContext';
import { CLASSROOM_OBSERVATION_RUBRIC } from '@/lib/rubric';

// Type definitions
interface Score {
  score: number | null;
  comment: string;
}

interface RubricScores {
  [criterionId: string]: Score;
}

type TeacherEvaluationInsert = Database['public']['Tables']['teacher_evaluations']['Insert'];
type EvaluationItemScoreInsert = Database['public']['Tables']['evaluation_item_scores']['Insert'];

const RUBRIC_ITEM_ID_MAP: Record<string, number> = {
  '1.1': 1,
  '1.2': 2,
  '1.3': 3,
  '2.1': 4,
  '2.2': 5,
  '3.1': 6,
  '3.2': 7,
  '3.3': 8,
  '3.4': 9,
  '4.1': 10,
  '4.2': 11,
  '4.3': 12,
  '4.4': 13,
  '5.1': 14,
  '5.2': 15,
  '5.3': 16,
  '6.1': 17,
  '6.2': 18,
  '7.1': 19,
};

type ObservationClass = {
  id: string;
  name?: string | null;
  class_name?: string | null;
  [key: string]: any;
};

interface ClassroomObservationFormProps {
  teacher: {
    id: string;
    name: string;
    surname: string;
    assigned_classes: string[] | null;
  };
  classes?: ObservationClass[];
  onClose: () => void;
}

const ClassroomObservationForm: React.FC<ClassroomObservationFormProps> = ({ teacher, classes = [], onClose }) => {
  const { toast } = useToast();
  const auth = useContext(AuthContext);
  const [rubricScores, setRubricScores] = useState<RubricScores>({});
  const [contextExplanation, setContextExplanation] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getClassName = (cls: ObservationClass | undefined) =>
    cls?.name ?? cls?.class_name ?? '';

  useEffect(() => {
    const availableClass = classes.find((cls) =>
      teacher?.assigned_classes?.includes(getClassName(cls))
    );

    if (availableClass && !selectedClass) {
      setSelectedClass(availableClass.id);
    }
  }, [classes, teacher, selectedClass]);

  useEffect(() => {
    // Initialize scores state from the rubric constant
    const initialScores: RubricScores = {};
    CLASSROOM_OBSERVATION_RUBRIC.forEach(category => {
      category.criteria.forEach(criterion => {
        const defaultScore =
          criterion.type === 'scale'
            ? 0
            : criterion.type === 'yes_no'
              ? null
              : null;

        initialScores[criterion.id] = { score: defaultScore, comment: '' };
      });
    });
    setRubricScores(initialScores);
  }, []);

  const handleScoreChange = (criterionId: string, newScore: number[]) => {
    setRubricScores(prev => ({
      ...prev,
      [criterionId]: { ...prev[criterionId], score: newScore[0] },
    }));
  };

  const handleCommentChange = (criterionId: string, newComment: string) => {
    setRubricScores(prev => ({
      ...prev,
      [criterionId]: { ...prev[criterionId], comment: newComment },
    }));
  };

  const calculateOverallScore = () => {
    const allScores = Object.values(rubricScores)
      .filter(s => s.score !== null && s.score > 0)
      .map(s => s.score as number);
    
    if (allScores.length === 0) return 0;

    const totalScore = allScores.reduce((sum, score) => sum + score, 0);
    return (totalScore / allScores.length).toFixed(2);
  };

  const handleSubmit = async () => {
    if (!teacher || !auth?.user) {
      toast({ title: "Error", description: "Cannot submit evaluation without teacher or evaluator info.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const overallScoreValue = parseFloat(calculateOverallScore());
      const totalScore = Number.isFinite(overallScoreValue) ? overallScoreValue : null;
      const evaluatorId = auth.user.role === 'admin' ? null : auth.user.id;
      const evaluationDate = new Date().toISOString().split('T')[0];
      const trimmedContext = contextExplanation.trim();

      const evaluationPayload: TeacherEvaluationInsert = {
        teacher_id: teacher.id,
        evaluator_id: evaluatorId,
        evaluation_date: evaluationDate,
        class_id: selectedClass || null,
        status: 'pending_teacher_review',
        total_score: totalScore,
        highlights_strengths: trimmedContext || null,
        improvements_to_make: trimmedContext || null,
      };

      const { data: insertedEvaluation, error: evaluationError } = await supabase
        .from('teacher_evaluations')
        .insert(evaluationPayload)
        .select('id')
        .single();

      if (evaluationError) throw evaluationError;

      const scoreEntries: EvaluationItemScoreInsert[] = [];

      CLASSROOM_OBSERVATION_RUBRIC.forEach(category => {
        category.criteria.forEach(criterion => {
          if (criterion.type === 'bonus') {
            return;
          }

          const rubricItemId = RUBRIC_ITEM_ID_MAP[criterion.id];
          const scoreData = rubricScores[criterion.id];

          if (!rubricItemId || !scoreData) {
            return;
          }

          const trimmedComment = scoreData.comment.trim();
          let normalizedScore: number | null = null;

          if (typeof scoreData.score === 'number') {
            normalizedScore =
              criterion.type === 'scale' && scoreData.score <= 0
                ? null
                : scoreData.score;
          }

          if (!trimmedComment && normalizedScore === null) {
            return;
          }

          scoreEntries.push({
            evaluation_id: insertedEvaluation.id,
            rubric_item_id: rubricItemId,
            score: normalizedScore,
            evaluator_comment: trimmedComment || null,
          });
        });
      });

      if (scoreEntries.length > 0) {
        const { error: scoresError } = await supabase
          .from('evaluation_item_scores')
          .upsert(scoreEntries, { onConflict: 'evaluation_id,rubric_item_id' });

        if (scoresError) throw scoresError;
      }

      toast({
        title: "Evaluation Submitted",
        description: "The teacher's evaluation has been saved successfully.",
      });
      onClose(); // Close the dialog on success
    } catch (error: any) {
      toast({
        title: "Submission Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-6xl mx-auto my-8">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Evaluate Teacher: {teacher.name} {teacher.surname}</CardTitle>
        <div className="w-1/3 mx-auto pt-4">
          <Label htmlFor="class-select">Observed Class</Label>
          <Select onValueChange={setSelectedClass} value={selectedClass}>
            <SelectTrigger id="class-select">
              <SelectValue placeholder="Select a class..." />
            </SelectTrigger>
            <SelectContent>
              {classes
                .filter((c) => {
                  const className = getClassName(c);
                  return className && teacher?.assigned_classes?.includes(className);
                })
                .map((c) => {
                  const className = getClassName(c) || 'Unnamed class';
                  return (
                    <SelectItem key={c.id} value={c.id}>
                      {className}
                    </SelectItem>
                  );
                })}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30%]">Criterion</TableHead>
                <TableHead className="w-[30%]">Score (1-5)</TableHead>
                <TableHead className="w-[40%]">Evaluator Comment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {CLASSROOM_OBSERVATION_RUBRIC.map(category => (
                <React.Fragment key={category.category}>
                  <TableRow className="bg-muted/50">
                    <TableCell colSpan={3} className="font-bold text-primary">{category.category}</TableCell>
                  </TableRow>
                  {category.criteria.map(criterion => (
                    <TableRow key={criterion.id}>
                      <TableCell className="font-medium">{criterion.name}</TableCell>
                      <TableCell>
                        {criterion.type === 'scale' && (
                          <div className="flex items-center gap-4">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Slider
                                  min={1}
                                  max={5}
                                  step={1}
                                  value={[rubricScores[criterion.id]?.score || 0]}
                                  onValueChange={(value) => handleScoreChange(criterion.id, value)}
                                  className="w-full"
                                />
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <p className="font-bold">Level {rubricScores[criterion.id]?.score || 0}</p>
                                <p>{criterion.levels[rubricScores[criterion.id]?.score || 0] || 'Move slider to see description'}</p>
                              </TooltipContent>
                            </Tooltip>
                            <span className="font-bold w-12 text-center text-lg">{rubricScores[criterion.id]?.score || 0}</span>
                          </div>
                        )}
                         {criterion.type === 'yes_no' && (
                          <div className="flex gap-2">
                            <Button size="sm" variant={rubricScores[criterion.id]?.score === 1 ? 'default' : 'outline'} onClick={() => handleScoreChange(criterion.id, [1])}>Yes</Button>
                            <Button size="sm" variant={rubricScores[criterion.id]?.score === 0 ? 'destructive' : 'outline'} onClick={() => handleScoreChange(criterion.id, [0])}>No</Button>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="Add a specific comment..."
                          value={rubricScores[criterion.id]?.comment || ''}
                          onChange={(e) => handleCommentChange(criterion.id, e.target.value)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TooltipProvider>

        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-2">Overall Context and Reflection</h3>
          <Textarea
            placeholder="Assign a score and explain the context so the teacher can reflect. Provide highlights, strengths, and areas for improvement here."
            rows={6}
            value={contextExplanation}
            onChange={(e) => setContextExplanation(e.target.value)}
            className="text-base"
          />
        </div>
        <div className="text-right mt-4 font-bold text-xl">
            Overall Score: {calculateOverallScore()}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-4">
        <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Evaluation'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ClassroomObservationForm;
