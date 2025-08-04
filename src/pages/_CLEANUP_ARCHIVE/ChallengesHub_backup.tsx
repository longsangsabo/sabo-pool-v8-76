import React, { Suspense, useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Loader2, Target, Zap, Users, Settings, Plus, Search, Trophy, Clock, DollarSign, Star, ArrowRight, Shield, TrendingUp, Activity } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useOptimizedChallenges } from '@/hooks/useOptimizedChallenges';
import { useToast } from '@/hooks/use-toast';
import UnifiedCreateChallengeModal from '@/components/modals/UnifiedCreateChallengeModal';
import ChallengeDetailsModal from '@/components/ChallengeDetailsModal';
import { supabase } from '@/integrations/supabase/client';

// Lazy load challenge components for advanced features
const EnhancedChallengesPageV2 = React.lazy(() => import('@/pages/EnhancedChallengesPageV2'));

// My Challenges component with real data
const MyChallenges = () => {
  const { user } = useAuth();
  const { challenges, loading, acceptChallenge, declineChallenge } = useOptimizedChallenges();
  const { toast } = useToast();
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Filter challenges by user involvement
  const myChallenges = challenges.filter(
    c => c.challenger_id === user?.id || c.opponent_id === user?.id
  );

  const handleChallengeAction = async (challengeId: string, action: string) => {
    try {
      switch (action) {
        case 'accept':
          await acceptChallenge(challengeId);
          toast({
            title: 'Thành công',
            description: 'Đã chấp nhận challenge!',
          });
          break;
        case 'decline':
          await declineChallenge(challengeId);
          toast({
            title: 'Thành công',
            description: 'Đã từ chối challenge!',
          });
          break;
        case 'view':
          const challenge = challenges.find(c => c.id === challengeId);
          if (challenge) {
            setSelectedChallenge(challenge);
            setShowDetailsModal(true);
          }
          break;
      }
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Có lỗi xảy ra khi thực hiện hành động',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-orange-500';
      case 'accepted': return 'text-green-500';
      case 'completed': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ xác nhận';
      case 'accepted': return 'Đang diễn ra';
      case 'completed': return 'Hoàn thành';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Đang tải challenges...</span>
      </div>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            <h3 className="text-lg font-semibold">Challenges của tôi ({myChallenges.length})</h3>
          </div>
        </div>
        
        {myChallenges.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {myChallenges.map((challenge) => (
              <Card key={challenge.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="font-medium">
                      {challenge.challenger_id === user?.id ? 'vs ' : 'from '}
                      {challenge.challenger_id === user?.id 
                        ? (challenge as any).opponent_profile?.display_name || 'Unknown'
                        : (challenge as any).challenger_profile?.display_name || 'Unknown'
                      }
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center space-x-4">
                      <span className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        {(challenge as any).bet_amount?.toLocaleString() || 0}K
                      </span>
                      <span className="flex items-center">
                        <Trophy className="h-4 w-4 mr-1" />
                        {(challenge as any).challenge_type || 'Standard'}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {new Date(challenge.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className={getStatusColor(challenge.status)}>
                      {getStatusText(challenge.status)}
                    </Badge>
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleChallengeAction(challenge.id, 'view');
                        }}
                      >
                        Xem
                      </Button>
                      {challenge.status === 'pending' && challenge.opponent_id === user?.id && (
                        <>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleChallengeAction(challenge.id, 'accept');
                            }}
                          >
                            Chấp nhận
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleChallengeAction(challenge.id, 'decline');
                            }}
                          >
                            Từ chối
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              Chưa có challenge nào
            </h3>
            <p className="text-gray-500">
              Tạo challenge mới hoặc tham gia challenge có sẵn để bắt đầu
            </p>
          </div>
        )}

        {/* Challenge Details Modal */}
        {selectedChallenge && (
          <ChallengeDetailsModal
            challenge={selectedChallenge}
            isOpen={showDetailsModal}
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedChallenge(null);
            }}
            onUpdate={() => {
              // Refresh challenges will be handled by the hook
            }}
          />
        )}
      </div>
    </Card>
  );
};

