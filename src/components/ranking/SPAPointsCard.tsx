import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import {
  InfoIcon,
  StarIcon,
  GiftIcon,
  Trophy,
  Swords,
  CalendarCheck,
  Video,
  TrendingDown,
  History,
  Calendar,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';

interface SPAMilestone {
  points: number;
  title: string;
  reward: string;
  completed: boolean;
}

interface SPATransaction {
  id: string;
  user_id: string;
  points_earned: number;
  source_type: string;
  source_id?: string;
  description: string;
  created_at: string;
}

interface SPAPointsCardProps {
  points: number;
  milestones?: SPAMilestone[];
  weeklyRank?: number;
  monthlyRank?: number;
}

export const SPAPointsCard: React.FC<SPAPointsCardProps> = ({
  points,
  milestones = [],
  weeklyRank,
  monthlyRank,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [recentTransactions, setRecentTransactions] = useState<
    SPATransaction[]
  >([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate total earned and spent
  const totalEarned = recentTransactions
    .filter(t => t.points_earned > 0)
    .reduce((sum, t) => sum + t.points_earned, 0);

  const totalSpent = Math.abs(
    recentTransactions
      .filter(t => t.points_earned < 0)
      .reduce((sum, t) => sum + t.points_earned, 0)
  );

  // Fetch recent SPA transactions
  useEffect(() => {
    if (!user?.id) return;

    const fetchTransactions = async () => {
      console.log(
        '🔍 [SPAPointsCard] Fetching SPA transactions for user:',
        user.id
      );
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('spa_points_log')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20); // Get more for better calculations

        if (error) {
          console.error(
            '❌ [SPAPointsCard] Error fetching transactions:',
            error
          );
          throw error;
        }

        console.log(
          '✅ [SPAPointsCard] Fetched',
          data?.length || 0,
          'transactions'
        );
        // Transform spa_points_log data to match SPATransaction interface
        const transformedData =
          data?.map(item => ({
            id: item.id,
            user_id: item.user_id,
            points_earned: item.points,
            source_type: item.category,
            description: item.description || '',
            created_at: item.created_at,
            reference_id: item.reference_id || '',
            reference_type: item.reference_type || '',
          })) || [];
        setRecentTransactions(transformedData);
      } catch (error) {
        console.error(
          '❌ [SPAPointsCard] Failed to fetch SPA transactions:',
          error
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();

    // Set up real-time subscription
    console.log('🔔 [SPAPointsCard] Setting up real-time subscription');
    const subscription = supabase
      .channel('spa-points-card-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'spa_points_log',
          filter: `user_id=eq.${user.id}`,
        },
        payload => {
          console.log(
            '🆕 [SPAPointsCard] New SPA transaction received:',
            payload
          );
          const newTransaction = payload.new as SPATransaction;
          setRecentTransactions(prev => [newTransaction, ...prev.slice(0, 19)]);
          // Invalidate queries to refresh SPA balance
          queryClient.invalidateQueries({ queryKey: ['player-performance'] });

          // Show toast notification for new transaction
          import('@/hooks/use-toast').then(({ toast }) => {
            toast({
              title: 'SPA Points cập nhật',
              description: `${newTransaction.points_earned > 0 ? '+' : ''}${newTransaction.points_earned} SPA - ${newTransaction.description}`,
              duration: 3000,
            });
          });
        }
      )
      .subscribe(status => {
        console.log('📡 [SPAPointsCard] Subscription status:', status);
      });

    return () => {
      console.log('🧹 [SPAPointsCard] Cleaning up subscription');
      subscription.unsubscribe();
    };
  }, [user?.id, queryClient]);

  // Tìm milestone tiếp theo
  const nextMilestone = milestones.find(m => !m.completed && m.points > points);
  const progressToNext = nextMilestone
    ? Math.min(100, (points / nextMilestone.points) * 100)
    : 100;

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'tournament':
        return <Trophy className='h-3 w-3 text-yellow-600' />;
      case 'challenge':
        return <Swords className='h-3 w-3 text-red-600' />;
      case 'checkin':
        return <CalendarCheck className='h-3 w-3 text-green-600' />;
      case 'video':
        return <Video className='h-3 w-3 text-blue-600' />;
      case 'registration':
        return <GiftIcon className='h-3 w-3 text-purple-600' />;
      case 'decay':
        return <TrendingDown className='h-3 w-3 text-gray-600' />;
      default:
        return <StarIcon className='h-3 w-3 text-gray-600' />;
    }
  };

  const getTransactionTypeName = (type: string) => {
    switch (type) {
      case 'tournament':
        return 'Giải đấu';
      case 'challenge':
        return 'Thách đấu';
      case 'checkin':
        return 'Check-in';
      case 'video':
        return 'Video';
      case 'registration':
        return 'Đăng ký';
      case 'decay':
        return 'Giảm điểm';
      default:
        return type;
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} giờ trước`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} ngày trước`;

    return date.toLocaleDateString('vi-VN');
  };

  return (
    <Card className='w-full'>
      <CardHeader>
        <CardTitle className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <StarIcon className='h-5 w-5 text-yellow-500' />
            <span>SPA Points</span>
            <Badge
              variant='outline'
              className='bg-gradient-to-r from-yellow-100 to-yellow-200'
            >
              {points.toLocaleString('vi-VN')}
            </Badge>
          </div>
          <Tooltip>
            <TooltipTrigger>
              <InfoIcon className='h-4 w-4 text-muted-foreground' />
            </TooltipTrigger>
            <TooltipContent className='max-w-sm'>
              <div className='space-y-2'>
                <p>
                  <strong>
                    SPA Points là hệ thống "Ranking vui" và đổi thưởng.
                  </strong>
                </p>
                <p>Kiếm điểm từ thách đấu, giải đấu và hoàn thành milestone.</p>
                <p>Dùng để xếp hạng tuần/tháng và đổi phần thưởng hấp dẫn.</p>
                <p>
                  Khác với ELO - SPA Points không ảnh hưởng đến hạng chính thức.
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </CardTitle>
      </CardHeader>

      <CardContent className='space-y-4'>
        {/* SPA Stats Overview */}
        <div className='grid grid-cols-3 gap-3 mb-4'>
          <div className='text-center p-3 bg-green-50 rounded-lg'>
            <div className='text-lg font-bold text-green-600'>
              {points.toLocaleString('vi-VN')}
            </div>
            <div className='text-xs text-green-600'>Số dư hiện tại</div>
          </div>
          <div className='text-center p-3 bg-blue-50 rounded-lg'>
            <div className='text-lg font-bold text-blue-600'>
              {totalEarned.toLocaleString('vi-VN')}
            </div>
            <div className='text-xs text-blue-600'>Tổng đã kiếm</div>
          </div>
          <div className='text-center p-3 bg-orange-50 rounded-lg'>
            <div className='text-lg font-bold text-orange-600'>
              {totalSpent.toLocaleString('vi-VN')}
            </div>
            <div className='text-xs text-orange-600'>Tổng đã chi</div>
          </div>
        </div>

        {/* Ranking Info */}
        {(weeklyRank || monthlyRank) && (
          <div className='grid grid-cols-2 gap-4 mb-4'>
            {weeklyRank && (
              <div className='text-center p-3 bg-purple-50 rounded-lg'>
                <div className='text-lg font-bold text-purple-600'>
                  #{weeklyRank}
                </div>
                <div className='text-xs text-purple-600'>Xếp hạng tuần</div>
              </div>
            )}
            {monthlyRank && (
              <div className='text-center p-3 bg-indigo-50 rounded-lg'>
                <div className='text-lg font-bold text-indigo-600'>
                  #{monthlyRank}
                </div>
                <div className='text-xs text-indigo-600'>Xếp hạng tháng</div>
              </div>
            )}
          </div>
        )}

        {/* Next Milestone Progress */}
        {nextMilestone && (
          <div className='space-y-2'>
            <div className='flex justify-between items-center text-sm'>
              <span className='text-muted-foreground'>
                Milestone tiếp theo:
              </span>
              <span className='font-medium'>{nextMilestone.title}</span>
            </div>

            <Progress value={progressToNext} className='h-2' />

            <div className='flex justify-between text-xs text-muted-foreground'>
              <span>
                {points.toLocaleString('vi-VN')} /{' '}
                {nextMilestone.points.toLocaleString('vi-VN')}
              </span>
              <span>
                {(nextMilestone.points - points).toLocaleString('vi-VN')} điểm
                nữa
              </span>
            </div>

            <div className='bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-3'>
              <div className='flex items-center gap-2'>
                <GiftIcon className='h-4 w-4 text-yellow-600' />
                <span className='text-sm text-yellow-800'>
                  <strong>Phần thưởng:</strong> {nextMilestone.reward}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Real-time SPA Changes */}
        <div className='space-y-2'>
          <div className='flex items-center justify-between'>
            <h4 className='text-sm font-medium flex items-center gap-2'>
              <History className='h-4 w-4' />
              Biến động{' '}
              {!isLoading && `(${recentTransactions.slice(0, 5).length})`}
            </h4>
            {recentTransactions.length > 0 && (
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setShowHistory(!showHistory)}
                className='text-xs'
              >
                {showHistory ? 'Ẩn' : 'Xem tất cả'}
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className='space-y-2'>
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className='flex items-center gap-2 p-2 bg-gray-100 rounded animate-pulse'
                >
                  <div className='w-6 h-6 bg-gray-200 rounded'></div>
                  <div className='flex-1 h-4 bg-gray-200 rounded'></div>
                  <div className='w-12 h-4 bg-gray-200 rounded'></div>
                </div>
              ))}
            </div>
          ) : recentTransactions.length > 0 ? (
            <div className='space-y-1'>
              {recentTransactions
                .slice(0, showHistory ? 5 : 3)
                .map(transaction => (
                  <div
                    key={transaction.id}
                    className='flex items-center justify-between text-xs p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors'
                  >
                    <div className='flex items-center gap-2 flex-1 min-w-0'>
                      <div className='flex-shrink-0'>
                        {getTransactionIcon(transaction.source_type)}
                      </div>
                      <div className='flex-1 min-w-0'>
                        <p className='font-medium truncate'>
                          {transaction.description}
                        </p>
                        <div className='flex items-center gap-2 text-xs text-gray-500'>
                          <span>
                            {getTransactionTypeName(transaction.source_type)}
                          </span>
                          <span>•</span>
                          <div className='flex items-center gap-1'>
                            <Calendar className='h-3 w-3' />
                            <span>
                              {formatRelativeTime(transaction.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div
                      className={`font-bold text-sm ${transaction.points_earned >= 0 ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {transaction.points_earned >= 0 ? '+' : ''}
                      {transaction.points_earned}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className='text-center py-4 text-gray-500'>
              <History className='h-8 w-8 mx-auto mb-2 opacity-50' />
              <p className='text-xs'>Chưa có giao dịch SPA nào</p>
              <p className='text-xs'>
                Tham gia thách đấu để bắt đầu kiếm điểm!
              </p>
            </div>
          )}
        </div>

        {/* SPA Earning Tips */}
        <div className='bg-blue-50 border border-blue-200 rounded-lg p-3'>
          <p className='text-sm text-blue-800'>
            <strong>Mẹo kiếm SPA:</strong> Thách đấu hàng ngày (+50), chuỗi
            thắng (+25/trận), comeback (+100), tham gia giải đấu (tùy hạng)
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
