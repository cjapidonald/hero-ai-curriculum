import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import StudentDashboardViewer from '@/pages/admin/components/StudentDashboardViewer';

interface Student {
  id: string;
  name: string;
  surname: string;
  email: string;
  password?: string;
  class: string | null;
  gender: string | null;
  subject: string | null;
  level: string | null;
  birthday: string | null;
  attendance_rate: number;
  parent_name: string | null;
  parent_zalo_nr: string | null;
  location: string | null;
  placement_test_speaking: string | null;
  placement_test_listening: string | null;
  placement_test_reading: string | null;
  placement_test_writing: string | null;
  sessions: number;
  sessions_left: number;
  profile_image_url: string | null;
  is_active: boolean;
  created_at: string;
}

export const EnhancedStudentCRUD = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingStudentId, setViewingStudentId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    email: '',
    password: '',
    class: '',
    gender: '',
    subject: 'English',
    level: '',
    birthday: '',
    parent_name: '',
    parent_zalo_nr: '',
    location: '',
    placement_test_speaking: '',
    placement_test_listening: '',
    placement_test_reading: '',
    placement_test_writing: '',
    sessions: 0,
    sessions_left: 0,
    is_active: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [studentsRes, classesRes] = await Promise.all([
        supabase.from('dashboard_students').select('*').order('created_at', { ascending: false }),
        supabase.from('classes').select('*').eq('is_active', true),
      ]);

      if (studentsRes.data) setStudents(studentsRes.data);
      if (classesRes.data) setClasses(classesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load students',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
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
          .insert([formData]);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Student created successfully',
        });
      }

      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Error saving student:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save student',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      surname: student.surname,
      email: student.email,
      password: '', // Don't pre-fill password
      class: student.class || '',
      gender: student.gender || '',
      subject: student.subject || 'English',
      level: student.level || '',
      birthday: student.birthday || '',
      parent_name: student.parent_name || '',
      parent_zalo_nr: student.parent_zalo_nr || '',
      location: student.location || '',
      placement_test_speaking: student.placement_test_speaking || '',
      placement_test_listening: student.placement_test_listening || '',
      placement_test_reading: student.placement_test_reading || '',
      placement_test_writing: student.placement_test_writing || '',
      sessions: student.sessions,
      sessions_left: student.sessions_left,
      is_active: student.is_active,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return;

    try {
      const { error } = await supabase
        .from('dashboard_students')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Student deleted successfully',
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete student',
        variant: 'destructive',
      });
    }
  };

  const handleViewDashboard = (studentId: string) => {
    setViewingStudentId(studentId);
  };

  const resetForm = () => {
    setEditingStudent(null);
    setFormData({
      name: '',
      surname: '',
      email: '',
      password: '',
      class: '',
      gender: '',
      subject: 'English',
      level: '',
      birthday: '',
      parent_name: '',
      parent_zalo_nr: '',
      location: '',
      placement_test_speaking: '',
      placement_test_listening: '',
      placement_test_reading: '',
      placement_test_writing: '',
      sessions: 0,
      sessions_left: 0,
      is_active: true,
    });
  };

  if (loading) {
    return <div className="text-center py-8">Loading students...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Student Management</h2>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingStudent ? 'Edit Student' : 'Add New Student'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">First Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="surname">Surname *</Label>
                  <Input
                    id="surname"
                    value={formData.surname}
                    onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password {!editingStudent && '*'}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editingStudent}
                    placeholder={editingStudent ? 'Leave blank to keep current' : ''}
                  />
                </div>
                <div>
                  <Label htmlFor="class">Class</Label>
                  <Select value={formData.class} onValueChange={(value) => setFormData({ ...formData, class: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.name}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
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
                <div>
                  <Label htmlFor="birthday">Birthday</Label>
                  <Input
                    id="birthday"
                    type="date"
                    value={formData.birthday}
                    onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="parent_name">Parent Name</Label>
                  <Input
                    id="parent_name"
                    value={formData.parent_name}
                    onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="parent_zalo_nr">Parent Zalo Number</Label>
                  <Input
                    id="parent_zalo_nr"
                    value={formData.parent_zalo_nr}
                    onChange={(e) => setFormData({ ...formData, parent_zalo_nr: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Smart City i4 Building"
                  />
                </div>
                <div>
                  <Label htmlFor="sessions_left">Sessions Left</Label>
                  <Input
                    id="sessions_left"
                    type="number"
                    value={formData.sessions_left}
                    onChange={(e) => setFormData({ ...formData, sessions_left: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Placement Test Results</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="placement_test_speaking">Speaking</Label>
                    <Input
                      id="placement_test_speaking"
                      value={formData.placement_test_speaking}
                      onChange={(e) => setFormData({ ...formData, placement_test_speaking: e.target.value })}
                      placeholder="e.g., B1 or 75%"
                    />
                  </div>
                  <div>
                    <Label htmlFor="placement_test_listening">Listening</Label>
                    <Input
                      id="placement_test_listening"
                      value={formData.placement_test_listening}
                      onChange={(e) => setFormData({ ...formData, placement_test_listening: e.target.value })}
                      placeholder="e.g., B1 or 75%"
                    />
                  </div>
                  <div>
                    <Label htmlFor="placement_test_reading">Reading</Label>
                    <Input
                      id="placement_test_reading"
                      value={formData.placement_test_reading}
                      onChange={(e) => setFormData({ ...formData, placement_test_reading: e.target.value })}
                      placeholder="e.g., B1 or 75%"
                    />
                  </div>
                  <div>
                    <Label htmlFor="placement_test_writing">Writing</Label>
                    <Input
                      id="placement_test_writing"
                      value={formData.placement_test_writing}
                      onChange={(e) => setFormData({ ...formData, placement_test_writing: e.target.value })}
                      placeholder="e.g., B1 or 75%"
                    />
                  </div>
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
                  {editingStudent ? 'Update' : 'Create'} Student
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={!!viewingStudentId} onOpenChange={() => setViewingStudentId(null)}>
        <DialogContent className="sm:max-w-[1200px]">
          <DialogHeader>
            <DialogTitle>Student Dashboard</DialogTitle>
          </DialogHeader>
          {viewingStudentId && <StudentDashboardViewer studentId={viewingStudentId} />}
        </DialogContent>
      </Dialog>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Parent</TableHead>
              <TableHead>Sessions</TableHead>
              <TableHead>Attendance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
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
                <TableCell>{student.parent_name || '-'}</TableCell>
                <TableCell>
                  {student.sessions} / {student.sessions_left} left
                </TableCell>
                <TableCell>{student.attendance_rate?.toFixed(1)}%</TableCell>
                <TableCell>
                  <Badge variant={student.is_active ? 'default' : 'secondary'}>
                    {student.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDashboard(student.id)}
                      title="View Dashboard"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(student)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(student.id)}
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
