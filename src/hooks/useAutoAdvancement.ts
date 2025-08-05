import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSABOAdvancement } from './useSABOAdvancement';

export interface AutoAdvancementResult {
  success: boolean;
  message?: string;
  error?: string;
  semifinal_matches_created?: number;
  final_matches_created?: number;
  winners_bracket_winners?: string[];
  loser_branch_a_winner?: string;
  loser_branch_b_winner?: string;
  semifinal_winners?: string[];
}

export const useAutoAdvancement = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const {
    setupSemifinalsPairings,
    processSemifinalsCompletion,
    finalizeTournament,
    processComprehensiveAdvancement,
    isProcessing: isSABOProcessing,
  } = useSABOAdvancement();

  const advanceToSemifinal = useCallback(
    async (tournamentId: string): Promise<AutoAdvancementResult> => {
      setIsProcessing(true);
      try {
        console.log(
          '🔄 Auto advancing to semifinal for tournament:',
          tournamentId
        );

        const result = await setupSemifinalsPairings(tournamentId);

        if (result.success) {
          console.log('✅ Semifinal auto advancement successful:', result);
          toast.success(
            `Đã thiết lập ${result.matches_processed || 2} trận bán kết!`
          );
          return {
            success: true,
            message: result.message,
            semifinal_matches_created: result.matches_processed,
          } as AutoAdvancementResult;
        } else {
          console.log('ℹ️ Semifinal advancement not needed:', result?.message);
          return {
            success: false,
            error: result.error,
          } as AutoAdvancementResult;
        }
      } catch (err: any) {
        console.error('❌ Error in advanceToSemifinal:', err);
        toast.error('Có lỗi xảy ra khi tự động tạo trận bán kết');
        return { success: false, error: err.message };
      } finally {
        setIsProcessing(false);
      }
    },
    [setupSemifinalsPairings]
  );

  const advanceToFinal = useCallback(
    async (tournamentId: string): Promise<AutoAdvancementResult> => {
      setIsProcessing(true);
      try {
        console.log('🔄 Auto advancing to final for tournament:', tournamentId);

        // First try to process semifinals completion
        const semifinalsResult =
          await processSemifinalsCompletion(tournamentId);

        // Then try to finalize tournament
        const finalResult = await finalizeTournament(tournamentId);

        if (finalResult.success) {
          console.log('✅ Final auto advancement successful:', finalResult);
          toast.success('Đã hoàn thiện trận chung kết!');
          return {
            success: true,
            message: finalResult.message,
            final_matches_created: finalResult.matches_processed,
          } as AutoAdvancementResult;
        } else {
          console.log('ℹ️ Final advancement not needed:', finalResult?.message);
          return {
            success: false,
            error: finalResult.error,
          } as AutoAdvancementResult;
        }
      } catch (err: any) {
        console.error('❌ Error in advanceToFinal:', err);
        toast.error('Có lỗi xảy ra khi tự động tạo trận chung kết');
        return { success: false, error: err.message };
      } finally {
        setIsProcessing(false);
      }
    },
    [processSemifinalsCompletion, finalizeTournament]
  );

  const processAutomaticAdvancement = useCallback(
    async (tournamentId: string) => {
      if (!tournamentId) return;

      setIsProcessing(true);
      try {
        console.log(
          '🤖 Processing automatic advancement for tournament:',
          tournamentId
        );

        // Use comprehensive SABO advancement that processes all stages
        const result = await processComprehensiveAdvancement(tournamentId);

        return result;
      } catch (err: any) {
        console.error('❌ Error in processAutomaticAdvancement:', err);
        return {
          error: err.message,
        };
      } finally {
        setIsProcessing(false);
      }
    },
    [processComprehensiveAdvancement]
  );

  return {
    isProcessing: isProcessing || isSABOProcessing,
    advanceToSemifinal,
    advanceToFinal,
    processAutomaticAdvancement,
  };
};
