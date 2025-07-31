import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TournamentRewards, RewardPosition } from '@/types/tournament-extended';

interface TournamentPrizeTier {
  id?: string;
  tournament_id: string;
  position: number;
  position_name: string;
  cash_amount?: number;
  elo_points: number;
  spa_points: number;
  is_visible: boolean;
  physical_items?: string[];
}

export function useTournamentRewardsManager(tournamentId: string) {
  const queryClient = useQueryClient();

  // Fetch current tournament prize tiers
  const { data: prizeTiers = [], isLoading } = useQuery({
    queryKey: ['tournament-prize-tiers', tournamentId],
    queryFn: async () => {
      if (!tournamentId || tournamentId.trim() === '') {
        return [];
      }
      
      const { data, error } = await supabase
        .from('tournament_prize_tiers')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('position');
      
      if (error) throw error;
      return data as TournamentPrizeTier[];
    },
    enabled: !!tournamentId && tournamentId.trim() !== ''
  });

  // Convert prize tiers to TournamentRewards format
  const convertToRewardsFormat = (tiers: TournamentPrizeTier[]): TournamentRewards => {
    const positions: RewardPosition[] = tiers.map(tier => ({
      position: tier.position,
      name: tier.position_name,
      eloPoints: tier.elo_points,
      spaPoints: tier.spa_points,
      cashPrize: tier.cash_amount || 0,
      items: tier.physical_items || [],
      isVisible: tier.is_visible
    }));

    const totalPrize = positions.reduce((sum, pos) => sum + pos.cashPrize, 0);

    return {
      totalPrize,
      showPrizes: totalPrize > 0,
      positions,
      specialAwards: []
    };
  };

  // Convert TournamentRewards to prize tiers format
  const convertToPrizeTiers = (rewards: TournamentRewards): Omit<TournamentPrizeTier, 'id'>[] => {
    return rewards.positions.map(position => ({
      tournament_id: tournamentId,
      position: position.position,
      position_name: position.name,
      cash_amount: position.cashPrize || 0,
      elo_points: position.eloPoints || 0,
      spa_points: position.spaPoints || 0,
      is_visible: position.isVisible !== false,
      physical_items: (position.items || []).filter(item => item && item.trim()) // Filter out empty items
    }));
  };

  // Save rewards mutation
  const saveRewardsMutation = useMutation({
    mutationFn: async (rewards: TournamentRewards) => {
      if (!tournamentId || tournamentId.trim() === '') {
        throw new Error('Tournament ID is required to save rewards');
      }
      
      // Start transaction-like operation
      
      // 1. Delete existing prize tiers
      const { error: deleteError } = await supabase
        .from('tournament_prize_tiers')
        .delete()
        .eq('tournament_id', tournamentId);
      
      if (deleteError) throw deleteError;

      // 2. Insert new prize tiers
      if (rewards.positions.length > 0) {
        const newTiers = convertToPrizeTiers(rewards);
        const { error: insertError } = await supabase
          .from('tournament_prize_tiers')
          .insert(newTiers);
        
        if (insertError) throw insertError;
      }

      // Update tournament timestamp for tracking
      const { error: updateError } = await supabase
        .from('tournaments')
        .update({ 
          updated_at: new Date().toISOString()
        })
        .eq('id', tournamentId);
        
      if (updateError) throw updateError;

      return rewards;
    },
    onSuccess: (savedRewards) => {
      // Invalidate and refetch data
      queryClient.invalidateQueries({ queryKey: ['tournament-prize-tiers', tournamentId] });
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      
      toast.success('Đã cập nhật phần thưởng thành công!');
    },
    onError: (error) => {
      console.error('Failed to save rewards:', error);
      toast.error('Lỗi khi lưu phần thưởng. Vui lòng thử lại.');
    }
  });

  // Delete specific position
  const deletePositionMutation = useMutation({
    mutationFn: async (position: number) => {
      const { error } = await supabase
        .from('tournament_prize_tiers')
        .delete()
        .eq('tournament_id', tournamentId)
        .eq('position', position);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament-prize-tiers', tournamentId] });
      toast.success('Đã xóa vị trí thành công!');
    },
    onError: (error) => {
      console.error('Failed to delete position:', error);
      toast.error('Lỗi khi xóa vị trí');
    }
  });

  // Validation functions
  const validateRewards = (rewards: TournamentRewards): string[] => {
    const errors: string[] = [];
    
    // Check for duplicate positions
    const positions = rewards.positions.map(p => p.position);
    const duplicates = positions.filter((pos, index) => positions.indexOf(pos) !== index);
    if (duplicates.length > 0) {
      errors.push(`Vị trí bị trùng: ${duplicates.join(', ')}`);
    }

    // Check if positions are sequential
    const sortedPositions = [...positions].sort((a, b) => a - b);
    for (let i = 0; i < sortedPositions.length; i++) {
      if (sortedPositions[i] !== i + 1) {
        errors.push('Vị trí phải được sắp xếp tuần tự từ 1');
        break;
      }
    }

    // Check if total cash prizes don't exceed total prize
    const totalCashPrizes = rewards.positions.reduce((sum, pos) => sum + (pos.cashPrize || 0), 0);
    if (totalCashPrizes > rewards.totalPrize) {
      errors.push('Tổng tiền thưởng các vị trí vượt quá tổng giải thưởng');
    }

    return errors;
  };

  // Get current rewards in TournamentRewards format
  const currentRewards = convertToRewardsFormat(prizeTiers);

  return {
    // Data
    rewards: currentRewards,
    prizeTiers,
    isLoading,
    
    // Actions
    saveRewards: saveRewardsMutation.mutate,
    deletePosition: deletePositionMutation.mutate,
    
    // Status
    isSaving: saveRewardsMutation.isPending,
    isDeleting: deletePositionMutation.isPending,
    
    // Utilities
    validateRewards,
    convertToRewardsFormat,
    convertToPrizeTiers
  };
}