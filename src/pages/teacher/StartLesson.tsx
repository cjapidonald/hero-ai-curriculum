import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Minus,
  MessageSquare,
  Users,
  Timer,
  Shuffle,
  LayoutGrid,
  CheckSquare,
  Loader2,
  ChevronDown,
  Award,
} from 'lucide-react';
import { format } from 'date-fns';
import SeatingPlan from '@/components/teacher/SeatingPlan';

interface Student {
  id: string;
  name: string;
  surname: string;
  profile_image_url?: string;
}

interface BehaviorData {
  student_id: string;
  points: number;
  badges: string[];
  comments: string[];
}

interface SessionData {
  id: string;
  lesson_plan_id: string;
  teacher_id: string;
  class_id: string;
  curriculum_id: string;
  scheduled_date: string;
  started_at?: string;
  status: 'scheduled' | 'in_progress' | 'concluded' | 'cancelled';
  attendance_data: Record<string, boolean>;
}

export default function StartLesson() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [session, setSession] = useState<SessionData | null>(null);
  const [behaviorData, setBehaviorData] = useState<Record<string, BehaviorData>>({});
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [commentText, setCommentText] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [showLessonPlan, setShowLessonPlan] = useState(false);
  const [showSeatingPlan, setShowSeatingPlan] = useState(false);

  useEffect(() => {
    fetchLessonData();
  }, [lessonId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setTimerRunning(false);
            toast({
              title: 'Timer Complete!',
              description: 'The countdown timer has finished.',
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds]);

  const fetchLessonData = async () => {
    try {
      setLoading(true);

      // Fetch lesson session
      const { data: sessionData, error: sessionError } = await supabase
        .from('lesson_sessions')
        .select('*')
        .eq('id', lessonId)
        .single();

      if (sessionError) throw sessionError;

      // Check if lesson can be started (must be scheduled date)
      const scheduledDate = new Date(sessionData.scheduled_date);
      const today = new Date();
      scheduledDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      if (scheduledDate.getTime() !== today.getTime() && sessionData.status === 'scheduled') {
        toast({
          title: 'Cannot Start Lesson',
          description: `This lesson is scheduled for ${format(scheduledDate, 'PPP')}. You can only start it on the scheduled date.`,
          variant: 'destructive',
        });
        navigate('/teacher?tab=curriculum');
        return;
      }

      setSession(sessionData);
      setAttendance(sessionData.attendance_data || {});

      // Fetch students in the class
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .eq('class_id', sessionData.class_id)
        .eq('is_active', true)
        .order('surname, name');

      if (studentsError) throw studentsError;

      setStudents(studentsData || []);

      // Initialize behavior data for each student
      const initialBehavior: Record<string, BehaviorData> = {};
      (studentsData || []).forEach((student) => {
        initialBehavior[student.id] = {
          student_id: student.id,
          points: 0,
          badges: [],
          comments: [],
        };
      });
      setBehaviorData(initialBehavior);

      // Fetch existing behavior points if session already started
      if (sessionData.status === 'in_progress') {
        const { data: behaviorPoints } = await supabase
          .from('student_behavior_points')
          .select('*')
          .eq('session_id', sessionData.id);

        if (behaviorPoints) {
          const existingBehavior: Record<string, BehaviorData> = {};
          behaviorPoints.forEach((point) => {
            existingBehavior[point.student_id] = {
              student_id: point.student_id,
              points: point.points || 0,
              badges: (point.badges as string[]) || [],
              comments: (point.comments as string[]) || [],
            };
          });
          setBehaviorData(existingBehavior);
        }
      }

      // Start session if it's scheduled
      if (sessionData.status === 'scheduled') {
        await startSession(sessionData.id);
      }
    } catch (error: any) {
      console.error('Error fetching lesson data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load lesson data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const startSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('lesson_sessions')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        title: 'Lesson Started',
        description: 'The lesson session is now in progress!',
      });
    } catch (error: any) {
      console.error('Error starting session:', error);
    }
  };

  const updatePoints = async (studentId: string, change: number) => {
    const newPoints = Math.max(0, (behaviorData[studentId]?.points || 0) + change);

    setBehaviorData((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        points: newPoints,
      },
    }));

    // Save to database
    try {
      await supabase
        .from('student_behavior_points')
        .upsert({
          session_id: session?.id,
          student_id: studentId,
          points: newPoints,
          badges: behaviorData[studentId]?.badges || [],
          comments: behaviorData[studentId]?.comments || [],
        });
    } catch (error) {
      console.error('Error updating points:', error);
    }
  };

  const addBadge = async (studentId: string, badge: 'silver' | 'bronze' | 'gold') => {
    const currentBadges = behaviorData[studentId]?.badges || [];

    // Toggle badge
    const newBadges = currentBadges.includes(badge)
      ? currentBadges.filter((b) => b !== badge)
      : [...currentBadges, badge];

    setBehaviorData((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        badges: newBadges,
      },
    }));

    // Save to database
    try {
      await supabase
        .from('student_behavior_points')
        .upsert({
          session_id: session?.id,
          student_id: studentId,
          points: behaviorData[studentId]?.points || 0,
          badges: newBadges,
          comments: behaviorData[studentId]?.comments || [],
        });
    } catch (error) {
      console.error('Error updating badges:', error);
    }
  };

  const openCommentDialog = (student: Student) => {
    setSelectedStudent(student);
    setCommentText('');
    setCommentDialogOpen(true);
  };

  const saveComment = async () => {
    if (!selectedStudent || !commentText.trim()) return;

    const currentComments = behaviorData[selectedStudent.id]?.comments || [];
    const newComments = [...currentComments, commentText.trim()];

    setBehaviorData((prev) => ({
      ...prev,
      [selectedStudent.id]: {
        ...prev[selectedStudent.id],
        comments: newComments,
      },
    }));

    // Save to database
    try {
      await supabase
        .from('student_behavior_points')
        .upsert({
          session_id: session?.id,
          student_id: selectedStudent.id,
          points: behaviorData[selectedStudent.id]?.points || 0,
          badges: behaviorData[selectedStudent.id]?.badges || [],
          comments: newComments,
        });

      toast({
        title: 'Comment Added',
        description: `Comment saved for ${selectedStudent.name}`,
      });
    } catch (error) {
      console.error('Error saving comment:', error);
    }

    setCommentDialogOpen(false);
    setCommentText('');
  };

  const toggleAttendance = (studentId: string) => {
    const newAttendance = {
      ...attendance,
      [studentId]: !attendance[studentId],
    };
    setAttendance(newAttendance);

    // Save to database
    if (session) {
      supabase
        .from('lesson_sessions')
        .update({ attendance_data: newAttendance })
        .eq('id', session.id)
        .then(() => {});
    }
  };

  const selectAllAttendance = () => {
    const allPresent: Record<string, boolean> = {};
    students.forEach((s) => {
      allPresent[s.id] = true;
    });
    setAttendance(allPresent);

    if (session) {
      supabase
        .from('lesson_sessions')
        .update({ attendance_data: allPresent })
        .eq('id', session.id)
        .then(() => {});
    }
  };

  const randomizeStudent = () => {
    const presentStudents = students.filter((s) => attendance[s.id]);
    if (presentStudents.length === 0) {
      toast({
        title: 'No Students Present',
        description: 'Mark students as present first',
        variant: 'destructive',
      });
      return;
    }

    const randomStudent = presentStudents[Math.floor(Math.random() * presentStudents.length)];
    toast({
      title: 'Random Student Selected',
      description: `${randomStudent.name} ${randomStudent.surname}`,
    });
  };

  const startTimer = (minutes: number) => {
    setTimerSeconds(minutes * 60);
    setTimerRunning(true);
  };

  const concludeLesson = async () => {
    if (!session) return;

    try {
      await supabase
        .from('lesson_sessions')
        .update({
          status: 'concluded',
          concluded_at: new Date().toISOString(),
        })
        .eq('id', session.id);

      toast({
        title: 'Lesson Concluded',
        description: 'The lesson has been successfully concluded!',
      });

      navigate('/teacher?tab=curriculum');
    } catch (error) {
      console.error('Error concluding lesson:', error);
      toast({
        title: 'Error',
        description: 'Failed to conclude lesson',
        variant: 'destructive',
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getBadgeIcon = (badge: string) => {
    const colors = {
      gold: 'text-yellow-500',
      silver: 'text-gray-400',
      bronze: 'text-orange-600',
    };
    return <Award className={`h-5 w-5 ${colors[badge as keyof typeof colors] || ''}`} />;
  };

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
              <div>
                <CardTitle className="text-2xl">Lesson in Progress</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {session && format(new Date(session.scheduled_date), 'PPP')}
                </p>
              </div>
              <Button variant="destructive" onClick={concludeLesson}>
                Conclude Lesson
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Bottom Functions Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              {/* Attendance */}
              <Button onClick={selectAllAttendance} variant="outline" className="gap-2">
                <CheckSquare className="h-4 w-4" />
                Select All Present
              </Button>

              {/* Timer */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => startTimer(5)}
                  variant="outline"
                  size="sm"
                  disabled={timerRunning}
                >
                  5 min
                </Button>
                <Button
                  onClick={() => startTimer(10)}
                  variant="outline"
                  size="sm"
                  disabled={timerRunning}
                >
                  10 min
                </Button>
                {timerSeconds > 0 && (
                  <Badge variant="default" className="text-lg px-4 py-2">
                    <Timer className="h-4 w-4 mr-2" />
                    {formatTime(timerSeconds)}
                  </Badge>
                )}
                {timerRunning && (
                  <Button onClick={() => setTimerRunning(false)} variant="ghost" size="sm">
                    Pause
                  </Button>
                )}
              </div>

              {/* Randomizer */}
              <Button onClick={randomizeStudent} variant="outline" className="gap-2">
                <Shuffle className="h-4 w-4" />
                Random Student
              </Button>

              {/* Seating Plan */}
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setShowSeatingPlan(true)}
              >
                <LayoutGrid className="h-4 w-4" />
                Seating Plan
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Student Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {students.map((student) => {
            const behavior = behaviorData[student.id] || {
              points: 0,
              badges: [],
              comments: [],
            };
            const isPresent = attendance[student.id];

            return (
              <Card
                key={student.id}
                className={`relative ${!isPresent ? 'opacity-50' : ''}`}
              >
                {/* Badges at Top */}
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    onClick={() => addBadge(student.id, 'gold')}
                    className={behavior.badges.includes('gold') ? '' : 'opacity-30'}
                  >
                    {getBadgeIcon('gold')}
                  </button>
                  <button
                    onClick={() => addBadge(student.id, 'silver')}
                    className={behavior.badges.includes('silver') ? '' : 'opacity-30'}
                  >
                    {getBadgeIcon('silver')}
                  </button>
                  <button
                    onClick={() => addBadge(student.id, 'bronze')}
                    className={behavior.badges.includes('bronze') ? '' : 'opacity-30'}
                  >
                    {getBadgeIcon('bronze')}
                  </button>
                </div>

                <CardContent className="pt-6">
                  {/* Student Name and Attendance */}
                  <div className="text-center mb-4">
                    <button
                      onClick={() => toggleAttendance(student.id)}
                      className="w-full"
                    >
                      <h3 className="font-semibold text-lg">
                        {student.name} {student.surname}
                      </h3>
                      <Badge variant={isPresent ? 'default' : 'outline'} className="mt-1">
                        {isPresent ? 'Present' : 'Absent'}
                      </Badge>
                    </button>
                  </div>

                  {/* Points Display */}
                  <div className="text-center mb-4">
                    <div className="text-4xl font-bold">{behavior.points}</div>
                    <div className="text-sm text-muted-foreground">points</div>
                  </div>

                  {/* Point Controls */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => updatePoints(student.id, -1)}
                      disabled={!isPresent || behavior.points === 0}
                      className="flex-1"
                    >
                      <Minus className="h-5 w-5" />
                    </Button>
                    <Button
                      size="lg"
                      onClick={() => updatePoints(student.id, 1)}
                      disabled={!isPresent}
                      className="flex-1"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Add Comment */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openCommentDialog(student)}
                    disabled={!isPresent}
                    className="w-full gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Add Comment {behavior.comments.length > 0 && `(${behavior.comments.length})`}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Show Lesson Plan */}
        <Card>
          <CardHeader>
            <Button
              variant="ghost"
              onClick={() => setShowLessonPlan(!showLessonPlan)}
              className="w-full justify-between"
            >
              <span className="text-lg font-semibold">Lesson Plan Details</span>
              <ChevronDown
                className={`h-5 w-5 transition-transform ${showLessonPlan ? 'rotate-180' : ''}`}
              />
            </Button>
          </CardHeader>
          {showLessonPlan && (
            <CardContent>
              <p className="text-muted-foreground">
                Lesson plan details will be displayed here...
              </p>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Comment Dialog */}
      <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Add Comment for {selectedStudent?.name} {selectedStudent?.surname}
            </DialogTitle>
            <DialogDescription>
              Record observations, behavior notes, or achievements.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter your comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCommentDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveComment}>Save Comment</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Seating Plan Dialog */}
      <Dialog open={showSeatingPlan} onOpenChange={setShowSeatingPlan}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Classroom Seating Plan</DialogTitle>
            <DialogDescription>
              Arrange students with 4 different geometries: All Students, Groups, Pairs, or Groups of 3
            </DialogDescription>
          </DialogHeader>
          {session && (
            <SeatingPlan
              students={students}
              sessionId={session.id}
              attendance={attendance}
              onClose={() => setShowSeatingPlan(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
