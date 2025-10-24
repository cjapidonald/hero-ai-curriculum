import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Save,
  CheckCircle2,
  ArrowLeft,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { format } from 'date-fns';

interface Student {
  id: string;
  name: string;
  surname: string;
  profile_image_url?: string;
}

interface Skill {
  skill_name: string;
  skill_description?: string;
}

interface Evaluation {
  student_id: string;
  skill_name: string;
  evaluation_type: 'text' | 'slider';
  evaluation_value: string;
  slider_value?: number;
  milestone_number: number;
}

interface SessionData {
  id: string;
  curriculum_id: string;
  lesson_plan_id?: string;
}

export default function EvaluateSkills() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [session, setSession] = useState<SessionData | null>(null);
  const [evaluations, setEvaluations] = useState<Record<string, Evaluation>>({});
  const [savedEvaluations, setSavedEvaluations] = useState<Set<string>>(new Set());
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);

  useEffect(() => {
    fetchData();
  }, [lessonId]);

  useEffect(() => {
    if (students.length > 0 && !activeStudent) {
      setActiveStudent(students[0]);
    }
  }, [students]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch session data
      const { data: sessionData, error: sessionError } = await supabase
        .from('lesson_sessions')
        .select('id, curriculum_id, lesson_plan_id, class_id')
        .eq('id', lessonId)
        .single();

      if (sessionError) throw sessionError;
      setSession(sessionData);

      // Fetch students in the class
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .eq('class_id', sessionData.class_id)
        .eq('is_active', true)
        .order('surname, name');

      if (studentsError) throw studentsError;
      setStudents(studentsData || []);

      // Fetch skills from curriculum or lesson plan
      let skillsList: Skill[] = [];

      // Try from lesson plan first
      if (sessionData.lesson_plan_id) {
        const { data: planData } = await supabase
          .from('lesson_plans')
          .select('skills')
          .eq('id', sessionData.lesson_plan_id)
          .single();

        if (planData?.skills && Array.isArray(planData.skills)) {
          skillsList = planData.skills.map((s: any) => ({
            skill_name: typeof s === 'string' ? s : s.skill_name || '',
            skill_description: typeof s === 'object' ? s.skill_description : undefined,
          }));
        }
      }

      // Fallback to curriculum skills
      if (skillsList.length === 0 && sessionData.curriculum_id) {
        const { data: currData } = await supabase
          .from('curriculum')
          .select('lesson_skills')
          .eq('id', sessionData.curriculum_id)
          .single();

        if (currData?.lesson_skills) {
          const skillNames = currData.lesson_skills.split(',').map((s: string) => s.trim());
          skillsList = skillNames.map((name: string) => ({
            skill_name: name,
          }));
        }
      }

      setSkills(skillsList.filter((s) => s.skill_name));

      // Fetch existing evaluations
      const { data: existingEvals } = await supabase
        .from('skill_evaluations_new')
        .select('*')
        .eq('session_id', sessionData.id);

      if (existingEvals) {
        const evals: Record<string, Evaluation> = {};
        const saved = new Set<string>();

        existingEvals.forEach((ev) => {
          const key = `${ev.student_id}-${ev.skill_name}`;
          evals[key] = {
            student_id: ev.student_id,
            skill_name: ev.skill_name,
            evaluation_type: ev.evaluation_type as 'text' | 'slider',
            evaluation_value: ev.evaluation_value || '',
            slider_value: ev.slider_value || undefined,
            milestone_number: ev.milestone_number,
          };
          saved.add(key);
        });

        setEvaluations(evals);
        setSavedEvaluations(saved);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load evaluation data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getEvaluationKey = (studentId: string, skillName: string) =>
    `${studentId}-${skillName}`;

  const getEvaluation = (studentId: string, skillName: string): Evaluation => {
    const key = getEvaluationKey(studentId, skillName);
    return (
      evaluations[key] || {
        student_id: studentId,
        skill_name: skillName,
        evaluation_type: 'slider',
        evaluation_value: '',
        slider_value: 50,
        milestone_number: 1,
      }
    );
  };

  const updateEvaluation = (studentId: string, skillName: string, updates: Partial<Evaluation>) => {
    const key = getEvaluationKey(studentId, skillName);
    const current = getEvaluation(studentId, skillName);

    setEvaluations((prev) => ({
      ...prev,
      [key]: { ...current, ...updates },
    }));

    // Remove from saved set since it's been modified
    setSavedEvaluations((prev) => {
      const newSet = new Set(prev);
      newSet.delete(key);
      return newSet;
    });
  };

  const saveEvaluation = async (studentId: string, skillName: string) => {
    if (!session) return;

    const evaluation = getEvaluation(studentId, skillName);

    // Validate
    if (
      evaluation.evaluation_type === 'text' &&
      !evaluation.evaluation_value.trim()
    ) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a text value',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase.from('skill_evaluations_new').upsert({
        session_id: session.id,
        student_id: studentId,
        skill_name: skillName,
        evaluation_type: evaluation.evaluation_type,
        evaluation_value: evaluation.evaluation_value,
        slider_value: evaluation.slider_value,
        milestone_number: evaluation.milestone_number,
        evaluated_at: new Date().toISOString(),
      });

      if (error) throw error;

      const key = getEvaluationKey(studentId, skillName);
      setSavedEvaluations((prev) => new Set([...prev, key]));

      toast({
        title: 'Evaluation Saved',
        description: `Milestone ${evaluation.milestone_number} recorded for ${skillName}`,
      });
    } catch (error: any) {
      console.error('Error saving evaluation:', error);
      toast({
        title: 'Error',
        description: 'Failed to save evaluation',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const saveAllForStudent = async (studentId: string) => {
    setSaving(true);
    let successCount = 0;

    for (const skill of skills) {
      try {
        const evaluation = getEvaluation(studentId, skill.skill_name);
        const key = getEvaluationKey(studentId, skill.skill_name);

        // Skip if already saved and not modified
        if (savedEvaluations.has(key)) continue;

        // Skip empty text evaluations
        if (
          evaluation.evaluation_type === 'text' &&
          !evaluation.evaluation_value.trim()
        ) {
          continue;
        }

        await supabase.from('skill_evaluations_new').upsert({
          session_id: session!.id,
          student_id: studentId,
          skill_name: skill.skill_name,
          evaluation_type: evaluation.evaluation_type,
          evaluation_value: evaluation.evaluation_value,
          slider_value: evaluation.slider_value,
          milestone_number: evaluation.milestone_number,
          evaluated_at: new Date().toISOString(),
        });

        setSavedEvaluations((prev) => new Set([...prev, key]));
        successCount++;
      } catch (error) {
        console.error('Error saving evaluation:', error);
      }
    }

    setSaving(false);

    toast({
      title: 'Evaluations Saved',
      description: `${successCount} evaluation(s) saved successfully`,
    });
  };

  const isSaved = (studentId: string, skillName: string) => {
    const key = getEvaluationKey(studentId, skillName);
    return savedEvaluations.has(key);
  };

  const getStudentCompletionCount = (studentId: string) => {
    return skills.filter((skill) =>
      savedEvaluations.has(getEvaluationKey(studentId, skill.skill_name))
    ).length;
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
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/teacher?tab=curriculum')}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <CardTitle className="text-2xl">Skills Evaluation</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Formative Assessment & Milestone Tracking
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right text-sm">
                  <div className="font-semibold">{students.length} Students</div>
                  <div className="text-muted-foreground">{skills.length} Skills</div>
                </div>
                <BarChart3 className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Student List (Left Panel) */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Students</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {students.map((student) => {
                const completionCount = getStudentCompletionCount(student.id);
                const isActive = activeStudent?.id === student.id;

                return (
                  <button
                    key={student.id}
                    onClick={() => setActiveStudent(student)}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    <div className="font-semibold text-sm">
                      {student.name} {student.surname}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <Badge variant={isActive ? 'secondary' : 'outline'} className="text-xs">
                        {completionCount}/{skills.length}
                      </Badge>
                      {completionCount === skills.length && (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Skills Evaluation (Right Panel) */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {activeStudent
                      ? `${activeStudent.name} ${activeStudent.surname}`
                      : 'Select a student'}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Evaluate skills and record milestones
                  </p>
                </div>
                {activeStudent && (
                  <Button
                    onClick={() => saveAllForStudent(activeStudent.id)}
                    disabled={saving}
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Save All
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {activeStudent ? (
                <div className="space-y-6">
                  {skills.map((skill) => {
                    const evaluation = getEvaluation(activeStudent.id, skill.skill_name);
                    const saved = isSaved(activeStudent.id, skill.skill_name);

                    return (
                      <Card key={skill.skill_name} className={saved ? 'border-green-500/50' : ''}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <CardTitle className="text-base">
                                  {skill.skill_name}
                                </CardTitle>
                                {saved && (
                                  <Badge variant="outline" className="text-xs gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Saved
                                  </Badge>
                                )}
                              </div>
                              {skill.skill_description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {skill.skill_description}
                                </p>
                              )}
                            </div>
                            <Tabs
                              value={evaluation.evaluation_type}
                              onValueChange={(v) =>
                                updateEvaluation(activeStudent.id, skill.skill_name, {
                                  evaluation_type: v as 'text' | 'slider',
                                })
                              }
                            >
                              <TabsList>
                                <TabsTrigger value="slider">Slider</TabsTrigger>
                                <TabsTrigger value="text">Text</TabsTrigger>
                              </TabsList>
                            </Tabs>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {evaluation.evaluation_type === 'slider' ? (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <Label>Performance Level</Label>
                                <Badge variant="secondary" className="text-lg px-4 py-1">
                                  {evaluation.slider_value}%
                                </Badge>
                              </div>
                              <Slider
                                value={[evaluation.slider_value || 50]}
                                onValueChange={(v) =>
                                  updateEvaluation(activeStudent.id, skill.skill_name, {
                                    slider_value: v[0],
                                    evaluation_value: v[0].toString(),
                                  })
                                }
                                min={0}
                                max={100}
                                step={5}
                                className="w-full"
                              />
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Beginning</span>
                                <span>Developing</span>
                                <span>Proficient</span>
                                <span>Mastery</span>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <Label>Evaluation Notes</Label>
                              <Input
                                placeholder="Enter evaluation, notes, or observations..."
                                value={evaluation.evaluation_value}
                                onChange={(e) =>
                                  updateEvaluation(activeStudent.id, skill.skill_name, {
                                    evaluation_value: e.target.value,
                                  })
                                }
                              />
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-3 border-t">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <TrendingUp className="h-4 w-4" />
                              <span>Milestone #{evaluation.milestone_number}</span>
                            </div>
                            <Button
                              onClick={() => saveEvaluation(activeStudent.id, skill.skill_name)}
                              disabled={saving || saved}
                              size="sm"
                              className="gap-2"
                            >
                              <Save className="h-4 w-4" />
                              {saved ? 'Saved' : 'Save'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a student from the left to begin evaluation</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
