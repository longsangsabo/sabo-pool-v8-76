import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface OptimizedAuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

export const useOptimizedAuth = () => {
  const [authState, setAuthState] = useState<OptimizedAuthState>({
    user: null,
    loading: true,
    isAuthenticated: false,
    isAdmin: false,
  });

  const cacheRef = useRef<{
    userId?: string;
    isAdmin?: boolean;
    timestamp?: number;
  }>({});
  const debounceRef = useRef<NodeJS.Timeout>();

  // Optimized auth check with caching and debouncing
  const checkAuthStatus = useCallback(async () => {
    // Clear any pending debounced calls
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    return new Promise<OptimizedAuthState>(resolve => {
      debounceRef.current = setTimeout(async () => {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();

          let isAdmin = false;
          if (user) {
            // Check cache first (valid for 5 minutes)
            const now = Date.now();
            const cache = cacheRef.current;

            if (
              cache.userId === user.id &&
              cache.timestamp &&
              now - cache.timestamp < 300000
            ) {
              isAdmin = cache.isAdmin || false;
            } else {
              // Fetch admin status and cache it
              const { data: profile } = await supabase
                .from('profiles')
                .select('is_admin')
                .eq('user_id', user.id)
                .single();

              isAdmin = profile?.is_admin || false;

              // Update cache
              cacheRef.current = {
                userId: user.id,
                isAdmin,
                timestamp: now,
              };
            }
          }

          const newState = {
            user,
            loading: false,
            isAuthenticated: !!user,
            isAdmin,
          };

          resolve(newState);
        } catch (error) {
          console.error('Optimized auth check failed:', error);
          const errorState = {
            user: null,
            loading: false,
            isAuthenticated: false,
            isAdmin: false,
          };
          resolve(errorState);
        }
      }, 100); // 100ms debounce
    });
  }, []);

  // Optimized sign out function
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();

      // Clear cache
      cacheRef.current = {};

      setAuthState({
        user: null,
        loading: false,
        isAuthenticated: false,
        isAdmin: false,
      });
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }, []);

  useEffect(() => {
    // Initial auth check
    const performInitialCheck = async () => {
      try {
        const result = await checkAuthStatus();
        setAuthState(result);
      } catch (error) {
        console.error('Initial auth check failed:', error);
        setAuthState({
          user: null,
          loading: false,
          isAuthenticated: false,
          isAdmin: false,
        });
      }
    };

    performInitialCheck();

    // Listen for auth changes with optimized handling
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        cacheRef.current = {};
        setAuthState({
          user: null,
          loading: false,
          isAuthenticated: false,
          isAdmin: false,
        });
      } else if (session?.user) {
        try {
          const result = await checkAuthStatus();
          setAuthState(result);
        } catch (error) {
          console.error('Auth state change check failed:', error);
          setAuthState({
            user: session.user,
            loading: false,
            isAuthenticated: true,
            isAdmin: false,
          });
        }
      }
    });

    // Cleanup function
    return () => {
      subscription.unsubscribe();
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [checkAuthStatus]);

  // Memoized return value to prevent unnecessary re-renders
  return useMemo(
    () => ({
      ...authState,
      signOut,
      refreshAuth: checkAuthStatus,
    }),
    [authState, signOut, checkAuthStatus]
  );
};
