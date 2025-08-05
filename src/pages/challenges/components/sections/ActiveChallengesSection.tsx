import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Clock, MapPin, MessageSquare, Ban, Users, Target } from 'lucide-react';
import CancelChallengeModal from '../modals/CancelChallengeModal';
import ChallengeChat from '../chat/ChallengeChat';
import ThreeStepScoreWorkflow from '../score/ThreeStepScoreWorkflow';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Challenge } from '@/types/challenge';

interface ActiveChallengesSectionProps {
  challenges: Challenge[];
  currentUserId?: string;
  onCancelChallenge: (challengeId: string) => Promise<void>;
  onStatsUpdate: () => void;
  highlightedChallengeId?: string | null;
}

const ActiveChallengesSection: React.FC<ActiveChallengesSectionProps> = ({
  challenges,
  currentUserId,
  onCancelChallenge,
  onStatsUpdate,
  highlightedChallengeId,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedChallengeForCancel, setSelectedChallengeForCancel] =
    useState<Challenge | null>(null);
  const [openChats, setOpenChats] = useState<Set<string>>(new Set());
  const [isClubOwner, setIsClubOwner] = useState<{
    [challengeId: string]: boolean;
  }>({});

  // Enhanced score update handler with proper invalidation
  const handleScoreUpdated = async () => {
    console.log('🔄 handleScoreUpdated called - starting refresh process...');
    console.log('Current challenges count:', challenges?.length);

    // Invalidate all relevant queries to force UI refresh
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['challenges'] }),
      queryClient.invalidateQueries({ queryKey: ['active-challenges'] }),
      queryClient.invalidateQueries({ queryKey: ['player-rankings'] }),
      queryClient.invalidateQueries({ queryKey: ['daily-challenge-stats'] }),
    ]);

    console.log('✅ Queries invalidated at:', Date.now());

    // Also call the original callback
    onStatsUpdate();

    console.log('🔄 onStatsUpdate called, waiting for refetch...');

    // Force a small delay to ensure data is refreshed
    setTimeout(() => {
      console.log('🔄 Second onStatsUpdate call (delayed)');
      onStatsUpdate();
    }, 500);
  };

  // Debug challenges changes
  useEffect(() => {
    console.log(
      '🔍 ActiveChallengesSection re-rendered with challenges:',
      challenges?.length
    );
    console.log('👤 Current user:', user?.id);
    challenges?.forEach(challenge => {
      console.log(`🎯 Challenge ${challenge.id}:`, {
        status: challenge.status,
        score_confirmation_status: challenge.score_confirmation_status,
        challenger_id: challenge.challenger_id,
        opponent_id: challenge.opponent_id,
        is_current_user_challenger: challenge.challenger_id === user?.id,
        is_current_user_opponent: challenge.opponent_id === user?.id,
        challenger_final_score: challenge.challenger_final_score,
        opponent_final_score: challenge.opponent_final_score,
        score_entered_by: challenge.score_entered_by,
      });
    });
  }, [challenges, user?.id]);

  // Check if user is club owner for each challenge
  useEffect(() => {
    const checkClubOwnership = async () => {
      const ownershipChecks: { [challengeId: string]: boolean } = {};

      for (const challenge of challenges) {
        if (challenge.club_id && user?.id) {
          const { data } = await supabase
            .from('club_profiles')
            .select('user_id')
            .eq('id', challenge.club_id)
            .eq('user_id', user.id)
            .single();

          ownershipChecks[challenge.id] = !!data;
        } else {
          ownershipChecks[challenge.id] = false;
        }
      }

      setIsClubOwner(ownershipChecks);
    };

    if (challenges.length > 0 && user?.id) {
      checkClubOwnership();
    }
  }, [challenges, user?.id]);

  const handleCancelChallenge = async (reason: string) => {
    if (!selectedChallengeForCancel) return;

    try {
      // Update challenge status to cancelled with reason
      const { error: updateError } = await supabase
        .from('challenges')
        .update({
          status: 'cancelled',
          response_message: reason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedChallengeForCancel.id);

      if (updateError) throw updateError;

      // Get opponent info for notification
      const opponentId =
        selectedChallengeForCancel.challenger_id === currentUserId
          ? selectedChallengeForCancel.opponent_id
          : selectedChallengeForCancel.challenger_id;

      const opponentName =
        selectedChallengeForCancel.challenger_id === currentUserId
          ? selectedChallengeForCancel.opponent?.full_name
          : selectedChallengeForCancel.challenger?.full_name;

      // Create notification for opponent
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: opponentId,
          type: 'challenge_cancelled',
          title: 'Thách đấu đã bị hủy',
          message: `${user?.user_metadata?.full_name || 'Đối thủ'} đã hủy thách đấu. Lý do: ${reason}`,
          priority: 'normal',
          metadata: {
            challenge_id: selectedChallengeForCancel.id,
            cancelled_by: currentUserId,
            reason: reason,
          },
        });

      if (notificationError) throw notificationError;

      toast.success('Đã hủy thách đấu và thông báo cho đối thủ');
      setSelectedChallengeForCancel(null);
      onStatsUpdate();
    } catch (error) {
      console.error('Error cancelling challenge:', error);
      toast.error('Lỗi khi hủy thách đấu');
    }
  };

  const toggleChat = (challengeId: string) => {
    setOpenChats(prev => {
      const newSet = new Set(prev);
      if (newSet.has(challengeId)) {
        newSet.delete(challengeId);
      } else {
        newSet.add(challengeId);
      }
      return newSet;
    });
  };

  if (challenges.length === 0) {
    return (
      <Card>
        <CardContent className='text-center py-12'>
          <Users className='w-16 h-16 text-muted-foreground/50 mx-auto mb-4' />
          <h3 className='font-semibold text-lg mb-2'>Không có trận đấu nào</h3>
          <p className='text-muted-foreground'>
            Chưa có thách đấu nào được chấp nhận. Hãy tạo hoặc tham gia thách
            đấu!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-4'>
      {challenges.map(challenge => {
        const isChallenger = challenge.challenger_id === currentUserId;
        const opponent = isChallenger
          ? challenge.opponent
          : challenge.challenger;
        const isChatOpen = openChats.has(challenge.id);

        const isHighlighted = highlightedChallengeId === challenge.id;

        return (
          <div
            key={challenge.id}
            id={`challenge-${challenge.id}`}
            className='space-y-4'
          >
            <Card
              className={`border-l-4 border-l-blue-500 transition-all duration-500 ${
                isHighlighted
                  ? 'ring-4 ring-primary/50 shadow-xl bg-primary/5'
                  : ''
              }`}
            >
              <CardHeader className='pb-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='flex items-center gap-2'>
                      <Avatar className='h-10 w-10'>
                        <AvatarImage src={opponent?.avatar_url} />
                        <AvatarFallback>
                          {opponent?.full_name?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className='text-lg'>
                          Thách đấu với {opponent?.full_name || 'Người chơi'}
                        </CardTitle>
                        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                          <Target className='h-4 w-4' />
                          Race to {challenge.race_to}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className='flex items-center gap-2'>
                    {/* Score workflow status badge */}
                    {(() => {
                      console.log(
                        `🏷️ Rendering badge for challenge ${challenge.id}:`,
                        {
                          score_confirmation_status:
                            challenge.score_confirmation_status,
                          challenger_final_score:
                            challenge.challenger_final_score,
                          opponent_final_score: challenge.opponent_final_score,
                        }
                      );

                      if (
                        challenge.score_confirmation_status === 'score_entered'
                      ) {
                        return (
                          <Badge className='bg-orange-500 text-white'>
                            Chờ xác nhận tỷ số
                          </Badge>
                        );
                      } else if (
                        challenge.score_confirmation_status ===
                        'score_confirmed'
                      ) {
                        return (
                          <Badge className='bg-yellow-500 text-white'>
                            Chờ CLB xác nhận
                          </Badge>
                        );
                      } else {
                        return (
                          <Badge className='bg-blue-500 text-white'>
                            Đang diễn ra
                          </Badge>
                        );
                      }
                    })()}
                    <Badge variant='secondary'>
                      {challenge.bet_points || challenge.stake_amount} điểm
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className='space-y-4'>
                {/* Challenge info */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
                  <div className='flex items-center gap-2'>
                    <Clock className='h-4 w-4 text-muted-foreground' />
                    <span>
                      Tạo lúc:{' '}
                      {format(
                        new Date(challenge.created_at),
                        'dd/MM/yyyy HH:mm',
                        { locale: vi }
                      )}
                    </span>
                  </div>

                  {challenge.location && (
                    <div className='flex items-center gap-2'>
                      <MapPin className='h-4 w-4 text-muted-foreground' />
                      <span>{challenge.location}</span>
                    </div>
                  )}
                </div>

                {/* Score status information */}
                {challenge.score_confirmation_status === 'score_entered' && (
                  <div className='p-3 bg-orange-50 border border-orange-200 rounded-lg'>
                    <p className='text-sm text-orange-800 font-medium'>
                      Tỷ số đã nhập: {challenge.challenger_final_score || 0} -{' '}
                      {challenge.opponent_final_score || 0}
                    </p>
                    <p className='text-xs text-orange-600 mt-1'>
                      Đang chờ đối thủ xác nhận tỷ số
                    </p>
                  </div>
                )}

                {challenge.score_confirmation_status === 'score_confirmed' && (
                  <div className='p-3 bg-yellow-50 border border-yellow-200 rounded-lg'>
                    <p className='text-sm text-yellow-800 font-medium'>
                      Tỷ số đã xác nhận: {challenge.challenger_final_score || 0}{' '}
                      - {challenge.opponent_final_score || 0}
                    </p>
                    <p className='text-xs text-yellow-600 mt-1'>
                      Đang chờ CLB xác nhận kết quả cuối cùng
                    </p>
                  </div>
                )}

                {challenge.message && (
                  <div className='p-3 bg-muted/50 rounded-lg'>
                    <p className='message-text'>"{challenge.message}"</p>
                  </div>
                )}

                {/* Action buttons */}
                <div className='flex items-center gap-2 pt-2 flex-wrap'>
                  <ThreeStepScoreWorkflow
                    challenge={challenge}
                    isClubOwner={isClubOwner[challenge.id] || false}
                    onScoreUpdated={handleScoreUpdated}
                  />

                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => toggleChat(challenge.id)}
                    className='gap-2'
                  >
                    <MessageSquare className='h-4 w-4' />
                    {isChatOpen ? 'Ẩn chat' : 'Nhắn tin'}
                  </Button>

                  <Button
                    variant='destructive'
                    size='sm'
                    onClick={() => setSelectedChallengeForCancel(challenge)}
                    className='gap-2'
                  >
                    <Ban className='h-4 w-4' />
                    Hủy thách đấu
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Chat component */}
            {isChatOpen && (
              <ChallengeChat
                challengeId={challenge.id}
                challengerName={challenge.challenger?.full_name || 'Người chơi'}
                opponentName={challenge.opponent?.full_name || 'Người chơi'}
                challengerId={challenge.challenger_id}
                opponentId={challenge.opponent_id || ''}
                isOpen={isChatOpen}
                onToggle={() => toggleChat(challenge.id)}
              />
            )}
          </div>
        );
      })}

      {/* Cancel Challenge Modal */}
      <CancelChallengeModal
        isOpen={!!selectedChallengeForCancel}
        onClose={() => setSelectedChallengeForCancel(null)}
        onConfirm={handleCancelChallenge}
        challengerName={selectedChallengeForCancel?.challenger?.full_name}
        opponentName={selectedChallengeForCancel?.opponent?.full_name}
      />
    </div>
  );
};

export default ActiveChallengesSection;
