import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useFinancials } from '@/hooks/useFinancials';

interface ChallengeBet {
  id: string;
  challenge_id: string;
  bettor_id: string;
  bet_amount: number;
  bet_on_user_id: string;
  odds: number;
  potential_payout: number;
  status: 'active' | 'won' | 'lost' | 'cancelled';
  payout: number;
  created_at: string;
  updated_at: string;
  challenge?: {
    id: string;
    challenge_type: string;
    status: string;
    challenger: { username: string };
    opponent: { username: string };
  };
}

interface BettableChallenge {
  id: string;
  challenge_type: string;
  bet_amount: number;
  status: string;
  created_at: string;
  challenger: { id: string; username: string; avatar_url?: string };
  opponent: { id: string; username: string; avatar_url?: string };
}

export const useChallengeBetting = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { updateBalance, refreshData: refreshFinancials } = useFinancials();
  const [userBets, setUserBets] = useState<ChallengeBet[]>([]);
  const [bettableChallenges, setBettableChallenges] = useState<
    BettableChallenge[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBettingData();
      subscribeToBettingUpdates();
    }
  }, [user]);

  const fetchBettingData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch active challenges available for betting
      const { data: challengeData, error: challengeError } = await supabase
        .from('challenges')
        .select(
          `
          id,
          challenge_type,
          bet_amount,
          status,
          created_at,
          challenger:profiles!challenges_challenger_id_fkey(id, username, avatar_url),
          opponent:profiles!challenges_opponent_id_fkey(id, username, avatar_url)
        `
        )
        .in('status', ['active', 'in_progress'])
        .order('created_at', { ascending: false });

      if (challengeError) {
        console.error('Error fetching bettable challenges:', challengeError);
      } else {
        setBettableChallenges(challengeData || []);
      }

      // Fetch user's betting history
      const { data: betData, error: betError } = await supabase
        .from('challenge_bets')
        .select(
          `
          *,
          challenge:challenges(
            id,
            challenge_type,
            status,
            challenger:profiles!challenges_challenger_id_fkey(username),
            opponent:profiles!challenges_opponent_id_fkey(username)
          )
        `
        )
        .eq('bettor_id', user.id)
        .order('created_at', { ascending: false });

      if (betError) {
        console.error('Error fetching user bets:', betError);
      } else {
        setUserBets(betData || []);
      }
    } catch (error) {
      console.error('Error fetching betting data:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải dữ liệu cược',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const placeBet = async (
    challengeId: string,
    betOnUserId: string,
    betAmount: number
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      // Deduct bet amount from wallet first
      const success = await updateBalance(
        -betAmount,
        'challenge_bet',
        `Cược challenge ${challengeId}`,
        challengeId
      );

      if (!success) return false;

      // Place the bet
      const { error: betError } = await supabase.from('challenge_bets').insert({
        challenge_id: challengeId,
        bettor_id: user.id,
        bet_amount: betAmount,
        bet_on_user_id: betOnUserId,
        status: 'active',
      });

      if (betError) {
        console.error('Error placing bet:', betError);

        // Refund if bet placement failed
        await updateBalance(
          betAmount,
          'bet_refund',
          `Hoàn tiền cược thất bại ${challengeId}`,
          challengeId
        );

        toast({
          title: 'Lỗi',
          description: 'Không thể đặt cược. Tiền đã được hoàn lại.',
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Thành công',
        description: `Đã đặt cược ${betAmount.toLocaleString()} VND`,
      });

      // Refresh data
      await fetchBettingData();
      await refreshFinancials();

      return true;
    } catch (error) {
      console.error('Error placing bet:', error);
      toast({
        title: 'Lỗi',
        description: 'Có lỗi xảy ra khi đặt cược',
        variant: 'destructive',
      });
      return false;
    }
  };

  const cancelBet = async (betId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Get bet details first
      const { data: betData, error: betError } = await supabase
        .from('challenge_bets')
        .select('*')
        .eq('id', betId)
        .eq('bettor_id', user.id)
        .single();

      if (betError || !betData) {
        toast({
          title: 'Lỗi',
          description: 'Không tìm thấy cược',
          variant: 'destructive',
        });
        return false;
      }

      if (betData.status !== 'active') {
        toast({
          title: 'Lỗi',
          description: 'Chỉ có thể hủy cược đang hoạt động',
          variant: 'destructive',
        });
        return false;
      }

      // Cancel the bet
      const { error: cancelError } = await supabase
        .from('challenge_bets')
        .update({ status: 'cancelled' })
        .eq('id', betId);

      if (cancelError) {
        console.error('Error cancelling bet:', cancelError);
        toast({
          title: 'Lỗi',
          description: 'Không thể hủy cược',
          variant: 'destructive',
        });
        return false;
      }

      // Refund the bet amount
      await updateBalance(
        betData.bet_amount,
        'bet_refund',
        `Hoàn tiền hủy cược ${betData.challenge_id}`,
        betData.challenge_id
      );

      toast({
        title: 'Thành công',
        description: 'Đã hủy cược và hoàn tiền',
      });

      // Refresh data
      await fetchBettingData();
      await refreshFinancials();

      return true;
    } catch (error) {
      console.error('Error cancelling bet:', error);
      toast({
        title: 'Lỗi',
        description: 'Có lỗi xảy ra khi hủy cược',
        variant: 'destructive',
      });
      return false;
    }
  };

  const getBettingStats = () => {
    const activeBets = userBets.filter(bet => bet.status === 'active');
    const wonBets = userBets.filter(bet => bet.status === 'won');
    const lostBets = userBets.filter(bet => bet.status === 'lost');

    const totalBetAmount = userBets.reduce(
      (sum, bet) => sum + bet.bet_amount,
      0
    );
    const totalWinnings = wonBets.reduce((sum, bet) => sum + bet.payout, 0);
    const totalLosses = lostBets.reduce((sum, bet) => sum + bet.bet_amount, 0);
    const netProfit = totalWinnings - totalLosses;

    const winRate =
      userBets.length > 0
        ? (wonBets.length / (wonBets.length + lostBets.length)) * 100
        : 0;

    return {
      activeBets: activeBets.length,
      totalBets: userBets.length,
      winRate: Math.round(winRate),
      totalBetAmount,
      totalWinnings,
      totalLosses,
      netProfit,
    };
  };

  const subscribeToBettingUpdates = () => {
    if (!user) return;

    const channel = supabase
      .channel('betting_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'challenge_bets',
          filter: `bettor_id=eq.${user.id}`,
        },
        () => {
          fetchBettingData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'challenges',
        },
        () => {
          fetchBettingData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  return {
    userBets,
    bettableChallenges,
    loading,
    placeBet,
    cancelBet,
    getBettingStats,
    refreshData: fetchBettingData,
  };
};
