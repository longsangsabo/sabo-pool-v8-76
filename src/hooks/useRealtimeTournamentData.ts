import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useRealtimeTournamentData = (
  tournamentId: string | null,
  onUpdate: () => void
) => {
  useEffect(() => {
    if (!tournamentId) return;

    console.log(
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
          console.log('🔄 Tournament registrations updated:', payload);
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
          console.log('🔄 Tournament matches updated:', payload);

          // Force immediate refresh for match updates
          if (payload.eventType === 'UPDATE') {
            console.log('✅ Match score/status updated, triggering refresh');

            // Special handling for semifinals completion
            if (
              payload.new &&
              payload.new.round_number === 250 &&
              payload.new.status === 'completed'
            ) {
              console.log(
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
          console.log('🔄 Tournament results updated:', payload);
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
          console.log('🔄 Tournament updated:', payload);
          onUpdate();
        }
      )
      .subscribe(status => {
        console.log(
          `🔗 Enhanced tournament data subscription status: ${status}`
        );
      });

    return () => {
      console.log(
        '🔄 Cleaning up enhanced real-time subscription for tournament data'
      );
      supabase.removeChannel(channel);
    };
  }, [tournamentId, onUpdate]);
};
