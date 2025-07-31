import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useChallenges } from '@/hooks/useChallenges';
import { toast } from 'sonner';
import { Calendar, Search, Trophy, Users, Zap, RefreshCw } from 'lucide-react';
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
    declineChallenge,
    fetchChallenges
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

  // Enhanced debug: Check what challenges we have with profile details
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
      id: c.id?.slice(-8) || 'NO_ID',
      challenger_name: c.challenger_profile?.display_name || c.challenger_profile?.full_name || 'Unknown',
      challenger_id: c.challenger_id?.slice(-8) || 'NO_CHALLENGER',
      opponent_id: c.opponent_id?.slice(-8) || 'NULL',
      status: c.status,
      isOpen: !c.opponent_id,
      isMyChallenge: c.challenger_id === user?.id,
      hasProfile: !!c.challenger_profile,
      profileData: c.challenger_profile ? {
        name: c.challenger_profile.full_name,
        display: c.challenger_profile.display_name,
        rank: c.challenger_profile.verified_rank || c.challenger_profile.current_rank
      } : null
    }))
  });

  // Filter open challenges from other users with enhanced logging
  const openChallenges = challenges.filter(c => {
    const isOpen = !c.opponent_id && c.status === 'pending';
    const isNotMyChallenge = c.challenger_id !== user?.id;
    const shouldShow = isOpen && isNotMyChallenge;
    
    if (isOpen && !isNotMyChallenge) {
      console.log('🔍 Filtering out my own challenge:', {
        id: c.id?.slice(-8),
        challenger: c.challenger_profile?.display_name || c.challenger_profile?.full_name,
        isMyChallenge: c.challenger_id === user?.id
      });
    }
    
    return shouldShow;
  }).map(convertToLocalChallenge);

  console.log('✅ [MobileChallengeManager] Open challenges processing result:', {
    totalFiltered: openChallenges.length,
    allOpenChallenges: challenges.filter(c => !c.opponent_id && c.status === 'pending').length,
    myOpenChallenges: challenges.filter(c => !c.opponent_id && c.status === 'pending' && c.challenger_id === user?.id).length,
    othersOpenChallenges: challenges.filter(c => !c.opponent_id && c.status === 'pending' && c.challenger_id !== user?.id).length,
    challenges: openChallenges.map(c => ({
      id: c.id?.slice(-8),
      challenger: c.challenger_profile?.display_name || c.challenger_profile?.full_name,
      betPoints: c.bet_points,
      raceTo: c.race_to,
      status: c.status,
      hasProfile: !!c.challenger_profile,
      profileComplete: c.challenger_profile ? {
        hasName: !!(c.challenger_profile.full_name || c.challenger_profile.display_name),
        hasAvatar: !!c.challenger_profile.avatar_url,
        hasRank: !!(c.challenger_profile.verified_rank || c.challenger_profile.current_rank)
      } : false
    }))
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

  const [activeTab, setActiveTab] = useState('find'); // Start with "find" tab to see open challenges
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchChallenges();
      toast.success('Đã làm mới dữ liệu thách đấu');
    } catch (error) {
      toast.error('Lỗi khi làm mới dữ liệu');
    } finally {
      setIsRefreshing(false);
    }
  };

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
              openChallenges.map(challenge => {
                console.log('🎯 Rendering open challenge:', {
                  id: challenge.id?.slice(-8),
                  challenger: challenge.challenger_profile?.display_name || challenge.challenger_profile?.full_name,
                  hasProfile: !!challenge.challenger_profile
                });
                return (
                  <OpenChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    onJoin={joinOpenChallenge}
                    variant="compact"
                  />
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Không có thách đấu mở nào</p>
                <p className="text-xs mt-2">Debug: Total challenges: {challenges.length}</p>
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
        {/* Header with refresh button */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Thách Đấu</h2>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || loading}
            className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>
        
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