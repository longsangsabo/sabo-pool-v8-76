import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import SectionHeader from './SectionHeader';
import LiveMatchCard from './LiveMatchCard';
import UpcomingMatchCard from './UpcomingMatchCard';
import RecentResultCard from './RecentResultCard';
import OpenChallengeCard from './OpenChallengeCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface LiveActivityFeedProps {
  openChallenges: any[];
  onJoinChallenge: (challengeId: string) => void;
}

// Mock data for demo purposes - in production these would come from real-time subscriptions
const mockLiveMatches = [
  {
    id: '1',
    player1: { name: 'Nguyễn Văn A', avatar: '', rank: 'H+' },
    player2: { name: 'Trần Thị B', avatar: '', rank: 'G' },
    score: { player1: 8, player2: 6 },
    raceToTarget: 12,
    location: 'CLB Saigon Pool',
    startTime: new Date(Date.now() - 45 * 60000).toISOString(), // 45 minutes ago
    betPoints: 500
  }
];

const mockUpcomingMatches = [
  {
    id: '2',
    player1: { name: 'Lê Văn C', avatar: '', rank: 'F' },
    player2: { name: 'Phạm Thị D', avatar: '', rank: 'E+' },
    scheduledTime: new Date(Date.now() + 2 * 60 * 60000).toISOString(), // 2 hours from now
    raceToTarget: 16,
    location: 'CLB Billiards Pro',
    betPoints: 800
  }
];

const mockRecentResults = [
  {
    id: '3',
    player1: { name: 'Hoàng Văn E', avatar: '', rank: 'G+' },
    player2: { name: 'Vũ Thị F', avatar: '', rank: 'G' },
    finalScore: { player1: 14, player2: 11 },
    winner: 'player1' as const,
    raceToTarget: 14,
    completedAt: new Date(Date.now() - 30 * 60000).toISOString(), // 30 minutes ago
    duration: '1h 45m',
    location: 'CLB Champion',
    betPoints: 600,
    eloChanges: { player1: +25, player2: -15 }
  }
];

const LiveActivityFeed: React.FC<LiveActivityFeedProps> = ({ 
  openChallenges, 
  onJoinChallenge 
}) => {
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('Đã cập nhật dữ liệu mới nhất');
    }, 1000);
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
    <div className="space-y-8">
      {/* Feed Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
          Hoạt động trực tiếp
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
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
            count={mockLiveMatches.length}
            subtitle="Các trận đấu đang thi đấu"
          />
          
          {mockLiveMatches.length > 0 ? (
            <div className="grid gap-3">
              {mockLiveMatches.map(match => (
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
            count={mockUpcomingMatches.length}
            subtitle="Các trận đấu đã được lên lịch"
          />
          
          {mockUpcomingMatches.length > 0 ? (
            <div className="grid gap-3">
              {mockUpcomingMatches.map(match => (
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
                  onJoin={() => onJoinChallenge(challenge.id)}
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
            count={mockRecentResults.length}
            subtitle="Kết quả các trận đấu gần đây"
          />
          
          {mockRecentResults.length > 0 ? (
            <div className="grid gap-3">
              {mockRecentResults.map(result => (
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