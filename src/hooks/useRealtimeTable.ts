import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Generic hook for real-time table synchronization with CRUD operations
 * Provides automatic real-time updates across all connected clients
 */
export function useRealtimeTable<T extends { id: string }>(
  tableName: string,
  selectQuery?: string,
  filters?: { column: string; value: any }[]
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  const matchesFilters = useCallback(
    (item: T) => {
      if (!filters || filters.length === 0) {
        return true;
      }

      return filters.every(({ column, value }) => {
        const itemValue = (item as any)[column];
        if (value === null) {
          return itemValue === null;
        }
        if (Array.isArray(value)) {
          return Array.isArray(itemValue)
            ? value.every((val) => itemValue.includes(val))
            : value.includes(itemValue);
        }
        return itemValue === value;
      });
    },
    [filters]
  );

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase.from(tableName).select(selectQuery || '*');

      // Apply filters if provided
      if (filters && filters.length > 0) {
        filters.forEach(({ column, value }) => {
          query = query.eq(column, value);
        });
      }

      const { data: fetchedData, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setData((fetchedData as T[]) || []);
    } catch (err: any) {
      console.error(`Error fetching ${tableName}:`, err);
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [tableName, selectQuery, JSON.stringify(filters)]);

  // Set up real-time subscription
  useEffect(() => {
    fetchData();

    // Create real-time channel
    const realtimeChannel = supabase
      .channel(`${tableName}-changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName,
        },
        (payload) => {
          console.log(`Real-time update on ${tableName}:`, payload);

          if (payload.eventType === 'INSERT') {
            setData((prev) => {
              const newItem = payload.new as T;
              if (!matchesFilters(newItem)) {
                return prev;
              }

              const exists = prev.some((item) => item.id === newItem.id);
              if (exists) {
                return prev.map((item) => (item.id === newItem.id ? newItem : item));
              }
              return [...prev, newItem];
            });
          } else if (payload.eventType === 'UPDATE') {
            setData((prev) => {
              const updatedItem = payload.new as T;
              if (!matchesFilters(updatedItem)) {
                return prev.filter((item) => item.id !== updatedItem.id);
              }

              const exists = prev.some((item) => item.id === updatedItem.id);
              if (exists) {
                return prev.map((item) => (item.id === updatedItem.id ? updatedItem : item));
              }
              return [...prev, updatedItem];
            });
          } else if (payload.eventType === 'DELETE') {
            setData((prev) =>
              prev.filter((item) => item.id !== (payload.old as T).id)
            );
          }
        }
      )
      .subscribe();

    setChannel(realtimeChannel);

    // Cleanup subscription on unmount
    return () => {
      realtimeChannel.unsubscribe();
    };
  }, [tableName, fetchData, matchesFilters]);

  // CRUD operations
  const create = useCallback(
    async (newItem: Omit<T, 'id' | 'created_at' | 'updated_at'>) => {
      try {
        const { data: createdData, error: createError } = await supabase
          .from(tableName)
          .insert([newItem])
          .select()
          .single();

        if (createError) throw createError;

        return { data: createdData as T, error: null };
      } catch (err: any) {
        console.error(`Error creating in ${tableName}:`, err);
        return { data: null, error: err.message || 'Failed to create' };
      }
    },
    [tableName]
  );

  const update = useCallback(
    async (id: string, updates: Partial<Omit<T, 'id' | 'created_at'>>) => {
      try {
        const { data: updatedData, error: updateError } = await supabase
          .from(tableName)
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (updateError) throw updateError;

        return { data: updatedData as T, error: null };
      } catch (err: any) {
        console.error(`Error updating in ${tableName}:`, err);
        return { data: null, error: err.message || 'Failed to update' };
      }
    },
    [tableName]
  );

  const remove = useCallback(
    async (id: string) => {
      try {
        const { error: deleteError } = await supabase
          .from(tableName)
          .delete()
          .eq('id', id);

        if (deleteError) throw deleteError;

        return { error: null };
      } catch (err: any) {
        console.error(`Error deleting from ${tableName}:`, err);
        return { error: err.message || 'Failed to delete' };
      }
    },
    [tableName]
  );

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    create,
    update,
    remove,
    refresh,
  };
}
