import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TournamentPrizeTier {
  id: string;
  tournament_id: string;
  position: number;
  position_name: string;
  cash_amount: number;
  elo_points: number;
  spa_points: number;
  is_visible: boolean;
  physical_items: string[];
}

export const useTournamentPrizeTiers = (tournamentId?: string) => {
  const [prizeTiers, setPrizeTiers] = useState<TournamentPrizeTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrizeTiers = async () => {
    if (!tournamentId) {
      setPrizeTiers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🏆 Fetching tournament prize tiers for:', tournamentId);

      const { data, error: fetchError } = await supabase
        .from('tournament_prize_tiers')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('position', { ascending: true });

      if (fetchError) {
        console.error('❌ Error fetching tournament prize tiers:', fetchError);
        throw fetchError;
      }

      console.log('✅ Tournament prize tiers fetched:', data?.length || 0);

      setPrizeTiers(data || []);
    } catch (err: any) {
      console.error('❌ Error in fetchPrizeTiers:', err);
      setError(err.message || 'Failed to fetch tournament prize tiers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrizeTiers();
  }, [tournamentId]);

  return {
    prizeTiers,
    loading,
    error,
    refetch: fetchPrizeTiers,
  };
};
