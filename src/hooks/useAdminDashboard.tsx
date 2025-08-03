import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface AdminDashboardStats {
  total_users: number;
  active_users: number;
  total_clubs: number;
  pending_clubs: number;
  tournaments_count: number;
  active_tournaments: number;
  total_matches: number;
  completed_matches: number;
  total_challenges: number;
  active_challenges: number;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  created_at: string;
  user_id?: string;
  metadata?: any;
}

export const useAdminDashboard = () => {
  const { user } = useAuth();

  const statsQuery = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc(
          'calculate_admin_dashboard_stats'
        );
        if (error) throw error;
        return data as unknown as AdminDashboardStats;
      } catch (error) {
        console.error('Admin dashboard stats error:', error);
        throw error;
      }
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  const recentActivityQuery = useQuery({
    queryKey: ['admin-recent-activity'],
    queryFn: async () => {
      try {
        // Get recent activities from various tables
        const [
          { data: recentUsers },
          { data: recentTournaments },
          { data: recentClubs },
          { data: recentMatches },
        ] = await Promise.all([
          supabase
            .from('profiles')
            .select('user_id, full_name, created_at')
            .eq('is_demo_user', false)
            .order('created_at', { ascending: false })
            .limit(3),

          supabase
            .from('tournaments')
            .select('id, name, created_at, created_by')
            .order('created_at', { ascending: false })
            .limit(3),

          supabase
            .from('club_registrations')
            .select('id, club_name, created_at, user_id')
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(3),

          supabase
            .from('matches')
            .select('id, created_at, player1_id, player2_id')
            .order('created_at', { ascending: false })
            .limit(3),
        ]);

        const activities: RecentActivity[] = [];

        // Process recent users
        recentUsers?.forEach(user => {
          activities.push({
            id: `user-${user.user_id}`,
            type: 'user_registration',
            description: `${user.full_name || 'Người dùng mới'} đã đăng ký`,
            created_at: user.created_at,
            user_id: user.user_id,
          });
        });

        // Process recent tournaments
        recentTournaments?.forEach(tournament => {
          activities.push({
            id: `tournament-${tournament.id}`,
            type: 'tournament_created',
            description: `Giải đấu "${tournament.name}" được tạo`,
            created_at: tournament.created_at,
            user_id: tournament.created_by,
          });
        });

        // Process recent club registrations
        recentClubs?.forEach(club => {
          activities.push({
            id: `club-${club.id}`,
            type: 'club_registration',
            description: `CLB "${club.club_name}" đăng ký`,
            created_at: club.created_at,
            user_id: club.user_id,
          });
        });

        // Process recent matches
        recentMatches?.forEach(match => {
          activities.push({
            id: `match-${match.id}`,
            type: 'match_created',
            description: 'Trận đấu mới được tạo',
            created_at: match.created_at,
          });
        });

        // Sort by created_at and take top 10
        return activities
          .sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          )
          .slice(0, 10);
      } catch (error) {
        console.error('Recent activity fetch error:', error);
        return [];
      }
    },
    enabled: !!user?.id,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Refresh every 2 minutes
  });

  return {
    stats: statsQuery.data,
    recentActivity: recentActivityQuery.data || [],
    isLoading: statsQuery.isLoading || recentActivityQuery.isLoading,
    error: statsQuery.error || recentActivityQuery.error,
    refetch: () => {
      statsQuery.refetch();
      recentActivityQuery.refetch();
    },
  };
};
