
import React, { useState, useEffect, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AuthContext } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CLASSROOM_OBSERVATION_RUBRIC } from '@/lib/rubric';

interface EvaluationsListProps {
  mode: 'teacher' | 'admin';
  teacherId?: string;
}

const EvaluationsList: React.FC<EvaluationsListProps> = ({ mode, teacherId }) => {
  const { toast } = useToast();
  const auth = useContext(AuthContext);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth?.user) return;

    const fetchEvaluations = async () => {
      try {
        setLoading(true);
        let query = supabase
          .from('teacher_evaluations')
          .select('*, evaluator:users(email)') // Simplified join

        if (mode === 'teacher') {
          const { data: teacherData, error: teacherError } = await supabase.from('teachers').select('id').eq('user_id', auth.user.id).single();
          if (teacherError) throw teacherError;
          query = query.eq('teacher_id', teacherData.id);
        } else if (teacherId) {
          query = query.eq('teacher_id', teacherId);
        }

        const { data, error } = await query.order('evaluation_date', { ascending: false });

        if (error) throw error;
        setEvaluations(data || []);

      } catch (error: any) {
        toast({
          title: 'Error fetching evaluations',
          description: error.message,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluations();

    // Set up real-time subscription
    const channel = supabase
      .channel('teacher_evaluations')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'teacher_evaluations' },
        (payload) => {
          // Check if the new evaluation is for the current user/teacher and add it to the list
          const newEvaluation = payload.new;
          const isForCurrentUser = (mode === 'teacher' && newEvaluation.teacher_id === teacherId) || (mode === 'admin' && newEvaluation.teacher_id === teacherId);
          if(isForCurrentUser){
            setEvaluations(prev => [newEvaluation, ...prev]);
          }
        }
      )
      .subscribe();

    // Cleanup subscription on component unmount
    return () => {
      supabase.removeChannel(channel);
    };

  }, [auth?.user, mode, teacherId, toast]);

  if (loading) {
    return <div>Loading evaluations...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Evaluations</CardTitle>
        <CardDescription>Real-time feedback from classroom observations.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Overall Score</TableHead>
              <TableHead>Evaluator</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {evaluations.map(evaluation => (
              <TableRow key={evaluation.id}>
                <TableCell>{new Date(evaluation.evaluation_date).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Badge className="text-lg">{evaluation.overall_score}</Badge>
                </TableCell>
                <TableCell>{evaluation.evaluator?.email || 'N/A'}</TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">View Details</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Evaluation Details - {new Date(evaluation.evaluation_date).toLocaleDateString()}</DialogTitle>
                      </DialogHeader>
                      <div>
                        <div className="mb-4">
                            <h4 className="font-semibold">Overall Context & Reflection:</h4>
                            <p className="text-sm text-muted-foreground p-2 bg-slate-50 rounded-md">{evaluation.context_explanation || "No overall comment provided."}</p>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Criterion</TableHead>
                                    <TableHead>Score</TableHead>
                                    <TableHead>Comment</TableHead>
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
                                                <TableCell>{criterion.name}</TableCell>
                                                <TableCell><Badge>{evaluation.rubric_scores[criterion.id]?.score || 'N/A'}</Badge></TableCell>
                                                <TableCell>{evaluation.rubric_scores[criterion.id]?.comment || '-'}</TableCell>
                                            </TableRow>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </TableBody>
                        </Table>
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
             {evaluations.length === 0 && (
                <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No evaluations found.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default EvaluationsList;
