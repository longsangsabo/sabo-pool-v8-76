import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RankVerification {
  id: string;
  player_id: string;
  requested_rank: string;
  current_rank: string | null;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  created_at: string;
  profiles: {
    full_name: string;
    display_name: string;
    avatar_url?: string;
  };
}

export const useRankVerification = (clubId: string) => {
  const [verifications, setVerifications] = useState<RankVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVerifications = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rank_verifications')
        .select(
          `
          *,
          profiles:player_id (
            full_name,
            display_name,
            avatar_url
          )
        `
        )
        .eq('club_id', clubId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVerifications(data || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch verifications'
      );
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  const handleVerification = async (
    verificationId: string,
    status: 'approved' | 'rejected',
    notes?: string
  ) => {
    try {
      const { error } = await supabase
        .from('rank_verifications')
        .update({
          status,
          notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', verificationId);

      if (error) throw error;
      await fetchVerifications();
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update verification'
      );
      return false;
    }
  };

  return {
    verifications,
    loading,
    error,
    fetchVerifications,
    handleVerification,
  };
};
