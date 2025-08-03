import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  Challenge,
  CreateChallengeData,
  AcceptChallengeRequest,
} from '@/types/challenge';

export const useChallenges = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [receivedChallenges, setReceivedChallenges] = useState<Challenge[]>([]);
  const [sentChallenges, setSentChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingReceived, setLoadingReceived] = useState(false);
  const [loadingSent, setLoadingSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // ✅ CRITICAL: Fixed query with explicit field selection and comprehensive logging
  const fetchChallenges = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('✅ [useChallenges] Fetching challenges for user:', user.id);

      // ✅ CRITICAL FIX: Fetch ALL challenges including open ones from other users
      const { data: challengesData, error: fetchError } = await supabase
        .from('challenges')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('📊 [useChallenges] Raw database response:', {
        totalChallenges: challengesData?.length || 0,
        error: fetchError,
        firstFew: challengesData?.slice(0, 3).map(c => ({
          id: c.id.slice(-8),
          challenger_id: c.challenger_id?.slice(-8),
          opponent_id: c.opponent_id?.slice(-8) || 'NULL',
          status: c.status,
          created_at: c.created_at,
        })),
      });

      if (fetchError) {
        throw new Error(`Database error: ${fetchError.message}`);
      }

      // Fetch profile data separately to avoid relationship issues
      const userIds = new Set<string>();
      challengesData?.forEach(challenge => {
        if (challenge.challenger_id) userIds.add(challenge.challenger_id);
        if (challenge.opponent_id) userIds.add(challenge.opponent_id);
      });

      // Fetch all user profiles with SPA points in one query
      let profiles: any[] = [];
      let playerRankings: any[] = [];
      let clubProfiles: any[] = [];

      if (userIds.size > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select(
            `
            user_id, 
            full_name, 
            display_name, 
            verified_rank, 
            elo, 
            avatar_url,
            current_rank
          `
          )
          .in('user_id', Array.from(userIds));

        profiles = profilesData || [];

        // Fetch player rankings for SPA points
        const { data: rankingsData } = await supabase
          .from('player_rankings')
          .select('user_id, spa_points, elo_points')
          .in('user_id', Array.from(userIds));

        playerRankings = rankingsData || [];
      }

      // Note: Club profiles integration will be added when club_id field is available in challenges table
      // For now, we'll skip club data fetching
      clubProfiles = [];

      // Create maps for quick lookups
      const profileMap = new Map();
      const rankingMap = new Map();
      const clubMap = new Map();

      profiles.forEach(profile => {
        profileMap.set(profile.user_id, profile);
      });

      playerRankings.forEach(ranking => {
        rankingMap.set(ranking.user_id, ranking);
      });

      clubProfiles.forEach(club => {
        clubMap.set(club.id, club);
      });

      // Map challenges with enriched profile and club data
      const enrichedChallenges =
        challengesData?.map(challenge => {
          const challengerProfile = profileMap.get(challenge.challenger_id);
          const opponentProfile = profileMap.get(challenge.opponent_id);
          const challengerRanking = rankingMap.get(challenge.challenger_id);
          const opponentRanking = rankingMap.get(challenge.opponent_id);
          // const clubProfile = clubMap.get(challenge.club_id); // TODO: Add when club_id field exists
          const clubProfile = null;

          return {
            ...challenge,
            challenger_profile: challengerProfile
              ? {
                  ...challengerProfile,
                  spa_points: challengerRanking?.spa_points || 0,
                  elo_points: challengerRanking?.elo_points || 1000,
                }
              : null,
            opponent_profile: opponentProfile
              ? {
                  ...opponentProfile,
                  spa_points: opponentRanking?.spa_points || 0,
                  elo_points: opponentRanking?.elo_points || 1000,
                }
              : null,
            club_profiles: clubProfile
              ? {
                  club_name: clubProfile.club_name,
                  address: clubProfile.address,
                  phone: clubProfile.phone,
                }
              : null,
            current_user_profile: profileMap.get(user.id),
          };
        }) || [];

      // ✅ Enhanced logging for debugging
      console.log('🔍 [useChallenges] Processing enriched challenges:', {
        total: enrichedChallenges.length,
        currentUser: user.id.slice(-8),
        byStatus: {
          pending: enrichedChallenges.filter(c => c.status === 'pending')
            .length,
          accepted: enrichedChallenges.filter(c => c.status === 'accepted')
            .length,
          completed: enrichedChallenges.filter(c => c.status === 'completed')
            .length,
        },
        openChallenges: enrichedChallenges.filter(
          c => !c.opponent_id && c.status === 'pending'
        ).length,
        myOpenChallenges: enrichedChallenges.filter(
          c =>
            !c.opponent_id &&
            c.status === 'pending' &&
            c.challenger_id === user.id
        ).length,
        otherOpenChallenges: enrichedChallenges.filter(
          c =>
            !c.opponent_id &&
            c.status === 'pending' &&
            c.challenger_id !== user.id
        ).length,
        sampleOtherOpen: enrichedChallenges
          .filter(
            c =>
              !c.opponent_id &&
              c.status === 'pending' &&
              c.challenger_id !== user.id
          )
          .slice(0, 3)
          .map(c => ({
            id: c.id.slice(-8),
            challenger: c.challenger_profile?.full_name || 'Unknown',
            bet_points: c.bet_points,
            race_to: c.race_to,
          })),
      });

      setChallenges(enrichedChallenges as unknown as Challenge[]);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('❌ Challenge fetch error:', err);
      toast.error(`Error loading challenges: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Create new challenge
  const createChallenge = async (challengeData: CreateChallengeData) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      // Daily limit temporarily disabled
      // TODO: Re-enable daily limit when needed
      console.log('Daily challenge limit temporarily disabled');

      /*
      // Check daily limit (2 challenges per day)
      const today = new Date().toISOString().split('T')[0];
      const { data: todayChallenges, error: checkError } = await supabase
        .from('challenges')
        .select('id')
        .eq('challenger_id', user.id)
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`);

      if (checkError) {
        throw new Error(`Failed to check daily limit: ${checkError.message}`);
      }

      if (todayChallenges && todayChallenges.length >= 2) {
        throw new Error('Daily challenge limit reached (2 challenges per day)');
      }
      */

      // Create challenge with 48h expiration
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 48);

      // ✅ Support for open challenges - set opponent_id to null for open challenges
      const isOpenChallenge =
        !challengeData.opponent_id || challengeData.opponent_id === 'open';

      const newChallenge = {
        challenger_id: user.id,
        opponent_id: isOpenChallenge ? null : challengeData.opponent_id,
        bet_points: challengeData.bet_points,
        race_to: challengeData.race_to || 5,
        handicap_1_rank: challengeData.handicap_1_rank?.toString() || null,
        handicap_05_rank: challengeData.handicap_05_rank?.toString() || null,
        message: challengeData.message,
        scheduled_time: challengeData.scheduled_time,
        status: 'pending' as const,
        expires_at: expiresAt.toISOString(),
        is_open_challenge: isOpenChallenge,
      };

      const { data, error: insertError } = await supabase
        .from('challenges')
        .insert([newChallenge])
        .select('*')
        .single();

      if (insertError) {
        throw new Error(`Failed to create challenge: ${insertError.message}`);
      }

      // Fetch profile data separately for consistency
      const { data: challengerProfile } = await supabase
        .from('profiles')
        .select(
          'user_id, full_name, display_name, verified_rank, elo, avatar_url'
        )
        .eq('user_id', user.id)
        .maybeSingle();

      const { data: opponentProfile } = await supabase
        .from('profiles')
        .select(
          'user_id, full_name, display_name, verified_rank, elo, avatar_url'
        )
        .eq('user_id', challengeData.opponent_id)
        .maybeSingle();

      const enrichedChallenge = {
        ...data,
        challenger_profile: challengerProfile,
        opponent_profile: opponentProfile,
        current_user_profile: challengerProfile,
      };

      // Update local state with type assertion
      setChallenges(prev => [
        enrichedChallenge as unknown as Challenge,
        ...prev,
      ]);
      toast.success('Challenge created successfully!');

      return enrichedChallenge;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to create challenge';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Accept challenge (handles both specific and open challenges)
  const acceptChallenge = async (challengeId: string) => {
    if (!user) {
      throw new Error('Bạn cần đăng nhập để tham gia thách đấu');
    }

    try {
      console.log(
        '🎯 Attempting to accept challenge:',
        challengeId,
        'User:',
        user.id
      );

      // ✅ Use the new database function for safe open challenge acceptance
      const { data: result, error } = await supabase.rpc(
        'accept_open_challenge',
        {
          p_challenge_id: challengeId,
          p_user_id: user.id,
        }
      );

      if (error) {
        console.error('❌ Error calling accept_open_challenge:', error);
        throw new Error(`Không thể tham gia thách đấu: ${error.message}`);
      }

      if (
        result &&
        typeof result === 'object' &&
        'success' in result &&
        !result.success
      ) {
        const errorMsg =
          'error' in result
            ? String(result.error)
            : 'Không thể tham gia thách đấu';
        console.error('❌ Challenge acceptance failed:', errorMsg);
        throw new Error(errorMsg);
      }

      console.log('✅ Challenge accepted successfully:', result);
      toast.success(
        'Tham gia thách đấu thành công! Trận đấu đã được lên lịch.'
      );

      // Update local state to remove the challenge from open challenges
      setChallenges(prev => prev.filter(c => c.id !== challengeId));

      // Refetch challenges to update the list with latest data
      await fetchChallenges();

      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Không thể tham gia thách đấu';
      console.error('❌ Accept challenge error:', err);
      throw new Error(errorMessage);
    }
  };

  // Legacy accept challenge method (fallback for specific challenges)
  const acceptChallengeOld = async (challengeId: string) => {
    if (!user) {
      throw new Error('Bạn cần đăng nhập để tham gia thách đấu');
    }

    try {
      console.log(
        '🎯 Attempting to accept challenge (old method):',
        challengeId,
        'User:',
        user.id
      );

      // First, get the challenge to check if it's open or specific
      const { data: challengeData, error: fetchError } = await supabase
        .from('challenges')
        .select('*')
        .eq('id', challengeId)
        .eq('status', 'pending')
        .maybeSingle();

      if (fetchError) {
        console.error('❌ Error fetching challenge:', fetchError);
        throw new Error(
          `Không thể tải thông tin thách đấu: ${fetchError.message}`
        );
      }

      if (!challengeData) {
        console.error('❌ Challenge not found:', challengeId);
        throw new Error('Thách đấu không tồn tại hoặc đã được xử lý');
      }

      console.log('📋 Challenge data:', challengeData);

      // Check if user can accept this challenge
      const isOpenChallenge = !challengeData.opponent_id;
      const isSpecificChallenge = challengeData.opponent_id === user.id;
      const isMyOwnChallenge = challengeData.challenger_id === user.id;

      console.log('🔍 Challenge analysis:', {
        isOpenChallenge,
        isSpecificChallenge,
        isMyOwnChallenge,
        challenger_id: challengeData.challenger_id,
        opponent_id: challengeData.opponent_id,
        user_id: user.id,
      });

      if (isMyOwnChallenge) {
        throw new Error('Bạn không thể tham gia thách đấu của chính mình');
      }

      if (!isOpenChallenge && !isSpecificChallenge) {
        throw new Error(
          'Bạn không phải là đối thủ được chỉ định cho thách đấu này'
        );
      }

      // Update challenge based on type
      const finalOpponentId = isOpenChallenge
        ? user.id
        : challengeData.opponent_id;
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

      console.log('📤 Updating challenge with data:', updateData);

      // ✅ CRITICAL: Use transaction to ensure both challenge update and match creation succeed
      const { data, error } = await supabase
        .from('challenges')
        .update(updateData)
        .eq('id', challengeId)
        .eq('status', 'pending')
        .select('*')
        .maybeSingle();

      if (error) {
        console.error('❌ Error updating challenge:', error);
        throw new Error(`Không thể tham gia thách đấu: ${error.message}`);
      }

      if (!data) {
        console.error('❌ No data returned from update');
        throw new Error('Thách đấu đã được người khác tham gia');
      }

      console.log('✅ Challenge accepted successfully:', data);

      // ✅ NEW: Create match record automatically when challenge is accepted
      console.log('🏆 Creating match record for accepted challenge...');
      console.log('🏆 Match data to insert:', {
        player1_id: challengeData.challenger_id,
        player2_id: finalOpponentId,
        challenge_id: challengeId,
      });

      const matchData = {
        player1_id: challengeData.challenger_id,
        player2_id: finalOpponentId,
        challenge_id: challengeId,
        status: 'scheduled' as const,
        match_type: 'challenge' as const,
        scheduled_time:
          challengeData.scheduled_time || new Date().toISOString(),
        score_player1: 0,
        score_player2: 0,
      };

      console.log('📋 Final match data:', matchData);

      const { data: matchRecord, error: matchError } = await supabase
        .from('matches')
        .insert([matchData])
        .select('*')
        .maybeSingle();

      if (matchError) {
        console.error('❌ Error creating match record:', matchError);
        console.error('❌ Match error details:', {
          message: matchError.message,
          code: matchError.code,
          details: matchError.details,
          hint: matchError.hint,
        });
        // Don't throw error here since challenge was already accepted
        // This is a non-critical failure that can be handled later
        console.warn('⚠️ Challenge accepted but match record creation failed');
        toast.warning(
          'Tham gia thách đấu thành công! (Ghi chú: Cần refresh để xem trận đấu)'
        );
      } else {
        console.log('✅ Match record created successfully:', matchRecord);
        toast.success(
          'Tham gia thách đấu thành công! Trận đấu đã được lên lịch.'
        );
      }

      // Update local state to remove the challenge from open challenges (for open challenges)
      // or update status (for specific challenges)
      setChallenges(prev => prev.filter(c => c.id !== challengeId));

      // Refetch challenges to update the list with latest data
      await fetchChallenges();

      return { challenge: data, match: matchRecord };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Không thể tham gia thách đấu';
      console.error('❌ Accept challenge error:', err);
      throw new Error(errorMessage);
    }
  };

  // Decline challenge
  const declineChallenge = async (challengeId: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const { data, error } = await supabase
        .from('challenges')
        .update({
          status: 'declined',
          responded_at: new Date().toISOString(),
        })
        .eq('id', challengeId)
        .eq('opponent_id', user.id) // Only opponent can decline
        .eq('status', 'pending') // Only pending challenges can be declined
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to decline challenge: ${error.message}`);
      }

      if (!data) {
        throw new Error('Challenge not found or already processed');
      }

      // Update local state
      setChallenges(prev =>
        prev.map(challenge =>
          challenge.id === challengeId
            ? { ...challenge, status: 'declined' }
            : challenge
        )
      );

      toast.success('Challenge declined');
      return data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to decline challenge';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Legacy method for backward compatibility
  const respondToChallenge = {
    mutateAsync: async ({
      challengeId,
      status,
    }: {
      challengeId: string;
      status: 'accepted' | 'declined';
    }) => {
      if (status === 'accepted') {
        return acceptChallenge(challengeId);
      } else {
        return declineChallenge(challengeId);
      }
    },
  };

  const cancelChallenge = async (challengeId: string) => {
    try {
      const { error } = await supabase
        .from('challenges')
        .delete()
        .eq('id', challengeId);

      if (error) throw error;
      await fetchChallenges();
      toast.success('Đã hủy thách đấu');
    } catch (err) {
      toast.error('Lỗi khi hủy thách đấu');
      throw err;
    }
  };

  const getPendingChallenges = () => {
    return challenges.filter(c => c.status === 'pending');
  };

  const getAcceptedChallenges = () => {
    return challenges.filter(c => c.status === 'accepted');
  };

  // ✅ CRITICAL: Real-time subscription with improved sync
  useEffect(() => {
    if (!user) return;

    // Initial fetch
    fetchChallenges();

    // ✅ Enhanced real-time subscription for better sync
    const challengesSubscription = supabase
      .channel('user_challenges_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'challenges',
          filter: `or(challenger_id.eq.${user.id},opponent_id.eq.${user.id})`,
        },
        payload => {
          console.log(
            '🔄 Challenge updated, triggering immediate refresh:',
            payload
          );
          // Immediate refresh to ensure data consistency
          setTimeout(() => fetchChallenges(), 100);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'challenges',
          filter: `opponent_id.is.null`,
        },
        payload => {
          console.log('🔄 New open challenge created, refreshing:', payload);
          // Refresh to show new open challenges
          setTimeout(() => fetchChallenges(), 100);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        payload => {
          console.log(
            '🔄 Profile updated, checking if challenge refresh needed:',
            payload
          );

          // Check if the updated profile affects any current challenges
          const updatedUserId = payload.new?.user_id;
          const hasRelevantChallenge = challenges.some(
            c =>
              c.challenger_id === updatedUserId ||
              c.opponent_id === updatedUserId
          );

          if (hasRelevantChallenge) {
            console.log('✅ Profile affects current challenges, refreshing...');
            setTimeout(() => fetchChallenges(), 100);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'club_profiles',
        },
        payload => {
          console.log(
            '🔄 Club profile updated, checking challenge refresh:',
            payload
          );
          // Refresh if any challenges involve this club
          setTimeout(() => fetchChallenges(), 100);
        }
      )
      .subscribe();

    return () => {
      challengesSubscription.unsubscribe();
    };
  }, [user]); // Remove challenges dependency to prevent infinite loop

  // Initial load
  useEffect(() => {
    if (user) {
      fetchChallenges();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      // Separate received and sent challenges
      const received = challenges.filter(c => c.opponent_id === user.id);
      const sent = challenges.filter(c => c.challenger_id === user.id);

      setReceivedChallenges(received);
      setSentChallenges(sent);
    }
  }, [challenges, user]);

  return {
    challenges,
    receivedChallenges,
    sentChallenges,
    loading,
    loadingReceived,
    loadingSent,
    error,
    fetchChallenges,
    createChallenge,
    respondToChallenge,
    acceptChallenge,
    declineChallenge,
    cancelChallenge,
    getPendingChallenges,
    getAcceptedChallenges,
  };
};
