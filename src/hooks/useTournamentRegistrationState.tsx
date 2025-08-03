import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useTournamentRegistrationState = () => {
  const { user } = useAuth();
  const [registrationState, setRegistrationState] = useState<
    Record<string, boolean>
  >({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  // Auto-clear state when user logs out
  useEffect(() => {
    if (!user) {
      setRegistrationState({});
      setLoading({});
      console.log('User logged out - cleared registration state');
    }
  }, [user]);

  // Direct database check function
  const checkRegistrationStatus = useCallback(
    async (tournamentId: string): Promise<boolean> => {
      if (!user?.id) return false;

      try {
        const { data, error } = await supabase
          .from('tournament_registrations')
          .select('id')
          .eq('tournament_id', tournamentId)
          .eq('user_id', user.id)
          .limit(1);

        if (error) {
          console.error('Error checking registration:', error);
          return false;
        }

        return data && data.length > 0;
      } catch (error) {
        console.error('Error checking registration:', error);
        return false;
      }
    },
    [user?.id]
  );

  // Load registration status for tournaments
  const loadRegistrationStatus = useCallback(
    async (tournamentIds: string[]) => {
      if (!user?.id || tournamentIds.length === 0) return;

      const newState: Record<string, boolean> = {};

      for (const tournamentId of tournamentIds) {
        const isRegistered = await checkRegistrationStatus(tournamentId);
        newState[tournamentId] = isRegistered;
      }

      setRegistrationState(prev => ({ ...prev, ...newState }));
    },
    [user?.id, checkRegistrationStatus]
  );

  // Set registration status manually
  const setRegistrationStatus = useCallback(
    (tournamentId: string, isRegistered: boolean) => {
      setRegistrationState(prev => ({
        ...prev,
        [tournamentId]: isRegistered,
      }));
    },
    []
  );

  // Set loading state
  const setLoadingState = useCallback(
    (tournamentId: string, isLoading: boolean) => {
      setLoading(prev => ({
        ...prev,
        [tournamentId]: isLoading,
      }));
    },
    []
  );

  // Get registration status
  const isRegistered = useCallback(
    (tournamentId: string): boolean => {
      return registrationState[tournamentId] || false;
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

  // Clear all state
  const clearState = useCallback(() => {
    setRegistrationState({});
    setLoading({});
  }, []);

  return {
    loadRegistrationStatus,
    setRegistrationStatus,
    setLoadingState,
    isRegistered,
    isLoading,
    clearState,
    registrationState,
  };
};
