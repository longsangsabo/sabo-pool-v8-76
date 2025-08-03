import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MatchScore {
  player1: number;
  player2: number;
}

export const useSABOScoreSubmission = (
  tournamentId: string,
  onRefresh?: () => void
) => {
  const queryClient = useQueryClient();

  const submitScoreMutation = useMutation({
    mutationFn: async ({
      matchId,
      scores,
    }: {
      matchId: string;
      scores: MatchScore;
    }) => {
      console.log('🎯 Submitting SABO match score:', { matchId, scores });

      // Get current user for submitted_by parameter
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User must be authenticated to submit scores');
      }

      // Use the new SABO score submission function
      console.log('🔍 CALLING submit_sabo_match_score with params:', {
        p_match_id: matchId,
        p_player1_score: scores.player1,
        p_player2_score: scores.player2,
        p_submitted_by: user.id,
      });

      const { data, error } = await supabase.rpc('submit_sabo_match_score', {
        p_match_id: matchId,
        p_player1_score: scores.player1,
        p_player2_score: scores.player2,
        p_submitted_by: user.id,
      });

      console.log('🔍 RPC Response:', { data, error });

      if (error) {
        console.error('❌ SABO score submission failed:', error);
        throw error;
      }

      console.log('✅ SABO score submitted successfully:', data);
      return data;
    },
    onSuccess: (data, variables) => {
      console.log('✅ SABO score submission successful:', data);

      // ✅ AGGRESSIVE CACHE INVALIDATION - Force refresh all tournament data
      queryClient.invalidateQueries({ queryKey: ['tournament-matches'] });
      queryClient.invalidateQueries({ queryKey: ['sabo-tournament'] });
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      queryClient.invalidateQueries({ queryKey: ['tournament'] }); // Additional key

      // ✅ FIXED: Handle JSONB response format correctly
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const result = data as any;
        if (result.success) {
          toast.success(result.message || '🎯 Score submitted successfully!');
        } else {
          toast.error(
            `❌ ${result.error || result.message || 'Failed to submit score'}`
          );
        }
      } else {
        toast.success('🎯 Score submitted successfully!');
      }

      // ✅ CRITICAL: Force immediate refresh with scroll preservation
      setTimeout(() => {
        // Use provided refresh callback if available (should preserve scroll)
        if (onRefresh) {
          console.log(
            '🔄 Calling provided refresh callback with scroll preservation'
          );
          onRefresh();
        } else {
          // Fallback: just invalidate queries without scroll preservation
          queryClient.refetchQueries({ queryKey: ['tournament-matches'] });
          queryClient.refetchQueries({ queryKey: ['sabo-tournament'] });
        }
      }, 50); // Faster response for immediate feedback

      // ✅ ADDITIONAL: Force window refresh as emergency fallback if needed
      // Uncomment the line below if UI still doesn't update
      // setTimeout(() => window.location.reload(), 1000);
    },
    onError: (error: any) => {
      console.error('❌ SABO score submission failed:', error);

      // Show specific error message if available
      const errorMessage = error?.message || 'Failed to submit score';
      toast.error(`❌ ${errorMessage}`);
    },
  });

  const submitScore = useCallback(
    async (matchId: string, scores: MatchScore) => {
      return submitScoreMutation.mutateAsync({ matchId, scores });
    },
    [submitScoreMutation]
  );

  return {
    submitScore,
    isSubmitting: submitScoreMutation.isPending,
  };
};
