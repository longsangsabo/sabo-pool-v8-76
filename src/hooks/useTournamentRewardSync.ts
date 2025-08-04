import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useTournamentRewardSync = () => {
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncTournamentRewards = async (tournamentId?: string) => {
    setSyncing(true);
    setError(null);

    try {

        '🔄 Syncing tournament rewards...',
        tournamentId ? `for ${tournamentId}` : 'for all tournaments'
      );

      const { data, error } = await supabase.functions.invoke(
        'sync-tournament-rewards',
        {
          body: {
            tournament_id: tournamentId,
            sync_all: !tournamentId,
          },
        }
      );

      if (error) {
        console.error('❌ Sync error:', error);
        throw error;
      }

      return data;
    } catch (err: any) {
      console.error('❌ Sync failed:', err);
      setError(err.message || 'Failed to sync tournament rewards');
      throw err;
    } finally {
      setSyncing(false);
    }
  };

  return {
    syncTournamentRewards,
    syncing,
    error,
  };
};
