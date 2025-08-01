import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Camera,
  Calendar,
  Trophy,
  Target,
  Zap,
  CheckCircle,
  Clock,
  XCircle,
  Building2,
  ArrowRight,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import TrustScoreBadgeMock from '@/components/TrustScoreBadgeMock';
import ProfileCompletionBadge from '@/components/profile/ProfileCompletionBadge';
import { formatRankDisplay } from '@/utils/eloToSaboRank';

interface ProfileData {
  user_id: string;
  display_name: string;
  phone: string;
  bio: string;
  skill_level: 'beginner' | 'intermediate' | 'advanced' | 'pro';
  city: string;
  district: string;
  avatar_url: string;
  member_since: string;
  role: 'player' | 'club_owner' | 'both';
  active_role: 'player' | 'club_owner';
  verified_rank: string | null;
  completion_percentage?: number;
}

interface PlayerStats {
  matches_played: number;
  matches_won: number;
  current_streak: number;
  win_rate: number;
  elo_points?: number;
}

interface RankVerificationStatus {
  status: 'verified' | 'pending' | 'none';
  current_rank?: string;
}

interface ProfileHeaderProps {
  profile: ProfileData;
  avatarUrl: string;
  uploading: boolean;
  onAvatarUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  skillLevels: {
    [key: string]: { label: string; color: string };
  };
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  avatarUrl,
  uploading,
  onAvatarUpload,
  skillLevels,
}) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [verificationStatus, setVerificationStatus] =
    useState<RankVerificationStatus>({
      status: 'none',
    });
  const [loading, setLoading] = useState(true);
  const [hasClubProfile, setHasClubProfile] = useState(false);
  const [clubLoading, setClubLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPlayerStats();
      fetchVerificationStatus();
      fetchClubProfile();
    }
  }, [user]);

  const fetchPlayerStats = async () => {
    if (!user) return;

    try {
      const { data: statsData, error } = await supabase
        .from('player_rankings')
        .select('total_matches, wins, spa_points')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching stats:', error);
        return;
      }

      const matches_played = statsData?.total_matches || 0;
      const matches_won = statsData?.wins || 0;
      const losses = matches_played - matches_won;
      const win_rate =
        matches_played > 0 ? (matches_won / matches_played) * 100 : 0;

      setStats({
        matches_played,
        matches_won,
        current_streak: 0, // We'll need to calculate this separately if needed
        win_rate: Math.round(win_rate),
      });
    } catch (error) {
      console.error('Error fetching player stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVerificationStatus = async () => {
    if (!user) return;

    try {
      // Check if user has verified rank in profile
      if (profile.verified_rank) {
        setVerificationStatus({
          status: 'verified',
          current_rank: profile.verified_rank,
        });
        return;
      }

      // For now, just set status to none since rank_verifications table doesn't exist yet
      setVerificationStatus({ status: 'none' });
    } catch (error) {
      console.error('Error fetching verification status:', error);
    }
  };

  const fetchClubProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await (supabase as any)
        .from('clubs')
        .select('id, status')
        .eq('owner_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching club profile:', error);
        setHasClubProfile(false);
        return;
      }

      setHasClubProfile(!!data);
    } catch (error) {
      console.error('Error fetching club profile:', error);
      setHasClubProfile(false);
    } finally {
      setClubLoading(false);
    }
  };

  const handleClubRegistrationClick = () => {
    // Navigate to club tab via URL parameter
    const url = new URL(window.location.href);
    url.searchParams.set('tab', 'club');
    window.history.pushState({}, '', url.toString());

    // Trigger a popstate event to notify the ProfileTabs component
    window.dispatchEvent(new PopStateEvent('popstate'));

    // Scroll to the tabs area
    setTimeout(() => {
      window.scrollTo({ top: 600, behavior: 'smooth' });
    }, 100);
  };

  const getVerificationIcon = () => {
    switch (verificationStatus.status) {
      case 'verified':
        return <CheckCircle className='w-4 h-4 text-green-600' />;
      case 'pending':
        return <Clock className='w-4 h-4 text-yellow-600' />;
      default:
        return <XCircle className='w-4 h-4 text-gray-400' />;
    }
  };

  const getVerificationText = () => {
    switch (verificationStatus.status) {
      case 'verified':
        return 'Đã xác minh';
      case 'pending':
        return 'Chờ xác minh';
      default:
        return 'Chưa xác minh';
    }
  };

  const getCurrentRank = () => {
    if (profile.verified_rank) {
      // For now, just return the rank text - ELO will be fetched separately
      return profile.verified_rank;
    }
    if (verificationStatus.current_rank) {
      return verificationStatus.current_rank;
    }
    return 'Chưa có hạng';
  };

  const getNewUserMessage = () => {
    if (verificationStatus.status === 'none' && !profile.verified_rank) {
      return 'Bạn cần xác thực hạng tại một CLB để có hạng chính thức';
    }
    return null;
  };

  return (
    <Card className='mb-6'>
      <CardContent className='p-6'>
        {/* Horizontal Header Layout */}
        <div className='flex flex-col lg:flex-row items-start gap-6'>
          {/* Avatar Section - Compact */}
          <div className='flex items-center gap-4 lg:min-w-fit'>
            <div className='relative'>
              <Avatar className='w-20 h-20'>
                <AvatarImage
                  src={avatarUrl || profile.avatar_url}
                  alt='Avatar'
                />
                <AvatarFallback className='text-lg'>
                  {profile.display_name?.charAt(0) || '👤'}
                </AvatarFallback>
              </Avatar>
              <label className='absolute bottom-0 right-0 bg-primary rounded-full p-1.5 cursor-pointer hover:bg-primary/90 transition-colors'>
                <Camera className='w-3 h-3 text-primary-foreground' />
                <input
                  type='file'
                  className='hidden'
                  accept='image/*'
                  onChange={onAvatarUpload}
                  disabled={uploading}
                />
              </label>
            </div>

            {/* Basic Info - Inline */}
            <div className='min-w-0'>
              <h2 className='text-xl font-semibold text-foreground mb-1'>
                {profile.display_name || 'Chưa đặt tên'}
              </h2>
              <div className='flex flex-wrap items-center gap-2 mb-2'>
                <Badge className={skillLevels[profile.skill_level].color}>
                  <Trophy className='w-3 h-3 mr-1' />
                  {skillLevels[profile.skill_level].label}
                </Badge>
                <TrustScoreBadgeMock
                  playerId={profile.user_id}
                  showFullDetails={false}
                />
              </div>
              {profile.member_since && (
                <p className='text-xs text-muted-foreground flex items-center'>
                  <Calendar className='w-3 h-3 mr-1' />
                  Tham gia{' '}
                  {new Date(profile.member_since).toLocaleDateString('vi-VN')}
                </p>
              )}
              {uploading && (
                <p className='text-xs text-primary mt-1'>Đang tải ảnh...</p>
              )}
            </div>
          </div>

          {/* Current Rank - Prominent */}
          <div className='flex-1 lg:max-w-xs'>
            <div className='bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-lg border border-primary/20'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-xs text-muted-foreground mb-1'>
                    Hạng hiện tại
                  </p>
                  <div className='flex items-center space-x-2'>
                    <span className='text-lg font-bold text-primary'>
                      {getCurrentRank()}
                    </span>
                    {getVerificationIcon()}
                  </div>
                  <p className='text-xs text-muted-foreground mt-1'>
                    {getVerificationText()}
                  </p>
                  {getNewUserMessage() && (
                    <p className='text-xs text-orange-600 mt-1 font-medium leading-tight'>
                      {getNewUserMessage()}
                    </p>
                  )}
                </div>
                <Trophy className='w-6 h-6 text-primary' />
              </div>
            </div>
          </div>

          {/* Stats Grid - Larger */}
          <div className='flex-1'>
            {loading || clubLoading ? (
              <div className='grid grid-cols-2 lg:grid-cols-4 gap-3'>
                {[1, 2, 3, 4].map(i => (
                  <div
                    key={i}
                    className='bg-muted/50 p-4 rounded-lg animate-pulse'
                  >
                    <div className='h-3 bg-muted rounded w-3/4 mb-2'></div>
                    <div className='h-5 bg-muted rounded w-1/2'></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='grid grid-cols-2 lg:grid-cols-4 gap-3'>
                <div className='bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200 hover:shadow-sm transition-shadow'>
                  <div className='flex flex-col'>
                    <div className='flex items-center justify-between mb-2'>
                      <p className='text-xs text-green-600 font-medium'>
                        Trận đấu
                      </p>
                      <Target className='w-4 h-4 text-green-500' />
                    </div>
                    <p className='text-xl font-bold text-green-700'>
                      {stats?.matches_played || 0}
                    </p>
                  </div>
                </div>

                <div className='bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200 hover:shadow-sm transition-shadow'>
                  <div className='flex flex-col'>
                    <div className='flex items-center justify-between mb-2'>
                      <p className='text-xs text-blue-600 font-medium'>
                        Tỷ lệ thắng
                      </p>
                      <Trophy className='w-4 h-4 text-blue-500' />
                    </div>
                    <p className='text-xl font-bold text-blue-700'>
                      {stats?.win_rate?.toFixed(0) || 0}%
                    </p>
                  </div>
                </div>

                <div className='bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200 hover:shadow-sm transition-shadow'>
                  <div className='flex flex-col'>
                    <div className='flex items-center justify-between mb-2'>
                      <p className='text-xs text-orange-600 font-medium'>
                        Chuỗi thắng
                      </p>
                      <Zap className='w-4 h-4 text-orange-500' />
                    </div>
                    <p className='text-xl font-bold text-orange-700'>
                      {stats?.current_streak || 0}
                    </p>
                  </div>
                </div>

                {!hasClubProfile && (
                  <div
                    className='bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200 cursor-pointer hover:shadow-md transition-all'
                    onClick={handleClubRegistrationClick}
                  >
                    <div className='flex flex-col justify-between h-full'>
                      <div className='flex items-center justify-between mb-2'>
                        <p className='text-xs text-purple-600 font-medium'>
                          Đăng ký CLB
                        </p>
                        <Building2 className='w-4 h-4 text-purple-500' />
                      </div>
                      <div className='flex items-center justify-between'>
                        <p className='text-xs text-purple-500 leading-tight'>
                          Quản lý CLB
                        </p>
                        <ArrowRight className='w-3 h-3 text-purple-500' />
                      </div>
                    </div>
                  </div>
                )}

                {hasClubProfile && (
                  <div className='bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-lg border border-emerald-200 hover:shadow-sm transition-shadow'>
                    <div className='flex flex-col'>
                      <div className='flex items-center justify-between mb-2'>
                        <p className='text-xs text-emerald-600 font-medium'>
                          CLB
                        </p>
                        <Building2 className='w-4 h-4 text-emerald-500' />
                      </div>
                      <p className='text-xl font-bold text-emerald-700'>✓</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileHeader;
