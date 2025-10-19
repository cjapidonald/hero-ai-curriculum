import { useRealtimeTable } from './useRealtimeTable';
import { Tables } from '@/integrations/supabase/types';

export type Assignment = Tables<'assignments'>;

export function useAssignments(filters?: { column: string; value: any }[]) {
  return useRealtimeTable<Assignment>('assignments', '*', filters);
}
