import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useDailyChallenges = () => {
  const { user } = useAuth();
  const [dailyChallenges, setDailyChallenges] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchDailyChallenges = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      const { count, error } = await supabase
        .from('spa_points_log')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('category', 'challenge')
        .gte('created_at', `${today}T00:00:00`);

      if (error) throw error;
      setDailyChallenges(count || 0);
    } catch (error) {
      console.error('Error fetching daily challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyChallenges();
  }, [user?.id]);

  const getPointsMultiplier = () => {
    if (dailyChallenges >= 2) return 0.3; // 30% for 3rd+ challenge
    return 1.0; // 100% for first 2 challenges
  };

  const getRemainingFullPointChallenges = () => {
    return Math.max(0, 2 - dailyChallenges);
  };

  const isAtLimit = () => dailyChallenges >= 2;

  const getStatusMessage = () => {
    if (dailyChallenges === 0) {
      return 'Bạn có thể chơi 2 kèo với 100% điểm SPA hôm nay';
    } else if (dailyChallenges === 1) {
      return 'Còn 1 kèo nữa với 100% điểm SPA';
    } else if (dailyChallenges === 2) {
      return 'Kèo tiếp theo chỉ nhận 30% điểm SPA';
    } else {
      return `Đã chơi ${dailyChallenges} kèo - chỉ nhận 30% điểm SPA`;
    }
  };

  return {
    dailyChallenges,
    loading,
    getPointsMultiplier,
    getRemainingFullPointChallenges,
    isAtLimit,
    getStatusMessage,
    refetch: fetchDailyChallenges,
  };
};
