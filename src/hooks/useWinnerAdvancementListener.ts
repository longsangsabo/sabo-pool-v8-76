import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { advanceWinner } from '@/utils/bracketAdvancement';

export const useWinnerAdvancementListener = (tournamentId?: string) => {
  useEffect(() => {
    if (!tournamentId) return;

      '🎯 Setting up winner advancement listener for tournament:',
      tournamentId
    );

    const handleWinnerAdvancement = async (payload: any) => {
      try {
        const data = JSON.parse(payload);
        if (data.tournament_id === tournamentId) {

          await advanceWinner(data.match_id);
        }
      } catch (err) {
        console.error(
          '❌ Error handling winner advancement notification:',
          err
        );
      }
    };

    // Listen to PostgreSQL notifications
    const channel = supabase
      .channel('winner-advancement')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournament_matches',
          filter: `tournament_id=eq.${tournamentId}`,
        },
        payload => {
          if (
            payload.eventType === 'UPDATE' &&
            payload.new?.winner_id &&
            !payload.old?.winner_id
          ) {

              '🎯 Winner detected, triggering rules-based advancement:',
              payload.new.id
            );
            advanceWinner(payload.new.id);
          }
        }
      )
      .subscribe();

    return () => {

      supabase.removeChannel(channel);
    };
  }, [tournamentId]);
};
