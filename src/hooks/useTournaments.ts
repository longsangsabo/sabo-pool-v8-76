import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tournament } from '@/types/tournament';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useTournaments = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const fetchTournaments = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('tournaments')
        .select(
          `
          *,
          club_profiles!tournaments_club_id_fkey(*)
        `
        )
        .is('deleted_at', null) // Filter out soft deleted tournaments
        .in('status', [
          'completed',
          'registration_open',
          'registration_closed',
          'ongoing',
        ]) // Show valid tournament statuses
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Transform database data to match Tournament interface
      const transformedData = (data || []).map(tournament => ({
        ...tournament,
        tournament_type: tournament.tournament_type as
          | 'single_elimination'
          | 'double_elimination'
          | 'round_robin'
          | 'swiss',
        game_format: (tournament.game_format || '8_ball') as
          | '8_ball'
          | '9_ball'
          | '10_ball'
          | 'straight_pool',
        registration_start:
          tournament.registration_start || tournament.created_at,
        registration_end:
          tournament.registration_end ||
          tournament.start_date ||
          tournament.created_at,
        tournament_start: tournament.start_date || tournament.created_at,
        tournament_end:
          tournament.end_date || tournament.start_date || tournament.created_at,
        club_id: tournament.club_id || '',
        entry_fee: tournament.entry_fee || 0,
        prize_pool: tournament.prize_pool || 0,
        first_prize: tournament.first_prize || 0,
        second_prize: tournament.second_prize || 0,
        third_prize: tournament.third_prize || 0,
        status: (tournament.status === 'upcoming'
          ? 'registration_open'
          : tournament.status) as
          | 'registration_open'
          | 'registration_closed'
          | 'ongoing'
          | 'completed'
          | 'cancelled',
        management_status: ((tournament as any).management_status || 'open') as
          | 'open'
          | 'locked'
          | 'ongoing'
          | 'completed',
        // Parse JSONB fields properly
        // Use tournament_prize_tiers for rewards instead
        rewards: undefined,
        spa_points_config: null, // Column doesn't exist yet
        elo_points_config: null, // Column doesn't exist yet
      }));
      setTournaments(transformedData);
    } catch (err) {
      console.error('Error fetching tournaments:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to fetch tournaments'
      );
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  };

  const joinTournament = useMutation({
    mutationFn: async ({ tournamentId }: { tournamentId: string }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('tournament_registrations')
        .insert({
          tournament_id: tournamentId,
          user_id: user.id,
          status: 'registered',
          payment_status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      fetchTournaments();
    },
  });

  const registerForTournament = useMutation({
    mutationFn: async ({
      tournamentId,
      paymentData,
    }: {
      tournamentId: string;
      paymentData?: any;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('tournament_registrations')
        .insert({
          tournament_id: tournamentId,
          user_id: user.id,
          status: 'confirmed',
          payment_status: paymentData ? 'paid' : 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      fetchTournaments();
    },
  });

  useEffect(() => {
    fetchTournaments();
  }, []);

  return {
    tournaments,
    loading,
    error,
    fetchTournaments,
    refetch: fetchTournaments,
    joinTournament,
    registerForTournament,
  };
};
