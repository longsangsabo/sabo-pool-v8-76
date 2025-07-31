
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Challenge, CreateChallengeData, AcceptChallengeRequest } from '@/types/challenge';

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

      console.log('✅ Fetching challenges for user:', user.id);

      // ✅ CRITICAL FIX: Use simple select without relationships
      const { data: challengesData, error: fetchError } = await supabase
        .from('challenges')
        .select('*')
        .or(`challenger_id.eq.${user.id},opponent_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw new Error(`Database error: ${fetchError.message}`);
      }

      // Fetch profile data separately to avoid relationship issues
      const userIds = new Set<string>();
      challengesData?.forEach(challenge => {
        if (challenge.challenger_id) userIds.add(challenge.challenger_id);
        if (challenge.opponent_id) userIds.add(challenge.opponent_id);
      });

      // Fetch all user profiles in one query
      let profiles: any[] = [];
      if (userIds.size > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select(`
            user_id, 
            full_name, 
            display_name, 
            verified_rank, 
            elo, 
            avatar_url
          `)
          .in('user_id', Array.from(userIds));
        
        profiles = profilesData || [];
      }

      // Create a map for quick profile lookup
      const profileMap = new Map();
      profiles.forEach(profile => {
        profileMap.set(profile.user_id, profile);
      });

      // Map challenges with profile data
      const enrichedChallenges = challengesData?.map(challenge => ({
        ...challenge,
        challenger_profile: profileMap.get(challenge.challenger_id),
        opponent_profile: profileMap.get(challenge.opponent_id),
        current_user_profile: profileMap.get(user.id)
      })) || [];

      setChallenges(enrichedChallenges as unknown as Challenge[]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
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

      // Create challenge with 48h expiration
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
        .select('user_id, full_name, display_name, verified_rank, elo, avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();

      const { data: opponentProfile } = await supabase
        .from('profiles')
        .select('user_id, full_name, display_name, verified_rank, elo, avatar_url')
        .eq('user_id', challengeData.opponent_id)
        .maybeSingle();
      
      const enrichedChallenge = {
        ...data,
        challenger_profile: challengerProfile,
        opponent_profile: opponentProfile,
        current_user_profile: challengerProfile
      };

      // Update local state with type assertion
      setChallenges(prev => [enrichedChallenge as unknown as Challenge, ...prev]);
      toast.success('Challenge created successfully!');
      
      return enrichedChallenge;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create challenge';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Accept challenge
  const acceptChallenge = async (challengeId: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const { data, error } = await supabase
        .from('challenges')
        .update({
          status: 'accepted',
          responded_at: new Date().toISOString(),
        })
        .eq('id', challengeId)
        .eq('opponent_id', user.id) // Only opponent can accept
        .eq('status', 'pending') // Only pending challenges can be accepted
        .select('*')
        .single();

      if (error) {
        throw new Error(`Failed to accept challenge: ${error.message}`);
      }

      if (!data) {
        throw new Error('Challenge not found or already processed');
      }

      // Fetch profile data separately for consistency
      const { data: challengerProfile } = await supabase
        .from('profiles')
        .select('user_id, full_name, display_name, verified_rank, elo, avatar_url')
        .eq('user_id', data.challenger_id)
        .maybeSingle();

      const { data: opponentProfile } = await supabase
        .from('profiles')
        .select('user_id, full_name, display_name, verified_rank, elo, avatar_url')
        .eq('user_id', data.opponent_id)
        .maybeSingle();
      
      const enrichedChallenge = {
        ...data,
        challenger_profile: challengerProfile,
        opponent_profile: opponentProfile,
        current_user_profile: opponentProfile
      };

      // Update local state with type assertion
      setChallenges(prev => 
        prev.map(challenge => 
          challenge.id === challengeId ? (enrichedChallenge as unknown as Challenge) : challenge
        )
      );

      toast.success('Challenge accepted!');
      return enrichedChallenge;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to accept challenge';
      toast.error(errorMessage);
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
          challenge.id === challengeId ? { ...challenge, status: 'declined' } : challenge
        )
      );

      toast.success('Challenge declined');
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to decline challenge';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Legacy method for backward compatibility
  const respondToChallenge = {
    mutateAsync: async ({ challengeId, status }: {
      challengeId: string;
      status: 'accepted' | 'declined';
    }) => {
      if (status === 'accepted') {
        return acceptChallenge(challengeId);
      } else {
        return declineChallenge(challengeId);
      }
    }
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
        (payload) => {
          console.log('🔄 Challenge updated, triggering immediate refresh:', payload);
          // Immediate refresh to ensure data consistency
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
        (payload) => {
          console.log('🔄 Profile updated, checking if challenge refresh needed:', payload);
          
          // Check if the updated profile affects any current challenges
          const updatedUserId = payload.new?.user_id;
          const hasRelevantChallenge = challenges.some(c => 
            c.challenger_id === updatedUserId || c.opponent_id === updatedUserId
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
        (payload) => {
          console.log('🔄 Club profile updated, checking challenge refresh:', payload);
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
