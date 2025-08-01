import { useState, useEffect, useCallback, useMemo } from 'react';
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
}

// Cache for profiles to avoid re-fetching
const profileCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useOptimizedChallenges = (): UseOptimizedChallengesReturn => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

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
        if (cached && (now - cached.timestamp) < CACHE_DURATION) {
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
            .select('user_id, full_name, display_name, verified_rank, elo, avatar_url')
            .in('user_id', Array.from(uncachedUserIds)),
          supabase
            .from('player_rankings')
            .select('user_id, spa_points, elo_points')
            .in('user_id', Array.from(uncachedUserIds))
        ]);

        if (profilesRes.data) {
          freshProfiles = profilesRes.data.map(profile => {
            const ranking = (rankingsRes.data || []).find(r => r.user_id === profile.user_id);
            return {
              ...profile,
              spa_points: ranking?.spa_points || 0,
              elo_points: ranking?.elo_points || 1000
            };
          });
        }

        // Cache fresh profiles
        freshProfiles.forEach(profile => {
          profileCache.set(profile.user_id, {
            data: profile,
            timestamp: now
          });
          cachedProfiles.set(profile.user_id, profile);
        });
      }

      // Enrich challenges with cached + fresh profile data
      const enrichedChallenges = challengesData?.map(challenge => ({
        ...challenge,
        challenger_profile: cachedProfiles.get(challenge.challenger_id) || null,
        opponent_profile: cachedProfiles.get(challenge.opponent_id) || null,
      })) || [];

      setChallenges(enrichedChallenges as any);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('❌ Challenge fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Memoized derived data
  const { receivedChallenges, sentChallenges, openChallenges } = useMemo(() => {
    if (!user) return { receivedChallenges: [], sentChallenges: [], openChallenges: [] };

    return {
      receivedChallenges: challenges.filter(c => c.opponent_id === user.id),
      sentChallenges: challenges.filter(c => c.challenger_id === user.id),
      openChallenges: challenges.filter(c => !c.opponent_id && c.status === 'pending' && c.challenger_id !== user.id)
    };
  }, [challenges, user]);

  const createChallenge = useCallback(async (challengeData: CreateChallengeData) => {
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
        throw new Error('Daily challenge limit reached (2 challenges per day)');
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to create challenge';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user, fetchChallenges]);

  const acceptChallenge = useCallback(async (challengeId: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data: challengeData, error: fetchError } = await supabase
        .from('challenges')
        .select('*')
        .eq('id', challengeId)
        .eq('status', 'pending')
        .single();

      if (fetchError) throw fetchError;
      if (!challengeData) throw new Error('Challenge not found or already processed');

      const isOpenChallenge = !challengeData.opponent_id;
      const isSpecificChallenge = challengeData.opponent_id === user.id;
      const isMyOwnChallenge = challengeData.challenger_id === user.id;

      if (isMyOwnChallenge) throw new Error('Cannot accept your own challenge');
      if (!isOpenChallenge && !isSpecificChallenge) throw new Error('Not authorized to accept this challenge');

      const updateData = isOpenChallenge 
        ? { status: 'accepted' as const, opponent_id: user.id, responded_at: new Date().toISOString() }
        : { status: 'accepted' as const, responded_at: new Date().toISOString() };

      const { data, error } = await supabase
        .from('challenges')
        .update(updateData)
        .eq('id', challengeId)
        .eq('status', 'pending')
        .select('*')
        .single();

      if (error) throw error;
      if (!data) throw new Error('Challenge was already accepted by someone else');

      await fetchChallenges(); // Refresh to update state
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to accept challenge';
      throw new Error(errorMessage);
    }
  }, [user, fetchChallenges]);

  const declineChallenge = useCallback(async (challengeId: string) => {
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to decline challenge';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user, fetchChallenges]);

  const cancelChallenge = useCallback(async (challengeId: string) => {
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
  }, [fetchChallenges]);

  const getPendingChallenges = useCallback(() => {
    return challenges.filter(c => c.status === 'pending');
  }, [challenges]);

  const getAcceptedChallenges = useCallback(() => {
    return challenges.filter(c => c.status === 'accepted');
  }, [challenges]);

  // Optimized real-time subscription - single channel
  useEffect(() => {
    if (!user) return;

    fetchChallenges();

    const subscription = supabase
      .channel('optimized_challenges')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'challenges'
      }, (payload) => {
        console.log('🔄 Challenge change detected, refreshing...');
        // Debounced refresh
        setTimeout(() => fetchChallenges(), 200);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user, fetchChallenges]);

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
  };
};