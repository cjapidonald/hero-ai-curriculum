import { useRealtimeTable } from './useRealtimeTable';
import { Tables } from '@/integrations/supabase/types';

export type CalendarSession = Tables<'calendar_sessions'>;

export function useCalendarSessions(filters?: { column: string; value: any }[]) {
  return useRealtimeTable<CalendarSession>('calendar_sessions', '*', filters);
}
