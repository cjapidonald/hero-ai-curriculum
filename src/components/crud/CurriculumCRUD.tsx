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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  onEditLesson?: (lessonId: string) => void;
}

interface Activity {
  name: string;
  type: string;
  url: string;
}

const activityPrefixes = {
  warmups: 'wp',
  main_activities: 'ma',
  assessments: 'a',
  homework: 'hw',
  printables: 'p',
};

const activityLimits = { warmups: 4, main_activities: 5, assessments: 4, homework: 6, printables: 4 };

const parseActivities = (lesson: Partial<Curriculum>, prefix: string, count: number): Activity[] => {
  const activities: Activity[] = [];
  for (let i = 1; i <= count; i++) {
    if (lesson[`${prefix}${i}_name`]) {
      activities.push({
        name: lesson[`${prefix}${i}_name`] || '',
        type: lesson[`${prefix}${i}_type`] || '',
        url: lesson[`${prefix}${i}_url`] || '',
      });
    }
  }
  return activities;
};

const flattenActivities = (activities: Activity[], prefix: string, limit: number) => {
  const flat: { [key: string]: any } = {};
  for (let i = 0; i < limit; i++) {
    const activity = activities[i];
    flat[`${prefix}${i + 1}_name`] = activity?.name || null;
    flat[`${prefix}${i + 1}_type`] = activity?.type || null;
    flat[`${prefix}${i + 1}_url`] = activity?.url || null;
  }
  return flat;
};

export function CurriculumCRUD({ teacherId, showActions = true, onEditLesson }: CurriculumCRUDProps) {
  const { user, isAdmin, isTeacher } = useAuth();
  const filters = teacherId ? [{ column: 'teacher_id', value: teacherId }] : undefined;
  const { data: lessons, loading, create, update, remove } = useCurriculum(filters);
  const { toast } = useToast();

  const [editingLesson, setEditingLesson] = useState<Curriculum | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Curriculum> & {
    warmups?: Activity[];
    main_activities?: Activity[];
    assessments?: Activity[];
    homework?: Activity[];
    printables?: Activity[];
  }>({});

  const canEdit = isAdmin || (isTeacher && (!teacherId || teacherId === user?.id));
  const canDelete = isAdmin || (isTeacher && (!teacherId || teacherId === user?.id));

  const handleOpenDialog = (lesson?: Curriculum) => {
    if (lesson) {
      if (onEditLesson) {
        onEditLesson(lesson.id);
        return;
      }
      setEditingLesson(lesson);
      setFormData({
        ...lesson,
        warmups: parseActivities(lesson, 'wp', activityLimits.warmups),
        main_activities: parseActivities(lesson, 'ma', activityLimits.main_activities),
        assessments: parseActivities(lesson, 'a', activityLimits.assessments),
        homework: parseActivities(lesson, 'hw', activityLimits.homework),
        printables: parseActivities(lesson, 'p', activityLimits.printables),
      });
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
        warmups: [],
        main_activities: [],
        assessments: [],
        homework: [],
        printables: [],
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { warmups, main_activities, assessments, homework, printables, ...restOfData } = formData;

    const payload = {
      ...restOfData,
      ...flattenActivities(warmups || [], 'wp', activityLimits.warmups),
      ...flattenActivities(main_activities || [], 'ma', activityLimits.main_activities),
      ...flattenActivities(assessments || [], 'a', activityLimits.assessments),
      ...flattenActivities(homework || [], 'hw', activityLimits.homework),
      ...flattenActivities(printables || [], 'p', activityLimits.printables),
    };

    if (editingLesson) {
      const { error } = await update(editingLesson.id, payload);
      if (!error) {
        setIsDialogOpen(false);
        toast({
          title: 'Success',
          description: 'Lesson updated successfully',
        });
      }
    } else {
      const { error } = await create(payload as any);
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
                  <h3 className="font-semibold mb-3">Resources</h3>
                  {Object.entries(activityPrefixes).map(([type, prefix]) => {
                    const activities = formData[type as keyof typeof formData] as Activity[] || [];
                    const limit = activityLimits[type as keyof typeof activityLimits];

                    const handleActivityChange = (index: number, field: keyof Activity, value: string) => {
                      const newActivities = [...activities];
                      newActivities[index] = { ...newActivities[index], [field]: value };
                      setFormData({ ...formData, [type]: newActivities });
                    };

                    const addActivity = () => {
                      if (activities.length < limit) {
                        setFormData({ ...formData, [type]: [...activities, { name: '', type: '', url: '' }] });
                      }
                    };

                    const removeActivity = (index: number) => {
                      const newActivities = activities.filter((_, i) => i !== index);
                      setFormData({ ...formData, [type]: newActivities });
                    };

                    return (
                      <div key={type} className="space-y-3 border-b pb-4 mb-4">
                        <h4 className="font-medium capitalize">{type.replace('_', ' ')}</h4>
                        {activities.map((activity, index) => (
                          <div key={index} className="grid grid-cols-10 gap-2 items-center">
                            <Input
                              className="col-span-4"
                              value={activity.name}
                              onChange={(e) => handleActivityChange(index, 'name', e.target.value)}
                              placeholder="Activity Name"
                            />
                            <Select
                              value={activity.type}
                              onValueChange={(value) => handleActivityChange(index, 'type', value)}
                            >
                              <SelectTrigger className="col-span-2">
                                <SelectValue placeholder="Type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="file">File</SelectItem>
                                <SelectItem value="link">Link</SelectItem>
                                <SelectItem value="image">Image</SelectItem>
                                <SelectItem value="pdf">PDF</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              className="col-span-3"
                              value={activity.url}
                              onChange={(e) => handleActivityChange(index, 'url', e.target.value)}
                              placeholder="URL"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeActivity(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        {activities.length < limit && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addActivity}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add {type.replace('_', ' ').slice(0, -1)}
                          </Button>
                        )}
                      </div>
                    );
                  })}
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
