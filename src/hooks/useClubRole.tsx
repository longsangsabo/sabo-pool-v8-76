import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useClubRole = () => {
  const { user } = useAuth();
  const [isClubOwner, setIsClubOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [clubProfile, setClubProfile] = useState<any>(null);
  const cacheRef = useRef<{
    userId?: string;
    result?: any;
    timestamp?: number;
  }>({});
  const timeoutRef = useRef<NodeJS.Timeout>();

  const checkClubStatus = useCallback(async () => {
    if (!user) {
      setIsClubOwner(false);
      setIsLoading(false);
      cacheRef.current = {};
      return;
    }

    // Check cache first (valid for 5 minutes)
    const now = Date.now();
    const cache = cacheRef.current;
    if (
      cache.userId === user.id &&
      cache.timestamp &&
      now - cache.timestamp < 300000
    ) {
      const { isOwner, clubData, hasClubRole, hasClubProfile } = cache.result;
      setIsClubOwner(isOwner);
      setClubProfile(clubData);
      setIsLoading(false);
      return;
    }

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce API calls
    timeoutRef.current = setTimeout(async () => {
      try {
        setIsLoading(true);

        // Single query to get both profile and club data
        const [profileResult, clubResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('role')
            .eq('user_id', user.id)
            .single(),
          supabase
            .from('club_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single(),
        ]);

        const { data: profile, error: profileError } = profileResult;
        const { data: clubData, error: clubError } = clubResult;

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error fetching profile:', profileError);
          setIsClubOwner(false);
          setIsLoading(false);
          return;
        }

        // Check if user has club role
        const hasClubRole =
          profile?.role === 'club_owner' || profile?.role === 'both';

        // Check if user has a club profile (owns a club)
        const hasClubProfile = !clubError && clubData;

        if (hasClubProfile) {
          setClubProfile(clubData);
          console.log('🏢 Club profile found:', clubData);
        }

        // User is club owner if they have club role OR have a club profile
        const isOwner = hasClubRole || !!hasClubProfile;
        setIsClubOwner(isOwner);

        // Cache the result
        cacheRef.current = {
          userId: user.id,
          result: { isOwner, clubData, hasClubRole, hasClubProfile },
          timestamp: now,
        };

        console.log('🔍 Club status check:', {
          hasClubRole,
          hasClubProfile: !!hasClubProfile,
          isOwner,
          userRole: profile?.role,
          clubName: clubData?.club_name,
        });
      } catch (error) {
        console.error('Error checking club status:', error);
        setIsClubOwner(false);
      } finally {
        setIsLoading(false);
      }
    }, 200); // 200ms debounce
  }, [user]);

  useEffect(() => {
    checkClubStatus();
  }, [checkClubStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isClubOwner,
    isLoading,
    clubProfile,
    refetchClubStatus: checkClubStatus,
  };
};
