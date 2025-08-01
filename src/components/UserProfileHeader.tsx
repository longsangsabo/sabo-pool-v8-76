import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import UserAvatar from '@/components/UserAvatar';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Crown, Star, Coins } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const UserProfileHeader = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [rankings, setRankings] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load complete profile data with rankings and wallet
  const loadProfileData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      console.log('🔍 Loading complete profile data for user:', user.id);

      // Get profile, rankings, and wallet data in parallel
      const [profileResult, rankingsResult, walletResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('player_rankings')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('wallets')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),
      ]);

      if (profileResult.error) {
        console.error('❌ Profile error:', profileResult.error);
        throw profileResult.error;
      }

      console.log('✅ Profile data loaded:', profileResult.data);
      console.log('✅ Rankings data loaded:', rankingsResult.data);
      console.log('✅ Wallet data loaded:', walletResult.data);

      setProfile(profileResult.data);
      setRankings(rankingsResult.data);
      setWallet(walletResult.data);
    } catch (error) {
      console.error('❌ Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadProfileData();
  }, [user]);

  // Real-time subscriptions for automatic updates
  useEffect(() => {
    if (!user) return;

    console.log('🔔 Setting up real-time subscriptions for profile updates');

    const profileChannel = supabase
      .channel('profile-realtime-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user.id}`,
        },
        payload => {
          console.log('📊 Profile updated via real-time:', payload);
          setProfile(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'player_rankings',
          filter: `user_id=eq.${user.id}`,
        },
        payload => {
          console.log('🏆 Rankings updated via real-time:', payload);
          setRankings(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'wallets',
          filter: `user_id=eq.${user.id}`,
        },
        payload => {
          console.log('💰 Wallet updated via real-time:', payload);
          setWallet(payload.new);
        }
      )
      .subscribe(status => {
        console.log('🔔 Real-time subscription status:', status);
      });

    return () => {
      console.log('🔕 Cleaning up real-time subscriptions');
      supabase.removeChannel(profileChannel);
    };
  }, [user]);

  if (loading) {
    return (
      <Card className='mb-6'>
        <CardContent className='p-6'>
          <div className='flex items-center space-x-4'>
            <div className='h-16 w-16 bg-muted rounded-full animate-pulse'></div>
            <div className='space-y-2'>
              <div className='h-4 bg-muted rounded w-32 animate-pulse'></div>
              <div className='h-3 bg-muted rounded w-20 animate-pulse'></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return null;
  }

  // Transform profile data to match UserAvatar expected format
  const userForAvatar = {
    id: profile.user_id,
    name: profile.display_name || profile.full_name || 'Chưa có tên',
    avatar: profile.avatar_url,
    rank: profile.verified_rank || profile.current_rank,
  };

  const getRankColor = (rank: string) => {
    if (!rank || rank === 'K') return 'secondary';
    if (['E+', 'E'].includes(rank)) return 'destructive';
    if (['F+', 'F'].includes(rank)) return 'default';
    return 'default';
  };

  return (
    <Card className='mb-6 border-gradient-primary bg-gradient-subtle'>
      <CardContent className='p-6'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-4'>
            <UserAvatar user={userForAvatar} size='lg' showRank={false} />
            <div className='space-y-2'>
              <div>
                <h2 className='text-xl font-semibold text-foreground'>
                  {profile.display_name || profile.full_name || 'Chưa có tên'}
                </h2>
                <p className='text-muted-foreground text-sm'>
                  Quản lý Câu lạc bộ
                </p>
              </div>
              <div className='flex items-center gap-2 flex-wrap'>
                {profile.verified_rank && (
                  <Badge
                    variant={getRankColor(profile.verified_rank)}
                    className='flex items-center gap-1'
                  >
                    <Crown className='w-3 h-3' />
                    Hạng {profile.verified_rank}
                  </Badge>
                )}
                {rankings?.elo_points && (
                  <Badge variant='outline' className='flex items-center gap-1'>
                    <Star className='w-3 h-3' />
                    {rankings.elo_points} ELO
                  </Badge>
                )}
                {rankings?.spa_points && (
                  <Badge
                    variant='secondary'
                    className='flex items-center gap-1'
                  >
                    <Coins className='w-3 h-3' />
                    {rankings.spa_points} SPA
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className='text-right space-y-1'>
            <div className='text-sm text-muted-foreground'>Tổng trận đấu</div>
            <div className='text-2xl font-bold text-foreground'>
              {rankings?.total_matches || 0}
            </div>
            <div className='text-xs text-muted-foreground'>
              {rankings?.wins || 0} thắng • {wallet?.points_balance || 0} SPA
              Points
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserProfileHeader;
