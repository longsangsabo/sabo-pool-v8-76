import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useRealTimeTournamentState = () => {
  const { user } = useAuth();
  const [registrationState, setRegistrationState] = useState<
    Record<string, boolean>
  >({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const syncIntervalRef = useRef<NodeJS.Timeout>();

  // Auto-clear state when user logs out
  useEffect(() => {
    if (!user) {
      setRegistrationState({});
      setLoading({});
      console.log('User logged out - cleared registration state');
    }
  }, [user]);

  // Auto-sync every 30 seconds when user is active
  useEffect(() => {
    if (!user?.id) return;

    const startAutoSync = () => {
      syncIntervalRef.current = setInterval(() => {
        setLastSync(new Date());
        console.log('Auto-syncing registration state...');
      }, 30000); // 30 seconds
    };

    const stopAutoSync = () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };

    // Start auto-sync when user is active
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopAutoSync();
      } else {
        startAutoSync();
        setLastSync(new Date()); // Immediate sync when becoming visible
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    startAutoSync();

    return () => {
      stopAutoSync();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.id]);

  // Enhanced database check with retry logic
  const checkRegistrationStatus = useCallback(
    async (tournamentId: string, retries = 2): Promise<boolean> => {
      if (!user?.id) return false;

      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const { data, error } = await supabase
            .from('tournament_registrations')
            .select('id, registration_status')
            .eq('tournament_id', tournamentId)
            .eq('user_id', user.id)
            .limit(1);

          if (error) {
            if (attempt === retries) {
              console.error(
                'Final attempt failed for registration check:',
                error
              );
              return false;
            }
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
            continue;
          }

          const isRegistered =
            data &&
            data.length > 0 &&
            data[0].registration_status !== 'cancelled';
          console.log(
            `Registration check for ${tournamentId}:`,
            isRegistered,
            data
          );
          return isRegistered;
        } catch (error) {
          if (attempt === retries) {
            console.error('Registration check failed:', error);
            return false;
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      return false;
    },
    [user?.id]
  );

  // Batch load with parallel processing
  const loadRegistrationStatus = useCallback(
    async (tournamentIds: string[]) => {
      if (!user?.id || tournamentIds.length === 0) return;

      console.log(
        'Loading registration status for tournaments:',
        tournamentIds
      );

      // Parallel processing for better performance
      const promises = tournamentIds.map(async tournamentId => {
        const isRegistered = await checkRegistrationStatus(tournamentId);
        return { tournamentId, isRegistered };
      });

      try {
        const results = await Promise.all(promises);
        const newState: Record<string, boolean> = {};

        results.forEach(({ tournamentId, isRegistered }) => {
          newState[tournamentId] = isRegistered;
        });

        setRegistrationState(prev => {
          const updated = { ...prev, ...newState };
          console.log('Updated registration state:', updated);
          return updated;
        });
      } catch (error) {
        console.error('Batch registration check failed:', error);
      }
    },
    [user?.id, checkRegistrationStatus]
  );

  // Enhanced registration with immediate UI update
  const setRegistrationStatus = useCallback(
    (tournamentId: string, isRegistered: boolean) => {
      console.log(
        `Setting registration status for ${tournamentId}:`,
        isRegistered
      );
      setRegistrationState(prev => ({
        ...prev,
        [tournamentId]: isRegistered,
      }));
    },
    []
  );

  // Loading state management
  const setLoadingState = useCallback(
    (tournamentId: string, isLoading: boolean) => {
      setLoading(prev => ({
        ...prev,
        [tournamentId]: isLoading,
      }));
    },
    []
  );

  // Get registration status with fallback
  const isRegistered = useCallback(
    (tournamentId: string): boolean => {
      const status = registrationState[tournamentId];
      console.log(`Getting registration status for ${tournamentId}:`, status);
      return status || false;
    },
    [registrationState]
  );

  // Get loading status
  const isLoading = useCallback(
    (tournamentId: string): boolean => {
      return loading[tournamentId] || false;
    },
    [loading]
  );

  // Force refresh single tournament
  const refreshTournamentStatus = useCallback(
    async (tournamentId: string) => {
      console.log('Force refreshing tournament:', tournamentId);
      const status = await checkRegistrationStatus(tournamentId);
      setRegistrationStatus(tournamentId, status);
      return status;
    },
    [checkRegistrationStatus, setRegistrationStatus]
  );

  // Clear all state
  const clearState = useCallback(() => {
    setRegistrationState({});
    setLoading({});
    console.log('Cleared all registration state');
  }, []);

  return {
    loadRegistrationStatus,
    setRegistrationStatus,
    setLoadingState,
    isRegistered,
    isLoading,
    clearState,
    refreshTournamentStatus,
    lastSync,
    registrationState,
  };
};
