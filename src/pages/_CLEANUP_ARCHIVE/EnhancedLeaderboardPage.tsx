import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Crown,
  Medal,
  Award,
  Trophy,
  Search,
  Loader2,
  Eye,
  Sword,
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface Province {
  id: string;
  name: string;
  code: string;
  region: string;
}

interface Ranking {
  id: string;
  user_id: string;
  current_rank: string;
  current_points: number;
  user_profiles: {
    full_name: string;
    avatar_url?: string;
    nickname?: string;
    club_id?: string;
    clubs?: {
      name: string;
    } | null;
    provinces?: {
      name: string;
      code: string;
      region: string;
    } | null;
  };
}

const EnhancedLeaderboardPage = () => {
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    season: '2025-S1',
    club_id: '',
    rank_category: '',
    province_id: '',
    region: '',
  });

  const regionNames = {
    north: 'Miền Bắc',
    central: 'Miền Trung',
    south: 'Miền Nam',
  };

  useEffect(() => {
    fetchProvinces();
  }, []);

  useEffect(() => {
    fetchRankings();
  }, [filters]);

  const fetchProvinces = async () => {
    try {
      // Mock provinces data since provinces table doesn't exist
      const mockProvinces: Province[] = [
        { id: '1', name: 'Hà Nội', code: 'HN', region: 'north' },
        { id: '2', name: 'Hồ Chí Minh', code: 'HCM', region: 'south' },
        { id: '3', name: 'Đà Nẵng', code: 'DN', region: 'central' },
      ];
      setProvinces(mockProvinces);
    } catch (error) {
      console.error('Error fetching provinces:', error);
    }
  };

  const getRegionalStats = (region: string) => {
    const regionRankings = rankings.filter(
      r =>
        r.user_profiles?.provinces &&
        typeof r.user_profiles.provinces === 'object' &&
        'region' in r.user_profiles.provinces &&
        r.user_profiles.provinces.region === region
    );
    return {
      count: regionRankings.length,
      topPlayer: regionRankings[0],
    };
  };

  const fetchRankings = async () => {
    setLoading(true);
    try {
      // Mock rankings data since profiles table doesn't have required fields
      const mockRankings: Ranking[] = [
        {
          id: '1',
          user_id: '1',
          current_rank: 'E+',
          current_points: 2500,
          user_profiles: {
            full_name: 'Nguyễn Văn A',
            avatar_url: '',
            nickname: 'Pro Player',
            club_id: 'club1',
            clubs: { name: 'CLB Hà Nội' },
            provinces: { name: 'Hà Nội', code: 'HN', region: 'north' },
          },
        },
        {
          id: '2',
          user_id: '2',
          current_rank: 'F',
          current_points: 1800,
          user_profiles: {
            full_name: 'Trần Thị B',
            avatar_url: '',
            nickname: 'Player B',
            club_id: 'club2',
            clubs: { name: 'CLB TP.HCM' },
            provinces: { name: 'Hồ Chí Minh', code: 'HCM', region: 'south' },
          },
        },
        {
          id: '3',
          user_id: '3',
          current_rank: 'G+',
          current_points: 1500,
          user_profiles: {
            full_name: 'Lê Văn C',
            avatar_url: '',
            nickname: 'Player C',
            club_id: 'club3',
            clubs: { name: 'CLB Đà Nẵng' },
            provinces: { name: 'Đà Nẵng', code: 'DN', region: 'central' },
          },
        },
      ];

      // Apply filters
      let filteredData = mockRankings;

      if (filters.rank_category) {
        filteredData = filteredData.filter(r =>
          r.current_rank.startsWith(filters.rank_category)
        );
      }

      if (filters.region) {
        filteredData = filteredData.filter(
          r => r.user_profiles?.provinces?.region === filters.region
        );
      }

      if (filters.province_id) {
        filteredData = filteredData.filter(
          r =>
            r.user_profiles?.provinces?.code ===
            provinces.find(p => p.id === filters.province_id)?.code
        );
      }

      setRankings(filteredData);
    } catch (error) {
      console.error('Error fetching rankings:', error);
      toast.error('Không thể tải bảng xếp hạng');
    } finally {
      setLoading(false);
    }
  };

  const getRankColor = (rank: string) => {
    if (rank.startsWith('E'))
      return 'border-purple-200 bg-purple-50 text-purple-800';
    if (rank.startsWith('F')) return 'border-red-200 bg-red-50 text-red-800';
    if (rank.startsWith('G'))
      return 'border-yellow-200 bg-yellow-50 text-yellow-800';
    if (rank.startsWith('H'))
      return 'border-green-200 bg-green-50 text-green-800';
    if (rank.startsWith('I')) return 'border-blue-200 bg-blue-50 text-blue-800';
    if (rank.startsWith('K')) return 'border-gray-200 bg-gray-50 text-gray-800';
    return 'border-gray-200 bg-gray-50 text-gray-800';
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900'>Bảng xếp hạng</h1>
          <p className='mt-2 text-gray-600'>
            Xếp hạng các tay cơ theo điểm số và khu vực
          </p>
        </div>

        {/* Enhanced Filters */}
        <Card className='mb-6'>
          <CardContent className='pt-6'>
            <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4'>
              <div>
                <Label htmlFor='season'>Mùa giải</Label>
                <Select
                  value={filters.season}
                  onValueChange={value =>
                    setFilters({ ...filters, season: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='2025-S1'>Mùa 1 - 2025</SelectItem>
                    <SelectItem value='2024-S2'>Mùa 2 - 2024</SelectItem>
                    <SelectItem value='2024-S1'>Mùa 1 - 2024</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor='region'>Miền</Label>
                <Select
                  value={filters.region}
                  onValueChange={value =>
                    setFilters({ ...filters, region: value, province_id: '' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Tất cả miền' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=''>Tất cả miền</SelectItem>
                    <SelectItem value='north'>Miền Bắc</SelectItem>
                    <SelectItem value='central'>Miền Trung</SelectItem>
                    <SelectItem value='south'>Miền Nam</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor='province'>Tỉnh/Thành phố</Label>
                <Select
                  value={filters.province_id}
                  onValueChange={value =>
                    setFilters({ ...filters, province_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Tất cả tỉnh/thành' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=''>Tất cả tỉnh/thành</SelectItem>
                    {provinces
                      .filter(
                        p => !filters.region || p.region === filters.region
                      )
                      .map(province => (
                        <SelectItem key={province.id} value={province.id}>
                          {province.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor='rank'>Hạng đấu</Label>
                <Select
                  value={filters.rank_category}
                  onValueChange={value =>
                    setFilters({ ...filters, rank_category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Tất cả hạng' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=''>Tất cả hạng</SelectItem>
                    <SelectItem value='E'>Hạng E (Chuyên nghiệp)</SelectItem>
                    <SelectItem value='F'>Hạng F (Xuất sắc)</SelectItem>
                    <SelectItem value='G'>Hạng G (Giỏi)</SelectItem>
                    <SelectItem value='H'>Hạng H (Khá)</SelectItem>
                    <SelectItem value='I'>Hạng I (Trung bình)</SelectItem>
                    <SelectItem value='K'>Hạng K (Người mới)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='md:col-span-2 flex items-end'>
                <Button
                  onClick={fetchRankings}
                  className='w-full flex items-center gap-2'
                >
                  <Search className='w-4 h-4' />
                  Lọc
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Regional Stats */}
        {!filters.province_id && !filters.region && (
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-6'>
            {['north', 'central', 'south'].map(region => {
              const stats = getRegionalStats(region);

              return (
                <Card key={region}>
                  <CardContent className='p-6'>
                    <div className='flex items-center justify-between mb-4'>
                      <h3 className='text-lg font-semibold text-gray-900'>
                        {regionNames[region as keyof typeof regionNames]}
                      </h3>
                      <span className='text-sm text-gray-500'>
                        {stats.count} người chơi
                      </span>
                    </div>

                    {stats.topPlayer && (
                      <div className='flex items-center space-x-3'>
                        <div className='w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center'>
                          <Crown className='w-5 h-5 text-yellow-600' />
                        </div>
                        <div>
                          <p className='font-medium text-gray-900'>
                            {stats.topPlayer.user_profiles?.nickname ||
                              stats.topPlayer.user_profiles?.full_name}
                          </p>
                          <p className='text-sm text-gray-500'>
                            {stats.topPlayer.current_rank} •{' '}
                            {stats.topPlayer.current_points} điểm
                          </p>
                          <p className='text-xs text-gray-400'>
                            {stats.topPlayer.user_profiles?.provinces?.name}
                          </p>
                        </div>
                      </div>
                    )}

                    <Button
                      variant='ghost'
                      onClick={() => setFilters({ ...filters, region })}
                      className='mt-4 w-full text-blue-600 hover:text-blue-800 text-sm font-medium'
                    >
                      Xem bảng xếp hạng{' '}
                      {regionNames[region as keyof typeof regionNames]}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Rankings Table */}
        <Card>
          {loading ? (
            <CardContent className='text-center py-12'>
              <Loader2 className='w-8 h-8 animate-spin mx-auto text-blue-600' />
              <p className='mt-2 text-gray-600'>Đang tải bảng xếp hạng...</p>
            </CardContent>
          ) : rankings.length === 0 ? (
            <CardContent className='text-center py-12'>
              <Trophy className='w-16 h-16 mx-auto text-gray-400 mb-4' />
              <h3 className='text-lg font-medium text-gray-900 mb-2'>
                Không có dữ liệu
              </h3>
              <p className='text-gray-600'>
                Không tìm thấy người chơi nào với bộ lọc hiện tại
              </p>
            </CardContent>
          ) : (
            <div className='overflow-x-auto'>
              <table className='min-w-full divide-y divide-gray-200'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Hạng
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Người chơi
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Khu vực
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      CLB
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Hạng đấu
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Điểm
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className='bg-white divide-y divide-gray-200'>
                  {rankings.map((ranking, index) => (
                    <tr key={ranking.id} className='hover:bg-gray-50'>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='flex items-center'>
                          {index < 3 ? (
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                index === 0
                                  ? 'bg-yellow-100'
                                  : index === 1
                                    ? 'bg-gray-100'
                                    : 'bg-orange-100'
                              }`}
                            >
                              {index === 0 ? (
                                <Crown className='w-5 h-5 text-yellow-600' />
                              ) : index === 1 ? (
                                <Medal className='w-5 h-5 text-gray-600' />
                              ) : (
                                <Award className='w-5 h-5 text-orange-600' />
                              )}
                            </div>
                          ) : (
                            <span className='text-lg font-bold text-gray-600'>
                              #{index + 1}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='flex items-center'>
                          <div className='w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mr-3'>
                            {ranking.user_profiles?.avatar_url ? (
                              <img
                                src={ranking.user_profiles.avatar_url}
                                alt='Avatar'
                                className='w-10 h-10 rounded-full object-cover'
                              />
                            ) : (
                              <span className='text-white font-medium'>
                                {ranking.user_profiles?.full_name?.charAt(0) ||
                                  '?'}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className='text-sm font-medium text-gray-900'>
                              {ranking.user_profiles?.nickname ||
                                ranking.user_profiles?.full_name ||
                                'Unknown'}
                            </div>
                            {ranking.user_profiles?.nickname && (
                              <div className='text-xs text-gray-500'>
                                {ranking.user_profiles?.full_name}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='text-sm text-gray-900'>
                          {ranking.user_profiles?.provinces?.name ||
                            'Chưa cập nhật'}
                        </div>
                        <div className='text-xs text-gray-500'>
                          {ranking.user_profiles?.provinces?.region &&
                            regionNames[
                              ranking.user_profiles.provinces
                                .region as keyof typeof regionNames
                            ]}
                        </div>
                      </td>

                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                        {ranking.user_profiles?.clubs?.name || 'Chưa có CLB'}
                      </td>

                      <td className='px-6 py-4 whitespace-nowrap'>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRankColor(ranking.current_rank)}`}
                        >
                          {ranking.current_rank}
                        </span>
                      </td>

                      <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                        {ranking.current_points.toLocaleString('vi-VN')}
                      </td>

                      <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                        <div className='flex space-x-2'>
                          <Link to={`/players/${ranking.user_id}`}>
                            <Button variant='ghost' size='sm'>
                              <Eye className='w-4 h-4' />
                            </Button>
                          </Link>
                          <Link
                            to={`/dashboard/challenges/create?opponent=${ranking.user_id}`}
                          >
                            <Button variant='ghost' size='sm'>
                              <Sword className='w-4 h-4' />
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default EnhancedLeaderboardPage;
