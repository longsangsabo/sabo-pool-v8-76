import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SABOAdvancementResult {
  success: boolean;
  message?: string;
  error?: string;
  matches_processed?: number;
  next_round_setup?: boolean;
}

export const useSABOAdvancement = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const processLosersR101Completion = useCallback(
    async (tournamentId: string): Promise<SABOAdvancementResult> => {
      setIsProcessing(true);
      try {
        console.log(
          '🔄 Processing Losers R101 completion for tournament:',
          tournamentId
        );

        // Use proper repair function for tournament advancement
        const { data, error } = await supabase.rpc(
          'repair_double_elimination_bracket',
          {
            p_tournament_id: tournamentId,
          }
        );

        if (error) {
          console.error('❌ Error in Losers R101 completion:', error);
          toast.error('Lỗi khi xử lý vòng Losers R101');
          return { success: false, error: error.message };
        }

        const result = data as any;
        if (result?.success) {
          console.log('✅ Losers R101 completion successful:', result);
          toast.success('Đã xử lý xong vòng Losers R101!');
          return result as SABOAdvancementResult;
        } else {
          console.log('ℹ️ Losers R101 completion not needed:', result?.message);
          return (result || { success: false }) as SABOAdvancementResult;
        }
      } catch (err: any) {
        console.error('❌ Error in processLosersR101Completion:', err);
        toast.error('Có lỗi xảy ra khi xử lý vòng Losers R101');
        return { success: false, error: err.message };
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  const processLosersR102Completion = useCallback(
    async (tournamentId: string): Promise<SABOAdvancementResult> => {
      setIsProcessing(true);
      try {
        console.log(
          '🔄 Processing Losers R102 completion for tournament:',
          tournamentId
        );

        // Use proper repair function for tournament advancement
        const { data, error } = await supabase.rpc(
          'repair_double_elimination_bracket',
          {
            p_tournament_id: tournamentId,
          }
        );

        if (error) {
          console.error('❌ Error in Losers R102 completion:', error);
          toast.error('Lỗi khi xử lý vòng Losers R102');
          return { success: false, error: error.message };
        }

        const result = data as any;
        if (result?.success) {
          console.log('✅ Losers R102 completion successful:', result);
          toast.success('Đã xử lý xong vòng Losers R102!');
          return result as SABOAdvancementResult;
        } else {
          console.log('ℹ️ Losers R102 completion not needed:', result?.message);
          return (result || { success: false }) as SABOAdvancementResult;
        }
      } catch (err: any) {
        console.error('❌ Error in processLosersR102Completion:', err);
        toast.error('Có lỗi xảy ra khi xử lý vòng Losers R102');
        return { success: false, error: err.message };
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  const processLosersR103Completion = useCallback(
    async (tournamentId: string): Promise<SABOAdvancementResult> => {
      setIsProcessing(true);
      try {
        console.log(
          '🔄 Processing Losers R103 completion for tournament:',
          tournamentId
        );

        // Use proper repair function for tournament advancement
        const { data, error } = await supabase.rpc(
          'repair_double_elimination_bracket',
          {
            p_tournament_id: tournamentId,
          }
        );

        if (error) {
          console.error('❌ Error in Losers R103 completion:', error);
          toast.error('Lỗi khi xử lý vòng Losers R103');
          return { success: false, error: error.message };
        }

        const result = data as any;
        if (result?.success) {
          console.log('✅ Losers R103 completion successful:', result);
          toast.success('Đã xử lý xong vòng Losers R103!');
          return result as SABOAdvancementResult;
        } else {
          console.log('ℹ️ Losers R103 completion not needed:', result?.message);
          return (result || { success: false }) as SABOAdvancementResult;
        }
      } catch (err: any) {
        console.error('❌ Error in processLosersR103Completion:', err);
        toast.error('Có lỗi xảy ra khi xử lý vòng Losers R103');
        return { success: false, error: err.message };
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  const processLosersR201Completion = useCallback(
    async (tournamentId: string): Promise<SABOAdvancementResult> => {
      setIsProcessing(true);
      try {
        console.log(
          '🔄 Processing Losers R201 completion for tournament:',
          tournamentId
        );

        // Use proper repair function for tournament advancement
        const { data, error } = await supabase.rpc(
          'repair_double_elimination_bracket',
          {
            p_tournament_id: tournamentId,
          }
        );

        if (error) {
          console.error('❌ Error in Losers R201 completion:', error);
          toast.error('Lỗi khi xử lý vòng Losers R201');
          return { success: false, error: error.message };
        }

        const result = data as any;
        if (result?.success) {
          console.log('✅ Losers R201 completion successful:', result);
          toast.success('Đã xử lý xong vòng Losers R201!');
          return result as SABOAdvancementResult;
        } else {
          console.log('ℹ️ Losers R201 completion not needed:', result?.message);
          return (result || { success: false }) as SABOAdvancementResult;
        }
      } catch (err: any) {
        console.error('❌ Error in processLosersR201Completion:', err);
        toast.error('Có lỗi xảy ra khi xử lý vòng Losers R201');
        return { success: false, error: err.message };
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  const processLosersR202Completion = useCallback(
    async (tournamentId: string): Promise<SABOAdvancementResult> => {
      setIsProcessing(true);
      try {
        console.log(
          '🔄 Processing Losers R202 completion for tournament:',
          tournamentId
        );

        // Use proper repair function for tournament advancement
        const { data, error } = await supabase.rpc(
          'repair_double_elimination_bracket',
          {
            p_tournament_id: tournamentId,
          }
        );

        if (error) {
          console.error('❌ Error in Losers R202 completion:', error);
          toast.error('Lỗi khi xử lý vòng Losers R202');
          return { success: false, error: error.message };
        }

        const result = data as any;
        if (result?.success) {
          console.log('✅ Losers R202 completion successful:', result);
          toast.success('Đã xử lý xong vòng Losers R202!');
          return result as SABOAdvancementResult;
        } else {
          console.log('ℹ️ Losers R202 completion not needed:', result?.message);
          return (result || { success: false }) as SABOAdvancementResult;
        }
      } catch (err: any) {
        console.error('❌ Error in processLosersR202Completion:', err);
        toast.error('Có lỗi xảy ra khi xử lý vòng Losers R202');
        return { success: false, error: err.message };
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  const setupSemifinalsPairings = useCallback(
    async (tournamentId: string): Promise<SABOAdvancementResult> => {
      setIsProcessing(true);
      try {
        console.log(
          '🔄 Setting up semifinals pairings for tournament:',
          tournamentId
        );

        // Use proper repair function for tournament advancement
        const { data, error } = await supabase.rpc(
          'repair_double_elimination_bracket',
          {
            p_tournament_id: tournamentId,
          }
        );

        if (error) {
          console.error('❌ Error in semifinals setup:', error);
          toast.error('Lỗi khi thiết lập trận bán kết');
          return { success: false, error: error.message };
        }

        const result = data as any;
        if (result?.success) {
          console.log('✅ Semifinals setup successful:', result);
          toast.success('Đã thiết lập trận bán kết!');
          return result as SABOAdvancementResult;
        } else {
          console.log('ℹ️ Semifinals setup not needed:', result?.message);
          return (result || { success: false }) as SABOAdvancementResult;
        }
      } catch (err: any) {
        console.error('❌ Error in setupSemifinalsPairings:', err);
        toast.error('Có lỗi xảy ra khi thiết lập trận bán kết');
        return { success: false, error: err.message };
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  const processSemifinalsCompletion = useCallback(
    async (tournamentId: string): Promise<SABOAdvancementResult> => {
      setIsProcessing(true);
      try {
        console.log(
          '🔄 Processing semifinals completion for tournament:',
          tournamentId
        );

        // Use proper repair function for tournament advancement
        const { data, error } = await supabase.rpc(
          'repair_double_elimination_bracket',
          {
            p_tournament_id: tournamentId,
          }
        );

        if (error) {
          console.error('❌ Error in semifinals completion:', error);
          toast.error('Lỗi khi xử lý kết quả bán kết');
          return { success: false, error: error.message };
        }

        const result = data as any;
        if (result?.success) {
          console.log('✅ Semifinals completion successful:', result);
          toast.success('Đã xử lý xong kết quả bán kết!');
          return result as SABOAdvancementResult;
        } else {
          console.log('ℹ️ Semifinals completion not needed:', result?.message);
          return (result || { success: false }) as SABOAdvancementResult;
        }
      } catch (err: any) {
        console.error('❌ Error in processSemifinalsCompletion:', err);
        toast.error('Có lỗi xảy ra khi xử lý kết quả bán kết');
        return { success: false, error: err.message };
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  const finalizeTournament = useCallback(
    async (tournamentId: string): Promise<SABOAdvancementResult> => {
      setIsProcessing(true);
      try {
        console.log('🔄 Finalizing tournament:', tournamentId);

        // Use proper repair function for tournament advancement
        const { data, error } = await supabase.rpc(
          'repair_double_elimination_bracket',
          {
            p_tournament_id: tournamentId,
          }
        );

        if (error) {
          console.error('❌ Error in tournament finalization:', error);
          toast.error('Lỗi khi hoàn thiện giải đấu');
          return { success: false, error: error.message };
        }

        const result = data as any;
        if (result?.success) {
          console.log('✅ Tournament finalization successful:', result);
          toast.success('Đã hoàn thiện giải đấu!');
          return result as SABOAdvancementResult;
        } else {
          console.log(
            'ℹ️ Tournament finalization not needed:',
            result?.message
          );
          return (result || { success: false }) as SABOAdvancementResult;
        }
      } catch (err: any) {
        console.error('❌ Error in finalizeTournament:', err);
        toast.error('Có lỗi xảy ra khi hoàn thiện giải đấu');
        return { success: false, error: err.message };
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  const updateTournamentStatus = useCallback(
    async (tournamentId: string): Promise<SABOAdvancementResult> => {
      setIsProcessing(true);
      try {
        console.log('🔄 Updating tournament status:', tournamentId);

        // Use proper repair function for tournament advancement
        const { data, error } = await supabase.rpc(
          'repair_double_elimination_bracket',
          {
            p_tournament_id: tournamentId,
          }
        );

        if (error) {
          console.error('❌ Error in tournament status update:', error);
          toast.error('Lỗi khi cập nhật trạng thái giải đấu');
          return { success: false, error: error.message };
        }

        const result = data as any;
        if (result?.success) {
          console.log('✅ Tournament status update successful:', result);
          return result as SABOAdvancementResult;
        } else {
          console.log(
            'ℹ️ Tournament status update not needed:',
            result?.message
          );
          return (result || { success: false }) as SABOAdvancementResult;
        }
      } catch (err: any) {
        console.error('❌ Error in updateTournamentStatus:', err);
        toast.error('Có lỗi xảy ra khi cập nhật trạng thái giải đấu');
        return { success: false, error: err.message };
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  const processComprehensiveAdvancement = useCallback(
    async (tournamentId: string) => {
      if (!tournamentId) return;

      setIsProcessing(true);
      try {
        console.log(
          '🤖 Processing comprehensive SABO advancement for tournament:',
          tournamentId
        );

        // Process losers bracket completions sequentially
        const r101Result = await processLosersR101Completion(tournamentId);
        const r102Result = await processLosersR102Completion(tournamentId);
        const r103Result = await processLosersR103Completion(tournamentId);
        const r201Result = await processLosersR201Completion(tournamentId);
        const r202Result = await processLosersR202Completion(tournamentId);

        // Setup semifinals if ready
        const semifinalsSetupResult =
          await setupSemifinalsPairings(tournamentId);

        // Process semifinals completion if ready
        const semifinalsCompletionResult =
          await processSemifinalsCompletion(tournamentId);

        // Finalize tournament if ready
        const finalizationResult = await finalizeTournament(tournamentId);

        // Update tournament status
        const statusUpdateResult = await updateTournamentStatus(tournamentId);

        return {
          losers_r101: r101Result,
          losers_r102: r102Result,
          losers_r103: r103Result,
          losers_r201: r201Result,
          losers_r202: r202Result,
          semifinals_setup: semifinalsSetupResult,
          semifinals_completion: semifinalsCompletionResult,
          finalization: finalizationResult,
          status_update: statusUpdateResult,
        };
      } catch (err: any) {
        console.error('❌ Error in processComprehensiveAdvancement:', err);
        return {
          error: err.message,
        };
      } finally {
        setIsProcessing(false);
      }
    },
    [
      processLosersR101Completion,
      processLosersR102Completion,
      processLosersR103Completion,
      processLosersR201Completion,
      processLosersR202Completion,
      setupSemifinalsPairings,
      processSemifinalsCompletion,
      finalizeTournament,
      updateTournamentStatus,
    ]
  );

  return {
    isProcessing,
    processLosersR101Completion,
    processLosersR102Completion,
    processLosersR103Completion,
    processLosersR201Completion,
    processLosersR202Completion,
    setupSemifinalsPairings,
    processSemifinalsCompletion,
    finalizeTournament,
    updateTournamentStatus,
    processComprehensiveAdvancement,
  };
};
