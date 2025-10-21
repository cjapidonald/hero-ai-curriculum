import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CLASSROOM_OBSERVATION_RUBRIC } from '@/lib/rubric';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface TeacherResponse {
  score: number | null;
  comment: string;
}

interface TeacherResponses {
  [criterionId: string]: TeacherResponse;
}

interface TeacherEvaluationReviewProps {
  evaluationId: string;
  onClose?: () => void;
}

const TeacherEvaluationReview: React.FC<TeacherEvaluationReviewProps> = ({ evaluationId, onClose }) => {
  const { toast } = useToast();
  const [evaluation, setEvaluation] = useState<any>(null);
  const [teacherResponses, setTeacherResponses] = useState<TeacherResponses>({});
  const [teacherContextComment, setTeacherContextComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasResponded, setHasResponded] = useState(false);

  useEffect(() => {
    fetchEvaluation();
  }, [evaluationId]);

  const fetchEvaluation = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('teacher_evaluations' as any)
        .select('*')
        .eq('id', evaluationId)
        .single();

      if (error) throw error;

      setEvaluation(data);
      setHasResponded(data.teacher_reviewed_at !== null);

      // Initialize teacher responses from rubric scores
      if (data.rubric_scores) {
        const responses: TeacherResponses = {};
        Object.keys(data.rubric_scores).forEach(criterionId => {
          const adminScore = data.rubric_scores[criterionId];
          // Check if teacher has already responded
          const teacherScore = adminScore.teacher_score !== undefined ? adminScore.teacher_score : adminScore.score;
          const teacherComment = adminScore.teacher_comment || '';

          responses[criterionId] = {
            score: teacherScore,
            comment: teacherComment,
          };
        });
        setTeacherResponses(responses);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load evaluation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTeacherScoreChange = (criterionId: string, newScore: number[]) => {
    setTeacherResponses(prev => ({
      ...prev,
      [criterionId]: { ...prev[criterionId], score: newScore[0] },
    }));
  };

  const handleTeacherCommentChange = (criterionId: string, newComment: string) => {
    setTeacherResponses(prev => ({
      ...prev,
      [criterionId]: { ...prev[criterionId], comment: newComment },
    }));
  };

  const handleAccept = async () => {
    // Accept without changes - just mark as reviewed
    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('teacher_evaluations' as any)
        .update({
          teacher_reviewed_at: new Date().toISOString(),
          status: 'completed',
          requires_attention: false,
        })
        .eq('id', evaluationId);

      if (error) throw error;

      toast({
        title: "Evaluation Accepted",
        description: "You have accepted the evaluation without changes.",
      });

      if (onClose) onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to accept evaluation",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitForReview = async () => {
    try {
      setIsSubmitting(true);

      // Update rubric_scores with teacher responses
      const updatedRubricScores = { ...evaluation.rubric_scores };
      Object.keys(teacherResponses).forEach(criterionId => {
        if (updatedRubricScores[criterionId]) {
          updatedRubricScores[criterionId] = {
            ...updatedRubricScores[criterionId],
            teacher_score: teacherResponses[criterionId].score,
            teacher_comment: teacherResponses[criterionId].comment,
          };
        }
      });

      const { error } = await supabase
        .from('teacher_evaluations' as any)
        .update({
          rubric_scores: updatedRubricScores,
          teacher_reviewed_at: new Date().toISOString(),
          status: 'pending_admin_review',
          requires_attention: true,
        })
        .eq('id', evaluationId);

      if (error) throw error;

      // Create notification for admin
      await supabase.from('evaluation_notifications' as any).insert({
        evaluation_id: evaluationId,
        recipient_type: 'admin',
        recipient_id: evaluation.evaluator_id,
        message: 'Teacher has responded to evaluation - review required',
      });

      toast({
        title: "Response Submitted",
        description: "Your response has been submitted to the admin for review.",
      });

      if (onClose) onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit response",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading evaluation...</div>;
  }

  if (!evaluation) {
    return <div className="text-center py-8">Evaluation not found.</div>;
  }

  const adminScores = evaluation.rubric_scores || {};

  return (
    <Card className="w-full max-w-6xl mx-auto my-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold">
            Evaluation Review
            {hasResponded && (
              <Badge className="ml-4" variant="secondary">
                <CheckCircle className="h-4 w-4 mr-1" />
                Already Responded
              </Badge>
            )}
          </CardTitle>
          <Badge variant={evaluation.status === 'completed' ? 'default' : 'outline'}>
            {evaluation.status}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Evaluation Date: {new Date(evaluation.evaluation_date).toLocaleDateString()}
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
          <h3 className="font-semibold mb-2 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            Instructions
          </h3>
          <p className="text-sm text-muted-foreground">
            Review the admin's evaluation below. You can add your comments and adjust the scores where you think appropriate.
            Click "Accept" to accept the evaluation as is, or "Submit for Review" to send your feedback to the admin.
          </p>
        </div>

        {evaluation.context_explanation && (
          <div className="border-l-4 border-primary pl-4">
            <h3 className="font-semibold mb-2">Admin's Overall Context & Reflection</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {evaluation.context_explanation}
            </p>
          </div>
        )}

        <TooltipProvider>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[25%]">Criterion</TableHead>
                <TableHead className="w-[15%]">Admin Score</TableHead>
                <TableHead className="w-[20%]">Admin Comment</TableHead>
                <TableHead className="w-[15%]">Your Score</TableHead>
                <TableHead className="w-[25%]">Your Response</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {CLASSROOM_OBSERVATION_RUBRIC.map(category => (
                <React.Fragment key={category.category}>
                  <TableRow className="bg-muted/50">
                    <TableCell colSpan={5} className="font-bold text-primary">
                      {category.category}
                    </TableCell>
                  </TableRow>
                  {category.criteria.map(criterion => {
                    const adminScore = adminScores[criterion.id] || {};
                    const teacherResponse = teacherResponses[criterion.id] || { score: adminScore.score, comment: '' };

                    return (
                      <TableRow key={criterion.id}>
                        <TableCell className="font-medium">{criterion.name}</TableCell>

                        {/* Admin Score */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg">{adminScore.score || 0}</span>
                          </div>
                        </TableCell>

                        {/* Admin Comment */}
                        <TableCell>
                          <p className="text-sm text-muted-foreground">
                            {adminScore.comment || '-'}
                          </p>
                        </TableCell>

                        {/* Teacher Score */}
                        <TableCell>
                          {criterion.type === 'scale' && (
                            <div className="flex items-center gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Slider
                                    min={1}
                                    max={5}
                                    step={1}
                                    value={[teacherResponse.score || 0]}
                                    onValueChange={(value) => handleTeacherScoreChange(criterion.id, value)}
                                    className="w-full"
                                    disabled={hasResponded}
                                  />
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  <p className="font-bold">Level {teacherResponse.score || 0}</p>
                                  <p>{criterion.levels[teacherResponse.score || 0] || 'Move slider'}</p>
                                </TooltipContent>
                              </Tooltip>
                              <span className="font-bold w-12 text-center text-lg">
                                {teacherResponse.score || 0}
                              </span>
                            </div>
                          )}
                          {criterion.type === 'yes_no' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant={teacherResponse.score === 1 ? 'default' : 'outline'}
                                onClick={() => handleTeacherScoreChange(criterion.id, [1])}
                                disabled={hasResponded}
                              >
                                Yes
                              </Button>
                              <Button
                                size="sm"
                                variant={teacherResponse.score === 0 ? 'destructive' : 'outline'}
                                onClick={() => handleTeacherScoreChange(criterion.id, [0])}
                                disabled={hasResponded}
                              >
                                No
                              </Button>
                            </div>
                          )}
                        </TableCell>

                        {/* Teacher Comment */}
                        <TableCell>
                          <Textarea
                            placeholder="Add your response or reflection..."
                            value={teacherResponse.comment || ''}
                            onChange={(e) => handleTeacherCommentChange(criterion.id, e.target.value)}
                            rows={2}
                            className="text-sm"
                            disabled={hasResponded}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TooltipProvider>

        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-2">Your Overall Reflection</h3>
          <Textarea
            placeholder="Add your overall reflection, areas of agreement/disagreement, and action plan..."
            rows={6}
            value={teacherContextComment}
            onChange={(e) => setTeacherContextComment(e.target.value)}
            className="text-base"
            disabled={hasResponded}
          />
        </div>

        <div className="text-right font-bold text-xl">
          Overall Score: {evaluation.overall_score || 0}
        </div>
      </CardContent>

      {!hasResponded && (
        <CardFooter className="flex justify-end gap-4">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleAccept}
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Accept Evaluation
          </Button>
          <Button onClick={handleSubmitForReview} disabled={isSubmitting}>
            <AlertCircle className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Submitting...' : 'Submit for Review'}
          </Button>
        </CardFooter>
      )}

      {hasResponded && (
        <CardFooter className="bg-muted/50">
          <div className="w-full text-center py-4">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <p className="text-sm text-muted-foreground">
              You have already responded to this evaluation. Waiting for admin's final review.
            </p>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default TeacherEvaluationReview;
