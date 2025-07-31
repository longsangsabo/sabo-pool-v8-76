import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useChallenges } from '@/hooks/useChallenges';
import { useAuth } from '@/hooks/useAuth';
import { useRealMatches } from '@/hooks/useRealMatches';
import CreateChallengeModal from '@/components/CreateChallengeModal';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Trophy,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  Target,
  Star,
  DollarSign,
  MessageSquare,
  MapPin,
  Calendar,
  MoreVertical,
  ArrowRight,
  RefreshCw,
  Play,
  Bell,
  Eye,
  Zap
} from 'lucide-react';

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
    acceptChallenge,
    declineChallenge,
    cancelChallenge
  } = useChallenges();

  // Add live activity data
  const { liveMatches, upcomingMatches, recentResults, loading: activityLoading, refreshAll } = useRealMatches();

  const [activeTab, setActiveTab] = useState('activity');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get open challenges (challenges where opponent_id is null)
  const openChallenges = challenges.filter(c => 
    !c.opponent_id && 
    c.status === 'pending'
  );

  // Get user's own open challenges
  const userOpenChallenges = challenges.filter(c =>
    !c.opponent_id &&
    c.challenger_id === user?.id &&
    c.status === 'pending'
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'accepted':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'declined':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ phản hồi';
      case 'accepted': return 'Đã chấp nhận';
      case 'declined': return 'Đã từ chối';
      case 'completed': return 'Hoàn thành';
      default: return 'Không xác định';
    }
  };

  const handleAcceptChallenge = async (challengeId: string) => {
    try {
      await acceptChallenge(challengeId);
      toast.success('Đã chấp nhận thách đấu!');
    } catch (error) {
      toast.error('Lỗi khi chấp nhận thách đấu');
    }
  };

  const handleDeclineChallenge = async (challengeId: string) => {
    try {
      await declineChallenge(challengeId);
      toast.success('Đã từ chối thách đấu');
    } catch (error) {
      toast.error('Lỗi khi từ chối thách đấu');
    }
  };

  const handleJoinOpenChallenge = async (challengeId: string) => {
    try {
      await acceptChallenge(challengeId);
      toast.success('Đã tham gia thách đấu mở!');
    } catch (error) {
      toast.error('Lỗi khi tham gia thách đấu');
    }
  };

  const renderChallengeCard = (challenge: any, showActions = true) => {
    const isChallenger = challenge.challenger_id === user?.id;
    const canRespond = !isChallenger && challenge.status === 'pending';
    
    return (
      <Card key={challenge.id} className="mb-3 overflow-hidden border border-border/50">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={
                  isChallenger 
                    ? challenge.opponent_profile?.avatar_url 
                    : challenge.challenger_profile?.avatar_url
                } />
                <AvatarFallback>
                  {isChallenger 
                    ? challenge.opponent_profile?.full_name?.[0] || 'O'
                    : challenge.challenger_profile?.full_name?.[0] || 'C'
                  }
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold text-sm">
                  {isChallenger 
                    ? challenge.opponent_profile?.full_name || 'Đối thủ'
                    : challenge.challenger_profile?.full_name || 'Thách đấu'
                  }
                </p>
                <p className="text-xs text-muted-foreground">
                  {isChallenger 
                    ? challenge.opponent_profile?.verified_rank || 'K'
                    : challenge.challenger_profile?.verified_rank || 'K'
                  }
                </p>
              </div>
            </div>
            <Badge className={`${getStatusColor(challenge.status)} text-xs`}>
              {getStatusText(challenge.status)}
            </Badge>
          </div>

          {/* Bet amount */}
          <div className="flex items-center gap-2 mb-3 p-2 bg-amber-50 rounded-lg border border-amber-200">
            <DollarSign className="w-4 h-4 text-amber-600" />
            <span className="font-bold text-amber-800">{challenge.bet_points}</span>
            <span className="text-xs text-amber-600">SPA điểm</span>
            <ArrowRight className="w-3 h-3 text-amber-600 mx-1" />
            <span className="text-xs text-amber-600">Race to {challenge.race_to || 5}</span>
          </div>

          {/* Message */}
          {challenge.message && (
            <div className="mb-3 p-2 bg-secondary/30 rounded-lg border border-border/30">
              <div className="flex items-start gap-2">
                <MessageSquare className="w-3 h-3 mt-0.5 text-muted-foreground" />
                <p className="text-xs text-foreground/90 italic">"{challenge.message}"</p>
              </div>
            </div>
          )}

          {/* SPA Points & Rank Info */}
          <div className="flex items-center gap-2 mb-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
            <Star className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-blue-600">
              {isChallenger 
                ? challenge.opponent_profile?.spa_points || 0
                : challenge.challenger_profile?.spa_points || 0
              } SPA điểm
            </span>
          </div>

          {/* Location and time */}
          <div className="space-y-1 mb-3 text-xs text-muted-foreground">
            {challenge.club_profiles?.club_name && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>{challenge.club_profiles.club_name}</span>
              </div>
            )}
            {challenge.scheduled_time && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{new Date(challenge.scheduled_time).toLocaleDateString('vi-VN')}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Tạo: {new Date(challenge.created_at).toLocaleDateString('vi-VN')}</span>
            </div>
          </div>

          {/* Actions */}
          {showActions && canRespond && challenge.status === 'pending' && (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleAcceptChallenge(challenge.id)}
                className="flex-1 h-9"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Chấp nhận
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeclineChallenge(challenge.id)}
                className="flex-1 h-9"
              >
                <XCircle className="w-4 h-4 mr-1" />
                Từ chối
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderOpenChallengeCard = (challenge: any) => {
    return (
      <Card key={challenge.id} className="mb-3 overflow-hidden border border-emerald-200/50 bg-gradient-to-r from-emerald-50/30 to-green-50/30">
        <CardContent className="p-4">
          {/* Header with open indicator */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={challenge.challenger_profile?.avatar_url} />
                  <AvatarFallback>
                    {challenge.challenger_profile?.full_name?.[0] || 'C'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">
                  {challenge.challenger_profile?.full_name || 'Thách đấu mở'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {challenge.challenger_profile?.verified_rank || 'K'}
                </p>
              </div>
            </div>
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs">
              🌟 Mở
            </Badge>
          </div>

          {/* Bet amount */}
          <div className="flex items-center gap-2 mb-3 p-2 bg-emerald-50 rounded-lg border border-emerald-200">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-emerald-800">{challenge.bet_points}</span>
            <span className="text-xs text-emerald-600">SPA điểm</span>
            <ArrowRight className="w-3 h-3 text-emerald-600 mx-1" />
            <span className="text-xs text-emerald-600">Race to {challenge.race_to || 5}</span>
          </div>

          {/* SPA Points Info */}
          <div className="flex items-center gap-2 mb-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
            <Star className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-blue-600">
              {challenge.challenger_profile?.spa_points || 0} SPA điểm
            </span>
          </div>

          {/* Location info */}
          {challenge.club_profiles?.club_name && (
            <div className="flex items-center gap-1 mb-3 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span>{challenge.club_profiles.club_name}</span>
            </div>
          )}

          {/* Message */}
          {challenge.message && (
            <div className="mb-3 p-2 bg-emerald-50/50 rounded-lg border border-emerald-200/30">
              <div className="flex items-start gap-2">
                <MessageSquare className="w-3 h-3 mt-0.5 text-emerald-600" />
                <p className="text-xs text-emerald-800 italic">"{challenge.message}"</p>
              </div>
            </div>
          )}

          {/* Action */}
          <Button
            onClick={() => handleJoinOpenChallenge(challenge.id)}
            className="w-full h-9 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Users className="w-4 h-4 mr-2" />
            Tham gia thách đấu
          </Button>
        </CardContent>
      </Card>
    );
  };

  const renderUserOpenChallengeCard = (challenge: any) => {
    return (
      <Card key={challenge.id} className="mb-3 overflow-hidden border border-blue-200/50 bg-gradient-to-r from-blue-50/30 to-indigo-50/30">
        <CardContent className="p-4">
          {/* Header with user's open indicator */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={challenge.challenger_profile?.avatar_url} />
                  <AvatarFallback>
                    {challenge.challenger_profile?.full_name?.[0] || 'M'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></div>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">
                  Thách đấu mở của bạn
                </p>
                <p className="text-xs text-muted-foreground">
                  {challenge.challenger_profile?.verified_rank || 'K'}
                </p>
              </div>
            </div>
            <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
              🎯 Đang mở
            </Badge>
          </div>

          {/* Bet amount */}
          <div className="flex items-center gap-2 mb-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
            <DollarSign className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-blue-800">{challenge.bet_points}</span>
            <span className="text-xs text-blue-600">SPA điểm</span>
            <ArrowRight className="w-3 h-3 text-blue-600 mx-1" />
            <span className="text-xs text-blue-600">Race to {challenge.race_to || 5}</span>
          </div>

          {/* Message */}
          {challenge.message && (
            <div className="mb-3 p-2 bg-blue-50/50 rounded-lg border border-blue-200/30">
              <div className="flex items-start gap-2">
                <MessageSquare className="w-3 h-3 mt-0.5 text-blue-600" />
                <p className="text-xs text-blue-800 italic">"{challenge.message}"</p>
              </div>
            </div>
          )}

          {/* Time info */}
          <div className="text-xs text-muted-foreground mb-3">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Tạo: {new Date(challenge.created_at).toLocaleDateString('vi-VN')}</span>
            </div>
          </div>

          {/* Action */}
          <Button
            variant="outline"
            onClick={() => cancelChallenge(challenge.id)}
            className="w-full h-9 border-red-300 text-red-600 hover:bg-red-50"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Hủy thách đấu
          </Button>
        </CardContent>
      </Card>
    );
  };

  const handleRefreshActivity = async () => {
    setIsRefreshing(true);
    await refreshAll();
    setIsRefreshing(false);
    toast.success('Đã cập nhật hoạt động mới nhất');
  };

  const handleWatchMatch = (matchId: string) => {
    toast.info(`Đang mở trận đấu ${matchId}...`);
  };

  const handleRemindMatch = (matchId: string) => {
    toast.success('Đã đặt nhắc nhở cho trận đấu');
  };

  const handleViewResult = (resultId: string) => {
    toast.info(`Đang xem kết quả trận ${resultId}...`);
  };

  const renderLiveActivityTab = () => {
    return (
      <div className="space-y-4">
        {/* Activity Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Hoạt động trực tiếp</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshActivity}
            disabled={isRefreshing || activityLoading}
            className="h-8 px-2"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing || activityLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Live Matches */}
        {liveMatches.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-red-600">ĐANG DIỄN RA ({liveMatches.length})</span>
            </div>
            {liveMatches.map(match => (
              <Card key={match.id} className="border border-red-200/50 bg-gradient-to-r from-red-50/30 to-pink-50/30">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <div>
                        <p className="text-xs font-semibold">
                          {match.player1?.name || 'Player 1'} vs {match.player2?.name || 'Player 2'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {match.score?.player1 || 0} - {match.score?.player2 || 0}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleWatchMatch(match.id)} className="h-7 px-2">
                      <Eye className="w-3 h-3 mr-1" />
                      <span className="text-xs">Xem</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Upcoming Matches */}
        {upcomingMatches.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 text-amber-600" />
              <span className="text-xs font-medium text-amber-600">SẮP DIỄN RA ({upcomingMatches.length})</span>
            </div>
            {upcomingMatches.map(match => (
              <Card key={match.id} className="border border-amber-200/50 bg-gradient-to-r from-amber-50/30 to-yellow-50/30">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold">
                        {match.player1?.name || 'Player 1'} vs {match.player2?.name || 'Player 2'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {match.scheduledTime ? new Date(match.scheduledTime).toLocaleTimeString('vi-VN', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        }) : 'Chưa có lịch'}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleRemindMatch(match.id)} className="h-7 px-2">
                      <Bell className="w-3 h-3 mr-1" />
                      <span className="text-xs">Nhắc</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Recent Results */}
        {recentResults.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Trophy className="w-3 h-3 text-green-600" />
              <span className="text-xs font-medium text-green-600">MỚI HOÀN THÀNH ({recentResults.length})</span>
            </div>
            {recentResults.map(result => (
              <Card key={result.id} className="border border-green-200/50 bg-gradient-to-r from-green-50/30 to-emerald-50/30">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold">
                        {result.player1?.name || 'Player 1'} vs {result.player2?.name || 'Player 2'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {result.finalScore?.player1 || 0} - {result.finalScore?.player2 || 0} • {result.completedAt ? new Date(result.completedAt).toLocaleDateString('vi-VN') : 'Gần đây'}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleViewResult(result.id)} className="h-7 px-2">
                      <Eye className="w-3 h-3 mr-1" />
                      <span className="text-xs">Xem</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Open Challenges in Activity */}
        {openChallenges.filter(c => c.challenger_id !== user?.id).length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="w-3 h-3 text-emerald-600" />
              <span className="text-xs font-medium text-emerald-600">ĐANG TÌM ĐỐI THỦ ({openChallenges.filter(c => c.challenger_id !== user?.id).length})</span>
            </div>
            {openChallenges
              .filter(c => c.challenger_id !== user?.id)
              .slice(0, 3)
              .map(challenge => (
                <Card key={challenge.id} className="border border-emerald-200/50 bg-gradient-to-r from-emerald-50/30 to-green-50/30">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={challenge.challenger_profile?.avatar_url} />
                          <AvatarFallback className="text-xs">
                            {challenge.challenger_profile?.full_name?.[0] || 'C'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-xs font-semibold">
                            {challenge.challenger_profile?.full_name || 'Người thách đấu'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {challenge.bet_points} SPA điểm • Race to {challenge.race_to || 5}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => handleJoinOpenChallenge(challenge.id)} className="h-7 px-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                        <span className="text-xs">Tham gia</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}

        {/* Empty State */}
        {liveMatches.length === 0 && upcomingMatches.length === 0 && recentResults.length === 0 && openChallenges.filter(c => c.challenger_id !== user?.id).length === 0 && (
          <Card className="border-dashed border-2 border-muted-foreground/20">
            <CardContent className="p-6 text-center">
              <div className="text-muted-foreground">
                <div className="text-3xl mb-2">🎱</div>
                <div className="font-medium text-sm">Chưa có hoạt động nào</div>
                <div className="text-xs">Hoạt động trực tiếp sẽ hiển thị ở đây</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Clock className="w-8 h-8 mx-auto mb-2 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Đang tải thách đấu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header with create button */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Thách đấu</h2>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="h-9 px-4"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tạo mới
        </Button>
      </div>

      {/* Search and filters */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm thách đấu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-9"
          />
        </div>
        <Sheet open={showFilters} onOpenChange={setShowFilters}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 px-3">
              <Filter className="w-4 h-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[300px]">
            <SheetHeader>
              <SheetTitle>Bộ lọc thách đấu</SheetTitle>
            </SheetHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground">Bộ lọc sẽ được thêm sau...</p>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-4">
          <TabsTrigger value="activity" className="text-xs">
            <Zap className="w-3 h-3 mr-1" />
            Hoạt động
          </TabsTrigger>
          <TabsTrigger value="received" className="text-xs">
            Nhận ({receivedChallenges.length})
          </TabsTrigger>
          <TabsTrigger value="sent" className="text-xs">
            Gửi ({sentChallenges.length})
          </TabsTrigger>
          <TabsTrigger value="open" className="text-xs">
            Tìm ({openChallenges.length})
          </TabsTrigger>
          <TabsTrigger value="user_open" className="text-xs">
            Mở ({userOpenChallenges.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-0">
          {renderLiveActivityTab()}
        </TabsContent>

        <TabsContent value="received" className="space-y-0">
          {receivedChallenges.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Trophy className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Chưa có thách đấu nào</p>
              </CardContent>
            </Card>
          ) : (
            <div>
              {receivedChallenges.map(challenge => 
                renderChallengeCard(challenge, true)
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sent" className="space-y-0">
          {sentChallenges.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Target className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Chưa gửi thách đấu nào</p>
              </CardContent>
            </Card>
          ) : (
            <div>
              {sentChallenges.map(challenge => 
                renderChallengeCard(challenge, false)
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="open" className="space-y-0">
          {openChallenges.filter(c => c.challenger_id !== user?.id).length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Không có thách đấu mở nào từ người khác</p>
              </CardContent>
            </Card>
          ) : (
            <div>
              {openChallenges
                .filter(c => c.challenger_id !== user?.id)
                .map(challenge => renderOpenChallengeCard(challenge))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="user_open" className="space-y-0">
          {userOpenChallenges.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Target className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Bạn chưa tạo thách đấu mở nào</p>
              </CardContent>
            </Card>
          ) : (
            <div>
              {userOpenChallenges.map(challenge => 
                renderUserOpenChallengeCard(challenge)
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Challenge Modal */}
      {showCreateModal && (
        <CreateChallengeModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onChallengeCreated={() => {
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
};

export default MobileChallengeManager;