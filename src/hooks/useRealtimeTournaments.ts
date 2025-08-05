import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tournament } from '@/types/tournament';

interface UseRealtimeTournamentsProps {
  filters?: {
    status?: string[];
    search?: string;
    limit?: number;
  };
  initialTournaments?: Tournament[];
}

export const useRealtimeTournaments = ({
  filters = {},
  initialTournaments = [],
}: UseRealtimeTournamentsProps = {}) => {
  const [tournaments, setTournaments] =
    useState<Tournament[]>(initialTournaments);
  const [loading, setLoading] = useState(initialTournaments.length === 0);
  const [error, setError] = useState<string | null>(null);

  // Fetch tournaments with filters
  const fetchTournaments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('tournaments')
        .select(
          `
          *,
          physical_prizes,
          spa_points_config,
          elo_points_config
        `
        )
        .order('created_at', { ascending: false });

      // Apply status filter
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      // Apply search filter
      if (filters.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }

      // Apply limit
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setTournaments((data as any[]) || []);
    } catch (err) {
      console.error('❌ Error fetching tournaments:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to fetch tournaments'
      );
    } finally {
      setLoading(false);
    }
  }, [filters.status, filters.search, filters.limit]);

  // Initial fetch
  useEffect(() => {
    if (initialTournaments.length === 0) {
      fetchTournaments();
    }
  }, [fetchTournaments, initialTournaments.length]);

  // Real-time subscription
  useEffect(() => {
    console.log('🔄 Setting up real-time subscription for tournaments list');

    const channel = supabase
      .channel('tournaments_list_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournaments',
        },
        payload => {
          console.log('🔄 Tournaments list updated via real-time:', payload);

          switch (payload.eventType) {
            case 'INSERT':
              if (payload.new) {
                setTournaments(prev => [payload.new as any, ...prev]);
              }
              break;
            case 'UPDATE':
              if (payload.new) {
                setTournaments(prev =>
                  prev.map(tournament =>
                    tournament.id === payload.new.id
                      ? ({ ...tournament, ...payload.new } as any)
                      : tournament
                  )
                );
              }
              break;
            case 'DELETE':
              if (payload.old) {
                setTournaments(prev =>
                  prev.filter(tournament => tournament.id !== payload.old.id)
                );
              }
              break;
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournament_registrations',
        },
        payload => {
          console.log('🔄 Tournament registrations updated, refreshing list');
          // Refetch tournaments to get updated participant counts
          fetchTournaments();
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 Cleaning up real-time subscription for tournaments list');
      supabase.removeChannel(channel);
    };
  }, [fetchTournaments]);

  return {
    tournaments,
    loading,
    error,
    refetch: fetchTournaments,
  };
};
