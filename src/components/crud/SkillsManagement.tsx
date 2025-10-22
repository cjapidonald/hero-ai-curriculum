import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

interface SkillsManagementProps {
  showHeader?: boolean;
}

interface Skill {
  id: string;
  skill_name: string;
  skill_category: string;
  skill_description: string | null;
  level: string | null;
  stage: string | null;
  assigned_classes: string[] | null;
  evaluation_criteria: string[] | null;
  is_active: boolean;
  created_at: string;
}

export const SkillsManagement = ({ showHeader = true }: SkillsManagementProps) => {
  const { toast } = useToast();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);

  const [formData, setFormData] = useState({
    skill_name: '',
    skill_category: '',
    skill_description: '',
    level: '',
    stage: '',
    assigned_classes: [] as string[],
    evaluation_criteria: [''] as string[],
    is_active: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [skillsRes, classesRes] = await Promise.all([
        supabase.from('skills_master' as any).select('*').order('created_at', { ascending: false }),
        supabase.from('classes').select('*').eq('is_active', true),
      ]);

      if (skillsRes.data) setSkills(skillsRes.data as any);
      if (classesRes.data) setClasses(classesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load skills',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Filter out empty criteria
      const filteredCriteria = formData.evaluation_criteria.filter(c => c.trim() !== '');

      const dataToSave = {
        ...formData,
        evaluation_criteria: filteredCriteria,
      };

      if (editingSkill) {
        const { error } = await supabase
          .from('skills_master' as any)
          .update(dataToSave)
          .eq('id', editingSkill.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Skill updated successfully',
        });
      } else {
        const { error } = await supabase
          .from('skills_master' as any)
          .insert([dataToSave]);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Skill created successfully',
        });
      }

      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Error saving skill:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save skill',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (skill: Skill) => {
    setEditingSkill(skill);
    setFormData({
      skill_name: skill.skill_name,
      skill_category: skill.skill_category,
      skill_description: skill.skill_description || '',
      level: skill.level || '',
      stage: skill.stage || '',
      assigned_classes: skill.assigned_classes || [],
      evaluation_criteria: skill.evaluation_criteria && skill.evaluation_criteria.length > 0
        ? skill.evaluation_criteria
        : [''],
      is_active: skill.is_active,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this skill?')) return;

    try {
      const { error } = await supabase
        .from('skills_master' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Skill deleted successfully',
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete skill',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setEditingSkill(null);
    setFormData({
      skill_name: '',
      skill_category: '',
      skill_description: '',
      level: '',
      stage: '',
      assigned_classes: [],
      evaluation_criteria: [''],
      is_active: true,
    });
  };

  const addCriterion = () => {
    setFormData({
      ...formData,
      evaluation_criteria: [...formData.evaluation_criteria, ''],
    });
  };

  const removeCriterion = (index: number) => {
    setFormData({
      ...formData,
      evaluation_criteria: formData.evaluation_criteria.filter((_, i) => i !== index),
    });
  };

  const updateCriterion = (index: number, value: string) => {
    const updated = [...formData.evaluation_criteria];
    updated[index] = value;
    setFormData({ ...formData, evaluation_criteria: updated });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Speaking':
        return 'bg-blue-100 text-blue-700';
      case 'Reading':
        return 'bg-green-100 text-green-700';
      case 'Writing':
        return 'bg-purple-100 text-purple-700';
      case 'Listening':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading skills...</div>;
  }

  return (
    <div className="space-y-4">
      <div className={showHeader ? 'flex justify-between items-center' : 'flex justify-end'}>
        {showHeader && (
          <div>
            <h2 className="text-2xl font-bold">Skills Management</h2>
            <p className="text-sm text-muted-foreground">
              Create and manage skills that can be assigned to classes
            </p>
          </div>
        )}
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Skill
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingSkill ? 'Edit Skill' : 'Add New Skill'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="skill_name">Skill Name *</Label>
                  <Input
                    id="skill_name"
                    value={formData.skill_name}
                    onChange={(e) => setFormData({ ...formData, skill_name: e.target.value })}
                    required
                    placeholder="e.g., Count 1-20"
                  />
                </div>
                <div>
                  <Label htmlFor="skill_category">Category *</Label>
                  <Select
                    value={formData.skill_category}
                    onValueChange={(value) => setFormData({ ...formData, skill_category: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Speaking">Speaking</SelectItem>
                      <SelectItem value="Reading">Reading</SelectItem>
                      <SelectItem value="Writing">Writing</SelectItem>
                      <SelectItem value="Listening">Listening</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="level">Level</Label>
                  <Select value={formData.level} onValueChange={(value) => setFormData({ ...formData, level: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Pre-A1">Pre-A1</SelectItem>
                      <SelectItem value="A1">A1</SelectItem>
                      <SelectItem value="A2">A2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="stage">Stage</Label>
                  <Select value={formData.stage} onValueChange={(value) => setFormData({ ...formData, stage: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {['Stage 1', 'Stage 2', 'Stage 3', 'Stage 4', 'Stage 5', 'Stage 6'].map((stage) => (
                        <SelectItem key={stage} value={stage}>
                          {stage}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="skill_description">Description</Label>
                <Textarea
                  id="skill_description"
                  value={formData.skill_description}
                  onChange={(e) => setFormData({ ...formData, skill_description: e.target.value })}
                  placeholder="Describe what students should be able to do"
                  rows={3}
                />
              </div>

              <div>
                <Label>Evaluation Criteria</Label>
                <div className="space-y-2">
                  {formData.evaluation_criteria.map((criterion, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={criterion}
                        onChange={(e) => updateCriterion(index, e.target.value)}
                        placeholder={`Criterion ${index + 1}`}
                      />
                      {formData.evaluation_criteria.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeCriterion(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addCriterion}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Criterion
                  </Button>
                </div>
              </div>

              <div>
                <Label>Assign to Classes</Label>
                <div className="border rounded-lg p-4 space-y-2 max-h-40 overflow-y-auto">
                  {classes.map((cls) => {
                    const className = cls.name ?? cls.class_name ?? 'Unnamed class';
                    return (
                      <div key={cls.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`skill-class-${cls.id}`}
                          checked={formData.assigned_classes.includes(className)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                assigned_classes: [...formData.assigned_classes, className],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                assigned_classes: formData.assigned_classes.filter((c) => c !== className),
                              });
                            }
                          }}
                        />
                        <Label htmlFor={`skill-class-${cls.id}`}>
                          {className} - {cls.level} ({cls.stage})
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingSkill ? 'Update' : 'Create'} Skill
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table className="text-sm">
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Skill Name</TableHead>
              <TableHead className="whitespace-nowrap">Category</TableHead>
              <TableHead className="whitespace-nowrap">Level/Stage</TableHead>
              <TableHead className="whitespace-nowrap">Assigned Classes</TableHead>
              <TableHead className="whitespace-nowrap">Criteria Count</TableHead>
              <TableHead className="whitespace-nowrap">Status</TableHead>
              <TableHead className="whitespace-nowrap">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {skills.map((skill) => (
              <TableRow key={skill.id}>
                <TableCell className="font-medium whitespace-nowrap">{skill.skill_name}</TableCell>
                <TableCell className="whitespace-nowrap">
                  <Badge className={getCategoryColor(skill.skill_category)}>
                    {skill.skill_category}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {skill.level && <Badge variant="outline">{skill.level}</Badge>}
                  {skill.stage && <Badge variant="outline" className="ml-1">{skill.stage}</Badge>}
                </TableCell>
                <TableCell className="min-w-[150px]">
                  {skill.assigned_classes && skill.assigned_classes.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {skill.assigned_classes.map((cls, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {cls}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">No classes</span>
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {skill.evaluation_criteria?.length || 0} criteria
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <Badge variant={skill.is_active ? 'default' : 'secondary'}>
                    {skill.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(skill)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(skill.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
