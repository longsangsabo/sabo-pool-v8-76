import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface ClubDashboardData {
  clubInfo: any;
  pendingVerifications: any[];
  recentNotifications: any[];
  memberStats: {
    total: number;
    verified: number;
    thisMonth: number;
  };
  matchStats: {
    total: number;
    thisMonth: number;
    thisWeek: number;
  };
  tournamentStats: {
    hosted: number;
    upcoming: number;
  };
  trustScore: number;
  systemStatus: {
    database: 'connected' | 'disconnected' | 'error';
    realtime: 'active' | 'inactive';
    lastUpdate: Date;
  };
}

export const useClubDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState<ClubDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Realtime subscriptions
  useEffect(() => {
    if (!user) return;

    let clubId: string | null = null;

    const channels: any[] = [];

    const setupRealtimeSubscriptions = async () => {
      try {
        // Get club ID first
        const { data: clubData } = await supabase
          .from('club_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!clubData) return;
        clubId = clubData.id;

        // Subscribe to challenges changes
        const challengesChannel = supabase
          .channel('club-challenges')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'challenges',
              filter: `club_id=eq.${clubId}`,
            },
            () => {
              console.log('Club challenges updated - refreshing dashboard');
              fetchDashboardData();
            }
          )
          .subscribe();

        // Subscribe to club-specific notifications
        const notificationChannel = supabase
          .channel('club-notifications')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'notifications',
              filter: `club_id=eq.${clubId}`,
            },
            () => {
              console.log('Club notifications updated - refreshing dashboard');
              fetchDashboardData();
            }
          )
          .subscribe();

        // Subscribe to club tournaments
        const tournamentsChannel = supabase
          .channel('club-tournaments')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'tournaments',
              filter: `club_id=eq.${clubId}`,
            },
            () => {
              console.log('Club tournaments updated - refreshing dashboard');
              fetchDashboardData();
            }
          )
          .subscribe();

        // Subscribe to rank verification requests for this club
        const rankRequestsChannel = supabase
          .channel('club-rank-requests')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'rank_requests',
              filter: `club_id=eq.${clubId}`,
            },
            () => {
              console.log('Rank requests updated - refreshing dashboard');
              fetchDashboardData();
            }
          )
          .subscribe();

        // Subscribe to club accountability
        const accountabilityChannel = supabase
          .channel('club-accountability')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'club_accountability',
              filter: `club_id=eq.${clubId}`,
            },
            () => {
              console.log('Club accountability updated - refreshing dashboard');
              fetchDashboardData();
            }
          )
          .subscribe();

        channels.push(
          challengesChannel,
          notificationChannel,
          tournamentsChannel,
          rankRequestsChannel,
          accountabilityChannel
        );

        setData(prev =>
          prev
            ? {
                ...prev,
                systemStatus: {
                  ...prev.systemStatus,
                  realtime: 'active',
                  lastUpdate: new Date(),
                },
              }
            : null
        );
      } catch (error) {
        console.error('Error setting up realtime:', error);
        setData(prev =>
          prev
            ? {
                ...prev,
                systemStatus: {
                  ...prev.systemStatus,
                  realtime: 'inactive',
                },
              }
            : null
        );
      }
    };

    setupRealtimeSubscriptions();

    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      setError(null);

      console.log('Fetching dashboard data for user:', user.id);

      // Get club profile
      const { data: clubData, error: clubError } = await supabase
        .from('club_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      console.log('Club data:', clubData, 'Error:', clubError);

      if (clubError) throw clubError;
      if (!clubData) throw new Error('Club not found');

      const clubId = clubData.id;
      console.log('Club ID:', clubId);

      // Use the new database function for stats
      const { data: statsData, error: statsError } = await supabase.rpc(
        'calculate_club_dashboard_stats',
        {
          p_club_id: clubId,
        }
      );

      if (statsError) throw statsError;

      // Parallel fetch additional data
      const [verifications, notifications] = await Promise.all([
        // CORRECT: Get PENDING rank verification requests for THIS club only
        supabase
          .from('rank_requests')
          .select(
            `
            id,
            user_id,
            requested_rank,
            status,
            created_at,
            profiles!inner(full_name, display_name, phone)
          `
          )
          .eq('club_id', clubId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(10),

        // CORRECT: Club-specific notifications only
        supabase
          .from('notifications')
          .select('*')
          .or(
            `club_id.eq.${clubId},and(type.in.(rank_verification_request,challenge_at_club,member_join),metadata->>club_id.eq.${clubId})`
          )
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      console.log('Dashboard queries results:', {
        verifications: verifications.data?.length,
        notifications: notifications.data?.length,
        statsData,
      });

      const dashboardData: ClubDashboardData = {
        clubInfo: clubData,
        pendingVerifications: verifications.data || [],
        recentNotifications: notifications.data || [],
        memberStats: {
          total: (statsData as any)?.total_members || 0,
          verified: (statsData as any)?.active_members || 0,
          thisMonth: (statsData as any)?.active_members || 0,
        },
        matchStats: {
          total: (statsData as any)?.total_matches || 0,
          thisMonth: (statsData as any)?.completed_matches || 0,
          thisWeek: 0,
        },
        tournamentStats: {
          hosted: (statsData as any)?.total_tournaments || 0,
          upcoming: (statsData as any)?.active_tournaments || 0,
        },
        trustScore: 80.0,
        systemStatus: {
          database: 'connected',
          realtime: 'active',
          lastUpdate: new Date(),
        },
      };

      setData(dashboardData);
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      setError(error.message);
      setData(prev =>
        prev
          ? {
              ...prev,
              systemStatus: {
                ...prev.systemStatus,
                database: 'error',
                lastUpdate: new Date(),
              },
            }
          : null
      );
      toast.error('Lỗi khi tải dữ liệu dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Auto refresh every 30 seconds
  useEffect(() => {
    if (!user) return;

    fetchDashboardData();

    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);

    return () => clearInterval(interval);
  }, [user]);

  const refreshData = () => {
    setLoading(true);
    fetchDashboardData();
  };

  return {
    data,
    loading,
    error,
    refreshData,
  };
};
