import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Player {
  user_id: string;
  full_name?: string;
  display_name?: string;
  avatar_url?: string;
  verified_rank?: string;
}

interface PlayerSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  position: 'player1' | 'player2';
  availablePlayers: Player[];
  onPlayerSelected: (playerId: string) => void;
}

export const PlayerSelectionModal: React.FC<PlayerSelectionModalProps> = ({
  isOpen,
  onClose,
  matchId,
  position,
  availablePlayers,
  onPlayerSelected,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredPlayers = availablePlayers.filter(player => {
    const name = player.full_name || player.display_name || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleSelectPlayer = async () => {
    if (!selectedPlayerId) {
      toast.error('Vui lòng chọn một người chơi');
      return;
    }

    try {
      setIsSubmitting(true);

      const updateData =
        position === 'player1'
          ? { player1_id: selectedPlayerId }
          : { player2_id: selectedPlayerId };

      const { error } = await supabase
        .from('tournament_matches')
        .update(updateData)
        .eq('id', matchId);

      if (error) throw error;

      onPlayerSelected(selectedPlayerId);
      onClose();
      toast.success('Đã chọn người chơi thành công!');
    } catch (error: any) {
      console.error('Error selecting player:', error);
      toast.error('Lỗi khi chọn người chơi: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPlayerName = (player: Player) => {
    return player.full_name || player.display_name || 'Unknown Player';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-lg max-h-[80vh]'>
        <DialogHeader>
          <DialogTitle className='text-center'>
            Chọn Người Chơi - {position === 'player1' ? 'Vị trí 1' : 'Vị trí 2'}
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Search */}
          <div className='relative'>
            <Search className='h-4 w-4 absolute left-3 top-3 text-gray-400' />
            <Input
              placeholder='Tìm kiếm người chơi...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='pl-10'
            />
          </div>

          {/* Player List */}
          <div className='max-h-64 overflow-y-auto space-y-2'>
            {filteredPlayers.length === 0 ? (
              <div className='text-center py-8 text-muted-foreground'>
                {searchTerm
                  ? 'Không tìm thấy người chơi phù hợp'
                  : 'Không có người chơi khả dụng'}
              </div>
            ) : (
              filteredPlayers.map(player => (
                <div
                  key={player.user_id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedPlayerId === player.user_id
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedPlayerId(player.user_id)}
                >
                  <Avatar className='h-10 w-10'>
                    <AvatarImage src={player.avatar_url} />
                    <AvatarFallback>
                      <User className='h-5 w-5' />
                    </AvatarFallback>
                  </Avatar>

                  <div className='flex-1'>
                    <div className='font-medium'>
                      {formatPlayerName(player)}
                    </div>
                    {player.verified_rank && (
                      <div className='text-sm text-muted-foreground'>
                        Rank: {player.verified_rank}
                      </div>
                    )}
                  </div>

                  {selectedPlayerId === player.user_id && (
                    <div className='w-4 h-4 rounded-full bg-primary flex items-center justify-center'>
                      <div className='w-2 h-2 rounded-full bg-white'></div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Actions */}
          <div className='flex gap-2 pt-4'>
            <Button variant='outline' onClick={onClose} className='flex-1'>
              Hủy
            </Button>
            <Button
              onClick={handleSelectPlayer}
              disabled={!selectedPlayerId || isSubmitting}
              className='flex-1'
            >
              {isSubmitting ? 'Đang xử lý...' : 'Chọn Người Chơi'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
