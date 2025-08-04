import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ChallengeCard from './ChallengeCard';
import {
  Swords,
  Clock,
  Users,
  Trophy,
  Target,
  Filter,
  Search,
  Plus,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import CreateChallengeButton from './CreateChallengeButton';

interface Challenge {
  id: string;
  challenger_id: string;
  opponent_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled';
  stake_amount: number;
  challenge_type: string;
  message?: string;
  created_at: string;
  scheduled_time?: string;
  completed_at?: string;
  winner_id?: string;
  // Relations
  challenger_profile?: {
    full_name: string;
    display_name?: string;
    avatar_url?: string;
    verified_rank?: string;
  };
  opponent_profile?: {
    full_name: string;
    display_name?: string;
    avatar_url?: string;
    verified_rank?: string;
  };
}

interface UserChallengesListProps {
  className?: string;
}

const UserChallengesList = ({ className }: UserChallengesListProps) => {
  const { user } = useAuth();
  const [sentChallenges, setSentChallenges] = useState<Challenge[]>([]);
  const [receivedChallenges, setReceivedChallenges] = useState<Challenge[]>([]);
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [completedChallenges, setCompletedChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('received');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (user) {
      fetchChallenges();
    }
  }, [user]);

  const fetchChallenges = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch all challenges where user is involved
      const { data, error } = await supabase
        .from('challenges')
        .select(`
          *,
          challenger_profile:profiles!challenges_challenger_id_fkey(
            full_name, display_name, avatar_url, verified_rank
          ),
          opponent_profile:profiles!challenges_opponent_id_fkey(
            full_name, display_name, avatar_url, verified_rank
          )
        `)
        .or(`challenger_id.eq.${user.id},opponent_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const challenges = data || [];

      // Categorize challenges
      setSentChallenges(
        challenges.filter(c => c.challenger_id === user.id && c.status === 'pending')
      );
      setReceivedChallenges(
        challenges.filter(c => c.opponent_id === user.id && c.status === 'pending')
      );
      setActiveChallenges(
        challenges.filter(c => c.status === 'accepted')
      );
      setCompletedChallenges(
        challenges.filter(c => ['completed', 'cancelled', 'declined'].includes(c.status))
      );
    } catch (error: any) {
      console.error('Error fetching challenges:', error);
      toast.error('Lỗi khi tải danh sách thách đấu');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptChallenge = async (challengeId: string) => {
    try {
      const { error } = await supabase
        .from('challenges')
        .update({ status: 'accepted' })
        .eq('id', challengeId);

      if (error) throw error;

      toast.success('Đã chấp nhận thách đấu!');
      fetchChallenges();
    } catch (error: any) {
      console.error('Error accepting challenge:', error);
      toast.error('Lỗi khi chấp nhận thách đấu');
    }
  };

  const handleDeclineChallenge = async (challengeId: string) => {
    try {
      const { error } = await supabase
        .from('challenges')
        .update({ status: 'declined' })
        .eq('id', challengeId);

      if (error) throw error;

      toast.success('Đã từ chối thách đấu');
      fetchChallenges();
    } catch (error: any) {
      console.error('Error declining challenge:', error);
      toast.error('Lỗi khi từ chối thách đấu');
    }
  };

  const handleCancelChallenge = async (challengeId: string) => {
    try {
      const { error } = await supabase
        .from('challenges')
        .update({ status: 'cancelled' })
        .eq('id', challengeId);

      if (error) throw error;

      toast.success('Đã hủy thách đấu');
      fetchChallenges();
    } catch (error: any) {
      console.error('Error cancelling challenge:', error);
      toast.error('Lỗi khi hủy thách đấu');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: 'Chờ phản hồi', color: 'bg-yellow-100 text-yellow-800' },
      accepted: { label: 'Đã chấp nhận', color: 'bg-green-100 text-green-800' },
      declined: { label: 'Đã từ chối', color: 'bg-red-100 text-red-800' },
      completed: { label: 'Đã hoàn thành', color: 'bg-blue-100 text-blue-800' },
      cancelled: { label: 'Đã hủy', color: 'bg-gray-100 text-gray-800' },
    };
    const statusInfo = statusMap[status as keyof typeof statusMap];
    return (
      <Badge className={statusInfo.color}>
        {statusInfo.label}
      </Badge>
    );
  };

  const getChallengeTypeLabel = (type: string) => {
    const typeMap = {
      friendly: 'Giao hữu',
      ranked: 'Xếp hạng',
      tournament: 'Giải đấu',
      practice: 'Luyện tập',
    };
    return typeMap[type as keyof typeof typeMap] || type;
  };

  const filteredChallenges = (challenges: Challenge[]) => {
    return challenges.filter(challenge => {
      const opponentName = user?.id === challenge.challenger_id 
        ? challenge.opponent_profile?.display_name || challenge.opponent_profile?.full_name
        : challenge.challenger_profile?.display_name || challenge.challenger_profile?.full_name;
      
      const matchesSearch = opponentName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filter === 'all' || challenge.challenge_type === filter;
      return matchesSearch && matchesFilter;
    });
  };

  const ChallengeCard = ({ challenge }: { challenge: Challenge }) => {
    const isChallenger = challenge.challenger_id === user?.id;
    const opponent = isChallenger ? challenge.opponent_profile : challenge.challenger_profile;
    
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                {opponent?.avatar_url ? (
                  <img
                    src={opponent.avatar_url}
                    alt={opponent.display_name || opponent.full_name}
                    className="w-12 h-12 rounded-full"
                  />
                ) : (
                  <Users className="h-6 w-6 text-gray-500" />
                )}
              </div>
              <div>
                <h3 className="font-semibold">
                  {isChallenger ? 'Thách đấu với' : 'Thách đấu từ'} {opponent?.display_name || opponent?.full_name}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Trophy className="h-4 w-4" />
                  <span>{getChallengeTypeLabel(challenge.challenge_type)}</span>
                  <span>•</span>
                  <Target className="h-4 w-4" />
                  <span>{challenge.stake_amount.toLocaleString()} điểm</span>
                </div>
              </div>
            </div>
            {getStatusBadge(challenge.status)}
          </div>

          {challenge.message && (
            <p className="text-gray-600 mb-4 p-3 bg-gray-50 rounded">
              "{challenge.message}"
            </p>
          )}

          <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>
                {new Date(challenge.created_at).toLocaleDateString('vi-VN')} {new Date(challenge.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            {opponent?.verified_rank && (
              <Badge variant="outline">
                Rank: {opponent.verified_rank}
              </Badge>
            )}
          </div>

          {/* Action buttons */}
          {challenge.status === 'pending' && (
            <div className="flex gap-2">
              {!isChallenger ? (
                // Received challenge - can accept/decline
                <>
                  <Button
                    onClick={() => handleAcceptChallenge(challenge.id)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Chấp nhận
                  </Button>
                  <Button
                    onClick={() => handleDeclineChallenge(challenge.id)}
                    variant="outline"
                    className="flex-1"
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Từ chối
                  </Button>
                </>
              ) : (
                // Sent challenge - can cancel
                <Button
                  onClick={() => handleCancelChallenge(challenge.id)}
                  variant="outline"
                  className="w-full"
                >
                  Hủy thách đấu
                </Button>
              )}
            </div>
          )}

          {challenge.status === 'accepted' && (
            <div className="bg-green-50 p-3 rounded">
              <p className="text-green-800 text-sm">
                Thách đấu đã được chấp nhận. Hãy liên hệ để sắp xếp thời gian thi đấu.
              </p>
            </div>
          )}

          {challenge.status === 'completed' && challenge.winner_id && (
            <div className={`p-3 rounded ${challenge.winner_id === user?.id ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className={`text-sm ${challenge.winner_id === user?.id ? 'text-green-800' : 'text-red-800'}`}>
                {challenge.winner_id === user?.id ? '🎉 Bạn đã thắng!' : '😔 Bạn đã thua'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Thách đấu</h2>
        <CreateChallengeButton />
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm đối thủ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả</option>
              <option value="friendly">Giao hữu</option>
              <option value="ranked">Xếp hạng</option>
              <option value="tournament">Giải đấu</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="received">
            Nhận được ({receivedChallenges.length})
          </TabsTrigger>
          <TabsTrigger value="sent">
            Đã gửi ({sentChallenges.length})
          </TabsTrigger>
          <TabsTrigger value="active">
            Đang diễn ra ({activeChallenges.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Đã hoàn thành ({completedChallenges.length})
          </TabsTrigger>
        </TabsList>

        {/* Received Challenges */}
        <TabsContent value="received" className="space-y-4">
          {filteredChallenges(receivedChallenges).length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Swords className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">Không có thách đấu nào</p>
              </CardContent>
            </Card>
          ) : (
            filteredChallenges(receivedChallenges).map(challenge => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))
          )}
        </TabsContent>

        {/* Sent Challenges */}
        <TabsContent value="sent" className="space-y-4">
          {filteredChallenges(sentChallenges).length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">Bạn chưa gửi thách đấu nào</p>
              </CardContent>
            </Card>
          ) : (
            filteredChallenges(sentChallenges).map(challenge => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))
          )}
        </TabsContent>

        {/* Active Challenges */}
        <TabsContent value="active" className="space-y-4">
          {filteredChallenges(activeChallenges).length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">Không có thách đấu đang diễn ra</p>
              </CardContent>
            </Card>
          ) : (
            filteredChallenges(activeChallenges).map(challenge => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))
          )}
        </TabsContent>

        {/* Completed Challenges */}
        <TabsContent value="completed" className="space-y-4">
          {filteredChallenges(completedChallenges).length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">Chưa có thách đấu nào hoàn thành</p>
              </CardContent>
            </Card>
          ) : (
            filteredChallenges(completedChallenges).map(challenge => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserChallengesList;
