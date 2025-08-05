import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Define Season and SeasonStanding locally to avoid conflicts
interface LocalSeason {
  id: string;
  name: string;
  year: number;
  start_date: string;
  end_date: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  description?: string;
  total_prize_pool: number;
  total_tournaments: number;
  total_participants: number;
  type?: string;
  created_at: string;
  updated_at: string;
}

interface LocalSeasonStanding {
  id: string;
  season_id: string;
  user_id: string;
  total_elo_points: number;
  tournaments_played: number;
  best_finish: number;
  total_prize_money: number;
  current_rank: number;
  previous_rank?: number;
  rank_change?: number;
  created_at: string;
  updated_at: string;
  season?: LocalSeason;
}

export const useSeasons = () => {
  const [seasons, setSeasons] = useState<LocalSeason[]>([]);
  const [currentSeason, setCurrentSeason] = useState<LocalSeason | null>(null);
  const [standings, setStandings] = useState<LocalSeasonStanding[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchSeasons = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      // Mock seasons data since seasons table doesn't exist
      const mockSeasons: LocalSeason[] = [
        {
          id: '1',
          name: 'Mùa giải 2024',
          year: 2024,
          start_date: '2024-01-01',
          end_date: '2024-12-31',
          status: 'ongoing',
          description: 'Mùa giải chính thức năm 2024',
          total_prize_pool: 1000000000,
          total_tournaments: 12,
          total_participants: 500,
          type: 'official',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      setSeasons(mockSeasons);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch seasons');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCurrentSeason = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      // Mock current season data since seasons table doesn't exist
      const mockCurrentSeason: LocalSeason = {
        id: '1',
        name: 'Mùa giải 2024',
        year: 2024,
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        status: 'ongoing',
        description: 'Mùa giải chính thức năm 2024',
        total_prize_pool: 1000000000,
        total_tournaments: 12,
        total_participants: 500,
        type: 'official',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setCurrentSeason(mockCurrentSeason);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch current season'
      );
      setCurrentSeason(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSeasonStandings = useCallback(async (seasonId: string) => {
    setLoading(true);
    setError('');

    try {
      // Mock season standings data since season_standings table doesn't exist
      const mockStandings: LocalSeasonStanding[] = [
        {
          id: '1',
          season_id: seasonId,
          user_id: 'user1',
          total_elo_points: 2500,
          tournaments_played: 8,
          best_finish: 1,
          total_prize_money: 5000000,
          current_rank: 1,
          previous_rank: 2,
          rank_change: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      setStandings(mockStandings);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch season standings'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const createSeason = useCallback(async (seasonData: Partial<LocalSeason>) => {
    setLoading(true);
    setError('');

    try {
      // Mock create season since seasons table doesn't exist
      const newSeason: LocalSeason = {
        id: Date.now().toString(),
        name: seasonData.name || 'Mùa giải mới',
        year: seasonData.year || new Date().getFullYear(),
        start_date: seasonData.start_date || new Date().toISOString(),
        end_date: seasonData.end_date || new Date().toISOString(),
        status: seasonData.status || 'upcoming',
        description: seasonData.description || '',
        total_prize_pool: seasonData.total_prize_pool || 0,
        total_tournaments: seasonData.total_tournaments || 0,
        total_participants: seasonData.total_participants || 0,
        type: seasonData.type || 'official',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setSeasons(prev => [newSeason, ...prev]);
      return newSeason;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create season');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSeason = useCallback(
    async (id: string, updates: Partial<LocalSeason>) => {
      setLoading(true);
      setError('');

      try {
        // Mock update season since seasons table doesn't exist
        const updatedSeason = seasons.find(s => s.id === id);
        if (!updatedSeason) throw new Error('Season not found');

        const newSeason: LocalSeason = {
          ...updatedSeason,
          ...updates,
          updated_at: new Date().toISOString(),
        };

        setSeasons(prev => prev.map(s => (s.id === id ? newSeason : s)));
        return newSeason;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to update season'
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [seasons]
  );

  const deleteSeason = useCallback(async (id: string) => {
    setLoading(true);
    setError('');

    try {
      // Mock delete season since seasons table doesn't exist
      setSeasons(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete season');
    } finally {
      setLoading(false);
    }
  }, []);

  const createSeasonStanding = useCallback(
    async (standingData: Partial<LocalSeasonStanding>) => {
      setLoading(true);
      setError('');

      try {
        // Mock create season standing since season_standings table doesn't exist
        const newStanding: LocalSeasonStanding = {
          id: Date.now().toString(),
          season_id: standingData.season_id || '',
          user_id: standingData.user_id || '',
          total_elo_points: standingData.total_elo_points || 0,
          tournaments_played: standingData.tournaments_played || 0,
          best_finish: standingData.best_finish || 0,
          total_prize_money: standingData.total_prize_money || 0,
          current_rank: standingData.current_rank || 0,
          previous_rank: standingData.previous_rank,
          rank_change: standingData.rank_change,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        setStandings(prev => [newStanding, ...prev]);
        return newStanding;
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to create season standing'
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateSeasonStanding = useCallback(
    async (id: string, updates: Partial<LocalSeasonStanding>) => {
      setLoading(true);
      setError('');

      try {
        // Mock update season standing since season_standings table doesn't exist
        const existingStanding = standings.find(s => s.id === id);
        if (!existingStanding) throw new Error('Standing not found');

        const updatedStanding: LocalSeasonStanding = {
          ...existingStanding,
          ...updates,
          updated_at: new Date().toISOString(),
        };

        setStandings(prev =>
          prev.map(s => (s.id === id ? updatedStanding : s))
        );
        return updatedStanding;
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to update season standing'
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [standings]
  );

  const getSeasonById = useCallback(
    (id: string) => {
      return seasons.find(season => season.id === id);
    },
    [seasons]
  );

  const getCurrentSeasonStandings = useCallback(() => {
    if (!currentSeason) return [];
    return standings.filter(
      standing => standing.season_id === currentSeason.id
    );
  }, [currentSeason, standings]);

  const calculateTotalPrizePool = useCallback(() => {
    return seasons.reduce(
      (total, season) => total + season.total_prize_pool,
      0
    );
  }, [seasons]);

  const calculateTotalParticipants = useCallback(() => {
    return seasons.reduce(
      (total, season) => total + (season.total_participants || 0),
      0
    );
  }, [seasons]);

  const calculateAveragePrizePool = useCallback(() => {
    if (seasons.length === 0) return 0;
    const totalPrizePool = calculateTotalPrizePool();
    return totalPrizePool / seasons.length;
  }, [seasons, calculateTotalPrizePool]);

  const getUpcomingSeasons = useCallback(() => {
    return seasons.filter(season => season.status === 'upcoming');
  }, [seasons]);

  const getOngoingSeasons = useCallback(() => {
    return seasons.filter(season => season.status === 'ongoing');
  }, [seasons]);

  const getCompletedSeasons = useCallback(() => {
    return seasons.filter(season => season.status === 'completed');
  }, [seasons]);

  useEffect(() => {
    fetchSeasons();
    fetchCurrentSeason();
  }, [fetchSeasons, fetchCurrentSeason]);

  return {
    seasons,
    currentSeason,
    standings,
    loading,
    error,
    fetchSeasons,
    createSeason,
    updateSeason,
    deleteSeason,
    fetchSeasonStandings,
    createSeasonStanding,
    updateSeasonStanding,
    getSeasonById,
    getCurrentSeasonStandings,
    calculateTotalPrizePool,
    calculateTotalParticipants,
    calculateAveragePrizePool,
    getUpcomingSeasons,
    getOngoingSeasons,
    getCompletedSeasons,
  };
};
