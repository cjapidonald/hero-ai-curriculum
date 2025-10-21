import React, { useEffect, useMemo, useState } from 'react';
import { useCalendarSessions, CalendarSession } from '@/hooks/useCalendarSessions';
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
import { Pencil, Trash2, Plus, Loader2, Clock } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { supabase } from '@/integrations/supabase/client';

interface CalendarSessionCRUDProps {
  teacherId?: string;
  showActions?: boolean;
}

export function CalendarSessionCRUD({ teacherId, showActions = true }: CalendarSessionCRUDProps) {
  const { user, isAdmin, isTeacher } = useAuth();
  const filters = teacherId ? [{ column: 'teacher_id', value: teacherId }] : undefined;
  const { data: sessions, loading, create, update, remove } = useCalendarSessions(filters);
  const { toast } = useToast();

  const [editingSession, setEditingSession] = useState<CalendarSession | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<CalendarSession>>({} as Partial<CalendarSession>);
  const [teachers, setTeachers] = useState<{ id: string; name: string; surname: string }[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  const canEdit = isAdmin || (isTeacher && (!teacherId || teacherId === user?.id));
  const canDelete = isAdmin || (isTeacher && (!teacherId || teacherId === user?.id));
  const showTeacherColumn = isAdmin;

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    let isMounted = true;
    const fetchTeachers = async () => {
      try {
        setLoadingTeachers(true);
        const { data, error } = await supabase
          .from('teachers')
          .select('id, name, surname')
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (error) {
          throw error;
        }

        if (isMounted) {
          setTeachers(data || []);
        }
      } catch (error) {
        console.error('Error fetching teachers for calendar:', error);
        toast({
          title: 'Unable to load teachers',
          description: 'Teacher list could not be loaded. Try refreshing the page.',
          variant: 'destructive',
        });
      } finally {
        if (isMounted) {
          setLoadingTeachers(false);
        }
      }
    };

    fetchTeachers();

    return () => {
      isMounted = false;
    };
  }, [isAdmin, toast]);

  const teacherNames = useMemo(() => {
    return teachers.reduce<Record<string, string>>((acc, { id, name, surname }) => {
      acc[id] = `${name} ${surname}`.trim();
      return acc;
    }, {});
  }, [teachers]);

  const handleOpenDialog = (session?: CalendarSession) => {
    if (session) {
      setEditingSession(session);
      setFormData(session);
    } else {
      setEditingSession(null);
      setFormData({
        teacher_id: teacherId || (isTeacher ? user?.id : undefined),
        class_name: '',
        lesson_title: '',
        session_date: new Date().toISOString().split('T')[0],
        start_time: '09:00',
        end_time: '10:30',
        status: 'scheduled',
        attendance_taken: false,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.teacher_id) {
      toast({
        title: 'Teacher required',
        description: 'Please select a teacher for this session.',
        variant: 'destructive',
      });
      return;
    }

    if (editingSession) {
      const { error } = await update(editingSession.id, formData);
      if (!error) {
        setIsDialogOpen(false);
        toast({
          title: 'Success',
          description: 'Session updated successfully',
        });
      }
    } else {
      const { error } = await create(formData as any);
      if (!error) {
        setIsDialogOpen(false);
        toast({
          title: 'Success',
          description: 'Session created successfully',
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
          description: 'Session deleted successfully',
        });
      }
      setDeleteId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
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
          <h2 className="text-2xl font-bold">Calendar Sessions</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Schedule Session
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingSession ? 'Edit Session' : 'Schedule New Session'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {isAdmin && (
                    <div className="col-span-2">
                      <Label htmlFor="teacher_id">Teacher *</Label>
                      <Select
                        value={formData.teacher_id || ''}
                        onValueChange={(value) => setFormData({ ...formData, teacher_id: value })}
                        disabled={loadingTeachers || teachers.length === 0}
                      >
                        <SelectTrigger id="teacher_id">
                          <SelectValue placeholder="Select a teacher" />
                        </SelectTrigger>
                        <SelectContent>
                          {teachers.map((teacher) => (
                            <SelectItem key={teacher.id} value={teacher.id}>
                              {teacher.name} {teacher.surname}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="col-span-2">
                    <Label htmlFor="class_name">Class Name *</Label>
                    <Input
                      id="class_name"
                      value={formData.class_name || ''}
                      onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                      required
                      placeholder="e.g., Starters A, Advanced English"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="lesson_title">Lesson Title</Label>
                    <Input
                      id="lesson_title"
                      value={formData.lesson_title || ''}
                      onChange={(e) => setFormData({ ...formData, lesson_title: e.target.value })}
                      placeholder="e.g., Unit 1 - Grammar"
                    />
                  </div>
                  <div>
                    <Label htmlFor="session_date">Date *</Label>
                    <Input
                      id="session_date"
                      type="date"
                      value={formData.session_date || ''}
                      onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      className="w-full border rounded-md p-2"
                      value={formData.status || 'scheduled'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="start_time">Start Time *</Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={formData.start_time || ''}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_time">End Time *</Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={formData.end_time || ''}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                    {editingSession ? 'Update' : 'Create'}
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
              <TableHead>Date & Time</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Lesson</TableHead>
              {showTeacherColumn && <TableHead>Teacher</TableHead>}
              <TableHead>Status</TableHead>
              <TableHead>Attendance</TableHead>
              {showActions && canEdit && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No sessions scheduled. Create your first session to get started.
                </TableCell>
              </TableRow>
            ) : (
              sessions
                .sort((a, b) => new Date(b.session_date || '').getTime() - new Date(a.session_date || '').getTime())
                .map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{session.session_date}</span>
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {session.start_time} - {session.end_time}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{session.class_name}</TableCell>
                    <TableCell>{session.lesson_title || '-'}</TableCell>
                    {showTeacherColumn && (
                      <TableCell>{teacherNames[session.teacher_id] || 'Unassigned'}</TableCell>
                    )}
                    <TableCell>
                      <Badge className={getStatusColor(session.status || 'scheduled')}>
                        {session.status || 'scheduled'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={session.attendance_taken ? 'default' : 'secondary'}>
                        {session.attendance_taken ? 'Taken' : 'Pending'}
                      </Badge>
                    </TableCell>
                    {showActions && canEdit && (
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(session)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteId(session.id)}
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
              This will permanently delete this session.
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
