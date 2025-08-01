import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useTournamentRealtimeSync = (
  onRegistrationChange: (tournamentId: string, isRegistered: boolean) => void
) => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    console.log('Setting up real-time listeners for user:', user.id);

    // Listen to tournament_registrations changes
    const channel = supabase
      .channel('tournament-registration-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournament_registrations',
          filter: `user_id=eq.${user.id}`,
        },
        payload => {
          console.log('Real-time registration change:', payload);

          const tournamentId =
            (payload.new as any)?.tournament_id ||
            (payload.old as any)?.tournament_id;
          if (!tournamentId) return;

          switch (payload.eventType) {
            case 'INSERT':
              onRegistrationChange(tournamentId, true);
              break;
            case 'DELETE':
              onRegistrationChange(tournamentId, false);
              break;
            case 'UPDATE':
              const isRegistered =
                (payload.new as any)?.registration_status !== 'cancelled';
              onRegistrationChange(tournamentId, isRegistered);
              break;
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time listeners');
      supabase.removeChannel(channel);
    };
  }, [user?.id, onRegistrationChange]);

  return null;
};
