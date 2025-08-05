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
  created_at: string;
  priority_order?: number;
  profiles?: Player; // This matches the Supabase query structure
  player?: Player; // This is what we'll transform to
}

export const useTournamentRegistrations = (tournamentId: string) => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRegistrations = async () => {
    if (!tournamentId) {
      setRegistrations([]);
      return;
    }

    try {
      setLoading(true);

      // Fetch tournament registrations with enhanced player data
      const { data, error } = await supabase
        .from('tournament_registrations')
        .select(
          `
          id,
          tournament_id,
          user_id,
          registration_status,
          created_at,
          priority_order,
          profiles!tournament_registrations_user_id_fkey (
            id,
            user_id,
            full_name,
            display_name,
            avatar_url,
            current_rank,
            verified_rank,
            elo
          )
        `
        )
        .eq('tournament_id', tournamentId)
        .order('priority_order', { ascending: true, nullsLast: true })
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching tournament registrations:', error);
        setRegistrations([]);
      } else {
        // Transform the data to match our interface
        const transformedData = (data || []).map(
          reg =>
            ({
              ...reg,
              player: reg.profiles
                ? {
                    id: reg.profiles.id,
                    user_id: reg.profiles.user_id,
                    full_name: reg.profiles.full_name,
                    display_name: reg.profiles.display_name,
                    avatar_url: reg.profiles.avatar_url,
                    current_rank: reg.profiles.current_rank,
                    verified_rank: reg.profiles.verified_rank,
                    elo: reg.profiles.elo || 1000,
                  }
                : undefined,
            }) as Registration
        );

        setRegistrations(transformedData);
      }
    } catch (error) {
      console.error('Error in fetchRegistrations:', error);
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [tournamentId]);

  return {
    registrations,
    loading,
    fetchRegistrations,
  };
};
