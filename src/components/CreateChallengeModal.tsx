import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Search, Trophy, DollarSign, MapPin, Clock, Users } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface CreateChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChallengeCreated: () => void;
}

interface Player {
  user_id: string;
  full_name: string;
  avatar_url?: string;
  current_rank?: string;
  spa_points?: number;
  isClubMember?: boolean;
  hasRecentChallenges?: boolean;
}

interface Club {
  id: string;
  name: string;
  address: string;
}

const BET_CONFIGURATIONS = [
  { points: 100, raceTO: 8, description: 'Thách đấu sơ cấp - Race to 8' },
  { points: 200, raceTO: 12, description: 'Thách đấu cơ bản - Race to 12' },
  { points: 300, raceTO: 14, description: 'Thách đấu trung bình - Race to 14' },
  { points: 400, raceTO: 16, description: 'Thách đấu trung cấp - Race to 16' },
  { points: 500, raceTO: 18, description: 'Thách đấu trung cao - Race to 18' },
  { points: 600, raceTO: 22, description: 'Thách đấu cao cấp - Race to 22' },
];

const CreateChallengeModal: React.FC<CreateChallengeModalProps> = ({
  isOpen,
  onClose,
  onChallengeCreated,
}) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedClub, setSelectedClub] = useState('');
  const [betPoints, setBetPoints] = useState(300);
  const [message, setMessage] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isOpenChallenge, setIsOpenChallenge] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchClubs();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpenChallenge) {
      setSelectedPlayer(null);
      setSearchTerm('');
      setPlayers([]);
    }
  }, [isOpenChallenge]);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchPlayers();
    } else {
      setPlayers([]);
    }
  }, [searchTerm, selectedClub]);

  const fetchClubs = async () => {
    try {
      const { data, error } = await supabase
        .from('clubs')
        .select('id, name, address')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setClubs(data || []);
    } catch (error) {
      console.error('Error fetching clubs:', error);
    }
  };

  const searchPlayers = async () => {
    if (!user) return;
    
    setSearchLoading(true);
    try {
      // Get active players
      const { data: activePlayersData, error: activeError } = await supabase
        .from('profiles')
        .select(`
          user_id,
          full_name,
          avatar_url,
          elo,
          verified_rank
        `)
        .neq('user_id', user.id)
        .ilike('full_name', `%${searchTerm}%`)
        .limit(10);

      if (activeError) throw activeError;

      // Get their ranking info separately
      const playerIds = activePlayersData?.map(p => p.user_id) || [];
      const rankingsData = activePlayersData;

      // Get club members if club is selected (skip for now as we don't have memberships table)
      let clubMemberIds: string[] = [];

      // Get recent challengers
      const { data: recentChallenges } = await supabase
        .from('challenges')
        .select('challenger_id')
        .neq('challenger_id', user.id)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
      
      const recentChallengerIds = recentChallenges?.map(c => c.challenger_id) || [];

      // Combine data
      const formattedPlayers = activePlayersData?.map(player => {
        return {
          user_id: player.user_id,
          full_name: player.full_name || 'Người chơi',
          avatar_url: player.avatar_url,
          current_rank: player.verified_rank || 'K',
          spa_points: player.elo || 1000,
          isClubMember: clubMemberIds.includes(player.user_id),
          hasRecentChallenges: recentChallengerIds.includes(player.user_id),
        };
      }) || [];

      // Sort by priority: club members first, then recent challengers, then by SPA points
      formattedPlayers.sort((a, b) => {
        if (a.isClubMember && !b.isClubMember) return -1;
        if (!a.isClubMember && b.isClubMember) return 1;
        if (a.hasRecentChallenges && !b.hasRecentChallenges) return -1;
        if (!a.hasRecentChallenges && b.hasRecentChallenges) return 1;
        return (b.spa_points || 0) - (a.spa_points || 0);
      });

      setPlayers(formattedPlayers.slice(0, 10));
    } catch (error) {
      console.error('Error searching players:', error);
      // Fallback to simple search
      const { data, error: fallbackError } = await supabase
        .from('profiles')
        .select(`
          user_id,
          full_name,
          avatar_url
        `)
        .neq('user_id', user.id)
        .ilike('full_name', `%${searchTerm}%`)
        .limit(10);

      if (!fallbackError) {
        const formattedPlayers = data?.map(player => ({
          user_id: player.user_id,
          full_name: player.full_name || 'Người chơi',
          avatar_url: player.avatar_url,
          current_rank: 'K',
          spa_points: 0,
        })) || [];
        setPlayers(formattedPlayers);
      }
    } finally {
      setSearchLoading(false);
    }
  };

  const handleCreateChallenge = async () => {
    if (!user) {
      toast.error('Bạn cần đăng nhập để tạo thách đấu');
      return;
    }

    // Validate selected opponent for specific challenges
    if (!isOpenChallenge && (!selectedPlayer || !selectedPlayer.user_id || selectedPlayer.user_id.trim() === '')) {
      toast.error('Vui lòng chọn đối thủ hợp lệ hoặc chuyển sang thách đấu mở');
      return;
    }

    // Check if user has enough ELO points
    const { data: userRanking } = await supabase
      .from('profiles')
      .select('elo')
      .eq('user_id', user.id)
      .single();

    if (!userRanking || userRanking.elo < betPoints) {
      toast.error(`Bạn cần có ít nhất ${betPoints} điểm ELO để tạo thách đấu này!`);
      return;
    }

    setLoading(true);
    try {
      const selectedConfig = BET_CONFIGURATIONS.find(config => config.points === betPoints);
      
      const { error } = await supabase
        .from('challenges')
        .insert({
          challenger_id: user.id,
          opponent_id: isOpenChallenge ? null : selectedPlayer?.user_id,
          challenge_message: message || null,
          status: 'pending',
        });

      if (error) throw error;

      // Create notification based on challenge type
      if (isOpenChallenge) {
        // For open challenges, create a general system notification (optional)
        // We could notify club members if a club is selected, but for now we'll skip this
        toast.success('Thách đấu mở đã được tạo thành công!');
      } else if (selectedPlayer && selectedPlayer.user_id) {
        // Create notification for the specific opponent - only if user_id is valid
        try {
          await supabase.from('notifications').insert({
            user_id: selectedPlayer.user_id,
            type: 'challenge_received',
            title: 'Thách đấu mới!',
            message: `${user.user_metadata?.full_name || 'Một người chơi'} đã gửi thách đấu cho bạn`,
            action_url: '/challenges',
            priority: 'high'
          });
          toast.success('Thách đấu đã được gửi thành công!');
        } catch (notificationError) {
          console.error('Error creating notification:', notificationError);
          // Don't block challenge creation if notification fails
          toast.success('Thách đấu đã được tạo thành công!');
        }
      } else {
        // For challenges without valid opponent (shouldn't happen but safety check)
        toast.success('Thách đấu đã được tạo thành công!');
      }

      onChallengeCreated();
      handleClose();
    } catch (error: any) {
      console.error('Error creating challenge:', error);
      toast.error('Lỗi khi tạo thách đấu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSearchTerm('');
    setPlayers([]);
    setSelectedPlayer(null);
    setSelectedClub('');
    setBetPoints(300);
    setMessage('');
    setScheduledTime('');
    setIsOpenChallenge(false);
    onClose();
  };

  const selectedConfig = BET_CONFIGURATIONS.find(config => config.points === betPoints);

  const canCreateChallenge = isOpenChallenge || (selectedPlayer && selectedPlayer.user_id && selectedPlayer.user_id.trim() !== '');

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Tạo thách đấu mới
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Challenge Type Toggle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Loại thách đấu
              </Label>
              <div className="flex items-center gap-3">
                <span className={`text-sm ${!isOpenChallenge ? 'font-medium' : 'text-gray-500'}`}>
                  Chọn đối thủ
                </span>
                <Switch
                  checked={isOpenChallenge}
                  onCheckedChange={setIsOpenChallenge}
                />
                <span className={`text-sm ${isOpenChallenge ? 'font-medium' : 'text-gray-500'}`}>
                  Thách đấu mở
                </span>
              </div>
            </div>
            {isOpenChallenge && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="text-sm text-green-800">
                  <strong>Thách đấu mở:</strong> Bất kỳ người chơi nào cũng có thể chấp nhận thách đấu của bạn
                </div>
              </div>
            )}
          </div>

          {/* Player Search - only show if not open challenge */}
          {!isOpenChallenge && (
          <div className="space-y-2">
            <Label>Tìm kiếm đối thủ</Label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Nhập tên người chơi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {searchLoading && (
              <div className="text-sm text-gray-500">Đang tìm kiếm...</div>
            )}

            {players.length > 0 && (
              <div className="max-h-40 overflow-y-auto border rounded-lg">
                {players.map((player) => (
                  <div
                    key={player.user_id}
                    className={`p-3 cursor-pointer hover:bg-gray-50 flex items-center gap-3 ${
                      selectedPlayer?.user_id === player.user_id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => {
                      console.log('Selecting player:', player);
                      setSelectedPlayer(player);
                    }}
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={player.avatar_url} />
                      <AvatarFallback>{player.full_name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium">{player.full_name}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-2">
                        <span>Hạng {player.current_rank} • {player.spa_points} SPA</span>
                        {player.isClubMember && <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">CLB</span>}
                        {player.hasRecentChallenges && <span className="text-xs bg-green-100 text-green-800 px-1 rounded">Hoạt động</span>}
                      </div>
                    </div>
                    {selectedPlayer?.user_id === player.user_id && (
                      <Badge variant="default">Đã chọn</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}

            {selectedPlayer && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={selectedPlayer.avatar_url} />
                    <AvatarFallback>{selectedPlayer.full_name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">Đối thủ: {selectedPlayer.full_name}</div>
                    <div className="text-sm text-gray-600">
                      Hạng {selectedPlayer.current_rank} • {selectedPlayer.spa_points} điểm SPA
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          )}

          {/* Bet Configuration */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Mức cược & Luật chơi
            </Label>
            <Select value={betPoints.toString()} onValueChange={(value) => setBetPoints(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BET_CONFIGURATIONS.map((config) => (
                  <SelectItem key={config.points} value={config.points.toString()}>
                    <div className="flex flex-col">
                      <span className="font-medium">{config.points} điểm</span>
                      <span className="text-sm text-gray-500">{config.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedConfig && (
              <div className="p-3 bg-yellow-50 rounded-lg">
                <div className="text-sm">
                  <strong>Luật chơi:</strong> Race to {selectedConfig.raceTO}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Người thắng nhận {selectedConfig.points} điểm, người thua mất {Math.floor(selectedConfig.points * 0.5)} điểm
                </div>
              </div>
            )}
          </div>

          {/* Club Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Câu lạc bộ (tùy chọn)
            </Label>
            <Select value={selectedClub} onValueChange={setSelectedClub}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn câu lạc bộ..." />
              </SelectTrigger>
              <SelectContent>
                {clubs.map((club) => (
                  <SelectItem key={club.id} value={club.id}>
                    <div>
                      <div className="font-medium">{club.name}</div>
                      <div className="text-sm text-gray-500">{club.address}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Scheduled Time */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Thời gian đề xuất (tùy chọn)
            </Label>
            <Input
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label>Lời nhắn (tùy chọn)</Label>
            <Textarea
              placeholder="Thêm lời nhắn cho đối thủ..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Hủy
            </Button>
            <Button
              onClick={handleCreateChallenge}
              disabled={loading || !canCreateChallenge}
              className="flex-1"
            >
              {loading ? 'Đang tạo...' : 'Tạo thách đấu'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateChallengeModal;
