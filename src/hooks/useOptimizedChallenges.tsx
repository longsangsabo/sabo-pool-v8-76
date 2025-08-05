import { useState, useEffect, useCallback, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Challenge, CreateChallengeData } from '@/types/challenge';

interface UseOptimizedChallengesReturn {
  challenges: Challenge[];
  receivedChallenges: Challenge[];
  sentChallenges: Challenge[];
  openChallenges: Challenge[];
  loading: boolean;
  error: string | null;
  fetchChallenges: () => Promise<void>;
  createChallenge: (data: CreateChallengeData) => Promise<any>;
  acceptChallenge: (challengeId: string) => Promise<any>;
  declineChallenge: (challengeId: string) => Promise<any>;
  cancelChallenge: (challengeId: string) => Promise<void>;
  getPendingChallenges: () => Challenge[];
  getAcceptedChallenges: () => Challenge[];
  submitScore: (
    challengeId: string,
    challengerScore: number,
    opponentScore: number
  ) => Promise<any>;
  isSubmittingScore: boolean;
}

// Cache for profiles to avoid re-fetching
const profileCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useOptimizedChallenges = (): UseOptimizedChallengesReturn => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Debounced fetch to prevent multiple calls
  const fetchChallenges = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch challenges with minimal data first
      const { data: challengesData, error: fetchError } = await supabase
        .from('challenges')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Collect unique user IDs
      const userIds = new Set<string>();
      challengesData?.forEach(challenge => {
        if (challenge.challenger_id) userIds.add(challenge.challenger_id);
        if (challenge.opponent_id) userIds.add(challenge.opponent_id);
      });

      // Use cached profiles if available and recent
      const now = Date.now();
      const cachedProfiles = new Map();
      const uncachedUserIds = new Set<string>();

      userIds.forEach(userId => {
        const cached = profileCache.get(userId);
        if (cached && now - cached.timestamp < CACHE_DURATION) {
          cachedProfiles.set(userId, cached.data);
        } else {
          uncachedUserIds.add(userId);
        }
      });

      // Fetch only uncached profiles
      let freshProfiles: any[] = [];
      if (uncachedUserIds.size > 0) {
        const [profilesRes, rankingsRes] = await Promise.all([
          supabase
            .from('profiles')
            .select(
              'user_id, full_name, display_name, verified_rank, elo, avatar_url'
            )
            .in('user_id', Array.from(uncachedUserIds)),
          supabase
            .from('player_rankings')
            .select('user_id, spa_points, elo_points')
            .in('user_id', Array.from(uncachedUserIds)),
        ]);

        if (profilesRes.data) {
          freshProfiles = profilesRes.data.map(profile => {
            const ranking = (rankingsRes.data || []).find(
              r => r.user_id === profile.user_id
            );
            return {
              ...profile,
              spa_points: ranking?.spa_points || 0,
              elo_points: ranking?.elo_points || 1000,
            };
          });
        }

        // Cache fresh profiles
        freshProfiles.forEach(profile => {
          profileCache.set(profile.user_id, {
            data: profile,
            timestamp: now,
          });
          cachedProfiles.set(profile.user_id, profile);
        });
      }

      // Enrich challenges with cached + fresh profile data
      const enrichedChallenges =
        challengesData?.map(challenge => ({
          ...challenge,
          // Convert string values to numbers where needed for type compatibility
          handicap_1_rank: challenge.handicap_1_rank
            ? parseFloat(challenge.handicap_1_rank)
            : undefined,
          handicap_05_rank: challenge.handicap_05_rank
            ? parseFloat(challenge.handicap_05_rank)
            : undefined,
          // Add properly typed profile data
          challenger_profile: cachedProfiles.get(challenge.challenger_id)
            ? {
                user_id: challenge.challenger_id,
                full_name:
                  cachedProfiles.get(challenge.challenger_id)?.full_name || '',
                display_name: cachedProfiles.get(challenge.challenger_id)
                  ?.display_name,
                verified_rank: cachedProfiles.get(challenge.challenger_id)
                  ?.verified_rank,
                current_rank: cachedProfiles.get(challenge.challenger_id)
                  ?.verified_rank,
                spa_points:
                  cachedProfiles.get(challenge.challenger_id)?.spa_points || 0,
                elo_points:
                  cachedProfiles.get(challenge.challenger_id)?.elo_points ||
                  1000,
                avatar_url: cachedProfiles.get(challenge.challenger_id)
                  ?.avatar_url,
                elo: cachedProfiles.get(challenge.challenger_id)?.elo || 1000,
              }
            : null,
          opponent_profile: cachedProfiles.get(challenge.opponent_id)
            ? {
                user_id: challenge.opponent_id,
                full_name:
                  cachedProfiles.get(challenge.opponent_id)?.full_name || '',
                display_name: cachedProfiles.get(challenge.opponent_id)
                  ?.display_name,
                verified_rank: cachedProfiles.get(challenge.opponent_id)
                  ?.verified_rank,
                current_rank: cachedProfiles.get(challenge.opponent_id)
                  ?.verified_rank,
                spa_points:
                  cachedProfiles.get(challenge.opponent_id)?.spa_points || 0,
                elo_points:
                  cachedProfiles.get(challenge.opponent_id)?.elo_points || 1000,
                avatar_url: cachedProfiles.get(challenge.opponent_id)
                  ?.avatar_url,
                elo: cachedProfiles.get(challenge.opponent_id)?.elo || 1000,
              }
            : null,
        })) || [];

      setChallenges(enrichedChallenges as Challenge[]);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('❌ Challenge fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Memoized derived data
  const { receivedChallenges, sentChallenges, openChallenges } = useMemo(() => {
    if (!user)
      return { receivedChallenges: [], sentChallenges: [], openChallenges: [] };

    return {
      receivedChallenges: challenges.filter(c => c.opponent_id === user.id),
      sentChallenges: challenges.filter(c => c.challenger_id === user.id),
      openChallenges: challenges.filter(
        c =>
          !c.opponent_id &&
          c.status === 'pending' &&
          c.challenger_id !== user.id
      ),
    };
  }, [challenges, user]);

  const createChallenge = useCallback(
    async (challengeData: CreateChallengeData) => {
      if (!user) throw new Error('User not authenticated');

      try {
        // Check daily limit efficiently
        const today = new Date().toISOString().split('T')[0];
        const { count } = await supabase
          .from('challenges')
          .select('*', { count: 'exact', head: true })
          .eq('challenger_id', user.id)
          .gte('created_at', `${today}T00:00:00`)
          .lt('created_at', `${today}T23:59:59`);

        if (count && count >= 2) {
          throw new Error(
            'Daily challenge limit reached (2 challenges per day)'
          );
        }

        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 48);

        const newChallenge = {
          challenger_id: user.id,
          opponent_id: challengeData.opponent_id,
          bet_points: challengeData.bet_points,
          race_to: challengeData.race_to || 5,
          handicap_1_rank: challengeData.handicap_1_rank?.toString() || null,
          handicap_05_rank: challengeData.handicap_05_rank?.toString() || null,
          message: challengeData.message,
          scheduled_time: challengeData.scheduled_time,
          status: 'pending' as const,
          expires_at: expiresAt.toISOString(),
        };

        const { data, error } = await supabase
          .from('challenges')
          .insert([newChallenge])
          .select('*')
          .single();

        if (error) throw error;

        toast.success('Challenge created successfully!');
        await fetchChallenges(); // Refresh to update state

        return data;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to create challenge';
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [user, fetchChallenges]
  );

  const acceptChallenge = useCallback(
    async (challengeId: string) => {
      if (!user) throw new Error('User not authenticated');

      try {
        const { data: challengeData, error: fetchError } = await supabase
          .from('challenges')
          .select('*')
          .eq('id', challengeId)
          .eq('status', 'pending')
          .maybeSingle();

        if (fetchError) throw fetchError;
        if (!challengeData)
          throw new Error('Challenge not found or already processed');

        const isOpenChallenge = !challengeData.opponent_id;
        const isSpecificChallenge = challengeData.opponent_id === user.id;
        const isMyOwnChallenge = challengeData.challenger_id === user.id;

        if (isMyOwnChallenge)
          throw new Error('Cannot accept your own challenge');
        if (!isOpenChallenge && !isSpecificChallenge)
          throw new Error('Not authorized to accept this challenge');

        const updateData = isOpenChallenge
          ? {
              status: 'accepted' as const,
              opponent_id: user.id,
              responded_at: new Date().toISOString(),
            }
          : {
              status: 'accepted' as const,
              responded_at: new Date().toISOString(),
            };

        const { data, error } = await supabase
          .from('challenges')
          .update(updateData)
          .eq('id', challengeId)
          .eq('status', 'pending')
          .select('*')
          .maybeSingle();

        if (error) throw error;
        if (!data)
          throw new Error('Challenge was already accepted by someone else');

        // ✅ CRITICAL: Create match record automatically when challenge is accepted
        console.log('🏆 Creating match record for accepted challenge...');

        const finalOpponentId = isOpenChallenge
          ? user.id
          : challengeData.opponent_id;
        const matchData = {
          player1_id: challengeData.challenger_id,
          player2_id: finalOpponentId,
          challenge_id: challengeId,
          status: 'scheduled' as const,
          match_type: 'challenge' as const,
          scheduled_time: new Date().toISOString(),
          score_player1: 0,
          score_player2: 0,
        };

        const { data: matchRecord, error: matchError } = await supabase
          .from('matches')
          .insert([matchData])
          .select('*')
          .maybeSingle();

        if (matchError) {
          console.error('❌ Error creating match record:', matchError);
          console.warn(
            '⚠️ Challenge accepted but match record creation failed'
          );
        } else {
          console.log('✅ Match record created successfully:', matchRecord);
        }

        // ✅ Send notification to challenger when someone joins their open challenge
        if (isOpenChallenge) {
          try {
            console.log('📬 Sending notification to challenger...');

            // Get participant profile for notification metadata
            const { data: participantProfile } = await supabase
              .from('profiles')
              .select(
                'full_name, display_name, avatar_url, verified_rank, current_rank'
              )
              .eq('user_id', user.id)
              .single();

            const { error: notificationError } =
              await supabase.functions.invoke('send-notification', {
                body: {
                  user_id: challengeData.challenger_id,
                  type: 'challenge_accepted',
                  title: '🎯 Có người tham gia thách đấu!',
                  message: `${participantProfile?.display_name || participantProfile?.full_name || 'Một đối thủ'} vừa tham gia thách đấu mở của bạn. Trận đấu đã được tạo và sẵn sàng diễn ra!`,
                  priority: 'high',
                  metadata: {
                    challenge_id: challengeId,
                    participant_name:
                      participantProfile?.display_name ||
                      participantProfile?.full_name ||
                      'Đối thủ ẩn danh',
                    participant_avatar: participantProfile?.avatar_url,
                    participant_rank:
                      participantProfile?.verified_rank ||
                      participantProfile?.current_rank,
                    bet_points: challengeData.bet_points,
                    race_to: challengeData.race_to,
                    message: challengeData.message,
                    location:
                      challengeData.challenge_message || challengeData.message,
                  },
                },
              });

            if (notificationError) {
              console.error(
                '❌ Error sending notification:',
                notificationError
              );
            } else {
              console.log('✅ Notification sent successfully to challenger');
            }
          } catch (notificationErr) {
            console.error('❌ Failed to send notification:', notificationErr);
          }
        }

        await fetchChallenges(); // Refresh to update state
        return { challenge: data, match: matchRecord };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to accept challenge';
        throw new Error(errorMessage);
      }
    },
    [user, fetchChallenges]
  );

  const declineChallenge = useCallback(
    async (challengeId: string) => {
      if (!user) throw new Error('User not authenticated');

      try {
        const { data, error } = await supabase
          .from('challenges')
          .update({
            status: 'declined',
            responded_at: new Date().toISOString(),
          })
          .eq('id', challengeId)
          .eq('opponent_id', user.id)
          .eq('status', 'pending')
          .select()
          .single();

        if (error) throw error;
        if (!data) throw new Error('Challenge not found or already processed');

        await fetchChallenges(); // Refresh to update state
        toast.success('Challenge declined');
        return data;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to decline challenge';
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [user, fetchChallenges]
  );

  const cancelChallenge = useCallback(
    async (challengeId: string) => {
      try {
        const { error } = await supabase
          .from('challenges')
          .delete()
          .eq('id', challengeId);

        if (error) throw error;
        await fetchChallenges();
        toast.success('Challenge cancelled');
      } catch (err) {
        toast.error('Error cancelling challenge');
        throw err;
      }
    },
    [fetchChallenges]
  );

  const getPendingChallenges = useCallback(() => {
    return challenges.filter(c => c.status === 'pending');
  }, [challenges]);

  const getAcceptedChallenges = useCallback(() => {
    return challenges.filter(c => c.status === 'accepted');
  }, [challenges]);

  // Submit score for challenge
  const submitScoreMutation = useMutation({
    mutationFn: async ({
      challengeId,
      challengerScore,
      opponentScore,
    }: {
      challengeId: string;
      challengerScore: number;
      opponentScore: number;
    }) => {
      if (!user) throw new Error('User not authenticated');

      console.log('🎯 Submitting score for challenge:', challengeId, {
        challengerScore,
        opponentScore,
      });

      // Get challenge details
      const challenge = challenges.find(c => c.id === challengeId);
      if (!challenge) throw new Error('Challenge not found');

      // Determine winner
      const winnerId =
        challengerScore > opponentScore
          ? challenge.challenger_id
          : challenge.opponent_id;

      // Update challenge with scores and status
      const { data: challengeData, error: challengeError } = await supabase
        .from('challenges')
        .update({
          challenger_score: challengerScore,
          opponent_score: opponentScore,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', challengeId)
        .select()
        .maybeSingle();

      if (challengeError) throw challengeError;
      if (!challengeData) throw new Error('Challenge not found');

      // Create or update match record
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .upsert(
          {
            challenge_id: challengeId,
            player1_id: challengeData.challenger_id,
            player2_id: challengeData.opponent_id,
            score_player1: challengerScore,
            score_player2: opponentScore,
            winner_id: winnerId,
            status: 'completed',
            played_at: new Date().toISOString(),
            match_type: 'challenge',
          },
          {
            onConflict: 'challenge_id',
          }
        )
        .select()
        .single();

      if (matchError) throw matchError;

      // Process SPA points and ELO
      try {
        const { data: spaResult, error: spaError } = await supabase.rpc(
          'credit_spa_points',
          {
            p_user_id: winnerId,
            p_points: challengeData.bet_points || 100,
            p_description: `Challenge victory - ${challengerScore}:${opponentScore}`,
          }
        );

        if (spaError) {
          console.warn('Failed to credit SPA points:', spaError);
        }
      } catch (error) {
        console.warn('SPA points processing failed:', error);
      }

      // Send notification to opponent
      const opponentId =
        challengeData.challenger_id === user?.id
          ? challengeData.opponent_id
          : challengeData.challenger_id;

      if (opponentId) {
        try {
          await supabase.functions.invoke('send-notification', {
            body: {
              user_id: opponentId,
              type: 'challenge_completed',
              title: '🏆 Trận đấu đã hoàn thành!',
              message: `Tỷ số trận đấu của bạn: ${challengerScore}-${opponentScore}. Kiểm tra kết quả chi tiết.`,
              metadata: {
                challenge_id: challengeId,
                final_score: `${challengerScore}-${opponentScore}`,
                winner_id: winnerId,
              },
            },
          });
        } catch (error) {
          console.warn('Failed to send notification:', error);
        }
      }

      return { challengeData, matchData };
    },
    onSuccess: () => {
      // Refresh challenges and invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['player-rankings'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      fetchChallenges();
      toast.success('Đã ghi nhận tỷ số thành công!');
    },
    onError: error => {
      console.error('Error submitting score:', error);
      toast.error('Lỗi khi ghi nhận tỷ số');
    },
  });

  // Optimized real-time subscription - single channel
  useEffect(() => {
    if (!user) return;

    fetchChallenges();

    const subscription = supabase
      .channel('optimized_challenges')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'challenges',
        },
        payload => {
          console.log('🔄 Challenge change detected, refreshing...');
          // Debounced refresh
          setTimeout(() => fetchChallenges(), 200);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user, fetchChallenges]);

  const submitScore = useCallback(
    async (
      challengeId: string,
      challengerScore: number,
      opponentScore: number
    ) => {
      return submitScoreMutation.mutateAsync({
        challengeId,
        challengerScore,
        opponentScore,
      });
    },
    [submitScoreMutation]
  );

  return {
    challenges,
    receivedChallenges,
    sentChallenges,
    openChallenges,
    loading,
    error,
    fetchChallenges,
    createChallenge,
    acceptChallenge,
    declineChallenge,
    cancelChallenge,
    getPendingChallenges,
    getAcceptedChallenges,
    submitScore,
    isSubmittingScore: submitScoreMutation.isPending,
  };
};
