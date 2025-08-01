import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Challenge } from '@/types/challenge';
import {
  Trophy,
  Clock,
  CheckCircle,
  MapPin,
  Calendar,
  Target,
  Filter,
  Download,
  Trash2,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';
import ThreeStepScoreWorkflow from '../score/ThreeStepScoreWorkflow';

interface ClubChallengesTabProps {
  clubId: string;
}

type FilterType = 'all' | 'pending' | 'completed' | 'confirmed';

const ClubChallengesTab: React.FC<ClubChallengesTabProps> = ({ clubId }) => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [showCompleted, setShowCompleted] = useState(false);

  const fetchClubChallenges = async () => {
    try {
      // First get club owner user_id
      const { data: clubProfile, error: clubError } = await supabase
        .from('club_profiles')
        .select('user_id, club_name')
        .eq('id', clubId)
        .single();

      if (clubError) throw clubError;

      const { data, error } = await supabase
        .from('challenges')
        .select(
          `
          *,
          challenger_profile:profiles!challenger_id(
            user_id,
            full_name,
            display_name,
            avatar_url,
            verified_rank,
            elo
          ),
          opponent_profile:profiles!opponent_id(
            user_id,
            full_name,
            display_name,
            avatar_url,
            verified_rank,
            elo
          ),
          club:club_profiles!challenges_club_id_fkey(
            id,
            club_name,
            address
          )
        `
        )
        .or(
          `club_id.eq.${clubId},club_confirmed_by.eq.${clubProfile.user_id},location.ilike.%${clubProfile.club_name}%,score_confirmation_status.eq.score_confirmed`
        )
        .in('status', ['pending', 'accepted', 'ongoing', 'completed'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChallenges(
        (data || []).map((challenge: any) => ({
          ...challenge,
          club: challenge.club
            ? {
                ...challenge.club,
                name: challenge.club.club_name,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }
            : undefined,
        })) as Challenge[]
      );
    } catch (error: any) {
      console.error('Error fetching club challenges:', error);
      toast.error('Lỗi khi tải danh sách thách đấu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clubId) {
      fetchClubChallenges();

      // Setup real-time subscription for club challenges
      const subscription = supabase
        .channel('club-challenges')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'challenges',
          },
          () => {
            fetchClubChallenges();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [clubId]);

  const getStatusBadge = (challenge: Challenge) => {
    switch (challenge.score_confirmation_status) {
      case 'pending':
        return (
          <Badge variant='secondary'>
            <Clock className='w-3 h-3 mr-1' />
            Chờ nhập tỷ số
          </Badge>
        );
      case 'score_entered':
        return (
          <Badge variant='destructive'>
            <Target className='w-3 h-3 mr-1' />
            Chờ xác nhận
          </Badge>
        );
      case 'score_confirmed':
        return (
          <Badge variant='destructive'>
            <Trophy className='w-3 h-3 mr-1' />
            Chờ CLB xác nhận
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant='default'>
            <CheckCircle className='w-3 h-3 mr-1' />
            Đã hoàn thành
          </Badge>
        );
      default:
        return <Badge variant='secondary'>Đang diễn ra</Badge>;
    }
  };

  const getScoreDisplay = (challenge: Challenge) => {
    if (
      challenge.score_confirmation_status === 'completed' &&
      challenge.challenger_final_score !== undefined &&
      challenge.challenger_final_score !== null &&
      challenge.opponent_final_score !== undefined &&
      challenge.opponent_final_score !== null
    ) {
      return `${challenge.challenger_final_score} - ${challenge.opponent_final_score}`;
    }
    if (
      challenge.challenger_final_score !== undefined &&
      challenge.challenger_final_score !== null &&
      challenge.opponent_final_score !== undefined &&
      challenge.opponent_final_score !== null
    ) {
      return `${challenge.challenger_final_score} - ${challenge.opponent_final_score}`;
    }
    return 'Race to ' + (challenge.race_to || 8);
  };

  // Filter and group challenges
  const filteredChallenges = useMemo(() => {
    switch (filter) {
      case 'pending':
        return challenges.filter(
          c =>
            c.score_confirmation_status === 'pending' ||
            c.score_confirmation_status === 'score_entered' ||
            c.score_confirmation_status === 'score_confirmed'
        );
      case 'completed':
        return challenges.filter(
          c => c.score_confirmation_status === 'completed'
        );
      case 'confirmed':
        return challenges.filter(c => c.club_confirmed === true);
      default:
        return challenges;
    }
  }, [challenges, filter]);

  const pendingChallenges = challenges.filter(
    c =>
      c.score_confirmation_status === 'pending' ||
      c.score_confirmation_status === 'score_entered' ||
      c.score_confirmation_status === 'score_confirmed'
  );

  const completedChallenges = challenges.filter(
    c => c.score_confirmation_status === 'completed'
  );
  const confirmedChallenges = challenges.filter(c => c.club_confirmed === true);

  const stats = {
    total: challenges.length,
    pending: pendingChallenges.length,
    completed: completedChallenges.length,
    confirmed: confirmedChallenges.length,
    today: challenges.filter(c => {
      const today = new Date().toDateString();
      const challengeDate = new Date(
        c.scheduled_time || c.created_at
      ).toDateString();
      return challengeDate === today;
    }).length,
  };

  const StatCard = ({
    label,
    value,
    icon,
    color = 'default',
  }: {
    label: string;
    value: string | number;
    icon: string;
    color?: 'default' | 'orange' | 'green';
  }) => (
    <Card
      className={`${
        color === 'orange'
          ? 'border-orange-200 bg-orange-50'
          : color === 'green'
            ? 'border-green-200 bg-green-50'
            : 'border-gray-200 bg-gray-50'
      }`}
    >
      <CardContent className='p-4'>
        <div className='flex items-center gap-3'>
          <span className='text-2xl'>{icon}</span>
          <div>
            <p className='text-2xl font-bold'>{value}</p>
            <p className='text-sm text-muted-foreground'>{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const FilterButton = ({
    active,
    onClick,
    children,
  }: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }) => (
    <Button
      variant={active ? 'default' : 'outline'}
      size='sm'
      onClick={onClick}
      className={`transition-all duration-200 ${active ? 'shadow-md' : 'hover:bg-muted'}`}
    >
      {children}
    </Button>
  );

  const renderChallengeCard = (challenge: Challenge, isPriority = false) => (
    <div
      key={challenge.id}
      className={`p-4 border rounded-lg transition-all duration-200 hover:shadow-md ${
        isPriority
          ? 'border-orange-200 bg-orange-50'
          : 'border-gray-200 bg-white'
      }`}
    >
      {/* Line 1: Player vs Player with Status */}
      <div className='flex items-center justify-between mb-2'>
        <div className='flex items-center gap-2'>
          <Avatar className='w-8 h-8'>
            <AvatarImage src={challenge.challenger_profile?.avatar_url} />
            <AvatarFallback>
              {challenge.challenger_profile?.full_name?.[0] || 'C'}
            </AvatarFallback>
          </Avatar>
          <span className='font-medium text-sm'>
            {challenge.challenger_profile?.display_name || 'Player 1'}
          </span>
          <span className='text-xs text-muted-foreground'>
            ({challenge.challenger_profile?.verified_rank || 'K'})
          </span>
          <span className='mx-2'>⚔️</span>
          <Avatar className='w-8 h-8'>
            <AvatarImage src={challenge.opponent_profile?.avatar_url} />
            <AvatarFallback>
              {challenge.opponent_profile?.full_name?.[0] || 'O'}
            </AvatarFallback>
          </Avatar>
          <span className='font-medium text-sm'>
            {challenge.opponent_profile?.display_name || 'Player 2'}
          </span>
          <span className='text-xs text-muted-foreground'>
            ({challenge.opponent_profile?.verified_rank || 'K'})
          </span>
        </div>
        <div className='flex items-center gap-2'>
          {getStatusBadge(challenge)}
          <ThreeStepScoreWorkflow
            challenge={challenge}
            isClubOwner={true}
            onScoreUpdated={fetchClubChallenges}
          />
        </div>
      </div>

      {/* Line 2: Game Details */}
      <div className='flex items-center gap-4 text-sm text-muted-foreground'>
        <div className='flex items-center gap-1'>
          <Trophy className='w-3 h-3' />
          <span>{challenge.bet_points} SPA</span>
        </div>
        <div className='flex items-center gap-1'>
          <Target className='w-3 h-3' />
          <span>{getScoreDisplay(challenge)}</span>
        </div>
        <div className='flex items-center gap-1'>
          <Clock className='w-3 h-3' />
          <span>
            {challenge.scheduled_time
              ? new Date(challenge.scheduled_time).toLocaleDateString('vi-VN') +
                ' ' +
                new Date(challenge.scheduled_time).toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : new Date(challenge.created_at).toLocaleDateString('vi-VN')}
          </span>
        </div>
        {challenge.location && (
          <div className='flex items-center gap-1'>
            <MapPin className='w-3 h-3' />
            <span className='truncate max-w-[120px]'>{challenge.location}</span>
          </div>
        )}
        {challenge.club_confirmed && (
          <Badge variant='default' className='text-xs'>
            ✅ CLB đã xác nhận
          </Badge>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <Card>
        <CardContent className='p-6'>
          <div className='text-center text-muted-foreground'>
            Đang tải danh sách thách đấu...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (challenges.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Trophy className='w-5 h-5' />
            Thách đấu tại CLB
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-center py-8 text-muted-foreground'>
            <Trophy className='h-12 w-12 mx-auto mb-4 text-gray-400' />
            <p className='font-medium'>Chưa có thách đấu nào</p>
            <p className='text-sm mt-1'>
              Các trận thách đấu diễn ra tại CLB sẽ hiển thị tại đây
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Stats Header */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        <StatCard label='Tổng trận' value={stats.total} icon='🏆' />
        <StatCard
          label='Chờ xử lý'
          value={stats.pending}
          icon='⏳'
          color='orange'
        />
        <StatCard
          label='Đã hoàn thành'
          value={stats.completed}
          icon='✅'
          color='green'
        />
        <StatCard label='Hôm nay' value={stats.today} icon='📅' />
      </div>

      {/* Filter Controls */}
      <Card>
        <CardContent className='p-4'>
          <div className='flex flex-col gap-4'>
            <div className='flex gap-2 flex-wrap'>
              <FilterButton
                active={filter === 'all'}
                onClick={() => setFilter('all')}
              >
                Tất cả ({stats.total})
              </FilterButton>
              <FilterButton
                active={filter === 'pending'}
                onClick={() => setFilter('pending')}
              >
                Chờ xử lý ({stats.pending})
              </FilterButton>
              <FilterButton
                active={filter === 'completed'}
                onClick={() => setFilter('completed')}
              >
                Đã hoàn thành ({stats.completed})
              </FilterButton>
              <FilterButton
                active={filter === 'confirmed'}
                onClick={() => setFilter('confirmed')}
              >
                Đã xác nhận CLB ({stats.confirmed})
              </FilterButton>
            </div>

            {/* Action Controls */}
            <div className='flex justify-between items-center pt-2 border-t'>
              <div className='flex gap-2'>
                <Button variant='outline' size='sm'>
                  <Calendar className='w-4 h-4 mr-1' />
                  Lọc theo ngày
                </Button>
                <Button variant='outline' size='sm'>
                  <BarChart3 className='w-4 h-4 mr-1' />
                  Xuất báo cáo
                </Button>
              </div>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setShowCompleted(!showCompleted)}
                >
                  <Trash2 className='w-4 h-4 mr-1' />
                  {showCompleted ? 'Ẩn' : 'Hiện'} đã hoàn thành
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={fetchClubChallenges}
                >
                  <RefreshCw className='w-4 h-4 mr-1' />
                  Làm mới
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Challenge Groups */}
      <div className='space-y-6'>
        {/* Urgent Actions Section */}
        {filter === 'all' && pendingChallenges.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className='text-orange-600 flex items-center gap-2'>
                <AlertCircle className='w-5 h-5' />
                🚨 Cần xử lý ({pendingChallenges.length})
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              {pendingChallenges.map(challenge =>
                renderChallengeCard(challenge, true)
              )}
            </CardContent>
          </Card>
        )}

        {/* Main Results */}
        {filter !== 'all' && (
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Trophy className='w-5 h-5' />
                {filter === 'pending' && 'Thách đấu chờ xử lý'}
                {filter === 'completed' && 'Thách đấu đã hoàn thành'}
                {filter === 'confirmed' && 'Thách đấu đã xác nhận bởi CLB'}(
                {filteredChallenges.length})
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              {filteredChallenges.length > 0 ? (
                filteredChallenges.map(challenge =>
                  renderChallengeCard(challenge)
                )
              ) : (
                <div className='text-center py-8 text-muted-foreground'>
                  <Trophy className='h-12 w-12 mx-auto mb-4 text-gray-400' />
                  <p>Không có thách đấu nào trong danh mục này</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Completed Section - Collapsible (only in 'all' view) */}
        {filter === 'all' && completedChallenges.length > 0 && (
          <Card>
            <CardHeader>
              <div className='flex justify-between items-center'>
                <CardTitle className='text-green-600 flex items-center gap-2'>
                  <CheckCircle className='w-5 h-5' />✅ Đã hoàn thành (
                  {completedChallenges.length})
                </CardTitle>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setShowCompleted(!showCompleted)}
                  className='flex items-center gap-2'
                >
                  {showCompleted ? (
                    <>
                      <ChevronUp className='w-4 h-4' />
                      Ẩn
                    </>
                  ) : (
                    <>
                      <ChevronDown className='w-4 h-4' />
                      Hiện ({completedChallenges.length})
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            {showCompleted && (
              <CardContent className='space-y-4 opacity-75'>
                {completedChallenges.map(challenge =>
                  renderChallengeCard(challenge)
                )}
              </CardContent>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

export default ClubChallengesTab;
