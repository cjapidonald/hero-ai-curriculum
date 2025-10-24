import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  ArrowLeft,
  Download,
  Printer,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';

interface Student {
  id: string;
  name: string;
  surname: string;
}

interface Printable {
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
}

export default function PrintablesManager() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [printables, setPrintables] = useState<Printable[]>([]);
  const [session, setSession] = useState<SessionData | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<Record<string, boolean>>({});
  const [distributed, setDistributed] = useState<Set<string>>(new Set());

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

      // Fetch printables from lesson plan
      const printablesList: Printable[] = [];

      if (sessionData.lesson_plan_id) {
        const { data: planData } = await supabase
          .from('lesson_plans')
          .select('print_resources')
          .eq('id', sessionData.lesson_plan_id)
          .single();

        if (planData?.print_resources && Array.isArray(planData.print_resources)) {
          printablesList.push(...planData.print_resources.map((p: any) => ({
            id: p.id || crypto.randomUUID(),
            title: p.title || 'Untitled Printable',
            description: p.description,
            file_url: p.file_url || p.url,
            resource_url: p.resource_url,
          })));
        }
      }

      // Fallback: Fetch from curriculum printables
      if (printablesList.length === 0 && sessionData.curriculum_id) {
        const { data: currData } = await supabase
          .from('curriculum')
          .select('p1_name, p1_url, p2_name, p2_url, p3_name, p3_url, p4_name, p4_url')
          .eq('id', sessionData.curriculum_id)
          .single();

        if (currData) {
          for (let i = 1; i <= 4; i++) {
            const nameKey = `p${i}_name` as keyof typeof currData;
            const urlKey = `p${i}_url` as keyof typeof currData;

            if (currData[nameKey]) {
              printablesList.push({
                id: `curr-p${i}`,
                title: currData[nameKey] as string,
                file_url: (currData[urlKey] as string) || undefined,
              });
            }
          }
        }
      }

      setPrintables(printablesList);

      // Fetch distributed printables
      const { data: distData } = await supabase
        .from('printables_distributed')
        .select('*')
        .eq('lesson_session_id', sessionData.id);

      if (distData) {
        const distSet = new Set<string>();
        distData.forEach((d) => {
          if (d.printable_resource && typeof d.printable_resource === 'object') {
            const res = d.printable_resource as any;
            distSet.add(res.id || res.title);
          }
        });
        setDistributed(distSet);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load printables',
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

  const distributePrintable = async (printable: Printable) => {
    if (!session) return;

    const selectedIds = Object.keys(selectedStudents).filter((id) => selectedStudents[id]);

    if (selectedIds.length === 0) {
      toast({
        title: 'No Students Selected',
        description: 'Please select students to distribute to',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase.from('printables_distributed').insert({
        lesson_session_id: session.id,
        teacher_id: session.teacher_id || '',
        printable_resource: {
          id: printable.id,
          title: printable.title,
          description: printable.description,
          file_url: printable.file_url,
        },
        student_ids: selectedIds,
        distributed_at: new Date().toISOString(),
      });

      if (error) throw error;

      setDistributed((prev) => new Set([...prev, printable.id]));

      toast({
        title: 'Printable Distributed',
        description: `${printable.title} distributed to ${selectedIds.length} student(s)`,
      });

      deselectAll();
    } catch (error: any) {
      console.error('Error distributing printable:', error);
      toast({
        title: 'Error',
        description: 'Failed to distribute printable',
        variant: 'destructive',
      });
    }
  };

  const downloadPrintable = (printable: Printable) => {
    const url = printable.file_url || printable.resource_url;
    if (url) {
      window.open(url, '_blank');
    } else {
      toast({
        title: 'No URL',
        description: 'This printable does not have a download link',
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
                  <CardTitle className="text-2xl">Printables Manager</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Distribute printable materials to students
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right text-sm">
                  <div className="font-semibold">{printables.length} Printables</div>
                  <div className="text-muted-foreground">{students.length} Students</div>
                </div>
                <Printer className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
          </CardHeader>
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

          {/* Printables List */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Available Printables</CardTitle>
            </CardHeader>
            <CardContent>
              {printables.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No printables available for this lesson</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {printables.map((printable) => {
                    const isDistributed = distributed.has(printable.id);

                    return (
                      <Card key={printable.id} className={isDistributed ? 'border-green-500/50' : ''}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{printable.title}</h3>
                                {isDistributed && (
                                  <Badge variant="outline" className="text-xs gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Distributed
                                  </Badge>
                                )}
                              </div>
                              {printable.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {printable.description}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              {(printable.file_url || printable.resource_url) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => downloadPrintable(printable)}
                                  className="gap-2"
                                >
                                  <Download className="h-4 w-4" />
                                  Download
                                </Button>
                              )}
                              <Button
                                onClick={() => distributePrintable(printable)}
                                size="sm"
                                disabled={selectedCount === 0}
                                className="gap-2"
                              >
                                <Printer className="h-4 w-4" />
                                Distribute
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
