import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface TournamentPlayerAvatarProps {
  playerId: string | null;
  size?: 'sm' | 'md' | 'lg';
  showRank?: boolean;
}

const TournamentPlayerAvatar: React.FC<TournamentPlayerAvatarProps> = ({
  playerId,
  size = 'md',
  showRank = true,
}) => {
  console.log('🏆 TournamentPlayerAvatar render for playerId:', playerId);

  // Don't render anything if no playerId
  if (!playerId) {
    console.log('⚠️ No playerId provided');
    return (
      <div
        className={`${getSizeClasses(size)} bg-muted rounded-full flex items-center justify-center`}
      >
        <span className='text-muted-foreground text-xs'>TBD</span>
      </div>
    );
  }

  const {
    data: playerData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['tournament-player', playerId],
    queryFn: async () => {
      console.log('🎾 Fetching player data for:', playerId);

      // Fetch user profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(
          'user_id, full_name, display_name, avatar_url, verified_rank, elo'
        )
        .eq('user_id', playerId)
        .single();

      if (profileError) {
        console.error('❌ Profile fetch error:', profileError);
        throw profileError;
      }

      console.log('👤 Profile data:', profile);

      // Fetch player ranking data
      const { data: ranking, error: rankingError } = await supabase
        .from('player_rankings')
        .select('verified_rank, spa_points, elo_points')
        .eq('user_id', playerId) // Đã fix: dùng user_id thay vì player_id
        .single();

      if (rankingError) {
        console.warn('⚠️ Ranking fetch error (this is OK):', rankingError);
      }

      console.log('📊 Ranking data:', ranking);

      const result = {
        ...profile,
        ranking_verified_rank: ranking?.verified_rank,
        spa_points: ranking?.spa_points,
        ranking_elo: ranking?.elo_points,
      };

      console.log('✅ Final player data:', result);
      return result;
    },
    enabled: !!playerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Log any errors
  if (error) {
    console.error('🚨 Query error for player', playerId, ':', error);
  }

  // Set up real-time subscription for player data updates
  useEffect(() => {
    if (!playerId) return;

    const channel = supabase
      .channel('tournament-player-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${playerId}`,
        },
        () => refetch()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'player_rankings',
          filter: `user_id=eq.${playerId}`,
        },
        () => refetch()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [playerId, refetch]);

  // Calculate rank with fallback hierarchy
  const getPlayerRank = () => {
    if (playerData?.ranking_verified_rank)
      return playerData.ranking_verified_rank;
    if (playerData?.verified_rank) return playerData.verified_rank;

    // Calculate rank from ELO
    const elo = playerData?.ranking_elo || playerData?.elo || 1000;
    if (elo >= 1400) return 'E+';
    if (elo >= 1350) return 'E';
    if (elo >= 1300) return 'F+';
    if (elo >= 1250) return 'F';
    if (elo >= 1200) return 'G+';
    if (elo >= 1150) return 'G';
    if (elo >= 1100) return 'H+';
    if (elo >= 1050) return 'H';
    if (elo >= 1000) return 'I+';
    if (elo >= 950) return 'I';
    if (elo >= 900) return 'K+';
    return 'K';
  };

  // Get user initials
  const getInitials = () => {
    const name = playerData?.display_name || playerData?.full_name || 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // Loading state
  if (isLoading) {
    console.log('⏳ Loading player data for:', playerId);
    return (
      <div
        className={`${getSizeClasses(size)} bg-muted rounded-full flex items-center justify-center relative`}
      >
        <Loader2 className='w-3 h-3 animate-spin text-muted-foreground' />
      </div>
    );
  }

  // Error state
  if (error) {
    console.error('❌ Error loading player:', playerId, error);
    return (
      <div
        className={`${getSizeClasses(size)} bg-red-100 rounded-full flex items-center justify-center relative`}
      >
        <span className='text-red-500 text-xs'>!</span>
      </div>
    );
  }

  console.log('🎨 Rendering avatar for:', playerId, 'data:', playerData);

  return (
    <div className='relative inline-block'>
      <Avatar className={getSizeClasses(size)}>
        <AvatarImage
          src={playerData?.avatar_url || undefined}
          alt={playerData?.display_name || playerData?.full_name || 'Player'}
        />
        <AvatarFallback className='text-xs font-medium bg-primary/10 text-primary'>
          {getInitials()}
        </AvatarFallback>
      </Avatar>

      {showRank && (
        <Badge
          variant='secondary'
          className='absolute -bottom-1 -right-1 h-5 min-w-[20px] text-[10px] font-bold px-1 py-0 bg-gradient-to-br from-yellow-400 to-orange-500 text-white border-0'
        >
          {getPlayerRank()}
        </Badge>
      )}
    </div>
  );
};

// Helper function for size classes
const getSizeClasses = (size: 'sm' | 'md' | 'lg') => {
  switch (size) {
    case 'sm':
      return 'w-8 h-8';
    case 'lg':
      return 'w-12 h-12';
    default:
      return 'w-10 h-10';
  }
};

export default TournamentPlayerAvatar;
