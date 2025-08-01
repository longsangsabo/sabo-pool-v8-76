import { useState, useEffect } from 'react';
import {
  Season2,
  Season2Leaderboard,
  Season2Stats,
  Season2LeaderboardEntry,
} from '../types/season2';

export const useSeason2 = () => {
  const [season2, setSeason2] = useState<Season2 | null>(null);
  const [seasonInfo, setSeasonInfo] = useState<Season2 | null>(null);
  const [prizes, setPrizes] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<Season2Leaderboard>([]);
  const [stats, setStats] = useState<Season2Stats>({
    totalParticipants: 0,
    totalMatches: 0,
    totalPrizePool: 0,
    averageRating: 0,
    topRating: 0,
    activeUsers: 0,
  });
  const [userProgress, setUserProgress] =
    useState<Season2LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchSeason2Data = async () => {
    setLoading(true);
    try {
      // Mock Season 2 data
      const mockSeason2: Season2 = {
        id: 'season2-2025',
        season_name: 'Season 2 - 2025',
        start_date: '2025-01-01',
        end_date: '2025-12-31',
        status: 'active',
        total_participants: 150,
        total_matches: 1200,
        registration_fee: 99000,
        prize_pool: 50000000,
        description: 'Season 2 tournament for 2025',
      };

      const mockPrizes = [
        {
          id: '1',
          rank_min: 1,
          rank_max: 1,
          prize_value: 10000000,
          prize_description: 'Giải nhất',
          voucher_amount: 0,
          member_months: 0,
        },
        {
          id: '2',
          rank_min: 2,
          rank_max: 2,
          prize_value: 5000000,
          prize_description: 'Giải nhì',
          voucher_amount: 0,
          member_months: 0,
        },
        {
          id: '3',
          rank_min: 3,
          rank_max: 3,
          prize_value: 3000000,
          prize_description: 'Giải ba',
          voucher_amount: 0,
          member_months: 0,
        },
      ];

      setSeason2(mockSeason2);
      setSeasonInfo(mockSeason2);
      setPrizes(mockPrizes);
    } catch (err) {
      setError('Failed to fetch Season 2 data');
    } finally {
      setLoading(false);
    }
  };

  const checkSeason2Eligibility = async () => {
    try {
      // Mock eligibility check
      return {
        eligible: true,
        reason: undefined,
        currentRank: 'D1',
      };
    } catch (err) {
      return {
        eligible: false,
        reason: 'Không thể kiểm tra điều kiện tham gia',
      };
    }
  };

  const registerForSeason2 = async () => {
    try {
      // Mock registration
      return true;
    } catch (err) {
      setError('Failed to register for Season 2');
      return false;
    }
  };

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      // Mock leaderboard data
      setLeaderboard([]);
    } catch (err) {
      setError('Failed to fetch leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Mock stats
      setStats({
        totalParticipants: 150,
        totalMatches: 1200,
        totalPrizePool: 50000000,
        averageRating: 1450,
        topRating: 2100,
        activeUsers: 120,
      });
    } catch (err) {
      setError('Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  const getUserProgress = async (userId: string) => {
    try {
      // Mock user progress - now includes all required properties
      const mockProgress: Season2LeaderboardEntry = {
        id: `progress-${userId}`,
        rank: 25,
        user_id: userId,
        nickname: 'TestUser',
        avatar_url: '',
        elo_rating: 1450,
        matches_played: 15,
        wins: 10,
        losses: 5,
        points: 1200,
        win_rate: 66.7,
        form: '+3',
        total_elo_points: 1200,
        tournaments_played: 3,
        user: {
          id: userId,
          full_name: 'Test User',
          avatar_url: '',
          current_rank: 'D1',
          nickname: 'TestUser',
        },
      };
      setUserProgress(mockProgress);
      return mockProgress;
    } catch (err) {
      setError('Failed to fetch user progress');
      return null;
    }
  };

  const getUserRank = (targetUserId?: string): Season2LeaderboardEntry => {
    return (
      userProgress || {
        id: targetUserId || 'default',
        rank: 0,
        user_id: targetUserId || '',
        nickname: '',
        avatar_url: '',
        elo_rating: 0,
        matches_played: 0,
        wins: 0,
        losses: 0,
        points: 0,
        win_rate: 0,
        form: '',
        total_elo_points: 0,
        tournaments_played: 0,
      }
    );
  };

  useEffect(() => {
    fetchSeason2Data();
    fetchLeaderboard();
    fetchStats();
  }, []);

  return {
    season2,
    seasonInfo,
    prizes,
    leaderboard,
    stats,
    userProgress,
    loading,
    error,
    fetchSeason2Data,
    fetchLeaderboard,
    fetchStats,
    getUserProgress,
    getUserRank,
    checkSeason2Eligibility,
    registerForSeason2,
  };
};
