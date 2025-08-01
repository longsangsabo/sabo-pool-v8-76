import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Radio,
  TrendingUp,
  TrendingDown,
  Bell,
  Users,
  Activity,
  Trophy,
  Target,
  Zap,
  Clock,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface RealtimeActivity {
  id: string;
  type: 'match_completed' | 'rank_change' | 'new_record' | 'tournament_result';
  playerId: string;
  playerName: string;
  description: string;
  timestamp: Date;
  eloChange?: number;
  oldRank?: string;
  newRank?: string;
  metadata?: any;
}

interface LiveRankingUpdate {
  playerId: string;
  playerName: string;
  currentElo: number;
  previousElo: number;
  change: number;
  newPosition: number;
  oldPosition: number;
  timestamp: Date;
}

export const RealtimeRankingTracker: React.FC = () => {
  const { user } = useAuth();
  const [isTracking, setIsTracking] = useState(false);
  const [activities, setActivities] = useState<RealtimeActivity[]>([]);
  const [liveUpdates, setLiveUpdates] = useState<LiveRankingUpdate[]>([]);
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    if (isTracking) {
      startRealtimeTracking();
    } else {
      stopRealtimeTracking();
    }

    return () => stopRealtimeTracking();
  }, [isTracking]);

  const startRealtimeTracking = () => {
    // Subscribe to match results updates
    const matchResultsChannel = supabase
      .channel('match-results-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'match_results',
          filter: 'result_status=eq.verified',
        },
        payload => {
          handleMatchResultUpdate(payload.new);
        }
      )
      .subscribe();

    // Subscribe to ELO history updates
    const eloHistoryChannel = supabase
      .channel('elo-history-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'elo_history',
        },
        payload => {
          handleEloHistoryUpdate(payload.new);
        }
      )
      .subscribe();

    // Subscribe to ranking snapshots
    const rankingChannel = supabase
      .channel('ranking-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'player_rankings',
        },
        payload => {
          handleRankingUpdate(payload.new);
        }
      )
      .subscribe();
  };

  const stopRealtimeTracking = () => {
    supabase.removeAllChannels();
  };

  const handleMatchResultUpdate = (matchResult: any) => {
    // Create activity entry for completed match
    const activity: RealtimeActivity = {
      id: `match-${matchResult.id}`,
      type: 'match_completed',
      playerId: matchResult.winner_id,
      playerName: 'Player', // Would be fetched from profile
      description: `Thắng trận và thay đổi ${matchResult.player1_elo_change} ELO`,
      timestamp: new Date(),
      eloChange:
        matchResult.winner_id === matchResult.player1_id
          ? matchResult.player1_elo_change
          : matchResult.player2_elo_change,
    };

    setActivities(prev => [activity, ...prev.slice(0, 49)]);

    if (notifications && matchResult.winner_id === user?.id) {
      showNotification('Trận đấu hoàn thành!', activity.description);
    }
  };

  const handleEloHistoryUpdate = (eloEntry: any) => {
    // Create live ranking update
    const update: LiveRankingUpdate = {
      playerId: eloEntry.user_id,
      playerName: 'Player', // Would be fetched
      currentElo: eloEntry.elo_after,
      previousElo: eloEntry.elo_before,
      change: eloEntry.elo_change,
      newPosition: 0, // Would be calculated
      oldPosition: 0, // Would be calculated
      timestamp: new Date(),
    };

    setLiveUpdates(prev => [update, ...prev.slice(0, 19)]);
  };

  const handleRankingUpdate = (ranking: any) => {
    // Check for rank changes
    const oldRank = getRankFromELO(ranking.elo - 50); // Approximate
    const newRank = getRankFromELO(ranking.elo);

    if (oldRank !== newRank) {
      const activity: RealtimeActivity = {
        id: `rank-${ranking.user_id}-${Date.now()}`,
        type: 'rank_change',
        playerId: ranking.user_id,
        playerName: 'Player',
        description: `Thăng hạng từ ${oldRank} lên ${newRank}`,
        timestamp: new Date(),
        oldRank,
        newRank,
      };

      setActivities(prev => [activity, ...prev.slice(0, 49)]);

      if (notifications && ranking.user_id === user?.id) {
        showNotification('Thăng hạng!', activity.description);
      }
    }
  };

  const getRankFromELO = (elo: number): string => {
    if (elo >= 2800) return 'E+';
    if (elo >= 2600) return 'E';
    if (elo >= 2400) return 'F+';
    if (elo >= 2200) return 'F';
    if (elo >= 2000) return 'G+';
    if (elo >= 1800) return 'G';
    if (elo >= 1600) return 'H+';
    if (elo >= 1400) return 'H';
    if (elo >= 1200) return 'I+';
    if (elo >= 1000) return 'I';
    if (elo >= 800) return 'K+';
    return 'K';
  };

  const showNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'match_completed':
        return <Target className='h-4 w-4 text-blue-500' />;
      case 'rank_change':
        return <Trophy className='h-4 w-4 text-yellow-500' />;
      case 'new_record':
        return <Zap className='h-4 w-4 text-purple-500' />;
      case 'tournament_result':
        return <Users className='h-4 w-4 text-green-500' />;
      default:
        return <Activity className='h-4 w-4 text-gray-500' />;
    }
  };

  const getActivityTypeText = (type: string) => {
    switch (type) {
      case 'match_completed':
        return 'Trận đấu';
      case 'rank_change':
        return 'Thay đổi hạng';
      case 'new_record':
        return 'Kỷ lục mới';
      case 'tournament_result':
        return 'Giải đấu';
      default:
        return 'Hoạt động';
    }
  };

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle className='flex items-center gap-2'>
              <Radio
                className={`h-5 w-5 ${isTracking ? 'text-green-500' : 'text-gray-500'}`}
              />
              Theo Dõi Ranking Realtime
              {isTracking && (
                <Badge className='bg-green-100 text-green-800 border-green-200'>
                  <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2' />
                  Live
                </Badge>
              )}
            </CardTitle>
            <div className='flex items-center gap-4'>
              <div className='flex items-center gap-2'>
                <Bell className='h-4 w-4' />
                <Switch
                  checked={notifications}
                  onCheckedChange={setNotifications}
                />
              </div>
              <Button
                variant={isTracking ? 'destructive' : 'default'}
                onClick={() => {
                  if (!isTracking) {
                    requestNotificationPermission();
                  }
                  setIsTracking(!isTracking);
                }}
              >
                {isTracking ? 'Dừng theo dõi' : 'Bắt đầu theo dõi'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-muted-foreground'>
            Theo dõi các thay đổi ranking và hoạt động trận đấu trong thời gian
            thực.
            {!isTracking && ' Bật theo dõi để nhận cập nhật live.'}
          </p>
        </CardContent>
      </Card>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Live Activities */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Activity className='h-5 w-5' />
              Hoạt Động Gần Đây
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3 max-h-96 overflow-y-auto'>
              {activities.length === 0 ? (
                <div className='text-center py-8 text-muted-foreground'>
                  {isTracking
                    ? 'Chờ hoạt động mới...'
                    : 'Bật theo dõi để xem hoạt động'}
                </div>
              ) : (
                activities.map(activity => (
                  <div
                    key={activity.id}
                    className='flex items-start gap-3 p-3 bg-muted/50 rounded-lg'
                  >
                    <div className='mt-1'>{getActivityIcon(activity.type)}</div>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2 mb-1'>
                        <Badge variant='outline' className='text-xs'>
                          {getActivityTypeText(activity.type)}
                        </Badge>
                        <span className='text-xs text-muted-foreground'>
                          {formatDistanceToNow(activity.timestamp, {
                            addSuffix: true,
                            locale: vi,
                          })}
                        </span>
                      </div>
                      <p className='text-sm font-medium'>
                        {activity.playerName}
                      </p>
                      <p className='text-sm text-muted-foreground'>
                        {activity.description}
                      </p>
                      {activity.eloChange && (
                        <div className='flex items-center gap-1 mt-1'>
                          {activity.eloChange > 0 ? (
                            <TrendingUp className='h-3 w-3 text-green-500' />
                          ) : (
                            <TrendingDown className='h-3 w-3 text-red-500' />
                          )}
                          <span
                            className={`text-xs font-medium ${
                              activity.eloChange > 0
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {activity.eloChange > 0 ? '+' : ''}
                            {activity.eloChange} ELO
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Live Ranking Updates */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <TrendingUp className='h-5 w-5' />
              Cập Nhật Ranking Live
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3 max-h-96 overflow-y-auto'>
              {liveUpdates.length === 0 ? (
                <div className='text-center py-8 text-muted-foreground'>
                  {isTracking
                    ? 'Chờ cập nhật ranking...'
                    : 'Bật theo dõi để xem cập nhật'}
                </div>
              ) : (
                liveUpdates.map((update, index) => (
                  <div
                    key={index}
                    className='flex items-center justify-between p-3 bg-muted/50 rounded-lg'
                  >
                    <div className='flex items-center gap-3'>
                      <div className='w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center'>
                        <span className='text-xs font-bold text-primary'>
                          #{update.newPosition}
                        </span>
                      </div>
                      <div>
                        <p className='font-medium text-sm'>
                          {update.playerName}
                        </p>
                        <p className='text-xs text-muted-foreground'>
                          {formatDistanceToNow(update.timestamp, {
                            addSuffix: true,
                            locale: vi,
                          })}
                        </p>
                      </div>
                    </div>
                    <div className='text-right'>
                      <div className='flex items-center gap-2'>
                        <span className='font-bold'>{update.currentElo}</span>
                        <div className='flex items-center gap-1'>
                          {update.change > 0 ? (
                            <TrendingUp className='h-3 w-3 text-green-500' />
                          ) : (
                            <TrendingDown className='h-3 w-3 text-red-500' />
                          )}
                          <span
                            className={`text-xs font-medium ${
                              update.change > 0
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {update.change > 0 ? '+' : ''}
                            {update.change}
                          </span>
                        </div>
                      </div>
                      {update.oldPosition !== update.newPosition && (
                        <p className='text-xs text-muted-foreground'>
                          #{update.oldPosition} → #{update.newPosition}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      {isTracking && (
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <Card>
            <CardContent className='p-4 text-center'>
              <p className='text-2xl font-bold text-primary'>
                {activities.length}
              </p>
              <p className='text-sm text-muted-foreground'>Hoạt động hôm nay</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-4 text-center'>
              <p className='text-2xl font-bold text-green-600'>
                {activities.filter(a => a.type === 'rank_change').length}
              </p>
              <p className='text-sm text-muted-foreground'>Thay đổi hạng</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-4 text-center'>
              <p className='text-2xl font-bold text-blue-600'>
                {activities.filter(a => a.type === 'match_completed').length}
              </p>
              <p className='text-sm text-muted-foreground'>
                Trận đấu hoàn thành
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-4 text-center'>
              <div className='flex items-center justify-center gap-1'>
                <Clock className='h-4 w-4 text-muted-foreground' />
                <p className='text-sm font-medium'>Live Tracking</p>
              </div>
              <p className='text-xs text-muted-foreground'>Đang hoạt động</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
