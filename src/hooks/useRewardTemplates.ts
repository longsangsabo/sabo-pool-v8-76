import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TournamentRewards } from '@/types/tournament-extended';

interface RewardTemplate {
  id: string;
  name: string;
  max_participants: number;
  tournament_type: string;
  rank_category: string;
  reward_structure: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useRewardTemplates = () => {
  const queryClient = useQueryClient();

  // Fetch reward templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['reward-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tournament_reward_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reward templates:', error);
        throw error;
      }
      return data as RewardTemplate[];
    },
  });

  // Convert template to TournamentRewards format
  const convertTemplatesToRewards = (
    templates: RewardTemplate[]
  ): TournamentRewards => {
    if (templates.length === 0) {
      return {
        totalPrize: 0,
        showPrizes: false,
        positions: [],
        specialAwards: [],
      };
    }

    const template = templates[0]; // Use the first active template
    const rewardStructure = template.reward_structure as any;

    return {
      totalPrize: rewardStructure?.totalPrize || 0,
      showPrizes: rewardStructure?.showPrizes || false,
      positions: rewardStructure?.positions || [],
      specialAwards: rewardStructure?.specialAwards || [],
    };
  };

  // Save template mutation
  const saveTemplateMutation = useMutation({
    mutationFn: async (rewards: TournamentRewards) => {
      // Clear existing templates
      await supabase
        .from('tournament_reward_templates')
        .delete()
        .eq('is_active', true);

      // Insert new template
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User must be authenticated to create templates');
      }

      const templateData = {
        name: 'Default Reward Template',
        max_participants: 16,
        tournament_type: 'elimination',
        rank_category: 'all',
        reward_structure: rewards as any,
        is_active: true,
        created_by: user.id,
      };

      const { data, error } = await supabase
        .from('tournament_reward_templates')
        .insert([templateData])
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reward-templates'] });
      toast.success('Đã lưu template phần thưởng thành công!');
    },
    onError: error => {
      console.error('Failed to save reward template:', error);
      toast.error('Lỗi khi lưu template phần thưởng. Vui lòng thử lại.');
    },
  });

  // Copy template to tournament prize tiers
  const copyTemplateToTournament = async (
    tournamentId: string,
    rewards: TournamentRewards
  ) => {
    try {
      // Clear existing prize tiers
      await supabase
        .from('tournament_prize_tiers')
        .delete()
        .eq('tournament_id', tournamentId);

      // Insert new prize tiers
      const prizeData = rewards.positions.map(position => ({
        tournament_id: tournamentId,
        position: position.position,
        position_name: position.name,
        cash_amount: position.cashPrize || 0,
        elo_points: position.eloPoints || 0,
        spa_points: position.spaPoints || 0,
        is_visible: position.isVisible !== false,
        physical_items: position.items || [],
      }));

      const { error } = await supabase
        .from('tournament_prize_tiers')
        .insert(prizeData);

      if (error) throw error;

      toast.success('Đã áp dụng template vào giải đấu!');
      return true;
    } catch (error) {
      console.error('Failed to copy template to tournament:', error);
      toast.error('Lỗi khi áp dụng template vào giải đấu');
      return false;
    }
  };

  return {
    templates,
    isLoading,
    saveTemplate: saveTemplateMutation.mutate,
    isSaving: saveTemplateMutation.isPending,
    convertTemplatesToRewards,
    copyTemplateToTournament,
    refetch: () =>
      queryClient.invalidateQueries({ queryKey: ['reward-templates'] }),
  };
};
