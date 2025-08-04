import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Medal, Award, Target, UserCheck, History } from 'lucide-react';
import { Club } from '@/types/common';
import { useAuth } from '@/hooks/useAuth';
import RankRegistrationForm from '@/components/RankRegistrationForm';
import { SeasonHistoryTab } from '@/components/SeasonHistoryTab';

interface RankingUser {
  full_name: string;
  nickname: string;
  ranking_points: number;
  matches_played: number;
  matches_won: number;
  club_name: string;
}

const RankingPage = () => {
  const { user } = useAuth();
  const [rankings, setRankings] = useState<RankingUser[]>([]);
  const [clubs, setClubs] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClub, setSelectedClub] = useState('all');
  const [selectedRank, setSelectedRank] = useState('all');

  useEffect(() => {
    fetchRankings();
    fetchClubs();
  }, []);

  const fetchRankings = async () => {
    try {
      // Mock rankings data since profiles table doesn't have ranking fields
      const mockRankings = [
        {
          full_name: 'Nguyễn Văn A',
          nickname: 'Pro Player',
          ranking_points: 2800,
          matches_played: 45,
          matches_won: 38,
          club_name: 'CLB Bida Hà Nội',
        },
        {
          full_name: 'Trần Thị B',
          nickname: 'Queen Bee',
          ranking_points: 2650,
          matches_played: 42,
          matches_won: 35,
          club_name: 'CLB Bida HCMC',
        },
        {
          full_name: 'Lê Minh C',
          nickname: 'Lightning',
          ranking_points: 2400,
          matches_played: 38,
          matches_won: 30,
          club_name: 'CLB Bida Đà Nẵng',
        },
      ];

      setRankings(mockRankings);
    } catch (error) {
      console.error('Error fetching rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClubs = async () => {
    try {
      const { data, error } = await supabase
        .from('clubs')
        .select('id, name')
        .eq('status', 'active');

      if (error) throw error;
      setClubs(data || []);
    } catch (error) {
      console.error('Error fetching clubs:', error);
    }
  };

  const getRankColor = (points: number) => {
    if (points >= 2500) return 'bg-purple-100 text-purple-800';
    if (points >= 2000) return 'bg-red-100 text-red-800';
    if (points >= 1500) return 'bg-orange-100 text-orange-800';
    if (points >= 1000) return 'bg-blue-100 text-blue-800';
    if (points >= 500) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getRankName = (points: number) => {
    if (points >= 2500) return 'Cao thủ';
    if (points >= 2000) return 'Hạng A';
    if (points >= 1500) return 'Hạng B';
    if (points >= 1000) return 'Hạng C';
    if (points >= 500) return 'Hạng D';
    return 'Hạng E';
  };

  const getRankIcon = (position: number) => {
    if (position === 1) return <Trophy className='h-5 w-5 text-yellow-500' />;
    if (position === 2) return <Medal className='h-5 w-5 text-gray-400' />;
    if (position === 3) return <Award className='h-5 w-5 text-orange-500' />;
    return <span className='font-semibold text-gray-600'>#{position}</span>;
  };

  const getWinRate = (won: number, played: number) => {
    return played > 0 ? Math.round((won / played) * 100) : 0;
  };

  const filteredRankings = rankings.filter(user => {
    if (selectedClub !== 'all') {
      // Filter by club logic would go here
      return true;
    }
    if (selectedRank !== 'all') {
      const rankName = getRankName(user.ranking_points);
      return rankName.includes(selectedRank);
    }
    return true;
  });

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>Đang tải...</div>
    );
  }

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-2xl font-bold text-gray-900'>
          Bảng xếp hạng & Đăng ký Rank
        </h2>
        <p className='text-gray-600'>
          Xem vị trí của bạn và đăng ký rank với CLB
        </p>
      </div>

      <Tabs defaultValue='rankings' className='w-full'>
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='rankings' className='flex items-center gap-2'>
            <Trophy className='w-4 h-4' />
            Bảng xếp hạng
          </TabsTrigger>
          <TabsTrigger value='history' className='flex items-center gap-2'>
            <History className='w-4 h-4' />
            Lịch sử mùa
          </TabsTrigger>
          <TabsTrigger value='registration' className='flex items-center gap-2'>
            <UserCheck className='w-4 h-4' />
            Đăng ký Rank
          </TabsTrigger>
        </TabsList>

        <TabsContent value='rankings' className='space-y-6'>
          {/* Filters */}
          <Card>
            <CardContent className='pt-6'>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div>
                  <label className='text-sm font-medium text-gray-700 mb-2 block'>
                    Mùa giải
                  </label>
                  <Select defaultValue='2025-S1'>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='2025-S1'>2025 - Mùa 1</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-700 mb-2 block'>
                    CLB
                  </label>
                  <Select value={selectedClub} onValueChange={setSelectedClub}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>Tất cả CLB</SelectItem>
                      {clubs.map(club => (
                        <SelectItem key={club.id} value={club.id}>
                          {club.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-700 mb-2 block'>
                    Hạng
                  </label>
                  <Select value={selectedRank} onValueChange={setSelectedRank}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>Tất cả hạng</SelectItem>
                      <SelectItem value='Hạng E'>Hạng E (0-499)</SelectItem>
                      <SelectItem value='Hạng D'>Hạng D (500-999)</SelectItem>
                      <SelectItem value='Hạng C'>Hạng C (1000-1499)</SelectItem>
                      <SelectItem value='Hạng B'>Hạng B (1500-1999)</SelectItem>
                      <SelectItem value='Hạng A'>Hạng A (2000-2499)</SelectItem>
                      <SelectItem value='Cao thủ'>Cao thủ (2500+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rankings Table */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Trophy className='h-5 w-5' />
                Bảng xếp hạng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                {filteredRankings.length > 0 ? (
                  filteredRankings.map((user, index) => (
                    <div
                      key={index}
                      className='flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50'
                    >
                      <div className='flex items-center space-x-4'>
                        <div className='flex items-center justify-center w-10 h-10'>
                          {getRankIcon(index + 1)}
                        </div>
                        <Avatar className='h-10 w-10'>
                          <AvatarFallback>
                            {(user.nickname || user.full_name)?.charAt(0) ||
                              '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className='font-medium'>
                            {user.nickname || user.full_name}
                          </div>
                          <div className='text-sm text-gray-500'>
                            {user.club_name}
                          </div>
                        </div>
                      </div>
                      <div className='flex items-center space-x-6'>
                        <div className='text-center'>
                          <Badge className={getRankColor(user.ranking_points)}>
                            {getRankName(user.ranking_points)} (
                            {user.ranking_points})
                          </Badge>
                        </div>
                        <div className='text-center'>
                          <div className='font-bold text-blue-600'>
                            {user.ranking_points}
                          </div>
                          <div className='text-xs text-gray-500'>Điểm</div>
                        </div>
                        <div className='text-center'>
                          <div className='font-medium'>
                            {user.matches_played}
                          </div>
                          <div className='text-xs text-gray-500'>Trận</div>
                        </div>
                        <div className='text-center'>
                          <div className='font-medium text-green-600'>
                            {getWinRate(user.matches_won, user.matches_played)}%
                          </div>
                          <div className='text-xs text-gray-500'>Thắng</div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className='text-center py-12'>
                    <Target className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                    <p className='text-gray-500 font-medium'>
                      Chưa có dữ liệu ranking
                    </p>
                    <p className='text-sm text-gray-400 mt-1'>
                      Tham gia thi đấu để xuất hiện trên bảng xếp hạng
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='history'>
          <SeasonHistoryTab />
        </TabsContent>

        <TabsContent value='registration'>
          <RankRegistrationForm onSuccess={fetchRankings} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RankingPage;
