import React, { useState, useEffect } from 'react';
import { useSeasonHistory } from '../hooks/useSeasonHistory';
import {
  SeasonHistory,
  SeasonHistoryFilters,
  SeasonStats,
} from '../types/seasonHistory';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Search,
  Filter,
  Trophy,
  Users,
  TrendingUp,
  Target,
  User,
  Calendar,
} from 'lucide-react';
import { PlayerHistoryCard } from './PlayerHistoryCard';
import { CurrentSeasonCard } from './CurrentSeasonCard';

interface SeasonHistoryTabProps {
  className?: string;
}

export const SeasonHistoryTab: React.FC<SeasonHistoryTabProps> = ({
  className,
}) => {
  const {
    loading,
    error,
    getSeasonHistory,
    getSeasonStats,
    getAvailableSeasons,
  } = useSeasonHistory();

  const [history, setHistory] = useState<SeasonHistory[]>([]);
  const [stats, setStats] = useState<SeasonStats | null>(null);
  const [availableSeasons, setAvailableSeasons] = useState<
    Array<{ season_name: string; season_year: number }>
  >([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<SeasonHistoryFilters>({
    season_name: 'S2',
    season_year: 2024,
  });
  const [searchTerm, setSearchTerm] = useState('');

  const itemsPerPage = 20;

  useEffect(() => {
    loadAvailableSeasons();
  }, []);

  useEffect(() => {
    loadSeasonHistory();
  }, [filters, currentPage]);

  const loadAvailableSeasons = async () => {
    const seasons = await getAvailableSeasons();
    setAvailableSeasons(seasons);
  };

  const loadSeasonHistory = async () => {
    try {
      const response = await getSeasonHistory(
        filters,
        currentPage,
        itemsPerPage
      );
      setHistory(response.data);
      setTotalCount(response.count);
      setStats(response.stats);
    } catch (err) {
      console.error('Error loading season history:', err);
    }
  };

  const handleSearch = () => {
    setFilters(prev => ({
      ...prev,
      nickname: searchTerm || undefined,
    }));
    setCurrentPage(1);
  };

  const handleSeasonChange = (seasonName: string, seasonYear: string) => {
    setFilters(prev => ({
      ...prev,
      season_name: seasonName,
      season_year: parseInt(seasonYear),
    }));
    setCurrentPage(1);
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

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  if (loading && history.length === 0) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className='p-6'>
                <Skeleton className='h-8 w-24 mb-2' />
                <Skeleton className='h-6 w-16' />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className='p-6'>
            <Skeleton className='h-8 w-48 mb-4' />
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className='h-12 w-full mb-2' />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <Tabs defaultValue='current' className='w-full'>
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='current' className='flex items-center gap-2'>
            <Calendar className='w-4 h-4' />
            Mùa hiện tại
          </TabsTrigger>
          <TabsTrigger value='leaderboard' className='flex items-center gap-2'>
            <Trophy className='w-4 h-4' />
            Bảng xếp hạng
          </TabsTrigger>
          <TabsTrigger
            value='player-search'
            className='flex items-center gap-2'
          >
            <User className='w-4 h-4' />
            Tìm kiếm cá nhân
          </TabsTrigger>
        </TabsList>

        <TabsContent value='current'>
          <CurrentSeasonCard />
        </TabsContent>

        <TabsContent value='leaderboard' className='space-y-6'>
          {/* Season Stats */}
          {stats && (
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
              <Card>
                <CardContent className='p-6'>
                  <div className='flex items-center space-x-2'>
                    <Users className='h-5 w-5 text-blue-500' />
                    <div>
                      <p className='text-sm font-medium text-gray-600'>
                        Tổng người chơi
                      </p>
                      <p className='text-2xl font-bold'>
                        {stats.total_players}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className='p-6'>
                  <div className='flex items-center space-x-2'>
                    <Trophy className='h-5 w-5 text-yellow-500' />
                    <div>
                      <p className='text-sm font-medium text-gray-600'>
                        Điểm cao nhất
                      </p>
                      <p className='text-2xl font-bold'>
                        {formatPoints(stats.highest_points)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className='p-6'>
                  <div className='flex items-center space-x-2'>
                    <TrendingUp className='h-5 w-5 text-green-500' />
                    <div>
                      <p className='text-sm font-medium text-gray-600'>
                        Điểm trung bình
                      </p>
                      <p className='text-2xl font-bold'>
                        {Math.round(stats.average_points)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className='p-6'>
                  <div className='flex items-center space-x-2'>
                    <Target className='h-5 w-5 text-red-500' />
                    <div>
                      <p className='text-sm font-medium text-gray-600'>
                        Điểm thấp nhất
                      </p>
                      <p className='text-2xl font-bold'>
                        {formatPoints(stats.lowest_points)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center space-x-2'>
                <Filter className='h-5 w-5' />
                <span>Bộ lọc</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='space-y-2'>
                  <label className='text-sm font-medium'>Mùa giải</label>
                  <Select
                    value={`${filters.season_name}-${filters.season_year}`}
                    onValueChange={value => {
                      const [seasonName, seasonYear] = value.split('-');
                      handleSeasonChange(seasonName, seasonYear);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Chọn mùa giải' />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSeasons.map(season => (
                        <SelectItem
                          key={`${season.season_name}-${season.season_year}`}
                          value={`${season.season_name}-${season.season_year}`}
                        >
                          {season.season_name} {season.season_year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <label className='text-sm font-medium'>
                    Tìm kiếm theo nickname
                  </label>
                  <div className='flex space-x-2'>
                    <Input
                      placeholder='Nhập nickname...'
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && handleSearch()}
                    />
                    <Button onClick={handleSearch} size='sm'>
                      <Search className='h-4 w-4' />
                    </Button>
                  </div>
                </div>

                <div className='space-y-2'>
                  <label className='text-sm font-medium'>Kết quả</label>
                  <p className='text-sm text-gray-600'>
                    Hiển thị {(currentPage - 1) * itemsPerPage + 1} -{' '}
                    {Math.min(currentPage * itemsPerPage, totalCount)}
                    trong tổng số {totalCount} người chơi
                  </p>
                </div>
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

          {/* Ranking Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                Bảng xếp hạng {filters.season_name} {filters.season_year}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead>
                    <tr className='border-b'>
                      <th className='text-left p-3 font-medium'>Hạng</th>
                      <th className='text-left p-3 font-medium'>Nickname</th>
                      <th className='text-right p-3 font-medium'>Điểm</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((player, index) => (
                      <tr key={player.id} className='border-b hover:bg-gray-50'>
                        <td className='p-3'>
                          <Badge
                            className={getRankBadgeColor(player.final_rank)}
                          >
                            #{player.final_rank}
                          </Badge>
                        </td>
                        <td className='p-3 font-medium'>
                          {player.nickname ||
                            player.profiles?.nickname ||
                            'Unknown'}
                        </td>
                        <td className='p-3 text-right font-mono'>
                          {formatPoints(player.ranking_points)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className='flex justify-center space-x-2 mt-6'>
                  <Button
                    variant='outline'
                    onClick={() =>
                      setCurrentPage(prev => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                  >
                    Trước
                  </Button>

                  <span className='flex items-center px-4'>
                    Trang {currentPage} / {totalPages}
                  </span>

                  <Button
                    variant='outline'
                    onClick={() =>
                      setCurrentPage(prev => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Sau
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='player-search'>
          <PlayerHistoryCard />
        </TabsContent>
      </Tabs>
    </div>
  );
};
