import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

type TableFilter = { column: string; value: unknown };

/**
 * Generic hook for real-time table synchronization with CRUD operations
 * Provides automatic real-time updates across all connected clients
 */
export function useRealtimeTable<T extends { id: string }>(
  tableName: string,
  selectQuery?: string,
  filters?: TableFilter[]
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  const filterKey = useMemo(() => JSON.stringify(filters ?? []), [filters]);

  const normalizedFilters = useMemo<TableFilter[]>(() => {
    const parsedFilters = JSON.parse(filterKey) as TableFilter[];
    return parsedFilters.map((filter) => ({ ...filter }));
  }, [filterKey]);

  const matchesFilters = useCallback(
    (item: T) => {
      if (normalizedFilters.length === 0) {
        return true;
      }

      return normalizedFilters.every(({ column, value }) => {
        const typedItem = item as Record<string, unknown>;
        const itemValue = typedItem[column];
        if (value === null) {
          return itemValue === null;
        }
        if (Array.isArray(value)) {
          if (!Array.isArray(itemValue)) {
            return false;
          }

          return value.every((val) => itemValue.includes(val));
        }
        return itemValue === value;
      });
    },
    [normalizedFilters]
  );

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase.from(tableName).select(selectQuery || '*');

      // Apply filters if provided
      if (normalizedFilters.length > 0) {
        normalizedFilters.forEach(({ column, value }) => {
          query = query.eq(column as never, value as never);
        });
      }

      const { data: fetchedData, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setData((fetchedData as T[]) || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      console.error(`Error fetching ${tableName}:`, err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [tableName, selectQuery, normalizedFilters]);

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
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create';
        console.error(`Error creating in ${tableName}:`, err);
        return { data: null, error: errorMessage };
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
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update';
        console.error(`Error updating in ${tableName}:`, err);
        return { data: null, error: errorMessage };
      }
    },
    [tableName]
  );

  const remove = useCallback(
    async (id: string) => {
      try {
        const { data: deletedData, error: deleteError } = await supabase
          .from(tableName)
          .delete()
          .eq('id', id)
          .select()
          .maybeSingle();

        if (deleteError) throw deleteError;

        return { data: (deletedData as T | null) ?? null, error: null };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete';
        console.error(`Error deleting from ${tableName}:`, err);
        return { data: null, error: errorMessage };
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
