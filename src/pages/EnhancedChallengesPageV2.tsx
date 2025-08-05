import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useResponsive } from '@/hooks/useResponsive';
import { useOptimizedChallenges } from '@/hooks/useOptimizedChallenges';
import { useState as useStateForMatches } from 'react';
import UnifiedCreateChallengeModal from '@/components/modals/UnifiedCreateChallengeModal';
import UnifiedChallengeCard from '@/components/challenges/UnifiedChallengeCard';
import ChallengeDetailsModal from '@/components/ChallengeDetailsModal';
import CreateChallengeButton from '@/components/CreateChallengeButton';

import TrustScoreBadge from '@/components/TrustScoreBadge';
import CompactStatCard from '@/components/challenges/CompactStatCard';
import LiveActivityFeed from '@/components/challenges/LiveActivityFeed';

import MobileChallengeManager from '@/components/challenges/MobileChallengeManager';
import { ChallengeDebugPanel } from '@/components/ChallengeDebugPanel';

import { ActiveChallengeHighlight } from '@/components/challenges/ActiveChallengeHighlight';
import ErrorBoundary from '@/components/ErrorBoundary';

import { toast } from 'sonner';
import {
  Plus,
  Search,
  Trophy,
  Target,
  Users,
  Zap,
  Clock,
  MapPin,
  DollarSign,
  Calendar,
  Bell,
  MessageSquare,
  Star,
  ArrowUp,
  ArrowDown,
  Shield,
  Sword,
} from 'lucide-react';

interface ChallengeStats {
  total: number;
  pending: number;
  accepted: number;
  completed: number;
  won: number;
  lost: number;
  winRate: number;
}

