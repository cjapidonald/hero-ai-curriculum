import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { CheckCircle2, Circle, ExternalLink, FileText, Link as LinkIcon, Image as ImageIcon, FileIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface HomeworkListProps {
  studentId: string;
}

interface HomeworkMaterial {
  type: string;
  url: string;
  name: string;
}

interface HomeworkItem {
  id: string;
  curriculum_id: string;
  lesson_title: string;
  lesson_date: string;
  teacher_name: string;
  homework_items: HomeworkMaterial[];
  completed_items: string[];
}

export default function HomeworkList({ studentId }: HomeworkListProps) {
  const [homework, setHomework] = useState<HomeworkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchHomework = async () => {
      try {
        setLoading(true);

        // Fetch curriculum with homework
        const { data: curriculumData, error: curriculumError } = await supabase
          .from('curriculum')
          .select('*')
          .order('lesson_date', { ascending: false })
          .limit(10);

        if (curriculumError) throw curriculumError;

        // Fetch homework completion status
        const { data: completionData, error: completionError } = await supabase
          .from('homework_completion')
          .select('*')
          .eq('student_id', studentId);

        if (completionError) throw completionError;

        // Process homework data
        const processedHomework: HomeworkItem[] = [];

        curriculumData?.forEach((lesson) => {
          const homeworkItems: HomeworkMaterial[] = [];

          // Extract homework materials (hw1-hw6)
          for (let i = 1; i <= 6; i++) {
            const hwKey = `hw${i}` as keyof typeof lesson;
            const hwData = lesson[hwKey];

            if (hwData && typeof hwData === 'object' && hwData.name) {
              homeworkItems.push({
                type: hwData.type || 'file',
                url: hwData.url || '',
                name: hwData.name || `Homework ${i}`,
              });
            }
          }

          if (homeworkItems.length > 0) {
            // Get completed items for this lesson
            const completedItems = completionData
              ?.filter((c) => c.curriculum_id === lesson.id && c.completed)
              .map((c) => c.homework_item) || [];

            processedHomework.push({
              id: lesson.id,
              curriculum_id: lesson.id,
              lesson_title: lesson.lesson_title,
              lesson_date: lesson.lesson_date,
              teacher_name: lesson.teacher_name,
              homework_items: homeworkItems,
              completed_items: completedItems,
            });
          }
        });

        setHomework(processedHomework);
      } catch (error) {
        console.error('Error fetching homework:', error);
        toast({
          title: 'Error',
          description: 'Failed to load homework',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      fetchHomework();
    }
  }, [studentId, toast]);

  const toggleHomeworkCompletion = async (
    curriculumId: string,
    homeworkItem: string,
    isCompleted: boolean
  ) => {
    try {
      if (isCompleted) {
        // Mark as incomplete (delete record)
        const { error } = await supabase
          .from('homework_completion')
          .delete()
          .eq('student_id', studentId)
          .eq('curriculum_id', curriculumId)
          .eq('homework_item', homeworkItem);

        if (error) throw error;
      } else {
        // Mark as complete (insert record)
        const { error } = await supabase
          .from('homework_completion')
          .insert({
            student_id: studentId,
            curriculum_id: curriculumId,
            homework_item: homeworkItem,
            completed: true,
            completed_date: new Date().toISOString(),
          });

        if (error) throw error;
      }

      // Refresh homework data
      await fetchHomework();

      toast({
        title: 'Success',
        description: isCompleted ? 'Homework marked as incomplete' : 'Homework marked as complete',
      });
    } catch (error) {
      console.error('Error updating homework completion:', error);
      toast({
        title: 'Error',
        description: 'Failed to update homework status',
        variant: 'destructive',
      });
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'link':
        return <LinkIcon className="h-4 w-4" />;
      case 'image':
        return <ImageIcon className="h-4 w-4" />;
      case 'pdf':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileIcon className="h-4 w-4" />;
    }
  };

  const getCompletionStats = (homework: HomeworkItem) => {
    const total = homework.homework_items.length;
    const completed = homework.completed_items.length;
    return { total, completed, percentage: total > 0 ? (completed / total) * 100 : 0 };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Separate incomplete and complete homework
  const incompleteHomework = homework.filter((hw) => {
    const stats = getCompletionStats(hw);
    return stats.completed < stats.total;
  });

  const completeHomework = homework.filter((hw) => {
    const stats = getCompletionStats(hw);
    return stats.completed === stats.total;
  });

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Homework Overview</CardTitle>
          <CardDescription>Track and complete your assignments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Assignments</p>
              <p className="text-3xl font-bold">{homework.length}</p>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">To Complete</p>
              <p className="text-3xl font-bold text-orange-600">{incompleteHomework.length}</p>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-3xl font-bold text-green-600">{completeHomework.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Incomplete Homework */}
      {incompleteHomework.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Homework To Complete</CardTitle>
            <CardDescription>Complete these assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {incompleteHomework.map((hw) => {
                const stats = getCompletionStats(hw);
                return (
                  <div
                    key={hw.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{hw.lesson_title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Assigned by {hw.teacher_name} •{' '}
                          {format(new Date(hw.lesson_date), 'MMMM dd, yyyy')}
                        </p>
                      </div>
                      <Badge variant={stats.percentage === 100 ? 'default' : 'secondary'}>
                        {stats.completed}/{stats.total} Complete
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      {hw.homework_items.map((item, index) => {
                        const itemKey = `hw${index + 1}`;
                        const isCompleted = hw.completed_items.includes(itemKey);

                        return (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-muted/30 rounded-md"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <Checkbox
                                checked={isCompleted}
                                onCheckedChange={() =>
                                  toggleHomeworkCompletion(hw.curriculum_id, itemKey, isCompleted)
                                }
                              />
                              <div className="flex items-center gap-2 flex-1">
                                {getIcon(item.type)}
                                <span className={isCompleted ? 'line-through text-muted-foreground' : ''}>
                                  {item.name}
                                </span>
                              </div>
                            </div>
                            {item.url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(item.url, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Homework */}
      {completeHomework.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Completed Homework</CardTitle>
            <CardDescription>Great job on finishing these assignments!</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completeHomework.map((hw) => (
                <div
                  key={hw.id}
                  className="border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 rounded-lg p-4"
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold">{hw.lesson_title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(hw.lesson_date), 'MMMM dd, yyyy')} • {hw.homework_items.length}{' '}
                        item{hw.homework_items.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {homework.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Circle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No homework assigned yet</p>
              <p className="text-sm mt-1">Check back later for new assignments</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
