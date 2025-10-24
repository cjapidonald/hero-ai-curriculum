import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import {
  BookOpen,
  Calendar,
  ClipboardList,
  FileText,
  Play,
  School,
  Settings,
  StickyNote,
  Users,
  TrendingUp,
  RefreshCw,
  Download,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface CurriculumDashboardProps {
  teacherId: string;
  teacherName: string;
  onOpenLessonBuilder?: () => void;
}

interface CurriculumLesson {
  assignmentId?: string | null;
  id: string;
  subject: string | null;
  stage: string | null;
  className: string | null;
  school: string | null;
  classId: string | null;
  lessonNumber: number | null;
  lessonTitle: string;
  lessonDate: string | null;
  status: string | null;
  teachingDate: string | null;
  skills: string[];
  quickNotes: string | null;
  updatedAt: string | null;
  homeworkMaterials: Material[];
  printableMaterials: Material[];
}

interface Material {
  id: string;
  label: string;
  url: string | null;
}

type ActionType =
  | 'build'
  | 'start'
  | 'evaluate'
  | 'printables'
  | 'homework'
  | 'quiz'
  | 'assignment'
  | 'quick-view';

interface ActiveAction {
  type: ActionType;
  lesson: CurriculumLesson;
}

interface Stats {
  totalLessons: number;
  scheduledLessons: number;
  inProgressLessons: number;
  completedLessons: number;
  upcomingThisWeek: number;
}

const STATUS_BADGE_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  scheduled: 'secondary',
  'in progress': 'default',
  completed: 'default',
  done: 'default',
  archived: 'outline',
};

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const buildMaterialsFromLesson = (lesson: Tables<'curriculum'>): {
  homeworkMaterials: Material[];
  printableMaterials: Material[];
} => {
  const homeworkMaterials: Material[] = [];
  const printableMaterials: Material[] = [];

  for (let index = 1; index <= 6; index += 1) {
    const nameKey = `hw${index}_name` as const;
    const urlKey = `hw${index}_url` as const;
    if (lesson[nameKey]) {
      homeworkMaterials.push({
        id: `${lesson.id}-hw-${index}`,
        label: lesson[nameKey] ?? `Homework ${index}`,
        url: lesson[urlKey],
      });
    }
  }

  for (let index = 1; index <= 4; index += 1) {
    const nameKey = `p${index}_name` as const;
    const urlKey = `p${index}_url` as const;
    if (lesson[nameKey]) {
      printableMaterials.push({
        id: `${lesson.id}-print-${index}`,
        label: lesson[nameKey] ?? `Printable ${index}`,
        url: lesson[urlKey],
      });
    }
  }

  return { homeworkMaterials, printableMaterials };
};

