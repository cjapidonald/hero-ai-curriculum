import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Calendar as CalendarIcon,
  ExternalLink,
} from 'lucide-react';
import { format } from 'date-fns';

interface Student {
  id: string;
  name: string;
  surname: string;
}

interface Homework {
  id: string;
  title: string;
  description?: string;
  file_url?: string;
  resource_url?: string;
}

interface SessionData {
  id: string;
  curriculum_id: string;
  lesson_plan_id?: string;
  class_id: string;
  teacher_id?: string;
}

export default function HomeworkManager() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [homeworkItems, setHomeworkItems] = useState<Homework[]>([]);
  const [session, setSession] = useState<SessionData | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<Record<string, boolean>>({});
  const [assigned, setAssigned] = useState<Set<string>>(new Set());
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    fetchData();
  }, [lessonId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch session
      const { data: sessionData, error: sessionError } = await supabase
        .from('lesson_sessions')
        .select('*')
        .eq('id', lessonId)
        .single();

      if (sessionError) throw sessionError;
      setSession(sessionData);

      // Fetch students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .eq('class_id', sessionData.class_id)
        .eq('is_active', true)
        .order('surname, name');

      if (studentsError) throw studentsError;
      setStudents(studentsData || []);

      // Fetch homework from lesson plan
      const homeworkList: Homework[] = [];

      if (sessionData.lesson_plan_id) {
        const { data: planData } = await supabase
          .from('lesson_plans')
          .select('homework_resources')
          .eq('id', sessionData.lesson_plan_id)
          .single();

        if (planData?.homework_resources && Array.isArray(planData.homework_resources)) {
          homeworkList.push(...planData.homework_resources.map((h: any) => ({
            id: h.id || crypto.randomUUID(),
            title: h.title || 'Untitled Homework',
            description: h.description,
            file_url: h.file_url || h.url,
            resource_url: h.resource_url,
          })));
        }
      }

      // Fallback: Fetch from curriculum homework
      if (homeworkList.length === 0 && sessionData.curriculum_id) {
        const { data: currData } = await supabase
          .from('curriculum')
          .select('hw1_name, hw1_url, hw2_name, hw2_url, hw3_name, hw3_url, hw4_name, hw4_url, hw5_name, hw5_url, hw6_name, hw6_url')
          .eq('id', sessionData.curriculum_id)
          .single();

        if (currData) {
          for (let i = 1; i <= 6; i++) {
            const nameKey = `hw${i}_name` as keyof typeof currData;
            const urlKey = `hw${i}_url` as keyof typeof currData;

            if (currData[nameKey]) {
              homeworkList.push({
                id: `curr-hw${i}`,
                title: currData[nameKey] as string,
                file_url: (currData[urlKey] as string) || undefined,
              });
            }
          }
        }
      }

      setHomeworkItems(homeworkList);

      // Fetch assigned homework
      const { data: assignedData } = await supabase
        .from('homework_assignments_new')
        .select('*')
        .eq('lesson_session_id', sessionData.id);

      if (assignedData) {
        const assignedSet = new Set<string>();
        assignedData.forEach((a) => {
          if (a.homework_resource && typeof a.homework_resource === 'object') {
            const res = a.homework_resource as any;
            assignedSet.add(res.id || res.title);
          }
        });
        setAssigned(assignedSet);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load homework',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudents((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
  };

  const selectAll = () => {
    const allSelected: Record<string, boolean> = {};
    students.forEach((s) => {
      allSelected[s.id] = true;
    });
    setSelectedStudents(allSelected);
  };

  const deselectAll = () => {
    setSelectedStudents({});
  };

  const assignHomework = async (homework: Homework) => {
    if (!session) return;

    const selectedIds = Object.keys(selectedStudents).filter((id) => selectedStudents[id]);

    if (selectedIds.length === 0) {
      toast({
        title: 'No Students Selected',
        description: 'Please select students to assign to',
        variant: 'destructive',
      });
      return;
    }

    try {
      const assignments = selectedIds.map((studentId) => ({
        lesson_plan_id: session.lesson_plan_id || null,
        lesson_session_id: session.id,
        student_id: studentId,
        homework_resource: {
          id: homework.id,
          title: homework.title,
          description: homework.description,
          file_url: homework.file_url,
        },
        assigned_at: new Date().toISOString(),
        due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : null,
        status: 'assigned',
      }));

      const { error } = await supabase
        .from('homework_assignments_new')
        .insert(assignments);

      if (error) throw error;

      setAssigned((prev) => new Set([...prev, homework.id]));

      toast({
        title: 'Homework Assigned',
        description: `${homework.title} assigned to ${selectedIds.length} student(s)`,
      });

      deselectAll();
    } catch (error: any) {
      console.error('Error assigning homework:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign homework',
        variant: 'destructive',
      });
    }
  };

  const openHomework = (homework: Homework) => {
    const url = homework.file_url || homework.resource_url;
    if (url) {
      window.open(url, '_blank');
    } else {
      toast({
        title: 'No URL',
        description: 'This homework does not have a link',
        variant: 'destructive',
      });
    }
  };

  const selectedCount = Object.values(selectedStudents).filter(Boolean).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/teacher?tab=curriculum')}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <CardTitle className="text-2xl">Homework Manager</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Assign homework to students with due dates
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right text-sm">
                  <div className="font-semibold">{homeworkItems.length} Homework Items</div>
                  <div className="text-muted-foreground">{students.length} Students</div>
                </div>
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Due Date Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Assignment Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Label>Due Date (Optional):</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    {dueDate ? format(dueDate, 'PPP') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {dueDate && (
                <Button variant="ghost" size="sm" onClick={() => setDueDate(undefined)}>
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Student Selection */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Select Students</CardTitle>
                <Badge>{selectedCount} selected</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex gap-2 mb-4">
                <Button size="sm" variant="outline" onClick={selectAll} className="flex-1">
                  Select All
                </Button>
                <Button size="sm" variant="outline" onClick={deselectAll} className="flex-1">
                  Clear
                </Button>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center space-x-2 p-2 rounded hover:bg-muted cursor-pointer"
                    onClick={() => toggleStudent(student.id)}
                  >
                    <Checkbox
                      checked={selectedStudents[student.id] || false}
                      onCheckedChange={() => toggleStudent(student.id)}
                    />
                    <label className="flex-1 cursor-pointer text-sm">
                      {student.name} {student.surname}
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Homework List */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Homework Items</CardTitle>
            </CardHeader>
            <CardContent>
              {homeworkItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No homework available for this lesson</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {homeworkItems.map((homework) => {
                    const isAssigned = assigned.has(homework.id);

                    return (
                      <Card key={homework.id} className={isAssigned ? 'border-green-500/50' : ''}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{homework.title}</h3>
                                {isAssigned && (
                                  <Badge variant="outline" className="text-xs gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Assigned
                                  </Badge>
                                )}
                              </div>
                              {homework.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {homework.description}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              {(homework.file_url || homework.resource_url) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openHomework(homework)}
                                  className="gap-2"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                  View
                                </Button>
                              )}
                              <Button
                                onClick={() => assignHomework(homework)}
                                size="sm"
                                disabled={selectedCount === 0}
                                className="gap-2"
                              >
                                <BookOpen className="h-4 w-4" />
                                Assign
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
