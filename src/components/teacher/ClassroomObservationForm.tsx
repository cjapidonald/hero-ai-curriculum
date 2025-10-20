import React, { useState, useEffect, Fragment, useContext } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AuthContext } from '@/contexts/AuthContext';

// Define TypeScript interfaces for our data structures
interface RubricItem {
  id: number;
  section: string;
  criteria: string;
  factor: number | null;
  score_type: 'pass_fail' | 'point_scale';
  order: number;
}

interface ItemScore {
  rubric_item_id: number;
  score: number | null;
  evaluator_comment: string;
  teacher_comment?: string;
}

interface Evaluation {
  teacher_name: string;
  evaluator_name: string;
  campus: string;
  position: string;
  class: string;
  date: string;
  subject: string;
  topic_lesson: string;
  scores: { [key: number]: ItemScore };
  highlights_strengths: string;
  improvements_to_make: string;
}



import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ClassroomObservationFormProps {
  teacher?: {
    id: string;
    name: string;
    surname: string;
    assigned_classes: string[] | null;
  };
  classes?: any[];
  evaluationId?: string;
}

const ClassroomObservationForm: React.FC<ClassroomObservationFormProps> = ({ teacher: initialTeacher, classes: initialClasses, evaluationId }) => {
  const { toast } = useToast();
  const auth = useContext(AuthContext);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [teacher, setTeacher] = useState(initialTeacher);
  const [classes, setClasses] = useState(initialClasses || []);
  const [rubricItems, setRubricItems] = useState<RubricItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data: rubricData, error: rubricError } = await supabase
          .from('evaluation_rubric_items')
          .select('*')
          .order('order', { ascending: true });

        if (rubricError) throw rubricError;
        setRubricItems(rubricData || []);

        if (evaluationId) {
          // Fetch existing evaluation data
          const { data: evalData, error: evalError } = await supabase
            .from('teacher_evaluations')
            .select('*, teacher:teachers(*)')
            .eq('id', evaluationId)
            .single();
          if (evalError) throw evalError;

          setTeacher(evalData.teacher);

          const { data: classesData, error: classesError } = await supabase.from('classes').select('*');
          if (classesError) throw classesError;
          setClasses(classesData || []);

          const { data: scoresData, error: scoresError } = await supabase
            .from('evaluation_item_scores')
            .select('*')
            .eq('evaluation_id', evaluationId);
          if (scoresError) throw scoresError;

          const scores = {};
          (scoresData || []).forEach(score => {
            scores[score.rubric_item_id] = score;
          });

          setEvaluation({
            teacher_name: `${evalData.teacher.name} ${evalData.teacher.surname}`,
            evaluator_name: auth?.user ? `${auth.user.name} ${auth.user.surname}` : '',
            campus: evalData.campus,
            position: evalData.position,
            class: evalData.class_id,
            date: evalData.evaluation_date,
            subject: evalData.subject,
            topic_lesson: evalData.topic_lesson,
            scores: scores,
            highlights_strengths: evalData.highlights_strengths,
            improvements_to_make: evalData.improvements_to_make,
          });

        } else {
          // Initialize a new evaluation
          const initialScores = {};
          (rubricData || []).forEach(item => {
            initialScores[item.id] = {
              rubric_item_id: item.id,
              score: null,
              evaluator_comment: '',
            };
          });
          setEvaluation({
            teacher_name: initialTeacher ? `${initialTeacher.name} ${initialTeacher.surname}` : '',
            evaluator_name: auth?.user ? `${auth.user.name} ${auth.user.surname}` : '',
            campus: '',
            position: '',
            class: '',
            date: new Date().toISOString().split('T')[0],
            subject: '',
            topic_lesson: '',
            scores: initialScores,
            highlights_strengths: '',
            improvements_to_make: '',
          });
        }

      } catch (error: any) {
        toast({
          title: 'Error fetching data',
          description: error.message,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [evaluationId, toast, auth?.user, initialTeacher]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEvaluation(prev => ({ ...prev, [name]: value }));
  };

  const handleScoreChange = (id: number, value: number[]) => {
    setEvaluation(prev => ({
      ...prev,
      scores: {
        ...prev.scores,
        [id]: { ...prev.scores[id], score: value[0] },
      },
    }));
  };

  const handleCommentChange = (id: number, value: string) => {
    setEvaluation(prev => ({
      ...prev,
      scores: {
        ...prev.scores,
        [id]: { ...prev.scores[id], evaluator_comment: value },
      },
    }));
  };

  const handleClassChange = (value: string) => {
    setEvaluation(prev => ({ ...prev, class: value }));
  };
  
  const handleSubmit = async () => {
    try {
      const evaluationData = {
        teacher_id: teacher.id,
        evaluator_id: auth?.user?.id,
        campus: evaluation.campus,
        position: evaluation.position,
        class_id: evaluation.class,
        evaluation_date: evaluation.date,
        subject: evaluation.subject,
        topic_lesson: evaluation.topic_lesson,
        highlights_strengths: evaluation.highlights_strengths,
        improvements_to_make: evaluation.improvements_to_make,
        status: 'submitted_to_teacher',
      };

      let evaluationIdToUse = evaluationId;

      if (evaluationId) {
        // Update existing evaluation
        const { error: evalError } = await supabase
          .from('teacher_evaluations')
          .update(evaluationData)
          .eq('id', evaluationId);
        if (evalError) throw evalError;
      } else {
        // Create new evaluation
        const { data: evalData, error: evalError } = await supabase
          .from('teacher_evaluations')
          .insert(evaluationData)
          .select('id')
          .single();
        if (evalError) throw evalError;
        evaluationIdToUse = evalData.id;
      }

      // Upsert scores
      const scoreInsertPromises = Object.values(evaluation.scores).map(score =>
        supabase.from('evaluation_item_scores').upsert({
          evaluation_id: evaluationIdToUse,
          rubric_item_id: score.rubric_item_id,
          score: score.score,
          evaluator_comment: score.evaluator_comment,
        })
      );

      const results = await Promise.all(scoreInsertPromises);
      const scoreErrors = results.map(res => res.error).filter(Boolean);

      if (scoreErrors.length > 0) {
        throw new Error(`Failed to save ${scoreErrors.length} score items.`);
      }

      toast({
        title: 'Success',
        description: `Evaluation ${evaluationId ? 'updated' : 'submitted'} successfully.`,
      });

    } catch (error: any) {
      toast({
        title: `Error ${evaluationId ? 'updating' : 'submitting'} evaluation`,
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };

  const groupedRubric = rubricItems.reduce((acc, item) => {
    if (!acc[item.section]) {
      acc[item.section] = [];
    }
    acc[item.section].push(item);
    return acc;
  }, {} as Record<string, RubricItem[]>);

  if (loading || !evaluation) {
    return <div className="text-center py-8">Loading Form...</div>;
  }

  return (
    <Card className="w-full max-w-4xl mx-auto my-8">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Classroom Observation Form</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="grid gap-2">
            <Label htmlFor="teacher_name">Teacher's name</Label>
            <Input id="teacher_name" name="teacher_name" value={evaluation.teacher_name} onChange={handleInputChange} disabled />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="evaluator_name">Evaluator's name</Label>
            <Input id="evaluator_name" name="evaluator_name" value={evaluation.evaluator_name} onChange={handleInputChange} disabled />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="campus">Campus</Label>
            <Input id="campus" name="campus" value={evaluation.campus} onChange={handleInputChange} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="position">Position</Label>
            <Input id="position" name="position" value={evaluation.position} onChange={handleInputChange} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="class">Class</Label>
            <Select onValueChange={(value) => handleClassChange(value)} value={evaluation.class}>
              <SelectTrigger>
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent>
                {classes
                  .filter(c => teacher?.assigned_classes?.includes(c.name))
                  .map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="date">Date</Label>
            <Input id="date" name="date" type="date" value={evaluation.date} onChange={handleInputChange} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" name="subject" value={evaluation.subject} onChange={handleInputChange} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="topic_lesson">Topic/Lesson</Label>
            <Input id="topic_lesson" name="topic_lesson" value={evaluation.topic_lesson} onChange={handleInputChange} />
          </div>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {Object.entries(groupedRubric).map(([section, items]) => (
            <AccordionItem value={section} key={section}>
              <AccordionTrigger className="text-lg font-semibold">{section}</AccordionTrigger>
              <AccordionContent>
                {items.map((item, index) => (
                  <div key={item.id} className="py-4 border-b last:border-b-0">
                    <div className="font-medium">{index + 1}. {item.criteria} {item.factor && `(Factor: ${item.factor})`}</div>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-2 items-center">
                      <div className="md:col-span-2">
                        {item.score_type === 'point_scale' ? (
                          <div className="flex items-center gap-4">
                            <Slider
                              min={0}
                              max={item.factor || 5}
                              step={0.5}
                              value={[evaluation.scores[item.id]?.score || 0]}
                              onValueChange={(value) => handleScoreChange(item.id, value)}
                            />
                            <span className="font-bold w-12 text-center">{evaluation.scores[item.id]?.score || '0.0'}</span>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button variant={evaluation.scores[item.id]?.score === 1 ? 'default' : 'outline'} onClick={() => handleScoreChange(item.id, [1])}>Đạt</Button>
                            <Button variant={evaluation.scores[item.id]?.score === 0 ? 'destructive' : 'outline'} onClick={() => handleScoreChange(item.id, [0])}>Không đạt</Button>
                          </div>
                        )}
                      </div>
                      <div className="md:col-span-3">
                        <Textarea
                          placeholder="Evaluator comments..."
                          value={evaluation.scores[item.id]?.evaluator_comment || ''}
                          onChange={(e) => handleCommentChange(item.id, e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        
        <div className="mt-8">
            <h3 className="text-lg font-semibold mb-2">COMMENTS AND FEEDBACK</h3>
            <div className="grid gap-4">
                <div>
                    <Label htmlFor="highlights_strengths">Highlights & Strengths</Label>
                    <Textarea id="highlights_strengths" name="highlights_strengths" value={evaluation.highlights_strengths} onChange={handleInputChange} />
                </div>
                <div>
                    <Label htmlFor="improvements_to_make">Improvements to make</Label>
                    <Textarea id="improvements_to_make" name="improvements_to_make" value={evaluation.improvements_to_make} onChange={handleInputChange} />
                </div>
            </div>
        </div>

      </CardContent>
      <CardFooter className="flex justify-end gap-4">
        <Button variant="outline">Save Draft</Button>
        <Button onClick={handleSubmit}>Submit to Teacher</Button>
      </CardFooter>
    </Card>
  );
};

export default ClassroomObservationForm;