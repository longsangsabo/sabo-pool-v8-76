import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Milestone {
  id: string;
  milestone_name: string;
  milestone_type: string;
  requirement_value: number;
  spa_reward: number;
  is_active: boolean;
  is_repeatable: boolean;
}

interface PlayerMilestone {
  id: string;
  milestone_id: string;
  completed_at: string;
  reward_claimed: boolean;
}

interface MilestoneProgress {
  milestone: Milestone;
  completed: boolean;
  progress: number;
  maxProgress: number;
}

export const useSPAMilestones = () => {
  const { user } = useAuth();

  const { data: milestones = [], isLoading: milestonesLoading } = useQuery({
    queryKey: ['spa-milestones'],
    queryFn: async (): Promise<Milestone[]> => {
      const { data, error } = await (supabase as any)
        .from('spa_reward_milestones')
        .select('*')
        .eq('is_active', true)
        .order('requirement_value');

      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const { data: completedMilestones = [], isLoading: completedLoading } =
    useQuery({
      queryKey: ['player-milestones', user?.id],
      queryFn: async (): Promise<PlayerMilestone[]> => {
        if (!user?.id) return [];

        try {
          const { data, error } = await (supabase as any)
            .from('player_milestones')
            .select('*')
            .eq('user_id', user.id);

          if (error) throw error;
          return data || [];
        } catch (error) {
          console.error('Error fetching player milestones:', error);
          return [];
        }
      },
      enabled: !!user?.id,
      staleTime: 5 * 60 * 1000, // 5 minutes
    });

  const { data: playerStats } = useQuery({
    queryKey: ['player-rankings', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('player_rankings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const milestonesWithProgress: MilestoneProgress[] = milestones.map(
    milestone => {
      const completed = completedMilestones.some(
        cm => cm.milestone_id === milestone.id
      );

      let progress = 0;
      let maxProgress = milestone.requirement_value;

      if (playerStats) {
        switch (milestone.milestone_type) {
          case 'matches_played':
            progress = playerStats.total_matches || 0;
            break;
          case 'spa_points':
            progress = playerStats.spa_points || 0;
            break;
          case 'win_streak':
            progress = playerStats.win_streak || 0;
            break;
          case 'win_rate':
            const winRate =
              playerStats.total_matches > 0
                ? (playerStats.wins / playerStats.total_matches) * 100
                : 0;
            progress =
              winRate >= 50 &&
              playerStats.total_matches >= milestone.requirement_value
                ? 1
                : 0;
            maxProgress = 1;
            break;
          default:
            progress = 0;
        }
      }

      return {
        milestone,
        completed,
        progress: Math.min(progress, maxProgress),
        maxProgress,
      };
    }
  );

  return {
    milestones: milestonesWithProgress,
    isLoading: milestonesLoading || completedLoading,
    completedCount: completedMilestones.length,
    totalRewards: completedMilestones.reduce((sum, cm) => {
      const milestone = milestones.find(m => m.id === cm.milestone_id);
      return sum + (milestone?.spa_reward || 0);
    }, 0),
  };
};
