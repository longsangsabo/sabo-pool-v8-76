import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// Temporary type definitions until Supabase types are updated

interface ChallengeMatch {
  id: string;
  challenge_id: string;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  challenger_score: number;
  opponent_score: number;
  winner_id?: string;
  started_at?: string;
  completed_at?: string;
  challenger_confirmed: boolean;
  opponent_confirmed: boolean;
  club_confirmed: boolean;
}

interface ChallengeConversation {
  id: string;
  challenge_id: string;
  sender_id: string;
  message: string;
  created_at: string;
  is_read: boolean;
  sender?: {
    display_name: string;
    avatar_url?: string;
  };
}

export function useChallengeWorkflow() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Mock functions until types are updated
  const getChallengeMatch = (challengeId: string) => {
    return useQuery({
      queryKey: ['challenge-match', challengeId],
      queryFn: async () => {
        // Temporarily return null until tables are ready
        return null;
      },
      enabled: !!challengeId,
    });
  };

  const getChallengeConversations = (challengeId: string) => {
    return useQuery({
      queryKey: ['challenge-conversations', challengeId],
      queryFn: async () => {
        // Temporarily return empty array until tables are ready
        return [];
      },
      enabled: !!challengeId,
    });
  };

  // Mock functions until types are updated
  const startMatch = useMutation({
    mutationFn: async ({ challengeId }: { challengeId: string }) => {
      toast.success('Trận đấu đã bắt đầu!');
      return { success: true };
    },
  });

  const submitScore = useMutation({
    mutationFn: async ({
      challengeId,
      challengerScore,
      opponentScore,
      isChallenger,
    }: {
      challengeId: string;
      challengerScore: number;
      opponentScore: number;
      isChallenger: boolean;
    }) => {
      console.log('Submitting challenge score:', {
        challengeId,
        challengerScore,
        opponentScore,
        isChallenger,
        userId: user?.id,
      });

      const { data, error } = await supabase.functions.invoke(
        'challenge-score-update',
        {
          body: {
            challengeId,
            challengerScore,
            opponentScore,
          },
        }
      );

      if (error) {
        console.error('Score submission error:', error);
        throw new Error(error.message || 'Failed to submit score');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to process score');
      }

      return data.result;
    },
    onSuccess: result => {
      console.log('Score submitted successfully:', result);

      // Use refetchQueries instead of invalidateQueries to avoid full page reload
      queryClient.refetchQueries({ queryKey: ['challenges'] });
      queryClient.refetchQueries({ queryKey: ['player-rankings'] });

      toast.success(
        `🎯 Trận đấu hoàn thành! Người thắng nhận ${result.points_awarded} SPA điểm`,
        { duration: 5000 }
      );
    },
    onError: (error: Error) => {
      console.error('Error submitting score:', error);
      toast.error(`Lỗi: ${error.message}`);
    },
  });

  const confirmResult = useMutation({
    mutationFn: async ({
      challengeId,
      isChallenger,
    }: {
      challengeId: string;
      isChallenger: boolean;
    }) => {
      toast.success('Kết quả đã được xác nhận!');
      return { success: true };
    },
  });

  const sendMessage = useMutation({
    mutationFn: async ({
      challengeId,
      message,
    }: {
      challengeId: string;
      message: string;
    }) => {
      return { success: true };
    },
  });

  const acceptChallenge = useMutation({
    mutationFn: async ({
      challengeId,
      scheduledTime,
    }: {
      challengeId: string;
      scheduledTime?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('accept_challenge', {
        p_challenge_id: challengeId,
        p_user_id: user.id,
      });

      if (error) throw error;
      if (!data) return null;

      // Safe type checking after null check
      const result = data as any;
      if (
        result &&
        typeof result === 'object' &&
        'error' in result &&
        result.error
      ) {
        throw new Error(result.error as string);
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      toast.success('Thách đấu đã được chấp nhận!');
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });

  const scheduleChallenge = useMutation({
    mutationFn: async ({
      challengeId,
      scheduledTime,
    }: {
      challengeId: string;
      scheduledTime: string;
    }) => {
      // Update challenge with scheduled time
      const { data, error } = await supabase
        .from('challenges')
        .update({
          scheduled_time: scheduledTime,
          status: 'accepted',
        })
        .eq('id', challengeId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      toast.success('Lịch thi đấu đã được cập nhật!');
    },
  });

  return {
    getChallengeMatch,
    getChallengeConversations,
    startMatch: startMatch.mutateAsync,
    submitScore: submitScore.mutateAsync,
    confirmResult: confirmResult.mutateAsync,
    sendMessage: sendMessage.mutateAsync,
    acceptChallenge: acceptChallenge.mutateAsync,
    scheduleChallenge: scheduleChallenge.mutateAsync,
    isStartingMatch: startMatch.isPending,
    isSubmittingScore: submitScore.isPending,
    isConfirming: confirmResult.isPending,
    isSendingMessage: sendMessage.isPending,
    isAccepting: acceptChallenge.isPending,
    isScheduling: scheduleChallenge.isPending,
  };
}
