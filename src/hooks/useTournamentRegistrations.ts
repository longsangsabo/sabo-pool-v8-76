import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Player {
  id?: string;
  user_id: string;
  full_name?: string;
  display_name?: string;
  avatar_url?: string;
  current_rank?: string;
  verified_rank?: string;
  elo?: number;
  elo_rating?: number;
}

interface Registration {
  id: string;
  tournament_id: string;
  user_id: string;
  registration_status: string;
  payment_status: string;
  registration_date?: string;
  created_at: string;

  notes?: string;
  profiles?: Player; // This matches the Supabase query structure
  player?: Player; // This is what we'll transform to
}

export const useTournamentRegistrations = (tournamentId: string) => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRegistrations = async () => {
    if (!tournamentId) {
      setRegistrations([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Fetching registrations for tournament:', tournamentId);

      // Fetch tournament registrations with enhanced player data
      const { data, error: fetchError } = await supabase
        .from('tournament_registrations')
        .select(
          `
          id,
          tournament_id,
          user_id,
          registration_status,
          payment_status,
          created_at,
          notes,
          profiles!tournament_registrations_user_id_fkey (
            id,
            user_id,
            full_name,
            display_name,
            avatar_url,
            verified_rank
          )
        `
        )
        .eq('tournament_id', tournamentId)
        .order('created_at', { ascending: true });

      if (fetchError) {
        console.error(
          '❌ Error fetching tournament registrations:',
          fetchError
        );
        throw fetchError;
      }

      console.log('✅ Fetched registrations:', data?.length || 0);

      // Transform the data to match our interface
      const transformedData = (data || []).map(reg => ({
        ...reg,
        player: reg.profiles
          ? {
              id: reg.profiles.id,
              user_id: reg.profiles.user_id,
              full_name: reg.profiles.full_name,
              display_name: reg.profiles.display_name,
              avatar_url: reg.profiles.avatar_url,
              current_rank: 'K', // Default rank
              verified_rank: reg.profiles.verified_rank,
              elo: 1000, // Default ELO
            }
          : undefined,
      }));

      setRegistrations(transformedData);
    } catch (err) {
      console.error('❌ Error in fetchRegistrations:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to fetch registrations'
      );
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    if (!tournamentId) return;

    console.log(
      '🔄 Setting up real-time subscription for registrations:',
      tournamentId
    );

    const channel = supabase
      .channel(`tournament-registrations-${tournamentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournament_registrations',
          filter: `tournament_id=eq.${tournamentId}`,
        },
        payload => {
          console.log('🔄 Registration real-time update:', payload);

          // Immediately refetch to ensure accuracy with profile data
          fetchRegistrations();
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 Cleaning up registration real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [tournamentId]);

  useEffect(() => {
    fetchRegistrations();
  }, [tournamentId]);

  return {
    registrations,
    loading,
    error,
    fetchRegistrations,
    refetch: fetchRegistrations,
  };
};
