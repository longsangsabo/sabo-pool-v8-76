import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useChallenges } from '@/hooks/useChallenges';
import CreateChallengeModal from '@/components/CreateChallengeModal';
import ChallengeDetailsModal from '@/components/ChallengeDetailsModal';
import CreateChallengeButton from '@/components/CreateChallengeButton';
import AdminCreateChallengeModal from '@/components/admin/AdminCreateChallengeModal';
import TrustScoreBadge from '@/components/TrustScoreBadge';
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
} from 'lucide-react';

// Use simplified Challenge interface based on the database
interface Challenge {
  id: string;
  challenger_id: string;
  opponent_id?: string;
  club_id?: string;
  bet_points: number;
  race_to?: number;
  status: string;
  message?: string;
  scheduled_time?: string;
  created_at: string;
  expires_at: string;
  challenge_type?: string;
  challenger_profile?: {
    full_name: string;
    avatar_url?: string;
    current_rank?: string;
    spa_points?: number;
  };
  opponent_profile?: {
    full_name: string;
    avatar_url?: string;
    current_rank?: string;
    spa_points?: number;
  };
  club_profiles?: {
    club_name: string;
    address: string;
  };
}

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
  
  // Use the standardized hook
  const {
    challenges,
    receivedChallenges,
    sentChallenges,
    loading,
    error,
    acceptChallenge,
    declineChallenge,
    cancelChallenge
  } = useChallenges();
  
  const [activeTab, setActiveTab] = useState('my-challenges');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAdminCreateModal, setShowAdminCreateModal] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Convert hook data to local Challenge format
  const convertToLocalChallenge = (c: any): Challenge => ({
    id: c.id,
    challenger_id: c.challenger_id,
    opponent_id: c.opponent_id,
    club_id: c.club_id,
    bet_points: c.bet_points || 0,
    race_to: c.race_to || 5,
    status: c.status,
    message: c.message,
    scheduled_time: c.scheduled_time,
    created_at: c.created_at,
    expires_at: c.expires_at,
    challenge_type: c.challenge_type,
    challenger_profile: c.challenger_profile,
    opponent_profile: c.opponent_profile,
    club_profiles: c.club_profiles,
  });

  // Derived data from hook - filter data safely
  const myChallenges = [...receivedChallenges, ...sentChallenges].map(convertToLocalChallenge);
  const activeChallenges = challenges.filter(c => c.status === 'accepted').map(convertToLocalChallenge);
  const openChallenges = challenges.filter(c => 
    (c as any).challenge_type === 'open' && 
    c.status === 'pending' && 
    c.challenger_id !== user?.id
  ).map(convertToLocalChallenge);
  
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

  const getFilteredChallenges = (challengeList: Challenge[]) => {
    return challengeList.filter(challenge => {
      if (!searchTerm) return true;
      
      const challengerName = challenge.challenger_profile?.full_name?.toLowerCase() || '';
      const opponentName = challenge.opponent_profile?.full_name?.toLowerCase() || '';
      const clubName = challenge.club_profiles?.club_name?.toLowerCase() || '';
      
      return (
        challengerName.includes(searchTerm.toLowerCase()) ||
        opponentName.includes(searchTerm.toLowerCase()) ||
        clubName.includes(searchTerm.toLowerCase())
      );
    });
  };

  const handleJoinOpenChallenge = async (challengeId: string) => {
    if (!user) return;

    try {
      await acceptChallenge(challengeId);
      toast.success('Đã tham gia thách đấu mở thành công!');
    } catch (error) {
      console.error('Error joining open challenge:', error);
      toast.error('Lỗi khi tham gia thách đấu');
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { text: 'Chờ phản hồi', color: 'bg-yellow-100 text-yellow-800', icon: Clock };
      case 'accepted':
        return { text: 'Đã chấp nhận', color: 'bg-green-100 text-green-800', icon: Trophy };
      case 'declined':
        return { text: 'Đã từ chối', color: 'bg-red-100 text-red-800', icon: Target };
      case 'completed':
        return { text: 'Hoàn thành', color: 'bg-blue-100 text-blue-800', icon: Star };
      default:
        return { text: status, color: 'bg-gray-100 text-gray-800', icon: Users };
    }
  };

  const handleChallengeClick = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setShowDetailsModal(true);
  };

  const renderChallengeCard = (challenge: Challenge) => {
    const statusInfo = getStatusInfo(challenge.status);
    const StatusIcon = statusInfo.icon;
    const isChallenger = user?.id === challenge.challenger_id;
    const canRespond = !isChallenger && challenge.status === 'pending';

    return (
      <Card
        key={challenge.id}
        className="hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 border-l-primary/20"
        onClick={() => handleChallengeClick(challenge)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusIcon className="w-4 h-4" />
              <CardTitle className="text-base">
                Thách đấu #{challenge.id.slice(-6)}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {canRespond && (
                <Bell className="w-4 h-4 text-amber-500 animate-pulse" />
              )}
              <Badge className={statusInfo.color}>
                {statusInfo.text}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Players */}
          <div className="grid grid-cols-3 gap-2 items-center">
            {/* Challenger */}
            <div className="text-center space-y-1">
              <Avatar className="w-10 h-10 mx-auto">
                <AvatarImage src={challenge.challenger_profile?.avatar_url} />
                <AvatarFallback className="text-xs">
                  {challenge.challenger_profile?.full_name?.[0] || 'C'}
                </AvatarFallback>
              </Avatar>
              <div className="text-xs">
                <div className="font-medium truncate">
                  {challenge.challenger_profile?.full_name || 'Thách đấu'}
                </div>
                <div className="text-gray-500">
                  {challenge.challenger_profile?.current_rank || 'K'}
                </div>
              </div>
              {challenge.challenger_id && (
                <TrustScoreBadge playerId={challenge.challenger_id} />
              )}
            </div>

            {/* VS & Bet */}
            <div className="text-center space-y-1">
              <div className="text-lg font-bold text-gray-400">VS</div>
              <div className="flex items-center justify-center gap-1 bg-yellow-50 rounded px-2 py-1">
                <DollarSign className="w-3 h-3 text-yellow-600" />
                <span className="text-xs font-bold text-yellow-800">
                  {challenge.bet_points}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                Race {challenge.race_to || 5}
              </div>
            </div>

            {/* Opponent */}
            <div className="text-center space-y-1">
              <Avatar className="w-10 h-10 mx-auto">
                <AvatarImage src={challenge.opponent_profile?.avatar_url} />
                <AvatarFallback className="text-xs">
                  {challenge.opponent_profile?.full_name?.[0] || 'O'}
                </AvatarFallback>
              </Avatar>
              <div className="text-xs">
                <div className="font-medium truncate">
                  {challenge.opponent_profile?.full_name || 'Đối thủ'}
                </div>
                <div className="text-gray-500">
                  {challenge.opponent_profile?.current_rank || 'K'}
                </div>
              </div>
              {challenge.opponent_id && (
                <TrustScoreBadge playerId={challenge.opponent_id} />
              )}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2 text-xs text-gray-600">
            {challenge.club_profiles && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{challenge.club_profiles.club_name}</span>
              </div>
            )}
            
            {challenge.scheduled_time && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{new Date(challenge.scheduled_time).toLocaleDateString('vi-VN')}</span>
              </div>
            )}

            {challenge.message && (
              <div className="flex items-start gap-1">
                <MessageSquare className="w-3 h-3 mt-0.5" />
                <span className="truncate message-text">"{challenge.message}"</span>
              </div>
            )}

            <div className="flex justify-between text-gray-400">
              <span>Tạo: {new Date(challenge.created_at).toLocaleDateString('vi-VN')}</span>
              <span>HH: {new Date(challenge.expires_at).toLocaleDateString('vi-VN')}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderOpenChallengeCard = (challenge: Challenge) => {
    return (
      <Card
        key={challenge.id}
        className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-400"
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-green-600" />
              <CardTitle className="text-base text-green-700">
                Thách đấu mở #{challenge.id.slice(-6)}
              </CardTitle>
            </div>
            <Badge className="bg-green-100 text-green-800">
              Mở - Chờ đối thủ
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Challenger Info */}
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={challenge.challenger_profile?.avatar_url} />
              <AvatarFallback>
                {challenge.challenger_profile?.full_name?.[0] || 'C'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="font-medium">
                {challenge.challenger_profile?.full_name || 'Thách đấu'}
              </div>
              <div className="text-sm text-gray-500">
                Hạng: {challenge.challenger_profile?.current_rank || 'K'}
              </div>
            </div>
            {challenge.challenger_id && (
              <TrustScoreBadge playerId={challenge.challenger_id} />
            )}
          </div>

          {/* Challenge Details */}
          <div className="bg-green-50 rounded-lg p-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold">Mức cược:</span>
              <span className="font-bold text-green-600 text-lg">
                {challenge.bet_points} điểm SPA
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold">Thi đấu đến:</span>
              <span className="font-medium">
                {challenge.race_to || 5} bida
              </span>
            </div>
          </div>

          {challenge.message && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <MessageSquare className="w-4 h-4 mt-0.5 text-gray-500" />
                <div>
                  <span className="text-sm font-semibold">Lời nhắn:</span>
                  <p className="message-text mt-1">"{challenge.message}"</p>
                </div>
              </div>
            </div>
          )}

          {challenge.club_profiles && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>{challenge.club_profiles.club_name}</span>
            </div>
          )}

          <div className="flex justify-between text-xs text-gray-400">
            <span>Tạo: {new Date(challenge.created_at).toLocaleDateString('vi-VN')}</span>
            <span>HH: {new Date(challenge.expires_at).toLocaleDateString('vi-VN')}</span>
          </div>

          <Button 
            onClick={() => handleJoinOpenChallenge(challenge.id)}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <Users className="w-4 h-4 mr-2" />
            Tham gia thách đấu
          </Button>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Đang tải thách đấu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-red-500">❌ Lỗi tải dữ liệu</div>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 space-y-6 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Thách đấu</h1>
            <p className="text-muted-foreground">
              Quản lý và tham gia các thách đấu billiards
            </p>
          </div>
          <div className="flex gap-2">
            <CreateChallengeButton onCreateClick={() => setShowCreateModal(true)} />
            {isAdmin && (
              <Button 
                onClick={() => setShowAdminCreateModal(true)}
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                <Shield className="w-4 h-4 mr-2" />
                Admin: Tạo thách đấu
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Trophy className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Tổng cộng</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{stats.pending}</div>
              <div className="text-sm text-muted-foreground">Chờ phản hồi</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Zap className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{stats.accepted}</div>
              <div className="text-sm text-muted-foreground">Đã chấp nhận</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Star className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{stats.completed}</div>
              <div className="text-sm text-muted-foreground">Hoàn thành</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm theo tên người chơi hoặc câu lạc bộ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="pending">Chờ phản hồi</SelectItem>
                    <SelectItem value="accepted">Đã chấp nhận</SelectItem>
                    <SelectItem value="declined">Đã từ chối</SelectItem>
                    <SelectItem value="completed">Hoàn thành</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Ngày tạo</SelectItem>
                    <SelectItem value="bet_points">Mức cược</SelectItem>
                    <SelectItem value="expires_at">Hết hạn</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  {sortOrder === 'asc' ? (
                    <ArrowUp className="w-4 h-4" />
                  ) : (
                    <ArrowDown className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Challenges Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="my-challenges">
              Thách đấu của tôi ({getFilteredChallenges(myChallenges).length})
            </TabsTrigger>
            <TabsTrigger value="active-challenges">
              Đang diễn ra ({getFilteredChallenges(activeChallenges).length})
            </TabsTrigger>
            <TabsTrigger value="open-challenges">
              Thách đấu mở ({getFilteredChallenges(openChallenges).length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-challenges" className="space-y-4">
            {getFilteredChallenges(myChallenges).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getFilteredChallenges(myChallenges).map(renderChallengeCard)}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Chưa có thách đấu nào</h3>
                  <p className="text-muted-foreground mb-4">
                    Tạo thách đấu đầu tiên của bạn để bắt đầu!
                  </p>
                  <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Tạo thách đấu
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="active-challenges" className="space-y-4">
            {getFilteredChallenges(activeChallenges).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getFilteredChallenges(activeChallenges).map(renderChallengeCard)}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Zap className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Không có trận đấu nào đang diễn ra</h3>
                  <p className="text-muted-foreground">
                    Các trận đấu đã được chấp nhận sẽ hiển thị ở đây
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="open-challenges" className="space-y-4">
            {getFilteredChallenges(openChallenges).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getFilteredChallenges(openChallenges).map(renderOpenChallengeCard)}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Không có thách đấu mở nào</h3>
                  <p className="text-muted-foreground">
                    Các thách đấu mở từ người chơi khác sẽ hiển thị ở đây
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <CreateChallengeModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onChallengeCreated={() => {
          setShowCreateModal(false);
          // Data will refresh automatically via the hook
        }}
      />

      <AdminCreateChallengeModal
        isOpen={showAdminCreateModal}
        onClose={() => setShowAdminCreateModal(false)}
        onChallengeCreated={() => {
          setShowAdminCreateModal(false);
          // Data will refresh automatically via the hook
        }}
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
    </div>
  );
};

export default EnhancedChallengesPageV2;