import React, { useMemo, useState } from 'react';
import { useAssignments, Assignment } from '@/hooks/useAssignments';
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
import { Pencil, Trash2, Plus, Loader2, BookOpen } from 'lucide-react';
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

interface AssignmentCRUDProps {
  teacherId?: string;
  studentId?: string;
  classFilter?: string;
  showActions?: boolean;
}

export function AssignmentCRUD({ teacherId, studentId, classFilter, showActions = true }: AssignmentCRUDProps) {
  const { user, isAdmin, isTeacher, isStudent } = useAuth();

  const filters = useMemo(() => {
    const conditions = [] as { column: string; value: string }[];
    if (teacherId) conditions.push({ column: 'teacher_id', value: teacherId });
    if (studentId) conditions.push({ column: 'target_student_id', value: studentId });
    if (classFilter) conditions.push({ column: 'target_class', value: classFilter });
    return conditions.length > 0 ? conditions : undefined;
  }, [teacherId, studentId, classFilter]);

  const { data: assignments, loading, create, update, remove } = useAssignments(filters);
  const { toast } = useToast();

  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Assignment>>({} as Partial<Assignment>);

  const canEdit = isAdmin || (isTeacher && (!teacherId || teacherId === user?.id));
  const canDelete = isAdmin || (isTeacher && (!teacherId || teacherId === user?.id));

  const handleOpenDialog = (assignment?: Assignment) => {
    if (assignment) {
      setEditingAssignment(assignment);
      setFormData(assignment);
    } else {
      setEditingAssignment(null);
      setFormData({
        teacher_id: teacherId || user?.id || undefined,
        title: '',
        description: '',
        assignment_type: 'homework',
        target_type: 'class',
        target_class: classFilter || '',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingAssignment) {
      const { error } = await update(editingAssignment.id, formData);
      if (!error) {
        setIsDialogOpen(false);
        toast({
          title: 'Success',
          description: 'Assignment updated successfully',
        });
      }
    } else {
      const { error } = await create(formData as Assignment);
      if (!error) {
        setIsDialogOpen(false);
        toast({
          title: 'Success',
          description: 'Assignment created successfully',
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
          description: 'Assignment deleted successfully',
        });
      }
      setDeleteId(null);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'assessment':
        return 'bg-red-500';
      case 'homework':
        return 'bg-blue-500';
      case 'printable':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
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
          <h2 className="text-2xl font-bold">Assignments</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Assignment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingAssignment ? 'Edit Assignment' : 'Create New Assignment'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title || ''}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      placeholder="e.g., Grammar Worksheet 1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe the assignment details..."
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="assignment_type">Type</Label>
                      <select
                        id="assignment_type"
                        className="w-full border rounded-md p-2"
                        value={formData.assignment_type || 'homework'}
                        onChange={(e) => setFormData({ ...formData, assignment_type: e.target.value })}
                      >
                        <option value="homework">Homework</option>
                        <option value="assessment">Assessment</option>
                        <option value="printable">Printable</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="due_date">Due Date</Label>
                      <Input
                        id="due_date"
                        type="date"
                        value={formData.due_date || ''}
                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="target_type">Assign To *</Label>
                      <select
                        id="target_type"
                        className="w-full border rounded-md p-2"
                        value={formData.target_type || 'class'}
                        onChange={(e) => setFormData({ ...formData, target_type: e.target.value })}
                        required
                      >
                        <option value="class">Whole Class</option>
                        <option value="student">Individual Student</option>
                      </select>
                    </div>
                    {formData.target_type === 'class' && (
                      <div>
                        <Label htmlFor="target_class">Class Name *</Label>
                        <Input
                          id="target_class"
                          value={formData.target_class || ''}
                          onChange={(e) => setFormData({ ...formData, target_class: e.target.value })}
                          required
                          placeholder="e.g., Starters A"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                    {editingAssignment ? 'Update' : 'Create'}
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
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Due Date</TableHead>
              {showActions && canEdit && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  No assignments found. Create your first assignment to get started.
                </TableCell>
              </TableRow>
            ) : (
              assignments
                .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
                .map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-purple-600" />
                        <div>
                          <div className="font-medium">{assignment.title}</div>
                          {assignment.description && (
                            <div className="text-sm text-gray-500 max-w-md truncate">
                              {assignment.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(assignment.assignment_type || 'custom')}>
                        {assignment.assignment_type || 'custom'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {assignment.target_type === 'class' ? (
                        <span>Class: {assignment.target_class}</span>
                      ) : (
                        <span>Individual</span>
                      )}
                    </TableCell>
                    <TableCell>{assignment.due_date || '-'}</TableCell>
                    {showActions && canEdit && (
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(assignment)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteId(assignment.id)}
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
              This will permanently delete this assignment.
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
