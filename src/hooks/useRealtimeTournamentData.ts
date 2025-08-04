import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useRealtimeTournamentData = (
  tournamentId: string | null,
  onUpdate: () => void
) => {
  useEffect(() => {
    if (!tournamentId) return;

      '🔄 Setting up enhanced real-time subscription for tournament:',
      tournamentId
    );

    const channel = supabase
      .channel(`tournament_data_enhanced_${tournamentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournament_registrations',
          filter: `tournament_id=eq.${tournamentId}`,
        },
        payload => {

          onUpdate();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournament_matches',
          filter: `tournament_id=eq.${tournamentId}`,
        },
        payload => {

          // Force immediate refresh for match updates
          if (payload.eventType === 'UPDATE') {

            // Special handling for semifinals completion
            if (
              payload.new &&
              payload.new.round_number === 250 &&
              payload.new.status === 'completed'
            ) {

                '🏆 Semifinal completed, checking for Championship Final advancement'
              );
              setTimeout(() => {
                onUpdate();
              }, 500); // Longer delay for semifinals to ensure proper advancement
            } else {
              setTimeout(() => {
                onUpdate();
              }, 100); // Small delay to ensure data consistency
            }
          } else {
            onUpdate();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournament_results',
          filter: `tournament_id=eq.${tournamentId}`,
        },
        payload => {

          onUpdate();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tournaments',
          filter: `id=eq.${tournamentId}`,
        },
        payload => {

          onUpdate();
        }
      )
      .subscribe(status => {

          `🔗 Enhanced tournament data subscription status: ${status}`
        );
      });

    return () => {

        '🔄 Cleaning up enhanced real-time subscription for tournament data'
      );
      supabase.removeChannel(channel);
    };
  }, [tournamentId, onUpdate]);
};
