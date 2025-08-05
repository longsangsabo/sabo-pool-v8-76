import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TournamentForTemplate {
  id: string;
  name: string;
  status: string;
  tournament_type: string;
  max_participants: number;
  current_participants: number;
  created_at: string;
  tournament_start?: string;
  entry_fee?: number;
  description?: string;
  club_id?: string;
}

export const useTournamentsForTemplates = () => {
  const [tournaments, setTournaments] = useState<TournamentForTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTournaments = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('tournaments')
        .select(
          'id, name, status, tournament_type, max_participants, current_participants, created_at, tournament_start, entry_fee, description, club_id'
        )
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setTournaments(data || []);
    } catch (err) {
      console.error('Error fetching tournaments:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to fetch tournaments'
      );
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  return {
    tournaments,
    loading,
    error,
    fetchTournaments,
    refetch: fetchTournaments,
  };
};
