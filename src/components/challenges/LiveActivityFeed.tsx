import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import SectionHeader from './SectionHeader';
import LiveMatchCard from './LiveMatchCard';
import UpcomingMatchCard from './UpcomingMatchCard';
import RecentResultCard from './RecentResultCard';
import OpenChallengeCard from './OpenChallengeCard';
import { useOptimizedMatches } from '@/hooks/useOptimizedMatches';
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
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshAll();
    setIsRefreshing(false);
    toast.success('Đã cập nhật dữ liệu mới nhất');
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

  return (
    <div className="space-y-8 my-8">
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
            subtitle="Các trận đấu đã được lên lịch"
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
                  <div className="text-xs">Các trận đấu sắp tới sẽ hiển thị ở đây</div>
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
                <OpenChallengeCard
                  key={challenge.id}
                  challenge={challenge}
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

        {/* Recent Results Section */}
        <div className="space-y-4">
          <SectionHeader
            icon="✅"
            title="MỚI HOÀN THÀNH"
            count={recentResults.length}
            subtitle="Kết quả các trận đấu gần đây"
          />
          
          {recentResults.length > 0 ? (
            <div className="grid gap-3">
              {recentResults.map(result => (
                <RecentResultCard
                  key={result.id}
                  result={result}
                  onView={handleViewResult}
                />
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-2 border-muted-foreground/20">
              <CardContent className="p-6 text-center">
                <div className="text-muted-foreground">
                  <div className="text-3xl mb-2">🏆</div>
                  <div className="font-medium text-sm">Chưa có kết quả trận đấu nào gần đây</div>
                  <div className="text-xs">Kết quả các trận đấu sẽ hiển thị ở đây</div>
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