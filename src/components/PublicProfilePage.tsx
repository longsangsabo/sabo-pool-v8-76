import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  MapPin,
  Calendar,
  Trophy,
  User,
  MessageCircle,
  UserPlus,
} from 'lucide-react';
import TrustScoreBadge from '@/components/TrustScoreBadge';

interface PublicProfile {
  user_id: string;
  display_name: string | null;
  full_name: string | null;
  bio: string | null;
  skill_level: 'beginner' | 'intermediate' | 'advanced' | 'pro';
  phone: string | null;
  avatar_url: string | null;
  verified_rank: string | null;
  created_at: string;
  updated_at: string;
  id: string;
  elo: number | null;
  is_admin: boolean;
}

const PublicProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const skillLevels = {
    beginner: { label: 'Người mới', color: 'bg-green-100 text-green-800' },
    intermediate: { label: 'Trung bình', color: 'bg-blue-100 text-blue-800' },
    advanced: { label: 'Khá', color: 'bg-purple-100 text-purple-800' },
    pro: { label: 'Chuyên nghiệp', color: 'bg-gold-100 text-gold-800' },
  };

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  const fetchProfile = async () => {
    if (!userId) return;

    try {
      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile({
          ...data,
          skill_level: (data.skill_level || 'beginner') as
            | 'beginner'
            | 'intermediate'
            | 'advanced'
            | 'pro',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Không thể tải hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  const handleFollowClick = () => {
    toast.info('Tính năng theo dõi sẽ được cập nhật sớm');
  };

  const handleMessageClick = () => {
    toast.info('Tính năng nhắn tin sẽ được cập nhật sớm');
  };

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Đang tải hồ sơ...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <User className='w-16 h-16 text-gray-300 mx-auto mb-4' />
          <h2 className='text-xl font-semibold text-gray-900 mb-2'>
            Không tìm thấy hồ sơ
          </h2>
          <p className='text-gray-600'>
            Người dùng này không tồn tại hoặc đã bị xóa.
          </p>
        </div>
      </div>
    );
  }

  const isOwnProfile = user?.id === userId;

  return (
    <div className='min-h-screen bg-gray-50 pt-20 pb-8'>
      <div className='max-w-2xl mx-auto px-4'>
        {/* Profile Header */}
        <Card className='mb-6'>
          <CardContent className='pt-6'>
            <div className='flex flex-col items-center space-y-4'>
              <Avatar className='w-24 h-24'>
                <AvatarImage src={profile.avatar_url} alt='Avatar' />
                <AvatarFallback className='text-xl'>
                  {profile.display_name?.charAt(0) ||
                    profile.full_name?.charAt(0) ||
                    '👤'}
                </AvatarFallback>
              </Avatar>

              <div className='text-center'>
                <h1 className='text-2xl font-bold'>
                  {profile.display_name || profile.full_name || 'Người dùng'}
                </h1>

                <div className='flex flex-col items-center space-y-2 mt-2'>
                  <Badge className={skillLevels[profile.skill_level].color}>
                    <Trophy className='w-3 h-3 mr-1' />
                    {skillLevels[profile.skill_level].label}
                  </Badge>

                  {profile.verified_rank && (
                    <Badge className='bg-blue-100 text-blue-800'>
                      <Trophy className='w-3 h-3 mr-1' />
                      Hạng đã xác thực: {profile.verified_rank}
                    </Badge>
                  )}

                  <TrustScoreBadge
                    playerId={profile.user_id}
                    showFullDetails={true}
                  />
                </div>

                {/* Phone */}
                {profile.phone && (
                  <p className='text-gray-600 mt-2 flex items-center justify-center'>
                    <MapPin className='w-4 h-4 mr-1' />
                    {profile.phone}
                  </p>
                )}

                {/* Member Since */}
                <p className='text-sm text-gray-500 mt-1 flex items-center justify-center'>
                  <Calendar className='w-4 h-4 mr-1' />
                  Tham gia{' '}
                  {new Date(profile.created_at).toLocaleDateString('vi-VN')}
                </p>
              </div>

              {/* Action Buttons */}
              {!isOwnProfile && user && (
                <div className='flex space-x-2'>
                  <Button
                    onClick={handleFollowClick}
                    variant='default'
                    size='sm'
                  >
                    <UserPlus className='w-4 h-4 mr-1' />
                    Theo dõi
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={handleMessageClick}
                  >
                    <MessageCircle className='w-4 h-4 mr-1' />
                    Nhắn tin
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bio */}
        {profile.bio && (
          <Card className='mb-6'>
            <CardHeader>
              <CardTitle>Giới thiệu</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-gray-700 whitespace-pre-wrap'>{profile.bio}</p>
            </CardContent>
          </Card>
        )}

        {/* Stats & Achievements */}
        <Card>
          <CardHeader>
            <CardTitle>Thống kê & Thành tích</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-center text-gray-500 py-8'>
              <Trophy className='w-12 h-12 mx-auto mb-4 text-gray-300' />
              <p>Thông tin thống kê sẽ được cập nhật sau</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicProfilePage;
