import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Eye, Download, Search, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface CurriculumLesson {
  id: string;
  teacher_name: string | null;
  class: string | null;
  school: string | null;
  subject: string | null;
  lesson_title: string;
  lesson_date: string | null;
  lesson_skills: string | null;
  success_criteria: string | null;
  curriculum_stage: string | null;
  created_at: string;
  // All activity fields
  [key: string]: any;
}

export const FullCurriculumView = () => {
  const { toast } = useToast();
  const [lessons, setLessons] = useState<CurriculumLesson[]>([]);
  const [filteredLessons, setFilteredLessons] = useState<CurriculumLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<CurriculumLesson | null>(null);
  const [classes, setClasses] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterLessons();
  }, [searchTerm, classFilter, stageFilter, lessons]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('curriculum')
        .select('*')
        .order('lesson_date', { ascending: false });

      if (error) throw error;

      setLessons((data || []) as unknown as CurriculumLesson[]);

      // Extract unique classes
      const uniqueClasses = Array.from(new Set(data?.map(l => (l as any).class).filter(Boolean))) as string[];
      setClasses(uniqueClasses);
    } catch (error) {
      console.error('Error fetching curriculum:', error);
      toast({
        title: 'Error',
        description: 'Failed to load curriculum',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterLessons = () => {
    let filtered = [...lessons];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (lesson) =>
          lesson.lesson_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lesson.teacher_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lesson.class?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Class filter
    if (classFilter !== 'all') {
      filtered = filtered.filter((lesson) => lesson.class === classFilter);
    }

    // Stage filter
    if (stageFilter !== 'all') {
      filtered = filtered.filter((lesson) => lesson.curriculum_stage === stageFilter);
    }

    setFilteredLessons(filtered);
  };

  const getActivityCount = (lesson: CurriculumLesson, prefix: string) => {
    let count = 0;
    let i = 1;
    while (lesson[`${prefix}${i}_name`]) {
      count++;
      i++;
    }
    return count;
  };

  const getAllActivities = (lesson: CurriculumLesson) => {
    const activities = {
      warmup: [] as any[],
      main: [] as any[],
      assessment: [] as any[],
      homework: [] as any[],
      printables: [] as any[],
    };

    // Warmup activities
    for (let i = 1; i <= 4; i++) {
      if (lesson[`wp${i}_name`]) {
        activities.warmup.push({
          name: lesson[`wp${i}_name`],
          type: lesson[`wp${i}_type`],
          url: lesson[`wp${i}_url`],
        });
      }
    }

    // Main activities
    for (let i = 1; i <= 5; i++) {
      if (lesson[`ma${i}_name`]) {
        activities.main.push({
          name: lesson[`ma${i}_name`],
          type: lesson[`ma${i}_type`],
          url: lesson[`ma${i}_url`],
        });
      }
    }

    // Assessment activities
    for (let i = 1; i <= 4; i++) {
      if (lesson[`a${i}_name`]) {
        activities.assessment.push({
          name: lesson[`a${i}_name`],
          type: lesson[`a${i}_type`],
          url: lesson[`a${i}_url`],
        });
      }
    }

    // Homework
    for (let i = 1; i <= 6; i++) {
      if (lesson[`hw${i}_name`]) {
        activities.homework.push({
          name: lesson[`hw${i}_name`],
          type: lesson[`hw${i}_type`],
          url: lesson[`hw${i}_url`],
        });
      }
    }

    // Printables
    for (let i = 1; i <= 4; i++) {
      if (lesson[`p${i}_name`]) {
        activities.printables.push({
          name: lesson[`p${i}_name`],
          type: lesson[`p${i}_type`],
          url: lesson[`p${i}_url`],
        });
      }
    }

    return activities;
  };

  const handleExportCSV = () => {
    const csvData = filteredLessons.map((lesson) => ({
      Title: lesson.lesson_title,
      Teacher: lesson.teacher_name || '',
      Class: lesson.class || '',
      Date: lesson.lesson_date || '',
      Stage: lesson.curriculum_stage || '',
      Skills: lesson.lesson_skills || '',
      Warmups: getActivityCount(lesson, 'wp'),
      MainActivities: getActivityCount(lesson, 'ma'),
      Assessments: getActivityCount(lesson, 'a'),
      Homework: getActivityCount(lesson, 'hw'),
      Printables: getActivityCount(lesson, 'p'),
    }));

    const headers = Object.keys(csvData[0] || {});
    const csv = [
      headers.join(','),
      ...csvData.map((row) =>
        headers.map((header) => JSON.stringify(row[header as keyof typeof row] || '')).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `curriculum_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    toast({
      title: 'Success',
      description: 'Curriculum exported to CSV',
    });
  };

  if (loading) {
    return <div className="text-center py-8">Loading curriculum...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Full Curriculum View</h2>
          <p className="text-sm text-muted-foreground">
            View all lesson plans with complete activity details
          </p>
        </div>
        <Button onClick={handleExportCSV}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search lessons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classes.map((cls) => (
              <SelectItem key={cls} value={cls}>
                {cls}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Stages" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {['Stage 1', 'Stage 2', 'Stage 3', 'Stage 4', 'Stage 5', 'Stage 6'].map((stage) => (
              <SelectItem key={stage} value={stage}>
                {stage}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Lesson Title</TableHead>
              <TableHead>Teacher</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Skills</TableHead>
              <TableHead>Warmup</TableHead>
              <TableHead>Main</TableHead>
              <TableHead>Assessment</TableHead>
              <TableHead>Homework</TableHead>
              <TableHead>Print</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLessons.map((lesson) => (
              <TableRow key={lesson.id}>
                <TableCell className="whitespace-nowrap">
                  {lesson.lesson_date ? new Date(lesson.lesson_date).toLocaleDateString() : '-'}
                </TableCell>
                <TableCell className="font-medium max-w-xs truncate">
                  {lesson.lesson_title}
                </TableCell>
                <TableCell>{lesson.teacher_name || '-'}</TableCell>
                <TableCell>
                  {lesson.class ? <Badge variant="outline">{lesson.class}</Badge> : '-'}
                </TableCell>
                <TableCell>
                  {lesson.curriculum_stage ? <Badge variant="secondary">{lesson.curriculum_stage}</Badge> : '-'}
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {lesson.lesson_skills || '-'}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{getActivityCount(lesson, 'wp')}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{getActivityCount(lesson, 'ma')}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{getActivityCount(lesson, 'a')}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{getActivityCount(lesson, 'hw')}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{getActivityCount(lesson, 'p')}</Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedLesson(lesson);
                      setViewDialogOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedLesson?.lesson_title}</DialogTitle>
          </DialogHeader>
          {selectedLesson && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Teacher:</Label>
                  <p>{selectedLesson.teacher_name || '-'}</p>
                </div>
                <div>
                  <Label className="font-semibold">Class:</Label>
                  <p>{selectedLesson.class || '-'}</p>
                </div>
                <div>
                  <Label className="font-semibold">Date:</Label>
                  <p>{selectedLesson.lesson_date ? new Date(selectedLesson.lesson_date).toLocaleDateString() : '-'}</p>
                </div>
                <div>
                  <Label className="font-semibold">Stage:</Label>
                  <p>{selectedLesson.curriculum_stage || '-'}</p>
                </div>
                <div className="col-span-2">
                  <Label className="font-semibold">Skills:</Label>
                  <p>{selectedLesson.lesson_skills || '-'}</p>
                </div>
                <div className="col-span-2">
                  <Label className="font-semibold">Success Criteria:</Label>
                  <p>{selectedLesson.success_criteria || '-'}</p>
                </div>
              </div>

              {Object.entries(getAllActivities(selectedLesson)).map(([type, activities]) => {
                if (activities.length === 0) return null;

                return (
                  <div key={type} className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2 capitalize">
                      {type === 'main' ? 'Main Activities' : type === 'printables' ? 'Printables' : type}
                    </h4>
                    <div className="space-y-2">
                      {activities.map((activity, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded">
                          <div>
                            <p className="font-medium">{activity.name}</p>
                            <p className="text-sm text-muted-foreground">{activity.type}</p>
                          </div>
                          {activity.url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(activity.url, '_blank')}
                            >
                              View
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

function Label({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <label className={`text-sm font-medium ${className}`}>{children}</label>;
}
