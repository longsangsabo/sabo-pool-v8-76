import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Challenge } from '@/types/challenge';
import { toast } from 'sonner';

export const useOpenChallenges = () => {
  const [openChallenges, setOpenChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchOpenChallenges = async () => {
    try {
      setLoading(true);

      // Fetch open challenges (opponent_id is null and status is pending)
      const { data: challengesData, error } = await supabase
        .from('challenges')
        .select('*')
        .is('opponent_id', null)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch challenger profiles
      const challengerIds =
        challengesData?.map(c => c.challenger_id).filter(Boolean) || [];

      let profiles: any[] = [];
      let rankings: any[] = [];

      if (challengerIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, full_name, display_name, avatar_url, current_rank')
          .in('user_id', challengerIds);

        const { data: rankingsData } = await supabase
          .from('player_rankings')
          .select('user_id, spa_points, elo_points')
          .in('user_id', challengerIds);

        profiles = profilesData || [];
        rankings = rankingsData || [];
      }

      // Create profile and ranking maps
      const profileMap = new Map();
      const rankingMap = new Map();

      profiles.forEach(profile => {
        profileMap.set(profile.user_id, profile);
      });

      rankings.forEach(ranking => {
        rankingMap.set(ranking.user_id, ranking);
      });

      // Enrich challenges with profile data
      const enrichedChallenges =
        challengesData?.map(challenge => {
          const challengerProfile = profileMap.get(challenge.challenger_id);
          const challengerRanking = rankingMap.get(challenge.challenger_id);

          return {
            ...challenge,
            challenger_profile: challengerProfile
              ? {
                  ...challengerProfile,
                  spa_points: challengerRanking?.spa_points || 0,
                  elo_points: challengerRanking?.elo_points || 1000,
                }
              : null,
          };
        }) || [];

      setOpenChallenges(enrichedChallenges as unknown as Challenge[]);
    } catch (error) {
      console.error('Error fetching open challenges:', error);
      toast.error('Không thể tải danh sách thách đấu mở');
    } finally {
      setLoading(false);
    }
  };

  const joinChallenge = async (challengeId: string) => {
    if (!user?.id) {
      toast.error('Bạn cần đăng nhập để tham gia thách đấu');
      return;
    }

    try {
      setJoining(challengeId);

      // First, get the challenge to verify it's available
      const { data: challengeData, error: fetchError } = await supabase
        .from('challenges')
        .select('*')
        .eq('id', challengeId)
        .eq('status', 'pending')
        .is('opponent_id', null)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (fetchError || !challengeData) {
        throw new Error(
          'Thách đấu không tồn tại hoặc đã được người khác tham gia'
        );
      }

      if (challengeData.challenger_id === user.id) {
        throw new Error('Bạn không thể tham gia thách đấu của chính mình');
      }

      // Update challenge to accept it
      const { data: updateResult, error: updateError } = await supabase
        .from('challenges')
        .update({
          opponent_id: user.id,
          status: 'accepted',
          responded_at: new Date().toISOString(),
        })
        .eq('id', challengeId)
        .eq('status', 'pending')
        .is('opponent_id', null)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating challenge:', updateError);
        throw new Error('Thách đấu đã được người khác tham gia');
      }

      // Create match record
      const { error: matchError } = await supabase.from('matches').insert({
        player1_id: challengeData.challenger_id,
        player2_id: user.id,
        challenge_id: challengeId,
        status: 'scheduled',
        match_type: 'challenge',
        scheduled_time:
          (challengeData as any).scheduled_time || new Date().toISOString(),
      });

      if (matchError) {
        console.warn(
          'Challenge accepted but match creation failed:',
          matchError
        );
      }

      toast.success(
        'Tham gia thách đấu thành công! Trận đấu đã được lên lịch.'
      );

      // Remove the joined challenge from open challenges list
      setOpenChallenges(prev => prev.filter(c => c.id !== challengeId));

      // Refresh the list to ensure consistency
      await fetchOpenChallenges();

      return updateResult;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Không thể tham gia thách đấu';
      toast.error(errorMessage);
      throw error;
    } finally {
      setJoining(null);
    }
  };

  // Set up real-time subscription for open challenges
  useEffect(() => {
    fetchOpenChallenges();

    const subscription = supabase
      .channel('open_challenges_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'challenges',
          filter: 'opponent_id=is.null',
        },
        () => {
          console.log('New open challenge created, refreshing...');
          fetchOpenChallenges();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'challenges',
          filter: 'opponent_id=is.null',
        },
        payload => {
          console.log('Open challenge updated:', payload);

          // If challenge was accepted (opponent_id is no longer null), remove from list
          if (payload.new.opponent_id !== null) {
            setOpenChallenges(prev =>
              prev.filter(c => c.id !== payload.new.id)
            );
          } else {
            fetchOpenChallenges();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'challenges',
        },
        payload => {
          console.log('Challenge deleted:', payload);
          setOpenChallenges(prev => prev.filter(c => c.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  return {
    openChallenges,
    loading,
    joining,
    joinChallenge,
    refetch: fetchOpenChallenges,
  };
};
