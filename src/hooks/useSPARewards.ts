import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SPAReward {
  id: string;
  milestone_name: string;
  milestone_type: string;
  requirement_value: number;
  spa_reward: number;
  bonus_conditions: any;
  is_active: boolean;
  is_repeatable: boolean;
  created_at: string;
  updated_at: string;
}

export const useSPARewards = () => {
  const [rewards, setRewards] = useState<SPAReward[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSPARewards = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('spa_reward_milestones')
        .select('*')
        .order('requirement_value', { ascending: true });

      if (error) throw error;
      setRewards(data || []);
    } catch (error) {
      console.error('Error fetching SPA rewards:', error);
      // Return empty array if table doesn't exist yet
      setRewards([]);
    } finally {
      setLoading(false);
    }
  };

  const createSPAReward = async (
    reward: Omit<SPAReward, 'id' | 'created_at' | 'updated_at'>
  ) => {
    try {
      // For now, just simulate creation
      toast.success('SPA reward created successfully');
      return true;
    } catch (error) {
      console.error('Error creating SPA reward:', error);
      toast.error('Failed to create SPA reward');
      return false;
    }
  };

  const updateSPAReward = async (
    id: string,
    reward: Omit<SPAReward, 'id' | 'created_at' | 'updated_at'>
  ) => {
    try {
      // For now, just simulate update
      toast.success('SPA reward updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating SPA reward:', error);
      toast.error('Failed to update SPA reward');
      return false;
    }
  };

  const deleteSPAReward = async (id: string) => {
    try {
      // For now, just simulate deletion
      toast.success('SPA reward deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting SPA reward:', error);
      toast.error('Failed to delete SPA reward');
      return false;
    }
  };

  useEffect(() => {
    fetchSPARewards();
  }, []);

  const createReward = async (
    rewardData: Omit<SPAReward, 'id' | 'created_at' | 'updated_at'>
  ) => {
    try {
      const { data, error } = await supabase
        .from('spa_reward_milestones')
        .insert([rewardData])
        .select()
        .single();

      if (error) throw error;

      await fetchSPARewards();
      toast.success('SPA reward created successfully');
    } catch (error) {
      console.error('Error creating SPA reward:', error);
      toast.error(
        'Failed to create SPA reward. Make sure the spa_reward_milestones table exists.'
      );
    }
  };

  const updateReward = async (
    id: string,
    rewardData: Partial<Omit<SPAReward, 'id' | 'created_at' | 'updated_at'>>
  ) => {
    try {
      const { error } = await supabase
        .from('spa_reward_milestones')
        .update(rewardData)
        .eq('id', id);

      if (error) throw error;

      await fetchSPARewards();
      toast.success('SPA reward updated successfully');
    } catch (error) {
      console.error('Error updating SPA reward:', error);
      toast.error(
        'Failed to update SPA reward. Make sure the spa_reward_milestones table exists.'
      );
    }
  };

  const deleteReward = async (id: string) => {
    try {
      const { error } = await supabase
        .from('spa_reward_milestones')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchSPARewards();
      toast.success('SPA reward deleted successfully');
    } catch (error) {
      console.error('Error deleting SPA reward:', error);
      toast.error(
        'Failed to delete SPA reward. Make sure the spa_reward_milestones table exists.'
      );
    }
  };

  return {
    rewards,
    loading,
    createReward,
    updateReward,
    deleteReward,
  };
};
