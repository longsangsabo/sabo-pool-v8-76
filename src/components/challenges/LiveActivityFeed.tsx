import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import SectionHeader from './SectionHeader';
import LiveMatchCard from './LiveMatchCard';
import UpcomingMatchCard from './UpcomingMatchCard';
import RecentResultCard from './RecentResultCard';
import { CompletedChallengeCard } from './CompletedChallengeCard';
import UnifiedChallengeCard from './UnifiedChallengeCard';
import { useOptimizedMatches } from '@/hooks/useOptimizedMatches';
import { useCompletedChallenges } from '@/hooks/useCompletedChallenges';
import { toast } from 'sonner';

interface LiveActivityFeedProps {
  openChallenges: any[];
  onJoinChallenge: (challengeId: string) => void;
}


const LiveActivityFeed: React.FC<LiveActivityFeedProps> = ({ 
  openChallenges, 
  onJoinChallenge 
}) => {
  const { liveMatches, upcomingMatches, recentResults, loading, refreshAll } = useOptimizedMatches();
  const { data: completedChallenges = [], isLoading: completedLoading } = useCompletedChallenges();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Debug logging removed for production

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshAll();
      toast.success('Đã cập nhật dữ liệu mới nhất');
    } catch (error) {
      console.error('Error refreshing:', error);
      toast.error('Lỗi khi cập nhật dữ liệu');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleWatchMatch = (matchId: string) => {
    toast.info(`Đang mở trận đấu ${matchId}...`);
    // In production, navigate to match viewing page
  };

  const handleRemindMatch = (matchId: string) => {
    toast.success('Đã đặt nhắc nhở cho trận đấu');
    // In production, set up notification reminder
  };

  const handleViewResult = (resultId: string) => {
    toast.info(`Đang xem kết quả trận ${resultId}...`);
    // In production, navigate to match result details
  };

  // Show loading state for debugging
  if (loading) {
    return (
      <div className="space-y-8 my-8">
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              🔴 Hoạt động trực tiếp
            </h2>
          </div>
          <p className="text-muted-foreground text-sm mt-1">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 my-8 border-2 border-dashed border-primary/20 rounded-lg p-4">
      {/* Debug info header */}
      <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
        Debug: Live={liveMatches?.length || 0}, Upcoming={upcomingMatches?.length || 0}, Recent={recentResults?.length || 0}, Open={openChallenges?.length || 0}
      </div>
      
      {/* Feed Header */}
      <div className="flex items-center justify-between bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-6 shadow-lg">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            🔴 Hoạt động trực tiếp
          </h2>
          <p className="text-muted-foreground text-sm mt-1">Theo dõi các trận đấu và hoạt động đang diễn ra</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing || loading}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing || loading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* Top Row - Live and Upcoming Matches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Matches Section */}
        <div className="space-y-4">
          <SectionHeader
            icon="🔴"
            title="ĐANG DIỄN RA"
            count={liveMatches.length}
            subtitle="Các trận đấu đang thi đấu"
          />
          
          {liveMatches.length > 0 ? (
            <div className="grid gap-3">
              {liveMatches.map(match => (
                <LiveMatchCard
                  key={match.id}
                  match={match}
                  onWatch={handleWatchMatch}
                />
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-2 border-muted-foreground/20">
              <CardContent className="p-6 text-center">
                <div className="text-muted-foreground">
                  <div className="text-3xl mb-2">🎱</div>
                  <div className="font-medium text-sm">Không có trận đấu nào đang diễn ra</div>
                  <div className="text-xs">Các trận đấu live sẽ hiển thị ở đây</div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Upcoming Matches Section */}
        <div className="space-y-4">
          <SectionHeader
            icon="⏰"
            title="SẮP DIỄN RA"
            count={upcomingMatches.length}
            subtitle="Các trận đấu đã được lên lịch và thách đấu đã chấp nhận"
          />
          
          {upcomingMatches.length > 0 ? (
            <div className="grid gap-3">
              {upcomingMatches.map(match => (
                <UpcomingMatchCard
                  key={match.id}
                  match={match}
                  onRemind={handleRemindMatch}
                />
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-2 border-muted-foreground/20">
              <CardContent className="p-6 text-center">
                <div className="text-muted-foreground">
                  <div className="text-3xl mb-2">📅</div>
                  <div className="font-medium text-sm">Chưa có trận đấu nào được lên lịch</div>
                  <div className="text-xs">Các thách đấu đã chấp nhận và trận đấu sắp tới sẽ hiển thị ở đây</div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Bottom Row - Open Challenges and Recent Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Open Challenges Section */}
        <div className="space-y-4">
          <SectionHeader
            icon="👀"
            title="ĐANG TÌM ĐỐI THỦ"
            count={openChallenges.length}
            subtitle="Thách đấu mở đang chờ người tham gia"
          />
          
          {openChallenges.length > 0 ? (
            <div className="grid gap-3">
              {openChallenges.map(challenge => (
                <UnifiedChallengeCard
                  key={challenge.id}
                  challenge={{
                    ...challenge,
                    status: 'open' as const
                  }}
                  onJoin={async () => await onJoinChallenge(challenge.id)}
                  variant="compact"
                />
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-2 border-muted-foreground/20">
              <CardContent className="p-6 text-center">
                <div className="text-muted-foreground">
                  <div className="text-3xl mb-2">🎯</div>
                  <div className="font-medium text-sm">Hiện tại không có thách đấu mở nào</div>
                  <div className="text-xs">Tạo thách đấu mở để tìm đối thủ ngay!</div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Results Section - Using Real Completed Challenges */}
        <div className="space-y-4">
          <SectionHeader
            icon="✅"
            title="MỚI HOÀN THÀNH"
            count={completedChallenges.length}
            subtitle="Kết quả các trận đấu gần đây"
          />
          
          {completedLoading ? (
            <Card className="border-dashed border-2 border-muted-foreground/20">
              <CardContent className="p-6 text-center">
                <div className="text-muted-foreground">
                  <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                  <div className="font-medium text-sm">Đang tải kết quả...</div>
                </div>
              </CardContent>
            </Card>
          ) : completedChallenges.length > 0 ? (
            <div className="grid gap-3">
              {completedChallenges.map(challenge => (
                <CompletedChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  onView={() => handleViewResult(challenge.id)}
                />
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-2 border-muted-foreground/20">
              <CardContent className="p-6 text-center">
                <div className="text-muted-foreground">
                  <div className="text-3xl mb-2">🏆</div>
                  <div className="font-medium text-sm">Chưa có kết quả trận đấu nào gần đây</div>
                  <div className="text-xs">Kết quả các trận đấu hoàn thành sẽ hiển thị ở đây</div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveActivityFeed;