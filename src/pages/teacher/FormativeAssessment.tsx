import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ClipboardCheck, Plus } from 'lucide-react';
import { useFormativeAssessment } from '@/hooks/useFormativeAssessment';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FormativeAssessmentProps {
  teacherId: string;
}

interface Student {
  id: string;
  name: string;
  surname: string;
}

interface Class {
  id: string;
  name: string;
}

const FormativeAssessment = ({ teacherId }: FormativeAssessmentProps) => {
  const { criteria, loading, fetchStudentEvaluations, createEvaluation } = useFormativeAssessment(teacherId);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [evaluationDate, setEvaluationDate] = useState(new Date().toISOString().split('T')[0]);
  const [evaluations, setEvaluations] = useState<Record<string, { score?: number; passed?: boolean; comments?: string }>>({});
  const { toast } = useToast();

  // Group criteria by category
  const groupedCriteria = criteria.reduce((acc, criterion) => {
    if (!acc[criterion.category]) {
      acc[criterion.category] = [];
    }
    acc[criterion.category].push(criterion);
    return acc;
  }, {} as Record<string, typeof criteria>);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudentsInClass(selectedClass);
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedStudent) {
      loadStudentEvaluations();
    }
  }, [selectedStudent]);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name')
        .eq('teacher_id', teacherId)
        .order('name');

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchStudentsInClass = async (classId: string) => {
    try {
      const { data, error } = await supabase
        .from('dashboard_students')
        .select('id, name, surname')
        .eq('class', (await supabase.from('classes').select('name').eq('id', classId).single()).data?.name || '')
        .order('name');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const loadStudentEvaluations = async () => {
    if (!selectedStudent) return;
    
    const evals = await fetchStudentEvaluations(selectedStudent);
    
    const evalMap: Record<string, { score?: number; passed?: boolean; comments?: string }> = {};
    evals.forEach(evaluation => {
      if (!evalMap[evaluation.criteria_id]) {
        evalMap[evaluation.criteria_id] = {
          score: evaluation.score || undefined,
          passed: evaluation.passed || undefined,
          comments: evaluation.comments || undefined,
        };
      }
    });
    
    setEvaluations(evalMap);
  };

  const handleEvaluationChange = (criteriaId: string, field: 'score' | 'passed' | 'comments', value: number | boolean | string) => {
    setEvaluations(prev => ({
      ...prev,
      [criteriaId]: {
        ...prev[criteriaId],
        [field]: value,
      },
    }));
  };

  const handleSubmitEvaluations = async () => {
    if (!selectedStudent || !selectedClass) {
      toast({
        title: 'Error',
        description: 'Please select a student and class',
        variant: 'destructive',
      });
      return;
    }

    try {
      const evaluationsToSubmit = Object.entries(evaluations)
        .filter(([_, eval]) => eval.score !== undefined || eval.passed !== undefined)
        .map(([criteriaId, eval]) => ({
          student_id: selectedStudent,
          criteria_id: criteriaId,
          teacher_id: teacherId,
          class_id: selectedClass,
          score: eval.score || null,
          max_score: 4,
          passed: eval.passed || null,
          comments: eval.comments || null,
          evaluation_date: evaluationDate,
        }));

      if (evaluationsToSubmit.length === 0) {
        toast({
          title: 'Error',
          description: 'Please evaluate at least one criterion',
          variant: 'destructive',
        });
        return;
      }

      for (const evaluation of evaluationsToSubmit) {
        await createEvaluation(evaluation);
      }

      toast({
        title: 'Success',
        description: `${evaluationsToSubmit.length} evaluations submitted successfully`,
      });

      setEvaluations({});
      setSelectedStudent('');
    } catch (error) {
      console.error('Error submitting evaluations:', error);
    }
  };

  const getScoreColor = (score: number | undefined) => {
    if (!score) return '';
    if (score >= 3.5) return 'text-green-600 font-bold';
    if (score >= 2.5) return 'text-blue-600 font-semibold';
    if (score >= 1.5) return 'text-yellow-600 font-semibold';
    return 'text-red-600 font-bold';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold mb-2">Formative Assessment</h2>
          <p className="text-muted-foreground">
            Evaluate student performance based on classroom observation criteria
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Student</CardTitle>
          <CardDescription>Choose a class and student to evaluate</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(cls => {
                    const className = cls.name ?? cls.class_name ?? 'Unnamed class';
                    return (
                      <SelectItem key={cls.id} value={cls.id}>
                        {className}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Student</Label>
              <Select 
                value={selectedStudent} 
                onValueChange={setSelectedStudent}
                disabled={!selectedClass}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map(student => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name} {student.surname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Evaluation Date</Label>
              <Input
                type="date"
                value={evaluationDate}
                onChange={(e) => setEvaluationDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedStudent && (
        <Card>
          <CardHeader>
            <CardTitle>Classroom Observation Form</CardTitle>
            <CardDescription>
              Evaluate student on all criteria (1=Below Standard, 2=Approaching, 3=Meeting, 4=Exceeding)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(groupedCriteria).map(([category, categoryCriteria]) => (
                <div key={category} className="space-y-3">
                  <h3 className="text-lg font-semibold border-b pb-2">{category}</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Code</TableHead>
                        <TableHead>Criteria</TableHead>
                        <TableHead className="w-24">Factor</TableHead>
                        <TableHead className="w-32">Score/Status</TableHead>
                        <TableHead className="w-48">Comments</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categoryCriteria.map(criterion => (
                        <TableRow key={criterion.id}>
                          <TableCell className="font-mono text-sm">{criterion.code}</TableCell>
                          <TableCell>{criterion.name}</TableCell>
                          <TableCell>
                            {criterion.factor ? (
                              <Badge variant="outline">{criterion.factor}</Badge>
                            ) : (
                              <Badge variant="secondary">Pass/Fail</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {criterion.is_pass_fail ? (
                              <Select
                                value={evaluations[criterion.id]?.passed?.toString() || ''}
                                onValueChange={(value) => handleEvaluationChange(criterion.id, 'passed', value === 'true')}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="true">Pass</SelectItem>
                                  <SelectItem value="false">Fail</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                type="number"
                                min="1"
                                max="4"
                                value={evaluations[criterion.id]?.score || ''}
                                onChange={(e) => handleEvaluationChange(criterion.id, 'score', Number(e.target.value))}
                                className={getScoreColor(evaluations[criterion.id]?.score)}
                                placeholder="1-4"
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <Input
                              value={evaluations[criterion.id]?.comments || ''}
                              onChange={(e) => handleEvaluationChange(criterion.id, 'comments', e.target.value)}
                              placeholder="Notes..."
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => {
                  setEvaluations({});
                  setSelectedStudent('');
                }}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitEvaluations}>
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  Submit Evaluation
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
};

export default FormativeAssessment;
