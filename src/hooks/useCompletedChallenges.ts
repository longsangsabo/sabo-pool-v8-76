import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useCompletedChallenges = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['completed-challenges', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      console.log('🔍 Fetching completed challenges for user:', user.id);

      const { data, error } = await supabase
        .from('challenges')
        .select(
          `
          *,
          challenger_profile:profiles!challenges_challenger_id_fkey(
            user_id,
            full_name,
            avatar_url
          ),
          opponent_profile:profiles!challenges_opponent_id_fkey(
            user_id,
            full_name,
            avatar_url
          ),
          winner_profile:profiles!challenges_winner_id_fkey(
            user_id,
            full_name,
            avatar_url
          )
        `
        )
        .eq('status', 'completed')
        .or(`challenger_id.eq.${user.id},opponent_id.eq.${user.id}`)
        .order('completed_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('❌ Error fetching completed challenges:', error);
        throw error;
      }

      console.log('✅ Completed challenges fetched:', data?.length || 0);
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
};
