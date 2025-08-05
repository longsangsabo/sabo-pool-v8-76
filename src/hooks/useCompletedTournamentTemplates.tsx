import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CompletedTournament {
  id: string;
  name: string;
  status: string;
  tournament_type: string;
  tournament_start: string;
  tournament_end: string;
  max_participants: number;
  current_participants: number;
  winner_id?: string;
  prize_pool?: number;
  created_at: string;
  duration_hours?: number;
  total_matches?: number;
  completion_rate?: number;
}

interface TournamentBracketData {
  tournament_id: string;
  matches: any[];
  results: any[];
  participants: any[];
  final_standings: any[];
  statistics: {
    total_matches: number;
    completion_rate: number;
    duration_hours: number;
    prize_distributed: number;
    spa_awarded: number;
  };
}

export const useCompletedTournamentTemplates = () => {
  const [completedTournaments, setCompletedTournaments] = useState<
    CompletedTournament[]
  >([]);
  const [selectedTournamentData, setSelectedTournamentData] =
    useState<TournamentBracketData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Fetch completed tournaments
  const fetchCompletedTournaments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .eq('status', 'completed')
        .order('start_date', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Simple completion without complex joins
      const completedData = (data || []).map(tournament => ({
        id: tournament.id,
        name: tournament.name || '',
        status: tournament.status || '',
        tournament_type: tournament.tournament_type || '',
        tournament_start: tournament.start_date || '',
        tournament_end: tournament.start_date || '',
        max_participants: tournament.max_participants || 0,
        current_participants: tournament.current_participants || 0,
        prize_pool: tournament.prize_pool || 0,
        created_at: tournament.created_at || '',
        duration_hours: 0,
        total_matches: 0,
        completion_rate: 100,
      }));

      setCompletedTournaments(completedData);
    } catch (error) {
      console.error('Error fetching completed tournaments:', error);
      toast.error('Không thể tải dữ liệu giải đấu đã hoàn thành');
    } finally {
      setIsLoading(false);
    }
  };

  // Load specific tournament bracket data
  const loadTournamentBracketData = async (
    tournamentId: string
  ): Promise<TournamentBracketData | null> => {
    setIsLoading(true);
    try {
      // Simple query without complex joins
      const { data: matchData, error: matchesError } = await supabase
        .from('tournament_matches')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('round_number', { ascending: true })
        .order('match_number', { ascending: true });

      if (matchesError) throw matchesError;

      // Simple match transformation
      const enhancedMatches = (matchData || []).map(match => ({
        ...match,
        player1: { full_name: 'Player 1', display_name: 'Player 1' },
        player2: { full_name: 'Player 2', display_name: 'Player 2' },
        assigned_table: null,
      }));

      // Fetch tournament results
      const { data: results, error: resultsError } = await supabase
        .from('tournament_results')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('position', { ascending: true });

      if (resultsError) throw resultsError;

      // Fetch participants
      const { data: participants, error: participantsError } = await supabase
        .from('tournament_registrations')
        .select('*')
        .eq('tournament_id', tournamentId);

      if (participantsError) throw participantsError;

      const bracketData: TournamentBracketData = {
        tournament_id: tournamentId,
        matches: enhancedMatches || [],
        results: results || [],
        participants: participants || [],
        final_standings: results || [],
        statistics: {
          total_matches: enhancedMatches?.length || 0,
          completion_rate: 100,
          duration_hours: 0,
          prize_distributed: 0,
          spa_awarded: 0,
        },
      };

      setSelectedTournamentData(bracketData);
      return bracketData;
    } catch (error) {
      console.error('Error loading tournament bracket data:', error);
      toast.error('Không thể tải dữ liệu bracket giải đấu');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Real-time subscription for new completed tournaments
  useEffect(() => {
    const channel = supabase
      .channel('completed_tournaments_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tournaments',
        },
        payload => {
          const newRecord = payload.new as any;
          const oldRecord = payload.old as any;

          // Check if tournament just completed
          if (
            oldRecord?.status !== 'completed' &&
            newRecord?.status === 'completed'
          ) {
            toast.success(`🏆 Giải đấu "${newRecord.name}" vừa hoàn thành!`, {
              description: 'Dữ liệu đã được cập nhật trong template.',
              duration: 5000,
            });

            // Refresh completed tournaments list
            fetchCompletedTournaments();

            // If this tournament is currently being viewed in template, reload its data
            if (selectedTournamentData?.tournament_id === newRecord.id) {
              loadTournamentBracketData(newRecord.id);
            }
          }
        }
      )
      .subscribe(status => {
        setIsConnected(status === 'SUBSCRIBED');
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time sync connected for completed tournaments');
        }
      });

    // Initial load
    fetchCompletedTournaments();

    return () => {
      supabase.removeChannel(channel);
      setIsConnected(false);
    };
  }, [selectedTournamentData?.tournament_id]);

  // Convert bracket data to template format
  const convertToTemplateFormat = (bracketData: TournamentBracketData) => {
    const participants = bracketData.participants.map(p => ({
      id: p.id,
      name: 'Player',
      displayName: 'Player',
      rank: 'A',
      avatarUrl: null,
      elo: 1200,
    }));

    const matches = bracketData.matches.map(match => ({
      id: match.id,
      match: match.match_number,
      round: match.round_number,
      player1: match.player1 || null,
      player2: match.player2 || null,
      winner: null,
      player1_score: match.score_player1 || 0,
      player2_score: match.score_player2 || 0,
      status: match.status,
      completed: match.status === 'completed',
    }));

    return {
      participants,
      matches,
      results: bracketData.results,
      statistics: bracketData.statistics,
      isCompleted: true,
    };
  };

  return {
    completedTournaments,
    selectedTournamentData,
    isLoading,
    isConnected,
    fetchCompletedTournaments,
    loadTournamentBracketData,
    convertToTemplateFormat,
  };
};