const CurriculumDashboard = ({ teacherId, teacherName, onOpenLessonBuilder }: CurriculumDashboardProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<CurriculumLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeAction, setActiveAction] = useState<ActiveAction | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { toast } = useToast();

  const [stats, setStats] = useState<Stats>({
    totalLessons: 0,
    scheduledLessons: 0,
    inProgressLessons: 0,
    completedLessons: 0,
    upcomingThisWeek: 0,
  });

  const loadLessons = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('teacher_assignments')
        .select(`
          id,
          curriculum_id,
          class_id,
          status,
          teaching_date,
          curriculum:curriculum_id (
            id,
            subject,
            stage,
            class,
            school,
            lesson_title,
            lesson_number,
            lesson_date,
            lesson_skills,
            updated_at,
            status,
            description,
            hw1_name, hw1_url,
            hw2_name, hw2_url,
            hw3_name, hw3_url,
            hw4_name, hw4_url,
            hw5_name, hw5_url,
            hw6_name, hw6_url,
            p1_name, p1_url,
            p2_name, p2_url,
            p3_name, p3_url,
            p4_name, p4_url
          ),
          classes:class_id (
            class_name,
            stage
          )
        `)
        .eq('teacher_id', teacherId)
        .order('teaching_date', { ascending: true });

      if (error) {
        throw error;
      }

      const mappedLessons: CurriculumLesson[] = (data || [])
        .filter((assignment): assignment is typeof assignment & { curriculum: Tables<'curriculum'> } => Boolean(assignment.curriculum))
        .map((assignment) => {
          const { curriculum, classes } = assignment;
          const skills = (curriculum.lesson_skills || '')
            .split(',')
            .map((skill) => skill.trim())
            .filter(Boolean);

          const { homeworkMaterials, printableMaterials } = buildMaterialsFromLesson(curriculum);

          return {
            assignmentId: assignment.id,
            id: curriculum.id,
            subject: curriculum.subject,
            stage: curriculum.stage ?? classes?.stage ?? null,
            className: classes?.class_name ?? curriculum.class ?? null,
            school: curriculum.school,
            classId: assignment.class_id,
            lessonNumber: curriculum.lesson_number,
            lessonTitle: curriculum.lesson_title,
            lessonDate: curriculum.lesson_date,
            status: assignment.status ?? curriculum.status ?? 'scheduled',
            teachingDate: assignment.teaching_date,
            skills,
            quickNotes: curriculum.description,
            updatedAt: curriculum.updated_at,
            homeworkMaterials,
            printableMaterials,
          };
        });

      setLessons(mappedLessons);

      // Calculate stats
      const now = new Date();
      const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const scheduled = mappedLessons.filter((l) => l.status?.toLowerCase() === 'scheduled').length;
      const inProgress = mappedLessons.filter((l) => l.status?.toLowerCase() === 'in progress').length;
      const completed = mappedLessons.filter((l) => l.status?.toLowerCase() === 'completed' || l.status?.toLowerCase() === 'done').length;
      const upcoming = mappedLessons.filter((l) => {
        if (!l.teachingDate) return false;
        const teachingDate = new Date(l.teachingDate);
        return teachingDate >= now && teachingDate <= oneWeekFromNow;
      }).length;

      setStats({
        totalLessons: mappedLessons.length,
        scheduledLessons: scheduled,
        inProgressLessons: inProgress,
        completedLessons: completed,
        upcomingThisWeek: upcoming,
      });

      setLastUpdated(new Date());
    } catch (lessonError) {
      console.error('Failed to load curriculum lessons', lessonError);
      toast({
        title: 'Unable to load curriculum',
        description:
          lessonError instanceof Error
            ? lessonError.message
            : 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [teacherId, toast]);

  useEffect(() => {
    loadLessons();
  }, [loadLessons]);

  // Get unique subjects and stages for filters
  const uniqueSubjects = useMemo(() => {
    const subjects = new Set(lessons.map((l) => l.subject).filter(Boolean));
    return Array.from(subjects);
  }, [lessons]);

  const uniqueStages = useMemo(() => {
    const stages = new Set(lessons.map((l) => l.stage).filter(Boolean));
    return Array.from(stages);
  }, [lessons]);

  const filteredLessons = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return lessons.filter((lesson) => {
      // Status filter
      const statusMatches =
        statusFilter === 'all' || (lesson.status ?? 'scheduled').toLowerCase() === statusFilter.toLowerCase();

      // Subject filter
      const subjectMatches = subjectFilter === 'all' || lesson.subject === subjectFilter;

      // Stage filter
      const stageMatches = stageFilter === 'all' || lesson.stage === stageFilter;

      // Search query
      const searchMatches = !query || [
        lesson.lessonTitle,
        lesson.subject,
        lesson.stage,
        lesson.className,
        lesson.skills.join(' '),
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query));

      return statusMatches && subjectMatches && stageMatches && searchMatches;
    });
  }, [lessons, searchQuery, statusFilter, subjectFilter, stageFilter]);

  // Chart data
  const subjectDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    lessons.forEach((lesson) => {
      const subject = lesson.subject || 'Other';
      distribution[subject] = (distribution[subject] || 0) + 1;
    });
    return Object.entries(distribution).map(([subject, count]) => ({
      name: subject,
      value: count,
    }));
  }, [lessons]);

  const statusDistribution = useMemo(() => {
    return [
      { name: 'Scheduled', value: stats.scheduledLessons },
      { name: 'In Progress', value: stats.inProgressLessons },
      { name: 'Completed', value: stats.completedLessons },
    ].filter((item) => item.value > 0);
  }, [stats]);

  const handleAction = (type: ActionType, lesson: CurriculumLesson) => {
    if (type === 'build') {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('curriculumId', lesson.id);
      if (lesson.assignmentId) {
        newParams.set('assignmentId', lesson.assignmentId);
      }
      newParams.set('tab', 'lessonBuilder');
      setSearchParams(newParams, { replace: false });
      onOpenLessonBuilder?.();
      return;
    }

    if (type === 'quick-view') {
      setActiveAction({ type, lesson });
      return;
    }

    setActiveAction({ type, lesson });
  };

  const handleExportCSV = () => {
    const csv = [
      ['Lesson Title', 'Subject', 'Stage', 'Class', 'Status', 'Teaching Date', 'Skills'].join(','),
      ...filteredLessons.map((lesson) =>
        [
          lesson.lessonTitle,
          lesson.subject || '',
          lesson.stage || '',
          lesson.className || '',
          lesson.status || '',
          lesson.teachingDate || '',
          lesson.skills.join('; '),
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `curriculum-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Export successful',
      description: `${filteredLessons.length} lessons exported to CSV`,
    });
  };

  const renderStatusBadge = (status: string | null) => {
    const normalizedStatus = (status ?? 'scheduled').toLowerCase();
    const variant = STATUS_BADGE_VARIANT[normalizedStatus] ?? 'default';

    return (
      <Badge
        variant={variant}
        className={cn(
          'uppercase tracking-wide text-xs',
          normalizedStatus === 'done' || normalizedStatus === 'completed' ? 'bg-emerald-600/90 text-white' : ''
        )}
      >
        {status ?? 'Scheduled'}
      </Badge>
    );
  };

  const renderActionDialog = () => {
    if (!activeAction || activeAction.type === 'build') {
      return null;
    }

    const { lesson, type } = activeAction;

    const titleMap: Record<ActionType, string> = {
      'quick-view': 'Curriculum Quick View',
      start: 'Start Lesson Experience',
      evaluate: 'Evaluate Learners',
      printables: 'Lesson Printables',
      homework: 'Homework Planner',
      quiz: 'Create Quiz',
      assignment: 'Create Assignment',
      build: 'Build Lesson',
    };

    return (
      <Dialog open onOpenChange={(open) => (open ? null : setActiveAction(null))}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl">{titleMap[type]}</DialogTitle>
            <DialogDescription>{lesson.lessonTitle}</DialogDescription>
          </DialogHeader>

          {type === 'quick-view' && (
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Subject</p>
                    <p className="text-muted-foreground">{lesson.subject || '—'}</p>
                  </div>
                  <div>
                    <p className="font-medium">Class / Stage</p>
                    <p className="text-muted-foreground">
                      {lesson.className || '—'}
                      {lesson.stage ? ` • ${lesson.stage}` : ''}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Teaching Date</p>
                    <p className="text-muted-foreground">
                      {lesson.teachingDate ? format(new Date(lesson.teachingDate), 'PPP') : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Status</p>
                    <div className="mt-1">{renderStatusBadge(lesson.status)}</div>
                  </div>
                </div>

                <div>
                  <p className="font-medium mb-2">Skills</p>
                  {lesson.skills.length ? (
                    <div className="flex flex-wrap gap-2">
                      {lesson.skills.map((skill) => (
                        <Badge key={skill} variant="outline">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No skills linked yet.</p>
                  )}
                </div>

                {lesson.quickNotes && (
                  <div>
                    <p className="font-medium mb-2">Notes</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {lesson.quickNotes}
                    </p>
                  </div>
                )}

                <div>
                  <p className="font-medium mb-2">Materials</p>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium">Homework ({lesson.homeworkMaterials.length})</p>
                      {lesson.homeworkMaterials.length > 0 ? (
                        <ul className="text-sm text-muted-foreground">
                          {lesson.homeworkMaterials.map((m) => (
                            <li key={m.id}>• {m.label}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">No homework</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">Printables ({lesson.printableMaterials.length})</p>
                      {lesson.printableMaterials.length > 0 ? (
                        <ul className="text-sm text-muted-foreground">
                          {lesson.printableMaterials.map((m) => (
                            <li key={m.id}>• {m.label}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">No printables</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">Curriculum Dashboard</h2>
          <p className="text-muted-foreground">
            {teacherName}, manage your curriculum, track progress, and plan lessons.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadLessons} disabled={loading}>
            <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={lessons.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Lessons</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLessons}</div>
            <p className="text-xs text-muted-foreground">All assigned curriculum</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.scheduledLessons}</div>
            <p className="text-xs text-muted-foreground">Ready to teach</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgressLessons}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedLessons}</div>
            <p className="text-xs text-muted-foreground">Finished lessons</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingThisWeek}</div>
            <p className="text-xs text-muted-foreground">Upcoming lessons</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {lessons.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Subject Distribution</CardTitle>
              <CardDescription>Lessons by subject</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={subjectDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => entry.name}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {subjectDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status Overview</CardTitle>
              <CardDescription>Lessons by status</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={statusDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <Input
          placeholder="Search lessons, classes, or skills..."
          className="w-64"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="in progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>

        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All subjects</SelectItem>
            {uniqueSubjects.map((subject) => (
              <SelectItem key={subject} value={subject!}>
                {subject}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages</SelectItem>
            {uniqueStages.map((stage) => (
              <SelectItem key={stage} value={stage!}>
                {stage}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {lastUpdated && (
          <div className="ml-auto text-xs text-muted-foreground">
            Last updated: {format(lastUpdated, 'PPp')}
          </div>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Curriculum Lessons ({filteredLessons.length})</CardTitle>
          <CardDescription>Your assigned curriculum and lesson plans</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[220px]">Lesson</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Teaching Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Skills</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading curriculum lessons…
                  </TableCell>
                </TableRow>
              ) : filteredLessons.length ? (
                filteredLessons.map((lesson) => (
                  <TableRow key={`${lesson.id}-${lesson.assignmentId ?? 'unassigned'}`} className="hover:bg-muted/40">
                    <TableCell>
                      <div className="font-medium">{lesson.lessonTitle}</div>
                      <p className="text-xs text-muted-foreground">Lesson {lesson.lessonNumber ?? '—'}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        {lesson.subject || '—'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" /> {lesson.className || 'Unassigned'}
                        </span>
                        <span className="flex items-center gap-1">
                          <School className="h-3 w-3" /> {lesson.stage || '—'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {lesson.teachingDate ? format(new Date(lesson.teachingDate), 'PP') : '—'}
                    </TableCell>
                    <TableCell>{renderStatusBadge(lesson.status)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {lesson.skills.slice(0, 2).map((skill) => (
                          <Badge key={skill} variant="outline" className="text-[11px]">
                            {skill}
                          </Badge>
                        ))}
                        {lesson.skills.length > 2 && (
                          <Badge variant="outline" className="text-[11px]">
                            +{lesson.skills.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleAction('quick-view', lesson)}>
                          Quick view
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              Manage
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Lesson actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => handleAction('build', lesson)}>
                              Build Lesson
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleAction('start', lesson)}>
                              Start Lesson
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleAction('evaluate', lesson)}>
                              Evaluate
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <FileText className="h-12 w-12" />
                      <div>
                        <p className="font-medium">No curriculum lessons found</p>
                        <p className="text-sm">Your assigned curriculum will appear here once added</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {renderActionDialog()}
    </div>
  );
};

export default CurriculumDashboard;
