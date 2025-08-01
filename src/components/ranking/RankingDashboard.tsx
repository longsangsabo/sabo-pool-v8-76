import { usePlayerRanking } from '@/hooks/usePlayerRanking';
import { RankProgressBar } from './RankProgressBar';
import { SPAPointsTracker } from './SPAPointsTracker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, History, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { RankBadge } from './RankBadge';

interface RankingDashboardProps {
  playerId?: string;
}

export const RankingDashboard: React.FC<RankingDashboardProps> = ({
  playerId,
}) => {
  const {
    playerRanking,
    ranks,
    spaPointsLog,
    rankingHistory,
    loading,
    error,
    getPointsBreakdown,
    getRankProgress,
    getDailyChallengeCount,
    initializePlayerRanking,
    refetch,
  } = usePlayerRanking(playerId);

  if (loading) {
    return (
      <div className='space-y-6'>
        <Skeleton className='h-32 w-full' />
        <Skeleton className='h-64 w-full' />
        <Skeleton className='h-48 w-full' />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className='p-6 text-center'>
          <div className='text-red-500 mb-4'>
            <Info className='h-12 w-12 mx-auto mb-2' />
            <p className='font-medium'>Lỗi tải dữ liệu</p>
            <p className='text-sm text-muted-foreground'>{error}</p>
          </div>
          <Button onClick={refetch} variant='outline'>
            <RefreshCw className='h-4 w-4 mr-2' />
            Thử lại
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!playerRanking) {
    return (
      <Card>
        <CardContent className='p-6 text-center'>
          <div className='mb-4'>
            <Info className='h-12 w-12 mx-auto mb-2 text-muted-foreground' />
            <p className='font-medium'>Chưa có thông tin hạng</p>
            <p className='text-sm text-muted-foreground'>
              Bạn chưa có thông tin hạng trong hệ thống. Hãy khởi tạo để bắt
              đầu!
            </p>
          </div>
          <Button onClick={initializePlayerRanking}>
            Khởi tạo hệ thống hạng
          </Button>
        </CardContent>
      </Card>
    );
  }

  const rankProgress = getRankProgress();
  const pointsBreakdown = getPointsBreakdown();
  const dailyChallengeCount = getDailyChallengeCount();

  return (
    <div className='space-y-6'>
      {/* Header with refresh button */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold'>Hệ thống Hạng SPA</h2>
          <p className='text-muted-foreground'>
            Theo dõi tiến độ và thành tích của bạn
          </p>
        </div>
        <Button onClick={refetch} variant='outline' size='sm'>
          <RefreshCw className='h-4 w-4 mr-2' />
          Làm mới
        </Button>
      </div>

      {/* Current Rank Progress */}
      {rankProgress && (
        <RankProgressBar
          current={rankProgress.current}
          next={rankProgress.next}
          progress={rankProgress.progress}
          pointsToNext={rankProgress.pointsToNext}
          pointsNeeded={rankProgress.pointsNeeded}
        />
      )}

      {/* Stats Overview */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Card>
          <CardContent className='p-4'>
            <div className='text-center'>
              <div className='text-2xl font-bold text-blue-600'>
                {playerRanking.total_matches}
              </div>
              <p className='text-sm text-muted-foreground'>Tổng trận đấu</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='text-center'>
              <div className='text-2xl font-bold text-green-600'>
                {playerRanking.wins}
              </div>
              <p className='text-sm text-muted-foreground'>Trận thắng</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='text-center'>
              <div className='text-2xl font-bold text-purple-600'>
                {playerRanking.total_matches > 0
                  ? Math.round(
                      (playerRanking.wins / playerRanking.total_matches) * 100
                    )
                  : 0}
                %
              </div>
              <p className='text-sm text-muted-foreground'>Tỷ lệ thắng</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SPA Points Tracking */}
      <SPAPointsTracker
        totalPoints={playerRanking.spa_points}
        pointsBreakdown={pointsBreakdown}
        dailyChallengeCount={dailyChallengeCount}
        recentEntries={spaPointsLog}
      />

      {/* Ranking History */}
      {rankingHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <History className='h-5 w-5' />
              Lịch sử thăng hạng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {rankingHistory.slice(0, 5).map(history => (
                <div
                  key={history.id}
                  className='flex items-center justify-between p-4 rounded-lg border'
                >
                  <div className='flex items-center gap-4'>
                    <div className='flex items-center gap-2'>
                      {history.old_rank && (
                        <RankBadge rank={history.old_rank} size='sm' />
                      )}
                      <span className='text-muted-foreground'>→</span>
                      {history.new_rank && (
                        <RankBadge rank={history.new_rank} size='sm' />
                      )}
                    </div>
                    <div>
                      <p className='font-medium'>
                        Thăng hạng từ {history.old_rank?.name} lên{' '}
                        {history.new_rank?.name}
                      </p>
                      <p className='text-sm text-muted-foreground'>
                        {new Date(history.promotion_date).toLocaleDateString(
                          'vi-VN'
                        )}
                      </p>
                    </div>
                  </div>
                  <Badge variant='outline' className='text-green-600'>
                    Thăng hạng
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Season Info */}
      <Card>
        <CardContent className='p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='font-medium'>Mùa giải hiện tại</p>
              <p className='text-sm text-muted-foreground'>
                Bắt đầu từ{' '}
                {new Date(playerRanking.season_start).toLocaleDateString(
                  'vi-VN'
                )}
              </p>
            </div>
            {playerRanking.verified_at && (
              <Badge variant='outline' className='text-green-600'>
                Đã xác thực
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
