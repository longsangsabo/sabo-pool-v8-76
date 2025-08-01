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
import { Search, Trophy, DollarSign, MapPin, Clock, Users, HelpCircle, Calculator, Loader2, Globe, Target, Shield } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { calculateSaboHandicap, type SaboRank, formatHandicapDisplay } from '@/utils/saboHandicap';
import SaboInfoDialog from '@/components/sabo/SaboInfoDialog';

interface UnifiedCreateChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChallengeCreated: () => void;
  variant?: 'standard' | 'admin';
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

const UnifiedCreateChallengeModal: React.FC<UnifiedCreateChallengeModalProps> = ({
  isOpen,
  onClose,
  onChallengeCreated,
  variant = 'standard'
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [challengeType, setChallengeType] = useState<'direct' | 'open'>('direct');
  const [showSaboInfo, setShowSaboInfo] = useState(false);
  
  const [formData, setFormData] = useState({
    opponent_id: '',
    opponent_search: '',
    bet_points: 100,
    race_to: 8,
    message: '',
    club_id: '',
    scheduled_time: '',
    is_sabo: false,
    handicap_1_rank: 0,
    handicap_05_rank: 0
  });

  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [searching, setSearching] = useState(false);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      fetchClubs();
      if (user?.id) {
        fetchCurrentUserProfile();
      }
    }
  }, [isOpen, user?.id]);

  const fetchCurrentUserProfile = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('current_rank, spa_points')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      setCurrentUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchClubs = async () => {
    try {
      const { data, error } = await supabase
        .from('club_profiles')
        .select('id, club_name, address')
        .order('club_name');
      
      if (error) throw error;
      
      const clubData = data?.map(club => ({
        id: club.id,
        name: club.club_name,
        address: club.address
      })) || [];
      
      setClubs(clubData);
    } catch (error) {
      console.error('Error fetching clubs:', error);
      toast.error('Không thể tải danh sách câu lạc bộ');
    }
  };

  const searchPlayers = async (searchTerm: string) => {
    if (!searchTerm.trim() || searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          user_id,
          full_name,
          avatar_url,
          current_rank,
          spa_points
        `)
        .or(`full_name.ilike.%${searchTerm}%,user_id.ilike.%${searchTerm}%`)
        .neq('user_id', user?.id)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching players:', error);
      toast.error('Không thể tìm kiếm người chơi');
    } finally {
      setSearching(false);
    }
  };

  const handlePlayerSelect = (player: Player) => {
    setSelectedPlayer(player);
    setFormData(prev => ({
      ...prev,
      opponent_id: player.user_id,
      opponent_search: player.full_name
    }));
    setSearchResults([]);
  };

  const handleBetChange = (points: number) => {
    const config = BET_CONFIGURATIONS.find(c => c.points === points);
    if (config) {
      setFormData(prev => ({
        ...prev,
        bet_points: points,
        race_to: config.raceTO
      }));
    }
  };

  const calculateHandicap = () => {
    if (!formData.is_sabo || !currentUserProfile || !selectedPlayer) return null;
    
    const challengerRank = currentUserProfile.current_rank as SaboRank;
    const opponentRank = selectedPlayer.current_rank as SaboRank;
    
    return calculateSaboHandicap(challengerRank, opponentRank);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (challengeType === 'direct' && !formData.opponent_id) {
      toast.error('Vui lòng chọn đối thủ');
      return;
    }

    if (!formData.club_id) {
      toast.error('Vui lòng chọn câu lạc bộ');
      return;
    }

    setLoading(true);
    try {
      const challengeData: any = {
        challenger_id: user?.id,
        bet_points: formData.bet_points,
        race_to: formData.race_to,
        message: formData.message || null,
        club_id: formData.club_id,
        status: challengeType === 'direct' ? 'pending' : 'open',
        scheduled_time: formData.scheduled_time || null,
        is_sabo: formData.is_sabo,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };

      if (challengeType === 'direct') {
        challengeData.opponent_id = formData.opponent_id;
      }

      if (formData.is_sabo) {
        const handicap = calculateHandicap();
        if (handicap) {
          challengeData.sabo_handicap_data = {
            challenger_rank: currentUserProfile?.current_rank,
            opponent_rank: selectedPlayer?.current_rank,
            handicap_description: handicap.description
          };
        }
      }

      const { error } = await supabase
        .from('challenges')
        .insert([challengeData]);

      if (error) throw error;

      toast.success(
        challengeType === 'direct' 
          ? 'Thách đấu đã được gửi thành công!' 
          : 'Thách đấu mở đã được tạo thành công!'
      );
      
      resetForm();
      onChallengeCreated();
      onClose();
    } catch (error) {
      console.error('Error creating challenge:', error);
      toast.error('Không thể tạo thách đấu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      opponent_id: '',
      opponent_search: '',
      bet_points: 100,
      race_to: 8,
      message: '',
      club_id: '',
      scheduled_time: '',
      is_sabo: false,
      handicap_1_rank: 0,
      handicap_05_rank: 0
    });
    setSelectedPlayer(null);
    setSearchResults([]);
    setChallengeType('direct');
  };

  const handicapInfo = calculateHandicap();

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {variant === 'admin' ? <Shield className="w-5 h-5" /> : <Trophy className="w-5 h-5" />}
              {variant === 'admin' ? 'Tạo thách đấu (Admin)' : 'Tạo thách đấu mới'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Challenge Type Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Loại thách đấu</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={challengeType === 'direct' ? 'default' : 'outline'}
                  onClick={() => setChallengeType('direct')}
                  className="justify-start"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Thách đấu trực tiếp
                </Button>
                <Button
                  type="button"
                  variant={challengeType === 'open' ? 'default' : 'outline'}
                  onClick={() => setChallengeType('open')}
                  className="justify-start"
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Thách đấu mở
                </Button>
              </div>
            </div>

            {/* Opponent Search - Only for direct challenges */}
            {challengeType === 'direct' && (
              <div className="space-y-3">
                <Label htmlFor="opponent-search">Tìm đối thủ</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="opponent-search"
                    placeholder="Nhập tên hoặc ID người chơi..."
                    value={formData.opponent_search}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData(prev => ({ ...prev, opponent_search: value }));
                      searchPlayers(value);
                    }}
                    className="pl-10"
                  />
                  {searching && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin" />
                  )}
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="border rounded-lg p-2 bg-background max-h-48 overflow-y-auto">
                    {searchResults.map((player) => (
                      <div
                        key={player.user_id}
                        className="flex items-center gap-3 p-2 rounded hover:bg-muted cursor-pointer"
                        onClick={() => handlePlayerSelect(player)}
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={player.avatar_url} />
                          <AvatarFallback>{player.full_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{player.full_name}</p>
                          <p className="text-sm text-muted-foreground">
                            Rank: {player.current_rank || 'K'} • {player.spa_points || 0} SPA
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Selected Player */}
                {selectedPlayer && (
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={selectedPlayer.avatar_url} />
                      <AvatarFallback>{selectedPlayer.full_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{selectedPlayer.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Rank: {selectedPlayer.current_rank || 'K'} • {selectedPlayer.spa_points || 0} SPA
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedPlayer(null);
                        setFormData(prev => ({ ...prev, opponent_id: '', opponent_search: '' }));
                      }}
                    >
                      ✕
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Bet Configuration */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Cấu hình cược</Label>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                {BET_CONFIGURATIONS.map((config) => (
                  <Button
                    key={config.points}
                    type="button"
                    variant={formData.bet_points === config.points ? 'default' : 'outline'}
                    onClick={() => handleBetChange(config.points)}
                    className="h-auto p-3 flex flex-col items-center text-center"
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <DollarSign className="w-4 h-4" />
                      <span className="font-bold">{config.points}</span>
                    </div>
                    <div className="text-xs">Race to {config.raceTO}</div>
                  </Button>
                ))}
              </div>
            </div>

            {/* SABO Toggle */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Label htmlFor="sabo-mode">Chế độ SABO</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSaboInfo(true)}
                  >
                    <HelpCircle className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Bật handicap dựa trên rank
                </p>
              </div>
              <Switch
                id="sabo-mode"
                checked={formData.is_sabo}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_sabo: checked }))}
              />
            </div>

            {/* SABO Handicap Info */}
            {formData.is_sabo && handicapInfo && selectedPlayer && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-800">Thông tin Handicap</span>
                </div>
                <div className="text-sm space-y-1">
                  <div>Handicap: {handicapInfo.description}</div>
                </div>
              </div>
            )}

            {/* Club Selection */}
            <div className="space-y-3">
              <Label htmlFor="club">Câu lạc bộ</Label>
              <Select value={formData.club_id} onValueChange={(value) => setFormData(prev => ({ ...prev, club_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn câu lạc bộ" />
                </SelectTrigger>
                <SelectContent>
                  {clubs.map((club) => (
                    <SelectItem key={club.id} value={club.id}>
                      <div>
                        <div className="font-medium">{club.name}</div>
                        <div className="text-sm text-muted-foreground">{club.address}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Scheduled Time */}
            <div className="space-y-3">
              <Label htmlFor="scheduled-time">Thời gian dự kiến (tùy chọn)</Label>
              <Input
                id="scheduled-time"
                type="datetime-local"
                value={formData.scheduled_time}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduled_time: e.target.value }))}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>

            {/* Message */}
            <div className="space-y-3">
              <Label htmlFor="message">Tin nhắn (tùy chọn)</Label>
              <Textarea
                id="message"
                placeholder="Thêm tin nhắn cho thách đấu..."
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={loading || (challengeType === 'direct' && !formData.opponent_id) || !formData.club_id}
                className="flex-1"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {challengeType === 'direct' ? 'Gửi thách đấu' : 'Tạo thách đấu mở'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* SABO Info Dialog */}
      {showSaboInfo && (
        <SaboInfoDialog
          isOpen={showSaboInfo}
          onClose={() => setShowSaboInfo(false)}
        />
      )}
    </>
  );
};

export default UnifiedCreateChallengeModal;