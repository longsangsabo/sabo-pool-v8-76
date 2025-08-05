import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Trophy,
  User,
  Clock,
  CheckCircle,
  PlayCircle,
  Edit3,
  Save,
  X,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BracketMatchProps {
  match: {
    id: string;
    round_number: number;
    match_number: number;
    player1_id: string | null;
    player2_id: string | null;
    winner_id: string | null;
    status: string;
    score_player1: number | null;
    score_player2: number | null;
    scheduled_time: string | null;
    is_third_place_match: boolean;
    player1?: {
      full_name: string;
      display_name: string;
      avatar_url: string | null;
    } | null;
    player2?: {
      full_name: string;
      display_name: string;
      avatar_url: string | null;
    } | null;
  };
  adminMode?: boolean;
  onUpdate?: () => void;
}

export const BracketMatch: React.FC<BracketMatchProps> = ({
  match,
  adminMode = false,
  onUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [score1, setScore1] = useState(match.score_player1?.toString() || '0');
  const [score2, setScore2] = useState(match.score_player2?.toString() || '0');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleScoreSubmit = async () => {
    if (!adminMode) return;

    const p1Score = parseInt(score1);
    const p2Score = parseInt(score2);

    if (isNaN(p1Score) || isNaN(p2Score)) {
      toast.error('Vui lòng nhập tỷ số hợp lệ');
      return;
    }

    if (p1Score === p2Score) {
      toast.error('Tỷ số không thể hòa');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.rpc(
        'emergency_complete_tournament_match',
        {
          p_match_id: match.id,
          p_winner_id: p1Score > p2Score ? match.player1_id : match.player2_id,
        }
      );

      if (error) throw error;

      toast.success('Đã cập nhật tỷ số thành công');
      setIsEditing(false);
      onUpdate?.();
    } catch (error: any) {
      console.error('Error updating score:', error);
      toast.error('Không thể cập nhật tỷ số: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = () => {
    switch (match.status) {
      case 'completed':
        return (
          <Badge variant='default' className='gap-1'>
            <CheckCircle className='w-3 h-3' />
            Hoàn thành
          </Badge>
        );
      case 'ongoing':
        return (
          <Badge variant='secondary' className='gap-1'>
            <PlayCircle className='w-3 h-3' />
            Đang đấu
          </Badge>
        );
      case 'scheduled':
        return (
          <Badge variant='outline' className='gap-1'>
            <Clock className='w-3 h-3' />
            Chờ đấu
          </Badge>
        );
      default:
        return <Badge variant='outline'>Chờ</Badge>;
    }
  };

  const PlayerCard = ({
    player,
    score,
    isWinner,
  }: {
    player: typeof match.player1;
    score: number | null;
    isWinner: boolean;
  }) => (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border ${
        isWinner ? 'bg-primary/5 border-primary' : 'bg-muted/30'
      }`}
    >
      {player?.avatar_url ? (
        <img
          src={player.avatar_url}
          alt={player.display_name}
          className='w-10 h-10 rounded-full object-cover'
        />
      ) : (
        <div className='w-10 h-10 rounded-full bg-muted flex items-center justify-center'>
          <User className='w-5 h-5 text-muted-foreground' />
        </div>
      )}
      <div className='flex-1 min-w-0'>
        <p className={`font-medium truncate ${isWinner ? 'text-primary' : ''}`}>
          {player?.display_name || 'TBD'}
        </p>
        <p className='text-xs text-muted-foreground truncate'>
          {player?.full_name || 'Chờ xác định'}
        </p>
      </div>
      <div className='flex items-center gap-2'>
        {isWinner && <Trophy className='w-4 h-4 text-yellow-500' />}
        <span className={`text-lg font-bold ${isWinner ? 'text-primary' : ''}`}>
          {score ?? '-'}
        </span>
      </div>
    </div>
  );

  return (
    <Card className={`${match.is_third_place_match ? 'border-amber-200' : ''}`}>
      <CardContent className='p-4 space-y-4'>
        {/* Match Header */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <span className='text-sm font-medium'>
              {match.is_third_place_match
                ? 'Tranh hạng 3'
                : `Trận ${match.match_number}`}
            </span>
            {getStatusBadge()}
          </div>
          {adminMode && match.status !== 'completed' && (
            <Button
              variant='outline'
              size='sm'
              onClick={() => setIsEditing(!isEditing)}
              disabled={!match.player1_id || !match.player2_id}
            >
              {isEditing ? (
                <X className='w-4 h-4' />
              ) : (
                <Edit3 className='w-4 h-4' />
              )}
            </Button>
          )}
        </div>

        {/* Players */}
        <div className='space-y-3'>
          {isEditing ? (
            <>
              <div className='flex items-center gap-2'>
                <div className='flex-1'>
                  <PlayerCard
                    player={match.player1}
                    score={null}
                    isWinner={false}
                  />
                </div>
                <Input
                  type='number'
                  value={score1}
                  onChange={e => setScore1(e.target.value)}
                  className='w-16 text-center'
                  min='0'
                />
              </div>

              <div className='flex items-center gap-2'>
                <div className='flex-1'>
                  <PlayerCard
                    player={match.player2}
                    score={null}
                    isWinner={false}
                  />
                </div>
                <Input
                  type='number'
                  value={score2}
                  onChange={e => setScore2(e.target.value)}
                  className='w-16 text-center'
                  min='0'
                />
              </div>

              <Button
                onClick={handleScoreSubmit}
                disabled={isSubmitting}
                className='w-full'
              >
                <Save className='w-4 h-4 mr-2' />
                {isSubmitting ? 'Đang lưu...' : 'Lưu tỷ số'}
              </Button>
            </>
          ) : (
            <>
              <PlayerCard
                player={match.player1}
                score={match.score_player1}
                isWinner={match.winner_id === match.player1_id}
              />

              <div className='text-center text-xs text-muted-foreground'>
                VS
              </div>

              <PlayerCard
                player={match.player2}
                score={match.score_player2}
                isWinner={match.winner_id === match.player2_id}
              />
            </>
          )}
        </div>

        {/* Match Time */}
        {match.scheduled_time && (
          <div className='flex items-center gap-1 text-xs text-muted-foreground'>
            <Clock className='w-3 h-3' />
            {new Date(match.scheduled_time).toLocaleString('vi-VN')}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
