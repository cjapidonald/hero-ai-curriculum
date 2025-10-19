import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

interface AssessmentProps {
  teacherId: string;
}

interface Assessment {
  id: string;
  student_id: string;
  student_name: string;
  class: string;
  test_name: string;
  rubrics: string;
  r1: number;
  r2: number;
  r3: number;
  r4: number;
  r5: number;
  total_score: number;
  published: boolean;
  assessment_date: string;
  feedback: string;
}

const Assessment = ({ teacherId }: AssessmentProps) => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    student_id: '',
    test_name: '',
    rubrics: '',
    r1: 0,
    r2: 0,
    r3: 0,
    r4: 0,
    r5: 0,
    published: false,
    assessment_date: new Date().toISOString().split('T')[0],
    feedback: '',
  });

  useEffect(() => {
    fetchAssessments();
    fetchStudents();
  }, [teacherId]);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('assessment')
        .select('*')
        .eq('teacher_id', teacherId)
        .order('assessment_date', { ascending: false });

      if (error) throw error;
      setAssessments(data || []);
    } catch (error) {
      console.error('Error fetching assessments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load assessments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('dashboard_students')
        .select('id, name, surname, class')
        .order('name');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const calculateTotal = () => {
    const { r1, r2, r3, r4, r5 } = formData;
    return r1 + r2 + r3 + r4 + r5;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.student_id || !formData.test_name) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const student = students.find(s => s.id === formData.student_id);
      const total = calculateTotal();

      const assessmentData = {
        teacher_id: teacherId,
        student_id: formData.student_id,
        student_name: `${student?.name} ${student?.surname}`,
        class: student?.class,
        test_name: formData.test_name,
        rubrics: formData.rubrics,
        r1: formData.r1,
        r2: formData.r2,
        r3: formData.r3,
        r4: formData.r4,
        r5: formData.r5,
        total_score: total,
        published: formData.published,
        assessment_date: formData.assessment_date,
        feedback: formData.feedback,
      };

      if (editingAssessment) {
        const { error } = await supabase
          .from('assessment')
          .update(assessmentData)
          .eq('id', editingAssessment.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Assessment updated successfully',
        });
      } else {
        const { error } = await supabase
          .from('assessment')
          .insert(assessmentData);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Assessment created successfully',
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchAssessments();
    } catch (error) {
      console.error('Error saving assessment:', error);
      toast({
        title: 'Error',
        description: 'Failed to save assessment',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (assessment: Assessment) => {
    setEditingAssessment(assessment);
    setFormData({
      student_id: assessment.student_id,
      test_name: assessment.test_name,
      rubrics: assessment.rubrics || '',
      r1: assessment.r1 || 0,
      r2: assessment.r2 || 0,
      r3: assessment.r3 || 0,
      r4: assessment.r4 || 0,
      r5: assessment.r5 || 0,
      published: assessment.published,
      assessment_date: assessment.assessment_date,
      feedback: assessment.feedback || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assessment?')) return;

    try {
      const { error } = await supabase
        .from('assessment')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Assessment deleted successfully',
      });

      fetchAssessments();
    } catch (error) {
      console.error('Error deleting assessment:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete assessment',
        variant: 'destructive',
      });
    }
  };

  const togglePublished = async (assessment: Assessment) => {
    try {
      const { error } = await supabase
        .from('assessment')
        .update({ published: !assessment.published })
        .eq('id', assessment.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Assessment ${!assessment.published ? 'published' : 'unpublished'} successfully`,
      });

      fetchAssessments();
    } catch (error) {
      console.error('Error toggling published status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update published status',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      student_id: '',
      test_name: '',
      rubrics: '',
      r1: 0,
      r2: 0,
      r3: 0,
      r4: 0,
      r5: 0,
      published: false,
      assessment_date: new Date().toISOString().split('T')[0],
      feedback: '',
    });
    setEditingAssessment(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold mb-2">Assessment</h2>
          <p className="text-muted-foreground">
            Create and manage student assessments with rubric-based scoring
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Assessment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingAssessment ? 'Edit' : 'Add'} Assessment</DialogTitle>
              <DialogDescription>
                Create assessments with rubric-based scoring (each rubric: 0-20 points)
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="student">Student *</Label>
                  <Select
                    value={formData.student_id}
                    onValueChange={(value) => setFormData({ ...formData, student_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select student" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name} {student.surname} ({student.class})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assessment_date">Assessment Date *</Label>
                  <Input
                    id="assessment_date"
                    type="date"
                    value={formData.assessment_date}
                    onChange={(e) => setFormData({ ...formData, assessment_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="test_name">Test Name *</Label>
                <Input
                  id="test_name"
                  value={formData.test_name}
                  onChange={(e) => setFormData({ ...formData, test_name: e.target.value })}
                  placeholder="e.g., Unit 1 Test, Mid-term Exam, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rubrics">Rubrics Description</Label>
                <Textarea
                  id="rubrics"
                  value={formData.rubrics}
                  onChange={(e) => setFormData({ ...formData, rubrics: e.target.value })}
                  placeholder="Describe what each rubric measures (optional)..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5].map((num) => (
                  <div key={num} className="space-y-2">
                    <Label htmlFor={`r${num}`}>R{num} (0-20)</Label>
                    <Input
                      id={`r${num}`}
                      type="number"
                      min="0"
                      max="20"
                      value={formData[`r${num}` as keyof typeof formData]}
                      onChange={(e) => setFormData({ ...formData, [`r${num}`]: Number(e.target.value) })}
                    />
                  </div>
                ))}
              </div>

              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Score</p>
                <p className="text-2xl font-bold">{calculateTotal()} / 100</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedback">Feedback</Label>
                <Textarea
                  id="feedback"
                  value={formData.feedback}
                  onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                  placeholder="Provide feedback for the student..."
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="published"
                  checked={formData.published}
                  onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
                />
                <Label htmlFor="published">Publish to student (visible in student dashboard)</Label>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingAssessment ? 'Update' : 'Create'} Assessment
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total Assessments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{assessments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {assessments.filter(a => a.published).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {assessments.filter(a => !a.published).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assessments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Assessments</CardTitle>
          <CardDescription>Manage student assessments and scores</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : assessments.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Test Name</TableHead>
                    <TableHead>R1</TableHead>
                    <TableHead>R2</TableHead>
                    <TableHead>R3</TableHead>
                    <TableHead>R4</TableHead>
                    <TableHead>R5</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assessments.map((assessment) => (
                    <TableRow key={assessment.id}>
                      <TableCell className="font-medium">{assessment.student_name}</TableCell>
                      <TableCell>{assessment.class}</TableCell>
                      <TableCell>{assessment.test_name}</TableCell>
                      <TableCell>{assessment.r1 || 0}</TableCell>
                      <TableCell>{assessment.r2 || 0}</TableCell>
                      <TableCell>{assessment.r3 || 0}</TableCell>
                      <TableCell>{assessment.r4 || 0}</TableCell>
                      <TableCell>{assessment.r5 || 0}</TableCell>
                      <TableCell className="font-bold">{assessment.total_score}</TableCell>
                      <TableCell>{format(new Date(assessment.assessment_date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => togglePublished(assessment)}
                            title={assessment.published ? 'Unpublish' : 'Publish'}
                          >
                            {assessment.published ? (
                              <Eye className="h-4 w-4 text-green-600" />
                            ) : (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                          <Badge variant={assessment.published ? 'default' : 'secondary'}>
                            {assessment.published ? 'Published' : 'Draft'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(assessment)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(assessment.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Assessments Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start creating assessments for your students
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Assessment
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Assessment;
