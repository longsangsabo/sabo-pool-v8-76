import React, { useState, useEffect } from 'react';
import { ArrowLeft, Zap, Users, Target, Sword } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '../components/MobileLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TechButton, TechStatCard } from '@/components/ui/sabo-tech-global';
import { TechChallengesHeader } from '@/components/challenges/tech/TechChallengesHeader';
import { TechChallengeFab } from '@/components/challenges/tech/TechChallengeFab';
import { SwipeableChallengeCard } from '@/components/challenges/tech/SwipeableChallengeCard';
import { toast } from 'sonner';

const EnhancedChallengesPageV2 = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('all');
  const [mockChallenges, setMockChallenges] = useState([
    {
      id: '1',
      challenger: {
        name: 'Nguyễn Văn A',
        avatar: '/placeholder-avatar.jpg',
        rank: 'Pro',
        winRate: 75,
        totalMatches: 120
      },
      type: 'ranked' as const,
      stakes: 50000,
      handicap: {
        challenger: 0,
        opponent: 0
      },
      timeRemaining: '2h 15m',
      message: 'Thách đấu không giới hạn! Ai dám đấu với tôi?'
    },
    {
      id: '2',
      challenger: {
        name: 'Trần Thị B',
        avatar: '/placeholder-avatar.jpg',
        rank: 'Expert',
        winRate: 82,
        totalMatches: 95
      },
      type: 'casual' as const,
      stakes: 25000,
      handicap: {
        challenger: 0,
        opponent: 10
      },
      timeRemaining: '45m',
      message: 'Chơi cho vui thôi, không stress!'
    }
  ]);

  const liveChallengesCount = mockChallenges.length;

  const handleSwipe = (direction: 'left' | 'right', challengeId: string) => {
    if (direction === 'left') {
      handleRejectChallenge(challengeId);
    } else {
      handleAcceptChallenge(challengeId);
    }
  };

  const handleAcceptChallenge = (challengeId: string) => {
    setMockChallenges(prev => prev.filter(c => c.id !== challengeId));
    toast.success('Thách đấu đã được chấp nhận!');
  };

  const handleRejectChallenge = (challengeId: string) => {
    setMockChallenges(prev => prev.filter(c => c.id !== challengeId));
    toast.error('Thách đấu đã bị từ chối');
  };

  const handleCreateChallenge = () => {
    toast.info('Tính năng tạo thách đấu đang được phát triển');
  };

  // Apply tech theme
  useEffect(() => {
    document.body.classList.add('tech-theme');
    return () => document.body.classList.remove('tech-theme');
  }, []);

  const challengeStats = [
    { label: 'Đã thắng', value: 12, icon: <Zap className="w-5 h-5" />, variant: 'primary' as const },
    { label: 'Tỷ lệ thắng', value: '60%', icon: <Target className="w-5 h-5" />, variant: 'success' as const },
    { label: 'Đã thua', value: 8, icon: <Users className="w-5 h-5" />, variant: 'warning' as const },
    { label: 'Tổng trận', value: 20, icon: <Sword className="w-5 h-5" />, variant: 'danger' as const }
  ];

  return (
    <MobileLayout>
      <div className='min-h-screen tech-background'>
        <TechChallengesHeader liveChallengesCount={liveChallengesCount} />
        
        <TechChallengeFab onCreateChallenge={handleCreateChallenge} />
        
        {/* Quick Stats */}
        <div className='p-4'>
          <div className='grid grid-cols-2 gap-4 mb-6'>
            {challengeStats.map((stat, index) => (
              <TechStatCard
                key={index}
                label={stat.label}
                value={stat.value}
                icon={stat.icon}
                variant={stat.variant}
              />
            ))}
          </div>

          {/* Categories */}
          <div className='mb-6'>
            <div className='flex gap-3 overflow-x-auto pb-2'>
              <TechButton
                variant={activeCategory === 'all' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setActiveCategory('all')}
              >
                Tất cả
              </TechButton>
              <TechButton
                variant={activeCategory === 'ranked' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setActiveCategory('ranked')}
              >
                Ranked
              </TechButton>
              <TechButton
                variant={activeCategory === 'casual' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setActiveCategory('casual')}
              >
                Casual
              </TechButton>
            </div>
          </div>

          {/* Challenge Cards */}
          <div className='tech-challenge-cards-container'>
            {mockChallenges.length > 0 ? (
              <div className='challenge-cards-stack'>
                {mockChallenges.map((challenge, index) => (
                  <SwipeableChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    onSwipe={handleSwipe}
                    onAccept={() => handleAcceptChallenge(challenge.id)}
                    onReject={() => handleRejectChallenge(challenge.id)}
                    style={{ zIndex: mockChallenges.length - index }}
                  />
                ))}
              </div>
            ) : (
              <div className='challenges-empty-state text-center py-12'>
                <Sword className='w-16 h-16 mx-auto mb-4 text-muted-foreground' />
                <h3 className='text-lg font-semibold mb-2'>Không có thách đấu nào</h3>
                <p className='text-muted-foreground mb-4'>Tạo thách đấu mới để bắt đầu!</p>
                <TechButton onClick={handleCreateChallenge}>
                  Tạo thách đấu
                </TechButton>
              </div>
            )}
            
            {/* Action Buttons */}
            {mockChallenges.length > 0 && (
              <div className='challenge-action-buttons mt-6'>
                <TechButton 
                  variant="danger"
                  onClick={() => mockChallenges.length > 0 && handleRejectChallenge(mockChallenges[0].id)}
                  className="flex-1"
                >
                  TỪ CHỐI
                </TechButton>
                <TechButton 
                  variant="success"
                  onClick={() => mockChallenges.length > 0 && handleAcceptChallenge(mockChallenges[0].id)}
                  className="flex-1"
                >
                  CHẤP NHẬN
                </TechButton>
              </div>
            )}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};

export default EnhancedChallengesPageV2;