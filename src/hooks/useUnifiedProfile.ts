import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePlayerDashboard } from '@/hooks/usePlayerDashboard';
import { useErrorHandler } from '@/hooks/useErrorHandler';

interface UnifiedProfileData {
  // Basic profile info
  id: string;
  user_id: string;
  full_name: string;
  display_name?: string;
  avatar_url?: string;
  email?: string;
  phone?: string;
  bio?: string;
  city?: string;
  district?: string;
  verified_rank?: string;
  role?: string;
  active_role?: string;
  completion_percentage?: number;

  // Dashboard stats
  matches_played?: number;
  matches_won?: number;
  matches_lost?: number;
  win_percentage?: number;
  tournaments_joined?: number;
  current_ranking?: number;
  spa_points?: number;

  // Additional data
  club_profile?: any;
  recent_activities?: any[];
  achievements?: any[];
}

export const useUnifiedProfile = () => {
  const { user } = useAuth();
  const { handleError } = useErrorHandler();
  const { data: dashboardStats, isLoading: dashboardLoading } =
    usePlayerDashboard();

  const {
    data: profileData,
    isLoading: profileLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['unified-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      try {
        // Step 1: Fetch or create basic profile
        let profile = null;

        const { data: existingProfile, error: profileFetchError } =
          await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

        if (profileFetchError) {
          console.error('Profile fetch error:', profileFetchError);
          handleError(profileFetchError, {
            section: 'Profile',
            action: 'fetch',
          });
          throw profileFetchError;
        }

        if (!existingProfile) {
          // Create profile with proper error handling
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              user_id: user.id,
              full_name:
                user.user_metadata?.full_name ||
                user.email?.split('@')[0] ||
                'Người dùng',
              email: user.email,
              role: 'player',
              active_role: 'player',
              completion_percentage: 0,
            })
            .select()
            .maybeSingle();

          if (createError) {
            console.error('Profile creation error:', createError);
            handleError(createError, { section: 'Profile', action: 'create' });
            throw createError;
          }

          profile = newProfile;
        } else {
          profile = existingProfile;
        }

        if (!profile) {
          throw new Error('Failed to get or create profile');
        }

        // Step 2: Fetch club profile (optional, won't fail if not exists)
        let clubProfile = null;
        try {
          const { data: clubData, error: clubError } = await supabase
            .from('club_profiles')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (!clubError && clubData) {
            clubProfile = clubData;
          }
        } catch (clubFetchError) {
          console.warn(
            'Club profile fetch failed (non-critical):',
            clubFetchError
          );
        }

        // Step 3: Fetch recent activities (optional, won't fail if empty)
        let recentActivities = [];
        try {
          const [matchesResult, challengesResult] = await Promise.allSettled([
            supabase
              .from('matches')
              .select(
                `
                id,
                status,
                created_at,
                winner_id,
                score_player1,
                score_player2,
                player1_id,
                player2_id
              `
              )
              .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
              .order('created_at', { ascending: false })
              .limit(10),
            supabase
              .from('challenges')
              .select(
                `
                id,
                status,
                created_at,
                challenger_id,
                opponent_id,
                bet_points
              `
              )
              .or(`challenger_id.eq.${user.id},opponent_id.eq.${user.id}`)
              .order('created_at', { ascending: false })
              .limit(5),
          ]);

          const recentMatches =
            matchesResult.status === 'fulfilled'
              ? matchesResult.value.data || []
              : [];
          const recentChallenges =
            challengesResult.status === 'fulfilled'
              ? challengesResult.value.data || []
              : [];

          recentActivities = [
            ...recentMatches.map(match => ({ ...match, type: 'match' })),
            ...recentChallenges.map(challenge => ({
              ...challenge,
              type: 'challenge',
            })),
          ]
            .sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
            )
            .slice(0, 10);
        } catch (activitiesError) {
          console.warn(
            'Activities fetch failed (non-critical):',
            activitiesError
          );
        }

        return {
          ...profile,
          club_profile: clubProfile,
          recent_activities: recentActivities,
        };
      } catch (error) {
        console.error('Unified profile fetch error:', error);
        handleError(error as Error, {
          section: 'Profile',
          action: 'unified_fetch',
          userId: user.id,
        });
        throw error;
      }
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      if (failureCount >= 3) return false;
      return !error?.message?.includes('not authenticated');
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Combine profile data with dashboard stats
  const unifiedData: UnifiedProfileData | null =
    profileData && dashboardStats
      ? {
          ...profileData,
          ...dashboardStats,
          completion_percentage: calculateCompletionPercentage(profileData),
        }
      : profileData
        ? {
            ...profileData,
            completion_percentage: calculateCompletionPercentage(profileData),
          }
        : null;

  return {
    data: unifiedData,
    isLoading: profileLoading || dashboardLoading,
    error,
    refetch,
  };
};

function calculateCompletionPercentage(profile: any): number {
  if (!profile) return 0;
  const fields = [
    'full_name',
    'display_name',
    'phone',
    'bio',
    'city',
    'verified_rank',
    'avatar_url',
  ];
  const completedFields = fields.filter(
    field => profile[field] && profile[field].trim() !== ''
  );
  return Math.round((completedFields.length / fields.length) * 100);
}
