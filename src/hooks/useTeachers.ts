import { useRealtimeTable } from './useRealtimeTable';
import { Tables } from '@/integrations/supabase/types';

export type Teacher = Tables<'teachers'>;

export function useTeachers(filters?: { column: string; value: any }[]) {
  return useRealtimeTable<Teacher>('teachers', '*', filters);
}
