import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  MapPin,
  Calendar,
  Trophy,
  MessageCircle,
  ArrowLeft,
} from 'lucide-react';

interface PublicProfile {
  id: string;
  user_id: string;
  display_name: string;
  full_name: string;
  bio: string;
  skill_level: 'beginner' | 'intermediate' | 'advanced' | 'pro';
  city: string;
  district: string;
  avatar_url: string;
  member_since: string;
}

const PublicProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
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
      fetchPublicProfile();
    }
  }, [userId]);

  const fetchPublicProfile = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(
          'id, user_id, display_name, full_name, bio, skill_level, city, district, avatar_url, member_since, created_at'
        )
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        toast.error('Không tìm thấy người chơi này');
        navigate('/');
        return;
      }

      if (data) {
        setProfile({
          ...data,
          display_name:
            data.display_name || data.full_name || 'Người chơi ẩn danh',
          member_since: data.member_since || data.created_at || '',
          skill_level: (data.skill_level || 'beginner') as
            | 'beginner'
            | 'intermediate'
            | 'advanced'
            | 'pro',
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Có lỗi xảy ra khi tải thông tin');
    } finally {
      setLoading(false);
    }
  };

  const handleChallenge = () => {
    if (!currentUser) {
      toast.error('Vui lòng đăng nhập để thách đấu');
      navigate('/login');
      return;
    }

    if (currentUser.id === userId) {
      toast.error('Bạn không thể thách đấu chính mình');
      return;
    }

    // TODO: Implement challenge feature
    toast.info('Tính năng thách đấu sẽ sớm ra mắt!');
  };

  const handleMessage = () => {
    if (!currentUser) {
      toast.error('Vui lòng đăng nhập để nhắn tin');
      navigate('/login');
      return;
    }

    if (currentUser.id === userId) {
      toast.error('Bạn không thể nhắn tin cho chính mình');
      return;
    }

    // TODO: Implement messaging feature
    toast.info('Tính năng nhắn tin sẽ sớm ra mắt!');
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
          <h1 className='text-2xl font-bold text-gray-900 mb-2'>
            Không tìm thấy người chơi
          </h1>
          <p className='text-gray-600 mb-4'>
            Người chơi này có thể đã xóa tài khoản hoặc không tồn tại.
          </p>
          <Button onClick={() => navigate('/')} variant='outline'>
            <ArrowLeft className='w-4 h-4 mr-2' />
            Về trang chủ
          </Button>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === userId;

  return (
    <div className='min-h-screen bg-gray-50 pt-20 pb-8'>
      <div className='max-w-2xl mx-auto px-4'>
        {/* Back Button */}
        <Button variant='ghost' onClick={() => navigate(-1)} className='mb-4'>
          <ArrowLeft className='w-4 h-4 mr-2' />
          Quay lại
        </Button>

        {/* Profile Header */}
        <Card className='mb-6'>
          <CardContent className='pt-6'>
            <div className='flex flex-col items-center space-y-4'>
              <Avatar className='w-24 h-24'>
                <AvatarImage src={profile.avatar_url} alt='Avatar' />
                <AvatarFallback className='text-xl'>
                  {profile.display_name?.charAt(0) || '👤'}
                </AvatarFallback>
              </Avatar>

              <div className='text-center'>
                <h1 className='text-2xl font-bold text-gray-900 mb-2'>
                  {profile.display_name}
                </h1>

                <Badge className={skillLevels[profile.skill_level].color}>
                  <Trophy className='w-3 h-3 mr-1' />
                  {skillLevels[profile.skill_level].label}
                </Badge>

                {profile.member_since && (
                  <p className='text-sm text-gray-500 mt-2 flex items-center justify-center'>
                    <Calendar className='w-4 h-4 mr-1' />
                    Tham gia{' '}
                    {new Date(profile.member_since).toLocaleDateString('vi-VN')}
                  </p>
                )}

                {(profile.city || profile.district) && (
                  <p className='text-sm text-gray-600 mt-1 flex items-center justify-center'>
                    <MapPin className='w-4 h-4 mr-1' />
                    {[profile.district, profile.city]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              {!isOwnProfile && currentUser && (
                <div className='flex space-x-3 mt-4'>
                  <Button onClick={handleChallenge} className='flex-1'>
                    <Trophy className='w-4 h-4 mr-2' />
                    Thách đấu
                  </Button>
                  <Button
                    onClick={handleMessage}
                    variant='outline'
                    className='flex-1'
                  >
                    <MessageCircle className='w-4 h-4 mr-2' />
                    Nhắn tin
                  </Button>
                </div>
              )}

              {isOwnProfile && (
                <Button onClick={() => navigate('/profile')} variant='outline'>
                  Chỉnh sửa hồ sơ
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bio Section */}
        {profile.bio && (
          <Card>
            <CardHeader>
              <CardTitle>Giới thiệu</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-gray-700 leading-relaxed'>{profile.bio}</p>
            </CardContent>
          </Card>
        )}

        {/* No bio placeholder */}
        {!profile.bio && !isOwnProfile && (
          <Card>
            <CardContent className='pt-6'>
              <div className='text-center text-gray-500'>
                <p>Người chơi này chưa thêm giới thiệu về bản thân.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Login prompt for non-logged users */}
        {!currentUser && (
          <Card className='mt-6'>
            <CardContent className='pt-6'>
              <div className='text-center'>
                <p className='text-gray-600 mb-4'>
                  Đăng nhập để thách đấu hoặc kết bạn với người chơi này!
                </p>
                <div className='space-x-3'>
                  <Button onClick={() => navigate('/login')}>Đăng nhập</Button>
                  <Button
                    onClick={() => navigate('/register')}
                    variant='outline'
                  >
                    Đăng ký
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PublicProfilePage;
