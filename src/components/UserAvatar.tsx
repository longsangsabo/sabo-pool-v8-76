import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RankBadge } from '@/components/ranking/RankBadge';
import { getNormalizedRank } from '@/lib/rankUtils';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface User {
  id?: string;
  name: string;
  avatar?: string;
  rank?: string;
  verified_rank?: string;
  current_rank?: string;
}

interface UserAvatarProps {
  // Option 1: Pass user data directly (legacy mode)
  user?: User;
  // Option 2: Pass userId to auto-fetch (new mode)
  userId?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  showRank?: boolean;
  showName?: boolean;
  compact?: boolean;
}

const UserAvatar = ({
  user,
  userId,
  size = 'md',
  className,
  showRank = false,
  showName = true,
  compact = false,
}: UserAvatarProps) => {
  // Constants defined at the top
  const sizeClasses = {
    xs: 'h-6 w-6',
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  const rankSize = {
    xs: 'sm',
    sm: 'sm',
    md: 'md',
    lg: 'lg',
  } as const;

  // Auto-fetch user data if userId is provided
  const {
    data: fetchedUserData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['user-avatar', userId],
    queryFn: async () => {
      if (!userId) return null;

      // Fetch user profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(
          'user_id, full_name, display_name, avatar_url, verified_rank, elo'
        )
        .eq('user_id', userId)
        .single();

      if (profileError) throw profileError;

      // Fetch player ranking data
      const { data: ranking } = await supabase
        .from('player_rankings')
        .select('current_rank, spa_points, elo_points')
        .eq('user_id', userId)
        .single();

      return {
        id: profile.user_id,
        name: profile.display_name || profile.full_name || 'User',
        avatar: profile.avatar_url,
        verified_rank: ranking?.current_rank || 'K',
        rank: ranking?.current_rank || 'K',
        current_rank: ranking?.current_rank || 'K',
        elo: ranking?.elo_points || profile.elo,
      };
    },
    enabled: !!userId && !user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Set up real-time subscription for user data updates
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('user-avatar-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${userId}`,
        },
        () => refetch()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'player_rankings',
          filter: `user_id=eq.${userId}`,
        },
        () => refetch()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, refetch]);

  // Determine which user data to use
  const activeUser = user || fetchedUserData;

  // Handle loading state when auto-fetching
  if (userId && !user && isLoading) {
    return (
      <div
        className={`${sizeClasses[size]} bg-muted rounded-full flex items-center justify-center`}
      >
        <Loader2 className='w-3 h-3 animate-spin text-muted-foreground' />
      </div>
    );
  }

  // Handle empty state
  if (!activeUser) {
    if (userId) {
      return (
        <div
          className={`${sizeClasses[size]} bg-muted rounded-full flex items-center justify-center`}
        >
          <span className='text-muted-foreground text-xs'>TBD</span>
        </div>
      );
    }
    return null;
  }

  const normalizedRank = getNormalizedRank({
    verified_rank: activeUser.verified_rank,
    current_rank: activeUser.current_rank,
    rank: activeUser.rank,
  });

  if (compact) {
    return (
      <div className='flex items-center gap-2'>
        <div className='relative'>
          <Avatar className={`${sizeClasses[size]} ${className}`}>
            <AvatarImage src={activeUser.avatar} alt={activeUser.name} />
            <AvatarFallback className='text-xs'>
              {activeUser.name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          {showRank && (
            <div className='absolute -bottom-1 -right-1'>
              <RankBadge
                rank={normalizedRank}
                size={rankSize[size]}
                showTooltip={false}
              />
            </div>
          )}
        </div>
        {showName && (
          <div className='min-w-0 flex-1'>
            <div className='text-sm font-medium truncate'>
              {activeUser.name}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className='flex items-center gap-3'>
      <div className='relative'>
        <Avatar className={`${sizeClasses[size]} ${className}`}>
          <AvatarImage src={activeUser.avatar} alt={activeUser.name} />
          <AvatarFallback>
            {activeUser.name?.charAt(0)?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        {showRank && (
          <div className='absolute -bottom-1 -right-1'>
            <RankBadge
              rank={normalizedRank}
              size={rankSize[size]}
              showTooltip={true}
            />
          </div>
        )}
      </div>
      {showName && (
        <div className='min-w-0 flex-1'>
          <div className='font-medium truncate'>{activeUser.name}</div>
        </div>
      )}
    </div>
  );
};

export default UserAvatar;
