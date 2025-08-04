import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useClubContext } from '../../contexts/ClubContext';

export const useTournamentRealtime = (tournamentId: string) => {
  const { selectedClub } = useClubContext();

  useEffect(() => {
    if (!tournamentId || !selectedClub) return;

    const channel = supabase
      .channel(`tournament_${tournamentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournament_matches',
          filter: `tournament_id=eq.${tournamentId}`,
        },
        (payload) => {
          console.log('Change received!', payload);
          // Handle the update based on the payload
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tournamentId, selectedClub]);

  const updateMatch = async (matchId: string, data: any) => {
    try {
      const { data: updatedMatch, error } = await supabase
        .from('tournament_matches')
        .update(data)
        .eq('id', matchId)
        .select()
        .single();

      if (error) throw error;
      return updatedMatch;
    } catch (error) {
      console.error('Error updating match:', error);
      throw error;
    }
  };

  return {
    updateMatch,
  };
};
