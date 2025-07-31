import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Shield, Users, DollarSign, MapPin, MessageSquare, RefreshCw, Search, CheckCircle } from 'lucide-react';
import { performanceService } from '@/services/PerformanceOptimizationService';
import { Switch } from '@/components/ui/switch';

interface AdminCreateChallengeModalProps {
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
}

interface Club {
  id: string;
  club_name: string;
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

const AdminCreateChallengeModal: React.FC<AdminCreateChallengeModalProps> = ({
  isOpen,
  onClose,
  onChallengeCreated,
}) => {
  const { user } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedChallenger, setSelectedChallenger] = useState('');
  const [selectedOpponent, setSelectedOpponent] = useState('');
  const [selectedClub, setSelectedClub] = useState('');
  const [betPoints, setBetPoints] = useState(300);
  const [message, setMessage] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [autoAccept, setAutoAccept] = useState(true); // New state for auto-accept option
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (isOpen) {
      loadPlayerData();
      fetchClubs();
    }
  }, [isOpen, refreshKey]);

  const loadPlayerData = async () => {
    await fetchPlayers();
  };

  const refreshPlayerData = () => {
    setRefreshKey(prev => prev + 1);
  };

  useEffect(() => {
    if (!isOpen) return;

    const debouncedRefresh = performanceService.debounce(refreshPlayerData, 1000);
    
    const channel = supabase
      .channel('spa-data-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallets' }, debouncedRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'player_rankings' }, debouncedRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'spa_points_log' }, debouncedRefresh)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen]);

  const fetchPlayers = async () => {
    setLoadingPlayers(true);
    try {
      const { data: playersData, error: playersError } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, role, is_admin')
        .in('role', ['player', 'admin'])
        .order('full_name');

      if (playersError) throw playersError;

      const playerIds = playersData?.map(p => p.user_id) || [];
      
      const [walletsData, rankingsData] = await Promise.all([
        supabase.from('wallets').select('user_id, points_balance').in('user_id', playerIds),
        supabase.from('player_rankings').select('user_id, spa_points, current_rank_id').in('user_id', playerIds)
      ]);

      const rankIds = rankingsData.data?.map(r => r.current_rank_id).filter(Boolean) || [];
      const { data: ranksData } = await supabase
        .from('ranks')
        .select('id, code')
        .in('id', rankIds);

      const formattedPlayers = playersData?.map(player => {
        const wallet = walletsData.data?.find(w => w.user_id === player.user_id);
        const ranking = rankingsData.data?.find(r => r.user_id === player.user_id);
        const rank = ranksData?.find(r => r.id === ranking?.current_rank_id);
        
        return {
          user_id: player.user_id,
          full_name: player.full_name || 'Người chơi',
          avatar_url: player.avatar_url,
          current_rank: rank?.code || 'K',
          spa_points: wallet?.points_balance ?? ranking?.spa_points ?? 0,
        };
      }) || [];

      setPlayers(formattedPlayers);
    } catch (error) {
      console.error('Error fetching players:', error);
      toast.error('Lỗi khi tải danh sách người chơi');
    } finally {
      setLoadingPlayers(false);
    }
  };

  const fetchClubs = async () => {
    try {
      const { data, error } = await supabase
        .from('club_profiles')
        .select('id, club_name, address')
        .eq('verification_status', 'approved')
        .order('club_name');

      if (error) throw error;
      setClubs(data || []);
    } catch (error) {
      console.error('Error fetching clubs:', error);
    }
  };

  const handleCreateChallenge = async () => {
    if (!user) {
      toast.error('Bạn cần đăng nhập để sử dụng tính năng admin');
      return;
    }

    if (!selectedChallenger || !selectedOpponent) {
      toast.error('Vui lòng chọn cả challenger và opponent');
      return;
    }

    if (selectedChallenger === selectedOpponent) {
      toast.error('Challenger và opponent phải khác nhau');
      return;
    }

    setLoading(true);
    try {
      const selectedConfig = BET_CONFIGURATIONS.find(config => config.points === betPoints);
      
      // Direct challenge creation since admin_create_sabo_challenge function doesn't exist
      const { data, error } = await supabase
        .from('challenges')
        .insert({
          challenger_id: selectedChallenger,
          opponent_id: selectedOpponent,
          challenge_message: message || `Admin challenge: ${betPoints} SPA points`,
          status: autoAccept ? 'accepted' : 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        toast.success(`Thách đấu đã được tạo thành công ${autoAccept ? 'và tự động chấp nhận' : ''}!`);
        onChallengeCreated();
        handleClose();
      } else {
        throw new Error('Failed to create challenge');
      }
    } catch (error: any) {
      console.error('Error creating admin challenge:', error);
      toast.error('Lỗi khi tạo thách đấu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedChallenger('');
    setSelectedOpponent('');
    setSelectedClub('');
    setBetPoints(300);
    setMessage('');
    setAutoAccept(true);
    setAdminNotes('');
    onClose();
  };

  const selectedConfig = BET_CONFIGURATIONS.find(config => config.points === betPoints);
  
  const filteredPlayers = useMemo(() => {
    if (!searchTerm) return players;
    return players.filter(player => 
      player.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [players, searchTerm]);
  
  const challengerData = players.find(p => p.user_id === selectedChallenger);
  const opponentData = players.find(p => p.user_id === selectedOpponent);

  const canCreateChallenge = selectedChallenger && selectedOpponent && 
    selectedChallenger !== selectedOpponent && 
    challengerData?.spa_points >= betPoints && 
    opponentData?.spa_points >= betPoints;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-500" />
            Admin: Tạo thách đấu thay mặt người chơi
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                console.log('Manual refresh triggered');
                refreshPlayerData();
              }}
              className="ml-auto"
              title="Refresh player data"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Admin Warning */}
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center gap-2 text-destructive">
              <Shield className="w-4 h-4" />
              <span className="font-medium text-sm">Chế độ Admin</span>
            </div>
            <p className="text-xs text-destructive/80 mt-1">
              Tạo thách đấu thay mặt người chơi. Hành động sẽ được ghi log.
            </p>
          </div>

          {/* Search Players */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm người chơi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Players Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Challenger Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4" />
                Người thách đấu
              </Label>
              {loadingPlayers ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={selectedChallenger} onValueChange={setSelectedChallenger}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Chọn người thách đấu..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {filteredPlayers.map((player) => (
                      <SelectItem key={player.user_id} value={player.user_id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={player.avatar_url} />
                            <AvatarFallback className="text-xs">{player.full_name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{player.full_name}</span>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Badge variant="secondary" className="text-xs px-1 py-0">
                                {player.current_rank}
                              </Badge>
                              <span className={player.spa_points < betPoints ? 'text-destructive' : ''}>
                                {player.spa_points} SPA
                              </span>
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {challengerData && (
                <div className={`p-2 rounded border ${challengerData.spa_points < betPoints ? 'bg-destructive/10 border-destructive/20' : 'bg-primary/10 border-primary/20'}`}>
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={challengerData.avatar_url} />
                      <AvatarFallback className="text-xs">{challengerData.full_name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{challengerData.full_name}</div>
                      <div className="text-xs text-muted-foreground">
                        Hạng {challengerData.current_rank} • 
                        <span className={challengerData.spa_points < betPoints ? 'text-destructive font-medium' : ''}>
                          {challengerData.spa_points} SPA
                        </span>
                      </div>
                    </div>
                  </div>
                  {challengerData.spa_points < betPoints && (
                    <div className="text-xs text-destructive mt-1">
                      Không đủ SPA (cần {betPoints})
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Opponent Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4" />
                Đối thủ
              </Label>
              {loadingPlayers ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={selectedOpponent} onValueChange={setSelectedOpponent}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Chọn đối thủ..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {filteredPlayers.filter(p => p.user_id !== selectedChallenger).map((player) => (
                      <SelectItem key={player.user_id} value={player.user_id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={player.avatar_url} />
                            <AvatarFallback className="text-xs">{player.full_name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{player.full_name}</span>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Badge variant="secondary" className="text-xs px-1 py-0">
                                {player.current_rank}
                              </Badge>
                              <span className={player.spa_points < betPoints ? 'text-destructive' : ''}>
                                {player.spa_points} SPA
                              </span>
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {opponentData && (
                <div className={`p-2 rounded border ${opponentData.spa_points < betPoints ? 'bg-destructive/10 border-destructive/20' : 'bg-secondary/50 border-secondary'}`}>
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={opponentData.avatar_url} />
                      <AvatarFallback className="text-xs">{opponentData.full_name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{opponentData.full_name}</div>
                      <div className="text-xs text-muted-foreground">
                        Hạng {opponentData.current_rank} • 
                        <span className={opponentData.spa_points < betPoints ? 'text-destructive font-medium' : ''}>
                          {opponentData.spa_points} SPA
                        </span>
                      </div>
                    </div>
                  </div>
                  {opponentData.spa_points < betPoints && (
                    <div className="text-xs text-destructive mt-1">
                      Không đủ SPA (cần {betPoints})
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bet Configuration */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
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
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium">{config.points} điểm</span>
                      <Badge variant="outline" className="text-xs">
                        Race to {config.raceTO}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedConfig && (
              <div className="p-2 bg-muted/50 rounded-lg">
                <div className="text-xs font-medium">
                  Race to {selectedConfig.raceTO} • Thắng: +{selectedConfig.points} • Thua: -{Math.floor(selectedConfig.points * 0.5)}
                </div>
              </div>
            )}
          </div>

          {/* Club & Messages */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4" />
                Câu lạc bộ
              </Label>
              <Select value={selectedClub} onValueChange={setSelectedClub}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn câu lạc bộ..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không chọn</SelectItem>
                  {clubs.map((club) => (
                    <SelectItem key={club.id} value={club.id}>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{club.club_name}</span>
                        <span className="text-xs text-muted-foreground truncate">{club.address}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <MessageSquare className="w-4 h-4" />
                Thông điệp
              </Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Thông điệp thách đấu..."
                rows={2}
                className="text-sm"
              />
            </div>
          </div>

          {/* Auto Accept Option */}
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <CheckCircle className="w-4 h-4" />
                  Tự động chấp nhận thách đấu
                </Label>
                <p className="text-xs text-muted-foreground">
                  Thách đấu sẽ được chấp nhận ngay lập tức thay vì chờ xác nhận
                </p>
              </div>
              <Switch
                checked={autoAccept}
                onCheckedChange={setAutoAccept}
              />
            </div>
          </div>

          {/* Admin Notes */}
          <div className="space-y-2">
            <Label className="text-sm">Ghi chú Admin</Label>
            <Textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Ghi chú nội bộ..."
              rows={2}
              className="text-sm"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2 border-t">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1 h-9"
              disabled={loading}
            >
              Hủy
            </Button>
            <Button
              onClick={handleCreateChallenge}
              disabled={loading || !canCreateChallenge}
              className="flex-1 h-9"
            >
              {loading ? 'Đang tạo...' : 'Tạo thách đấu'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminCreateChallengeModal;