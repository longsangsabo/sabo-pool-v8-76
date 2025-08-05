import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface LoyaltyPoint {
  id: string;
  user_id: string;
  points: number;
  transaction_type: 'earned' | 'spent';
  source: string;
  description: string;
  metadata?: any;
  created_at: string;
}

export interface LoyaltyReward {
  id: string;
  title: string;
  description: string;
  points_required: number;
  category: string;
  is_active: boolean;
  stock_quantity?: number;
  image_url?: string;
  metadata?: any;
  created_at: string;
}

export const useLoyalty = () => {
  const [totalPoints, setTotalPoints] = useState(0);
  const [pointsHistory, setPointsHistory] = useState<LoyaltyPoint[]>([]);
  const [availableRewards, setAvailableRewards] = useState<LoyaltyReward[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const fetchPointsBalance = async () => {
    if (!user) return;

    try {
      // Mock points balance
      setTotalPoints(1250);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch points balance'
      );
    }
  };

  const fetchPointsHistory = async () => {
    if (!user) return;

    try {
      // Mock points history
      const mockHistory: LoyaltyPoint[] = [
        {
          id: '1',
          user_id: user.id,
          points: 100,
          transaction_type: 'earned',
          source: 'match_win',
          description: 'Thắng trận đấu với Nguyễn Văn A',
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          user_id: user.id,
          points: 50,
          transaction_type: 'spent',
          source: 'reward_redemption',
          description: 'Đổi voucher giảm giá 10%',
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
      ];
      setPointsHistory(mockHistory);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch points history'
      );
    }
  };

  const fetchAvailableRewards = async () => {
    try {
      // Mock available rewards
      const mockRewards: LoyaltyReward[] = [
        {
          id: '1',
          title: 'Voucher giảm giá 10%',
          description: 'Giảm 10% cho lần đặt bàn tiếp theo',
          points_required: 500,
          category: 'discount',
          is_active: true,
          stock_quantity: 50,
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Free 1 giờ chơi',
          description: 'Miễn phí 1 giờ chơi tại CLB',
          points_required: 1000,
          category: 'free_play',
          is_active: true,
          stock_quantity: 20,
          created_at: new Date().toISOString(),
        },
      ];
      setAvailableRewards(mockRewards);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch available rewards'
      );
    }
  };

  const earnPoints = useMutation({
    mutationFn: async ({
      points,
      source,
      description,
      metadata,
    }: {
      points: number;
      source: string;
      description: string;
      metadata?: any;
    }) => {
      if (!user) throw new Error('User not authenticated');

      // Mock earning points
      console.log('Mock earn points:', {
        user_id: user.id,
        points,
        transaction_type: 'earned',
        source,
        description,
        metadata,
      });

      setTotalPoints(prev => prev + points);
      return { success: true };
    },
    onSuccess: () => {
      fetchPointsHistory();
      queryClient.invalidateQueries({ queryKey: ['loyalty-points'] });
    },
    onError: error => {
      console.error('Error earning points:', error);
      toast.error('Có lỗi xảy ra khi cộng điểm');
    },
  });

  const spendPoints = useMutation({
    mutationFn: async ({
      points,
      source,
      description,
      metadata,
    }: {
      points: number;
      source: string;
      description: string;
      metadata?: any;
    }) => {
      if (!user) throw new Error('User not authenticated');

      if (totalPoints < points) {
        throw new Error('Không đủ điểm để thực hiện giao dịch');
      }

      // Mock spending points
      console.log('Mock spend points:', {
        user_id: user.id,
        points,
        transaction_type: 'spent',
        source,
        description,
        metadata,
      });

      setTotalPoints(prev => prev - points);
      return { success: true };
    },
    onSuccess: () => {
      fetchPointsHistory();
      queryClient.invalidateQueries({ queryKey: ['loyalty-points'] });
      toast.success('Đã sử dụng điểm thành công');
    },
    onError: error => {
      console.error('Error spending points:', error);
      toast.error('Có lỗi xảy ra khi sử dụng điểm');
    },
  });

  const redeemReward = useMutation({
    mutationFn: async (rewardId: string) => {
      if (!user) throw new Error('User not authenticated');

      const reward = availableRewards.find(r => r.id === rewardId);
      if (!reward) throw new Error('Reward not found');

      if (totalPoints < reward.points_required) {
        throw new Error('Không đủ điểm để đổi phần thưởng này');
      }

      // Mock redeem reward
      console.log('Mock redeem reward:', {
        user_id: user.id,
        reward_id: rewardId,
        points_spent: reward.points_required,
      });

      return spendPoints.mutateAsync({
        points: reward.points_required,
        source: 'reward_redemption',
        description: `Đổi ${reward.title}`,
        metadata: { reward_id: rewardId },
      });
    },
    onSuccess: () => {
      fetchAvailableRewards();
      toast.success('Đã đổi phần thưởng thành công!');
    },
    onError: error => {
      console.error('Error redeeming reward:', error);
      toast.error('Có lỗi xảy ra khi đổi phần thưởng');
    },
  });

  useEffect(() => {
    if (user) {
      setLoading(true);
      Promise.all([
        fetchPointsBalance(),
        fetchPointsHistory(),
        fetchAvailableRewards(),
      ]).finally(() => setLoading(false));
    }
  }, [user]);

  return {
    totalPoints,
    pointsHistory,
    availableRewards,
    loading,
    error,
    earnPoints,
    spendPoints,
    redeemReward,
    refreshData: () => {
      fetchPointsBalance();
      fetchPointsHistory();
      fetchAvailableRewards();
    },
  };
};