// Challenge Overview component with real data
const ChallengeOverview = () => {
  const { challenges, loading } = useOptimizedChallenges();
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Calculate real stats
  const myChallenges = challenges.filter(
    c => c.challenger_id === user?.id || c.opponent_id === user?.id
  );
  
  const activeChallenges = challenges.filter(c => c.status === 'accepted').length;
  const pendingChallenges = myChallenges.filter(c => c.status === 'pending').length;
  const totalPrizePool = challenges.reduce((sum, c) => sum + ((c as any).bet_amount || 0), 0);
  
  // Recent notable challenges
  const featuredChallenges = challenges
    .filter(c => c.status === 'pending' && !c.opponent_id)
    .sort((a, b) => ((b as any).bet_amount || 0) - ((a as any).bet_amount || 0))
    .slice(0, 3);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Đang tải thống kê...</span>
      </div>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-semibold">Tổng quan Challenges</h3>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Tạo Challenge</span>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 border-l-4 border-green-500">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{activeChallenges}</div>
              <div className="text-sm text-muted-foreground">Challenges hoạt động</div>
            </div>
          </Card>
          <Card className="p-4 border-l-4 border-blue-500">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">{myChallenges.length}</div>
              <div className="text-sm text-muted-foreground">Challenges của bạn</div>
            </div>
          </Card>
          <Card className="p-4 border-l-4 border-yellow-500">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">{pendingChallenges}</div>
              <div className="text-sm text-muted-foreground">Chờ xác nhận</div>
            </div>
          </Card>
          <Card className="p-4 border-l-4 border-purple-500">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-500">{totalPrizePool.toLocaleString()}K</div>
              <div className="text-sm text-muted-foreground">Tổng tiền thưởng</div>
            </div>
          </Card>
        </div>

        {/* Featured Challenges */}
        <div className="mt-6">
          <h4 className="font-semibold mb-3 flex items-center">
            <Star className="h-4 w-4 mr-2 text-yellow-500" />
            Challenges nổi bật
          </h4>
          {featuredChallenges.length > 0 ? (
            <div className="space-y-2">
              {featuredChallenges.map((challenge) => (
                <Card key={challenge.id} className="p-3 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{(challenge as any).description || 'High Stakes Challenge'}</div>
                      <div className="text-sm text-muted-foreground flex items-center space-x-2">
                        <span>{((challenge as any).bet_amount || 0).toLocaleString()}K tiền thưởng</span>
                        <span>•</span>
                        <span>{(challenge as any).challenge_type || '1v1'}</span>
                        <span>•</span>
                        <span>by {(challenge as any).challenger_profile?.display_name || 'Unknown'}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-orange-500">
                      Chờ thách đấu
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <Trophy className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>Chưa có challenge nổi bật nào</p>
            </div>
          )}
        </div>

        {/* Create Challenge Modal */}
        {showCreateModal && (
          <UnifiedCreateChallengeModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
          />
        )}
      </div>
    </Card>
  );
};

// Enhanced Open Challenges component with advanced filtering
const EnhancedOpenChallenges = () => {
  const { challenges, loading, fetchChallenges } = useOptimizedChallenges();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [joiningChallenge, setJoiningChallenge] = useState<string | null>(null);

  // Enhanced filtering logic from EnhancedChallengesPageV2
  const getFilteredChallenges = () => {
    return challenges.filter(challenge => {
      // Basic filters
      const isOpenToJoin = !challenge.opponent_id && challenge.challenger_id !== user?.id;
      const matchesSearch = !searchTerm || [
        (challenge as any).description,
        (challenge as any).challenger_profile?.display_name,
        (challenge as any).challenger_profile?.full_name,
        (challenge as any).club_profiles?.club_name
      ].some(field => field?.toLowerCase().includes(searchTerm.toLowerCase()));

      // Status filter
      const matchesStatus = statusFilter === 'all' || challenge.status === statusFilter;

      // Type filter
      const matchesType = typeFilter === 'all' || (challenge as any).challenge_type === typeFilter;

      return isOpenToJoin && matchesSearch && matchesStatus && matchesType;
    }).sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'bet_amount':
          aValue = (a as any).bet_amount || 0;
          bValue = (b as any).bet_amount || 0;
          break;
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        default:
          aValue = a.created_at;
          bValue = b.created_at;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  const filteredChallenges = getFilteredChallenges();

  // Enhanced join challenge functionality
  const handleJoinChallenge = async (challengeId: string) => {
    if (!user) {
      toast({
        title: 'Cần đăng nhập',
        description: 'Vui lòng đăng nhập để tham gia challenge',
        variant: 'destructive',
      });
      return;
    }

    try {
      setJoiningChallenge(challengeId);
      
      // Check if challenge is still available
      const { data: currentChallenge } = await supabase
        .from('challenges')
        .select('*')
        .eq('id', challengeId)
        .single();

      if (currentChallenge?.opponent_id) {
        toast({
          title: 'Challenge đã có người tham gia',
          description: 'Challenge này đã được ai đó tham gia trước bạn.',
          variant: 'destructive',
        });
        await fetchChallenges();
        return;
      }
      
      // Update challenge with opponent_id
      const { error } = await supabase
        .from('challenges')
        .update({ 
          opponent_id: user.id,
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', challengeId);

      if (error) throw error;

      // Create notification for challenger
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: currentChallenge.challenger_id,
          type: 'challenge_accepted',
          title: 'Challenge được chấp nhận',
          message: `${user.user_metadata?.full_name || 'Một người chơi'} đã chấp nhận challenge của bạn`,
          data: { challenge_id: challengeId }
        });

      if (notifError) console.error('Error creating notification:', notifError);

      // Refresh challenges list
      await fetchChallenges();

      toast({
        title: 'Thành công',
        description: 'Đã tham gia challenge! Challenge bây giờ đang hoạt động.',
      });

    } catch (error) {
      console.error('Error joining challenge:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tham gia challenge. Vui lòng thử lại.',
        variant: 'destructive',
      });
    } finally {
      setJoiningChallenge(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Đang tải challenges...</span>
      </div>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Enhanced Search and Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Tìm kiếm challenges, người chơi, club..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Loại" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="sabo">SABO</SelectItem>
                <SelectItem value="tournament">Tournament</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Ngày tạo</SelectItem>
                <SelectItem value="bet_amount">Tiền cược</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Tìm thấy {filteredChallenges.length} challenges
          </p>
        </div>

        {/* Challenges List */}
        {filteredChallenges.length > 0 ? (
          <div className="space-y-3">
            {filteredChallenges.map((challenge) => (
              <Card key={challenge.id} className="p-4 hover:shadow-md transition-shadow border-l-4 border-l-green-500">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">
                        Challenge từ {(challenge as any).challenger_profile?.display_name || 'Unknown Player'}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        {(challenge as any).challenge_type || 'Standard'}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-muted-foreground grid grid-cols-2 md:grid-cols-4 gap-2">
                      <span className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        {((challenge as any).bet_amount || 0).toLocaleString()}K
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {new Date(challenge.created_at).toLocaleDateString()}
                      </span>
                      <span className="flex items-center">
                        <Trophy className="h-4 w-4 mr-1" />
                        ELO: {(challenge as any).challenger_profile?.elo_rating || 'N/A'}
                      </span>
                      <span className="flex items-center">
                        <Shield className="h-4 w-4 mr-1" />
                        Trust: {(challenge as any).trust_score || 'N/A'}%
                      </span>
                    </div>

                    {(challenge as any).description && (
                      <p className="text-sm mt-2 text-gray-600">
                        {(challenge as any).description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleJoinChallenge(challenge.id)}
                      disabled={joiningChallenge === challenge.id}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      {joiningChallenge === challenge.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-1" />
                          Tham gia
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              {searchTerm ? 'Không tìm thấy challenge phù hợp' : 'Chưa có challenge nào'}
            </h3>
            <p className="text-gray-500">
              {searchTerm ? 'Hãy thử từ khóa khác hoặc điều chỉnh bộ lọc' : 'Hãy tạo challenge đầu tiên của bạn'}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
  const { challenges, loading, fetchChallenges } = useOptimizedChallenges();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [joiningChallenge, setJoiningChallenge] = useState<string | null>(null);

  // Filter open challenges (no opponent yet)
  const openChallenges = challenges.filter(c => 
    c.status === 'pending' && 
    !c.opponent_id &&
    c.challenger_id !== user?.id // Don't show own challenges
  );

  const filteredChallenges = openChallenges.filter(challenge => {
    const matchesSearch = 
      (challenge as any).description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (challenge as any).challenger_profile?.display_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Enhanced join challenge functionality
  const handleJoinChallenge = async (challengeId: string) => {
    if (!user) {
      toast({
        title: 'Cần đăng nhập',
        description: 'Vui lòng đăng nhập để tham gia challenge',
        variant: 'destructive',
      });
      return;
    }

    try {
      setJoiningChallenge(challengeId);
      
      // Update challenge with opponent_id
      const { error } = await supabase
        .from('challenges')
        .update({ 
          opponent_id: user.id,
          status: 'accepted'
        })
        .eq('id', challengeId);

      if (error) throw error;

      // Refresh challenges list
      await fetchChallenges();

      toast({
        title: 'Thành công',
        description: 'Đã tham gia challenge! Challenge bây giờ đang hoạt động.',
      });

    } catch (error) {
      console.error('Error joining challenge:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tham gia challenge. Vui lòng thử lại.',
        variant: 'destructive',
      });
    } finally {
      setJoiningChallenge(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Đang tải challenges...</span>
      </div>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-green-500" />
            <h3 className="text-lg font-semibold">Open Challenges ({openChallenges.length})</h3>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm challenge..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {filteredChallenges.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredChallenges.map((challenge) => (
              <Card key={challenge.id} className="p-4 hover:shadow-md transition-shadow border-l-4 border-green-500">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="font-medium">
                      {(challenge as any).description || 'Challenge'} by {(challenge as any).challenger_profile?.display_name || 'Unknown'}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center space-x-4">
                      <span className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        {((challenge as any).bet_amount || 0).toLocaleString()}K tiền cược
                      </span>
                      <span className="flex items-center">
                        <Trophy className="h-4 w-4 mr-1" />
                        {(challenge as any).challenge_type || 'Standard'}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {new Date(challenge.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-green-500">
                      Có thể tham gia
                    </Badge>
                    <Button 
                      size="sm"
                      onClick={() => handleJoinChallenge(challenge.id)}
                      disabled={joiningChallenge === challenge.id}
                      className="flex items-center space-x-1"
                    >
                      {joiningChallenge === challenge.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowRight className="h-4 w-4" />
                      )}
                      <span>
                        {joiningChallenge === challenge.id ? 'Đang tham gia...' : 'Tham gia'}
                      </span>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              {searchTerm ? 'Không tìm thấy challenge nào' : 'Không có open challenge'}
            </h3>
            <p className="text-gray-500">
              {searchTerm ? 'Thử thay đổi từ khóa tìm kiếm' : 'Tạo challenge mới để bắt đầu'}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

// Loading component
const TabLoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
    <span className="ml-2 text-muted-foreground">Đang tải...</span>
  </div>
);

// Main ChallengesHub component
const ChallengesHub: React.FC = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Challenges Hub</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Tham gia thách đấu, tạo challenge mới và theo dõi tiến độ của bạn
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <Target className="h-4 w-4" />
            <span>Tổng quan</span>
          </TabsTrigger>
          <TabsTrigger value="my-challenges" className="flex items-center space-x-2">
            <Zap className="h-4 w-4" />
            <span>Của tôi</span>
          </TabsTrigger>
          <TabsTrigger value="open-challenges" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Mở</span>
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Nâng cao</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <ChallengeOverview />
        </TabsContent>

        <TabsContent value="my-challenges" className="space-y-6">
          <MyChallenges />
        </TabsContent>

        <TabsContent value="open-challenges" className="space-y-6">
          <EnhancedOpenChallenges />
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card className="p-6">
            <div className="text-center mb-4">
              <Settings className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <h3 className="text-lg font-semibold">Tính năng nâng cao</h3>
              <p className="text-muted-foreground">
                Truy cập đầy đủ tính năng challenge system với giao diện chuyên nghiệp
              </p>
            </div>
            <Suspense fallback={<TabLoadingSpinner />}>
              <EnhancedChallengesPageV2 />
            </Suspense>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ChallengesHub;
