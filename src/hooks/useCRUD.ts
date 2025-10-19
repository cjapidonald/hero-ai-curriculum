import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

/**
 * Simplified CRUD hook with toast notifications
 * Use this for non-realtime operations or when you need manual control
 */
export function useCRUD<T extends { id: string }>(tableName: string) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const create = async (
    data: Omit<T, 'id' | 'created_at' | 'updated_at'>,
    successMessage = 'Created successfully'
  ) => {
    setLoading(true);
    try {
      const { data: created, error } = await supabase
        .from(tableName)
        .insert([data])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: successMessage,
      });

      return { data: created as T, error: null };
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create',
        variant: 'destructive',
      });
      return { data: null, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const update = async (
    id: string,
    updates: Partial<Omit<T, 'id' | 'created_at'>>,
    successMessage = 'Updated successfully'
  ) => {
    setLoading(true);
    try {
      const { data: updated, error } = await supabase
        .from(tableName)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: successMessage,
      });

      return { data: updated as T, error: null };
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update',
        variant: 'destructive',
      });
      return { data: null, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string, successMessage = 'Deleted successfully') => {
    setLoading(true);
    try {
      const { error } = await supabase.from(tableName).delete().eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: successMessage,
      });

      return { error: null };
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete',
        variant: 'destructive',
      });
      return { error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    create,
    update,
    remove,
  };
}
