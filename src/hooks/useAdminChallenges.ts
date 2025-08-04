import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSaboChallenges } from './useSaboChallenges';
import { Database } from '@/integrations/supabase/types';

export interface AdminChallengeData {
  challenger_id: string;
  opponent_id: string;
  bet_points: number;
  race_to: number;
  message?: string;
  club_id?: string;
  admin_notes?: string;
}

type ChallengeRow = Database['public']['Tables']['challenges']['Row'];

export interface ChallengeWithProfiles extends Omit<ChallengeRow, 'challenger_id' | 'opponent_id'> {
  challenger_id: string;
  opponent_id: string;
  challenger?: {
    user_id: string;
    full_name: string;
    email?: string;
    phone?: string;
    verified_rank?: string;
  };
  opponent?: {
    user_id: string;
    full_name: string;
    email?: string;
    phone?: string;
    verified_rank?: string;
  };
  club?: {
    id: string;
    name: string;
    address?: string;
  };
}

export interface ChallengeStats {
  total: number;
  pending: number;
  accepted: number;
  completed: number;
  cancelled: number;
  expired: number;
  total_bet_amount: number;
  avg_bet_amount: number;
  completion_rate: number;
}

export const useAdminChallenges = () => {
  const {
    challenges: baseChallenges,
    loading: baseChallengesLoading,
    error: baseChallengesError,
    fetchChallenges: refetchChallenges
  } = useSaboChallenges();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get all challenges (admin view)
  const getAllChallenges = useCallback(async (): Promise<ChallengeWithProfiles[]> => {
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select(`
          *,
          challenger:profiles!challenger_id(
            user_id,
            full_name,
            email,
            phone,
            verified_rank
          ),
          opponent:profiles!opponent_id(
            user_id,
            full_name,
            email,
            phone,
            verified_rank
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(challenge => ({
        ...challenge,
        challenger: challenge.challenger ? {
          user_id: challenge.challenger.user_id,
          full_name: challenge.challenger.full_name || 'Unknown',
          email: challenge.challenger.email,
          phone: challenge.challenger.phone,
          verified_rank: challenge.challenger.verified_rank
        } : undefined,
        opponent: challenge.opponent ? {
          user_id: challenge.opponent.user_id,
          full_name: challenge.opponent.full_name || 'Unknown',
          email: challenge.opponent.email,
          phone: challenge.opponent.phone,
          verified_rank: challenge.opponent.verified_rank
        } : undefined
      })) as ChallengeWithProfiles[];
    } catch (err: any) {
      console.error('Error fetching all challenges:', err);
      toast.error('Lỗi khi tải danh sách thách đấu');
      return [];
    }
  }, []);

  // Create challenge (admin)
  const createChallenge = useCallback(async (challengeData: AdminChallengeData) => {
    try {
      setLoading(true);
      setError(null);

      // Direct insert for admin-created challenges
      const { data, error } = await supabase
        .from('challenges')
        .insert({
          challenger_id: challengeData.challenger_id,
          opponent_id: challengeData.opponent_id,
          bet_points: challengeData.bet_points,
          race_to: challengeData.race_to,
          message: challengeData.message,
          club_id: challengeData.club_id,
          admin_notes: challengeData.admin_notes,
          admin_created_by: (await supabase.auth.getUser()).data.user?.id,
          status: 'pending',
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() // 48h
        })
        .select()
        .single();

      if (error) throw error;
      
      await refetchChallenges();
      toast.success('Tạo thách đấu thành công');
      return data;
    } catch (err: any) {
      console.error('Error creating challenge:', err);
      const errorMessage = err.message || 'Lỗi không xác định';
      setError(errorMessage);
      toast.error(`Lỗi khi tạo thách đấu: ${errorMessage}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refetchChallenges]);

  // Update challenge
  const updateChallenge = useCallback(async (id: string, updates: Partial<AdminChallengeData>) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('challenges')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await refetchChallenges();
      toast.success('Cập nhật thách đấu thành công');
      return data;
    } catch (err: any) {
      console.error('Error updating challenge:', err);
      const errorMessage = err.message || 'Lỗi không xác định';
      setError(errorMessage);
      toast.error(`Lỗi khi cập nhật thách đấu: ${errorMessage}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refetchChallenges]);

  // Update challenge status
  const updateChallengeStatus = useCallback(async (
    id: string, 
    status: 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled' | 'expired'
  ) => {
    try {
      setLoading(true);
      setError(null);

      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      // Add timestamp based on status
      if (status === 'accepted') {
        updateData.accepted_at = new Date().toISOString();
      } else if (status === 'declined') {
        updateData.responded_at = new Date().toISOString();
      } else if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('challenges')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      await refetchChallenges();
      toast.success(`Đã chuyển trạng thái thành: ${status}`);
    } catch (err: any) {
      console.error('Error updating challenge status:', err);
      const errorMessage = err.message || 'Lỗi không xác định';
      setError(errorMessage);
      toast.error(`Lỗi khi cập nhật trạng thái: ${errorMessage}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refetchChallenges]);

  // Delete challenge (soft delete)
  const deleteChallenge = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('challenges')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      await refetchChallenges();
      toast.success('Xóa thách đấu thành công');
    } catch (err: any) {
      console.error('Error deleting challenge:', err);
      const errorMessage = err.message || 'Lỗi không xác định';
      setError(errorMessage);
      toast.error(`Lỗi khi xóa thách đấu: ${errorMessage}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refetchChallenges]);

  // Get challenge statistics
  const getChallengeStats = useCallback(async (): Promise<ChallengeStats> => {
    try {
      const { data: challengesData, error: challengesError } = await supabase
        .from('challenges')
        .select('id, status, bet_points, created_at');

      if (challengesError) throw challengesError;

      const total = challengesData?.length || 0;
      const pending = challengesData?.filter(c => c.status === 'pending').length || 0;
      const accepted = challengesData?.filter(c => c.status === 'accepted').length || 0;
      const completed = challengesData?.filter(c => c.status === 'completed').length || 0;
      const cancelled = challengesData?.filter(c => c.status === 'cancelled').length || 0;
      const expired = challengesData?.filter(c => c.status === 'expired').length || 0;

      const totalBetAmount = challengesData?.reduce((sum, c) => sum + (c.bet_points || 0), 0) || 0;
      const avgBetAmount = total > 0 ? Math.round(totalBetAmount / total) : 0;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        total,
        pending,
        accepted,
        completed,
        cancelled,
        expired,
        total_bet_amount: totalBetAmount,
        avg_bet_amount: avgBetAmount,
        completion_rate: completionRate
      };
    } catch (err: any) {
      console.error('Error fetching challenge stats:', err);
      return {
        total: 0,
        pending: 0,
        accepted: 0,
        completed: 0,
        cancelled: 0,
        expired: 0,
        total_bet_amount: 0,
        avg_bet_amount: 0,
        completion_rate: 0
      };
    }
  }, []);

  // Force expire old challenges
  const expireOldChallenges = useCallback(async () => {
    try {
      setLoading(true);
      const now = new Date().toISOString();

      const { error } = await supabase
        .from('challenges')
        .update({ 
          status: 'expired',
          updated_at: now
        })
        .eq('status', 'pending')
        .lt('expires_at', now);

      if (error) throw error;

      await refetchChallenges();
      toast.success('Đã hết hạn các thách đấu cũ');
    } catch (err: any) {
      console.error('Error expiring old challenges:', err);
      toast.error('Lỗi khi hết hạn thách đấu cũ');
    } finally {
      setLoading(false);
    }
  }, [refetchChallenges]);

  return {
    challenges: baseChallenges,
    loading: baseChallengesLoading || loading,
    error: baseChallengesError || error,
    refetchChallenges,
    
    // Admin-specific methods
    getAllChallenges,
    createChallenge,
    updateChallenge,
    updateChallengeStatus,
    deleteChallenge,
    getChallengeStats,
    expireOldChallenges
  };
};

export default useAdminChallenges;
