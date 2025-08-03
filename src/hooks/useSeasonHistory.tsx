import { useState } from 'react';
import {
  SeasonHistory,
  SeasonHistoryFilters,
  CurrentSeason,
  SeasonProgress,
  SeasonComparison,
  PlayerHistoryResponse,
  BestSeasonData,
  UserBestSeason,
  SeasonStats,
} from '../types/seasonHistory';

export const useSeasonHistory = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getSeasonHistory = async (
    filters: SeasonHistoryFilters,
    page: number,
    limit: number
  ): Promise<{ data: SeasonHistory[]; count: number; stats: SeasonStats }> => {
    setLoading(true);
    try {
      // Mock implementation
      const mockData: SeasonHistory[] = [];
      const mockStats: SeasonStats = {
        season_name: filters.season_name || 'S2',
        season_year: filters.season_year || 2024,
        total_players: 150,
        highest_points: 2500,
        average_points: 1450,
        lowest_points: 800,
      };

      return {
        data: mockData,
        count: 0,
        stats: mockStats,
      };
    } catch (err) {
      setError('Failed to fetch season history');
      return {
        data: [],
        count: 0,
        stats: {
          season_name: 'S2',
          season_year: 2024,
          total_players: 0,
          highest_points: 0,
          average_points: 0,
          lowest_points: 0,
        },
      };
    } finally {
      setLoading(false);
    }
  };

  const getSeasonStats = async (
    seasonName: string,
    seasonYear: number
  ): Promise<SeasonStats> => {
    try {
      return {
        season_name: seasonName,
        season_year: seasonYear,
        total_players: 150,
        highest_points: 2500,
        average_points: 1450,
        lowest_points: 800,
      };
    } catch (err) {
      setError('Failed to fetch season stats');
      throw err;
    }
  };

  const getAvailableSeasons = async (): Promise<
    Array<{ season_name: string; season_year: number }>
  > => {
    try {
      return [
        { season_name: 'S2', season_year: 2024 },
        { season_name: 'S1', season_year: 2024 },
      ];
    } catch (err) {
      setError('Failed to fetch available seasons');
      return [];
    }
  };

  const getCurrentSeason = async (): Promise<CurrentSeason> => {
    try {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const today = new Date();
      const timeDiff = endDate.getTime() - today.getTime();
      const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

      return {
        season_name: 'S2',
        season_year: 2024,
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        status: 'ongoing',
        total_participants: 150,
        days_remaining: Math.max(0, daysRemaining),
      };
    } catch (err) {
      setError('Failed to fetch current season');
      throw err;
    }
  };

  const getSeasonProgress = async (
    seasonName: string,
    seasonYear: number
  ): Promise<SeasonProgress> => {
    try {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const today = new Date();

      const totalDays = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)
      );
      const elapsedDays = Math.ceil(
        (today.getTime() - startDate.getTime()) / (1000 * 3600 * 24)
      );
      const remainingDays = Math.max(0, totalDays - elapsedDays);
      const progressPercentage = Math.min(100, (elapsedDays / totalDays) * 100);

      return {
        user_rank: 1,
        total_participants: 150,
        matches_played: 10,
        wins: 7,
        losses: 3,
        points: 1200,
        rating_change: 50,
        progress_percentage: progressPercentage,
        days_elapsed: Math.max(0, elapsedDays),
        days_remaining: remainingDays,
      };
    } catch (err) {
      setError('Failed to fetch season progress');
      throw err;
    }
  };

  const getSeasonComparison = async (): Promise<SeasonComparison> => {
    try {
      return {
        current_season: {
          season_name: 'S2',
          season_year: 2024,
          rank: 1,
          points: 1200,
          matches_played: 10,
          total_players: 150,
          highest_points: 2500,
          average_points: 1450,
        },
        previous_season: {
          season_name: 'S1',
          season_year: 2024,
          rank: 2,
          points: 1100,
          matches_played: 8,
          total_players: 120,
          highest_points: 2200,
          average_points: 1350,
        },
        improvement: {
          rank_change: 1,
          points_change: 100,
          matches_change: 2,
        },
        top_players_change: [
          {
            nickname: 'Player1',
            current_rank: 1,
            previous_rank: 2,
            current_points: 2500,
            previous_points: 2200,
            rank_change: 1,
            points_change: 300,
          },
        ],
      };
    } catch (err) {
      setError('Failed to fetch season comparison');
      throw err;
    }
  };

  const searchPlayerHistory = async (
    nickname: string
  ): Promise<PlayerHistoryResponse> => {
    try {
      return {
        player_history: [],
        total_seasons: 0,
      };
    } catch (err) {
      setError('Failed to search player history');
      throw err;
    }
  };

  const getUserBestSeason = async (
    nickname: string
  ): Promise<UserBestSeason | null> => {
    try {
      return {
        season_name: 'S2',
        season_year: 2024,
        final_rank: 1,
        ranking_points: 1200,
        achievement_level: 'Elite',
      };
    } catch (err) {
      setError('Failed to fetch best season');
      return null;
    }
  };

  return {
    loading,
    error,
    getSeasonHistory,
    getSeasonStats,
    getAvailableSeasons,
    getCurrentSeason,
    getSeasonProgress,
    getSeasonComparison,
    searchPlayerHistory,
    getUserBestSeason,
  };
};
