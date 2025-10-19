import { useRealtimeTable } from './useRealtimeTable';
import { Tables } from '@/integrations/supabase/types';

export type Curriculum = Tables<'curriculum'>;

export function useCurriculum(filters?: { column: string; value: any }[]) {
  return useRealtimeTable<Curriculum>('curriculum', '*', filters);
}
