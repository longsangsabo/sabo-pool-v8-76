import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tournament } from '@/types/tournament';

interface UseRealtimeTournamentProps {
  tournamentId?: string;
  initialTournament?: Tournament;
}

export const useRealtimeTournament = ({
  tournamentId,
  initialTournament,
}: UseRealtimeTournamentProps) => {
  const [tournament, setTournament] = useState<Tournament | null>(
    initialTournament || null
  );
  const [loading, setLoading] = useState(!initialTournament);
  const [error, setError] = useState<string | null>(null);

  // Fetch tournament data
  const fetchTournament = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Handle missing columns gracefully
      const transformedData = {
        ...data,
        physical_prizes: null,
        spa_points_config: null,
        elo_points_config: null,
      };

      setTournament(transformedData as Tournament);
    } catch (err) {
      console.error('❌ Error fetching tournament:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to fetch tournament'
      );
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (tournamentId && !initialTournament) {
      fetchTournament(tournamentId);
    }
  }, [tournamentId, initialTournament]);

  // Real-time subscription
  useEffect(() => {
    if (!tournamentId) return;

    console.log(
      '🔄 Setting up real-time subscription for tournament:',
      tournamentId
    );

    const channel = supabase
      .channel(`tournament_updates_${tournamentId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'tournaments',
          filter: `id=eq.${tournamentId}`,
        },
        payload => {
          console.log('🔄 Tournament updated via real-time:', payload);

          switch (payload.eventType) {
            case 'UPDATE':
              if (payload.new) {
                setTournament(
                  prev =>
                    ({
                      ...prev,
                      ...payload.new,
                    }) as Tournament
                );
              }
              break;
            case 'DELETE':
              setTournament(null);
              break;
            case 'INSERT':
              if (payload.new && payload.new.id === tournamentId) {
                setTournament(payload.new as any);
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
          filter: `tournament_id=eq.${tournamentId}`,
        },
        payload => {
          console.log('🔄 Tournament registrations updated:', payload);
          // Refetch tournament to get updated participant count
          if (tournamentId) {
            fetchTournament(tournamentId);
          }
        }
      )
      .subscribe();

    return () => {
      console.log(
        '🔄 Cleaning up real-time subscription for tournament:',
        tournamentId
      );
      supabase.removeChannel(channel);
    };
  }, [tournamentId]);

  return {
    tournament,
    loading,
    error,
    refetch: () =>
      tournamentId ? fetchTournament(tournamentId) : Promise.resolve(),
  };
};
