import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  callTournamentFunction,
  TOURNAMENT_FUNCTIONS,
  getFunctionForTournamentType,
} from '@/services/tournament/TournamentFunctionResolver';
import { TournamentAtomicOperations } from '@/services/tournament/TournamentTransactionService';

export interface BracketValidation {
  valid: boolean;
  reason?: string;
  participant_count?: number;
  bracket_exists?: boolean;
  tournament_type?: string;
}

export interface BracketGenerationResult {
  success?: boolean;
  error?: string;
  bracket_id?: string;
  participant_count?: number;
  bracket_size?: number;
  rounds?: number;
  matches_created?: number;
  bracket_data?: any;
}

export interface SeedingOptions {
  method: 'elo_ranking' | 'registration_order' | 'random';
  forceRegenerate?: boolean;
}

export const useBracketGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const validateTournament = useCallback(
    async (tournamentId: string): Promise<BracketValidation> => {
      setIsValidating(true);
      try {
        const { data, error } = await callTournamentFunction(
          TOURNAMENT_FUNCTIONS.VALIDATE_BRACKET,
          { p_tournament_id: tournamentId }
        );

        if (error) {
          console.error('Error validating tournament:', error);
          return { valid: false, reason: error.message || 'Validation failed' };
        }

        return data as any as BracketValidation;
      } catch (error) {
        console.error('Error in validateTournament:', error);
        return { valid: false, reason: 'Validation error' };
      } finally {
        setIsValidating(false);
      }
    },
    []
  );

  const generateBracket = useCallback(
    async (
      tournamentId: string,
      options: SeedingOptions = { method: 'elo_ranking' }
    ): Promise<BracketGenerationResult> => {
      setIsGenerating(true);

      try {
        // Get current user for transaction context
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          toast.error('Bạn cần đăng nhập để tạo bảng đấu');
          return { error: 'Authentication required' };
        }

        // Get tournament info to determine type
        const { data: tournament, error: tournamentError } = await supabase
          .from('tournaments')
          .select('tournament_type')
          .eq('id', tournamentId)
          .single();

        if (tournamentError) {
          console.error('Error fetching tournament:', tournamentError);
          toast.error('Không thể lấy thông tin giải đấu');
          return { error: tournamentError.message };
        }

        // Use SABO double elimination function with proper initialization
        if (tournament.tournament_type === 'double_elimination') {
          // Get confirmed participants for SABO initialization
          const { data: registrations, error: regError } = await supabase
            .from('tournament_registrations')
            .select('user_id')
            .eq('tournament_id', tournamentId)
            .eq('payment_status', 'paid')
            .limit(16);

          if (regError || !registrations || registrations.length !== 16) {
            toast.error(
              `SABO Double Elimination cần đúng 16 người chơi đã thanh toán. Hiện có: ${registrations?.length || 0}`
            );
            return { error: 'Insufficient participants' };
          }

          const playerIds = registrations.map(r => r.user_id);

          const { data, error } = await supabase.rpc(
            'initialize_sabo_tournament',
            {
              p_tournament_id: tournamentId,
              p_player_ids: playerIds,
            }
          );

          if (error) {
            console.error('Error initializing SABO tournament:', error);
            toast.error('Không thể khởi tạo giải đấu SABO');
            return { error: error.message };
          }

          const resultData = data as any;
          if (resultData?.success) {
            const successMessage = `Đã khởi tạo giải đấu SABO thành công! ${resultData.matches_created || 27} trận đấu được tạo.`;
            toast.success(successMessage);

            // Send notification
            try {
              await supabase.rpc('send_enhanced_notification', {
                p_user_id: user.id,
                p_title: 'Giải đấu SABO đã được khởi tạo',
                p_message: `Giải đấu SABO với 27 trận đấu đã được khởi tạo thành công`,
                p_type: 'tournament',
              });
            } catch (notificationError) {
              console.error('Notification error:', notificationError);
            }
          }

          return resultData as BracketGenerationResult;
        } else {
          // Use atomic operations for single elimination
          const result = await TournamentAtomicOperations.generateBracket(
            tournamentId,
            user.id,
            tournament.tournament_type as
              | 'single_elimination'
              | 'double_elimination',
            {
              seeding_method: options.method,
              force_regenerate: options.forceRegenerate || false,
              function_name: 'generate_complete_tournament_bracket',
            }
          );

          if (!result.success) {
            toast.error(result.error || 'Không thể tạo bảng đấu');
            return { error: result.error };
          }

          const data = result.data as any;

          if (data?.error) {
            toast.error(data.error);
            return { error: data.error };
          }

          if (data?.success) {
            const successMessage = `Đã tạo bảng đấu thành công! ${data.matches_created || data.total_matches} trận đấu được tạo.`;
            toast.success(successMessage);

            // Send notification using enhanced notification system
            try {
              await supabase.rpc('send_enhanced_notification', {
                p_user_id: user.id,
                p_title: 'Bảng đấu đã được tạo',
                p_message: `Bảng đấu giải Tournament đã được tạo với ${data.matches_created || data.total_matches || 0} trận đấu`,
                p_type: 'tournament',
              });
            } catch (notificationError) {
              console.error('Notification error:', notificationError);
            }
          }

          return data as BracketGenerationResult;
        }
      } catch (error) {
        console.error('Error in generateBracket:', error);
        toast.error('Có lỗi xảy ra khi tạo bảng đấu');
        return { error: 'Generation failed' };
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  const reseedTournament = useCallback(
    async (
      tournamentId: string,
      seedingMethod:
        | 'elo_ranking'
        | 'registration_order'
        | 'random' = 'elo_ranking'
    ): Promise<BracketGenerationResult> => {
      setIsGenerating(true);
      try {
        // Since reseed_tournament doesn't exist, just regenerate the bracket
        console.log('Reseeding tournament by regenerating bracket');
        const result = await generateBracket(tournamentId, {
          method: seedingMethod,
          forceRegenerate: true,
        });

        if (result.success) {
          toast.success('Đã sắp xếp lại thứ tự thành công!');
        }

        return result;
      } catch (error) {
        console.error('Error in reseedTournament:', error);
        toast.error('Có lỗi xảy ra khi sắp xếp lại');
        return { error: 'Reseeding failed' };
      } finally {
        setIsGenerating(false);
      }
    },
    [generateBracket]
  );

  const fetchBracketData = useCallback(async (tournamentId: string) => {
    try {
      const { data, error } = await supabase
        .from('tournament_brackets')
        .select('*')
        .eq('tournament_id', tournamentId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching bracket data:', error);
      return null;
    }
  }, []);

  const fetchSeeding = useCallback(async (tournamentId: string) => {
    try {
      // Since tournament_seeding doesn't exist, get from tournament_registrations
      const { data, error } = await supabase
        .from('tournament_registrations')
        .select(
          `
          user_id,
          tournament_id,
          profiles!inner(
            user_id,
            full_name,
            display_name,
            avatar_url
          )
        `
        )
        .eq('tournament_id', tournamentId)
        .eq('payment_status', 'paid')
        .order('registration_date');

      if (error) throw error;

      // Transform to seeding format
      return (
        data?.map((reg, index) => ({
          tournament_id: reg.tournament_id,
          user_id: reg.user_id,
          seed_position: index + 1,
          player: reg.profiles,
        })) || []
      );
    } catch (error) {
      console.error('Error fetching seeding:', error);
      return [];
    }
  }, []);

  return {
    isGenerating,
    isValidating,
    validateTournament,
    generateBracket,
    reseedTournament,
    fetchBracketData,
    fetchSeeding,
  };
};
