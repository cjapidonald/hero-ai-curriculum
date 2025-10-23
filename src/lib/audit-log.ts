import { supabase } from '@/integrations/supabase/client';
import type { AuthUser } from '@/contexts/auth-context';

export type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE';

type AuditData = Record<string, unknown> | null;

interface LogAuditEventOptions {
  tableName: string;
  action: AuditAction;
  recordId?: string | null;
  oldData?: unknown;
  newData?: unknown;
  user?: AuthUser | null;
}

const normalizeAuditData = (data?: unknown): AuditData => {
  if (data && typeof data === 'object') {
    return data as Record<string, unknown>;
  }
  return null;
};

const computeChangedFields = (
  action: AuditAction,
  oldData?: AuditData,
  newData?: AuditData
): string[] => {
  if (action === 'INSERT') {
    return newData ? Object.keys(newData) : [];
  }

  if (action === 'DELETE') {
    return oldData ? Object.keys(oldData) : [];
  }

  if (!oldData || !newData) {
    return [];
  }

  const fieldSet = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

  return Array.from(fieldSet).filter((key) => {
    const oldValue = oldData[key];
    const newValue = newData[key];

    if (oldValue === newValue) {
      return false;
    }

    try {
      return JSON.stringify(oldValue) !== JSON.stringify(newValue);
    } catch (error) {
      console.warn('Failed to compare audit values for key', key, error);
      return true;
    }
  });
};

export const logAuditEvent = async ({
  tableName,
  action,
  recordId,
  oldData,
  newData,
  user,
}: LogAuditEventOptions) => {
  try {
    const normalizedOldData = normalizeAuditData(oldData);
    const normalizedNewData = normalizeAuditData(newData);
    const changedFields = computeChangedFields(action, normalizedOldData, normalizedNewData);

    const { error } = await supabase.from('audit_logs').insert([
      {
        table_name: tableName,
        record_id: recordId ?? null,
        action,
        old_data: normalizedOldData,
        new_data: normalizedNewData,
        changed_fields: changedFields,
        user_email: user?.email ?? null,
        user_role: user?.role ?? null,
      },
    ]);

    if (error) {
      console.error('Failed to write audit log entry:', error);
    }
  } catch (error) {
    console.error('Unexpected error while logging audit event:', error);
  }
};
