import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, CheckCircle2, XCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Student {
  id: string;
  name: string;
  surname: string;
  sessions_left: number;
  enrollment_id?: string | null;
  class_id?: string | null;
}

interface TakeAttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className: string;
  classId?: string;
  teacherId: string;
  students: Student[];
  onAttendanceSaved?: () => void;
}

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

interface StudentAttendance {
  studentId: string;
  status: AttendanceStatus;
}

const TakeAttendanceDialog = ({
  open,
  onOpenChange,
  className,
  classId,
  teacherId,
  students,
  onAttendanceSaved,
}: TakeAttendanceDialogProps) => {
  const [sessionDate, setSessionDate] = useState<Date>(new Date());
  const [attendance, setAttendance] = useState<Map<string, AttendanceStatus>>(new Map());
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendance((prev) => {
      const newAttendance = new Map(prev);
      newAttendance.set(studentId, status);
      return newAttendance;
    });
  };

  const markAllAs = (status: AttendanceStatus) => {
    const newAttendance = new Map<string, AttendanceStatus>();
    students.forEach((student) => {
      newAttendance.set(student.id, status);
    });
    setAttendance(newAttendance);
  };

  const handleSave = async () => {
    if (attendance.size === 0) {
      toast({
        title: 'No attendance marked',
        description: 'Please mark attendance for at least one student.',
        variant: 'destructive',
      });
      return;
    }

    let resolvedClassId = classId ?? null;

    const studentsNeedingClassId = students.filter((student) => !student.class_id);

    if (studentsNeedingClassId.length > 0) {
      if (!resolvedClassId && className) {
        const { data: classRow, error: classError } = await supabase
          .from('classes')
          .select('id')
          .eq('class_name', className)
          .maybeSingle();

        if (classError || !classRow?.id) {
          toast({
            title: 'Missing class information',
            description:
              'Unable to determine the class enrollment. Please contact an administrator.',
            variant: 'destructive',
          });
          return;
        }

        resolvedClassId = classRow.id;
      }

      if (!resolvedClassId) {
        toast({
          title: 'Missing class information',
          description:
            'Unable to determine the class enrollment. Please contact an administrator.',
          variant: 'destructive',
        });
        return;
      }
    }

    const normalizedStudents = students.map((student) =>
      !student.class_id && resolvedClassId ? { ...student, class_id: resolvedClassId } : student,
    );

    const unmarkedStudents = normalizedStudents.filter((student) => !attendance.has(student.id));
    if (unmarkedStudents.length > 0) {
      toast({
        title: 'Incomplete attendance',
        description: 'Please mark attendance for all students before saving.',
        variant: 'destructive',
      });
      return;
    }

    const studentsMissingEnrollment = normalizedStudents.filter(
      (student) => attendance.has(student.id) && !student.enrollment_id,
    );

    let studentsForSave: Student[] = normalizedStudents;

    if (studentsMissingEnrollment.length > 0) {
      const missingClassInfo = studentsMissingEnrollment.filter((student) => !student.class_id);

      if (missingClassInfo.length > 0) {
        toast({
          title: 'Missing enrollment records',
          description: `Unable to save attendance for ${missingClassInfo
            .map((student) => student.name)
            .join(', ')} because their class assignments are incomplete. Please contact an administrator.`,
          variant: 'destructive',
        });
        return;
      }

      try {
        const { data: newEnrollments, error: createEnrollmentError } = await supabase
          .from('enrollments')
          .upsert(
            studentsMissingEnrollment.map((student) => ({
              student_id: student.id,
              class_id: student.class_id!,
              is_active: true,
            })),
            { onConflict: 'student_id,class_id' },
          )
          .select('id, student_id, class_id');

        if (createEnrollmentError) {
          throw createEnrollmentError;
        }

        const enrollmentMap = new Map(
          (newEnrollments ?? []).map((enrollment) => [
            `${enrollment.student_id}-${enrollment.class_id}`,
            enrollment.id,
          ]),
        );

        studentsForSave = normalizedStudents.map((student) => {
          if (student.enrollment_id || !student.class_id) {
            return student;
          }
          const key = `${student.id}-${student.class_id}`;
          const enrollmentId = enrollmentMap.get(key);
          return enrollmentId ? { ...student, enrollment_id: enrollmentId } : student;
        });
      } catch (error) {
        console.error('Error ensuring enrollments before attendance save:', error);
        toast({
          title: 'Missing enrollment records',
          description: 'Unable to automatically create missing enrollments. Please contact an administrator.',
          variant: 'destructive',
        });
        return;
      }

      const stillMissing = studentsForSave.filter(
        (student) => attendance.has(student.id) && !student.enrollment_id,
      );

      if (stillMissing.length > 0) {
        toast({
          title: 'Missing enrollment records',
          description: `Unable to save attendance for ${stillMissing
            .map((student) => student.name)
            .join(', ')}. Please contact an administrator.`,
          variant: 'destructive',
        });
        return;
      }
    }

    setSaving(true);
    try {
      const classDate = format(sessionDate, 'yyyy-MM-dd');

      const enrollmentIds = Array.from(
        new Set(studentsForSave.map((student) => student.enrollment_id!).filter(Boolean)),
      );

      const existingAttendanceMap = new Map<string, boolean>();

      if (enrollmentIds.length > 0) {
        const { data: existingRecords, error: existingRecordsError } = await supabase
          .from('attendance' as any)
          .select('enrollment_id, present, late')
          .in('enrollment_id', enrollmentIds)
          .eq('class_date', classDate);

        if (existingRecordsError) {
          throw existingRecordsError;
        }

        (existingRecords ?? []).forEach((record) => {
          existingAttendanceMap.set(
            record.enrollment_id,
            Boolean(record.present) || Boolean(record.late),
          );
        });
      }

      const attendanceRecords = studentsForSave.map((student) => {
        const status = attendance.get(student.id)!;
        const present = status === 'present' || status === 'late';
        const late = status === 'late';

        let note: string | null = null;
        if (status === 'excused') {
          note = 'Excused absence';
        } else if (status === 'late') {
          note = 'Late arrival';
        } else if (status === 'absent') {
          note = 'Absent';
        }

        return {
          enrollment_id: student.enrollment_id!,
          class_date: classDate,
          present,
          late,
          notes: note,
          recorded_by: teacherId ?? null,
        };
      });

      const { error } = await supabase.from('attendance' as any).upsert(attendanceRecords, {
        onConflict: 'enrollment_id,class_date',
      });

      if (error) {
        throw error;
      }

      const sessionUpdates = studentsForSave
        .map((student) => {
          const status = attendance.get(student.id);
          const isCounted = status === 'present' || status === 'late';
          const wasCounted = existingAttendanceMap.get(student.enrollment_id!) ?? false;

          if (isCounted === wasCounted) {
            return null;
          }

          const currentSessions = student.sessions_left ?? 0;
          const delta = isCounted ? -1 : 1;
          const nextSessions = Math.max(0, currentSessions + delta);

          if (nextSessions === currentSessions) {
            return null;
          }

          return { id: student.id, nextSessions };
        })
        .filter((update): update is { id: string; nextSessions: number } => update !== null);

      if (sessionUpdates.length > 0) {
        await Promise.all(
          sessionUpdates.map((update) =>
            supabase
              .from('dashboard_students')
              .update({ sessions_left: update.nextSessions })
              .eq('id', update.id),
          ),
        );
      }

      toast({
        title: 'Attendance saved',
        description: `Attendance for ${studentsForSave.length} student(s) has been recorded for ${format(
          sessionDate,
          'PPP',
        )}.`,
      });

      // Reset and close
      setAttendance(new Map());
      onOpenChange(false);
      onAttendanceSaved?.();
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast({
        title: 'Error saving attendance',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusButton = (student: Student, status: AttendanceStatus) => {
    const isSelected = attendance.get(student.id) === status;
    const statusConfig = {
      present: {
        icon: CheckCircle2,
        label: 'Present',
        color: 'bg-green-500 hover:bg-green-600',
        selectedColor: 'bg-green-600 ring-2 ring-green-300',
      },
      absent: {
        icon: XCircle,
        label: 'Absent',
        color: 'bg-red-500 hover:bg-red-600',
        selectedColor: 'bg-red-600 ring-2 ring-red-300',
      },
      late: {
        icon: Clock,
        label: 'Late',
        color: 'bg-yellow-500 hover:bg-yellow-600',
        selectedColor: 'bg-yellow-600 ring-2 ring-yellow-300',
      },
      excused: {
        icon: AlertCircle,
        label: 'Excused',
        color: 'bg-blue-500 hover:bg-blue-600',
        selectedColor: 'bg-blue-600 ring-2 ring-blue-300',
      },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Button
        size="sm"
        variant="ghost"
        className={cn(
          'flex-1 text-white',
          isSelected ? config.selectedColor : config.color
        )}
        onClick={() => handleStatusChange(student.id, status)}
      >
        <Icon className="h-4 w-4 mr-1" />
        {config.label}
      </Button>
    );
  };

  const getAttendanceCount = () => {
    const counts = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      unmarked: students.length,
    };

    attendance.forEach((status) => {
      counts[status]++;
      counts.unmarked--;
    });

    return counts;
  };

  const counts = getAttendanceCount();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Take Attendance - {className}</DialogTitle>
          <DialogDescription>
            Mark attendance for {students.length} students
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Date Picker */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Session Date:</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-[240px] justify-start text-left font-normal',
                    !sessionDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {sessionDate ? format(sessionDate, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={sessionDate}
                  onSelect={(date) => date && setSessionDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => markAllAs('present')}>
              <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" />
              Mark All Present
            </Button>
            <Button variant="outline" size="sm" onClick={() => markAllAs('absent')}>
              <XCircle className="h-4 w-4 mr-1 text-red-500" />
              Mark All Absent
            </Button>
            <Button variant="outline" size="sm" onClick={() => setAttendance(new Map())}>
              Clear All
            </Button>
          </div>

          {/* Attendance Summary */}
          <div className="flex gap-3 flex-wrap">
            <Badge variant="outline" className="bg-green-50">
              <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
              Present: {counts.present}
            </Badge>
            <Badge variant="outline" className="bg-red-50">
              <XCircle className="h-3 w-3 mr-1 text-red-500" />
              Absent: {counts.absent}
            </Badge>
            <Badge variant="outline" className="bg-yellow-50">
              <Clock className="h-3 w-3 mr-1 text-yellow-500" />
              Late: {counts.late}
            </Badge>
            <Badge variant="outline" className="bg-blue-50">
              <AlertCircle className="h-3 w-3 mr-1 text-blue-500" />
              Excused: {counts.excused}
            </Badge>
            <Badge variant="outline" className="bg-gray-50">
              Unmarked: {counts.unmarked}
            </Badge>
          </div>

          {/* Student List */}
          <div className="space-y-2">
            {students.map((student) => {
              const currentStatus = attendance.get(student.id);
              return (
                <div
                  key={student.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium">
                        {student.name} {student.surname}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Sessions left: {student.sessions_left}
                      </p>
                    </div>
                    {currentStatus && (
                      <Badge
                        variant="outline"
                        className={cn(
                          currentStatus === 'present' && 'bg-green-100 text-green-700',
                          currentStatus === 'absent' && 'bg-red-100 text-red-700',
                          currentStatus === 'late' && 'bg-yellow-100 text-yellow-700',
                          currentStatus === 'excused' && 'bg-blue-100 text-blue-700'
                        )}
                      >
                        {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {getStatusButton(student, 'present')}
                    {getStatusButton(student, 'absent')}
                    {getStatusButton(student, 'late')}
                    {getStatusButton(student, 'excused')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || attendance.size !== students.length}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Attendance ({attendance.size}/{students.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TakeAttendanceDialog;
