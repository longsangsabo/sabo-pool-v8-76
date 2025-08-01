import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface TournamentReward {
  id: string;
  position_name: string;
  tournament_type: string;
  rank_category: string;
  spa_reward: number;
  elo_reward: number;
  additional_rewards?: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useTournamentRewards = () => {
  const queryClient = useQueryClient();

  // Fetch tournament reward templates (global configurations)
  const { data: rewards = [], isLoading: loading } = useQuery({
    queryKey: ['tournament-reward-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tournament_reward_templates')
        .select('*')
        .eq('is_active', true)
        .order('tournament_type', { ascending: true });

      if (error) {
        console.error('Error fetching tournament rewards:', error);
        throw error;
      }
      return data as any; // Type will be matched by interface mapping
    },
  });

  const fetchRewards = async () => {
    queryClient.invalidateQueries({
      queryKey: ['tournament-reward-templates'],
    });
  };

  const createRewardMutation = useMutation({
    mutationFn: async (
      rewardData: Omit<TournamentReward, 'id' | 'created_at' | 'updated_at'>
    ) => {
      const { data, error } = await supabase
        .from('tournament_reward_templates')
        .insert(rewardData as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['tournament-reward-templates'],
      });
      toast({
        title: 'Success',
        description: 'Tournament reward structure created successfully',
      });
    },
    onError: error => {
      console.error('Error creating tournament reward:', error);
      toast({
        title: 'Error',
        description: 'Failed to create tournament reward structure',
        variant: 'destructive',
      });
    },
  });

  const createReward = createRewardMutation.mutate;

  const updateRewardMutation = useMutation({
    mutationFn: async ({
      id,
      ...rewardData
    }: Partial<TournamentReward> & { id: string }) => {
      const { data, error } = await supabase
        .from('tournament_reward_templates')
        .update(rewardData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['tournament-reward-templates'],
      });
      toast({
        title: 'Success',
        description: 'Tournament reward structure updated successfully',
      });
    },
    onError: error => {
      console.error('Error updating tournament reward:', error);
      toast({
        title: 'Error',
        description: 'Failed to update tournament reward structure',
        variant: 'destructive',
      });
    },
  });

  const updateReward = (id: string, rewardData: Partial<TournamentReward>) => {
    updateRewardMutation.mutate({ id, ...rewardData });
  };

  const deleteRewardMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tournament_reward_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['tournament-reward-templates'],
      });
      toast({
        title: 'Success',
        description: 'Tournament reward structure deleted successfully',
      });
    },
    onError: error => {
      console.error('Error deleting tournament reward:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete tournament reward structure',
        variant: 'destructive',
      });
    },
  });

  const deleteReward = deleteRewardMutation.mutate;

  return {
    rewards,
    loading,
    createReward,
    updateReward,
    deleteReward,
    refetch: fetchRewards,
    isCreating: createRewardMutation.isPending,
    isUpdating: updateRewardMutation.isPending,
    isDeleting: deleteRewardMutation.isPending,
  };
};
