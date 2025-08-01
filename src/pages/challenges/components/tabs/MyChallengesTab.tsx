import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  MapPin,
  MessageCircle,
  Trophy,
  Target,
  Users,
  RefreshCw,
  MessageSquare,
  Ban,
} from 'lucide-react';
import UnifiedChallengeCard from '@/components/challenges/UnifiedChallengeCard';
import { useChallenges } from '@/hooks/useChallenges';
import ActiveChallengesSection from '../sections/ActiveChallengesSection';

interface MyChallengesTabProps {
  onStatsUpdate: () => void;
  highlightedChallengeId?: string | null;
}

const MyChallengesTab: React.FC<MyChallengesTabProps> = ({
  onStatsUpdate,
  highlightedChallengeId,
}) => {
  const { user } = useAuth();
  const { challenges, loading, error, acceptChallenge, fetchChallenges } =
    useChallenges();

  // Filter challenges by user participation
  const receivedChallenges = challenges.filter(c => c.opponent_id === user?.id);
  const sentChallenges = challenges.filter(c => c.challenger_id === user?.id);

  const declineChallenge = async (challengeId: string) => {
    const { error } = await supabase
      .from('challenges')
      .update({ status: 'declined', responded_at: new Date().toISOString() })
      .eq('id', challengeId);
    if (error) throw error;
    await fetchChallenges();
  };

  const cancelChallenge = async (challengeId: string) => {
    const { error } = await supabase
      .from('challenges')
      .update({ status: 'cancelled' })
      .eq('id', challengeId);
    if (error) throw error;
    await fetchChallenges();
  };

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Listen for challenge join events from other tabs
    const handleChallengeJoined = () => {
      fetchChallenges();
      onStatsUpdate();
    };

    window.addEventListener('challengeJoined', handleChallengeJoined);
    return () =>
      window.removeEventListener('challengeJoined', handleChallengeJoined);
  }, [fetchChallenges, onStatsUpdate]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchChallenges();
    await onStatsUpdate();
    setRefreshing(false);
  };

  const handleAcceptChallenge = async (challengeId: string) => {
    try {
      await acceptChallenge(challengeId);
      toast.success('Đã chấp nhận thách đấu!');
      onStatsUpdate();
    } catch (error) {
      toast.error('Lỗi khi chấp nhận thách đấu');
    }
  };

  const handleDeclineChallenge = async (challengeId: string) => {
    try {
      await declineChallenge(challengeId);
      toast.success('Đã từ chối thách đấu');
      onStatsUpdate();
    } catch (error) {
      toast.error('Lỗi khi từ chối thách đấu');
    }
  };

  const handleCancelChallenge = async (challengeId: string) => {
    try {
      await cancelChallenge(challengeId);
      toast.success('Đã hủy thách đấu');
      onStatsUpdate();
    } catch (error) {
      toast.error('Lỗi khi hủy thách đấu');
    }
  };

  if (loading) {
    return (
      <div className='text-center py-8'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4'></div>
        <p className='text-muted-foreground'>Đang tải thách đấu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className='text-center py-8'>
        <div className='text-destructive mb-4'>❌ Lỗi tải dữ liệu</div>
        <p className='text-muted-foreground mb-4'>{error}</p>
        <Button onClick={handleRefresh}>
          <RefreshCw className='w-4 h-4 mr-2' />
          Thử lại
        </Button>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header with actions */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-xl font-semibold'>Thách đấu của tôi</h2>
          <p className='text-sm text-muted-foreground'>
            Quản lý các thách đấu đã gửi và nhận được
          </p>
        </div>
        <Button
          variant='outline'
          onClick={handleRefresh}
          disabled={refreshing}
          className='gap-2'
        >
          <RefreshCw
            className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
          />
          Làm mới
        </Button>
      </div>

      {/* Sub-tabs for different challenge types */}
      <Tabs defaultValue='incoming' className='w-full'>
        <TabsList className='grid w-full grid-cols-4'>
          <TabsTrigger value='incoming' className='relative'>
            Thách đấu đến
            {receivedChallenges.filter(c => c.status === 'pending').length >
              0 && (
              <Badge className='ml-1 h-5 w-5 rounded-full p-0 text-xs bg-red-500'>
                {receivedChallenges.filter(c => c.status === 'pending').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value='outgoing'>Thách đấu đi</TabsTrigger>
          <TabsTrigger value='active'>Đang diễn ra</TabsTrigger>
          <TabsTrigger value='completed'>Đã hoàn thành</TabsTrigger>
        </TabsList>

        {/* Incoming Challenges */}
        <TabsContent value='incoming' className='space-y-4 mt-6'>
          {receivedChallenges.length === 0 ? (
            <Card>
              <CardContent className='text-center py-12'>
                <MessageCircle className='w-16 h-16 text-muted-foreground/50 mx-auto mb-4' />
                <h3 className='font-semibold text-lg mb-2'>
                  Không có thách đấu nào
                </h3>
                <p className='text-muted-foreground'>
                  Chưa có ai thách đấu bạn. Hãy tạo thách đấu mở để mời người
                  khác!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className='grid gap-4'>
              {receivedChallenges.map(challenge => (
                <UnifiedChallengeCard
                  key={challenge.id}
                  challenge={{
                    ...challenge,
                    bet_points: challenge.bet_points || 0,
                    challenger_id: challenge.challenger_id || '',
                    opponent_id:
                      challenge.opponent_id || challenge.challenged_id || '',
                    status: challenge.status as any,
                  }}
                  variant='default'
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Outgoing Challenges */}
        <TabsContent value='outgoing' className='space-y-4 mt-6'>
          {sentChallenges.length === 0 ? (
            <Card>
              <CardContent className='text-center py-12'>
                <Target className='w-16 h-16 text-muted-foreground/50 mx-auto mb-4' />
                <h3 className='font-semibold text-lg mb-2'>
                  Chưa gửi thách đấu nào
                </h3>
                <p className='text-muted-foreground'>
                  Hãy tạo thách đấu đầu tiên của bạn để bắt đầu thi đấu!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className='grid gap-4'>
              {sentChallenges.map(challenge => (
                <UnifiedChallengeCard
                  key={challenge.id}
                  challenge={{
                    ...challenge,
                    bet_points: challenge.bet_points || 0,
                    challenger_id: challenge.challenger_id || '',
                    opponent_id:
                      challenge.opponent_id || challenge.challenged_id || '',
                    status: challenge.status as any,
                  }}
                  variant='compact'
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Active Challenges */}
        <TabsContent value='active' className='space-y-4 mt-6'>
          {challenges.filter(
            c =>
              c.status === 'accepted' ||
              c.score_confirmation_status === 'score_entered' ||
              c.score_confirmation_status === 'score_confirmed'
          ).length === 0 ? (
            <Card>
              <CardContent className='text-center py-12'>
                <Users className='w-16 h-16 text-muted-foreground/50 mx-auto mb-4' />
                <h3 className='font-semibold text-lg mb-2'>
                  Không có trận đấu nào
                </h3>
                <p className='text-muted-foreground'>
                  Chưa có thách đấu nào được chấp nhận. Hãy tạo hoặc tham gia
                  thách đấu!
                </p>
              </CardContent>
            </Card>
          ) : (
            <ActiveChallengesSection
              challenges={
                challenges.filter(
                  c =>
                    c.status === 'accepted' ||
                    c.score_confirmation_status === 'score_entered' ||
                    c.score_confirmation_status === 'score_confirmed'
                ) as any[]
              }
              currentUserId={user?.id}
              onCancelChallenge={handleCancelChallenge}
              onStatsUpdate={onStatsUpdate}
              highlightedChallengeId={highlightedChallengeId}
            />
          )}
        </TabsContent>

        {/* Completed Challenges */}
        <TabsContent value='completed' className='space-y-4 mt-6'>
          {challenges.filter(c => c.status === 'completed').length === 0 ? (
            <Card>
              <CardContent className='text-center py-12'>
                <Trophy className='w-16 h-16 text-muted-foreground/50 mx-auto mb-4' />
                <h3 className='font-semibold text-lg mb-2'>
                  Chưa có trận đấu hoàn thành
                </h3>
                <p className='text-muted-foreground'>
                  Lịch sử các trận đấu đã hoàn thành sẽ hiển thị ở đây.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className='grid gap-4'>
              {challenges
                .filter(c => c.status === 'completed')
                .map(challenge => (
                  <UnifiedChallengeCard
                    key={challenge.id}
                    challenge={{
                      ...challenge,
                      bet_points: challenge.bet_points || 0,
                      challenger_id: challenge.challenger_id || '',
                      opponent_id:
                        challenge.opponent_id || challenge.challenged_id || '',
                      status: challenge.status as any,
                    }}
                    variant='compact'
                  />
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyChallengesTab;
