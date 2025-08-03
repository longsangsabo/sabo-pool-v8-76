import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProfileData {
  user_id: string;
  full_name: string;
  display_name: string;
  avatar_url: string | null;
  verified_rank: string | null;
}

interface ProfileCache {
  [userId: string]: ProfileData;
}

const profileCache: ProfileCache = {};
const pendingRequests = new Map<string, Promise<ProfileData | null>>();

export const useProfileCache = () => {
  const [cachedProfiles, setCachedProfiles] =
    useState<ProfileCache>(profileCache);

  const getProfile = useCallback(
    async (userId: string): Promise<ProfileData | null> => {
      // Return cached profile if available
      if (profileCache[userId]) {
        return profileCache[userId];
      }

      // Return pending request if already in progress
      if (pendingRequests.has(userId)) {
        return pendingRequests.get(userId)!;
      }

      // Create new request
      const request = fetchProfile(userId);
      pendingRequests.set(userId, request);

      try {
        const profile = await request;
        if (profile) {
          profileCache[userId] = profile;
          setCachedProfiles({ ...profileCache });
        }
        return profile;
      } finally {
        pendingRequests.delete(userId);
      }
    },
    []
  );

  const fetchProfile = async (userId: string): Promise<ProfileData | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, display_name, avatar_url, verified_rank')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      return null;
    }
  };

  const getMultipleProfiles = useCallback(
    async (userIds: string[]): Promise<ProfileData[]> => {
      const profiles = await Promise.all(
        userIds.map(async userId => {
          if (!userId) return null;
          return await getProfile(userId);
        })
      );

      return profiles.filter(Boolean) as ProfileData[];
    },
    [getProfile]
  );

  const clearCache = useCallback(() => {
    Object.keys(profileCache).forEach(key => delete profileCache[key]);
    setCachedProfiles({});
  }, []);

  return {
    getProfile,
    getMultipleProfiles,
    clearCache,
    cachedProfiles,
  };
};
