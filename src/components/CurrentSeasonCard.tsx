import React, { useState, useEffect } from 'react';
import { useSeasonHistory } from '../hooks/useSeasonHistory';
import {
  CurrentSeason,
  SeasonProgress,
  SeasonComparison,
} from '../types/seasonHistory';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Skeleton } from './ui/skeleton';
import {
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  Trophy,
  Users,
  Target,
  Award,
  Medal,
} from 'lucide-react';

interface CurrentSeasonCardProps {
  className?: string;
}

export const CurrentSeasonCard: React.FC<CurrentSeasonCardProps> = ({
  className,
}) => {
  const {
    loading,
    error,
    getCurrentSeason,
    getSeasonProgress,
    getSeasonComparison,
  } = useSeasonHistory();

  const [currentSeason, setCurrentSeason] = useState<CurrentSeason | null>(
    null
  );
  const [progress, setProgress] = useState<SeasonProgress | null>(null);
  const [comparison, setComparison] = useState<SeasonComparison | null>(null);

  useEffect(() => {
    loadCurrentSeasonData();
  }, []);

  const loadCurrentSeasonData = async () => {
    try {
      const [season, seasonProgress, seasonComparison] = await Promise.all([
        getCurrentSeason(),
        getCurrentSeason().then(s =>
          s ? getSeasonProgress(s.season_name, s.season_year) : null
        ),
        getSeasonComparison(),
      ]);

      setCurrentSeason(season);
      setProgress(seasonProgress);
      setComparison(seasonComparison);
    } catch (err) {
      console.error('Error loading current season data:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing':
        return 'bg-green-500 text-white';
      case 'completed':
        return 'bg-gray-500 text-white';
      case 'upcoming':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ongoing':
        return 'Đang diễn ra';
      case 'completed':
        return 'Đã kết thúc';
      case 'upcoming':
        return 'Sắp diễn ra';
      default:
        return status;
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className='h-4 w-4 text-yellow-500' />;
    if (rank === 2) return <Medal className='h-4 w-4 text-gray-400' />;
    if (rank === 3) return <Award className='h-4 w-4 text-orange-500' />;
    return <span className='text-sm font-medium'>#{rank}</span>;
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Card>
          <CardContent className='p-6'>
            <Skeleton className='h-8 w-48 mb-4' />
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <Skeleton className='h-20 w-full' />
              <Skeleton className='h-20 w-full' />
              <Skeleton className='h-20 w-full' />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentSeason) {
    return (
      <Card className={`border-yellow-200 bg-yellow-50 ${className}`}>
        <CardContent className='p-6 text-center'>
          <Clock className='h-12 w-12 text-yellow-500 mx-auto mb-4' />
          <p className='text-yellow-800 font-medium'>
            Không có mùa giải đang diễn ra
          </p>
          <p className='text-sm text-yellow-600 mt-1'>
            Vui lòng kiểm tra lại thông tin mùa giải
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Current Season Info */}
      <Card className='border-blue-200 bg-blue-50'>
        <CardHeader>
          <CardTitle className='flex items-center space-x-2 text-blue-800'>
            <Calendar className='h-5 w-5' />
            <span>Mùa giải hiện tại</span>
            <Badge className={getStatusColor(currentSeason.status)}>
              {getStatusText(currentSeason.status)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            <div className='text-center'>
              <p className='text-sm text-gray-600'>Mùa giải</p>
              <p className='text-lg font-bold text-blue-800'>
                {currentSeason.season_name} {currentSeason.season_year}
              </p>
            </div>
            <div className='text-center'>
              <p className='text-sm text-gray-600'>Ngày bắt đầu</p>
              <p className='text-lg font-bold text-blue-800'>
                {formatDate(currentSeason.start_date)}
              </p>
            </div>
            <div className='text-center'>
              <p className='text-sm text-gray-600'>Ngày kết thúc</p>
              <p className='text-lg font-bold text-blue-800'>
                {formatDate(currentSeason.end_date)}
              </p>
            </div>
            <div className='text-center'>
              <p className='text-sm text-gray-600'>Còn lại</p>
              <p className='text-lg font-bold text-blue-800'>
                {currentSeason.days_remaining} ngày
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          {progress && (
            <div className='mt-6'>
              <div className='flex justify-between items-center mb-2'>
                <span className='text-sm font-medium text-gray-700'>
                  Tiến độ mùa giải
                </span>
                <span className='text-sm text-gray-600'>
                  {progress.progress_percentage}%
                </span>
              </div>
              <Progress value={progress.progress_percentage} className='h-2' />
              <div className='flex justify-between text-xs text-gray-500 mt-1'>
                <span>{progress.days_elapsed} ngày đã qua</span>
                <span>{progress.days_remaining} ngày còn lại</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Season Comparison */}
      {comparison && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center space-x-2'>
              <TrendingUp className='h-5 w-5' />
              <span>So sánh với mùa trước</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {/* Current Season Stats */}
              <div>
                <h4 className='font-medium text-gray-900 mb-3'>
                  {comparison.current_season.season_name}{' '}
                  {comparison.current_season.season_year}
                </h4>
                <div className='space-y-2'>
                  <div className='flex justify-between'>
                    <span className='text-sm text-gray-600'>
                      Tổng người chơi:
                    </span>
                    <span className='font-medium'>
                      {comparison.current_season.total_players}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-sm text-gray-600'>
                      Điểm cao nhất:
                    </span>
                    <span className='font-medium'>
                      {comparison.current_season.highest_points.toLocaleString(
                        'vi-VN'
                      )}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-sm text-gray-600'>
                      Điểm trung bình:
                    </span>
                    <span className='font-medium'>
                      {Math.round(comparison.current_season.average_points)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Previous Season Stats */}
              <div>
                <h4 className='font-medium text-gray-900 mb-3'>
                  {comparison.previous_season.season_name}{' '}
                  {comparison.previous_season.season_year}
                </h4>
                <div className='space-y-2'>
                  <div className='flex justify-between'>
                    <span className='text-sm text-gray-600'>
                      Tổng người chơi:
                    </span>
                    <span className='font-medium'>
                      {comparison.previous_season.total_players}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-sm text-gray-600'>
                      Điểm cao nhất:
                    </span>
                    <span className='font-medium'>
                      {comparison.previous_season.highest_points.toLocaleString(
                        'vi-VN'
                      )}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-sm text-gray-600'>
                      Điểm trung bình:
                    </span>
                    <span className='font-medium'>
                      {Math.round(comparison.previous_season.average_points)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Players Changes */}
            {comparison.top_players_change.length > 0 && (
              <div className='mt-6'>
                <h4 className='font-medium text-gray-900 mb-3'>
                  Thay đổi top 10
                </h4>
                <div className='space-y-2'>
                  {comparison.top_players_change
                    .slice(0, 5)
                    .map((player, index) => (
                      <div
                        key={index}
                        className='flex items-center justify-between p-2 bg-gray-50 rounded'
                      >
                        <div className='flex items-center space-x-2'>
                          {getRankIcon(player.current_rank)}
                          <span className='font-medium'>{player.nickname}</span>
                        </div>
                        <div className='flex items-center space-x-4'>
                          <div className='text-center'>
                            <span className='text-xs text-gray-500'>Hạng</span>
                            <div className='flex items-center space-x-1'>
                              <span className='text-sm'>
                                {player.previous_rank || '-'}
                              </span>
                              {player.rank_change !== 0 &&
                                (player.rank_change > 0 ? (
                                  <TrendingUp className='h-3 w-3 text-green-500' />
                                ) : (
                                  <TrendingDown className='h-3 w-3 text-red-500' />
                                ))}
                              <span className='text-sm'>
                                → {player.current_rank}
                              </span>
                            </div>
                          </div>
                          <div className='text-center'>
                            <span className='text-xs text-gray-500'>Điểm</span>
                            <div className='flex items-center space-x-1'>
                              <span className='text-sm'>
                                {player.previous_points || '-'}
                              </span>
                              {player.points_change !== 0 &&
                                (player.points_change > 0 ? (
                                  <TrendingUp className='h-3 w-3 text-green-500' />
                                ) : (
                                  <TrendingDown className='h-3 w-3 text-red-500' />
                                ))}
                              <span className='text-sm'>
                                → {player.current_points}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Card className='border-red-200 bg-red-50'>
          <CardContent className='p-4'>
            <p className='text-red-600'>Lỗi: {error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
