import { useRealtimeTable } from './useRealtimeTable';

// Type definition for Assignment (table doesn't exist in DB yet)
export interface Assignment {
  id: string;
  teacher_id: string;
  title: string;
  description?: string;
  assignment_type: string;
  target_type: string;
  target_class?: string;
  target_student_id?: string;
  due_date?: string;
  created_at?: string;
  updated_at?: string;
}

export function useAssignments(filters?: { column: string; value: string }[]) {
  return useRealtimeTable<Assignment>('assignments', '*', filters);
}
