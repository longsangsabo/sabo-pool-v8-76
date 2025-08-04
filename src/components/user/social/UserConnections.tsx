import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserAvatar } from '../profile';
import {
  Users,
  UserPlus,
  UserCheck,
  UserMinus,
  Search,
  Filter,
  MessageCircle,
  Trophy,
  Target,
  Crown,
  Star,
} from 'lucide-react';

interface UserConnectionsProps {
  className?: string;
}

interface Connection {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  friend_profile: {
    id: string;
    full_name: string;
    display_name?: string;
    avatar_url?: string;
    current_rank?: string;
    verified_rank?: string;
    games_played: number;
    wins: number;
    elo_rating: number;
    is_online?: boolean;
    last_seen?: string;
  };
}

interface UserSuggestion {
  id: string;
  full_name: string;
  display_name?: string;
  avatar_url?: string;
  current_rank?: string;
  verified_rank?: string;
  mutual_friends: number;
  recent_activity: string;
  similarity_score: number;
}

const UserConnections = ({ className }: UserConnectionsProps) => {
  const { user } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Connection[]>([]);
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('friends');

  useEffect(() => {
    if (user?.id) {
      fetchConnections();
      fetchPendingRequests();
      fetchSuggestions();
    }
  }, [user?.id]);

  const fetchConnections = async () => {
    try {
      const { data, error } = await supabase
        .from('user_connections')
        .select(`
          *,
          friend_profile:profiles!user_connections_friend_id_fkey(
            id,
            full_name,
            display_name,
            avatar_url,
            current_rank,
            verified_rank,
            games_played,
            wins,
            elo_rating
          )
        `)
        .eq('user_id', user?.id)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConnections(data || []);
    } catch (error) {
      console.error('Error fetching connections:', error);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      // Sent requests
      const { data: sentData, error: sentError } = await supabase
        .from('user_connections')
        .select(`
          *,
          friend_profile:profiles!user_connections_friend_id_fkey(
            id,
            full_name,
            display_name,
            avatar_url,
            current_rank,
            verified_rank
          )
        `)
        .eq('user_id', user?.id)
        .eq('status', 'pending');

      // Received requests
      const { data: receivedData, error: receivedError } = await supabase
        .from('user_connections')
        .select(`
          *,
          friend_profile:profiles!user_connections_user_id_fkey(
            id,
            full_name,
            display_name,
            avatar_url,
            current_rank,
            verified_rank
          )
        `)
        .eq('friend_id', user?.id)
        .eq('status', 'pending');

      if (sentError || receivedError) throw sentError || receivedError;

      const allPending = [
        ...(sentData || []),
        ...(receivedData || [])
      ];

      setPendingRequests(allPending);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    }
  };

  const fetchSuggestions = async () => {
    try {
      // Mock suggestions - in real app would use recommendation algorithm
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          display_name,
          avatar_url,
          current_rank,
          verified_rank
        `)
        .neq('id', user?.id)
        .limit(10);

      if (error) throw error;

      const suggestions: UserSuggestion[] = (data || []).map(profile => ({
        ...profile,
        mutual_friends: Math.floor(Math.random() * 5), // Mock
        recent_activity: 'Thi đấu gần đây',
        similarity_score: Math.floor(Math.random() * 100),
      }));

      setSuggestions(suggestions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendFriendRequest = async (friendId: string) => {
    try {
      const { error } = await supabase
        .from('user_connections')
        .insert({
          user_id: user?.id,
          friend_id: friendId,
          status: 'pending'
        });

      if (error) throw error;

      toast.success('Đã gửi lời mời kết bạn!');
      fetchPendingRequests();
      
      // Remove from suggestions
      setSuggestions(suggestions.filter(s => s.id !== friendId));
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast.error('Gửi lời mời thất bại');
    }
  };

  const handleAcceptFriendRequest = async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from('user_connections')
        .update({ status: 'accepted' })
        .eq('id', connectionId);

      if (error) throw error;

      toast.success('Đã chấp nhận lời mời kết bạn!');
      fetchConnections();
      fetchPendingRequests();
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast.error('Chấp nhận lời mời thất bại');
    }
  };

  const handleDeclineFriendRequest = async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from('user_connections')
        .delete()
        .eq('id', connectionId);

      if (error) throw error;

      toast.success('Đã từ chối lời mời kết bạn');
      fetchPendingRequests();
    } catch (error) {
      console.error('Error declining friend request:', error);
      toast.error('Từ chối lời mời thất bại');
    }
  };

  const handleRemoveFriend = async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from('user_connections')
        .delete()
        .eq('id', connectionId);

      if (error) throw error;

      toast.success('Đã xóa bạn bè');
      fetchConnections();
    } catch (error) {
      console.error('Error removing friend:', error);
      toast.error('Xóa bạn bè thất bại');
    }
  };

  const getRankBadgeColor = (rank?: string) => {
    const colorMap: { [key: string]: string } = {
      'Bronze': 'bg-orange-100 text-orange-800',
      'Silver': 'bg-gray-100 text-gray-800',
      'Gold': 'bg-yellow-100 text-yellow-800',
      'Platinum': 'bg-cyan-100 text-cyan-800',
      'Diamond': 'bg-blue-100 text-blue-800',
      'Master': 'bg-purple-100 text-purple-800',
      'Grandmaster': 'bg-red-100 text-red-800',
    };
    return colorMap[rank || ''] || 'bg-gray-100 text-gray-800';
  };

  const getActivityIcon = (activity: string) => {
    if (activity.includes('Tournament')) return <Trophy className="h-4 w-4" />;
    if (activity.includes('Challenge')) return <Target className="h-4 w-4" />;
    if (activity.includes('Rank')) return <Crown className="h-4 w-4" />;
    return <Star className="h-4 w-4" />;
  };

  const filteredConnections = connections.filter(conn =>
    conn.friend_profile.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (conn.friend_profile.display_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSuggestions = suggestions.filter(user =>
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.display_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Bạn bè</p>
                <p className="text-2xl font-bold text-blue-600">
                  {connections.length}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Lời mời</p>
                <p className="text-2xl font-bold text-orange-600">
                  {pendingRequests.length}
                </p>
              </div>
              <UserPlus className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Gợi ý</p>
                <p className="text-2xl font-bold text-green-600">
                  {suggestions.length}
                </p>
              </div>
              <Star className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Tìm kiếm bạn bè..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Lọc
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="friends">
            Bạn bè ({connections.length})
          </TabsTrigger>
          <TabsTrigger value="requests">
            Lời mời ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="suggestions">
            Gợi ý ({suggestions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="mt-6">
          <div className="space-y-4">
            {filteredConnections.map((connection) => (
              <Card key={connection.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <UserAvatar
                        user={{
                          id: connection.friend_profile.id,
                          name: connection.friend_profile.display_name || connection.friend_profile.full_name,
                          avatar: connection.friend_profile.avatar_url,
                          rank: connection.friend_profile.verified_rank || connection.friend_profile.current_rank,
                        }}
                        size="lg"
                        showRank={true}
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold">
                          {connection.friend_profile.display_name || connection.friend_profile.full_name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Badge className={getRankBadgeColor(connection.friend_profile.current_rank)}>
                            {connection.friend_profile.current_rank || 'Unranked'}
                          </Badge>
                          <span>•</span>
                          <span>{connection.friend_profile.games_played} trận</span>
                          <span>•</span>
                          <span>ELO: {connection.friend_profile.elo_rating}</span>
                        </div>
                        <p className="text-xs text-gray-500">
                          Kết bạn từ {new Date(connection.created_at).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Nhắn tin
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleRemoveFriend(connection.id)}
                      >
                        <UserMinus className="h-4 w-4 mr-2" />
                        Hủy kết bạn
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredConnections.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="font-semibold text-gray-600 mb-2">
                    {searchQuery ? 'Không tìm thấy bạn bè' : 'Chưa có bạn bè nào'}
                  </h3>
                  <p className="text-gray-500">
                    {searchQuery 
                      ? 'Thử tìm kiếm với từ khóa khác'
                      : 'Hãy kết nối với những người chơi khác!'
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="requests" className="mt-6">
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <Card key={request.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <UserAvatar
                        user={{
                          id: request.friend_profile.id,
                          name: request.friend_profile.display_name || request.friend_profile.full_name,
                          avatar: request.friend_profile.avatar_url,
                          rank: request.friend_profile.verified_rank || request.friend_profile.current_rank,
                        }}
                        size="lg"
                        showRank={true}
                      />
                      <div>
                        <h3 className="font-semibold">
                          {request.friend_profile.display_name || request.friend_profile.full_name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {request.user_id === user?.id ? 'Đã gửi lời mời' : 'Muốn kết bạn với bạn'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(request.created_at).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {request.user_id !== user?.id ? (
                        // Received request
                        <>
                          <Button 
                            size="sm"
                            onClick={() => handleAcceptFriendRequest(request.id)}
                          >
                            <UserCheck className="h-4 w-4 mr-2" />
                            Chấp nhận
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeclineFriendRequest(request.id)}
                          >
                            <UserMinus className="h-4 w-4 mr-2" />
                            Từ chối
                          </Button>
                        </>
                      ) : (
                        // Sent request
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeclineFriendRequest(request.id)}
                        >
                          Hủy lời mời
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {pendingRequests.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <UserPlus className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="font-semibold text-gray-600 mb-2">
                    Không có lời mời nào
                  </h3>
                  <p className="text-gray-500">
                    Tất cả lời mời kết bạn sẽ xuất hiện ở đây
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="suggestions" className="mt-6">
          <div className="space-y-4">
            {filteredSuggestions.map((suggestion) => (
              <Card key={suggestion.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <UserAvatar
                        user={{
                          id: suggestion.id,
                          name: suggestion.display_name || suggestion.full_name,
                          avatar: suggestion.avatar_url,
                          rank: suggestion.verified_rank || suggestion.current_rank,
                        }}
                        size="lg"
                        showRank={true}
                      />
                      <div>
                        <h3 className="font-semibold">
                          {suggestion.display_name || suggestion.full_name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Badge className={getRankBadgeColor(suggestion.current_rank)}>
                            {suggestion.current_rank || 'Unranked'}
                          </Badge>
                          {suggestion.mutual_friends > 0 && (
                            <>
                              <span>•</span>
                              <span>{suggestion.mutual_friends} bạn chung</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          {getActivityIcon(suggestion.recent_activity)}
                          <span>{suggestion.recent_activity}</span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => handleSendFriendRequest(suggestion.id)}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Kết bạn
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredSuggestions.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Star className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="font-semibold text-gray-600 mb-2">
                    {searchQuery ? 'Không tìm thấy người dùng' : 'Không có gợi ý nào'}
                  </h3>
                  <p className="text-gray-500">
                    {searchQuery 
                      ? 'Thử tìm kiếm với từ khóa khác'
                      : 'Hệ thống sẽ gợi ý bạn bè phù hợp cho bạn'
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserConnections;
