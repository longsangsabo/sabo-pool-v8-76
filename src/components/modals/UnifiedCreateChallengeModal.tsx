import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useChallenges } from '@/hooks/useChallenges';
import { toast } from 'sonner';
import {
  Search,
  Trophy,
  MapPin,
  Clock,
  Users,
  HelpCircle,
  Calculator,
  Loader2,
  Globe,
  Target,
  Shield,
  Star,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import {
  calculateSaboHandicap,
  type SaboRank,
  formatHandicapDisplay,
} from '@/utils/saboHandicap';
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

const UnifiedCreateChallengeModal: React.FC<
  UnifiedCreateChallengeModalProps
> = ({ isOpen, onClose, onChallengeCreated, variant = 'standard' }) => {
  const { user } = useAuth();
  const { createChallenge } = useChallenges();
  const [loading, setLoading] = useState(false);
  const [challengeType, setChallengeType] = useState<'direct' | 'open'>(
    'direct'
  );
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
    handicap_05_rank: 0,
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
        .from('player_rankings')
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

      const clubData =
        data?.map(club => ({
          id: club.id,
          name: club.club_name,
          address: club.address,
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
        .select(
          `
          user_id,
          full_name,
          avatar_url
        `
        )
        .or(`full_name.ilike.%${searchTerm}%,user_id.ilike.%${searchTerm}%`)
        .neq('user_id', user?.id)
        .limit(10);

      if (error) throw error;

      // Get ranking data separately and merge
      const playersWithRanking = await Promise.all(
        (data || []).map(async player => {
          const { data: ranking } = await supabase
            .from('player_rankings')
            .select('current_rank, spa_points')
            .eq('user_id', player.user_id)
            .single();

          return {
            ...player,
            current_rank: ranking?.current_rank,
            spa_points: ranking?.spa_points || 0,
          };
        })
      );

      setSearchResults(playersWithRanking);
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
      opponent_search: player.full_name,
    }));
    setSearchResults([]);
  };

  const handleBetChange = (points: number) => {
    const config = BET_CONFIGURATIONS.find(c => c.points === points);
    if (config) {
      setFormData(prev => ({
        ...prev,
        bet_points: points,
        race_to: config.raceTO,
      }));
    }
  };

  const calculateHandicap = () => {
    if (!formData.is_sabo || !currentUserProfile || !selectedPlayer)
      return null;

    const challengerRank = currentUserProfile.current_rank as SaboRank;
    const opponentRank = selectedPlayer.current_rank as SaboRank;

    try {
      return calculateSaboHandicap(
        challengerRank,
        opponentRank,
        formData.bet_points
      );
    } catch (error) {
      console.error('Error calculating handicap:', error);
      return null;
    }
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
      // ✅ Create challenge data with proper open challenge support
      const challengeData: any = {
        bet_points: formData.bet_points,
        race_to: formData.race_to,
        message: formData.message || null,
        club_id: formData.club_id,
        scheduled_time: formData.scheduled_time || null,
        is_sabo: formData.is_sabo,
      };

      // For direct challenges, set opponent_id. For open challenges, set to 'open'
      if (challengeType === 'direct') {
        challengeData.opponent_id = formData.opponent_id;
      } else {
        challengeData.opponent_id = 'open'; // This will be handled by createChallenge hook
      }

      if (formData.is_sabo) {
        const handicap = calculateHandicap();
        if (handicap) {
          challengeData.handicap_1_rank = handicap.handicapChallenger;
          challengeData.handicap_05_rank = handicap.handicapOpponent;
        }
      }

      // Use the hook's createChallenge function
      await createChallenge(challengeData);

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
      handicap_05_rank: 0,
    });
    setSelectedPlayer(null);
    setSearchResults([]);
    setChallengeType('direct');
  };

  const handicapInfo = calculateHandicap();

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className='max-w-lg max-h-[90vh] overflow-y-auto'>
          <DialogHeader className='pb-4'>
            <DialogTitle className='flex items-center gap-2 text-lg'>
              {variant === 'admin' ? (
                <Shield className='w-5 h-5' />
              ) : (
                <Trophy className='w-5 h-5' />
              )}
              {variant === 'admin'
                ? 'Tạo thách đấu (Admin)'
                : 'Tạo thách đấu mới'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className='space-y-4'>
            {/* Challenge Type Selection - Compact */}
            <div className='space-y-2'>
              <Label className='text-sm font-medium'>Loại thách đấu</Label>
              <div className='grid grid-cols-2 gap-2'>
                <Button
                  type='button'
                  variant={challengeType === 'direct' ? 'default' : 'outline'}
                  onClick={() => setChallengeType('direct')}
                  className='h-10 text-sm'
                  size='sm'
                >
                  <Target className='w-4 h-4 mr-1' />
                  Thách đấu trực tiếp
                </Button>
                <Button
                  type='button'
                  variant={challengeType === 'open' ? 'default' : 'outline'}
                  onClick={() => setChallengeType('open')}
                  className='h-10 text-sm'
                  size='sm'
                >
                  <Globe className='w-4 h-4 mr-1' />
                  Thách đấu mở
                </Button>
              </div>
            </div>

            {/* Opponent Search - Only for direct challenges */}
            {challengeType === 'direct' && (
              <div className='space-y-2'>
                <Label htmlFor='opponent-search' className='text-sm'>
                  Tìm đối thủ
                </Label>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4' />
                  <Input
                    id='opponent-search'
                    placeholder='Nhập tên hoặc ID người chơi...'
                    value={formData.opponent_search}
                    onChange={e => {
                      const value = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        opponent_search: value,
                      }));
                      searchPlayers(value);
                    }}
                    className='pl-10 h-10'
                  />
                  {searching && (
                    <Loader2 className='absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin' />
                  )}
                </div>

                {/* Search Results - Compact */}
                {searchResults.length > 0 && (
                  <div className='border rounded-lg p-2 bg-background max-h-32 overflow-y-auto'>
                    {searchResults.map(player => (
                      <div
                        key={player.user_id}
                        className='flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer'
                        onClick={() => handlePlayerSelect(player)}
                      >
                        <Avatar className='w-6 h-6'>
                          <AvatarImage src={player.avatar_url} />
                          <AvatarFallback className='text-xs'>
                            {player.full_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className='flex-1 min-w-0'>
                          <p className='text-sm font-medium truncate'>
                            {player.full_name}
                          </p>
                          <p className='text-xs text-muted-foreground'>
                            {player.current_rank || 'K'} •{' '}
                            {player.spa_points || 0} SPA
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Selected Player - Compact */}
                {selectedPlayer && (
                  <div className='flex items-center gap-2 p-2 bg-muted rounded-lg'>
                    <Avatar className='w-8 h-8'>
                      <AvatarImage src={selectedPlayer.avatar_url} />
                      <AvatarFallback className='text-sm'>
                        {selectedPlayer.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-medium truncate'>
                        {selectedPlayer.full_name}
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        {selectedPlayer.current_rank || 'K'} •{' '}
                        {selectedPlayer.spa_points || 0} SPA
                      </p>
                    </div>
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      onClick={() => {
                        setSelectedPlayer(null);
                        setFormData(prev => ({
                          ...prev,
                          opponent_id: '',
                          opponent_search: '',
                        }));
                      }}
                      className='h-6 w-6 p-0'
                    >
                      ✕
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Bet Configuration - More Compact Grid */}
            <div className='space-y-2'>
              <Label className='text-sm font-medium'>Cấu hình cược</Label>
              <div className='grid grid-cols-3 gap-2'>
                {BET_CONFIGURATIONS.map(config => (
                  <Button
                    key={config.points}
                    type='button'
                    variant={
                      formData.bet_points === config.points
                        ? 'default'
                        : 'outline'
                    }
                    onClick={() => handleBetChange(config.points)}
                    className='h-16 p-2 flex flex-col items-center text-center'
                    size='sm'
                  >
                    <div className='flex items-center gap-1 mb-1'>
                      <Star className='w-3 h-3' />
                      <span className='font-bold text-sm'>{config.points}</span>
                    </div>
                    <div className='text-xs opacity-75'>
                      Race to {config.raceTO}
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* SABO Toggle - Compact */}
            <div className='flex items-center justify-between p-3 border rounded-lg'>
              <div className='space-y-0'>
                <div className='flex items-center gap-2'>
                  <Label htmlFor='sabo-mode' className='text-sm'>
                    Chế độ SABO
                  </Label>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={() => setShowSaboInfo(true)}
                    className='h-6 w-6 p-0'
                  >
                    <HelpCircle className='w-3 h-3' />
                  </Button>
                </div>
                <p className='text-xs text-muted-foreground'>
                  Bật handicap dựa trên rank
                </p>
              </div>
              <Switch
                id='sabo-mode'
                checked={formData.is_sabo}
                onCheckedChange={checked =>
                  setFormData(prev => ({ ...prev, is_sabo: checked }))
                }
              />
            </div>

            {/* SABO Handicap Info - Compact */}
            {formData.is_sabo && handicapInfo && selectedPlayer && (
              <div className='p-3 bg-blue-50 border border-blue-200 rounded-lg'>
                <div className='flex items-center gap-2 mb-1'>
                  <Calculator className='w-4 h-4 text-blue-600' />
                  <span className='text-sm font-medium text-blue-800'>
                    Thông tin Handicap
                  </span>
                </div>
                <div className='text-xs space-y-1'>
                  <div>Handicap được áp dụng cho trận đấu SABO</div>
                  <div className='text-blue-600 font-medium'>
                    {currentUserProfile?.current_rank || 'K'} vs{' '}
                    {selectedPlayer.current_rank || 'K'}
                  </div>
                </div>
              </div>
            )}

            {/* Club Selection - Compact */}
            <div className='space-y-2'>
              <Label htmlFor='club' className='text-sm'>
                Câu lạc bộ
              </Label>
              <Select
                value={formData.club_id}
                onValueChange={value =>
                  setFormData(prev => ({ ...prev, club_id: value }))
                }
              >
                <SelectTrigger className='h-10'>
                  <SelectValue placeholder='Chọn câu lạc bộ' />
                </SelectTrigger>
                <SelectContent>
                  {clubs.map(club => (
                    <SelectItem key={club.id} value={club.id}>
                      <div>
                        <div className='font-medium text-sm'>{club.name}</div>
                        <div className='text-xs text-muted-foreground'>
                          {club.address}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Scheduled Time - Compact */}
            <div className='space-y-2'>
              <Label htmlFor='scheduled-time' className='text-sm'>
                Thời gian dự kiến (tùy chọn)
              </Label>
              <Input
                id='scheduled-time'
                type='datetime-local'
                value={formData.scheduled_time}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    scheduled_time: e.target.value,
                  }))
                }
                min={new Date().toISOString().slice(0, 16)}
                className='h-10'
              />
            </div>

            {/* Message - Compact */}
            <div className='space-y-2'>
              <Label htmlFor='message' className='text-sm'>
                Tin nhắn (tùy chọn)
              </Label>
              <Textarea
                id='message'
                placeholder='Thêm tin nhắn cho thách đấu...'
                value={formData.message}
                onChange={e =>
                  setFormData(prev => ({ ...prev, message: e.target.value }))
                }
                rows={2}
                className='text-sm'
              />
            </div>

            {/* Action Buttons - Compact */}
            <div className='flex gap-2 pt-2'>
              <Button
                type='button'
                variant='outline'
                onClick={onClose}
                className='flex-1 h-10'
              >
                Hủy
              </Button>
              <Button
                type='submit'
                disabled={
                  loading ||
                  (challengeType === 'direct' && !formData.opponent_id) ||
                  !formData.club_id
                }
                className='flex-1 h-10'
              >
                {loading && <Loader2 className='w-4 h-4 mr-2 animate-spin' />}
                {challengeType === 'direct' ? 'Gửi thách đấu' : 'Gửi thách đấu'}
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
