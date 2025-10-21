import { useRealtimeTable } from './useRealtimeTable';

// Type definition for CalendarSession (table doesn't exist in DB yet)
export interface CalendarSession {
  id: string;
  teacher_id: string;
  class_name: string;
  lesson_title: string;
  session_date: string;
  start_time: string;
  end_time: string;
  status: string;
  attendance_taken: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export function useCalendarSessions(filters?: { column: string; value: any }[]) {
  return useRealtimeTable<CalendarSession>('calendar_sessions' as any, '*', filters);
}
