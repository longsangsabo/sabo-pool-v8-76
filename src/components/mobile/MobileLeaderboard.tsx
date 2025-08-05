import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Crown, Medal, Trophy } from 'lucide-react';
import { useLeaderboard } from '@/hooks/useLeaderboard';

interface MobileLeaderboardProps {
  className?: string;
}

const MobileLeaderboard: React.FC<MobileLeaderboardProps> = ({ className }) => {
  const [activeTab, setActiveTab] = useState<'elo' | 'spa'>('elo');
  const { leaderboard, loading, error, updateFilters } = useLeaderboard();

  // Sort data based on active tab
  const sortedData = React.useMemo(() => {
    if (!leaderboard.length) return [];

    const sorted = [...leaderboard].sort((a, b) => {
      if (activeTab === 'elo') {
        return (b.elo || 0) - (a.elo || 0);
      } else {
        return (b.ranking_points || 0) - (a.ranking_points || 0);
      }
    });

    return sorted.slice(0, 50); // Show top 50
  }, [leaderboard, activeTab]);

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className='w-5 h-5 text-yellow-500' />;
      case 2:
        return <Medal className='w-5 h-5 text-gray-400' />;
      case 3:
        return <Trophy className='w-5 h-5 text-amber-600' />;
      default:
        return null;
    }
  };

  const getRankBadgeColor = (rank: string) => {
    const rankColors: Record<string, string> = {
      'Chủ tịch': 'bg-gradient-to-r from-purple-500 to-pink-500',
      'Cao thủ': 'bg-gradient-to-r from-blue-500 to-indigo-500',
      'Thạc sĩ': 'bg-gradient-to-r from-green-500 to-emerald-500',
      'Chuyên viên': 'bg-gradient-to-r from-orange-500 to-red-500',
      'Nghiệp dư': 'bg-gradient-to-r from-gray-400 to-gray-500',
    };
    return rankColors[rank] || 'bg-muted';
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'elo' | 'spa');
    updateFilters({
      sortBy: value === 'elo' ? 'elo' : ('ranking_points' as any),
      sortOrder: 'desc',
    });
  };

  if (loading) {
    return (
      <div className='space-y-3'>
        {[...Array(10)].map((_, i) => (
          <Card key={i} className='animate-pulse'>
            <CardContent className='p-4'>
              <div className='flex items-center space-x-3'>
                <div className='w-8 h-8 bg-muted rounded'></div>
                <div className='w-10 h-10 bg-muted rounded-full'></div>
                <div className='flex-1 space-y-2'>
                  <div className='h-4 bg-muted rounded w-3/4'></div>
                  <div className='h-3 bg-muted rounded w-1/2'></div>
                </div>
                <div className='h-6 w-16 bg-muted rounded'></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className='p-8 text-center'>
          <p className='text-destructive'>{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className='w-full'
      >
        <TabsList className='grid w-full grid-cols-2 mb-6'>
          <TabsTrigger value='elo' className='flex items-center gap-2'>
            <Trophy className='w-4 h-4' />
            ELO
          </TabsTrigger>
          <TabsTrigger value='spa' className='flex items-center gap-2'>
            <Crown className='w-4 h-4' />
            SPA
          </TabsTrigger>
        </TabsList>

        <TabsContent value='elo'>
          <div className='space-y-3'>
            {sortedData.map((player, index) => (
              <Card key={player.id} className='overflow-hidden'>
                <CardContent className='p-4'>
                  <div className='flex items-center space-x-3'>
                    {/* Top Position */}
                    <div className='flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-bold'>
                      {getRankIcon(index + 1) || index + 1}
                    </div>

                    {/* Avatar */}
                    <Avatar className='w-10 h-10'>
                      <AvatarImage src={player.avatar_url} />
                      <AvatarFallback>
                        {player.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    {/* User Info */}
                    <div className='flex-1 min-w-0'>
                      <p className='font-medium text-foreground truncate'>
                        {player.username}
                      </p>
                      <div className='flex items-center gap-2'>
                        <Badge
                          variant='secondary'
                          className={`text-xs text-white ${getRankBadgeColor(player.current_rank)}`}
                        >
                          {player.current_rank || 'Chưa xếp hạng'}
                        </Badge>
                      </div>
                    </div>

                    {/* ELO Points */}
                    <div className='text-right'>
                      <p className='text-lg font-bold text-primary'>
                        {player.elo.toLocaleString()}
                      </p>
                      <p className='text-xs text-muted-foreground'>ELO</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value='spa'>
          <div className='space-y-3'>
            {sortedData.map((player, index) => (
              <Card key={player.id} className='overflow-hidden'>
                <CardContent className='p-4'>
                  <div className='flex items-center space-x-3'>
                    {/* Top Position */}
                    <div className='flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-bold'>
                      {getRankIcon(index + 1) || index + 1}
                    </div>

                    {/* Avatar */}
                    <Avatar className='w-10 h-10'>
                      <AvatarImage src={player.avatar_url} />
                      <AvatarFallback>
                        {player.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    {/* User Info */}
                    <div className='flex-1 min-w-0'>
                      <p className='font-medium text-foreground truncate'>
                        {player.username}
                      </p>
                      <div className='flex items-center gap-2'>
                        <Badge
                          variant='secondary'
                          className={`text-xs text-white ${getRankBadgeColor(player.current_rank)}`}
                        >
                          {player.current_rank || 'Chưa xếp hạng'}
                        </Badge>
                      </div>
                    </div>

                    {/* SPA Points */}
                    <div className='text-right'>
                      <p className='text-lg font-bold text-secondary'>
                        {player.ranking_points.toLocaleString()}
                      </p>
                      <p className='text-xs text-muted-foreground'>SPA</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MobileLeaderboard;
