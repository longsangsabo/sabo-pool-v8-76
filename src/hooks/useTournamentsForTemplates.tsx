import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Tournament {
  id: string;
  name: string;
  status: string;
  tournament_type: string;
  max_participants: number;
  current_participants: number;
  created_at: string;
  tournament_start: string;
  club_id?: string;
  description?: string;
}

export const useTournamentsForTemplates = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTournaments = async () => {
    try {
      setLoading(true);

      // Fetch tournaments with valid statuses only
      const { data, error } = await supabase
        .from('tournaments')
        .select(
          `
          id,
          name,
          status,
          tournament_type,
          max_participants,
          current_participants,
          created_at,
          tournament_start,
          club_id,
          description
        `
        )
        .is('deleted_at', null) // Filter out soft deleted tournaments
        .in('status', [
          'registration_open',
          'registration_closed',
          'upcoming',
          'ongoing',
          'active',
          'completed',
        ]) // Show relevant tournament statuses
        .order('created_at', { ascending: false }); // Sort by newest first

      if (error) {
        console.error('Error fetching tournaments:', error);
        setTournaments([]);
      } else {
        setTournaments(data || []);
      }
    } catch (error) {
      console.error('Error in fetchTournaments:', error);
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  return {
    tournaments,
    loading,
    refetch: fetchTournaments,
  };
};
