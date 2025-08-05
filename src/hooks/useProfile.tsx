import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { UserProfile } from '../types/common';

interface ProfileFormData {
  full_name: string;
  nickname?: string;
  phone?: string;
  avatar_url?: string;
  bio?: string;
  club_id?: string;
}

export const useProfile = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const getProfile = async (): Promise<UserProfile | null> => {
    setLoading(true);
    setError('');

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('No authenticated user');
      }

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userData.user.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      // Get updated player rankings data
      const { data: rankingData } = await supabase
        .from('player_rankings')
        .select('*')
        .eq('user_id', userData.user.id)
        .maybeSingle();

      // Convert database profile to UserProfile format
      const userProfile: UserProfile = {
        ...data,
        current_rank: data.verified_rank || 'K', // Use verified_rank directly, consistent fallback
        ranking_points: rankingData?.elo_points || 1000,
        total_matches: rankingData?.total_matches || 0,
        wins: rankingData?.wins || 0,
        losses: 0, // No losses column in player_rankings yet
        current_streak: 0, // No win_streak column in player_rankings yet
        matches_played: rankingData?.total_matches || 0,
        matches_won: rankingData?.wins || 0,
        min_bet_points: 50,
        max_bet_points: 1000,
      };

      return userProfile;
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (
    profileData: ProfileFormData
  ): Promise<UserProfile | null> => {
    setLoading(true);
    setError('');

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('No authenticated user');
      }

      const { data, error: updateError } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('user_id', userData.user.id)
        .select()
        .maybeSingle();

      if (updateError) {
        throw updateError;
      }

      // Get player rankings data
      const { data: rankingData } = await supabase
        .from('player_rankings')
        .select('*')
        .eq('user_id', userData.user.id)
        .maybeSingle();

      // Convert database profile to UserProfile format
      const userProfile: UserProfile = {
        ...data,
        current_rank: data.verified_rank || 'K', // Use verified_rank directly, consistent fallback
        ranking_points: rankingData?.elo_points || 1000,
        total_matches: rankingData?.total_matches || 0,
        wins: rankingData?.wins || 0,
        losses: 0, // No losses column in player_rankings yet
        current_streak: 0, // No win_streak column in player_rankings yet
        matches_played: rankingData?.total_matches || 0,
        matches_won: rankingData?.wins || 0,
        min_bet_points: 50,
        max_bet_points: 1000,
      };

      return userProfile;
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      const profileData = await getProfile();
      if (profileData) {
        setProfile(profileData);
      }
    };

    fetchProfile();
  }, []);

  // Enhanced real-time subscription for profile changes with automation
  useEffect(() => {
    if (!profile) return; // Only set up subscription after profile is loaded

    console.log(
      '[useProfile] Setting up enhanced real-time subscription for user:',
      profile.user_id
    );

    const channel = supabase
      .channel('profile-changes-enhanced')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${profile.user_id}`,
        },
        payload => {
          console.log(
            '[useProfile] Real-time profile update received:',
            payload
          );

          // Refresh profile when rank is updated (with null safety)
          const oldRank = payload.old?.verified_rank;
          const newRank = payload.new?.verified_rank;

          if (oldRank !== newRank) {
            console.log('[useProfile] Profile rank updated via real-time:', {
              old: oldRank,
              new: newRank,
            });

            // Force refresh profile data with retries
            const refreshWithRetry = async (attempts = 3) => {
              for (let i = 0; i < attempts; i++) {
                try {
                  console.log(
                    `[useProfile] Refresh attempt ${i + 1}/${attempts}`
                  );
                  const updatedProfile = await getProfile();
                  if (updatedProfile) {
                    setProfile(updatedProfile);
                    console.log(
                      '[useProfile] Profile updated successfully with new rank:',
                      updatedProfile.current_rank
                    );
                    break;
                  }
                } catch (error) {
                  console.error(
                    `[useProfile] Refresh attempt ${i + 1} failed:`,
                    error
                  );
                  if (i < attempts - 1) {
                    await new Promise(resolve =>
                      setTimeout(resolve, 1000 * (i + 1))
                    );
                  }
                }
              }
            };

            refreshWithRetry();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'player_rankings',
          filter: `user_id=eq.${profile.user_id}`,
        },
        payload => {
          console.log(
            '[useProfile] Player rankings updated via real-time:',
            payload
          );

          // Refresh profile to get updated SPA points and ranking data
          const refreshProfile = async () => {
            try {
              const updatedProfile = await getProfile();
              if (updatedProfile) {
                setProfile(updatedProfile);
                console.log(
                  '[useProfile] Profile updated with new ranking data'
                );
              }
            } catch (error) {
              console.error(
                '[useProfile] Failed to refresh profile after ranking update:',
                error
              );
            }
          };

          refreshProfile();
        }
      )
      .subscribe(status => {
        console.log('[useProfile] Real-time subscription status:', status);
      });

    return () => {
      console.log('[useProfile] Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [profile?.user_id]); // Depend on profile.user_id to avoid unnecessary re-subscriptions

  return {
    loading,
    error,
    getProfile,
    updateProfile,
    profile, // Return current profile state for real-time updates
  };
};
