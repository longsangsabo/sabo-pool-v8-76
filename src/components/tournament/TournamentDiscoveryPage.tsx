import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  MapPin,
  Users,
  Trophy,
  Target,
  Wifi,
  WifiOff,
  Clock,
} from 'lucide-react';
import { useTournamentRecommendations } from '@/hooks/useTournamentRecommendations';
import { useTournaments } from '@/hooks/useTournaments';
import { TournamentRecommendationCard } from './TournamentRecommendationCard';
import { TournamentSkeleton } from './TournamentSkeleton';

const TournamentDiscoveryPage = () => {
  const {
    tournaments,
    loading,
    loadTournamentRecommendations,
    trackUserClubInteraction,
    getTournamentsByFilter,
  } = useTournamentRecommendations();

  const { joinTournament } = useTournaments();

  const [filter, setFilter] = useState('recommended');
  const [filteredTournaments, setFilteredTournaments] = useState<any[]>([]);

  useEffect(() => {
    if (filter === 'recommended') {
      setFilteredTournaments(tournaments);
    } else {
      loadFilteredTournaments();
    }
  }, [filter, tournaments]);

  const loadFilteredTournaments = async () => {
    const data = await getTournamentsByFilter(filter);
    setFilteredTournaments(data);
  };

  const handleJoinTournament = async (tournament: any) => {
    try {
      // Track interaction first
      await trackUserClubInteraction(tournament.club_id, 'tournament_join', {
        tournament_id: tournament.id,
        tournament_name: tournament.title,
      });

      // Join tournament
      await joinTournament.mutateAsync({ tournamentId: tournament.id });
    } catch (error) {
      console.error('Error joining tournament:', error);
    }
  };

  const filterTabs = [
    { key: 'recommended', label: '🎯 Đề xuất', icon: '🎯' },
    { key: 'nearby', label: '📍 Gần bạn', icon: '📍' },
    { key: 'high_prize', label: '💰 Giải lớn', icon: '💰' },
    { key: 'recent', label: '🆕 Mới nhất', icon: '🆕' },
  ];

  const displayTournaments =
    filteredTournaments.length > 0 ? filteredTournaments : tournaments;

  return (
    <div className='bg-gray-50 min-h-screen'>
      {/* Header */}
      <div className='bg-white p-4 shadow-sm'>
        <h1 className='text-2xl font-bold text-center mb-4'>Tìm giải đấu</h1>

        {/* Filter Tabs */}
        <div className='flex space-x-2 overflow-x-auto pb-2'>
          {filterTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                filter === tab.key
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className='bg-white mx-4 mt-4 rounded-xl p-4 shadow-sm'>
        <div className='grid grid-cols-3 gap-4 text-center'>
          <div>
            <div className='text-2xl font-bold text-blue-600'>
              {displayTournaments.length}
            </div>
            <div className='text-xs text-gray-500'>Giải đấu</div>
          </div>
          <div>
            <div className='text-2xl font-bold text-green-600'>
              {displayTournaments
                .reduce((sum, t) => sum + (t.total_prize_pool || 0), 0)
                .toLocaleString()}
            </div>
            <div className='text-xs text-gray-500'>Tổng giải thưởng</div>
          </div>
          <div>
            <div className='text-2xl font-bold text-purple-600'>
              {
                displayTournaments.filter(
                  t => (t.recommendation_score || 0) > 300
                ).length
              }
            </div>
            <div className='text-xs text-gray-500'>Phù hợp cao</div>
          </div>
        </div>
      </div>

      {/* Tournament List */}
      <div className='p-4 space-y-4'>
        {loading ? (
          <TournamentSkeleton />
        ) : displayTournaments.length > 0 ? (
          displayTournaments.map(tournament => (
            <TournamentRecommendationCard
              key={tournament.id}
              tournament={tournament}
              onJoin={handleJoinTournament}
              showRecommendationScore={filter === 'recommended'}
              isJoining={joinTournament.isPending}
            />
          ))
        ) : (
          <div className='text-center py-12'>
            <Trophy className='h-12 w-12 text-gray-400 mx-auto mb-4' />
            <p className='text-gray-500 font-medium'>
              Không có giải đấu nào phù hợp
            </p>
            <p className='text-gray-400 text-sm mt-2'>
              Hãy thử thay đổi bộ lọc hoặc quay lại sau
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentDiscoveryPage;
