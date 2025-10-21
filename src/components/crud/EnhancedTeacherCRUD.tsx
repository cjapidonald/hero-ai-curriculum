import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, DollarSign, Key, BarChart3, ClipboardCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { TeacherInsightPanel } from '@/pages/admin/components/TeacherInsightPanel';
import ClassroomObservationForm from '@/components/teacher/ClassroomObservationForm';

interface Teacher {
  id: string;
  name: string;
  surname: string;
  email: string;
  username: string | null;
  password?: string;
  subject: string | null;
  phone: string | null;
  bio: string | null;
  assigned_classes: string[] | null;
  hourly_rate: number | null;
  monthly_earnings: number | null;
  profile_image_url: string | null;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}

export const EnhancedTeacherCRUD = () => {
  const { toast } = useToast();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resetPasswordDialog, setResetPasswordDialog] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [insightOpen, setInsightOpen] = useState(false);
  const [insightTeacher, setInsightTeacher] = useState<Teacher | null>(null);
  const [evaluationDialogOpen, setEvaluationDialogOpen] = useState(false);
  const [evaluatingTeacher, setEvaluatingTeacher] = useState<Teacher | null>(null);
  const [pendingReviews, setPendingReviews] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    email: '',
    username: '',
    password: '',
    subject: 'English',
    phone: '',
    bio: '',
    assigned_classes: [] as string[],
    hourly_rate: 250000,
    is_active: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [teachersRes, classesRes, evaluationsRes] = await Promise.all([
        supabase.from('teachers').select('*').order('created_at', { ascending: false }),
        supabase.from('classes').select('*').eq('is_active', true),
        supabase.from('teacher_evaluations').select('teacher_id, requires_attention').eq('requires_attention', true),
      ]);

      if (teachersRes.data) setTeachers(teachersRes.data as unknown as Teacher[]);
      if (classesRes.data) setClasses(classesRes.data);

      // Build a map of teacher IDs that have pending reviews
      if (evaluationsRes.data) {
        const reviewMap: Record<string, boolean> = {};
        evaluationsRes.data.forEach((evaluation: any) => {
          reviewMap[evaluation.teacher_id] = true;
        });
        setPendingReviews(reviewMap);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load teachers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const dataToSave = {
        ...formData,
        // Only include password if it's being set/changed
        ...(formData.password && { password: formData.password }),
      };

      if (editingTeacher) {
        // Don't send password if it's empty (keeping existing)
        if (!formData.password) {
          delete (dataToSave as any).password;
        }

        const { error } = await supabase
          .from('teachers')
          .update(dataToSave)
          .eq('id', editingTeacher.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Teacher updated successfully',
        });
      } else {
        const { error } = await supabase
          .from('teachers')
          .insert([dataToSave]);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Teacher created successfully',
        });
      }

      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Error saving teacher:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save teacher',
        variant: 'destructive',
      });
    }
  };

  const handleResetPassword = async () => {
    if (!selectedTeacher || !newPassword) return;

    try {
      const { error } = await supabase
        .from('teachers')
        .update({ password: newPassword })
        .eq('id', selectedTeacher.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Password reset successfully',
      });

      setResetPasswordDialog(false);
      setNewPassword('');
      setSelectedTeacher(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reset password',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      name: teacher.name,
      surname: teacher.surname,
      email: teacher.email,
      username: teacher.username || '',
      password: '', // Don't pre-fill password
      subject: teacher.subject || 'English',
      phone: teacher.phone || '',
      bio: teacher.bio || '',
      assigned_classes: teacher.assigned_classes || [],
      hourly_rate: teacher.hourly_rate || 250000,
      is_active: teacher.is_active,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this teacher?')) return;

    try {
      const { error } = await supabase
        .from('teachers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Teacher deleted successfully',
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete teacher',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setEditingTeacher(null);
    setFormData({
      name: '',
      surname: '',
      email: '',
      username: '',
      password: '',
      subject: 'English',
      phone: '',
      bio: '',
      assigned_classes: [],
      hourly_rate: 250000,
      is_active: true,
    });
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '0 VND';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  if (loading) {
    return <div className="text-center py-8">Loading teachers...</div>;
  }

  return (
    <>
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Teacher Management</h2>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Teacher
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}</DialogTitle>
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
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    placeholder="e.g., donald"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password {!editingTeacher && '*'}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editingTeacher}
                    placeholder={editingTeacher ? 'Leave blank to keep current' : ''}
                  />
                </div>
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Select value={formData.subject} onValueChange={(value) => setFormData({ ...formData, subject: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Math">Math</SelectItem>
                      <SelectItem value="Science">Science</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+84 XXX XXX XXX"
                  />
                </div>
                <div>
                  <Label htmlFor="hourly_rate">Hourly Rate (VND)</Label>
                  <Input
                    id="hourly_rate"
                    type="number"
                    value={formData.hourly_rate}
                    onChange={(e) => setFormData({ ...formData, hourly_rate: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Teacher's background and expertise"
                  rows={3}
                />
              </div>

              <div>
                <Label>Assigned Classes</Label>
                <div className="border rounded-lg p-4 space-y-2">
                  {classes.map((cls) => (
                    <div key={cls.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`class-${cls.id}`}
                        checked={formData.assigned_classes.includes(cls.name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              assigned_classes: [...formData.assigned_classes, cls.name],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              assigned_classes: formData.assigned_classes.filter((c) => c !== cls.name),
                            });
                          }
                        }}
                      />
                      <Label htmlFor={`class-${cls.id}`}>
                        {cls.name} - {cls.level} ({cls.stage})
                      </Label>
                    </div>
                  ))}
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
                  {editingTeacher ? 'Update' : 'Create'} Teacher
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordDialog} onOpenChange={setResetPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Teacher</Label>
              <p className="text-sm text-muted-foreground">
                {selectedTeacher?.name} {selectedTeacher?.surname}
              </p>
            </div>
            <div>
              <Label htmlFor="new_password">New Password</Label>
              <Input
                id="new_password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setResetPasswordDialog(false);
                setNewPassword('');
                setSelectedTeacher(null);
              }}>
                Cancel
              </Button>
              <Button onClick={handleResetPassword}>
                Reset Password
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Evaluation Dialog */}
      <Dialog open={evaluationDialogOpen} onOpenChange={setEvaluationDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          {evaluatingTeacher && (
            <ClassroomObservationForm
              teacher={evaluatingTeacher}
              classes={classes}
              onClose={() => setEvaluationDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Classes</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Monthly Earnings</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teachers.map((teacher) => (
              <TableRow key={teacher.id}>
                <TableCell className="font-medium">
                  {teacher.name} {teacher.surname}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{teacher.username || 'Not set'}</Badge>
                </TableCell>
                <TableCell>{teacher.email}</TableCell>
                <TableCell>{teacher.subject || '-'}</TableCell>
                <TableCell>
                  {teacher.assigned_classes && teacher.assigned_classes.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {teacher.assigned_classes.map((cls, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {cls}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>{formatCurrency(teacher.hourly_rate)}/hr</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="font-semibold text-green-600">
                      {formatCurrency(teacher.monthly_earnings)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={teacher.is_active ? 'default' : 'secondary'}>
                    {teacher.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setInsightTeacher(teacher);
                        setInsightOpen(true);
                      }}
                      title="View teacher dashboard"
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={pendingReviews[teacher.id] ? "destructive" : "ghost"}
                      size="sm"
                      onClick={() => {
                        setEvaluatingTeacher(teacher);
                        setEvaluationDialogOpen(true);
                      }}
                      title={pendingReviews[teacher.id] ? "Teacher has responded - Review Required!" : "Evaluate Teacher"}
                      className={pendingReviews[teacher.id] ? "animate-pulse" : ""}
                    >
                      <ClipboardCheck className="h-4 w-4" />
                      {pendingReviews[teacher.id] && (
                        <span className="ml-1 text-xs">!</span>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedTeacher(teacher);
                        setResetPasswordDialog(true);
                      }}
                      title="Reset Password"
                    >
                      <Key className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(teacher)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(teacher.id)}
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
    <TeacherInsightPanel
        open={insightOpen}
        teacherId={insightTeacher?.id ?? null}
        initialTeacher={insightTeacher}
        onOpenChange={(open) => {
          setInsightOpen(open);
          if (!open) {
            setInsightTeacher(null);
          }
        }}
      />
    </>
  );
};
