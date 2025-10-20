import React, { useState, useEffect, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AuthContext } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';

interface EvaluationDetailsProps {
  evaluationId: string;
}

const EvaluationDetails: React.FC<EvaluationDetailsProps> = ({ evaluationId }) => {
  const { toast } = useToast();
  const auth = useContext(AuthContext);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [itemScores, setItemScores] = useState<any[]>([]);
  const [rubricItems, setRubricItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [teacherComments, setTeacherComments] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    const fetchEvaluationDetails = async () => {
      try {
        setLoading(true);
        const { data: evalData, error: evalError } = await supabase
          .from('teacher_evaluations')
          .select('*, teacher:teachers(name, surname), evaluator:users(first_name, last_name)')
          .eq('id', evaluationId)
          .single();

        if (evalError) throw evalError;
        setEvaluation(evalData);

        const { data: scoresData, error: scoresError } = await supabase
          .from('evaluation_item_scores')
          .select('*')
          .eq('evaluation_id', evaluationId);

        if (scoresError) throw scoresError;
        setItemScores(scoresData || []);

        const { data: rubricData, error: rubricError } = await supabase
          .from('evaluation_rubric_items')
          .select('*')
          .order('order', { ascending: true });
        
        if (rubricError) throw rubricError;
        setRubricItems(rubricData || []);

        // Initialize teacher comments
        const initialComments = {};
        (scoresData || []).forEach(score => {
          initialComments[score.rubric_item_id] = score.teacher_comment || '';
        });
        setTeacherComments(initialComments);

      } catch (error: any) {
        toast({
          title: 'Error fetching evaluation details',
          description: error.message || 'Could not load evaluation details.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluationDetails();
  }, [evaluationId, toast]);

  const handleCommentChange = (rubricItemId: number, value: string) => {
    setTeacherComments(prev => ({ ...prev, [rubricItemId]: value }));
  };

  const handleSubmitTeacherComments = async () => {
    try {
      const updatePromises = Object.entries(teacherComments).map(([rubric_item_id, comment]) =>
        supabase
          .from('evaluation_item_scores')
          .update({ teacher_comment: comment })
          .eq('evaluation_id', evaluationId)
          .eq('rubric_item_id', rubric_item_id)
      );

      await Promise.all(updatePromises);

      await supabase
        .from('teacher_evaluations')
        .update({ status: 'teacher_reviewed' })
        .eq('id', evaluationId);

      toast({ title: 'Success', description: 'Your comments have been submitted.' });

    } catch (error: any) {
      toast({
        title: 'Error submitting comments',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSendBackForReevaluation = async () => {
    try {
      await supabase
        .from('teacher_evaluations')
        .update({ status: 'pending_re_evaluation' })
        .eq('id', evaluationId);

      toast({ title: 'Success', description: 'Evaluation sent back for re-evaluation.' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleFinalizeEvaluation = async () => {
    try {
      await supabase
        .from('teacher_evaluations')
        .update({ status: 'finalized' })
        .eq('id', evaluationId);

      toast({ title: 'Success', description: 'Evaluation has been finalized.' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };
  
  const groupedRubric = rubricItems.reduce((acc, item) => {
    const section = item.section;
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  if (loading) {
    return <div className="text-center py-8">Loading Evaluation...</div>;
  }

  if (!evaluation) {
    return <div className="text-center py-8">Evaluation not found.</div>;
  }

  const isTeacher = auth?.user?.id === evaluation.teacher_id;
  const isEvaluator = auth?.user?.id === evaluation.evaluator_id;

  return (
    <Card className="w-full max-w-4xl mx-auto my-8">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Evaluation Details</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Header info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Display evaluation header fields */}
        </div>

        {Object.entries(groupedRubric).map(([section, items]) => (
          <div key={section} className="mb-6">
            <h3 className="text-lg font-semibold mb-2">{section}</h3>
            {items.map(item => {
              const score = itemScores.find(s => s.rubric_item_id === item.id);
              return (
                <div key={item.id} className="py-4 border-b">
                  <div className="font-medium">{item.criteria}</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div>
                      <Label>Score</Label>
                      <p className="font-bold text-lg">{score?.score ?? 'N/A'}</p>
                    </div>
                    <div>
                      <Label>Evaluator Comment</Label>
                      <p className="p-2 bg-gray-100 rounded-md min-h-[60px]">{score?.evaluator_comment || '-'}</p>
                    </div>
                    <div>
                      <Label>Teacher Comment</Label>
                      <Textarea
                        placeholder="Your comment..."
                        value={teacherComments[item.id] || ''}
                        onChange={e => handleCommentChange(item.id, e.target.value)}
                        disabled={!isTeacher || evaluation.status !== 'submitted_to_teacher'}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* Final comments */}

      </CardContent>
      <CardFooter className="flex justify-end gap-4">
        {isTeacher && evaluation.status === 'submitted_to_teacher' && (
          <>
            <Button variant="outline" onClick={handleSendBackForReevaluation}>Send Back for Re-evaluation</Button>
            <Button onClick={handleSubmitTeacherComments}>Agree and Submit Comments</Button>
          </>
        )}
        {isEvaluator && evaluation.status === 'teacher_reviewed' && (
            <Button onClick={handleFinalizeEvaluation}>Finalize Evaluation</Button>
        )}
        {isEvaluator && evaluation.status === 'pending_re_evaluation' && (
            <Link to={`/evaluation/${evaluationId}/edit`}>
                <Button>Edit Evaluation</Button>
            </Link>
        )}
      </CardFooter>
    </Card>
  );
};

export default EvaluationDetails;