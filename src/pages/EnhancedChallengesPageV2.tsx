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
import { useOptimizedChallenges } from '@/hooks/useOptimizedChallenges';
import { useState as useStateForMatches } from 'react';
import UnifiedCreateChallengeModal from '@/components/modals/UnifiedCreateChallengeModal';
import ChallengeDetailsModal from '@/components/ChallengeDetailsModal';
import CreateChallengeButton from '@/components/CreateChallengeButton';

import TrustScoreBadge from '@/components/TrustScoreBadge';
import CompactStatCard from '@/components/challenges/CompactStatCard';
import LiveActivityFeed from '@/components/challenges/LiveActivityFeed';
import ResponsiveDebugInfo from '@/components/debug/ResponsiveDebugInfo';
import MobileChallengeManager from '@/components/challenges/MobileChallengeManager';
import { ChallengeDebugPanel } from '@/components/ChallengeDebugPanel';
import { ChallengeMatchCard } from '@/components/challenges/ChallengeMatchCard';
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
    isSubmittingScore
  } = useOptimizedChallenges();

  // Hook để lấy matches từ challenges đã được accept
  const [matchesData, setMatchesData] = useStateForMatches<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [activeTab, setActiveTab] = useState('my-challenges');
  const [challengeTypeFilter, setChallengeTypeFilter] = useState<'all' | 'standard' | 'sabo'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAdminCreateModal, setShowAdminCreateModal] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Filter challenges by user involvement
  const myChallenges = challenges.filter(c => 
    c.challenger_id === user?.id || c.opponent_id === user?.id
  );
  
  // ✅ FIXED: Active challenges = all accepted challenges (ready to play/enter scores)
  const activeChallenges = challenges.filter(c => {
    console.log('🔍 Checking challenge for active tab:', {
      id: c.id,
      status: c.status,
      challenger: c.challenger_profile?.full_name,
      opponent: c.opponent_profile?.full_name,
      isMyChallenge: c.challenger_id === user?.id || c.opponent_id === user?.id
    });
    
    // Must be accepted status
    if (c.status !== 'accepted') {
      console.log('❌ Not accepted:', c.id);
      return false;
    }
    
    // Must involve current user
    const isMyChallenge = c.challenger_id === user?.id || c.opponent_id === user?.id;
    if (!isMyChallenge) {
      console.log('❌ Not my challenge:', c.id);
      return false;
    }
    
    console.log('✅ Active challenge found:', c.id);
    return true;
  });
  const myMatches = myChallenges.filter(c => c.status === 'accepted' || c.status === 'completed');
  const openChallenges = challenges.filter(c => 
    c.status === 'pending' && !c.opponent_id
  );
  
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
      console.log('🎯 Fetching matches for user:', user.id);
      
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

      console.log('✅ Fetched matches:', matches?.length || 0);
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
            .update({ scheduled_time: new Date().toISOString() })
            .eq('id', challenge.id);
          
          if (challengeError) console.error('Error updating challenge scheduled_time:', challengeError);
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

  const getFilteredChallenges = (challengeList: any[], skipStatusFilter = false) => {
    console.log('🔍 getFilteredChallenges called with:', {
      challengeListLength: challengeList.length,
      statusFilter,
      challengeTypeFilter,
      searchTerm,
      skipStatusFilter
    });
    
    const filtered = challengeList.filter(challenge => {
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

      // Status filter - skip for active challenges tab
      const matchesStatus = skipStatusFilter || statusFilter === 'all' || challenge.status === statusFilter;

      // Challenge type filter - FIXED LOGIC for null/undefined challenge_type
      const matchesType = challengeTypeFilter === 'all' || 
        (challengeTypeFilter === 'sabo' && challenge.challenge_type === 'sabo') ||
        (challengeTypeFilter === 'standard' && (challenge.challenge_type === 'standard' || challenge.challenge_type === null || challenge.challenge_type === undefined));

      const result = matchesSearch && matchesStatus && matchesType;
      
      // Detailed logging for each challenge and filter condition
      console.log(`🔍 Challenge ${challenge.id} (${challenge.status}):`, {
        challenge_type: challenge.challenge_type,
        challengeTypeFilter,
        matchesSearch,
        matchesStatus, 
        matchesType,
        finalResult: result,
        searchTerm,
        skipStatusFilter
      });
      
      if (!result) {
        console.log('🚫 Challenge filtered out:', {
          id: challenge.id,
          status: challenge.status,
          challenge_type: challenge.challenge_type,
          matchesSearch,
          matchesStatus,
          matchesType,
          reason: !matchesSearch ? 'search' : !matchesStatus ? 'status' : !matchesType ? 'type' : 'unknown'
        });
      }

      return result;
    });

    console.log('🎯 getFilteredChallenges result:', {
      inputCount: challengeList.length,
      outputCount: filtered.length,
      statusFilter,
      challengeTypeFilter,
      skipStatusFilter
    });

    return filtered;
  };

  const handleJoinOpenChallenge = async (challengeId: string) => {
    if (!user) return;

    try {
      console.log('🎯 Joining open challenge:', challengeId);
      
      // Show loading state
      toast.loading('Đang tham gia thách đấu...', { id: 'join-challenge' });
      
      const result = await acceptChallenge(challengeId);
      console.log('✅ Join result:', result);
      
      // Update toast to success  
      toast.success('✅ Đã tham gia thành công! Status: accepted', { id: 'join-challenge' });
      
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

  const handleChallengeClick = (challenge: any) => {
    setSelectedChallenge(challenge);
    setShowDetailsModal(true);
  };

  const renderChallengeCard = (challenge: any) => {
    const statusInfo = getStatusInfo(challenge.status);
    const StatusIcon = statusInfo.icon;
    const isChallenger = user?.id === challenge.challenger_id;
    const canRespond = !isChallenger && challenge.status === 'pending';
    
    // Get associated match for this challenge
    const associatedMatch = getMatchForChallenge(challenge.id);
    const hasMatch = !!associatedMatch;
    const canAcceptMatch = hasMatch && associatedMatch.status === 'scheduled' && isChallenger;

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
                  {challenge.challenger_profile?.display_name || challenge.challenger_profile?.full_name || 'Thách đấu'}
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
                  <span className="text-sm font-bold text-amber-600">SPA</span>
                  <span className="text-sm font-bold text-amber-800">
                    {challenge.bet_points}
                  </span>
                </div>
                <div className="text-xs font-medium text-amber-600">Cược</div>
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
                  {challenge.opponent_profile?.display_name || challenge.opponent_profile?.full_name || 'Đối thủ'}
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

            {/* Match Info Section - Show when challenge has been accepted */}
            {hasMatch && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-blue-800">Trận đấu đã được tạo</span>
                  <Badge className={associatedMatch.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}>
                    {associatedMatch.status === 'scheduled' ? 'Chờ xác nhận' : 'Đã xác nhận'}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Trận đấu ID:</span>
                    <div className="font-mono text-blue-700">#{associatedMatch.id.slice(-8)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tạo lúc:</span>
                    <div className="font-medium">{new Date(associatedMatch.created_at).toLocaleString('vi-VN')}</div>
                  </div>
                </div>

                {canAcceptMatch && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAcceptMatch(associatedMatch.id);
                    }}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-2.5 rounded-lg shadow-lg transition-all duration-200"
                  >
                    <Trophy className="w-4 h-4 mr-2" />
                    ✅ Xác nhận trận đấu
                  </Button>
                )}

                {hasMatch && !canAcceptMatch && associatedMatch.status === 'confirmed' && (
                  <div className="text-center py-2">
                    <Badge className="bg-green-100 text-green-800 font-medium">
                      ✅ Trận đấu đã sẵn sàng
                    </Badge>
                  </div>
                )}
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

  const renderOpenChallengeCard = (challenge: any) => {
    return (
      <Card
        key={challenge.id}
        className="group relative h-full bg-gradient-to-br from-emerald-50/50 to-green-50/50 backdrop-blur-sm border border-emerald-200/50 hover:border-emerald-300/70 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 transform hover:-translate-y-1 hover:from-emerald-50/70 hover:to-green-50/70"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-green-500 to-teal-400 rounded-t-lg" />
        
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
          </div>

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
                        <div className="w-full">
                          <div className="text-xs text-muted-foreground mb-2 bg-muted/30 p-2 rounded">
                            Debug: Rendering LiveActivityFeed with {openChallenges?.length || 0} open challenges
                          </div>
                          <LiveActivityFeed
                            openChallenges={openChallenges}
                            onJoinChallenge={handleJoinOpenChallenge}
                          />
                        </div>

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
              <TabsList className="grid w-full grid-cols-4 bg-card/50 backdrop-blur-sm border border-border/50 p-1 rounded-lg shadow-sm h-12">
                <TabsTrigger 
                  value="my-challenges"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200 font-medium text-sm"
                >
                  Thách đấu của tôi ({getFilteredChallenges(myChallenges).length})
                </TabsTrigger>
                <TabsTrigger 
                  value="my-matches"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200 font-medium text-sm"
                >
                  📊 Trận đấu của tôi ({getFilteredChallenges(myMatches).length})
                </TabsTrigger>
                <TabsTrigger 
                  value="active-challenges"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200 font-medium text-sm"
                >
                  Đang diễn ra ({getFilteredChallenges(activeChallenges, true).length})
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

              <TabsContent value="my-matches" className="space-y-6">
                {getFilteredChallenges(myMatches).length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {getFilteredChallenges(myMatches).map(challenge => (
                      <ChallengeMatchCard
                        key={challenge.id}
                        challenge={challenge as any}
                        currentUserId={user?.id || ''}
                        onSubmitScore={submitScore}
                        isSubmittingScore={isSubmittingScore}
                      />
                    ))}
                  </div>
                ) : (
                  <Card className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 border border-blue-200/30">
                    <CardContent className="p-16 text-center">
                      <div className="p-4 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 w-fit mx-auto mb-6">
                        <Trophy className="w-16 h-16 text-blue-600 mx-auto" />
                      </div>
                      <h3 className="text-xl font-semibold text-foreground mb-3">Chưa có trận đấu nào</h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        Khi bạn chấp nhận thách đấu, trận đấu sẽ hiển thị ở đây để bạn có thể nhập tỷ số.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="active-challenges" className="space-y-6">
                <div className="text-xs text-muted-foreground mb-2 bg-muted/30 p-2 rounded">
                  Debug: raw activeChallenges={activeChallenges.length}, NO FILTERS APPLIED
                  <br />Raw data: {JSON.stringify(activeChallenges.map(c => ({id: c.id, status: c.status})))}
                </div>
                {activeChallenges.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {activeChallenges.map(challenge => (
                      <ChallengeMatchCard
                        key={challenge.id}
                        challenge={challenge as any}
                        currentUserId={user?.id || ''}
                        onSubmitScore={submitScore}
                        isSubmittingScore={isSubmittingScore}
                      />
                    ))}
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
    <ErrorBoundary>
      {/* Debug Info - Only show on desktop in development */}
      {isDesktop && process.env.NODE_ENV === 'development' && <ResponsiveDebugInfo />}
      
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
        variant="standard"
      />

      <UnifiedCreateChallengeModal
        isOpen={showAdminCreateModal}
        onClose={() => setShowAdminCreateModal(false)}
        onChallengeCreated={() => {
          setShowAdminCreateModal(false);
          // Data will refresh automatically via the hook
        }}
        variant="admin"
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