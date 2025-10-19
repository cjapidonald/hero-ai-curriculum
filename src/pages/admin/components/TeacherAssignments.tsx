import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Teacher {
  id: string;
  name: string;
  surname: string;
  email: string;
}

interface Class {
  id: string;
  class_name: string;
  stage: string;
}

interface Curriculum {
  id: string;
  title: string;
  stage: string;
}

interface Assignment {
  id: string;
  teacher_id: string;
  class_id: string | null;
  curriculum_id: string | null;
  teaching_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  status: string;
  notes: string | null;
}

export default function TeacherAssignments() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    teacher_id: '',
    class_id: '',
    curriculum_id: '',
    teaching_date: '',
    start_time: '',
    end_time: '',
    location: '',
    status: 'scheduled',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const { data: teachersData } = await supabase
        .from('teachers')
        .select('id, name, surname, email')
        .eq('is_active', true)
        .order('name');

      const { data: classesData } = await supabase
        .from('classes')
        .select('id, class_name, stage')
        .eq('is_active', true)
        .order('class_name');

      const { data: curriculaData } = await supabase
        .from('curriculum')
        .select('id, title, stage')
        .order('title');

      const { data: assignmentsData } = await supabase
        .from('teacher_assignments')
        .select('*')
        .order('teaching_date', { ascending: false });

      setTeachers(teachersData || []);
      setClasses(classesData || []);
      setCurricula(curriculaData || []);
      setAssignments(assignmentsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load assignments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from('teacher_assignments')
        .insert([
          {
            teacher_id: formData.teacher_id,
            class_id: formData.class_id || null,
            curriculum_id: formData.curriculum_id || null,
            teaching_date: formData.teaching_date,
            start_time: formData.start_time || null,
            end_time: formData.end_time || null,
            location: formData.location || null,
            status: formData.status,
            notes: formData.notes || null,
          },
        ]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Teacher assignment created successfully',
      });

      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast({
        title: 'Error',
        description: 'Failed to create assignment',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;

    try {
      const { error } = await supabase
        .from('teacher_assignments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Assignment deleted successfully',
      });
      fetchData();
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete assignment',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      teacher_id: '',
      class_id: '',
      curriculum_id: '',
      teaching_date: '',
      start_time: '',
      end_time: '',
      location: '',
      status: 'scheduled',
      notes: '',
    });
  };

  const getTeacherName = (teacherId: string) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher ? `${teacher.name} ${teacher.surname}` : 'Unknown';
  };

  const getClassName = (classId: string | null) => {
    if (!classId) return '-';
    const classItem = classes.find(c => c.id === classId);
    return classItem ? classItem.class_name : 'Unknown';
  };

  const getCurriculumTitle = (curriculumId: string | null) => {
    if (!curriculumId) return '-';
    const curriculum = curricula.find(c => c.id === curriculumId);
    return curriculum ? curriculum.title : 'Unknown';
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'scheduled': return 'secondary';
      case 'cancelled': return 'destructive';
      case 'rescheduled': return 'outline';
      default: return 'outline';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Teacher Assignments
              </CardTitle>
              <CardDescription>Assign teachers to classes with dates and times</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Assignment
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Teacher Assignment</DialogTitle>
                  <DialogDescription>Schedule a teacher to a class with specific date and time</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-2 gap-4 py-4">
                    <div className="col-span-2">
                      <Label htmlFor="teacher">Teacher *</Label>
                      <Select
                        value={formData.teacher_id}
                        onValueChange={(value) => setFormData({ ...formData, teacher_id: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select teacher" />
                        </SelectTrigger>
                        <SelectContent>
                          {teachers.map((teacher) => (
                            <SelectItem key={teacher.id} value={teacher.id}>
                              {teacher.name} {teacher.surname} - {teacher.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2">
                      <Label htmlFor="class">Class</Label>
                      <Select
                        value={formData.class_id}
                        onValueChange={(value) => setFormData({ ...formData, class_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select class (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {classes.map((classItem) => (
                            <SelectItem key={classItem.id} value={classItem.id}>
                              {classItem.class_name} ({classItem.stage})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2">
                      <Label htmlFor="curriculum">Curriculum/Lesson</Label>
                      <Select
                        value={formData.curriculum_id}
                        onValueChange={(value) => setFormData({ ...formData, curriculum_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select curriculum (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {curricula.map((curriculum) => (
                            <SelectItem key={curriculum.id} value={curriculum.id}>
                              {curriculum.title} ({curriculum.stage})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2">
                      <Label htmlFor="teaching_date">Teaching Date *</Label>
                      <Input
                        id="teaching_date"
                        type="date"
                        value={formData.teaching_date}
                        onChange={(e) => setFormData({ ...formData, teaching_date: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="start_time">Start Time</Label>
                      <Input
                        id="start_time"
                        type="time"
                        value={formData.start_time}
                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="end_time">End Time</Label>
                      <Input
                        id="end_time"
                        type="time"
                        value={formData.end_time}
                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      />
                    </div>

                    <div className="col-span-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="e.g., Room 101, Online, etc."
                      />
                    </div>

                    <div className="col-span-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                          <SelectItem value="rescheduled">Rescheduled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Input
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Optional notes about this assignment"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create Assignment</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Curriculum</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell className="font-medium">
                    {new Date(assignment.teaching_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-sm">
                    {assignment.start_time && assignment.end_time
                      ? `${assignment.start_time.slice(0, 5)} - ${assignment.end_time.slice(0, 5)}`
                      : '-'}
                  </TableCell>
                  <TableCell>{getTeacherName(assignment.teacher_id)}</TableCell>
                  <TableCell>{getClassName(assignment.class_id)}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {getCurriculumTitle(assignment.curriculum_id)}
                  </TableCell>
                  <TableCell>{assignment.location || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(assignment.status)}>
                      {assignment.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate text-sm text-muted-foreground">
                    {assignment.notes || '-'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(assignment.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
