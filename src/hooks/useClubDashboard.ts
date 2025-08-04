import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface DashboardData {
  members: {
    total: number;
    active: number;
    new: number;
  };
  tournaments: {
    total: number;
    active: number;
    upcoming: number;
  };
  challenges: {
    total: number;
    today: number;
    pending: number;
  };
  tables: {
    total: number;
    available: number;
    utilization: number;
  };
  revenue: {
    today: number;
    thisMonth: number;
    breakdown: {
      membership: number;
      tournaments: number;
      tableFees: number;
      other: number;
    };
  };
  recentActivities: Array<{
    id: string;
    type: 'tournament' | 'challenge' | 'membership' | 'table_booking';
    description: string;
    created_at: string;
    status: 'pending' | 'completed' | 'cancelled';
    metadata?: any;
  }>;
  notifications?: Array<{
    id: string;
    title: string;
    message: string;
    type: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  }>;
}

export function useClubDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<RealtimeChannel | null>(null);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch club info
      const { data: club, error: clubError } = await supabase
        .from('club_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (clubError) throw clubError;

      // Fetch member stats
      const { data: memberStats, error: memberError } = await supabase
        .from('club_member_stats')
        .select('*')
        .eq('club_id', club.id)
        .single();

      if (memberError) throw memberError;

      // Fetch tournament stats
      const { data: tournamentStats, error: tournamentError } = await supabase
        .from('club_tournament_stats')
        .select('*')
        .eq('club_id', club.id)
        .single();

      if (tournamentError) throw tournamentError;

      // Fetch challenge stats
      const { data: challengeStats, error: challengeError } = await supabase
        .from('club_challenge_stats')
        .select('*')
        .eq('club_id', club.id)
        .single();

      if (challengeError) throw challengeError;

      // Fetch recent activities
      const { data: activities, error: activitiesError } = await supabase
        .from('club_activities')
        .select('*')
        .eq('club_id', club.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (activitiesError) throw activitiesError;

      // Format dashboard data
      const dashboardData: DashboardData = {
        members: {
          total: memberStats.total_members,
          active: memberStats.active_members,
          new: memberStats.new_members_this_month,
        },
        tournaments: {
          total: tournamentStats.total_tournaments,
          active: tournamentStats.active_tournaments,
          upcoming: tournamentStats.upcoming_tournaments,
        },
        challenges: {
          total: challengeStats.total_challenges,
          today: challengeStats.challenges_today,
          pending: challengeStats.pending_verifications,
        },
        tables: {
          total: club.number_of_tables,
          available: club.number_of_tables - tournamentStats.tables_in_use,
          utilization: (tournamentStats.tables_in_use / club.number_of_tables) * 100,
        },
        revenue: {
          today: challengeStats.revenue_today + tournamentStats.revenue_today,
          thisMonth: memberStats.revenue_this_month,
          breakdown: {
            membership: memberStats.membership_revenue,
            tournaments: tournamentStats.tournament_revenue,
            tableFees: challengeStats.table_fees,
            other: memberStats.other_revenue,
          },
        },
        recentActivities: activities,
      };

      setData(dashboardData);
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  // Setup realtime subscription
  useEffect(() => {
    if (!user) return;

    const sub = supabase
      .channel('club-dashboard')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'club_activities',
        },
        () => {
          fetchDashboardData();
        }
      )
      .subscribe();

    setSubscription(sub);

    return () => {
      sub.unsubscribe();
    };
  }, [user]);

  const refreshData = () => {
    fetchDashboardData();
  };

  return {
    data,
    loading,
    error,
    refreshData,
  };
}
