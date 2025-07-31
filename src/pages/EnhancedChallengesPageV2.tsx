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
import { useResponsive } from '@/hooks/useResponsive';
import { useChallenges } from '@/hooks/useChallenges';
import CreateChallengeModal from '@/components/CreateChallengeModal';
import ChallengeDetailsModal from '@/components/ChallengeDetailsModal';
import CreateChallengeButton from '@/components/CreateChallengeButton';
import AdminCreateChallengeModal from '@/components/admin/AdminCreateChallengeModal';
import TrustScoreBadge from '@/components/TrustScoreBadge';
import CompactStatCard from '@/components/challenges/CompactStatCard';
import LiveActivityFeed from '@/components/challenges/LiveActivityFeed';
import ResponsiveDebugInfo from '@/components/debug/ResponsiveDebugInfo';
import MobileChallengeManager from '@/components/challenges/MobileChallengeManager';

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
    verified_rank?: string;
    spa_points?: number;
  };
  opponent_profile?: {
    full_name: string;
    avatar_url?: string;
    current_rank?: string;
    verified_rank?: string;
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
  const { isDesktop, isMobile, width } = useResponsive();
  
  // Debug log to check responsive state
  console.log('Responsive state:', { isDesktop, isMobile, width });
  
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
  const [challengeTypeFilter, setChallengeTypeFilter] = useState<'all' | 'standard' | 'sabo'>('all');
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
    club_profiles: c.club_profiles || null,
  });

  // Derived data from hook - filter data safely
  const myChallenges = [...receivedChallenges, ...sentChallenges].map(convertToLocalChallenge);
  const activeChallenges = challenges.filter(c => c.status === 'accepted').map(convertToLocalChallenge);
  const openChallenges = challenges.filter(c => 
    !c.opponent_id && 
    c.status === 'pending'
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
      // Search filter
      const matchesSearch = !searchTerm || (() => {
        const challengerName = challenge.challenger_profile?.full_name?.toLowerCase() || '';
        const opponentName = challenge.opponent_profile?.full_name?.toLowerCase() || '';
        const clubName = challenge.club_profiles?.club_name?.toLowerCase() || '';
        
        return (
          challengerName.includes(searchTerm.toLowerCase()) ||
          opponentName.includes(searchTerm.toLowerCase()) ||
          clubName.includes(searchTerm.toLowerCase())
        );
      })();

      // Status filter
      const matchesStatus = statusFilter === 'all' || challenge.status === statusFilter;

      // Challenge type filter
      const matchesType = challengeTypeFilter === 'all' || 
        (challengeTypeFilter === 'sabo' && challenge.challenge_type === 'sabo') ||
        (challengeTypeFilter === 'standard' && (challenge.challenge_type === 'standard' || !challenge.challenge_type));

      return matchesSearch && matchesStatus && matchesType;
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
        className="group relative h-full bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 cursor-pointer transform hover:-translate-y-1 hover:bg-card/80"
        onClick={() => handleChallengeClick(challenge)}
      >
        {/* Status accent line */}
        <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-lg ${
          challenge.status === 'pending' ? 'bg-gradient-to-r from-amber-400 to-yellow-500' :
          challenge.status === 'accepted' ? 'bg-gradient-to-r from-emerald-400 to-green-500' :
          challenge.status === 'completed' ? 'bg-gradient-to-r from-blue-400 to-indigo-500' :
          'bg-gradient-to-r from-gray-400 to-slate-500'
        }`} />

        <CardHeader className="pb-4 pt-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full transition-colors duration-200 ${
                challenge.status === 'pending' ? 'bg-amber-50 text-amber-600 group-hover:bg-amber-100' :
                challenge.status === 'accepted' ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100' :
                challenge.status === 'completed' ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-100' :
                'bg-gray-50 text-gray-600 group-hover:bg-gray-100'
              }`}>
                <StatusIcon className="w-4 h-4" />
              </div>
              <CardTitle className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                Thách đấu #{challenge.id.slice(-6)}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {canRespond && (
                <div className="animate-pulse">
                  <Bell className="w-4 h-4 text-amber-500" />
                </div>
              )}
              <Badge className={`${statusInfo.color} border-0 font-medium shadow-sm`}>
                {statusInfo.text}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 pb-6">
          {/* Players */}
          <div className="grid grid-cols-3 gap-4 items-center">
            {/* Challenger */}
            <div className="text-center space-y-2">
              <div className="relative">
                <Avatar className="w-12 h-12 mx-auto ring-2 ring-border/20 transition-all duration-200 group-hover:ring-primary/30 group-hover:scale-105">
                  <AvatarImage src={challenge.challenger_profile?.avatar_url} />
                  <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-primary/10 to-primary/20 text-primary">
                    {challenge.challenger_profile?.full_name?.[0] || 'C'}
                  </AvatarFallback>
                </Avatar>
                {isChallenger && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">Me</span>
                  </div>
                )}
              </div>
              <div className="text-xs space-y-0.5">
                <div className="font-semibold text-foreground truncate">
                  {challenge.challenger_profile?.full_name || 'Thách đấu'}
                </div>
                <div className="text-muted-foreground font-medium">
                  {challenge.challenger_profile?.verified_rank || challenge.challenger_profile?.current_rank || 'K'}
                </div>
              </div>
              {challenge.challenger_id && (
                <div className="scale-90">
                  <TrustScoreBadge playerId={challenge.challenger_id} />
                </div>
              )}
            </div>

            {/* VS & Bet */}
            <div className="text-center space-y-2">
              <div className="text-xl font-bold text-muted-foreground/60 tracking-wider">VS</div>
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200/50 rounded-lg px-3 py-2 shadow-sm">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <DollarSign className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-bold text-amber-800">
                    {challenge.bet_points}
                  </span>
                </div>
                <div className="text-xs font-medium text-amber-600">SPA điểm</div>
              </div>
              <div className="text-xs text-muted-foreground font-medium">
                Race to {challenge.race_to || 5}
              </div>
            </div>

            {/* Opponent */}
            <div className="text-center space-y-2">
              <div className="relative">
                <Avatar className="w-12 h-12 mx-auto ring-2 ring-border/20 transition-all duration-200 group-hover:ring-primary/30 group-hover:scale-105">
                  <AvatarImage src={challenge.opponent_profile?.avatar_url} />
                  <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-secondary/10 to-secondary/20 text-secondary-foreground">
                    {challenge.opponent_profile?.full_name?.[0] || 'O'}
                  </AvatarFallback>
                </Avatar>
                {!isChallenger && challenge.opponent_id === user?.id && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">Me</span>
                  </div>
                )}
              </div>
              <div className="text-xs space-y-0.5">
                <div className="font-semibold text-foreground truncate">
                  {challenge.opponent_profile?.full_name || 'Đối thủ'}
                </div>
                <div className="text-muted-foreground font-medium">
                  {challenge.opponent_profile?.verified_rank || challenge.opponent_profile?.current_rank || 'K'}
                </div>
              </div>
              {challenge.opponent_id && (
                <div className="scale-90">
                  <TrustScoreBadge playerId={challenge.opponent_id} />
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-3 pt-2 border-t border-border/50">
            {challenge.club_profiles && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="p-1.5 rounded-md bg-secondary/30">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <span className="truncate font-medium">{challenge.club_profiles.club_name}</span>
              </div>
            )}
            
            {challenge.scheduled_time && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="p-1.5 rounded-md bg-secondary/30">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <span className="font-medium">{new Date(challenge.scheduled_time).toLocaleDateString('vi-VN')}</span>
              </div>
            )}

            {challenge.message && (
              <div className="bg-secondary/20 rounded-md p-3 border border-border/30">
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-3.5 h-3.5 mt-0.5 text-muted-foreground" />
                  <span className="text-sm text-foreground/90 italic line-clamp-2">"{challenge.message}"</span>
                </div>
              </div>
            )}

            <div className="flex justify-between text-xs text-muted-foreground/70 pt-2 border-t border-border/30">
              <span>Tạo: {new Date(challenge.created_at).toLocaleDateString('vi-VN')}</span>
              <span>Hết hạn: {new Date(challenge.expires_at).toLocaleDateString('vi-VN')}</span>
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
        className="group relative h-full bg-gradient-to-br from-emerald-50/50 to-green-50/50 backdrop-blur-sm border border-emerald-200/50 hover:border-emerald-300/70 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 transform hover:-translate-y-1 hover:from-emerald-50/70 hover:to-green-50/70"
      >
        {/* Gradient accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-green-500 to-teal-400 rounded-t-lg" />
        
        {/* Open challenge indicator */}
        <div className="absolute top-3 right-3 animate-pulse">
          <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/30"></div>
        </div>

        <CardHeader className="pb-4 pt-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-emerald-100 text-emerald-600 group-hover:bg-emerald-200 transition-colors duration-200">
                <Users className="w-4 h-4" />
              </div>
              <CardTitle className="text-base font-semibold text-emerald-700 group-hover:text-emerald-800 transition-colors">
                Thách đấu mở #{challenge.id.slice(-6)}
              </CardTitle>
            </div>
            <Badge className="bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border-0 font-medium shadow-sm">
              🌟 Mở - Chờ đối thủ
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 pb-6">
          {/* Challenger Info */}
          <div className="flex items-center gap-4 p-3 bg-white/50 rounded-lg border border-emerald-100/50">
            <Avatar className="w-14 h-14 ring-2 ring-emerald-200/50 transition-all duration-200 group-hover:ring-emerald-300/70 group-hover:scale-105">
              <AvatarImage src={challenge.challenger_profile?.avatar_url} />
              <AvatarFallback className="text-base font-semibold bg-gradient-to-br from-emerald-100 to-green-100 text-emerald-700">
                {challenge.challenger_profile?.full_name?.[0] || 'C'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-foreground text-base truncate">
                {challenge.challenger_profile?.full_name || 'Thách đấu'}
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                {challenge.challenger_profile?.verified_rank || challenge.challenger_profile?.current_rank || 'K'}
              </div>
            </div>
            {challenge.challenger_id && (
              <div className="flex-shrink-0">
                <TrustScoreBadge playerId={challenge.challenger_id} />
              </div>
            )}
          </div>

          {/* Challenge Details */}
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200/50 rounded-lg p-4 space-y-3 shadow-sm">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-emerald-700">Mức cược:</span>
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-emerald-700 text-lg">
                  {challenge.bet_points}
                </span>
                <span className="text-sm font-medium text-emerald-600">điểm SPA</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-emerald-700">Thi đấu đến:</span>
              <span className="font-bold text-emerald-600">
                {challenge.race_to || 5} bida
              </span>
            </div>
          </div>

          {challenge.message && (
            <div className="bg-white/60 border border-border/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-md bg-secondary/30">
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-foreground">Lời nhắn:</span>
                  <p className="text-sm text-muted-foreground mt-1 italic line-clamp-3">"{challenge.message}"</p>
                </div>
              </div>
            </div>
          )}

          {challenge.club_profiles && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 bg-white/30 rounded-lg border border-border/20">
              <div className="p-1.5 rounded-md bg-secondary/30">
                <MapPin className="w-4 h-4" />
              </div>
              <span className="font-medium">{challenge.club_profiles.club_name}</span>
            </div>
          )}

          <div className="flex justify-between text-xs text-muted-foreground/70 pt-2 border-t border-emerald-200/30">
            <span>Tạo: {new Date(challenge.created_at).toLocaleDateString('vi-VN')}</span>
            <span>Hết hạn: {new Date(challenge.expires_at).toLocaleDateString('vi-VN')}</span>
          </div>

          <Button 
            onClick={() => handleJoinOpenChallenge(challenge.id)}
            className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold py-3 rounded-lg shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-200 transform hover:scale-[1.02]"
          >
            <Users className="w-4 h-4 mr-2" />
            🚀 Tham gia thách đấu
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

  // Desktop Layout Component
  const DesktopLayout = () => (
    <div className="min-h-screen bg-background">
      {/* Desktop Container - Optimized for wider screens */}
      <div className="challenges-desktop max-w-[1400px] mx-auto px-8 py-6 space-y-8">
        {/* Premium Header Section */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Thách đấu
            </h1>
            <p className="text-lg text-muted-foreground">
              Quản lý và tham gia các thách đấu billiards chuyên nghiệp
            </p>
          </div>
          <div className="flex gap-3">
            <CreateChallengeButton onCreateClick={() => setShowCreateModal(true)} />
            {isAdmin && (
              <Button 
                onClick={() => setShowAdminCreateModal(true)}
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50 shadow-sm"
              >
                <Shield className="w-4 h-4 mr-2" />
                Admin: Tạo thách đấu
              </Button>
            )}
          </div>
        </div>

        {/* Compact Statistics Row - Professional Design */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <CompactStatCard
            icon={Trophy}
            value={stats.total}
            label="Tổng cộng"
            color="primary"
          />
          <CompactStatCard
            icon={Clock}
            value={stats.pending}
            label="Chờ phản hồi"
            color="warning"
          />
          <CompactStatCard
            icon={Zap}
            value={stats.accepted}
            label="Đã chấp nhận"
            color="success"
          />
          <CompactStatCard
            icon={Star}
            value={stats.completed}
            label="Hoàn thành"
            color="info"
          />
        </div>

        {/* Live Activity Feed - Main Content Area */}
        <LiveActivityFeed
          openChallenges={openChallenges}
          onJoinChallenge={handleJoinOpenChallenge}
        />

        {/* Advanced Management Section - Desktop Optimized */}
        <Card className="bg-card/50 backdrop-blur-sm border border-border/50 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <Target className="w-6 h-6" />
              Quản lý thách đấu nâng cao
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Desktop-Optimized Filters */}
            <div className="flex gap-4 items-center">
              <div className="flex-1 max-w-md">
                <div className="relative group">
                  <Search className="w-4 h-4 absolute left-3 top-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    placeholder="Tìm kiếm theo tên người chơi hoặc câu lạc bộ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all duration-200"
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <Select value={challengeTypeFilter} onValueChange={(value: 'all' | 'standard' | 'sabo') => setChallengeTypeFilter(value)}>
                  <SelectTrigger className="w-40 bg-background border-border/50">
                    <SelectValue placeholder="Loại thách đấu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="standard">Thường</SelectItem>
                    <SelectItem value="sabo">
                      <div className="flex items-center gap-2">
                        <Sword className="w-4 h-4" />
                        SABO
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 border-border/50 hover:border-primary/30">
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
                  <SelectTrigger className="w-32 border-border/50 hover:border-primary/30">
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
                  className="border-border/50 hover:border-primary/30 hover:scale-105 transition-all duration-200"
                >
                  {sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Enhanced Tabs for Desktop */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 bg-card/50 backdrop-blur-sm border border-border/50 p-1 rounded-lg shadow-sm h-12">
                <TabsTrigger 
                  value="my-challenges"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200 font-medium text-sm"
                >
                  Thách đấu của tôi ({getFilteredChallenges(myChallenges).length})
                </TabsTrigger>
                <TabsTrigger 
                  value="active-challenges"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200 font-medium text-sm"
                >
                  Đang diễn ra ({getFilteredChallenges(activeChallenges).length})
                </TabsTrigger>
                <TabsTrigger 
                  value="open-challenges"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200 font-medium text-sm"
                >
                  Thách đấu mở ({getFilteredChallenges(openChallenges).length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="my-challenges" className="space-y-6">
                {getFilteredChallenges(myChallenges).length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {getFilteredChallenges(myChallenges).map(renderChallengeCard)}
                  </div>
                ) : (
                  <Card className="bg-gradient-to-br from-slate-50/50 to-gray-50/50 border border-border/50">
                    <CardContent className="p-16 text-center">
                      <div className="p-4 rounded-full bg-gradient-to-br from-primary/10 to-primary/20 w-fit mx-auto mb-6">
                        <Target className="w-16 h-16 text-primary mx-auto" />
                      </div>
                      <h3 className="text-xl font-semibold text-foreground mb-3">Chưa có thách đấu nào</h3>
                      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        Tạo thách đấu đầu tiên của bạn để bắt đầu cuộc phiêu lưu billiards!
                      </p>
                      <Button 
                        onClick={() => setShowCreateModal(true)}
                        className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        🎯 Tạo thách đấu
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="active-challenges" className="space-y-6">
                {getFilteredChallenges(activeChallenges).length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {getFilteredChallenges(activeChallenges).map(renderChallengeCard)}
                  </div>
                ) : (
                  <Card className="bg-gradient-to-br from-amber-50/50 to-orange-50/50 border border-amber-200/30">
                    <CardContent className="p-16 text-center">
                      <div className="p-4 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 w-fit mx-auto mb-6">
                        <Zap className="w-16 h-16 text-amber-600 mx-auto" />
                      </div>
                      <h3 className="text-xl font-semibold text-foreground mb-3">Không có trận đấu nào đang diễn ra</h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        Các trận đấu đã được chấp nhận sẽ hiển thị ở đây. Hãy chấp nhận một thách đấu để bắt đầu!
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="open-challenges" className="space-y-6">
                {getFilteredChallenges(openChallenges).length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {getFilteredChallenges(openChallenges).map(renderOpenChallengeCard)}
                  </div>
                ) : (
                  <Card className="bg-gradient-to-br from-emerald-50/50 to-green-50/50 border border-emerald-200/30">
                    <CardContent className="p-16 text-center">
                      <div className="p-4 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 w-fit mx-auto mb-6">
                        <Users className="w-16 h-16 text-emerald-600 mx-auto" />
                      </div>
                      <h3 className="text-xl font-semibold text-foreground mb-3">Không có thách đấu mở nào</h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        Các thách đấu mở từ người chơi khác sẽ hiển thị ở đây. Hãy kiểm tra lại sau!
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
    <div className="min-h-screen bg-background">
      <div className="px-0 py-0">
        <MobileChallengeManager className="h-screen" />
      </div>
    </div>
  );

  return (
    <>
      {/* Debug Info - Only show on desktop in development */}
      {isDesktop && process.env.NODE_ENV === 'development' && <ResponsiveDebugInfo />}
      
      {/* Responsive Layout Rendering */}
      {isDesktop ? <DesktopLayout /> : <MobileLayout />}

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
    </>
  );
};

export default EnhancedChallengesPageV2;