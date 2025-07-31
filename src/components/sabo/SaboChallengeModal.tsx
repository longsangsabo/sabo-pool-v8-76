import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Search, Target, Calculator, AlertTriangle } from 'lucide-react';
import { calculateSaboHandicap, formatHandicapDisplay, type SaboRank, type HandicapResult } from '@/utils/saboHandicap';

interface SaboChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChallengeCreated: () => void;
}

interface Player {
  user_id: string;
  full_name: string;
  avatar_url?: string;
  current_rank?: SaboRank;
  spa_points?: number;
}

const SABO_CONFIGURATIONS = [
  { points: 300, raceTO: 12, description: 'SABO Cơ bản - Race to 12' },
  { points: 500, raceTO: 16, description: 'SABO Trung cấp - Race to 16' },
  { points: 800, raceTO: 20, description: 'SABO Cao cấp - Race to 20' },
  { points: 1200, raceTO: 25, description: 'SABO Chuyên nghiệp - Race to 25' },
];

const SaboChallengeModal: React.FC<SaboChallengeModalProps> = ({
  isOpen,
  onClose,
  onChallengeCreated,
}) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [stakeAmount, setStakeAmount] = useState(500);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [userRank, setUserRank] = useState<SaboRank>('K');
  const [handicapResult, setHandicapResult] = useState<HandicapResult | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      fetchUserRank();
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchPlayers();
    } else {
      setPlayers([]);
      setSelectedPlayer(null);
    }
  }, [searchTerm]);

  useEffect(() => {
    if (selectedPlayer && userRank) {
      const result = calculateSaboHandicap(
        userRank,
        selectedPlayer.current_rank || 'K',
        stakeAmount
      );
      setHandicapResult(result);
    } else {
      setHandicapResult(null);
    }
  }, [selectedPlayer, userRank, stakeAmount]);

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

  const searchPlayers = async () => {
    if (!user) return;
    
    setSearchLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          user_id,
          full_name,
          avatar_url,
          current_rank,
          elo
        `)
        .neq('user_id', user.id)
        .ilike('full_name', `%${searchTerm}%`)
        .not('current_rank', 'is', null)
        .limit(10);

      if (error) throw error;

      const formattedPlayers = data?.map(player => ({
        user_id: player.user_id,
        full_name: player.full_name || 'Người chơi',
        avatar_url: player.avatar_url,
        current_rank: player.current_rank as SaboRank,
        spa_points: player.elo || 1000,
      })) || [];

      setPlayers(formattedPlayers);
    } catch (error) {
      console.error('Error searching players:', error);
      toast.error('Lỗi khi tìm kiếm người chơi');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleCreateChallenge = async () => {
    if (!user || !selectedPlayer || !handicapResult) {
      toast.error('Vui lòng chọn đối thủ và kiểm tra handicap');
      return;
    }

    if (!handicapResult.isValid) {
      toast.error(handicapResult.errorMessage || 'Thách đấu không hợp lệ');
      return;
    }

    setLoading(true);
    try {
      const selectedConfig = SABO_CONFIGURATIONS.find(config => config.points === stakeAmount);
      
      const { error } = await supabase
        .from('challenges')
        .insert({
          challenger_id: user.id,
          opponent_id: selectedPlayer.user_id,
          challenge_message: message || null,
          status: 'pending',
          challenge_type: 'sabo',
          race_to: selectedConfig?.raceTO || 16,
          bet_points: stakeAmount,
          handicap_data: {
            challenger_rank: handicapResult.challengerRank,
            opponent_rank: handicapResult.opponentRank,
            handicap_challenger: handicapResult.handicapChallenger,
            handicap_opponent: handicapResult.handicapOpponent,
            rank_difference: handicapResult.rankDifference,
            explanation: handicapResult.explanation
          }
        });

      if (error) throw error;

      // Create notification for opponent
      await supabase.from('notifications').insert({
        user_id: selectedPlayer.user_id,
        type: 'challenge_received',
        title: 'Thách đấu SABO mới!',
        message: `${user.user_metadata?.full_name || 'Một người chơi'} đã gửi thách đấu SABO với handicap`,
        action_url: '/challenges',
        priority: 'high'
      });

      toast.success('Thách đấu SABO đã được gửi thành công!');
      onChallengeCreated();
      handleClose();
    } catch (error: any) {
      console.error('Error creating SABO challenge:', error);
      toast.error('Lỗi khi tạo thách đấu SABO: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSearchTerm('');
    setPlayers([]);
    setSelectedPlayer(null);
    setStakeAmount(500);
    setMessage('');
    setHandicapResult(null);
    onClose();
  };

  const handicapDisplay = handicapResult ? formatHandicapDisplay(handicapResult) : null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Tạo thách đấu SABO
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Rank Display */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm font-medium">Hạng của bạn: <Badge variant="secondary">{userRank}</Badge></div>
          </div>

          {/* Player Search */}
          <div className="space-y-2">
            <Label>Tìm kiếm đối thủ</Label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Nhập tên người chơi có xác thực hạng..."
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
                    onClick={() => setSelectedPlayer(player)}
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={player.avatar_url} />
                      <AvatarFallback>{player.full_name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium">{player.full_name}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-2">
                        <Badge variant="outline">{player.current_rank}</Badge>
                        <span>{player.spa_points} SPA</span>
                      </div>
                    </div>
                    {selectedPlayer?.user_id === player.user_id && (
                      <Badge variant="default">Đã chọn</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Handicap Preview */}
          {handicapResult && selectedPlayer && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="w-4 h-4" />
                  <span className="font-medium">Tính toán Handicap</span>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Bạn ({userRank})</span>
                    <span>vs</span>
                    <span>{selectedPlayer.full_name} ({selectedPlayer.current_rank})</span>
                  </div>
                  
                  <div className={`p-3 rounded-lg border ${
                    handicapDisplay?.color === 'green' ? 'bg-green-50 border-green-200' :
                    handicapDisplay?.color === 'blue' ? 'bg-blue-50 border-blue-200' :
                    handicapDisplay?.color === 'red' ? 'bg-red-50 border-red-200' :
                    'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      {!handicapResult.isValid && <AlertTriangle className="w-4 h-4 text-red-500" />}
                      <span className="font-medium">{handicapDisplay?.title}</span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {handicapDisplay?.description}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stake Configuration */}
          <div className="space-y-2">
            <Label>Mức cược & Luật SABO</Label>
            <Select value={stakeAmount.toString()} onValueChange={(value) => setStakeAmount(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SABO_CONFIGURATIONS.map((config) => (
                  <SelectItem key={config.points} value={config.points.toString()}>
                    <div className="flex flex-col">
                      <span className="font-medium">{config.points} điểm</span>
                      <span className="text-sm text-gray-500">{config.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={handleClose}>
              Hủy
            </Button>
            <Button
              onClick={handleCreateChallenge}
              disabled={loading || !selectedPlayer || !handicapResult?.isValid}
            >
              {loading ? 'Đang tạo...' : 'Tạo thách đấu SABO'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SaboChallengeModal;