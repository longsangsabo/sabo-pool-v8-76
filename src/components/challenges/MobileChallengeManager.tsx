import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useChallenges } from '@/hooks/useChallenges';
import { toast } from 'sonner';
import { Calendar, Search, Trophy, Users, Zap } from 'lucide-react';
import OpenChallengeCard from './OpenChallengeCard';
import OngoingChallengeCard from './OngoingChallengeCard';
import UpcomingChallengeCard from './UpcomingChallengeCard';
import CompletedChallengeCard from './CompletedChallengeCard';

interface MobileChallengeManagerProps {
  className?: string;
}

const MobileChallengeManager: React.FC<MobileChallengeManagerProps> = ({ className }) => {
  const { user } = useAuth();
  const {
    challenges,
    receivedChallenges,
    sentChallenges,
    loading,
    error,
    acceptChallenge,
    declineChallenge
  } = useChallenges();

  // Convert challenge data to local format
  const convertToLocalChallenge = (c: any) => ({
    id: c.id,
    challenger_id: c.challenger_id,
    opponent_id: c.opponent_id,
    bet_points: c.bet_points || 0,
    race_to: c.race_to || 5,
    status: c.status,
    message: c.message || c.challenge_message,
    challenge_type: c.challenge_type,
    created_at: c.created_at,
    expires_at: c.expires_at,
    completed_at: c.completed_at,
    challenger_profile: c.challenger_profile,
    opponent_profile: c.opponent_profile,
    club: c.club || null,
  });

  // Debug: Check what challenges we have
  console.log('🔍 [MobileChallengeManager] Detailed analysis:', {
    totalChallenges: challenges.length,
    currentUser: user?.id?.slice(-8),
    challengeBreakdown: {
      pending: challenges.filter(c => c.status === 'pending').length,
      accepted: challenges.filter(c => c.status === 'accepted').length,
      completed: challenges.filter(c => c.status === 'completed').length,
      withOpponent: challenges.filter(c => c.opponent_id).length,
      openChallenges: challenges.filter(c => !c.opponent_id && c.status === 'pending').length,
      myOpenChallenges: challenges.filter(c => !c.opponent_id && c.status === 'pending' && c.challenger_id === user?.id).length,
      otherUserOpenChallenges: challenges.filter(c => !c.opponent_id && c.status === 'pending' && c.challenger_id !== user?.id).length
    },
    sampleChallenges: challenges.slice(0, 5).map(c => ({
      id: c.id.slice(-8),
      challenger_name: c.challenger_profile?.display_name || c.challenger_profile?.full_name || 'Unknown',
      challenger_id: c.challenger_id?.slice(-8),
      opponent_id: c.opponent_id?.slice(-8) || 'NULL',
      status: c.status,
      isOpen: !c.opponent_id,
      isMyChallenge: c.challenger_id === user?.id
    }))
  });

  // Filter open challenges from other users
  const openChallenges = challenges.filter(c => {
    const isOpen = !c.opponent_id && c.status === 'pending';
    const isNotMyChallenge = c.challenger_id !== user?.id;
    return isOpen && isNotMyChallenge;
  }).map(convertToLocalChallenge);

  console.log('✅ [MobileChallengeManager] Open challenges processing result:', {
    totalFiltered: openChallenges.length,
    challenges: openChallenges.map(c => ({
      id: c.id?.slice(-8),
      challenger: c.challenger_profile?.display_name || c.challenger_profile?.full_name,
      betPoints: c.bet_points,
      raceTo: c.race_to,
      status: c.status,
      hasProfile: !!c.challenger_profile
    })),
    rawOpenCount: challenges.filter(c => !c.opponent_id && c.status === 'pending' && c.challenger_id !== user?.id).length
  });

  // Get user's own open challenges
  const myOpenChallenges = challenges.filter(c => 
    !c.opponent_id && 
    c.status === 'pending' && 
    c.challenger_id === user?.id
  ).map(convertToLocalChallenge);

  // Get ongoing challenges (accepted status)
  const ongoingChallenges = challenges.filter(c => 
    c.status === 'accepted' &&
    (c.challenger_id === user?.id || c.opponent_id === user?.id)
  ).map(convertToLocalChallenge);

  // Get upcoming challenges (pending with specific opponent)
  const upcomingChallenges = challenges.filter(c => 
    c.status === 'pending' && 
    c.opponent_id &&
    (c.challenger_id === user?.id || c.opponent_id === user?.id)
  ).map(convertToLocalChallenge);

  // Get completed challenges (recent)
  const completedChallenges = challenges.filter(c => 
    c.status === 'completed' &&
    (c.challenger_id === user?.id || c.opponent_id === user?.id)
  ).map(convertToLocalChallenge);

  console.log('📊 [MobileChallengeManager] Tab data breakdown:', {
    ongoingCount: ongoingChallenges.length,
    upcomingCount: upcomingChallenges.length,
    openChallengesCount: openChallenges.length,
    completedCount: completedChallenges.length,
    myOpenCount: myOpenChallenges.length
  });

  const [activeTab, setActiveTab] = useState('live');

  const joinOpenChallenge = async (challengeId: string) => {
    try {
      await acceptChallenge(challengeId);
      toast.success('Đã tham gia thách đấu thành công!');
    } catch (error) {
      console.error('Error joining challenge:', error);
      toast.error('Lỗi khi tham gia thách đấu');
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'live':
        return (
          <div className="space-y-4">
            <div className="text-center py-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">ĐANG DIỄN RA</h3>
              <p className="text-sm text-gray-600">Các thách đấu đã được chấp nhận và đang diễn ra</p>
            </div>
            {ongoingChallenges.length > 0 ? (
              ongoingChallenges.map(challenge => (
                <OngoingChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  variant="compact"
                />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Không có thách đấu nào đang diễn ra</p>
              </div>
            )}
          </div>
        );

      case 'upcoming':
        return (
          <div className="space-y-4">
            <div className="text-center py-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">SẮP DIỄN RA</h3>
              <p className="text-sm text-gray-600">Thách đấu đã được lên lịch với đối thủ cụ thể</p>
            </div>
            {upcomingChallenges.length > 0 ? (
              upcomingChallenges.map(challenge => (
                <UpcomingChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  variant="compact"
                />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Không có thách đấu nào sắp diễn ra</p>
              </div>
            )}
          </div>
        );

      case 'find':
        return (
          <div className="space-y-4">
            <div className="text-center py-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">ĐANG TÌM ĐỐI THỦ</h3>
              <p className="text-sm text-gray-600">Tất cả thách đấu mở của người chơi khác</p>
            </div>
            {openChallenges.length > 0 ? (
              openChallenges.map(challenge => (
                <OpenChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  onJoin={joinOpenChallenge}
                  variant="compact"
                />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Không có thách đấu mở nào</p>
              </div>
            )}
          </div>
        );

      case 'completed':
        return (
          <div className="space-y-4">
            <div className="text-center py-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">MỚI HOÀN THÀNH</h3>
              <p className="text-sm text-gray-600">Các thách đấu vừa kết thúc gần đây</p>
            </div>
            {completedChallenges.length > 0 ? (
              completedChallenges.map(challenge => (
                <CompletedChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  variant="compact"
                />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Chưa có thách đấu nào hoàn thành</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thách đấu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600">
        <p>Lỗi: {error}</p>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="live" className="flex flex-col gap-1 p-3">
              <Zap className="w-4 h-4" />
              <span className="text-xs">Đang diễn ra</span>
              {ongoingChallenges.length > 0 && (
                <Badge variant="destructive" className="text-xs px-1">
                  {ongoingChallenges.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="flex flex-col gap-1 p-3">
              <Calendar className="w-4 h-4" />
              <span className="text-xs">Sắp diễn ra</span>
              {upcomingChallenges.length > 0 && (
                <Badge variant="secondary" className="text-xs px-1">
                  {upcomingChallenges.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="find" className="flex flex-col gap-1 p-3">
              <Search className="w-4 h-4" />
              <span className="text-xs">Đang tìm đối thủ</span>
              {openChallenges.length > 0 && (
                <Badge className="text-xs px-1 bg-emerald-100 text-emerald-800">
                  {openChallenges.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex flex-col gap-1 p-3">
              <Trophy className="w-4 h-4" />
              <span className="text-xs">Mới hoàn thành</span>
              {completedChallenges.length > 0 && (
                <Badge variant="outline" className="text-xs px-1">
                  {completedChallenges.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="live" className="mt-0">
            {renderTabContent()}
          </TabsContent>
          
          <TabsContent value="upcoming" className="mt-0">
            {renderTabContent()}
          </TabsContent>

          <TabsContent value="find" className="mt-0">
            {renderTabContent()}
          </TabsContent>

          <TabsContent value="completed" className="mt-0">
            {renderTabContent()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MobileChallengeManager;