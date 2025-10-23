import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
import { Pencil, Trash2, Plus, Loader2, Users } from 'lucide-react';
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
import type { Tables } from '@/integrations/supabase/types';

type Student = Tables<'dashboard_students'>;

interface TeacherStudentCRUDProps {
  teacherId: string;
}

export function TeacherStudentCRUD({ teacherId }: TeacherStudentCRUDProps) {
  const { user, isAdmin, isTeacher } = useAuth();
  const { toast } = useToast();

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [teacherClasses, setTeacherClasses] = useState<string[]>([]);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Student>>({});

  const canEdit = isAdmin || isTeacher;
  const canDelete = isAdmin;

  // Load teacher's assigned classes
  useEffect(() => {
    const loadTeacherClasses = async () => {
      try {
        const { data: classes, error } = await supabase
          .from('classes')
          .select('class_name')
          .eq('teacher_id', teacherId)
          .eq('is_active', true);

        if (error) {
          console.error('Error loading teacher classes:', error);
          return;
        }

        const classNames = classes?.map(({ class_name }) => class_name) ?? [];
        setTeacherClasses(classNames);
      } catch (err) {
        console.error('Error loading teacher classes:', err);
      }
    };

    loadTeacherClasses();
  }, [teacherId]);

  // Load students from teacher's classes
  useEffect(() => {
    const loadStudents = async () => {
      setLoading(true);
      try {
        if (teacherClasses.length === 0) {
          setStudents([]);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('dashboard_students')
          .select('*')
          .in('class', teacherClasses)
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (error) {
          console.error('Error loading students:', error);
          toast({
            title: 'Error',
            description: 'Failed to load students',
            variant: 'destructive',
          });
          return;
        }

        setStudents(data || []);
      } catch (err) {
        console.error('Error loading students:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStudents();

    // Set up real-time subscription
    const channel = supabase
      .channel('teacher-students-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dashboard_students',
        },
        () => {
          loadStudents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teacherClasses, toast]);

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
        class: teacherClasses[0] || '',
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

    try {
      if (editingStudent) {
        const { error } = await supabase
          .from('dashboard_students')
          .update(formData)
          .eq('id', editingStudent.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Student updated successfully',
        });
      } else {
        const { error } = await supabase
          .from('dashboard_students')
          .insert([formData as Student]);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Student created successfully',
        });
      }
      setIsDialogOpen(false);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to save student',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('dashboard_students')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Student deleted successfully',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to delete student',
        variant: 'destructive',
      });
    } finally {
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

  if (teacherClasses.length === 0) {
    return (
      <div className="text-center p-8">
        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Classes Assigned</h3>
        <p className="text-muted-foreground">
          You don't have any classes assigned yet. Once you're assigned to classes, your students will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">My Students</h2>
            <p className="text-sm text-muted-foreground">
              Students from your assigned classes: {teacherClasses.join(', ')}
            </p>
          </div>
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
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="class">Class *</Label>
                    <select
                      id="class"
                      className="w-full border rounded-md p-2"
                      value={formData.class || ''}
                      onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                      required
                    >
                      <option value="">Select a class</option>
                      {teacherClasses.map(className => (
                        <option key={className} value={className}>
                          {className}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="level">Level</Label>
                    <Input
                      id="level"
                      value={formData.level || ''}
                      onChange={(e) => setFormData({ ...formData, level: e.target.value })}
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
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
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

      {students.length === 0 ? (
        <div className="text-center p-8 border rounded-lg">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Students Yet</h3>
          <p className="text-muted-foreground">
            No students have been added to your classes yet.
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Status</TableHead>
                {canEdit && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">
                    {student.name} {student.surname}
                  </TableCell>
                  <TableCell>{student.email || '-'}</TableCell>
                  <TableCell>{student.class}</TableCell>
                  <TableCell>{student.level || '-'}</TableCell>
                  <TableCell>{student.gender || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={student.is_active ? 'default' : 'secondary'}>
                      {student.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  {canEdit && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
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
                            <Trash2 className="h-4 w-4 text-destructive" />
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
      )}

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this student. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
