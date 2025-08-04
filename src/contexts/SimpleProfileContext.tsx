import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Simplified profile types
interface SimpleProfile {
  id: string;
  user_id: string;
  full_name: string;
  display_name?: string;
  phone?: string;
  city?: string;
  district?: string;
  avatar_url?: string;
  role?: string;
}

interface SimpleProfileContextType {
  profile: SimpleProfile | null;
  isLoading: boolean;
  updateProfile: (updates: Partial<SimpleProfile>) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}

const SimpleProfileContext = createContext<
  SimpleProfileContextType | undefined
>(undefined);

export const SimpleProfileProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [profile, setProfile] = useState<SimpleProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Add console logging for debugging real-time events

  // Single API call to fetch profile with enhanced logging
  const fetchProfile = useCallback(async () => {
    if (!user) {

      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(
          'id, user_id, full_name, display_name, phone, avatar_url, role, verified_rank'
        )
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('[SimpleProfileContext] Error fetching profile:', error);
        throw error;
      }

        id: data?.id,
        verified_rank: data?.verified_rank,
        full_name: data?.full_name,
      });

      setProfile(data);
    } catch (error) {
      console.error('[SimpleProfileContext] Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Simple update function
  const updateProfile = useCallback(
    async (updates: Partial<SimpleProfile>): Promise<boolean> => {
      if (!user || !profile) return false;

      try {
        const { error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('user_id', user.id);

        if (error) throw error;

        setProfile(prev => (prev ? { ...prev, ...updates } : null));
        return true;
      } catch (error) {
        console.error('Error updating profile:', error);
        return false;
      }
    },
    [user, profile]
  );

  const refreshProfile = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  // Real-time subscription for profile updates
  useEffect(() => {
    if (!user) return;

      '[SimpleProfileContext] Setting up real-time subscription for user:',
      user.id
    );

    const channel = supabase
      .channel('simple-profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user.id}`,
        },
        payload => {

            '[SimpleProfileContext] Real-time profile update received:',
            payload
          );

          // Check specifically for verified_rank changes with null safety
          const oldRank = payload.old?.verified_rank;
          const newRank = payload.new?.verified_rank;

          if (oldRank !== newRank) {

              old: oldRank,
              new: newRank,
            });

            // Force immediate profile refresh
            fetchProfile();
          }
        }
      )
      .subscribe(status => {

          '[SimpleProfileContext] Real-time subscription status:',
          status
        );
      });

    return () => {

      supabase.removeChannel(channel);
    };
  }, [user, fetchProfile]);

  // Auto-refresh on page focus
  useEffect(() => {
    const handleFocus = () => {

      fetchProfile();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchProfile]);

  // Background polling every 30 seconds
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {

      fetchProfile();
    }, 30000);

    return () => clearInterval(interval);
  }, [user, fetchProfile]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return (
    <SimpleProfileContext.Provider
      value={{
        profile,
        isLoading,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </SimpleProfileContext.Provider>
  );
};

export const useSimpleProfile = () => {
  const context = useContext(SimpleProfileContext);
  if (!context) {
    throw new Error(
      'useSimpleProfile must be used within SimpleProfileProvider'
    );
  }
  return context;
};
