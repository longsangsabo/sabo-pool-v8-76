import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Settings,
  X,
  Star,
  Zap,
  Filter,
  RefreshCw,
  Users,
  Trophy,
  MapPin,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useDiscovery } from '@/hooks/useDiscovery';
import { useProfile } from '@/hooks/useProfile';

import EnhancedPlayerCard from '@/components/EnhancedPlayerCard';
import ChallengeModal from '@/components/ChallengeModal';
import DiscoveryFilters from '@/components/DiscoveryFilters';
import DiscoveryStats from '@/components/DiscoveryStats';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserProfile } from '@/types/common';

const EnhancedDiscoveryPage = () => {
  const navigate = useNavigate();
  const { items: nearbyPlayers, loading, sendChallenge } = useDiscovery();
  const { getProfile, updateProfile } = useProfile();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOpponent, setSelectedOpponent] = useState<UserProfile | null>(
    null
  );
  const [swipeDirection, setSwipeDirection] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    rankRange: ['K1', 'G+'],
    maxDistance: 50,
    minBetPoints: 10,
    maxBetPoints: 100,
  });

  const currentPlayer = nearbyPlayers[currentIndex];
  const remainingPlayers = nearbyPlayers.length - currentIndex;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userProfile = await getProfile();
        setProfile(userProfile);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    fetchProfile();
  }, [getProfile]);

  useEffect(() => {
    if (currentIndex >= nearbyPlayers.length && nearbyPlayers.length > 0) {
      // Reset to start or load more players
      setCurrentIndex(0);
      toast.info('Đã hết người chơi. Quay lại từ đầu!');
    }
  }, [currentIndex, nearbyPlayers.length]);

  const handleSwipe = (direction: string, player: UserProfile) => {
    if (!player) return;

    setSwipeDirection(direction);

    setTimeout(() => {
      if (direction === 'right') {
        // Swipe right = Challenge
        setSelectedOpponent(player);
        setShowChallengeModal(true);
      } else if (direction === 'left') {
        // Swipe left = Pass
        toast(`Đã bỏ qua ${player.full_name}`, { duration: 2000 });
        nextPlayer();
      } else if (direction === 'up') {
        // Swipe up = Super like
        toast.success(`⭐ Đã thích ${player.full_name}!`, { duration: 3000 });
        nextPlayer();
      }
      setSwipeDirection(null);
    }, 300);
  };

  const handleSendChallenge = async (challengeData: {
    betPoints: number;
    message: string;
  }) => {
    if (!selectedOpponent) return;

    try {
      await sendChallenge.mutateAsync({
        challengedId: selectedOpponent.user_id || selectedOpponent.id,
        betPoints: challengeData.betPoints,
        message: challengeData.message,
      });

      setShowChallengeModal(false);
      toast.success(`⚡ Đã gửi thách đấu cho ${selectedOpponent.full_name}!`);
      nextPlayer();
    } catch (error) {
      console.error('Error sending challenge:', error);
      toast.error('Có lỗi xảy ra khi gửi thách đấu');
    }
  };

  const nextPlayer = () => {
    if (currentIndex < nearbyPlayers.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // End of players
      setCurrentIndex(0);
    }
  };

  const refreshPlayers = () => {
    setCurrentIndex(0);
    toast.success('Đã làm mới danh sách!');
  };

  // Transform DiscoveryItem to UserProfile for compatibility
  const transformedPlayers = nearbyPlayers.map(item => ({
    id: item.id,
    user_id: item.id,
    full_name: item.title,
    avatar_url: item.image_url || '',
    current_rank: item.rank || 'K1',
    ranking_points: item.points || 0,
    min_bet_points: 10,
    max_bet_points: 100,
    matches_played: 0,
    matches_won: 0,
    // Add other required properties with defaults
    first_name: '',
    last_name: '',
    nickname: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: 'male' as const,
    address: '',
    bio: '',
    experience_years: 0,
    favorite_game_types: [],
    achievements: [],
    social_media_links: {},
    privacy_settings: {},
    notification_preferences: {},
    location: '',
    club_id: '',
    total_matches: 0,
    wins: 0,
    losses: 0,
    current_streak: 0,
    created_at: '',
    updated_at: '',
  }));

  if (loading) {
    return (
      <div className='flex items-center justify-center h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500'>
        <div className='text-center text-white'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4'></div>
          <p className='text-lg font-semibold'>Đang tìm đối thủ...</p>
          <p className='text-sm opacity-80 mt-2'>Vui lòng chờ một chút</p>
        </div>
      </div>
    );
  }

  return (
    <div className='h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 relative overflow-hidden'>
      {/* Header */}
      <div className='flex justify-between items-center p-4 pt-12 text-white relative z-20'>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => navigate(-1)}
          className='text-white hover:bg-white/20'
        >
          <ArrowLeft className='w-6 h-6' />
        </Button>
        <div className='text-center'>
          <h1 className='text-xl font-bold'>Tìm đối thủ</h1>
          <Badge
            variant='secondary'
            className='mt-1 bg-white/20 text-white border-none'
          >
            <Users className='w-3 h-3 mr-1' />
            {remainingPlayers} người
          </Badge>
        </div>
        <div className='flex space-x-2'>
          <Button
            variant='ghost'
            size='sm'
            onClick={refreshPlayers}
            className='text-white hover:bg-white/20'
          >
            <RefreshCw className='w-5 h-5' />
          </Button>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => setShowFilters(true)}
            className='text-white hover:bg-white/20'
          >
            <Filter className='w-5 h-5' />
          </Button>
        </div>
      </div>

      {/* Enhanced Stats Bar */}
      <DiscoveryStats
        userPoints={profile?.ranking_points || 0}
        userRank={profile?.current_rank || 'K1'}
        remainingPlayers={remainingPlayers}
        currentPlayer={transformedPlayers[currentIndex]}
      />

      {/* Card Stack */}
      <div className='absolute inset-x-4 top-32 bottom-32 z-10'>
        <div className='relative h-full'>
          <AnimatePresence mode='wait'>
            {transformedPlayers.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className='absolute inset-0 flex items-center justify-center'
              >
                <div className='bg-white rounded-2xl p-8 text-center shadow-2xl'>
                  <Users className='w-16 h-16 mx-auto mb-4 text-gray-400' />
                  <h3 className='text-xl font-bold text-gray-800 mb-2'>
                    Không có đối thủ
                  </h3>
                  <p className='text-gray-600 mb-4'>
                    Hiện tại không có người chơi phù hợp
                  </p>
                  <Button onClick={refreshPlayers} className='w-full'>
                    <RefreshCw className='w-4 h-4 mr-2' />
                    Làm mới
                  </Button>
                </div>
              </motion.div>
            ) : (
              transformedPlayers
                .slice(currentIndex, currentIndex + 3)
                .map((player, index) => (
                  <motion.div
                    key={`${player.user_id}-${currentIndex}`}
                    initial={{ scale: 0.8, opacity: 0, rotateY: 90 }}
                    animate={{
                      scale: 1 - index * 0.05,
                      opacity: 1 - index * 0.2,
                      rotateY: 0,
                      y: index * 10,
                      zIndex: 10 - index,
                    }}
                    exit={{
                      scale: 0.8,
                      opacity: 0,
                      x:
                        swipeDirection === 'left'
                          ? -300
                          : swipeDirection === 'right'
                            ? 300
                            : 0,
                      y: swipeDirection === 'up' ? -300 : 0,
                      rotate:
                        swipeDirection === 'left'
                          ? -30
                          : swipeDirection === 'right'
                            ? 30
                            : 0,
                    }}
                    transition={{
                      duration: 0.3,
                      type: 'spring',
                      stiffness: 200,
                      damping: 20,
                    }}
                    className='absolute inset-0'
                    style={{ zIndex: 10 - index }}
                  >
                    <EnhancedPlayerCard
                      player={player}
                      index={index}
                      onChallenge={
                        index === 0
                          ? () => handleSwipe('right', player)
                          : undefined
                      }
                    />
                  </motion.div>
                ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Enhanced Action Buttons */}
      {transformedPlayers[currentIndex] && (
        <div className='absolute bottom-20 left-1/2 transform -translate-x-1/2 flex space-x-6 z-20'>
          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.1 }}
            onClick={() =>
              handleSwipe('left', transformedPlayers[currentIndex])
            }
            className='w-14 h-14 bg-red-500 rounded-full shadow-lg flex items-center justify-center hover:bg-red-600 transition-colors'
          >
            <X className='w-6 h-6 text-white' />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.1 }}
            onClick={() => handleSwipe('up', transformedPlayers[currentIndex])}
            className='w-12 h-12 bg-blue-500 rounded-full shadow-lg flex items-center justify-center hover:bg-blue-600 transition-colors'
          >
            <Star className='w-5 h-5 text-white' />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.1 }}
            onClick={() =>
              handleSwipe('right', transformedPlayers[currentIndex])
            }
            className='w-16 h-16 bg-green-500 rounded-full shadow-lg flex items-center justify-center hover:bg-green-600 transition-colors'
          >
            <Zap className='w-8 h-8 text-white' />
          </motion.button>
        </div>
      )}

      {/* Enhanced Swipe Instructions */}
      <div className='absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white text-center text-sm opacity-70 z-20'>
        <div className='flex items-center justify-center space-x-4'>
          <div className='flex items-center'>
            <X className='w-4 h-4 mr-1 text-red-400' />
            <span>Bỏ qua</span>
          </div>
          <div className='flex items-center'>
            <Star className='w-4 h-4 mr-1 text-blue-400' />
            <span>Thích</span>
          </div>
          <div className='flex items-center'>
            <Zap className='w-4 h-4 mr-1 text-green-400' />
            <span>Thách đấu</span>
          </div>
        </div>
      </div>

      {/* Challenge Modal */}
      <ChallengeModal
        opponent={selectedOpponent}
        isOpen={showChallengeModal}
        onClose={() => setShowChallengeModal(false)}
        onSendChallenge={handleSendChallenge}
      />

      {/* Filters Modal */}
      <DiscoveryFilters
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onFiltersChange={setFilters}
      />
    </div>
  );
};

export default EnhancedDiscoveryPage;
