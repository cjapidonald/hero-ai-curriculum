import React, { useMemo, useState } from 'react';
import { useAssessments, Assessment } from '@/hooks/useAssessments';
import { useAuth } from '@/contexts/auth-context';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Pencil, Trash2, Plus, Loader2, Award } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface AssessmentCRUDProps {
  teacherId?: string;
  studentId?: string;
  classFilter?: string;
  showActions?: boolean;
}

export function AssessmentCRUD({ teacherId, studentId, classFilter, showActions = true }: AssessmentCRUDProps) {
  const { user, isAdmin, isTeacher } = useAuth();

  const filters = useMemo(() => {
    const conditions = [] as { column: string; value: string }[];
    if (teacherId) conditions.push({ column: 'teacher_id', value: teacherId });
    if (studentId) conditions.push({ column: 'student_id', value: studentId });
    if (classFilter) conditions.push({ column: 'class', value: classFilter });
    return conditions.length > 0 ? conditions : undefined;
  }, [teacherId, studentId, classFilter]);

  const { data: assessments, loading, create, update, remove } = useAssessments(filters);
  const { toast } = useToast();

  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Assessment>>({});

  const canEdit = isAdmin || (isTeacher && (!teacherId || teacherId === user?.id));
  const canDelete = isAdmin || (isTeacher && (!teacherId || teacherId === user?.id));

  const handleOpenDialog = (assessment?: Assessment) => {
    if (assessment) {
      setEditingAssessment(assessment);
      setFormData(assessment);
    } else {
      setEditingAssessment(null);
      setFormData({
        teacher_id: teacherId || user?.id || undefined,
        student_name: '',
        class: classFilter || '',
        test_name: '',
        rubrics: '',
        r1: '',
        r1_score: 0,
        r2: '',
        r2_score: 0,
        r3: '',
        r3_score: 0,
        r4: '',
        r4_score: 0,
        r5: '',
        r5_score: 0,
        total_score: 0,
        published: false,
        assessment_date: new Date().toISOString().split('T')[0],
      });
    }
    setIsDialogOpen(true);
  };

  const calculateTotalScore = (data: Partial<Assessment>) => {
    const scores = [
      parseFloat(data.r1_score as string) || 0,
      parseFloat(data.r2_score as string) || 0,
      parseFloat(data.r3_score as string) || 0,
      parseFloat(data.r4_score as string) || 0,
      parseFloat(data.r5_score as string) || 0,
    ];
    return scores.reduce((sum, score) => sum + score, 0) / scores.filter(s => s > 0).length || 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const total = calculateTotalScore(formData);
    const dataToSubmit: Partial<Assessment> = { ...formData, total_score: total };

    if (editingAssessment) {
      const { error } = await update(editingAssessment.id, dataToSubmit);
      if (!error) {
        setIsDialogOpen(false);
        toast({
          title: 'Success',
          description: 'Assessment updated successfully',
        });
      }
    } else {
      const { error } = await create(dataToSubmit as Assessment);
      if (!error) {
        setIsDialogOpen(false);
        toast({
          title: 'Success',
          description: 'Assessment created successfully',
        });
      }
    }
  };

  const handleDelete = async () => {
    if (deleteId) {
      const { error } = await remove(deleteId);
      if (!error) {
        toast({
          title: 'Success',
          description: 'Assessment deleted successfully',
        });
      }
      setDeleteId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {canEdit && showActions && (
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Assessments</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Assessment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingAssessment ? 'Edit Assessment' : 'Create New Assessment'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="student_name">Student Name *</Label>
                    <Input
                      id="student_name"
                      value={formData.student_name || ''}
                      onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="class">Class</Label>
                    <Input
                      id="class"
                      value={formData.class || ''}
                      onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="test_name">Test Name *</Label>
                    <Input
                      id="test_name"
                      value={formData.test_name || ''}
                      onChange={(e) => setFormData({ ...formData, test_name: e.target.value })}
                      required
                      placeholder="e.g., Unit 1 Test, Midterm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="assessment_date">Date</Label>
                    <Input
                      id="assessment_date"
                      type="date"
                      value={formData.assessment_date || ''}
                      onChange={(e) => setFormData({ ...formData, assessment_date: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="rubrics">Rubrics Description</Label>
                    <Input
                      id="rubrics"
                      value={formData.rubrics || ''}
                      onChange={(e) => setFormData({ ...formData, rubrics: e.target.value })}
                      placeholder="e.g., Speaking and Listening Assessment"
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Rubric Scores (0-5)</h3>
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <div key={num} className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`r${num}`}>Rubric {num}</Label>
                          <Input
                            id={`r${num}`}
                            value={formData[`r${num}` as keyof Assessment] as string || ''}
                            onChange={(e) => setFormData({ ...formData, [`r${num}`]: e.target.value })}
                            placeholder={`e.g., Pronunciation, Fluency`}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`r${num}_score`}>Score</Label>
                          <Input
                            id={`r${num}_score`}
                            type="number"
                            step="0.1"
                            min="0"
                            max="5"
                            value={formData[`r${num}_score` as keyof Assessment] as number || ''}
                            onChange={(e) => setFormData({ ...formData, [`r${num}_score`]: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="feedback">Feedback</Label>
                  <Textarea
                    id="feedback"
                    value={formData.feedback || ''}
                    onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                    placeholder="Additional feedback for the student..."
                    rows={4}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="published"
                    checked={formData.published || false}
                    onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="published" className="cursor-pointer">
                    Publish to student (student can see this assessment)
                  </Label>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                    {editingAssessment ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Test</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Total Score</TableHead>
              <TableHead>Status</TableHead>
              {showActions && canEdit && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {assessments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No assessments found. Create your first assessment to get started.
                </TableCell>
              </TableRow>
            ) : (
              assessments
                .sort((a, b) => new Date(b.assessment_date || '').getTime() - new Date(a.assessment_date || '').getTime())
                .map((assessment) => (
                  <TableRow key={assessment.id}>
                    <TableCell className="font-medium">{assessment.student_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-purple-600" />
                        {assessment.test_name}
                      </div>
                    </TableCell>
                    <TableCell>{assessment.assessment_date || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-semibold">
                        {assessment.total_score?.toFixed(1) || '0.0'} / 5.0
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={assessment.published ? 'default' : 'secondary'}>
                        {assessment.published ? 'Published' : 'Draft'}
                      </Badge>
                    </TableCell>
                    {showActions && canEdit && (
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(assessment)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteId(assessment.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this assessment.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
