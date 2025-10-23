import React, { useMemo, useState } from 'react';
import { useStudents, Student } from '@/hooks/useStudents';
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
import { Pencil, Trash2, Plus, Loader2 } from 'lucide-react';
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

interface StudentCRUDProps {
  classFilter?: string;
  showActions?: boolean;
}

export function StudentCRUD({ classFilter, showActions = true }: StudentCRUDProps) {
  const { user, isAdmin, isTeacher } = useAuth();
  const filters = useMemo(
    () => (classFilter ? [{ column: 'class', value: classFilter }] : undefined),
    [classFilter]
  );
  const { data: students, loading, create, update, remove } = useStudents(filters);
  const { toast } = useToast();

  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Student>>({});

  const canEdit = isAdmin || isTeacher;
  const canDelete = isAdmin;

  const handleOpenDialog = (student?: Student) => {
    if (student) {
      setEditingStudent(student);
      setFormData(student);
    } else {
      setEditingStudent(null);
      setFormData({
        name: '',
        surname: '',
        email: '',
        class: classFilter || '',
        subject: 'English',
        level: '',
        gender: '',
        is_active: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingStudent) {
      const { error } = await update(editingStudent.id, formData);
      if (!error) {
        setIsDialogOpen(false);
        toast({
          title: 'Success',
          description: 'Student updated successfully',
        });
      }
    } else {
      const { error } = await create(formData as Student);
      if (!error) {
        setIsDialogOpen(false);
        toast({
          title: 'Success',
          description: 'Student created successfully',
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
          description: 'Student deleted successfully',
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
          <h2 className="text-2xl font-bold">Students</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingStudent ? 'Edit Student' : 'Add New Student'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">First Name *</Label>
                    <Input
                      id="name"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="surname">Last Name *</Label>
                    <Input
                      id="surname"
                      value={formData.surname || ''}
                      onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                    <Label htmlFor="level">Level</Label>
                    <Input
                      id="level"
                      value={formData.level || ''}
                      onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                      placeholder="e.g., Pre-A1, A1, A2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <select
                      id="gender"
                      className="w-full border rounded-md p-2"
                      value={formData.gender || ''}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    >
                      <option value="">Select...</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="parent_name">Parent Name</Label>
                    <Input
                      id="parent_name"
                      value={formData.parent_name || ''}
                      onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="parent_zalo_nr">Parent Contact</Label>
                    <Input
                      id="parent_zalo_nr"
                      value={formData.parent_zalo_nr || ''}
                      onChange={(e) => setFormData({ ...formData, parent_zalo_nr: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="sessions">Total Sessions</Label>
                    <Input
                      id="sessions"
                      type="number"
                      value={formData.sessions || 0}
                      onChange={(e) => setFormData({ ...formData, sessions: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="sessions_left">Sessions Left</Label>
                    <Input
                      id="sessions_left"
                      type="number"
                      value={formData.sessions_left || 0}
                      onChange={(e) => setFormData({ ...formData, sessions_left: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                    {editingStudent ? 'Update' : 'Create'}
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
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Sessions Left</TableHead>
              <TableHead>Attendance</TableHead>
              <TableHead>Status</TableHead>
              {showActions && canEdit && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-medium">
                  {student.name} {student.surname}
                </TableCell>
                <TableCell>{student.email}</TableCell>
                <TableCell>{student.class || '-'}</TableCell>
                <TableCell>{student.level || '-'}</TableCell>
                <TableCell>{student.sessions_left || 0}</TableCell>
                <TableCell>{student.attendance_rate || 0}%</TableCell>
                <TableCell>
                  <Badge variant={student.is_active ? 'default' : 'secondary'}>
                    {student.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                {showActions && canEdit && (
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(student)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(student.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this student and all associated data.
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
