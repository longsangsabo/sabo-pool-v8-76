import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Trophy,
  Medal,
  Star,
  TrendingUp,
  User,
  Copy,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface UserEloData {
  user_id: string;
  full_name: string;
  display_name: string;
  total_tournaments: number;
  total_elo_earned: number;
  total_spa_earned: number;
  championships: number;
  runner_ups: number;
  top_3_finishes: number;
  average_position: number;
  recent_tournaments: Array<{
    tournament_name: string;
    final_position: number;
    elo_points_earned: number;
    spa_points_earned: number;
    created_at: string;
  }>;
}

export const EloHistoryChecker: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [userData, setUserData] = useState<UserEloData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!userId.trim()) {
      setError('Vui lòng nhập User ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, full_name, display_name')
        .eq('user_id', userId.trim())
        .single();

      if (profileError || !profile) {
        setError('Không tìm thấy user với ID này');
        setLoading(false);
        return;
      }

      // Fetch tournament summary
      const { data: summary, error: summaryError } = await supabase
        .from('tournament_results')
        .select(
          `
          final_position,
          elo_points_earned,
          spa_points_earned
        `
        )
        .eq('user_id', userId.trim());

      if (summaryError) {
        console.error('Error fetching summary:', summaryError);
        setError('Lỗi khi lấy dữ liệu tổng quan');
        setLoading(false);
        return;
      }

      // Fetch recent tournaments
      const { data: recentTournaments, error: recentError } = await supabase
        .from('tournament_results')
        .select(
          `
          final_position,
          elo_points_earned,
          spa_points_earned,
          created_at,
          tournaments!inner(name)
        `
        )
        .eq('user_id', userId.trim())
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentError) {
        console.error('Error fetching recent tournaments:', recentError);
      }

      // Calculate summary stats
      const tournaments = summary || [];
      const totalTournaments = tournaments.length;
      const totalEloEarned = tournaments.reduce(
        (sum, t) => sum + (t.elo_points_earned || 0),
        0
      );
      const totalSpaEarned = tournaments.reduce(
        (sum, t) => sum + (t.spa_points_earned || 0),
        0
      );
      const championships = tournaments.filter(
        t => t.final_position === 1
      ).length;
      const runnerUps = tournaments.filter(t => t.final_position === 2).length;
      const top3Finishes = tournaments.filter(
        t => t.final_position <= 3
      ).length;
      const averagePosition =
        totalTournaments > 0
          ? tournaments.reduce((sum, t) => sum + t.final_position, 0) /
            totalTournaments
          : 0;

      // Format recent tournaments
      const formattedRecent = (recentTournaments || []).map(t => ({
        tournament_name: (t.tournaments as any)?.name || 'Unknown Tournament',
        final_position: t.final_position,
        elo_points_earned: t.elo_points_earned || 0,
        spa_points_earned: t.spa_points_earned || 0,
        created_at: t.created_at,
      }));

      setUserData({
        user_id: profile.user_id,
        full_name: profile.full_name || '',
        display_name: profile.display_name || '',
        total_tournaments: totalTournaments,
        total_elo_earned: totalEloEarned,
        total_spa_earned: totalSpaEarned,
        championships,
        runner_ups: runnerUps,
        top_3_finishes: top3Finishes,
        average_position: averagePosition,
        recent_tournaments: formattedRecent,
      });
    } catch (err) {
      console.error('Error in search:', err);
      setError('Có lỗi xảy ra khi tìm kiếm');
    } finally {
      setLoading(false);
    }
  };

  const getPositionBadge = (position: number) => {
    if (position === 1) {
      return (
        <Badge className='bg-yellow-500 text-black'>
          <Trophy className='w-3 h-3 mr-1' />
          Champion
        </Badge>
      );
    } else if (position === 2) {
      return (
        <Badge className='bg-gray-400 text-black'>
          <Medal className='w-3 h-3 mr-1' />
          Runner-up
        </Badge>
      );
    } else if (position === 3) {
      return (
        <Badge className='bg-amber-600 text-white'>
          <Star className='w-3 h-3 mr-1' />
          3rd Place
        </Badge>
      );
    } else if (position <= 8) {
      return <Badge variant='secondary'>Top 8 (#{position})</Badge>;
    } else {
      return <Badge variant='outline'>#{position}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const copyUserId = () => {
    navigator.clipboard.writeText(userId);
  };

  return (
    <div className='space-y-6'>
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Search className='w-5 h-5' />
            Kiểm tra lịch sử ELO của User
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex gap-4'>
            <div className='flex-1'>
              <Label htmlFor='userId'>User ID (UUID)</Label>
              <Input
                id='userId'
                value={userId}
                onChange={e => setUserId(e.target.value)}
                placeholder='Nhập User ID để kiểm tra...'
                className='mt-1'
              />
            </div>
            <div className='flex items-end gap-2'>
              <Button onClick={handleSearch} disabled={loading}>
                {loading ? 'Đang tìm...' : 'Tìm kiếm'}
              </Button>
              {userId && (
                <Button variant='outline' size='icon' onClick={copyUserId}>
                  <Copy className='w-4 h-4' />
                </Button>
              )}
            </div>
          </div>
          {error && (
            <div className='mt-2 text-sm text-red-600 bg-red-50 p-2 rounded'>
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {userData && (
        <div className='space-y-6'>
          {/* User Info */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <User className='w-5 h-5' />
                Thông tin User
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-2'>
                <div>
                  <strong>User ID:</strong> {userData.user_id}
                </div>
                <div>
                  <strong>Tên đầy đủ:</strong>{' '}
                  {userData.full_name || 'Chưa cập nhật'}
                </div>
                <div>
                  <strong>Tên hiển thị:</strong>{' '}
                  {userData.display_name || 'Chưa cập nhật'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <TrendingUp className='w-5 h-5' />
                Tổng quan ELO từ giải đấu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                <div className='text-center'>
                  <div className='text-3xl font-bold text-blue-600'>
                    {userData.total_elo_earned}
                  </div>
                  <div className='text-sm text-gray-600'>
                    Tổng ELO kiếm được
                  </div>
                </div>
                <div className='text-center'>
                  <div className='text-3xl font-bold text-green-600'>
                    {userData.total_spa_earned.toLocaleString()}
                  </div>
                  <div className='text-sm text-gray-600'>
                    Tổng SPA kiếm được
                  </div>
                </div>
                <div className='text-center'>
                  <div className='text-3xl font-bold text-yellow-600'>
                    {userData.championships}
                  </div>
                  <div className='text-sm text-gray-600'>Vô địch</div>
                </div>
                <div className='text-center'>
                  <div className='text-3xl font-bold text-purple-600'>
                    {userData.total_tournaments}
                  </div>
                  <div className='text-sm text-gray-600'>Giải đấu</div>
                </div>
              </div>

              <div className='mt-4 pt-4 border-t'>
                <div className='grid grid-cols-2 md:grid-cols-3 gap-4 text-sm'>
                  <div className='flex justify-between'>
                    <span>Á quân:</span>
                    <span className='font-medium'>{userData.runner_ups}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Top 3:</span>
                    <span className='font-medium'>
                      {userData.top_3_finishes}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Vị trí TB:</span>
                    <span className='font-medium'>
                      {userData.average_position.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Tournaments */}
          {userData.recent_tournaments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>
                  Giải đấu gần nhất ({userData.recent_tournaments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {userData.recent_tournaments.map((tournament, index) => (
                    <div
                      key={index}
                      className='border rounded-lg p-4 space-y-3'
                    >
                      <div className='flex justify-between items-start'>
                        <div className='flex-1'>
                          <h4 className='font-medium'>
                            {tournament.tournament_name}
                          </h4>
                          <p className='text-sm text-gray-500'>
                            {formatDate(tournament.created_at)}
                          </p>
                        </div>
                        <div className='text-right'>
                          {getPositionBadge(tournament.final_position)}
                        </div>
                      </div>

                      <div className='grid grid-cols-2 gap-4 text-sm'>
                        <div>
                          <span className='text-gray-600'>ELO nhận:</span>
                          <div className='font-medium text-blue-600'>
                            +{tournament.elo_points_earned}
                          </div>
                        </div>
                        <div>
                          <span className='text-gray-600'>SPA nhận:</span>
                          <div className='font-medium text-green-600'>
                            +{tournament.spa_points_earned.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default EloHistoryChecker;
