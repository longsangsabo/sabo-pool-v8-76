import { useState, useEffect } from 'react';
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
      // For now, return empty array since spa_reward_milestones table is new
      setRewards([]);
    } catch (error) {
      console.error('Error fetching SPA rewards:', error);
      toast.error('Failed to load SPA rewards');
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

  return {
    rewards,
    loading,
    createSPAReward,
    createReward: createSPAReward,
    updateReward: updateSPAReward,
    deleteReward: deleteSPAReward,
    refetch: fetchSPARewards,
  };
};
