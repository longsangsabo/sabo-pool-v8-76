import { useState, useCallback } from 'react';
import { ClubStanding, ClubStandingFilters } from '../types/tournament';

export const useClubStandings = () => {
  const [clubStandings, setClubStandings] = useState<ClubStanding[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClubStandings = useCallback(
    async (clubId: string, filters?: ClubStandingFilters) => {
      setLoading(true);
      setError(null);

      try {
        // Mock club standings data
        const mockStandings = [
          {
            id: '1',
            user_id: 'user1',
            club_id: clubId,
            total_elo_points: 1200,
            tournaments_played: 15,
            best_finish: 1,
            current_rank: 1,
            verified_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];

        setClubStandings(mockStandings);
        return mockStandings;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch club standings'
        );
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getPlayerClubStanding = useCallback(
    async (userId: string, clubId: string) => {
      try {
        return {
          id: '1',
          user_id: userId,
          club_id: clubId,
          total_elo_points: 1200,
          tournaments_played: 15,
          best_finish: 1,
          current_rank: 1,
          verified_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to fetch player club standing'
        );
        return null;
      }
    },
    []
  );

  const verifyPlayerAtClub = useCallback(
    async (userId: string, clubId: string) => {
      setLoading(true);
      setError(null);

      try {
        console.log('Mock verify player at club:', { userId, clubId });
        await fetchClubStandings(clubId);

        return {
          id: '1',
          user_id: userId,
          club_id: clubId,
          total_elo_points: 0,
          tournaments_played: 0,
          best_finish: null,
          current_rank: 1,
          verified_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to verify player at club'
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchClubStandings]
  );

  const removePlayerFromClub = useCallback(
    async (userId: string, clubId: string) => {
      setLoading(true);
      setError(null);

      try {
        console.log('Mock remove player from club:', { userId, clubId });
        await fetchClubStandings(clubId);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to remove player from club'
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchClubStandings]
  );

  const getClubLeaderboard = useCallback(
    async (clubId: string, limit: number = 10) => {
      try {
        return [
          {
            id: '1',
            user_id: 'user1',
            club_id: clubId,
            total_elo_points: 1200,
            tournaments_played: 15,
            best_finish: 1,
            current_rank: 1,
            verified_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to fetch club leaderboard'
        );
        return [];
      }
    },
    []
  );

  const getClubStatistics = useCallback(async (clubId: string) => {
    try {
      return {
        totalPlayers: 25,
        totalEloPoints: 30000,
        averageEloPoints: 1200,
        totalTournaments: 150,
        verifiedPlayers: 20,
      };
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch club statistics'
      );
      return null;
    }
  }, []);

  const getPlayerClubHistory = useCallback(async (userId: string) => {
    try {
      return [
        {
          id: '1',
          user_id: userId,
          club_id: 'club1',
          total_elo_points: 1200,
          tournaments_played: 15,
          best_finish: 1,
          current_rank: 1,
          verified_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to fetch player club history'
      );
      return [];
    }
  }, []);

  const recalculateClubRankings = useCallback(
    async (clubId: string) => {
      setLoading(true);
      setError(null);

      try {
        console.log('Mock recalculate rankings for club:', clubId);
        await fetchClubStandings(clubId);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to recalculate club rankings'
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchClubStandings]
  );

  const getTopPlayersByClub = useCallback(async (limit: number = 5) => {
    try {
      return [
        {
          id: '1',
          user_id: 'user1',
          club_id: 'club1',
          total_elo_points: 1200,
          tournaments_played: 15,
          best_finish: 1,
          current_rank: 1,
          verified_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to fetch top players by club'
      );
      return [];
    }
  }, []);

  const getClubComparison = useCallback(async (clubIds: string[]) => {
    try {
      return clubIds.map(clubId => ({
        club_id: clubId,
        club_name: 'CLB Bi-a Mock',
        total_players: 25,
        total_elo_points: 30000,
        average_elo_points: 1200,
        top_player: {
          id: '1',
          user_id: 'user1',
          club_id: clubId,
          total_elo_points: 1200,
          tournaments_played: 15,
          best_finish: 1,
          current_rank: 1,
          verified_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      }));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch club comparison'
      );
      return [];
    }
  }, []);

  return {
    clubStandings,
    loading,
    error,
    fetchClubStandings,
    getPlayerClubStanding,
    verifyPlayerAtClub,
    removePlayerFromClub,
    getClubLeaderboard,
    getClubStatistics,
    getPlayerClubHistory,
    recalculateClubRankings,
    getTopPlayersByClub,
    getClubComparison,
  };
};
