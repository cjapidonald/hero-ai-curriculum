
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
import { AlertCircle, Eye, MessageSquare } from 'lucide-react';
import TeacherEvaluationReview from './TeacherEvaluationReview';

interface EvaluationsListProps {
  mode: 'teacher' | 'admin';
  teacherId?: string;
}

const EvaluationsList: React.FC<EvaluationsListProps> = ({ mode, teacherId }) => {
  const { toast } = useToast();
  const auth = useContext(AuthContext);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<string | null>(null);

  useEffect(() => {
    if (!auth?.user) return;

    const fetchEvaluations = async () => {
      try {
        setLoading(true);
      const currentTeacherId = mode === 'teacher' ? auth.user.id : teacherId;

      let query = supabase
        .from('teacher_evaluations' as any)
        .select('*, evaluator:users(email)'); // Simplified join

      if (currentTeacherId) {
        query = query.eq('teacher_id', currentTeacherId);
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
          const targetTeacherId = mode === 'teacher' ? auth.user?.id : teacherId;
          if (targetTeacherId && newEvaluation.teacher_id === targetTeacherId) {
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
      <CardContent className="px-0">
        <div className="-mx-0">
          <div className="border-t border-b overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Date</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap">Overall Score</TableHead>
                  <TableHead className="whitespace-nowrap">Evaluator</TableHead>
                  <TableHead className="whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
          <TableBody>
            {evaluations.map(evaluation => {
              const needsTeacherReview = mode === 'teacher' && evaluation.status === 'pending_teacher_review';
              const needsAdminAttention = mode === 'admin' && evaluation.requires_attention;

              return (
                <TableRow key={evaluation.id} className={needsAdminAttention ? 'bg-red-50 dark:bg-red-950' : ''}>
                  <TableCell className="whitespace-nowrap">{new Date(evaluation.evaluation_date).toLocaleDateString()}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge variant={
                      evaluation.status === 'completed' ? 'default' :
                      evaluation.status === 'pending_admin_review' ? 'destructive' :
                      'secondary'
                    }>
                      {needsAdminAttention && <AlertCircle className="h-3 w-3 mr-1" />}
                      {evaluation.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge className="text-lg">{evaluation.overall_score}</Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{evaluation.evaluator?.email || 'N/A'}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex gap-2">
                      {needsTeacherReview ? (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            setSelectedEvaluationId(evaluation.id);
                            setReviewDialogOpen(true);
                          }}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Review & Respond
                        </Button>
                      ) : (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
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
                                          <TableHead>Admin Score</TableHead>
                                          <TableHead>Admin Comment</TableHead>
                                          {evaluation.teacher_reviewed_at && (
                                            <>
                                              <TableHead>Teacher Score</TableHead>
                                              <TableHead>Teacher Comment</TableHead>
                                            </>
                                          )}
                                      </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                      {CLASSROOM_OBSERVATION_RUBRIC.map(category => (
                                          <React.Fragment key={category.category}>
                                              <TableRow className="bg-muted/50">
                                                  <TableCell colSpan={evaluation.teacher_reviewed_at ? 5 : 3} className="font-bold text-primary">{category.category}</TableCell>
                                              </TableRow>
                                              {category.criteria.map(criterion => {
                                                const rubricScore = evaluation.rubric_scores?.[criterion.id] || {};
                                                return (
                                                  <TableRow key={criterion.id}>
                                                      <TableCell>{criterion.name}</TableCell>
                                                      <TableCell><Badge>{rubricScore.score || 'N/A'}</Badge></TableCell>
                                                      <TableCell>{rubricScore.comment || '-'}</TableCell>
                                                      {evaluation.teacher_reviewed_at && (
                                                        <>
                                                          <TableCell><Badge variant="outline">{rubricScore.teacher_score || 'N/A'}</Badge></TableCell>
                                                          <TableCell className="text-sm">{rubricScore.teacher_comment || '-'}</TableCell>
                                                        </>
                                                      )}
                                                  </TableRow>
                                                );
                                              })}
                                          </React.Fragment>
                                      ))}
                                  </TableBody>
                              </Table>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
             {evaluations.length === 0 && (
                <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No evaluations found.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>

      {/* Teacher Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          {selectedEvaluationId && (
            <TeacherEvaluationReview
              evaluationId={selectedEvaluationId}
              onClose={() => {
                setReviewDialogOpen(false);
                setSelectedEvaluationId(null);
                // Refresh evaluations list
                window.location.reload();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default EvaluationsList;
