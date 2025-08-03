import React, { useState, useEffect } from 'react';
import { useSeasonHistory } from '../hooks/useSeasonHistory';
import { SeasonHistory, UserBestSeason } from '../types/seasonHistory';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import { Search, Trophy, TrendingUp, Target, Medal, Award } from 'lucide-react';

interface PlayerHistoryCardProps {
  className?: string;
}

export const PlayerHistoryCard: React.FC<PlayerHistoryCardProps> = ({
  className,
}) => {
  const { loading, error, searchPlayerHistory, getUserBestSeason } =
    useSeasonHistory();

  const [searchTerm, setSearchTerm] = useState('');
  const [playerHistory, setPlayerHistory] = useState<SeasonHistory[]>([]);
  const [bestSeason, setBestSeason] = useState<UserBestSeason | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setSearched(true);
    const historyResponse = await searchPlayerHistory(searchTerm);
    setPlayerHistory(historyResponse.player_history);

    const best = await getUserBestSeason(searchTerm);
    if (best) {
      setBestSeason(best);
    } else if (historyResponse.player_history.length > 0) {
      // Convert the best season from history if getUserBestSeason returns null
      const bestFromHistory = historyResponse.player_history.reduce(
        (prev, current) =>
          prev.ranking_points > current.ranking_points ? prev : current
      );
      setBestSeason({
        season_name: bestFromHistory.season_name,
        season_year: bestFromHistory.season_year,
        final_rank: bestFromHistory.final_rank,
        ranking_points: bestFromHistory.ranking_points,
        achievement_level:
          bestFromHistory.final_rank <= 3
            ? 'Elite'
            : bestFromHistory.final_rank <= 10
              ? 'Advanced'
              : 'Intermediate',
      });
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className='h-5 w-5 text-yellow-500' />;
    if (rank === 2) return <Medal className='h-5 w-5 text-gray-400' />;
    if (rank === 3) return <Award className='h-5 w-5 text-orange-500' />;
    return <span className='font-semibold text-gray-600'>#{rank}</span>;
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank <= 3) return 'bg-yellow-500 text-white';
    if (rank <= 10) return 'bg-blue-500 text-white';
    if (rank <= 50) return 'bg-green-500 text-white';
    return 'bg-gray-500 text-white';
  };

  const formatPoints = (points: number) => {
    return points.toLocaleString('vi-VN');
  };

  const getPerformanceTrend = (history: SeasonHistory[]) => {
    if (history.length < 2) return 'stable';

    const sorted = [...history].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const latest = sorted[sorted.length - 1];
    const previous = sorted[sorted.length - 2];

    if (latest.ranking_points > previous.ranking_points) return 'improving';
    if (latest.ranking_points < previous.ranking_points) return 'declining';
    return 'stable';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className='h-4 w-4 text-green-500' />;
      case 'declining':
        return <TrendingUp className='h-4 w-4 text-red-500 rotate-180' />;
      default:
        return <Target className='h-4 w-4 text-gray-500' />;
    }
  };

  const getTrendText = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'Cải thiện';
      case 'declining':
        return 'Giảm sút';
      default:
        return 'Ổn định';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center space-x-2'>
            <Search className='h-5 w-5' />
            <span>Tìm kiếm lịch sử người chơi</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex space-x-2'>
            <Input
              placeholder='Nhập nickname người chơi...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={!searchTerm.trim()}>
              <Search className='h-4 w-4' />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card className='border-red-200 bg-red-50'>
          <CardContent className='p-4'>
            <p className='text-red-600'>Lỗi: {error}</p>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <div className='space-y-4'>
          <Card>
            <CardContent className='p-6'>
              <Skeleton className='h-8 w-48 mb-4' />
              <Skeleton className='h-6 w-full mb-2' />
              <Skeleton className='h-6 w-3/4 mb-2' />
              <Skeleton className='h-6 w-1/2' />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Results */}
      {searched && !loading && (
        <>
          {/* Best Season Performance */}
          {bestSeason && (
            <Card className='border-green-200 bg-green-50'>
              <CardHeader>
                <CardTitle className='flex items-center space-x-2 text-green-800'>
                  <Trophy className='h-5 w-5' />
                  <span>Thành tích tốt nhất</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  <div className='text-center'>
                    <p className='text-sm text-gray-600'>Mùa giải</p>
                    <p className='text-lg font-bold text-green-800'>
                      {bestSeason.season_name} {bestSeason.season_year}
                    </p>
                  </div>
                  <div className='text-center'>
                    <p className='text-sm text-gray-600'>Điểm cao nhất</p>
                    <p className='text-lg font-bold text-green-800'>
                      {formatPoints(bestSeason.ranking_points)}
                    </p>
                  </div>
                  <div className='text-center'>
                    <p className='text-sm text-gray-600'>Hạng</p>
                    <Badge className={getRankBadgeColor(bestSeason.final_rank)}>
                      #{bestSeason.final_rank}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Player History */}
          {playerHistory.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center justify-between'>
                  <span>Lịch sử thi đấu của {searchTerm}</span>
                  {playerHistory.length > 1 && (
                    <div className='flex items-center space-x-2 text-sm'>
                      {getTrendIcon(getPerformanceTrend(playerHistory))}
                      <span
                        className={
                          getPerformanceTrend(playerHistory) === 'improving'
                            ? 'text-green-600'
                            : getPerformanceTrend(playerHistory) === 'declining'
                              ? 'text-red-600'
                              : 'text-gray-600'
                        }
                      >
                        {getTrendText(getPerformanceTrend(playerHistory))}
                      </span>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {playerHistory.map(season => (
                    <div
                      key={season.id}
                      className='flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50'
                    >
                      <div className='flex items-center space-x-4'>
                        <div className='flex items-center justify-center w-10 h-10'>
                          {getRankIcon(season.final_rank)}
                        </div>
                        <div>
                          <div className='font-medium'>
                            {season.season_name} {season.season_year}
                          </div>
                          <div className='text-sm text-gray-500'>
                            {new Date(season.created_at).toLocaleDateString(
                              'vi-VN'
                            )}
                          </div>
                        </div>
                      </div>
                      <div className='flex items-center space-x-6'>
                        <div className='text-center'>
                          <Badge
                            className={getRankBadgeColor(season.final_rank)}
                          >
                            #{season.final_rank}
                          </Badge>
                        </div>
                        <div className='text-center'>
                          <div className='font-bold text-blue-600'>
                            {formatPoints(season.ranking_points)}
                          </div>
                          <div className='text-xs text-gray-500'>Điểm</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className='p-8 text-center'>
                <Search className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                <p className='text-gray-500 font-medium'>
                  Không tìm thấy lịch sử
                </p>
                <p className='text-sm text-gray-400 mt-1'>
                  Không có dữ liệu thi đấu cho nickname "{searchTerm}"
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
