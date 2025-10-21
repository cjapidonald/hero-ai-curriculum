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
}

interface TakeAttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className: string;
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

    setSaving(true);
    try {
      // Prepare attendance records
      const attendanceRecords = Array.from(attendance.entries()).map(([studentId, status]) => ({
        student_id: studentId,
        class: className,
        session_date: format(sessionDate, 'yyyy-MM-dd'),
        status: status,
      }));

      // Insert attendance records (upsert to handle duplicates)
      const { error } = await supabase.from('attendance' as any).upsert(attendanceRecords, {
        onConflict: 'student_id,session_date',
      });

      if (error) throw error;

      toast({
        title: 'Attendance saved',
        description: `Attendance for ${attendance.size} student(s) has been recorded.`,
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
          <Button onClick={handleSave} disabled={saving || attendance.size === 0}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Attendance ({attendance.size}/{students.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TakeAttendanceDialog;
