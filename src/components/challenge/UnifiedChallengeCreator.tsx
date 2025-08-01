import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  Search,
  Trophy,
  DollarSign,
  MapPin,
  Users,
  ArrowLeft,
} from 'lucide-react';

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

interface UnifiedChallengeCreatorProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const BET_OPTIONS = [
  { points: 100, raceTO: 8, label: 'Sơ cấp - Race to 8' },
  { points: 200, raceTO: 12, label: 'Cơ bản - Race to 12' },
  { points: 300, raceTO: 14, label: 'Trung bình - Race to 14' },
  { points: 500, raceTO: 18, label: 'Cao cấp - Race to 18' },
];

export const UnifiedChallengeCreator: React.FC<
  UnifiedChallengeCreatorProps
> = ({ onSuccess, onCancel }) => {
  const { user } = useAuth();

  // Form state
  const [isOpenChallenge, setIsOpenChallenge] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedClub, setSelectedClub] = useState('');
  const [betPoints, setBetPoints] = useState(300);
  const [message, setMessage] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  // Data state
  const [searchTerm, setSearchTerm] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Load clubs on mount
  useEffect(() => {
    fetchClubs();
  }, []);

  // Search players when term changes
  useEffect(() => {
    if (searchTerm.length >= 2 && !isOpenChallenge) {
      searchPlayers();
    } else {
      setPlayers([]);
    }
  }, [searchTerm, isOpenChallenge]);

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

  const searchPlayers = async () => {
    if (!user) return;

    setSearchLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .neq('user_id', user.id)
        .ilike('full_name', `%${searchTerm}%`)
        .limit(10);

      if (error) throw error;

      const formattedPlayers =
        data?.map(player => ({
          user_id: player.user_id,
          full_name: player.full_name || 'Người chơi',
          avatar_url: player.avatar_url,
          current_rank: 'K', // Default for simplicity
          spa_points: 100, // Default for simplicity
        })) || [];

      setPlayers(formattedPlayers);
    } catch (error) {
      console.error('Error searching players:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Bạn cần đăng nhập để tạo thách đấu');
      return;
    }

    if (!isOpenChallenge && !selectedPlayer) {
      toast.error('Vui lòng chọn đối thủ hoặc chuyển sang thách đấu mở');
      return;
    }

    setLoading(true);
    try {
      const selectedConfig = BET_OPTIONS.find(
        config => config.points === betPoints
      );

      const { error } = await supabase.from('challenges').insert({
        challenger_id: user.id,
        opponent_id: isOpenChallenge ? null : selectedPlayer?.user_id,
        club_id: selectedClub || null,
        bet_points: betPoints,
        challenge_message: message || null,
        scheduled_time: scheduledTime
          ? new Date(scheduledTime).toISOString()
          : null,
        status: 'pending',
        expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      });

      if (error) throw error;

      toast.success('Thách đấu đã được tạo thành công!');
      onSuccess();
    } catch (error) {
      console.error('Error creating challenge:', error);
      toast.error('Lỗi khi tạo thách đấu');
    } finally {
      setLoading(false);
    }
  };

  const selectedConfig = BET_OPTIONS.find(
    config => config.points === betPoints
  );

  return (
    <div className='max-w-2xl mx-auto space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold flex items-center gap-2'>
          <Trophy className='w-6 h-6' />
          Tạo thách đấu mới
        </h1>
        <Button variant='outline' onClick={onCancel}>
          <ArrowLeft className='w-4 h-4 mr-2' />
          Quay lại
        </Button>
      </div>

      <form onSubmit={handleSubmit} className='space-y-6'>
        {/* Challenge Type */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Users className='w-5 h-5' />
              Loại thách đấu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center justify-between'>
              <div>
                <div className='font-medium'>
                  {isOpenChallenge ? 'Thách đấu mở' : 'Chọn đối thủ cụ thể'}
                </div>
                <div className='text-sm text-muted-foreground'>
                  {isOpenChallenge
                    ? 'Bất kỳ người chơi nào cũng có thể chấp nhận'
                    : 'Gửi thách đấu tới một người chơi cụ thể'}
                </div>
              </div>
              <Switch
                checked={isOpenChallenge}
                onCheckedChange={setIsOpenChallenge}
              />
            </div>
          </CardContent>
        </Card>

        {/* Player Selection */}
        {!isOpenChallenge && (
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Search className='w-5 h-5' />
                Chọn đối thủ
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='relative'>
                <Search className='w-4 h-4 absolute left-3 top-3 text-muted-foreground' />
                <Input
                  placeholder='Nhập tên người chơi...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='pl-10'
                />
              </div>

              {searchLoading && (
                <div className='text-sm text-muted-foreground'>
                  Đang tìm kiếm...
                </div>
              )}

              {players.length > 0 && (
                <div className='space-y-2 max-h-48 overflow-y-auto'>
                  {players.map(player => (
                    <div
                      key={player.user_id}
                      className={`p-3 border rounded-lg cursor-pointer hover:bg-muted/50 ${
                        selectedPlayer?.user_id === player.user_id
                          ? 'border-primary bg-primary/5'
                          : ''
                      }`}
                      onClick={() => setSelectedPlayer(player)}
                    >
                      <div className='flex items-center gap-3'>
                        <Avatar className='w-10 h-10'>
                          <AvatarImage src={player.avatar_url} />
                          <AvatarFallback>{player.full_name[0]}</AvatarFallback>
                        </Avatar>
                        <div className='flex-1'>
                          <div className='font-medium'>{player.full_name}</div>
                          <div className='text-sm text-muted-foreground'>
                            Hạng {player.current_rank} • {player.spa_points} SPA
                          </div>
                        </div>
                        {selectedPlayer?.user_id === player.user_id && (
                          <Badge>Đã chọn</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedPlayer && (
                <div className='p-3 bg-primary/5 border border-primary/20 rounded-lg'>
                  <div className='flex items-center gap-3'>
                    <Avatar>
                      <AvatarImage src={selectedPlayer.avatar_url} />
                      <AvatarFallback>
                        {selectedPlayer.full_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className='font-medium'>
                        Đối thủ: {selectedPlayer.full_name}
                      </div>
                      <div className='text-sm text-muted-foreground'>
                        Hạng {selectedPlayer.current_rank} •{' '}
                        {selectedPlayer.spa_points} SPA
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Bet Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <DollarSign className='w-5 h-5' />
              Mức cược & Luật chơi
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <Label>Chọn mức cược</Label>
              <Select
                value={betPoints.toString()}
                onValueChange={value => setBetPoints(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BET_OPTIONS.map(option => (
                    <SelectItem
                      key={option.points}
                      value={option.points.toString()}
                    >
                      {option.points} điểm - {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedConfig && (
              <div className='p-3 bg-muted rounded-lg'>
                <div className='text-sm'>
                  <strong>Luật chơi:</strong> Race to {selectedConfig.raceTO}
                </div>
                <div className='text-sm text-muted-foreground mt-1'>
                  Người thắng nhận {selectedConfig.points} điểm, người thua mất{' '}
                  {Math.floor(selectedConfig.points * 0.5)} điểm
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Options */}
        <Card>
          <CardHeader>
            <CardTitle>Tùy chọn bổ sung</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='club' className='flex items-center gap-2'>
                <MapPin className='w-4 h-4' />
                Câu lạc bộ (tùy chọn)
              </Label>
              <Select value={selectedClub} onValueChange={setSelectedClub}>
                <SelectTrigger>
                  <SelectValue placeholder='Chọn câu lạc bộ...' />
                </SelectTrigger>
                <SelectContent>
                  {clubs.map(club => (
                    <SelectItem key={club.id} value={club.id}>
                      {club.club_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='scheduled_time'>Thời gian (tùy chọn)</Label>
              <Input
                id='scheduled_time'
                type='datetime-local'
                value={scheduledTime}
                onChange={e => setScheduledTime(e.target.value)}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='message'>Lời nhắn (tùy chọn)</Label>
              <Textarea
                id='message'
                placeholder='Thêm lời nhắn cho đối thủ...'
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className='flex justify-end'>
          <Button type='submit' disabled={loading} className='w-32'>
            {loading ? 'Đang tạo...' : 'Tạo thách đấu'}
          </Button>
        </div>
      </form>
    </div>
  );
};
