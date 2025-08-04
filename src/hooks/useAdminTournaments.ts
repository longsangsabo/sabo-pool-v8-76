import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTournaments } from './useTournaments';
import { Database } from '@/integrations/supabase/types';

export interface AdminTournamentData {
  name: string;
  description?: string;
  tournament_type: 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss';
  game_format: '8_ball' | '9_ball' | '10_ball' | 'straight_pool';
  max_participants: number;
  entry_fee: number;
  prize_pool: number;
  first_prize?: number;
  second_prize?: number;
  third_prize?: number;
  registration_start: string;
  registration_end: string;
  start_date: string;
  end_date?: string;
  venue_address?: string;
  city?: string;
  district?: string;
  club_id?: string;
}

type TournamentRegistrationRow = Database['public']['Tables']['tournament_registrations']['Row'];

export interface TournamentRegistration extends Omit<TournamentRegistrationRow, 'user_id'> {
  user_id: string;
  user?: {
    id: string;
    full_name: string;
    phone: string;
    verified_rank?: string;
    elo?: number;
  };
}

export interface TournamentStats {
  total: number;
  upcoming: number;
  active: number;
  completed: number;
  cancelled: number;
  total_participants: number;
  total_revenue: number;
  avg_participants_per_tournament: number;
}

export const useAdminTournaments = () => {
  const {
    tournaments,
    loading: baseTournamentsLoading,
    error: baseTournamentsError,
    fetchTournaments: refetchTournaments
  } = useTournaments();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create tournament
  const createTournament = useCallback(async (tournamentData: AdminTournamentData) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('tournaments')
        .insert({
          ...tournamentData,
          status: 'registration_open',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      await refetchTournaments();
      toast.success('Tạo giải đấu thành công');
      return data;
    } catch (err: any) {
      console.error('Error creating tournament:', err);
      const errorMessage = err.message || 'Lỗi không xác định';
      setError(errorMessage);
      toast.error(`Lỗi khi tạo giải đấu: ${errorMessage}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refetchTournaments]);

  // Update tournament
  const updateTournament = useCallback(async (id: string, updates: Partial<AdminTournamentData>) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('tournaments')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await refetchTournaments();
      toast.success('Cập nhật giải đấu thành công');
      return data;
    } catch (err: any) {
      console.error('Error updating tournament:', err);
      const errorMessage = err.message || 'Lỗi không xác định';
      setError(errorMessage);
      toast.error(`Lỗi khi cập nhật giải đấu: ${errorMessage}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refetchTournaments]);

  // Delete tournament (soft delete)
  const deleteTournament = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('tournaments')
        .update({
          deleted_at: new Date().toISOString(),
          status: 'cancelled'
        })
        .eq('id', id);

      if (error) throw error;

      await refetchTournaments();
      toast.success('Xóa giải đấu thành công');
    } catch (err: any) {
      console.error('Error deleting tournament:', err);
      const errorMessage = err.message || 'Lỗi không xác định';
      setError(errorMessage);
      toast.error(`Lỗi khi xóa giải đấu: ${errorMessage}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refetchTournaments]);

  // Update tournament status
  const updateTournamentStatus = useCallback(async (
    id: string, 
    status: 'registration_open' | 'registration_closed' | 'ongoing' | 'completed' | 'cancelled'
  ) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('tournaments')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      await refetchTournaments();
      toast.success(`Đã chuyển trạng thái giải đấu thành: ${status}`);
    } catch (err: any) {
      console.error('Error updating tournament status:', err);
      const errorMessage = err.message || 'Lỗi không xác định';
      setError(errorMessage);
      toast.error(`Lỗi khi cập nhật trạng thái: ${errorMessage}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refetchTournaments]);

  // Get tournament registrations
  const getTournamentRegistrations = useCallback(async (tournamentId: string): Promise<TournamentRegistration[]> => {
    try {
      const { data, error } = await supabase
        .from('tournament_registrations')
        .select(`
          *,
          profiles!tournament_registrations_user_id_fkey(
            id,
            full_name,
            phone,
            verified_rank,
            elo
          )
        `)
        .eq('tournament_id', tournamentId)
        .order('registration_date', { ascending: false });

      if (error) throw error;

      return (data || []).map(reg => ({
        ...reg,
        user: reg.profiles ? {
          id: reg.profiles.id,
          full_name: reg.profiles.full_name || 'N/A',
          phone: reg.profiles.phone || 'N/A',
          verified_rank: reg.profiles.verified_rank,
          elo: reg.profiles.elo
        } : undefined
      })) as TournamentRegistration[];
    } catch (err: any) {
      console.error('Error fetching tournament registrations:', err);
      toast.error('Lỗi khi tải danh sách đăng ký');
      return [];
    }
  }, []);

  // Get tournament statistics
  const getTournamentStats = useCallback(async (): Promise<TournamentStats> => {
    try {
      const { data: tournamentsData, error: tournamentsError } = await supabase
        .from('tournaments')
        .select('id, status, entry_fee')
        .is('deleted_at', null);

      if (tournamentsError) throw tournamentsError;

      const { data: registrationsData, error: registrationsError } = await supabase
        .from('tournament_registrations')
        .select('tournament_id, status, payment_status')
        .eq('status', 'confirmed');

      if (registrationsError) throw registrationsError;

      const total = tournamentsData?.length || 0;
      const upcoming = tournamentsData?.filter(t => t.status === 'registration_open').length || 0;
      const active = tournamentsData?.filter(t => ['registration_closed', 'ongoing'].includes(t.status)).length || 0;
      const completed = tournamentsData?.filter(t => t.status === 'completed').length || 0;
      const cancelled = tournamentsData?.filter(t => t.status === 'cancelled').length || 0;

      // Count participants by tournament
      const participantsByTournament = registrationsData?.reduce((acc, reg) => {
        acc[reg.tournament_id] = (acc[reg.tournament_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const total_participants = Object.values(participantsByTournament).reduce((sum, count) => sum + count, 0);

      // Calculate revenue
      const total_revenue = tournamentsData?.reduce((sum, tournament) => {
        const participants = participantsByTournament[tournament.id] || 0;
        return sum + (participants * (tournament.entry_fee || 0));
      }, 0) || 0;

      const avg_participants_per_tournament = total > 0 ? total_participants / total : 0;

      return {
        total,
        upcoming,
        active,
        completed,
        cancelled,
        total_participants,
        total_revenue,
        avg_participants_per_tournament: Math.round(avg_participants_per_tournament * 100) / 100
      };
    } catch (err: any) {
      console.error('Error getting tournament stats:', err);
      toast.error('Lỗi khi tải thống kê giải đấu');
      return {
        total: 0,
        upcoming: 0,
        active: 0,
        completed: 0,
        cancelled: 0,
        total_participants: 0,
        total_revenue: 0,
        avg_participants_per_tournament: 0
      };
    }
  }, []);

  // Cancel tournament registration
  const cancelRegistration = useCallback(async (registrationId: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('tournament_registrations')
        .update({ status: 'cancelled' })
        .eq('id', registrationId);

      if (error) throw error;
      toast.success('Hủy đăng ký thành công');
    } catch (err: any) {
      console.error('Error cancelling registration:', err);
      toast.error('Lỗi khi hủy đăng ký');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    tournaments,
    loading: baseTournamentsLoading || loading,
    error: baseTournamentsError || error,
    refetchTournaments,
    createTournament,
    updateTournament,
    deleteTournament,
    updateTournamentStatus,
    getTournamentRegistrations,
    getTournamentStats,
    cancelRegistration
  };
};

export default useAdminTournaments;
