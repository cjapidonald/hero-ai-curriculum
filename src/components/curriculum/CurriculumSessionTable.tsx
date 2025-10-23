import { ReactNode } from 'react';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Calendar, Clock, BookOpen, Eye, Pencil, Play } from 'lucide-react';
import {
  formatStageLabel,
  getPlanStatusConfig,
  getTeachingStatusConfig,
} from '@/lib/curriculum/status-utils';

export type CurriculumSessionStatus =
  | 'scheduled'
  | 'building'
  | 'ready'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface CurriculumSessionRow {
  id: string;
  lesson_title?: string | null;
  lesson_subject?: string | null;
  session_date: string;
  start_time: string;
  end_time: string;
  status: CurriculumSessionStatus;
  lesson_plan_completed: boolean;
  class_stage?: string | null;
  class_level?: string | null;
  class_name?: string | null;
  location?: string | null;
  teacher_name?: string | null;
  class_teacher?: string | null;
  isCurriculumOnly?: boolean;
}

interface CurriculumSessionTableProps<T extends CurriculumSessionRow> {
  sessions: T[];
  loading?: boolean;
  emptyState?: ReactNode;
  showTeacherColumn?: boolean;
  canStartLesson?: (session: T) => boolean;
  canBuildLesson?: (session: T) => boolean;
  onBuildLesson?: (session: T) => void;
  onViewLesson?: (session: T) => void;
  onStartLesson?: (session: T) => void;
}

const CurriculumSessionTable = <T extends CurriculumSessionRow>({
  sessions,
  loading = false,
  emptyState,
  showTeacherColumn = true,
  canStartLesson,
  canBuildLesson,
  onBuildLesson,
  onViewLesson,
  onStartLesson,
}: CurriculumSessionTableProps<T>) => {
  const renderEmptyState = () => {
    if (loading) {
      return (
        <TableRow>
          <TableCell colSpan={showTeacherColumn ? 8 : 7} className="text-center text-muted-foreground">
            Loading sessions...
          </TableCell>
        </TableRow>
      );
    }

    return (
      <TableRow>
        <TableCell colSpan={showTeacherColumn ? 8 : 7} className="text-center text-muted-foreground">
          {emptyState || 'No sessions found'}
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Lesson</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead>Class</TableHead>
            {showTeacherColumn && <TableHead>Teacher</TableHead>}
            <TableHead>Lesson Status</TableHead>
            <TableHead>Teaching Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.length === 0
            ? renderEmptyState()
            : sessions.map((session) => {
                const stageLabel =
                  formatStageLabel(session.class_stage) || session.class_level || 'Stage TBD';
                const subjectLabel = session.lesson_subject || 'General English';
                const teacherLabel =
                  session.teacher_name || session.class_teacher || 'Assigned Teacher';
                const startLabel = session.status === 'in_progress' ? 'Resume Lesson' : 'Start Lesson';
                const planStatus = getPlanStatusConfig(
                  session.lesson_plan_completed,
                  session.status,
                );
                const teachingStatus = getTeachingStatusConfig(session.status);
                const showBuildButton =
                  !!onBuildLesson && (!canBuildLesson || canBuildLesson(session));
                const showStartButton =
                  !!onStartLesson && (!canStartLesson || canStartLesson(session));

                return (
                  <TableRow key={session.id}>
                    <TableCell>
                      <div className="font-medium">{session.lesson_title || 'No lesson assigned'}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <BookOpen className="w-3 h-3" />
                        {subjectLabel}
                      </div>
                      {session.isCurriculumOnly && (
                        <Badge variant="outline" className="mt-2">
                          Curriculum Lesson
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {format(parseISO(session.session_date), 'EEE, MMM d')}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {session.start_time} - {session.end_time}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {stageLabel ? (
                        <Badge variant="secondary">{stageLabel}</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">Stage TBD</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{session.class_name || 'Unassigned class'}</div>
                      <div className="text-sm text-muted-foreground">
                        {session.location || 'Classroom TBD'}
                      </div>
                    </TableCell>
                    {showTeacherColumn && (
                      <TableCell>
                        <div className="font-medium">{teacherLabel}</div>
                        <div className="text-sm text-muted-foreground">Lead Instructor</div>
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge variant={planStatus.variant}>{planStatus.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={teachingStatus.variant}>{teachingStatus.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {showBuildButton && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onBuildLesson?.(session)}
                          >
                            <Pencil className="w-4 h-4 mr-1" />
                            Lesson Builder
                          </Button>
                        )}
                        {session.lesson_plan_completed && onViewLesson && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onViewLesson(session)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Plan
                          </Button>
                        )}
                        {showStartButton && (
                          <Button size="sm" onClick={() => onStartLesson?.(session)}>
                            <Play className="w-4 h-4 mr-1" />
                            {startLabel}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
        </TableBody>
      </Table>
    </div>
  );
};

export default CurriculumSessionTable;
