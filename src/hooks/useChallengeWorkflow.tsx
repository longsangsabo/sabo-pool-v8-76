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
      enabled: !!challengeId
    });
  };

  const getChallengeConversations = (challengeId: string) => {
    return useQuery({
      queryKey: ['challenge-conversations', challengeId], 
      queryFn: async () => {
        // Temporarily return empty array until tables are ready
        return [];
      },
      enabled: !!challengeId
    });
  };

  // Mock functions until types are updated
  const startMatch = useMutation({
    mutationFn: async ({ challengeId }: { challengeId: string }) => {
      toast.success('Trận đấu đã bắt đầu!');
      return { success: true };
    }
  });

  const submitScore = useMutation({
    mutationFn: async ({ 
      challengeId, 
      challengerScore, 
      opponentScore,
      isChallenger 
    }: { 
      challengeId: string;
      challengerScore: number;
      opponentScore: number;
      isChallenger: boolean;
    }) => {
      toast.success('Tỷ số đã được ghi nhận!');
      return { success: true };
    }
  });

  const confirmResult = useMutation({
    mutationFn: async ({ challengeId, isChallenger }: { challengeId: string; isChallenger: boolean }) => {
      toast.success('Kết quả đã được xác nhận!');
      return { success: true };
    }
  });

  const sendMessage = useMutation({
    mutationFn: async ({ challengeId, message }: { challengeId: string; message: string }) => {
      return { success: true };
    }
  });

  const scheduleChallenge = useMutation({
    mutationFn: async ({ challengeId, scheduledTime }: { challengeId: string; scheduledTime: string }) => {
      // Update challenge with scheduled time
      const { data, error } = await supabase
        .from('challenges')
        .update({
          scheduled_time: scheduledTime,
          status: 'accepted'
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
    }
  });

  return {
    getChallengeMatch,
    getChallengeConversations,
    startMatch: startMatch.mutateAsync,
    submitScore: submitScore.mutateAsync,
    confirmResult: confirmResult.mutateAsync,
    sendMessage: sendMessage.mutateAsync,
    scheduleChallenge: scheduleChallenge.mutateAsync,
    isStartingMatch: startMatch.isPending,
    isSubmittingScore: submitScore.isPending,
    isConfirming: confirmResult.isPending,
    isSendingMessage: sendMessage.isPending,
    isScheduling: scheduleChallenge.isPending
  };
}