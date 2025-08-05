import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface RewardOption {
  id: string;
  type: string;
  title: string;
  name: string;
  description: string;
  points_cost: number;
  available: boolean;
  icon: string;
}

export const useRewards = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const redeemReward = async (
    rewardType: string,
    rewardValue: string,
    pointsCost: number
  ) => {
    if (!user) {
      toast.error('Please log in to redeem rewards');
      return false;
    }

    try {
      setLoading(true);

      // For now, simulate the redemption
      toast.success('Reward redeemed successfully!');
      return true;
    } catch (error) {
      console.error('Error redeeming reward:', error);
      toast.error('Failed to redeem reward');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getAvailableRewards = (): RewardOption[] => {
    return [
      {
        id: '1',
        type: 'voucher',
        title: '50k VND Voucher',
        name: '50k VND Voucher',
        description: 'Voucher 50,000 VND cho game time',
        points_cost: 500,
        available: true,
        icon: 'Gift',
      },
      {
        id: '2',
        type: 'voucher',
        title: '100k VND Voucher',
        name: '100k VND Voucher',
        description: 'Voucher 100,000 VND cho game time',
        points_cost: 1000,
        available: true,
        icon: 'Gift',
      },
    ];
  };

  return {
    loading,
    redeemReward,
    getAvailableRewards,
    availableRewards: getAvailableRewards(),
    redemptions: [],
    isRedeeming: loading,
  };
};
