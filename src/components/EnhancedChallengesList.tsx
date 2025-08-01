import React, { useState } from 'react';
import { Clock, Trophy, MapPin, Users, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useEnhancedChallenges } from '@/hooks/useEnhancedChallenges';
import { Challenge } from '@/types/challenge'; // Use the comprehensive challenge types
import ChallengeResponseModal from './ChallengeResponseModal';

const EnhancedChallengesList = () => {
  const {
    challenges,
    loading,
    completeChallengeEnhanced,
    isCompleting,
    dailyStats,
    canCreateChallenge,
    getRemainingChallenges,
  } = useEnhancedChallenges();

  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(
    null
  );
  const [showResponseModal, setShowResponseModal] = useState(false);

  const handleChallengeResponse = async (
    status: 'accepted' | 'declined',
    proposalData?: Challenge
  ) => {
    try {
      // Handle challenge response logic here
      console.log('Challenge response:', {
        challengeId: selectedChallenge?.id,
        status,
      });
      setShowResponseModal(false);
      setSelectedChallenge(null);
    } catch (error) {
      console.error('Error responding to challenge:', error);
    }
  };

  const handleCompleteChallenge = async (challenge: Challenge) => {
    if (!challenge.challenger_id || !challenge.opponent_id) return;

    try {
      await completeChallengeEnhanced({
        challengeId: challenge.id,
        winnerId: challenge.challenger_id, // Assuming challenger wins for demo
        loserId: challenge.opponent_id,
        winnerScore: challenge.race_to || 8,
        loserScore: (challenge.race_to || 8) - 2,
      });
    } catch (error) {
      console.error('Error completing challenge:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    if (diffInMinutes < 1440)
      return `${Math.floor(diffInMinutes / 60)} giờ trước`;
    return `${Math.floor(diffInMinutes / 1440)} ngày trước`;
  };

  const getChallengeStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'ongoing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getChallengeStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Chờ phản hồi';
      case 'accepted':
        return 'Đã chấp nhận';
      case 'ongoing':
        return 'Đang diễn ra';
      case 'completed':
        return 'Hoàn thành';
      case 'expired':
        return 'Hết hạn';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className='space-y-4'>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className='animate-pulse'>
            <CardContent className='p-4'>
              <div className='flex items-center space-x-4'>
                <div className='w-12 h-12 bg-gray-200 rounded-full'></div>
                <div className='flex-1 space-y-2'>
                  <div className='h-4 bg-gray-200 rounded w-3/4'></div>
                  <div className='h-3 bg-gray-200 rounded w-1/2'></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Daily Challenge Stats */}
      <Card className='bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200'>
        <CardHeader className='pb-3'>
          <CardTitle className='text-lg flex items-center gap-2'>
            <Trophy className='w-5 h-5 text-blue-600' />
            Thống kê thách đấu hôm nay
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 gap-4'>
            <div className='text-center'>
              <div className='text-2xl font-bold text-blue-600'>
                {dailyStats?.count || 0}/2
              </div>
              <div className='text-sm text-gray-600'>Thách đấu đã tham gia</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-green-600'>
                {getRemainingChallenges()}
              </div>
              <div className='text-sm text-gray-600'>Còn lại hôm nay</div>
            </div>
          </div>
          {!canCreateChallenge() && (
            <div className='mt-3 p-2 bg-yellow-100 border border-yellow-200 rounded-lg'>
              <div className='flex items-center gap-2 text-yellow-800 text-sm'>
                <AlertCircle className='w-4 h-4' />
                Bạn đã đạt giới hạn thách đấu hôm nay
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Challenges List */}
      <div className='space-y-4'>
        {challenges?.length === 0 ? (
          <Card>
            <CardContent className='p-8 text-center'>
              <Trophy className='w-12 h-12 text-gray-300 mx-auto mb-4' />
              <p className='text-gray-500 mb-4'>Chưa có thách đấu nào</p>
              <Button onClick={() => (window.location.href = '/discovery')}>
                Tìm đối thủ
              </Button>
            </CardContent>
          </Card>
        ) : (
          challenges?.map(challenge => (
            <Card
              key={challenge.id}
              className='hover:shadow-md transition-shadow'
            >
              <CardContent className='p-4'>
                <div className='flex items-start justify-between mb-4'>
                  <div className='flex items-center space-x-3'>
                    <Avatar className='w-10 h-10'>
                      <AvatarImage
                        src={
                          challenge.challenger_profile?.avatar_url ||
                          challenge.opponent_profile?.avatar_url
                        }
                      />
                      <AvatarFallback>
                        {
                          (challenge.challenger_profile?.full_name ||
                            challenge.opponent_profile?.full_name ||
                            'U')[0]
                        }
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className='font-medium'>
                        {challenge.challenger_profile?.full_name ||
                          challenge.opponent_profile?.full_name ||
                          'Người chơi'}
                      </div>
                      <div className='text-sm text-gray-500 flex items-center gap-2'>
                        <Badge variant='outline' className='text-xs'>
                          {challenge.challenger_profile?.verified_rank ||
                            challenge.opponent_profile?.verified_rank ||
                            'K'}
                        </Badge>
                        <span>•</span>
                        <span>
                          {challenge.challenger_profile?.spa_points ||
                            challenge.opponent_profile?.spa_points ||
                            0}{' '}
                          SPA
                        </span>
                      </div>
                    </div>
                  </div>
                  <Badge className={getChallengeStatusColor(challenge.status)}>
                    {getChallengeStatusText(challenge.status)}
                  </Badge>
                </div>

                <div className='space-y-3 mb-4'>
                  <div className='flex items-center justify-between text-sm'>
                    <span className='text-gray-600'>Mức cược:</span>
                    <span className='font-bold text-blue-600'>
                      {challenge.bet_points} điểm SPA
                    </span>
                  </div>

                  {challenge.race_to && (
                    <div className='flex items-center justify-between text-sm'>
                      <span className='text-gray-600'>Thể thức:</span>
                      <span>Race to {challenge.race_to}</span>
                    </div>
                  )}

                  {challenge.club && (
                    <div className='flex items-center gap-2 text-sm text-gray-600'>
                      <MapPin className='w-4 h-4' />
                      <span>{challenge.club.name}</span>
                    </div>
                  )}

                  {challenge.scheduled_time && (
                    <div className='flex items-center gap-2 text-sm text-gray-600'>
                      <Clock className='w-4 h-4' />
                      <span>
                        {new Date(challenge.scheduled_time).toLocaleString(
                          'vi-VN'
                        )}
                      </span>
                    </div>
                  )}

                  {challenge.message && (
                    <div className='p-2 bg-gray-50 rounded message-text'>
                      "{challenge.message}"
                    </div>
                  )}
                </div>

                <div className='flex items-center justify-between'>
                  <span className='text-xs text-gray-500'>
                    {formatTimeAgo(challenge.created_at)}
                  </span>

                  <div className='flex gap-2'>
                    {challenge.status === 'pending' && (
                      <Button
                        size='sm'
                        onClick={() => {
                          setSelectedChallenge(challenge);
                          setShowResponseModal(true);
                        }}
                      >
                        Phản hồi
                      </Button>
                    )}

                    {challenge.status === 'accepted' && (
                      <Button
                        size='sm'
                        onClick={() => handleCompleteChallenge(challenge)}
                        disabled={isCompleting}
                        className='bg-green-600 hover:bg-green-700'
                      >
                        {isCompleting ? 'Đang xử lý...' : 'Hoàn thành'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Challenge Response Modal */}
      {selectedChallenge && (
        <ChallengeResponseModal
          challenge={selectedChallenge}
          suggestedClubs={[]}
          isOpen={showResponseModal}
          onClose={() => {
            setShowResponseModal(false);
            setSelectedChallenge(null);
          }}
          onRespond={handleChallengeResponse}
        />
      )}
    </div>
  );
};

export default EnhancedChallengesList;
