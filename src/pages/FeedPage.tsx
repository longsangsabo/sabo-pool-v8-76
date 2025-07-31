
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Plus,
  Filter,
  Search,
  Users,
  Trophy,
  MapPin,
  Bell,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';

import TournamentFeedCard from '@/components/TournamentFeedCard';
import { EnhancedChallengeCard } from '@/components/challenges/EnhancedChallengeCard';
import { EnhancedAuthFlow } from '@/components/auth/EnhancedAuthFlow';
import SocialFeedCard from '@/components/SocialFeedCard';
import CreatePostModal from '@/components/CreatePostModal';
import { useTournaments } from '@/hooks/useTournaments';
import { useChallenges } from '@/hooks/useChallenges';
import { useAuth } from '@/hooks/useAuth';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useRealtimeFeed } from '@/hooks/useRealtimeFeed';
import { toast } from 'sonner';

const FeedPage = () => {
  const { user } = useAuth();
  const { tournaments, joinTournament } = useTournaments();
  const { receivedChallenges } = useChallenges();
  const { userLocation, requestLocationPermission } = useUserLocation();
  const { 
    feedPosts, 
    isConnected, 
    handleLike, 
    handleComment, 
    handleShare, 
    handleChallenge,
    refreshFeed,
    createPost
  } = useRealtimeFeed();
  const [showAuthFlow, setShowAuthFlow] = useState(false);
  const [activeTab, setActiveTab] = useState('social');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Show auth flow if user is not logged in
  useEffect(() => {
    if (!user) {
      setShowAuthFlow(true);
    }
  }, [user]);

  const handleJoinTournament = async (tournamentId: string) => {
    if (!user) {
      setShowAuthFlow(true);
      return;
    }

    try {
      await joinTournament.mutateAsync({ tournamentId });
    } catch (error) {
      console.error('Error joining tournament:', error);
    }
  };

  const handleChallengeAction = (action: string, challengeId: string) => {
    toast.success(
      `Thách đấu đã được ${action === 'accepted' ? 'chấp nhận' : 'từ chối'}`
    );
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshFeed();
    setIsRefreshing(false);
    toast.success('Đã làm mới feed!');
  };

  const handleCreatePost = async (content: string) => {
    await createPost(content);
    toast.success('Đã đăng bài thành công!');
  };

  const filteredTournaments = tournaments.filter(
    tournament =>
      tournament.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tournament.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredChallenges = receivedChallenges.filter(challenge =>
    challenge.challenger_profile?.full_name
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return (
      <>
        {showAuthFlow && (
          <EnhancedAuthFlow
            onSuccess={() => {
              setShowAuthFlow(false);
              toast.success('Chào mừng bạn đến với SABO! 🎱');
            }}
          />
        )}
        <div className='flex items-center justify-center min-h-screen bg-gray-50'>
          <div className='text-center p-8'>
            <h1 className='text-2xl font-bold mb-4'>Chào mừng đến SABO</h1>
            <p className='text-gray-600 mb-6'>
              Vui lòng đăng nhập để tiếp tục
            </p>
            <Button onClick={() => setShowAuthFlow(true)}>Đăng nhập</Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Bảng Tin Cộng Đồng - SABO Billiards</title>
        <meta name="description" content="Theo dõi hoạt động, giải đấu và thách đấu từ cộng đồng bi-a SABO" />
      </Helmet>

    <div className='bg-gray-50 min-h-screen'>
      {/* Header với Tabs */}
      <div className='sticky top-0 bg-white border-b border-gray-200 z-10 shadow-sm'>
        <div className='px-4 py-3'>
          <h1 className='text-xl font-bold text-gray-900 mb-3'>Feed</h1>
          <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
            <TabsList className='grid w-full grid-cols-4 bg-gray-100 rounded-lg p-1'>
              <TabsTrigger 
                value='all' 
                className='text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm'
              >
                Tất cả
              </TabsTrigger>
              <TabsTrigger 
                value='tournaments' 
                className='text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm'
              >
                Giải đấu
              </TabsTrigger>
              <TabsTrigger 
                value='challenges' 
                className='text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm'
              >
                Thách đấu
              </TabsTrigger>
              <TabsTrigger 
                value='social' 
                className='text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm'
              >
                Cộng đồng
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      <div className='p-4 space-y-4'>
        <TabsContent value='social' className='mt-0 space-y-4'>
          {feedPosts.length === 0 ? (
            <div className='text-center py-12'>
              <div className='text-6xl mb-4'>👥</div>
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>Chưa có bài viết</h3>
              <p className='text-gray-600'>Không có bài viết mới nào.</p>
            </div>
          ) : (
            feedPosts.map((post, index) => (
              <SocialFeedCard 
                key={`social-${index}`}
                post={post}
                onLike={handleLike}
                onComment={handleComment}
                onShare={handleShare}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value='tournaments' className='mt-0 space-y-4'>
          {filteredTournaments.length === 0 ? (
            <div className='text-center py-12'>
              <div className='text-6xl mb-4'>🏆</div>
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>Chưa có giải đấu</h3>
              <p className='text-gray-600'>Không có giải đấu mới nào.</p>
            </div>
          ) : (
            filteredTournaments.map((tournament, index) => (
              <TournamentFeedCard 
                key={`tournament-${index}`}
                tournament={tournament} 
                onJoin={() => handleJoinTournament(tournament.id)}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value='challenges' className='mt-0 space-y-4'>
          {filteredChallenges.length === 0 ? (
            <div className='text-center py-12'>
              <div className='text-6xl mb-4'>⚔️</div>
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>Chưa có thách đấu</h3>
              <p className='text-gray-600'>Không có thách đấu mới nào.</p>
            </div>
          ) : (
            filteredChallenges.map((challenge, index) => (
              <EnhancedChallengeCard 
                key={`challenge-${index}`}
                challenge={challenge} 
                onAction={(action) => handleChallengeAction(action, challenge.id)}
              />
            ))
          )}
        </TabsContent>
      </div>

      {/* Floating Action Button */}
      <div className='fixed bottom-20 right-4 z-50'>
        <Button 
          size="lg"
          className='w-14 h-14 rounded-full bg-primary hover:bg-primary/90'
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreatePost}
      />
    </div>
    </>
  );
};

export default FeedPage;
