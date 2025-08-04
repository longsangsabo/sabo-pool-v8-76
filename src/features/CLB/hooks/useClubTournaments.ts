import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ClubTournament {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  max_participants: number;
  entry_fee: number;
  prize_pool: number;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  tournament_type: 'single_elimination' | 'double_elimination' | 'round_robin';
  club_id: string;
  created_at: string;
  updated_at: string;
  participants_count?: number;
  created_by: string;
}

export const useClubTournaments = (clubId: string) => {
  const [tournaments, setTournaments] = useState<ClubTournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .eq('club_id', clubId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Cast to ClubTournament type and add default participant count
      const tournamentsWithCount = (data || []).map(tournament => ({
        ...tournament,
        status: tournament.status as ClubTournament['status'],
        tournament_type: tournament.tournament_type as ClubTournament['tournament_type'],
        participants_count: 0 // Will be updated by separate query if needed
      })) as ClubTournament[];

      setTournaments(tournamentsWithCount);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Lỗi khi tải danh sách giải đấu');
    } finally {
      setLoading(false);
    }
  };

  const createTournament = async (tournamentData: Omit<ClubTournament, 'id' | 'created_at' | 'updated_at' | 'participants_count'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Vui lòng đăng nhập');

      const { data, error } = await supabase
        .from('tournaments')
        .insert([{
          ...tournamentData,
          created_by: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      
      // Refresh tournaments list
      await fetchTournaments();
      return data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Lỗi khi tạo giải đấu');
    }
  };

  const updateTournament = async (tournamentId: string, updates: Partial<ClubTournament>) => {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', tournamentId)
        .eq('club_id', clubId)
        .select()
        .single();

      if (error) throw error;
      
      await fetchTournaments();
      return data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Lỗi khi cập nhật giải đấu');
    }
  };

  const deleteTournament = async (tournamentId: string) => {
    try {
      const { error } = await supabase
        .from('tournaments')
        .delete()
        .eq('id', tournamentId)
        .eq('club_id', clubId);

      if (error) throw error;
      
      await fetchTournaments();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Lỗi khi xóa giải đấu');
    }
  };

  const joinTournament = async (tournamentId: string) => {
    // TODO: Implement when tournament_participants table is created
    throw new Error('Tính năng này đang được phát triển');
  };

  const leaveTournament = async (tournamentId: string) => {
    // TODO: Implement when tournament_participants table is created
    throw new Error('Tính năng này đang được phát triển');
  };

  const getTournamentStats = () => {
    const upcomingTournaments = tournaments.filter(t => t.status === 'upcoming').length;
    const activeTournaments = tournaments.filter(t => t.status === 'active').length;
    const completedTournaments = tournaments.filter(t => t.status === 'completed').length;
    const totalPrizePool = tournaments.reduce((sum, t) => sum + (t.prize_pool || 0), 0);
    const totalParticipants = tournaments.reduce((sum, t) => sum + (t.participants_count || 0), 0);

    return {
      totalTournaments: tournaments.length,
      upcomingTournaments,
      activeTournaments,
      completedTournaments,
      totalPrizePool,
      totalParticipants
    };
  };

  useEffect(() => {
    if (clubId) {
      fetchTournaments();
    }
  }, [clubId]);

  return {
    tournaments,
    loading,
    error,
    createTournament,
    updateTournament,
    deleteTournament,
    joinTournament,
    leaveTournament,
    getTournamentStats,
    refetch: fetchTournaments
  };
};
