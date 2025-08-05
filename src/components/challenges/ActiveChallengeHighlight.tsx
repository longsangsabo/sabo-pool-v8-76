import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MatchScoreModal } from '@/components/challenges/MatchScoreModal';
import {
  Trophy,
  Target,
  Clock,
  DollarSign,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

interface ActiveChallengeHighlightProps {
  challenges: any[];
  user: any;
  onChallengeClick?: (challenge: any) => void;
}

export const ActiveChallengeHighlight: React.FC<
  ActiveChallengeHighlightProps
> = ({ challenges, user, onChallengeClick }) => {
  const [scoreModalOpen, setScoreModalOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);

  // Filter accepted challenges that user is part of - with null safety
  const acceptedChallenges = Array.isArray(challenges)
    ? challenges.filter(
        c =>
          c &&
          c.status === 'accepted' &&
          (c.challenger_id === user?.id || c.opponent_id === user?.id)
      )
    : [];

  // Debug log
  console.log('🔍 ActiveChallengeHighlight render:', {
    totalChallenges: challenges?.length || 0,
    acceptedChallenges: acceptedChallenges.length,
    userId: user?.id,
    challenges: challenges || 'null',
  });

  // Always show the component with a dedicated area
  const hasActiveChallenges = acceptedChallenges.length > 0;

  const handleScoreEntry = (challenge: any) => {
    setSelectedChallenge(challenge);
    setScoreModalOpen(true);
  };

  const getPlayerInfo = (challenge: any, isChallenger: boolean) => {
    if (isChallenger) {
      return {
        name:
          challenge.challenger_profile?.full_name ||
          challenge.challenger_profile?.display_name ||
          'Challenger',
        spa: challenge.challenger_profile?.spa_points || 0,
        avatar: challenge.challenger_profile?.avatar_url,
      };
    } else {
      return {
        name:
          challenge.opponent_profile?.full_name ||
          challenge.opponent_profile?.display_name ||
          'Opponent',
        spa: challenge.opponent_profile?.spa_points || 0,
        avatar: challenge.opponent_profile?.avatar_url,
      };
    }
  };

  return (
    <>
      <Card
        className={`${
          hasActiveChallenges
            ? 'bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200'
            : 'bg-gradient-to-br from-gray-50 to-slate-100 border border-gray-200'
        } shadow-lg`}
      >
        <CardHeader className='pb-4'>
          <CardTitle
            className={`flex items-center gap-3 ${hasActiveChallenges ? 'text-green-800' : 'text-gray-700'}`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                hasActiveChallenges ? 'bg-green-600' : 'bg-gray-400'
              }`}
            >
              <Zap className='w-5 h-5 text-white' />
            </div>
            <div>
              <h3 className='text-xl font-bold'>
                {hasActiveChallenges
                  ? 'Thách đấu đang chờ thi đấu'
                  : 'Khu vực thi đấu'}
              </h3>
              <p
                className={`text-sm font-normal ${
                  hasActiveChallenges ? 'text-green-600' : 'text-gray-500'
                }`}
              >
                {hasActiveChallenges
                  ? `${acceptedChallenges.length} thách đấu sẵn sàng nhập tỷ số`
                  : 'Chưa có thách đấu nào đang chờ thi đấu'}
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasActiveChallenges ? (
            <div className='space-y-4'>
              {acceptedChallenges.map(challenge => {
                const isChallenger = user?.id === challenge.challenger_id;
                const challenger = getPlayerInfo(challenge, true);
                const opponent = getPlayerInfo(challenge, false);
                const timeAgo = challenge.responded_at
                  ? formatDistanceToNow(parseISO(challenge.responded_at), {
                      addSuffix: true,
                      locale: vi,
                    })
                  : 'Vừa xong';

                return (
                  <Card
                    key={challenge.id}
                    className='bg-white border border-green-200 hover:shadow-md transition-all duration-300 hover:border-green-300'
                  >
                    <CardContent className='p-4'>
                      {/* Challenge Header */}
                      <div className='flex items-center justify-between mb-3'>
                        <div className='flex items-center gap-2'>
                          <Badge
                            variant='default'
                            className='bg-green-600 text-white'
                          >
                            <Target className='w-3 h-3 mr-1' />
                            Race to {challenge.race_to}
                          </Badge>
                          <Badge
                            variant='outline'
                            className='border-orange-300 text-orange-700'
                          >
                            <DollarSign className='w-3 h-3 mr-1' />
                            {challenge.bet_points} SPA
                          </Badge>
                        </div>
                        <div className='text-xs text-gray-500 flex items-center gap-1'>
                          <Clock className='w-3 h-3' />
                          {timeAgo}
                        </div>
                      </div>

                      {/* Players */}
                      <div className='flex items-center justify-between mb-4'>
                        <div className='flex items-center gap-3'>
                          <Avatar className='w-10 h-10 border-2 border-blue-200'>
                            <AvatarImage src={challenger.avatar} />
                            <AvatarFallback className='bg-blue-100 text-blue-700'>
                              {challenger.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className='font-semibold text-gray-800'>
                              {challenger.name}
                            </div>
                            <div className='text-xs text-gray-500'>
                              {challenger.spa} SPA
                            </div>
                          </div>
                        </div>

                        <div className='flex flex-col items-center'>
                          <ArrowRight className='w-5 h-5 text-gray-400' />
                          <span className='text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded'>
                            VS
                          </span>
                        </div>

                        <div className='flex items-center gap-3'>
                          <div className='text-right'>
                            <div className='font-semibold text-gray-800'>
                              {opponent.name}
                            </div>
                            <div className='text-xs text-gray-500'>
                              {opponent.spa} SPA
                            </div>
                          </div>
                          <Avatar className='w-10 h-10 border-2 border-red-200'>
                            <AvatarImage src={opponent.avatar} />
                            <AvatarFallback className='bg-red-100 text-red-700'>
                              {opponent.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className='flex gap-2'>
                        <Button
                          onClick={() => handleScoreEntry(challenge)}
                          className='flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold'
                        >
                          📊 Nhập Tỷ Số
                        </Button>
                        <Button
                          variant='outline'
                          onClick={() => onChallengeClick?.(challenge)}
                          className='px-4 border-green-300 text-green-700 hover:bg-green-50'
                        >
                          Chi tiết
                        </Button>
                      </div>

                      {/* Challenge Message */}
                      {challenge.message && (
                        <div className='mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600 border-l-2 border-green-300'>
                          💬 {challenge.message}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className='flex flex-col items-center justify-center py-8 text-center'>
              <div className='w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-3'>
                <Trophy className='w-6 h-6 text-gray-400' />
              </div>
              <p className='text-gray-500 text-sm mb-2'>
                Khi có thách đấu được chấp nhận, bạn có thể nhập tỷ số tại đây
              </p>
              <div className='text-xs text-gray-400'>
                Khu vực này luôn hiển thị để theo dõi trận đấu
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Score Modal */}
      {selectedChallenge && (
        <MatchScoreModal
          open={scoreModalOpen}
          onOpenChange={setScoreModalOpen}
          challengeId={selectedChallenge.id}
          isChallenger={user?.id === selectedChallenge.challenger_id}
          raceTo={selectedChallenge.race_to}
          challengerName={
            selectedChallenge.challenger_profile?.full_name || 'Challenger'
          }
          opponentName={
            selectedChallenge.opponent_profile?.full_name || 'Opponent'
          }
        />
      )}
    </>
  );
};
