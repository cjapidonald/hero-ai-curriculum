import { useRealtimeTable } from './useRealtimeTable';
import { Tables } from '@/integrations/supabase/types';

export type Student = Tables<'dashboard_students'>;

export function useStudents(filters?: { column: string; value: any }[]) {
  return useRealtimeTable<Student>('dashboard_students', '*', filters);
}
