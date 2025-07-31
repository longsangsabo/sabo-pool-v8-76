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
import { Search, Trophy, DollarSign, MapPin, Clock, Users, HelpCircle, Calculator } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { calculateSaboHandicap, type SaboRank, formatHandicapDisplay } from '@/utils/saboHandicap';
import SaboInfoDialog from '@/components/sabo/SaboInfoDialog';

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
  const [isSaboMode, setIsSaboMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [userRank, setUserRank] = useState<SaboRank>('K');
  const [showSaboInfo, setShowSaboInfo] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchClubs();
      fetchUserRank();
    }
  }, [isOpen]);

  const fetchUserRank = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('current_rank')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      setUserRank(data?.current_rank || 'K');
    } catch (error) {
      console.error('Error fetching user rank:', error);
      setUserRank('K');
    }
  };

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
          verified_rank,
          current_rank
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
          current_rank: player.current_rank || player.verified_rank || 'K',
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
      
      // Calculate SABO handicap if in SABO mode
      let handicapData = null;
      if (isSaboMode && selectedPlayer?.current_rank) {
        const handicapResult = calculateSaboHandicap(
          userRank,
          selectedPlayer.current_rank as SaboRank,
          betPoints
        );
        
        if (!handicapResult.isValid) {
          toast.error(handicapResult.errorMessage || 'Không thể tạo thách đấu SABO');
          setLoading(false);
          return;
        }
        
        handicapData = {
          challenger_rank: handicapResult.challengerRank,
          opponent_rank: handicapResult.opponentRank,
          handicap_challenger: handicapResult.handicapChallenger,
          handicap_opponent: handicapResult.handicapOpponent,
          rank_difference: handicapResult.rankDifference,
          explanation: handicapResult.explanation
        };
      }

      const { error } = await supabase
        .from('challenges')
        .insert({
          challenger_id: user.id,
          opponent_id: isOpenChallenge ? null : selectedPlayer?.user_id,
          challenge_type: isSaboMode ? 'sabo' : 'standard',
          bet_points: betPoints,
          race_to: selectedConfig?.raceTO || 8,
          handicap_data: handicapData,
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
    setIsSaboMode(false);
    onClose();
  };

  const selectedConfig = BET_CONFIGURATIONS.find(config => config.points === betPoints);

  // Calculate SABO handicap preview
  const handicapPreview = isSaboMode && selectedPlayer?.current_rank 
    ? calculateSaboHandicap(userRank, selectedPlayer.current_rank as SaboRank, betPoints)
    : null;

  const canCreateChallenge = isOpenChallenge || (selectedPlayer && selectedPlayer.user_id && selectedPlayer.user_id.trim() !== '');
  
  // For SABO challenges, also check rank compatibility
  const saboCompatible = !isSaboMode || !selectedPlayer?.current_rank || 
    calculateSaboHandicap(userRank, selectedPlayer.current_rank as SaboRank, betPoints).isValid;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-background via-background to-muted/20 border-0 shadow-2xl backdrop-blur-xl animate-scale-in">
        <DialogHeader className="pb-6 border-b border-gradient-to-r from-transparent via-border to-transparent">
          <DialogTitle className="flex items-center gap-3 text-xl font-semibold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
              <Trophy className="w-5 h-5 text-primary" />
            </div>
            Tạo thách đấu mới
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-8 pt-2">
          {/* Challenge Type Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-muted/30 to-muted/10 border border-border/50">
              <Label className="flex items-center gap-3 text-base font-medium">
                <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                Loại thách đấu
              </Label>
              <div className="flex items-center gap-4 bg-background/80 px-4 py-2 rounded-lg border border-border/50">
                <span className={`text-sm transition-all duration-200 ${!isOpenChallenge ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                  Chọn đối thủ
                </span>
                <Switch
                  checked={isOpenChallenge}
                  onCheckedChange={setIsOpenChallenge}
                  className="data-[state=checked]:bg-green-500"
                />
                <span className={`text-sm transition-all duration-200 ${isOpenChallenge ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                  Thách đấu mở
                </span>
              </div>
            </div>
            
            {/* SABO Mode Toggle */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 via-blue-50/70 to-blue-100/30 border border-blue-200/50 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 font-medium px-3 py-1">
                    SABO
                  </Badge>
                  <span className="text-sm font-semibold text-blue-900">Chế độ SABO Professional</span>
                  {isSaboMode && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSaboInfo(true)}
                      className="h-7 w-7 p-0 text-blue-600 hover:bg-blue-200/50 rounded-full transition-all duration-200 hover:scale-110"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <Switch
                  checked={isSaboMode}
                  onCheckedChange={setIsSaboMode}
                  disabled={isOpenChallenge}
                  className="data-[state=checked]:bg-blue-500"
                />
              </div>
              
              {isSaboMode && (
                <div className="mt-3 p-3 bg-white/70 rounded-lg border border-blue-200/30 animate-fade-in">
                  <div className="text-sm text-blue-800 leading-relaxed">
                    <strong className="text-blue-900">Chế độ SABO:</strong> Hệ thống sẽ tự động tính toán handicap dựa trên chênh lệch hạng và mức cược
                  </div>
                </div>
              )}
            </div>
            
            {isOpenChallenge && (
              <div className="p-4 bg-gradient-to-br from-green-50 via-green-50/70 to-green-100/30 rounded-xl border border-green-200/50 shadow-sm animate-fade-in">
                <div className="text-sm text-green-800 leading-relaxed">
                  <strong className="text-green-900">Thách đấu mở:</strong> Bất kỳ người chơi nào cũng có thể chấp nhận thách đấu của bạn
                </div>
              </div>
            )}
          </div>

          {/* Player Search Section */}
          {!isOpenChallenge && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border/30">
                <Search className="w-4 h-4 text-primary" />
                <Label className="text-base font-semibold">Tìm kiếm đối thủ</Label>
              </div>
              
              <div className="relative group">
                <Search className="w-4 h-4 absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors duration-200" />
                <Input
                  placeholder="Nhập tên người chơi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-11 h-12 bg-muted/30 border-border/50 focus:bg-background focus:border-primary/50 transition-all duration-200 rounded-lg text-base"
                />
              </div>
              
              {searchLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
                  <div className="w-1 h-1 bg-primary rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <span className="ml-2">Đang tìm kiếm...</span>
                </div>
              )}

              {players.length > 0 && (
                <div className="max-h-48 overflow-y-auto rounded-xl border border-border/50 bg-background/50 backdrop-blur-sm shadow-sm">
                  {players.map((player, index) => (
                    <div
                      key={player.user_id}
                      className={`p-4 cursor-pointer transition-all duration-200 flex items-center gap-4 hover-scale ${
                        selectedPlayer?.user_id === player.user_id 
                          ? 'bg-gradient-to-r from-primary/10 to-primary/5 border-l-4 border-primary shadow-sm' 
                          : 'hover:bg-muted/50'
                      } ${index !== players.length - 1 ? 'border-b border-border/30' : ''}`}
                      onClick={() => {
                        console.log('Selecting player:', player);
                        setSelectedPlayer(player);
                      }}
                    >
                      <Avatar className="w-10 h-10 ring-2 ring-background shadow-sm">
                        <AvatarImage src={player.avatar_url} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                          {player.full_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-semibold text-foreground">{player.full_name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-3">
                          <span className="font-medium">Hạng {player.current_rank}</span>
                          <span>•</span>
                          <span>{player.spa_points} SPA</span>
                          {player.isClubMember && (
                            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                              CLB
                            </Badge>
                          )}
                          {player.hasRecentChallenges && (
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200">
                              Hoạt động
                            </Badge>
                          )}
                        </div>
                      </div>
                      {selectedPlayer?.user_id === player.user_id && (
                        <Badge className="bg-primary/10 text-primary border-primary/30 animate-scale-in">
                          Đã chọn
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
            )}

              {selectedPlayer && (
                <div className="p-4 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent rounded-xl border border-primary/20 shadow-sm animate-fade-in">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12 ring-2 ring-primary/20 shadow-md">
                      <AvatarImage src={selectedPlayer.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold text-lg">
                        {selectedPlayer.full_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-semibold text-lg text-foreground">
                        Đối thủ: {selectedPlayer.full_name}
                      </div>
                      <div className="text-sm text-muted-foreground font-medium">
                        Hạng {selectedPlayer.current_rank} • {selectedPlayer.spa_points} điểm SPA
                      </div>
                      
                      {/* SABO Handicap Preview */}
                      {isSaboMode && handicapPreview && (
                        <div className="mt-3 p-3 bg-gradient-to-br from-amber-50 to-amber-100/30 rounded-lg border border-amber-200/50 animate-fade-in">
                          <div className="flex items-center gap-2 mb-2">
                            <Calculator className="w-3 h-3 text-amber-600" />
                            <span className="text-xs font-semibold text-amber-800">Handicap SABO:</span>
                          </div>
                          <div className="text-sm">
                            {handicapPreview.isValid ? (
                              <span className={`font-medium ${
                                handicapPreview.handicapChallenger > 0 ? 'text-green-700' : 
                                handicapPreview.handicapOpponent > 0 ? 'text-blue-700' : 'text-muted-foreground'
                              }`}>
                                {handicapPreview.explanation}
                              </span>
                            ) : (
                              <span className="text-red-600 font-medium">
                                {handicapPreview.errorMessage}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                      <Trophy className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bet Configuration */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/30">
              <DollarSign className="w-4 h-4 text-primary" />
              <Label className="text-base font-semibold">Mức cược & Luật chơi</Label>
            </div>
            
            <Select value={betPoints.toString()} onValueChange={(value) => setBetPoints(parseInt(value))}>
              <SelectTrigger className="h-12 bg-muted/30 border-border/50 focus:bg-background focus:border-primary/50 transition-all duration-200 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/50 bg-background/95 backdrop-blur-sm shadow-lg">
                {BET_CONFIGURATIONS.map((config) => (
                  <SelectItem 
                    key={config.points} 
                    value={config.points.toString()}
                    className="rounded-lg hover:bg-primary/5 focus:bg-primary/10 transition-colors duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="font-mono">
                        {config.points}
                      </Badge>
                      <span>{config.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedConfig && (
              <div className="p-4 bg-gradient-to-br from-amber-50 via-amber-50/70 to-yellow-100/30 rounded-xl border border-amber-200/50 shadow-sm animate-fade-in">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-600" />
                    <span className="font-semibold text-amber-900">Race to {selectedConfig.raceTO}</span>
                  </div>
                  <div className="text-sm text-amber-800 leading-relaxed">
                    Người thắng nhận <strong>{selectedConfig.points} điểm</strong>, người thua mất <strong>{Math.floor(selectedConfig.points * 0.5)} điểm</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Club Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/30">
              <MapPin className="w-4 h-4 text-primary" />
              <Label className="text-base font-semibold">Câu lạc bộ (tùy chọn)</Label>
            </div>
            
            <Select value={selectedClub} onValueChange={setSelectedClub}>
              <SelectTrigger className="h-12 bg-muted/30 border-border/50 focus:bg-background focus:border-primary/50 transition-all duration-200 rounded-lg">
                <SelectValue placeholder="Chọn câu lạc bộ..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/50 bg-background/95 backdrop-blur-sm shadow-lg">
                {clubs.map((club) => (
                  <SelectItem 
                    key={club.id} 
                    value={club.id}
                    className="rounded-lg hover:bg-primary/5 focus:bg-primary/10 transition-colors duration-200"
                  >
                    <div className="flex flex-col items-start">
                      <div className="font-semibold">{club.name}</div>
                      <div className="text-sm text-muted-foreground">{club.address}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Scheduled Time */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/30">
              <Clock className="w-4 h-4 text-primary" />
              <Label className="text-base font-semibold">Thời gian đề xuất (tùy chọn)</Label>
            </div>
            
            <Input
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="h-12 bg-muted/30 border-border/50 focus:bg-background focus:border-primary/50 transition-all duration-200 rounded-lg"
            />
          </div>

          {/* Message */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/30">
              <MapPin className="w-4 h-4 text-primary" />
              <Label className="text-base font-semibold">Lời nhắn (tùy chọn)</Label>
            </div>
            
            <Textarea
              placeholder="Thêm lời nhắn cho đối thủ..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="bg-muted/30 border-border/50 focus:bg-background focus:border-primary/50 transition-all duration-200 rounded-lg resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-6 border-t border-border/30">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1 h-12 rounded-lg border-border/50 hover:bg-muted/50 transition-all duration-200"
              disabled={loading}
            >
              Hủy
            </Button>
            <Button
              onClick={handleCreateChallenge}
              disabled={loading || !canCreateChallenge || !saboCompatible}
              className="flex-1 h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span>Đang tạo thách đấu...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  <span>{`Tạo thách đấu${isSaboMode ? ' SABO' : ''}${selectedConfig ? ` (${selectedConfig.points} điểm)` : ''}`}</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
      
      {/* SABO Info Dialog */}
      <SaboInfoDialog 
        isOpen={showSaboInfo} 
        onClose={() => setShowSaboInfo(false)} 
      />
    </Dialog>
  );
};

export default CreateChallengeModal;
