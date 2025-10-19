import React, { useState } from 'react';
import { useCurriculum, Curriculum } from '@/hooks/useCurriculum';
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
import { Pencil, Trash2, Plus, Loader2, Calendar } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
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

interface CurriculumCRUDProps {
  teacherId?: string;
  showActions?: boolean;
}

export function CurriculumCRUD({ teacherId, showActions = true }: CurriculumCRUDProps) {
  const { user, isAdmin, isTeacher } = useAuth();
  const filters = teacherId ? [{ column: 'teacher_id', value: teacherId }] : undefined;
  const { data: lessons, loading, create, update, remove } = useCurriculum(filters);
  const { toast } = useToast();

  const [editingLesson, setEditingLesson] = useState<Curriculum | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Curriculum>>({});

  const canEdit = isAdmin || (isTeacher && (!teacherId || teacherId === user?.id));
  const canDelete = isAdmin || (isTeacher && (!teacherId || teacherId === user?.id));

  const handleOpenDialog = (lesson?: Curriculum) => {
    if (lesson) {
      setEditingLesson(lesson);
      setFormData(lesson);
    } else {
      setEditingLesson(null);
      setFormData({
        teacher_id: teacherId || user?.id || undefined,
        teacher_name: user?.name ? `${user.name} ${user.surname}` : '',
        subject: 'English',
        lesson_title: '',
        lesson_date: new Date().toISOString().split('T')[0],
        lesson_skills: '',
        success_criteria: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingLesson) {
      const { error } = await update(editingLesson.id, formData);
      if (!error) {
        setIsDialogOpen(false);
        toast({
          title: 'Success',
          description: 'Lesson updated successfully',
        });
      }
    } else {
      const { error } = await create(formData as any);
      if (!error) {
        setIsDialogOpen(false);
        toast({
          title: 'Success',
          description: 'Lesson created successfully',
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
          description: 'Lesson deleted successfully',
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
          <h2 className="text-2xl font-bold">Curriculum Lessons</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Lesson
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingLesson ? 'Edit Lesson' : 'Create New Lesson'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="lesson_title">Lesson Title *</Label>
                    <Input
                      id="lesson_title"
                      value={formData.lesson_title || ''}
                      onChange={(e) => setFormData({ ...formData, lesson_title: e.target.value })}
                      required
                      placeholder="e.g., Numbers 1-10, Colors and Shapes"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lesson_date">Lesson Date *</Label>
                    <Input
                      id="lesson_date"
                      type="date"
                      value={formData.lesson_date || ''}
                      onChange={(e) => setFormData({ ...formData, lesson_date: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={formData.subject || ''}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="e.g., English, Math"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="lesson_skills">Lesson Skills</Label>
                    <Input
                      id="lesson_skills"
                      value={formData.lesson_skills || ''}
                      onChange={(e) => setFormData({ ...formData, lesson_skills: e.target.value })}
                      placeholder="e.g., Speaking, Listening, Writing"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="success_criteria">Success Criteria</Label>
                    <Textarea
                      id="success_criteria"
                      value={formData.success_criteria || ''}
                      onChange={(e) => setFormData({ ...formData, success_criteria: e.target.value })}
                      placeholder="What should students be able to do after this lesson?"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Resources (Optional)</h3>
                  <div className="space-y-3">
                    {/* Warmup Activity 1 */}
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label htmlFor="wp1_name">Warmup 1 Name</Label>
                        <Input
                          id="wp1_name"
                          value={formData.wp1_name || ''}
                          onChange={(e) => setFormData({ ...formData, wp1_name: e.target.value })}
                          placeholder="Activity name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="wp1_type">Type</Label>
                        <select
                          id="wp1_type"
                          className="w-full border rounded-md p-2"
                          value={formData.wp1_type || ''}
                          onChange={(e) => setFormData({ ...formData, wp1_type: e.target.value })}
                        >
                          <option value="">Select...</option>
                          <option value="file">File</option>
                          <option value="link">Link</option>
                          <option value="image">Image</option>
                          <option value="pdf">PDF</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="wp1_url">URL</Label>
                        <Input
                          id="wp1_url"
                          value={formData.wp1_url || ''}
                          onChange={(e) => setFormData({ ...formData, wp1_url: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>
                    </div>

                    {/* Main Activity 1 */}
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label htmlFor="ma1_name">Main Activity 1 Name</Label>
                        <Input
                          id="ma1_name"
                          value={formData.ma1_name || ''}
                          onChange={(e) => setFormData({ ...formData, ma1_name: e.target.value })}
                          placeholder="Activity name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ma1_type">Type</Label>
                        <select
                          id="ma1_type"
                          className="w-full border rounded-md p-2"
                          value={formData.ma1_type || ''}
                          onChange={(e) => setFormData({ ...formData, ma1_type: e.target.value })}
                        >
                          <option value="">Select...</option>
                          <option value="file">File</option>
                          <option value="link">Link</option>
                          <option value="image">Image</option>
                          <option value="pdf">PDF</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="ma1_url">URL</Label>
                        <Input
                          id="ma1_url"
                          value={formData.ma1_url || ''}
                          onChange={(e) => setFormData({ ...formData, ma1_url: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>
                    </div>

                    {/* Homework 1 */}
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label htmlFor="hw1_name">Homework 1 Name</Label>
                        <Input
                          id="hw1_name"
                          value={formData.hw1_name || ''}
                          onChange={(e) => setFormData({ ...formData, hw1_name: e.target.value })}
                          placeholder="Homework name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="hw1_type">Type</Label>
                        <select
                          id="hw1_type"
                          className="w-full border rounded-md p-2"
                          value={formData.hw1_type || ''}
                          onChange={(e) => setFormData({ ...formData, hw1_type: e.target.value })}
                        >
                          <option value="">Select...</option>
                          <option value="file">File</option>
                          <option value="link">Link</option>
                          <option value="image">Image</option>
                          <option value="pdf">PDF</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="hw1_url">URL</Label>
                        <Input
                          id="hw1_url"
                          value={formData.hw1_url || ''}
                          onChange={(e) => setFormData({ ...formData, hw1_url: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Add more resources after creating the lesson
                  </p>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                    {editingLesson ? 'Update' : 'Create'}
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
              <TableHead>Date</TableHead>
              <TableHead>Lesson Title</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Skills</TableHead>
              <TableHead>Teacher</TableHead>
              {showActions && canEdit && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {lessons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No lessons found. Create your first lesson to get started.
                </TableCell>
              </TableRow>
            ) : (
              lessons.map((lesson) => (
                <TableRow key={lesson.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      {lesson.lesson_date || '-'}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{lesson.lesson_title}</TableCell>
                  <TableCell>{lesson.subject || '-'}</TableCell>
                  <TableCell className="max-w-xs truncate">{lesson.lesson_skills || '-'}</TableCell>
                  <TableCell>{lesson.teacher_name || '-'}</TableCell>
                  {showActions && canEdit && (
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(lesson)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(lesson.id)}
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
              This will permanently delete this lesson and all associated resources.
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