const EnhancedChallengesPageV2: React.FC = () => {
  const { user } = useAuth();
  const { isDesktop, isMobile, width } = useResponsive();

  // Use the optimized hook to prevent multiple fetches
  const {
    challenges,
    loading,
    error,
    acceptChallenge,
    declineChallenge,
    fetchChallenges,
    submitScore,
    isSubmittingScore,
  } = useOptimizedChallenges();

  // Hook để lấy matches từ challenges đã được accept
  const [matchesData, setMatchesData] = useStateForMatches<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [activeTab, setActiveTab] = useState('my-challenges');
  const [challengeTypeFilter, setChallengeTypeFilter] = useState<
    'all' | 'standard' | 'sabo'
  >('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(true);
  const [showAdminCreateModal, setShowAdminCreateModal] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Filter challenges by user involvement
  const myChallenges = challenges.filter(
    c => c.challenger_id === user?.id || c.opponent_id === user?.id
  );

  // ✅ FIXED: Active challenges = all accepted challenges (ready to play/enter scores)
  const activeChallenges = challenges.filter(c => {
    // Must be accepted status
    if (c.status !== 'accepted') return false;

    // Must involve current user
    const isMyChallenge =
      c.challenger_id === user?.id || c.opponent_id === user?.id;
    return isMyChallenge;
  });
  const myMatches = myChallenges.filter(
    c => c.status === 'accepted' || c.status === 'completed'
  );
  const openChallenges = challenges.filter(
    c => c.status === 'pending' && !c.opponent_id
  );

  // Handle score submission
  const handleSubmitScore = async (
    challengeId: string,
    challengerScore: number,
    opponentScore: number
  ) => {
    try {
      // Use the existing submitScore function from the hook
      await submitScore(challengeId, challengerScore, opponentScore);

      // Close the modal
      setShowDetailsModal(false);
      setSelectedChallenge(null);

      toast.success('Tỷ số đã được ghi nhận thành công!');
    } catch (error) {
      console.error('Error submitting score:', error);
      toast.error('Không thể ghi tỷ số. Vui lòng thử lại.');
    }
  };

  // Handle card actions
  const handleChallengeAction = (
    challengeId: string,
    action: 'accept' | 'decline' | 'cancel' | 'view' | 'score'
  ) => {
    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge) return;

    if (action === 'view' || action === 'score') {
      setSelectedChallenge(challenge);
      setShowDetailsModal(true);
    }
    // Other actions would be handled by individual components
  };

  // Calculate stats from derived data
  const stats: ChallengeStats = {
    total: myChallenges.length,
    pending: myChallenges.filter(c => c.status === 'pending').length,
    accepted: myChallenges.filter(c => c.status === 'accepted').length,
    completed: myChallenges.filter(c => c.status === 'completed').length,
    won: 0, // This would come from match results
    lost: 0,
    winRate: 0,
  };

  const checkAdminStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setIsAdmin(data?.is_admin || false);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  // Fetch matches for accepted challenges
  const fetchMatches = async () => {
    if (!user) return;

    setLoadingMatches(true);
    try {
      // Simple query without joins to avoid foreign key issues
      const { data: matches, error } = await supabase
        .from('matches')
        .select('*')
        .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching matches:', error);
        throw error;
      }

      setMatchesData(matches || []);
    } catch (error) {
      console.error('Error fetching matches:', error);
      toast.error('Lỗi tải danh sách trận đấu');
    } finally {
      setLoadingMatches(false);
    }
  };

  // Load matches when component mounts or user changes
  useEffect(() => {
    fetchMatches();
  }, [user]);

  // Function to get match for a challenge
  const getMatchForChallenge = (challengeId: string) => {
    return matchesData.find(match => match.challenge_id === challengeId);
  };

  // Function to update match status
  const handleAcceptMatch = async (matchId: string) => {
    try {
      // Find the match to get challenge_id
      const match = matchesData.find(m => m.id === matchId);
      if (!match) {
        toast.error('Không tìm thấy trận đấu');
        return;
      }

      // Update match status
      const { error: matchError } = await supabase
        .from('matches')
        .update({ status: 'in_progress' })
        .eq('id', matchId);

      if (matchError) throw matchError;

      // If challenge has null scheduled_time, update it to now
      if (match.challenge_id) {
        const challenge = challenges.find(c => c.id === match.challenge_id);
        if (challenge && !challenge.scheduled_time) {
          const { error: challengeError } = await supabase
            .from('challenges')
            .update({ status: 'ongoing' })
            .eq('id', challenge.id);

          if (challengeError)
            console.error(
              'Error updating challenge scheduled_time:',
              challengeError
            );
        }
      }

      toast.success('Đã xác nhận trận đấu!');
      fetchMatches(); // Refresh matches
      fetchChallenges?.(); // Refresh challenges too
    } catch (error) {
      console.error('Error accepting match:', error);
      toast.error('Có lỗi xảy ra khi xác nhận trận đấu');
    }
  };

  const getFilteredChallenges = (
    challengeList: any[],
    skipStatusFilter = false
  ) => {
    const filtered = challengeList.filter(challenge => {
      // Search filter
      const matchesSearch =
        !searchTerm ||
        (() => {
          const challengerName =
            challenge.challenger_profile?.full_name?.toLowerCase() || '';
          const opponentName =
            challenge.opponent_profile?.full_name?.toLowerCase() || '';
          const clubName =
            challenge.club_profiles?.club_name?.toLowerCase() || '';

          return (
            challengerName.includes(searchTerm.toLowerCase()) ||
            opponentName.includes(searchTerm.toLowerCase()) ||
            clubName.includes(searchTerm.toLowerCase())
          );
        })();

      // Status filter - skip for active challenges tab
      const matchesStatus =
        skipStatusFilter ||
        statusFilter === 'all' ||
        challenge.status === statusFilter;

      // Challenge type filter - FIXED LOGIC for null/undefined challenge_type
      const matchesType =
        challengeTypeFilter === 'all' ||
        (challengeTypeFilter === 'sabo' &&
          challenge.challenge_type === 'sabo') ||
        (challengeTypeFilter === 'standard' &&
          (challenge.challenge_type === 'standard' ||
            challenge.challenge_type === null ||
            challenge.challenge_type === undefined));

      const result = matchesSearch && matchesStatus && matchesType;
      return result;
    });

    return filtered;
  };

  const handleJoinOpenChallenge = async (challengeId: string) => {
    if (!user) return;

    try {
      // Show loading state
      toast.loading('Đang tham gia thách đấu...', { id: 'join-challenge' });

      const result = await acceptChallenge(challengeId);

      // Update toast to success
      toast.success('✅ Đã tham gia thành công! Status: accepted', {
        id: 'join-challenge',
      });

      // Refresh data immediately for real-time feedback
      await fetchChallenges?.();
      fetchMatches(); // Also refresh matches to show new match
    } catch (error) {
      console.error('❌ Error joining open challenge:', error);
      toast.error('Lỗi khi tham gia thách đấu', { id: 'join-challenge' });
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          text: 'Chờ phản hồi',
          color: 'bg-yellow-100 text-yellow-800',
          icon: Clock,
        };
      case 'accepted':
        return {
          text: 'Đã chấp nhận',
          color: 'bg-green-100 text-green-800',
          icon: Trophy,
        };
      case 'declined':
        return {
          text: 'Đã từ chối',
          color: 'bg-red-100 text-red-800',
          icon: Target,
        };
      case 'completed':
        return {
          text: 'Hoàn thành',
          color: 'bg-blue-100 text-blue-800',
          icon: Star,
        };
      default:
        return {
          text: status,
          color: 'bg-gray-100 text-gray-800',
          icon: Users,
        };
    }
  };

  const handleChallengeClick = (challenge: any) => {
    setSelectedChallenge(challenge);
    setShowDetailsModal(true);
  };

  const renderChallengeCard = (challenge: any) => {
    const isChallenger = user?.id === challenge.challenger_id;
    const canRespond = !isChallenger && challenge.status === 'pending';

    // Get associated match for this challenge
    const associatedMatch = getMatchForChallenge(challenge.id);
    const hasMatch = !!associatedMatch;
    const canAcceptMatch =
      hasMatch && associatedMatch.status === 'scheduled' && isChallenger;

    const handleAction = async (
      challengeId: string,
      action: 'accept' | 'decline' | 'cancel' | 'view'
    ) => {
      switch (action) {
        case 'accept':
          await acceptChallenge(challengeId);
          break;
        case 'decline':
          await declineChallenge(challengeId);
          break;
        case 'view':
        default:
          handleChallengeClick(challenge);
          break;
      }
    };

    // Convert status to UnifiedChallengeCard format
    const getUnifiedStatus = (status: string) => {
      switch (status) {
        case 'pending':
          return challenge.opponent_id ? 'pending' : 'open';
        case 'accepted':
          return 'ongoing';
        case 'completed':
          return 'completed';
        default:
          return 'pending';
      }
    };

    return (
      <div key={challenge.id} onClick={() => handleChallengeClick(challenge)}>
        <UnifiedChallengeCard
          challenge={{
            ...challenge,
            status: getUnifiedStatus(challenge.status),
          }}
          onJoin={
            challenge.status === 'pending' && !challenge.opponent_id
              ? handleJoinOpenChallenge
              : undefined
          }
          onAction={handleAction}
        />

        {/* Additional match action button for accepted challenges */}
        {canAcceptMatch && (
          <div className='mt-2'>
            <Button
              size='sm'
              onClick={e => {
                e.stopPropagation();
                handleAcceptMatch(associatedMatch.id);
              }}
              className='w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'
            >
              Xác nhận trận đấu
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderOpenChallengeCard = (challenge: any) => {
    return (
      <UnifiedChallengeCard
        key={challenge.id}
        challenge={{
          ...challenge,
          status: 'open',
        }}
        onJoin={handleJoinOpenChallenge}
      />
    );
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center'>
        <div className='text-center space-y-4'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto'></div>
          <p className='text-muted-foreground'>Đang tải thách đấu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center'>
        <div className='text-center space-y-4'>
          <div className='text-red-500'>❌ Lỗi tải dữ liệu</div>
          <p className='text-muted-foreground'>{error}</p>
          <Button onClick={() => window.location.reload()}>Thử lại</Button>
        </div>
      </div>
    );
  }

  // Desktop Layout Component
  const DesktopLayout = () => (
    <div className='min-h-screen bg-background'>
      {/* Desktop Container - Optimized for wider screens */}
      <div className='challenges-desktop max-w-[1400px] mx-auto px-8 py-6 space-y-8'>
        {/* Premium Header Section */}
        <div className='flex items-center justify-between'>
          <div className='space-y-2'>
            <h1 className='text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent'>
              Thách đấu
            </h1>
            <p className='text-lg text-muted-foreground'>
              Quản lý và tham gia các thách đấu billiards chuyên nghiệp
            </p>
          </div>
          <div className='flex gap-3'>
            <CreateChallengeButton
              onCreateClick={() => setShowCreateModal(true)}
            />
            {isAdmin && (
              <Button
                onClick={() => setShowAdminCreateModal(true)}
                variant='outline'
                className='border-red-200 text-red-600 hover:bg-red-50 shadow-sm'
              >
                <Shield className='w-4 h-4 mr-2' />
                Admin: Tạo thách đấu
              </Button>
            )}
          </div>
        </div>

        {/* Compact Statistics Row - Professional Design */}
        <div className='grid grid-cols-4 gap-6 mb-8'>
          <CompactStatCard
            icon={Trophy}
            value={stats.total}
            label='Tổng cộng'
            color='primary'
          />
          <CompactStatCard
            icon={Clock}
            value={stats.pending}
            label='Chờ phản hồi'
            color='warning'
          />
          <CompactStatCard
            icon={Zap}
            value={stats.accepted}
            label='Đã chấp nhận'
            color='success'
          />
          <CompactStatCard
            icon={Star}
            value={stats.completed}
            label='Hoàn thành'
            color='info'
          />
        </div>

        {/* Fixed Active Challenge Section - Always visible */}
        <div className='w-full mb-6'>
          <ErrorBoundary
            fallback={
              <div className='p-4 bg-red-50 border border-red-200 rounded'>
                ActiveChallengeHighlight error
              </div>
            }
          >
            <ActiveChallengeHighlight
              challenges={challenges || []}
              user={user}
              onChallengeClick={handleChallengeClick}
            />
          </ErrorBoundary>
        </div>

        {/* Live Activity Feed - Main Content Area */}
        <div className='w-full'>
          <LiveActivityFeed
            openChallenges={openChallenges}
            onJoinChallenge={handleJoinOpenChallenge}
            challenges={challenges}
            user={user}
            onChallengeClick={handleChallengeClick}
          />
        </div>

        {/* Advanced Management Section - Desktop Optimized */}
        <Card className='bg-card/50 backdrop-blur-sm border border-border/50 shadow-lg'>
          <CardHeader className='pb-4'>
            <CardTitle className='flex items-center gap-3 text-xl'>
              <Target className='w-6 h-6' />
              Quản lý thách đấu nâng cao
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            {/* Desktop-Optimized Filters */}
            <div className='flex gap-4 items-center'>
              <div className='flex-1 max-w-md'>
                <div className='relative group'>
                  <Search className='w-4 h-4 absolute left-3 top-3.5 text-muted-foreground group-focus-within:text-primary transition-colors' />
                  <Input
                    placeholder='Tìm kiếm theo tên người chơi hoặc câu lạc bộ...'
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className='pl-10 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all duration-200'
                  />
                </div>
              </div>

              <div className='flex gap-3'>
                <Select
                  value={challengeTypeFilter}
                  onValueChange={(value: 'all' | 'standard' | 'sabo') =>
                    setChallengeTypeFilter(value)
                  }
                >
                  <SelectTrigger className='w-40 bg-background border-border/50'>
                    <SelectValue placeholder='Loại thách đấu' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>Tất cả</SelectItem>
                    <SelectItem value='standard'>Thường</SelectItem>
                    <SelectItem value='sabo'>
                      <div className='flex items-center gap-2'>
                        <Sword className='w-4 h-4' />
                        SABO
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className='w-40 border-border/50 hover:border-primary/30'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>Tất cả</SelectItem>
                    <SelectItem value='pending'>Chờ phản hồi</SelectItem>
                    <SelectItem value='accepted'>Đã chấp nhận</SelectItem>
                    <SelectItem value='declined'>Đã từ chối</SelectItem>
                    <SelectItem value='completed'>Hoàn thành</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className='w-32 border-border/50 hover:border-primary/30'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='created_at'>Ngày tạo</SelectItem>
                    <SelectItem value='bet_points'>Mức cược</SelectItem>
                    <SelectItem value='expires_at'>Hết hạn</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant='outline'
                  size='icon'
                  onClick={() =>
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                  }
                  className='border-border/50 hover:border-primary/30 hover:scale-105 transition-all duration-200'
                >
                  {sortOrder === 'asc' ? (
                    <ArrowUp className='w-4 h-4' />
                  ) : (
                    <ArrowDown className='w-4 h-4' />
                  )}
                </Button>
              </div>
            </div>

            {/* Enhanced Tabs for Desktop */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className='space-y-6'
            >
              <TabsList className='grid w-full grid-cols-4 bg-card/50 backdrop-blur-sm border border-border/50 p-1 rounded-lg shadow-sm h-12'>
                <TabsTrigger
                  value='my-challenges'
                  className='data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200 font-medium text-sm'
                >
                  Thách đấu của tôi (
                  {getFilteredChallenges(myChallenges).length})
                </TabsTrigger>
                <TabsTrigger
                  value='my-matches'
                  className='data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200 font-medium text-sm'
                >
                  📊 Trận đấu của tôi ({getFilteredChallenges(myMatches).length}
                  )
                </TabsTrigger>
                <TabsTrigger
                  value='active-challenges'
                  className='data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200 font-medium text-sm'
                >
                  Đang diễn ra (
                  {getFilteredChallenges(activeChallenges, true).length})
                </TabsTrigger>
                <TabsTrigger
                  value='open-challenges'
                  className='data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200 font-medium text-sm'
                >
                  Thách đấu mở ({getFilteredChallenges(openChallenges).length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value='my-challenges' className='space-y-6'>
                {getFilteredChallenges(myChallenges).length > 0 ? (
                  <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'>
                    {getFilteredChallenges(myChallenges).map(
                      renderChallengeCard
                    )}
                  </div>
                ) : (
                  <Card className='bg-gradient-to-br from-slate-50/50 to-gray-50/50 border border-border/50'>
                    <CardContent className='p-16 text-center'>
                      <div className='p-4 rounded-full bg-gradient-to-br from-primary/10 to-primary/20 w-fit mx-auto mb-6'>
                        <Target className='w-16 h-16 text-primary mx-auto' />
                      </div>
                      <h3 className='text-xl font-semibold text-foreground mb-3'>
                        Chưa có thách đấu nào
                      </h3>
                      <p className='text-muted-foreground mb-6 max-w-md mx-auto'>
                        Tạo thách đấu đầu tiên của bạn để bắt đầu cuộc phiêu lưu
                        billiards!
                      </p>
                      <Button
                        onClick={() => setShowCreateModal(true)}
                        className='bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105'
                      >
                        <Plus className='w-4 h-4 mr-2' />
                        🎯 Tạo thách đấu
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value='my-matches' className='space-y-6'>
                {getFilteredChallenges(myMatches).length > 0 ? (
                  <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'>
                    {getFilteredChallenges(myMatches).map(challenge => (
                      <UnifiedChallengeCard
                        key={challenge.id}
                        challenge={challenge}
                        variant='match'
                        currentUserId={user?.id || ''}
                        onSubmitScore={handleSubmitScore}
                        isSubmittingScore={isSubmittingScore}
                        onAction={handleChallengeAction}
                      />
                    ))}
                  </div>
                ) : (
                  <Card className='bg-gradient-to-br from-blue-50/50 to-indigo-50/50 border border-blue-200/30'>
                    <CardContent className='p-16 text-center'>
                      <div className='p-4 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 w-fit mx-auto mb-6'>
                        <Trophy className='w-16 h-16 text-blue-600 mx-auto' />
                      </div>
                      <h3 className='text-xl font-semibold text-foreground mb-3'>
                        Chưa có trận đấu nào
                      </h3>
                      <p className='text-muted-foreground max-w-md mx-auto'>
                        Khi bạn chấp nhận thách đấu, trận đấu sẽ hiển thị ở đây
                        để bạn có thể nhập tỷ số.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value='active-challenges' className='space-y-6'>
                <div className='text-xs text-muted-foreground mb-2 bg-muted/30 p-2 rounded'>
                  Debug: activeChallenges count={activeChallenges.length},
                  filtered=
                  {getFilteredChallenges(activeChallenges, true).length}
                  <br />
                  Active challenges:{' '}
                  {JSON.stringify(
                    activeChallenges.map(c => ({
                      id: c.id,
                      status: c.status,
                      challenger: c.challenger_id,
                      opponent: c.opponent_id,
                    }))
                  )}
                </div>
                {getFilteredChallenges(activeChallenges, true).length > 0 ? (
                  <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'>
                    {getFilteredChallenges(activeChallenges, true).map(
                      challenge => (
                        <UnifiedChallengeCard
                          key={challenge.id}
                          challenge={challenge}
                          variant='match'
                          currentUserId={user?.id || ''}
                          onSubmitScore={handleSubmitScore}
                          isSubmittingScore={isSubmittingScore}
                          onAction={handleChallengeAction}
                        />
                      )
                    )}
                  </div>
                ) : (
                  <Card className='bg-gradient-to-br from-amber-50/50 to-orange-50/50 border border-amber-200/30'>
                    <CardContent className='p-16 text-center'>
                      <div className='p-4 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 w-fit mx-auto mb-6'>
                        <Zap className='w-16 h-16 text-amber-600 mx-auto' />
                      </div>
                      <h3 className='text-xl font-semibold text-foreground mb-3'>
                        Không có trận đấu nào đang diễn ra
                      </h3>
                      <p className='text-muted-foreground max-w-md mx-auto'>
                        Các trận đấu đã được chấp nhận sẽ hiển thị ở đây. Hãy
                        chấp nhận một thách đấu để bắt đầu!
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value='open-challenges' className='space-y-6'>
                {getFilteredChallenges(openChallenges).length > 0 ? (
                  <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'>
                    {getFilteredChallenges(openChallenges).map(
                      renderOpenChallengeCard
                    )}
                  </div>
                ) : (
                  <Card className='bg-gradient-to-br from-emerald-50/50 to-green-50/50 border border-emerald-200/30'>
                    <CardContent className='p-16 text-center'>
                      <div className='p-4 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 w-fit mx-auto mb-6'>
                        <Users className='w-16 h-16 text-emerald-600 mx-auto' />
                      </div>
                      <h3 className='text-xl font-semibold text-foreground mb-3'>
                        Không có thách đấu mở nào
                      </h3>
                      <p className='text-muted-foreground max-w-md mx-auto'>
                        Các thách đấu mở từ người chơi khác sẽ hiển thị ở đây.
                        Hãy kiểm tra lại sau!
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Mobile Layout Component - Enhanced with MobileChallengeManager
  const MobileLayout = () => (
    <div className='min-h-screen bg-background'>
      <div className='px-0 py-0'>
        <MobileChallengeManager className='h-screen' />
      </div>
    </div>
  );

  return (
    <ErrorBoundary>
      {/* Responsive Layout Rendering */}
      {isDesktop ? <DesktopLayout /> : <MobileLayout />}

      {/* Modals */}
      <UnifiedCreateChallengeModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onChallengeCreated={() => {
          setShowCreateModal(false);
          // Data will refresh automatically via the hook
        }}
        variant='standard'
      />

      <UnifiedCreateChallengeModal
        isOpen={showAdminCreateModal}
        onClose={() => setShowAdminCreateModal(false)}
        onChallengeCreated={() => {
          setShowAdminCreateModal(false);
          // Data will refresh automatically via the hook
        }}
        variant='admin'
      />

      <ChallengeDetailsModal
        challenge={selectedChallenge as any}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedChallenge(null);
        }}
        onUpdate={() => {
          // Data will refresh automatically via the hook
        }}
      />
    </ErrorBoundary>
  );
};

export default EnhancedChallengesPageV2;
