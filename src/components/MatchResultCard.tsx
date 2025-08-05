import { useState } from 'react';
import { Trophy, Target, Heart, MessageCircle, Share2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import UserAvatar from './UserAvatar';

interface MatchResultCardProps {
  match: {
    id: string;
    player1: {
      id: string;
      name: string;
      avatar: string;
      rank: string;
    };
    player2: {
      id: string;
      name: string;
      avatar: string;
      rank: string;
    };
    score: {
      player1: number;
      player2: number;
    };
    winner_id: string;
    tournament?: {
      name: string;
      round: string;
    };
    match_date: string;
    duration: string;
    stats?: {
      longest_run_p1?: number;
      longest_run_p2?: number;
      total_shots_p1?: number;
      total_shots_p2?: number;
    };
    likes: number;
    comments: number;
    isLiked: boolean;
  };
  onLike: (matchId: string) => void;
}

const MatchResultCard = ({ match, onLike }: MatchResultCardProps) => {
  const [showStats, setShowStats] = useState(false);

  const getWinnerStyle = (playerId: string) => {
    return match.winner_id === playerId
      ? 'bg-gold text-white font-bold'
      : 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className='bg-white shadow-sm hover:shadow-md transition-shadow duration-200'>
      <CardContent className='p-4'>
        {/* Match Header */}
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center space-x-2'>
            <Trophy className='w-5 h-5 text-gold' />
            {match.tournament ? (
              <div>
                <p className='text-sm font-medium text-gray-900'>
                  {match.tournament.name}
                </p>
                <p className='text-xs text-comment-gray'>
                  {match.tournament.round}
                </p>
              </div>
            ) : (
              <p className='text-sm font-medium text-gray-900'>
                Trận đấu thường
              </p>
            )}
          </div>
          <div className='text-right'>
            <p className='text-xs text-comment-gray'>
              {formatDate(match.match_date)}
            </p>
            <p className='text-xs text-comment-gray'>
              Thời gian: {match.duration}
            </p>
          </div>
        </div>

        {/* Players and Score */}
        <div className='bg-tertiary rounded-lg p-4 mb-4'>
          {/* Player 1 */}
          <div className='flex items-center justify-between mb-3'>
            <UserAvatar user={match.player1} size='md' showRank={true} />
            <div
              className={`px-6 py-3 rounded-lg text-center ${getWinnerStyle(match.player1.id)}`}
            >
              <span className='text-2xl font-bold'>{match.score.player1}</span>
            </div>
          </div>

          {/* VS Divider */}
          <div className='text-center mb-3'>
            <span className='text-comment-gray font-medium'>VS</span>
          </div>

          {/* Player 2 */}
          <div className='flex items-center justify-between'>
            <UserAvatar user={match.player2} size='md' showRank={true} />
            <div
              className={`px-6 py-3 rounded-lg text-center ${getWinnerStyle(match.player2.id)}`}
            >
              <span className='text-2xl font-bold'>{match.score.player2}</span>
            </div>
          </div>
        </div>

        {/* Winner Banner */}
        <div className='text-center mb-4'>
          <Badge className='bg-primary-blue text-white px-4 py-2'>
            🏆 Chiến thắng thuộc về{' '}
            {match.winner_id === match.player1.id
              ? match.player1.name
              : match.player2.name}
          </Badge>
        </div>

        {/* Stats Toggle */}
        {match.stats && (
          <div className='mb-4'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setShowStats(!showStats)}
              className='w-full flex items-center justify-center space-x-2 text-primary-blue'
            >
              <Target className='w-4 h-4' />
              <span>{showStats ? 'Ẩn thống kê' : 'Xem thống kê chi tiết'}</span>
            </Button>

            {showStats && (
              <div className='mt-3 grid grid-cols-2 gap-4 p-3 bg-secondary rounded-lg'>
                <div className='text-center'>
                  <p className='text-xs text-comment-gray'>Run dài nhất P1</p>
                  <p className='text-lg font-bold text-primary-blue'>
                    {match.stats.longest_run_p1 || 0}
                  </p>
                </div>
                <div className='text-center'>
                  <p className='text-xs text-comment-gray'>Run dài nhất P2</p>
                  <p className='text-lg font-bold text-primary-blue'>
                    {match.stats.longest_run_p2 || 0}
                  </p>
                </div>
                <div className='text-center'>
                  <p className='text-xs text-comment-gray'>Tổng shots P1</p>
                  <p className='text-lg font-bold text-primary-green'>
                    {match.stats.total_shots_p1 || 0}
                  </p>
                </div>
                <div className='text-center'>
                  <p className='text-xs text-comment-gray'>Tổng shots P2</p>
                  <p className='text-lg font-bold text-primary-green'>
                    {match.stats.total_shots_p2 || 0}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Social Actions */}
        <div className='flex items-center justify-between pt-3 border-t border-gray-100'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => onLike(match.id)}
            className={`flex items-center space-x-2 transition-colors ${
              match.isLiked
                ? 'text-like-red hover:text-like-red'
                : 'text-comment-gray hover:text-like-red'
            }`}
          >
            <Heart
              className={`w-5 h-5 ${match.isLiked ? 'fill-current' : ''}`}
            />
            <span className='text-sm font-medium'>{match.likes}</span>
          </Button>

          <Button
            variant='ghost'
            size='sm'
            className='flex items-center space-x-2 text-comment-gray hover:text-share-blue transition-colors'
          >
            <MessageCircle className='w-5 h-5' />
            <span className='text-sm font-medium'>{match.comments}</span>
          </Button>

          <Button
            variant='ghost'
            size='sm'
            className='flex items-center space-x-2 text-comment-gray hover:text-primary-green transition-colors'
          >
            <Share2 className='w-5 h-5' />
            <span className='text-sm font-medium'>Chia sẻ</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MatchResultCard;
