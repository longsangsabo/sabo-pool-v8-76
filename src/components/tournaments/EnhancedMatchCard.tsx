import React, { useState } from 'react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Crown, Trophy, User, Users, Timer, CheckCircle } from 'lucide-react';

interface EnhancedMatchCardProps {
  match: any;
  isEditable?: boolean;
  onScoreUpdate?: () => void;
  showAdvanced?: boolean;
}

export const EnhancedMatchCard: React.FC<EnhancedMatchCardProps> = ({
  match,
  isEditable = false,
  onScoreUpdate,
  showAdvanced = false,
}) => {
  const { user } = useAuth();
  const [player1Score, setPlayer1Score] = useState(match?.score_player1 || 0);
  const [player2Score, setPlayer2Score] = useState(match?.score_player2 || 0);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleScoreUpdate = async () => {
    if (!user || !match) return;

    if (player1Score === player2Score) {
      toast.error('Tỷ số không thể hòa!');
      return;
    }

    setIsUpdating(true);

    try {

        matchId: match.id,
        player1Score,
        player2Score,
        round: match.round_number,
        matchNumber: match.match_number,
      });

      const { data, error } = await supabase.rpc('update_match_score_safe', {
        p_match_id: match.id,
        p_player1_score: player1Score,
        p_player2_score: player2Score,
        p_submitted_by: user.id,
      });

      if (error) {
        console.error('❌ Error updating score:', error);
        throw error;
      }

      if (data && typeof data === 'object' && 'error' in data && data.error) {
        console.error('❌ Function returned error:', data.error);
        throw new Error(String(data.error));
      }

      toast.success('✅ Đã cập nhật tỷ số thành công!');

      if (onScoreUpdate) {
        onScoreUpdate();
      }

      // Refresh to see changes
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error('❌ Error in score update:', error);
      toast.error(
        'Lỗi khi cập nhật tỷ số: ' + (error.message || 'Unknown error')
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = () => {
    switch (match.status) {
      case 'completed':
        return (
          <Badge variant='default' className='bg-green-500'>
            <CheckCircle className='w-3 h-3 mr-1' />
            Hoàn thành
          </Badge>
        );
      case 'ongoing':
        return (
          <Badge variant='secondary'>
            <Timer className='w-3 h-3 mr-1' />
            Đang diễn ra
          </Badge>
        );
      case 'scheduled':
        return (
          <Badge variant='outline'>
            <Users className='w-3 h-3 mr-1' />
            Đã lên lịch
          </Badge>
        );
      default:
        return <Badge variant='outline'>Chờ</Badge>;
    }
  };

  const getWinnerIcon = (playerId: string) => {
    if (match.winner_id === playerId) {
      return <Crown className='w-4 h-4 text-yellow-500 ml-1' />;
    }
    return null;
  };

  return (
    <Card
      className={`transition-all duration-200 ${
        match.winner_id ? 'border-green-200 bg-green-50' : 'hover:shadow-md'
      }`}
    >
      <CardContent className='p-4'>
        <div className='flex justify-between items-start mb-3'>
          <div className='text-sm font-medium text-gray-600'>
            Vòng {match.round_number} - Trận {match.match_number}
          </div>
          {getStatusBadge()}
        </div>

        <div className='space-y-3'>
          {/* Player 1 */}
          <div className='flex items-center justify-between p-2 rounded bg-blue-50'>
            <div className='flex items-center space-x-2'>
              <User className='w-4 h-4 text-blue-600' />
              <span className='font-medium'>
                {match.player1?.full_name ||
                  match.player1?.display_name ||
                  'TBD'}
              </span>
              {getWinnerIcon(match.player1_id)}
            </div>
            {isEditable ? (
              <Input
                type='number'
                min='0'
                value={player1Score}
                onChange={e => setPlayer1Score(parseInt(e.target.value) || 0)}
                className='w-16 h-8 text-center'
              />
            ) : (
              <span className='text-lg font-bold text-blue-700'>
                {match.score_player1 ?? '-'}
              </span>
            )}
          </div>

          {/* VS Divider */}
          <div className='text-center text-sm text-gray-500 font-medium'>
            VS
          </div>

          {/* Player 2 */}
          <div className='flex items-center justify-between p-2 rounded bg-red-50'>
            <div className='flex items-center space-x-2'>
              <User className='w-4 h-4 text-red-600' />
              <span className='font-medium'>
                {match.player2?.full_name ||
                  match.player2?.display_name ||
                  'TBD'}
              </span>
              {getWinnerIcon(match.player2_id)}
            </div>
            {isEditable ? (
              <Input
                type='number'
                min='0'
                value={player2Score}
                onChange={e => setPlayer2Score(parseInt(e.target.value) || 0)}
                className='w-16 h-8 text-center'
              />
            ) : (
              <span className='text-lg font-bold text-red-700'>
                {match.score_player2 ?? '-'}
              </span>
            )}
          </div>
        </div>

        {isEditable && (
          <div className='mt-4 pt-3 border-t'>
            <Button
              onClick={handleScoreUpdate}
              disabled={isUpdating || player1Score === player2Score}
              className='w-full'
              size='sm'
            >
              {isUpdating ? (
                'Đang cập nhật...'
              ) : (
                <>
                  <Trophy className='w-4 h-4 mr-2' />
                  Cập nhật tỷ số
                </>
              )}
            </Button>
            {player1Score === player2Score && (
              <p className='text-xs text-red-500 text-center mt-1'>
                Tỷ số không thể hòa
              </p>
            )}
          </div>
        )}

        {showAdvanced && match.winner_id && (
          <div className='mt-3 pt-2 border-t text-center'>
            <Badge variant='outline' className='text-xs'>
              <Trophy className='w-3 h-3 mr-1' />
              Người thắng:{' '}
              {match.winner_id === match.player1_id
                ? match.player1?.full_name || 'Player 1'
                : match.player2?.full_name || 'Player 2'}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
