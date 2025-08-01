import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id?: string;
  referral_code: string;
  status: 'pending' | 'completed' | 'claimed';
  reward_claimed: boolean;
  completed_at?: string;
  created_at: string;
}

export const useReferrals = () => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchReferrals = async () => {
    if (!user) return;

    try {
      setLoading(true);
      // For now, return empty array since referrals table is new
      setReferrals([]);
    } catch (error) {
      console.error('Error fetching referrals:', error);
      toast.error('Failed to load referrals');
    } finally {
      setLoading(false);
    }
  };

  const createReferralCode = async () => {
    if (!user) return null;

    try {
      const referralCode = Math.random().toString(36).substring(2, 15);
      // For now, just return the generated code
      return referralCode;
    } catch (error) {
      console.error('Error creating referral code:', error);
      toast.error('Failed to create referral code');
      return null;
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, [user]);

  return {
    referrals,
    loading,
    createReferralCode,
    refetch: fetchReferrals,
    stats: {
      total: referrals.length,
      pending: referrals.filter(r => r.status === 'pending').length,
      completed: referrals.filter(r => r.status === 'completed').length,
      totalReferrals: referrals.length,
      totalEarned: 0,
      pendingRewards: referrals.filter(r => r.status === 'pending').length,
      successfulReferrals: referrals.filter(r => r.status === 'completed')
        .length,
    },
  };
};
