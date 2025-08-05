import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ClubTrustData {
  clubTrustScore: number;
  averageMemberTrust: number;
  memberTrustScores: Array<{
    user_id: string;
    full_name: string;
    avatar_url?: string;
    trust_score: number;
    phone?: string;
  }>;
}

export const useClubTrustScore = () => {
  const { user } = useAuth();
  const [data, setData] = useState<ClubTrustData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrustData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Get club ID (remove trust_score since column doesn't exist)
      const { data: clubData } = await supabase
        .from('club_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!clubData) {
        throw new Error('Club not found');
      }

      const clubId = clubData.id;

      // Get club members who were verified by this club
      const { data: memberIds } = await supabase
        .from('rank_requests')
        .select('user_id')
        .eq('club_id', clubId)
        .eq('status', 'approved');

      if (!memberIds || memberIds.length === 0) {
        setData({
          clubTrustScore: 80.0,
          averageMemberTrust: 0,
          memberTrustScores: [],
        });
        return;
      }

      // Get member profiles with trust scores
      const userIds = memberIds.map(m => m.user_id);
      const { data: memberProfiles } = await supabase
        .from('profiles')
        .select(
          `
          user_id,
          full_name,
          avatar_url,
          phone
        `
        )
        .in('user_id', userIds);

      // Return mock trust scores since column doesn't exist
      const memberTrustScores =
        memberProfiles?.map(profile => {
          return {
            user_id: profile.user_id,
            full_name: profile.full_name || 'Unknown User',
            avatar_url: profile.avatar_url,
            phone: profile.phone,
            trust_score: 75.0, // Default trust score
          };
        }) || [];

      // Calculate average member trust
      const averageMemberTrust =
        memberTrustScores.length > 0
          ? memberTrustScores.reduce((sum, m) => sum + m.trust_score, 0) /
            memberTrustScores.length
          : 0;

      setData({
        clubTrustScore: 80.0,
        averageMemberTrust: Number(averageMemberTrust.toFixed(1)),
        memberTrustScores,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch trust scores';
      setError(errorMessage);
      console.error('Trust score fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscriptions for trust score updates
  useEffect(() => {
    if (!user) return;

    fetchTrustData();

    let clubId: string | null = null;

    const setupSubscriptions = async () => {
      // Get club ID for subscriptions
      const { data: clubData } = await supabase
        .from('club_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!clubData) return;
      clubId = clubData.id;

      // Subscribe to mutual ratings changes (affects trust scores)
      const ratingsSubscription = supabase
        .channel(`trust-scores-${clubId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'mutual_ratings',
          },
          payload => {
            console.log(
              'New rating submitted, refreshing trust scores:',
              payload
            );
            fetchTrustData();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'player_rankings',
          },
          payload => {
            console.log(
              'Player ranking updated, refreshing trust scores:',
              payload
            );
            fetchTrustData();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'club_profiles',
            filter: `id=eq.${clubId}`,
          },
          payload => {
            console.log(
              'Club profile updated, refreshing trust scores:',
              payload
            );
            fetchTrustData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(ratingsSubscription);
      };
    };

    const cleanup = setupSubscriptions();

    return () => {
      cleanup.then(fn => fn && fn());
    };
  }, [user]);

  return {
    data,
    loading,
    error,
    refetch: fetchTrustData,
  };
};
