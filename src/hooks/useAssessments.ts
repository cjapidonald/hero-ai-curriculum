import { useRealtimeTable } from './useRealtimeTable';
import { Tables } from '@/integrations/supabase/types';

export type Assessment = Tables<'assessment'>;

export function useAssessments(filters?: { column: string; value: any }[]) {
  return useRealtimeTable<Assessment>('assessment', '*', filters);
}
