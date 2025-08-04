import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TournamentMatch {
  id: string;
  tournament_id: string;
  round_number: number;
  match_number: number;
  player1_id?: string;
  player2_id?: string;
  winner_id?: string;
  player1_score: number;
  player2_score: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduled_time?: string;
  started_at?: string;
  completed_at?: string;
  referee_id?: string;
  notes?: string;
  is_third_place_match?: boolean;
  player1?: {
    user_id: string;
    full_name: string;
    display_name: string;
  };
  player2?: {
    user_id: string;
    full_name: string;
    display_name: string;
  };
}

// Simplified interfaces - no match_results needed
export interface MatchResult {
  id: string;
  tournament_id: string;
  player1_id: string;
  player2_id: string;
  winner_id?: string;
  player1_score: number;
  player2_score: number;
  result_status: 'pending' | 'confirmed' | 'verified' | 'disputed';
  created_by?: string;
  created_at: string;
}

export const useMatchManagement = (tournamentId: string) => {
  const queryClient = useQueryClient();

  // Get tournament matches
  const {
    data: matches = [],
    isLoading: matchesLoading,
    error: matchesError,
    refetch: refetchMatches,
  } = useQuery({
    queryKey: ['tournament-matches', tournamentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tournament_matches')
        .select(
          `
          *,
          player1:profiles!tournament_matches_player1_id_fkey(
            user_id, full_name, display_name
          ),
          player2:profiles!tournament_matches_player2_id_fkey(
            user_id, full_name, display_name
          )
        `
        )
        .eq('tournament_id', tournamentId)
        .order('round_number', { ascending: true })
        .order('match_number', { ascending: true });

      if (error) throw error;
      return (data || []).map((match: any) => ({
        id: match.id,
        tournament_id: match.tournament_id,
        round_number: match.round_number,
        match_number: match.match_number,
        player1_id: match.player1_id,
        player2_id: match.player2_id,
        winner_id: match.winner_id,
        player1_score: match.score_player1 || 0,
        player2_score: match.score_player2 || 0,
        status: match.status,
        scheduled_time: match.scheduled_time,
        started_at: match.actual_start_time,
        completed_at: match.actual_end_time,
        referee_id: match.referee_id,
        notes: match.notes,
        is_third_place_match: match.is_third_place_match || false,
        player1: match.player1,
        player2: match.player2,
      })) as TournamentMatch[];
    },
    enabled: !!tournamentId,
  });

  // Simplified update match score - no match_results creation
  const updateScoreMutation = useMutation({
    mutationFn: async ({
      matchId,
      player1Score,
      player2Score,
      winnerId,
      status,
    }: {
      matchId: string;
      player1Score: number;
      player2Score: number;
      winnerId?: string;
      status?: string;
    }) => {

        player1Score,
        player2Score,
        winnerId,
      });

      // Simple update - only tournament_matches table
      const { data: match, error: matchError } = await supabase
        .from('tournament_matches')
        .update({
          score_player1: player1Score,
          score_player2: player2Score,
          winner_id: winnerId,
          status: status || (winnerId ? 'completed' : 'in_progress'),
          actual_end_time: winnerId ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', matchId)
        .select()
        .single();

      if (matchError) {
        console.error('Match update error:', matchError);
        throw matchError;
      }

      // Simple success message - no complex logic
      if (winnerId) {
        setTimeout(() => {
          toast.success(`🏆 Người thắng đã được ghi nhận!`);
        }, 500);
      }

      return match;
    },
    onSuccess: data => {

      queryClient.invalidateQueries({
        queryKey: ['tournament-matches', tournamentId],
      });
      toast.success('Tỉ số đã được cập nhật thành công!');
    },
    onError: (error: any) => {
      console.error('Update score error:', error);
      const errorMessage =
        error?.message || 'Có lỗi không xác định khi cập nhật tỉ số';
      toast.error(`Lỗi: ${errorMessage}`);
    },
    retry: 1,
    retryDelay: 1000,
  });

  // Restore match (undo cancel)
  const restoreMatchMutation = useMutation({
    mutationFn: async (matchId: string) => {

      const { data, error } = await supabase
        .from('tournament_matches')
        .update({
          status: 'scheduled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', matchId)
        .select()
        .single();

      if (error) {
        console.error('Restore match error:', error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['tournament-matches', tournamentId],
      });
      toast.success('Trận đấu đã được khôi phục!');
    },
    onError: (error: any) => {
      console.error('Restore match error:', error);
      const errorMessage = error?.message || 'Có lỗi khi khôi phục trận đấu';
      toast.error(`Lỗi: ${errorMessage}`);
    },
  });

  // Start match
  const startMatchMutation = useMutation({
    mutationFn: async (matchId: string) => {
      const { data, error } = await supabase
        .from('tournament_matches')
        .update({
          status: 'in_progress',
          actual_start_time: new Date().toISOString(),
        })
        .eq('id', matchId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['tournament-matches', tournamentId],
      });
      toast.success('Trận đấu đã bắt đầu!');
    },
    onError: error => {
      console.error('Start match error:', error);
      toast.error('Có lỗi khi bắt đầu trận đấu');
    },
  });

  // Cancel match
  const cancelMatchMutation = useMutation({
    mutationFn: async (matchId: string) => {
      const { data, error } = await supabase
        .from('tournament_matches')
        .update({
          status: 'cancelled',
        })
        .eq('id', matchId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['tournament-matches', tournamentId],
      });
      toast.success('Trận đấu đã bị hủy!');
    },
    onError: error => {
      console.error('Cancel match error:', error);
      toast.error('Có lỗi khi hủy trận đấu');
    },
  });

  // Edit confirmed score
  const editScoreMutation = useMutation({
    mutationFn: async ({
      matchId,
      newPlayer1Score,
      newPlayer2Score,
      editorId,
    }: {
      matchId: string;
      newPlayer1Score: number;
      newPlayer2Score: number;
      editorId: string;
    }) => {

        newPlayer1Score,
        newPlayer2Score,
      });

      const { data, error } = await supabase.rpc('edit_confirmed_score', {
        p_match_id: matchId,
        p_new_player1_score: newPlayer1Score,
        p_new_player2_score: newPlayer2Score,
        p_admin_id: editorId,
      });

      if (error) {
        console.error('Edit score error:', error);
        throw error;
      }

      if (data && typeof data === 'object' && 'error' in data) {
        throw new Error(data.error as string);
      }

      return data;
    },
    onSuccess: (data: any) => {

      queryClient.invalidateQueries({
        queryKey: ['tournament-matches', tournamentId],
      });

      if (data && typeof data === 'object' && data.bracket_updated) {
        toast.success('Tỷ số đã được cập nhật! Bảng đấu đã được làm mới.');
      } else {
        toast.success('Tỷ số đã được cập nhật thành công!');
      }
    },
    onError: (error: any) => {
      console.error('Edit score error:', error);
      const errorMessage =
        error?.message || 'Có lỗi không xác định khi sửa tỷ số';
      toast.error(`Lỗi: ${errorMessage}`);
    },
    retry: 1,
    retryDelay: 1000,
  });

  return {
    // Data
    matches,
    loading: matchesLoading,
    error: matchesError,

    // Actions
    updateScore: updateScoreMutation.mutateAsync,
    startMatch: startMatchMutation.mutateAsync,
    cancelMatch: cancelMatchMutation.mutateAsync,
    restoreMatch: restoreMatchMutation.mutateAsync,
    editScore: editScoreMutation.mutateAsync,
    refetchMatches,

    // Loading states
    isUpdatingScore: updateScoreMutation.isPending,
    isStartingMatch: startMatchMutation.isPending,
    isCancellingMatch: cancelMatchMutation.isPending,
    isRestoringMatch: restoreMatchMutation.isPending,
    isEditingScore: editScoreMutation.isPending,
  };
};
