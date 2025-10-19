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
import { Award, Plus, Pencil, Trash2, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface SkillsProps {
  teacherId: string;
}

interface SkillEvaluation {
  id: string;
  student_id: string;
  student_name: string;
  class: string;
  skill_name: string;
  skill_category: string;
  e1: number;
  e2: number;
  e3: number;
  e4: number;
  e5: number;
  e6: number;
  average_score: number;
  evaluation_date: string;
  notes: string;
}

const Skills = ({ teacherId }: SkillsProps) => {
  const [skills, setSkills] = useState<SkillEvaluation[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<SkillEvaluation | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    student_id: '',
    skill_name: '',
    skill_category: 'Writing',
    e1: 0,
    e2: 0,
    e3: 0,
    e4: 0,
    e5: 0,
    e6: 0,
    evaluation_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        setLoading(true);
        let query = supabase
          .from('skills_evaluation')
          .select('*')
          .eq('teacher_id', teacherId)
          .order('evaluation_date', { ascending: false });

        if (filterCategory !== 'all') {
          query = query.eq('skill_category', filterCategory);
        }

        const { data, error } = await query;
        if (error) throw error;
        setSkills(data || []);
      } catch (error) {
        console.error('Error fetching skills:', error);
        toast({
          title: 'Error',
          description: 'Failed to load skills evaluations',
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

    fetchSkills();
    fetchStudents();
  }, [teacherId, filterCategory, toast]);

  const calculateAverage = () => {
    const { e1, e2, e3, e4, e5, e6 } = formData;
    const scores = [e1, e2, e3, e4, e5, e6].filter(score => score > 0);
    if (scores.length === 0) return 0;
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.student_id || !formData.skill_name) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const student = students.find(s => s.id === formData.student_id);
      const average = calculateAverage();

      const skillData = {
        teacher_id: teacherId,
        student_id: formData.student_id,
        student_name: `${student?.name} ${student?.surname}`,
        class: student?.class,
        skill_name: formData.skill_name,
        skill_category: formData.skill_category,
        e1: formData.e1,
        e2: formData.e2,
        e3: formData.e3,
        e4: formData.e4,
        e5: formData.e5,
        e6: formData.e6,
        average_score: average,
        evaluation_date: formData.evaluation_date,
        notes: formData.notes,
      };

      if (editingSkill) {
        const { error } = await supabase
          .from('skills_evaluation')
          .update(skillData)
          .eq('id', editingSkill.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Skill evaluation updated successfully',
        });
      } else {
        const { error } = await supabase
          .from('skills_evaluation')
          .insert(skillData);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Skill evaluation created successfully',
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchSkills();
    } catch (error) {
      console.error('Error saving skill evaluation:', error);
      toast({
        title: 'Error',
        description: 'Failed to save skill evaluation',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (skill: SkillEvaluation) => {
    setEditingSkill(skill);
    setFormData({
      student_id: skill.student_id,
      skill_name: skill.skill_name,
      skill_category: skill.skill_category,
      e1: skill.e1 || 0,
      e2: skill.e2 || 0,
      e3: skill.e3 || 0,
      e4: skill.e4 || 0,
      e5: skill.e5 || 0,
      e6: skill.e6 || 0,
      evaluation_date: skill.evaluation_date,
      notes: skill.notes || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this skill evaluation?')) return;

    try {
      const { error } = await supabase
        .from('skills_evaluation')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Skill evaluation deleted successfully',
      });

      fetchSkills();
    } catch (error) {
      console.error('Error deleting skill evaluation:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete skill evaluation',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      student_id: '',
      skill_name: '',
      skill_category: 'Writing',
      e1: 0,
      e2: 0,
      e3: 0,
      e4: 0,
      e5: 0,
      e6: 0,
      evaluation_date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setEditingSkill(null);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Writing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Reading': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Listening': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'Speaking': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold mb-2">Skills Evaluation</h2>
          <p className="text-muted-foreground">
            Track student skills across Writing, Reading, Listening, and Speaking
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Evaluation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingSkill ? 'Edit' : 'Add'} Skill Evaluation</DialogTitle>
              <DialogDescription>
                Evaluate student skills with scores from 0-20 for each criterion
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
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.skill_category}
                    onValueChange={(value) => setFormData({ ...formData, skill_category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Writing">Writing</SelectItem>
                      <SelectItem value="Reading">Reading</SelectItem>
                      <SelectItem value="Listening">Listening</SelectItem>
                      <SelectItem value="Speaking">Speaking</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="skill_name">Skill Name *</Label>
                <Input
                  id="skill_name"
                  value={formData.skill_name}
                  onChange={(e) => setFormData({ ...formData, skill_name: e.target.value })}
                  placeholder="e.g., Essay Writing, Comprehension, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="evaluation_date">Evaluation Date *</Label>
                <Input
                  id="evaluation_date"
                  type="date"
                  value={formData.evaluation_date}
                  onChange={(e) => setFormData({ ...formData, evaluation_date: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <div key={num} className="space-y-2">
                    <Label htmlFor={`e${num}`}>E{num} (0-20)</Label>
                    <Input
                      id={`e${num}`}
                      type="number"
                      min="0"
                      max="20"
                      value={formData[`e${num}` as keyof typeof formData]}
                      onChange={(e) => setFormData({ ...formData, [`e${num}`]: Number(e.target.value) })}
                    />
                  </div>
                ))}
              </div>

              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Average Score</p>
                <p className="text-2xl font-bold">{calculateAverage().toFixed(2)}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional comments or observations..."
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingSkill ? 'Update' : 'Create'} Evaluation
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label>Filter by Category:</Label>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Writing">Writing</SelectItem>
                <SelectItem value="Reading">Reading</SelectItem>
                <SelectItem value="Listening">Listening</SelectItem>
                <SelectItem value="Speaking">Speaking</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Skills Table */}
      <Card>
        <CardHeader>
          <CardTitle>Skill Evaluations</CardTitle>
          <CardDescription>Manage and track student skill assessments</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : skills.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Skill</TableHead>
                    <TableHead>E1</TableHead>
                    <TableHead>E2</TableHead>
                    <TableHead>E3</TableHead>
                    <TableHead>E4</TableHead>
                    <TableHead>E5</TableHead>
                    <TableHead>E6</TableHead>
                    <TableHead>Average</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {skills.map((skill) => (
                    <TableRow key={skill.id}>
                      <TableCell className="font-medium">{skill.student_name}</TableCell>
                      <TableCell>{skill.class}</TableCell>
                      <TableCell>
                        <Badge className={getCategoryColor(skill.skill_category)}>
                          {skill.skill_category}
                        </Badge>
                      </TableCell>
                      <TableCell>{skill.skill_name}</TableCell>
                      <TableCell>{skill.e1 || '-'}</TableCell>
                      <TableCell>{skill.e2 || '-'}</TableCell>
                      <TableCell>{skill.e3 || '-'}</TableCell>
                      <TableCell>{skill.e4 || '-'}</TableCell>
                      <TableCell>{skill.e5 || '-'}</TableCell>
                      <TableCell>{skill.e6 || '-'}</TableCell>
                      <TableCell className="font-bold">{skill.average_score?.toFixed(1)}</TableCell>
                      <TableCell>{format(new Date(skill.evaluation_date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(skill)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(skill.id)}
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
              <Award className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Skills Evaluations Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start tracking student skills by adding your first evaluation
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Evaluation
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Skills;
