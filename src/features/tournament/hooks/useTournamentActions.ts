import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tournament, TournamentMatch, TournamentParticipant } from '../types/tournament.types';
import { toast } from 'sonner';

export const useTournamentActions = (tournamentId: string) => {
  const updateTournamentDetails = useCallback(async (data: Partial<Tournament>) => {
    try {
      const { error } = await supabase
        .from('tournaments')
        .update(data)
        .eq('id', tournamentId);

      if (error) throw error;
      toast.success('Cập nhật giải đấu thành công');
      return true;
    } catch (error) {
      console.error('Error updating tournament:', error);
      toast.error('Không thể cập nhật giải đấu');
      return false;
    }
  }, [tournamentId]);

  const registerParticipant = useCallback(async (userId: string) => {
    try {
      // Check if already registered
      const { data: existing } = await supabase
        .from('tournament_registrations')
        .select('id')
        .eq('tournament_id', tournamentId)
        .eq('user_id', userId)
        .single();

      if (existing) {
        toast.error('Người chơi đã đăng ký giải đấu này');
        return false;
      }

      // Check tournament capacity
      const { data: tournament } = await supabase
        .from('tournaments')
        .select('max_participants, current_participants')
        .eq('id', tournamentId)
        .single();

      if (tournament && tournament.current_participants >= tournament.max_participants) {
        toast.error('Giải đấu đã đủ số lượng người tham gia');
        return false;
      }

      // Register participant
      const { error } = await supabase
        .from('tournament_registrations')
        .insert({
          tournament_id: tournamentId,
          user_id: userId,
          status: 'registered',
          registration_time: new Date().toISOString()
        });

      if (error) throw error;

      // Update participant count
      await supabase.rpc('increment_tournament_participants', {
        tournament_id: tournamentId
      });

      toast.success('Đăng ký tham gia thành công');
      return true;
    } catch (error) {
      console.error('Error registering participant:', error);
      toast.error('Không thể đăng ký tham gia');
      return false;
    }
  }, [tournamentId]);

  const updateMatchResult = useCallback(async (
    matchId: string,
    data: Partial<TournamentMatch>
  ) => {
    try {
      const { error } = await supabase
        .from('tournament_matches')
        .update(data)
        .eq('id', matchId);

      if (error) throw error;
      toast.success('Cập nhật kết quả trận đấu thành công');
      return true;
    } catch (error) {
      console.error('Error updating match:', error);
      toast.error('Không thể cập nhật kết quả trận đấu');
      return false;
    }
  }, []);

  const assignTable = useCallback(async (matchId: string, tableId: string) => {
    try {
      const { error } = await supabase
        .from('tournament_matches')
        .update({ table_id: tableId })
        .eq('id', matchId);

      if (error) throw error;
      toast.success('Phân bàn thành công');
      return true;
    } catch (error) {
      console.error('Error assigning table:', error);
      toast.error('Không thể phân bàn');
      return false;
    }
  }, []);

  return {
    updateTournamentDetails,
    registerParticipant,
    updateMatchResult,
    assignTable
  };
};
