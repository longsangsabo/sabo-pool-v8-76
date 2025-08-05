import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/hooks/useAuth';
import { useAvatar } from '@/contexts/AvatarContext';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Camera,
  MapPin,
  User,
  Phone,
  Calendar,
  Trophy,
  ArrowUp,
  Edit3,
  Star,
  TrendingUp,
  Activity,
  Target,
  Zap,
  ChevronRight,
  Settings,
  Award,
} from 'lucide-react';
import { isAdminUser } from '@/utils/adminHelpers';

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

const OptimizedMobileProfile = () => {
  const { user } = useAuth();
  const { avatarUrl, updateAvatar } = useAvatar();
  const [profile, setProfile] = useState<ProfileData>({
    user_id: '',
    display_name: '',
    phone: '',
    bio: '',
    skill_level: 'beginner',
    city: '',
    district: '',
    avatar_url: '',
    member_since: '',
    role: 'player',
    active_role: 'player',
    verified_rank: null,
    completion_percentage: 0,
  });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Handle scroll for back-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        const profileData = {
          user_id: data.user_id || user.id,
          display_name: data.display_name || data.full_name || '',
          phone: data.phone || user.phone || '',
          bio: data.bio || '',
          skill_level: (data.skill_level || 'beginner') as
            | 'beginner'
            | 'intermediate'
            | 'advanced'
            | 'pro',
          city: data.city || '',
          district: data.district || '',
          avatar_url: data.avatar_url || '',
          member_since: data.member_since || data.created_at || '',
          role: (data.role || 'player') as 'player' | 'club_owner' | 'both',
          active_role: (data.active_role || 'player') as
            | 'player'
            | 'club_owner',
          verified_rank: data.verified_rank || null,
          completion_percentage: data.completion_percentage || 0,
        };
        setProfile(profileData);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const compressImage = (
    file: File,
    maxSizeKB: number = 500
  ): Promise<File> => {
    return new Promise(resolve => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        const targetSize = 400;
        canvas.width = targetSize;
        canvas.height = targetSize;

        const { width, height } = img;
        const size = Math.min(width, height);
        const offsetX = (width - size) / 2;
        const offsetY = (height - size) / 2;

        ctx.drawImage(
          img,
          offsetX,
          offsetY,
          size,
          size,
          0,
          0,
          targetSize,
          targetSize
        );

        let quality = 0.8;
        const tryCompress = () => {
          canvas.toBlob(
            blob => {
              if (blob && (blob.size <= maxSizeKB * 1024 || quality <= 0.1)) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                quality -= 0.1;
                tryCompress();
              }
            },
            'image/jpeg',
            quality
          );
        };

        tryCompress();
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh');
      return;
    }

    setUploading(true);

    try {
      let uploadFile = file;
      if (file.size > 500 * 1024) {
        toast.info('Đang nén ảnh để tối ưu...');
        uploadFile = await compressImage(file);
      }

      const fileExt = 'jpg';
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, uploadFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const avatarUrl = urlData.publicUrl + '?t=' + new Date().getTime();

      await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('user_id', user.id);

      await supabase.auth.updateUser({
        data: { avatar_url: avatarUrl },
      });

      setProfile(prev => ({ ...prev, avatar_url: avatarUrl }));
      updateAvatar(avatarUrl);

      toast.success('Đã cập nhật ảnh đại diện!');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error('Lỗi khi tải ảnh: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center px-4'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4'></div>
          <p className='text-muted-foreground'>Đang tải hồ sơ...</p>
        </div>
      </div>
    );
  }

  const skillLevels = {
    beginner: { label: 'Người mới', color: 'bg-green-100 text-green-800' },
    intermediate: { label: 'Trung bình', color: 'bg-blue-100 text-blue-800' },
    advanced: { label: 'Khá', color: 'bg-purple-100 text-purple-800' },
    pro: { label: 'Chuyên nghiệp', color: 'bg-gold-100 text-gold-800' },
  };

  return (
    <PageLayout variant='dashboard'>
      <Helmet>
        <title>Hồ sơ cá nhân - SABO ARENA</title>
      </Helmet>

      <div className='space-y-4 pb-20'>
        {/* Header Profile Card - Compact */}
        <Card className='border-gradient-primary bg-gradient-subtle'>
          <CardContent className='p-4'>
            <div className='flex items-center space-x-4'>
              {/* Avatar */}
              <div className='relative'>
                <Avatar className='w-16 h-16 border-2 border-primary/20'>
                  <AvatarImage src={profile.avatar_url || avatarUrl} />
                  <AvatarFallback className='text-lg font-racing-sans-one'>
                    {profile.display_name
                      ? profile.display_name[0]?.toUpperCase()
                      : user?.email?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <label className='absolute -bottom-1 -right-1 bg-primary hover:bg-primary/90 w-6 h-6 rounded-full border-2 border-background cursor-pointer flex items-center justify-center transition-colors'>
                  <Camera className='w-3 h-3 text-primary-foreground' />
                  <input
                    type='file'
                    accept='image/*'
                    onChange={handleAvatarUpload}
                    className='hidden'
                  />
                </label>
                {uploading && (
                  <div className='absolute inset-0 bg-black/50 rounded-full flex items-center justify-center'>
                    <div className='animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent' />
                  </div>
                )}
                {/* Verified Badge */}
                <div className='absolute -top-1 -right-1 bg-green-500 w-5 h-5 rounded-full border-2 border-background flex items-center justify-center'>
                  <Trophy className='w-2.5 h-2.5 text-white' />
                </div>
              </div>

              {/* User Info */}
              <div className='flex-1 min-w-0'>
                <h1 className='text-lg font-bebas-neue text-foreground truncate'>
                  {profile.display_name || 'Chưa đặt tên'}
                </h1>
                <p className='text-sm text-muted-foreground'>
                  {profile.member_since
                    ? `Từ ${new Date(profile.member_since).getFullYear()}`
                    : 'Thành viên mới'}
                </p>
                <div className='flex items-center gap-2 mt-1'>
                  <Badge variant='secondary' className='text-xs'>
                    {profile.verified_rank
                      ? profile.verified_rank
                      : 'Người mới'}
                  </Badge>
                  <Badge
                    variant='outline'
                    className={`text-xs ${skillLevels[profile.skill_level].color}`}
                  >
                    {skillLevels[profile.skill_level].label}
                  </Badge>
                </div>
              </div>

              {/* Basic Stats */}
              <div className='text-right'>
                <div className='text-lg font-racing-sans-one text-primary'>
                  6
                </div>
                <div className='text-xs text-muted-foreground'>Trận đấu</div>
                <div className='text-sm font-medium text-green-600 mt-1'>
                  50%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Stats Cards - 2x2 Grid */}
        <div className='grid grid-cols-2 gap-3'>
          {/* ELO/Rank Card */}
          <Card className='h-20'>
            <CardContent className='p-3 h-full flex flex-col justify-center'>
              <div className='flex items-center justify-between mb-1'>
                <Trophy className='w-4 h-4 text-primary' />
                <span className='text-2xl font-racing-sans-one text-primary'>
                  {profile.verified_rank ? profile.verified_rank : 'K'}
                </span>
              </div>
              <div className='text-xs text-muted-foreground'>Hạng hiện tại</div>
              <div className='text-xs text-primary font-medium'>1000 ELO</div>
            </CardContent>
          </Card>

          {/* SPA Points Card */}
          <Card className='h-20'>
            <CardContent className='p-3 h-full flex flex-col justify-center'>
              <div className='flex items-center justify-between mb-1'>
                <Star className='w-4 h-4 text-yellow-500' />
                <span className='text-2xl font-racing-sans-one text-yellow-600'>
                  2225
                </span>
              </div>
              <div className='text-xs text-muted-foreground'>SPA Points</div>
              <div className='text-xs text-green-600 font-medium'>
                +50 tuần này
              </div>
            </CardContent>
          </Card>

          {/* Weekly Rank Card */}
          <Card className='h-20'>
            <CardContent className='p-3 h-full flex flex-col justify-center'>
              <div className='flex items-center justify-between mb-1'>
                <TrendingUp className='w-4 h-4 text-blue-500' />
                <span className='text-2xl font-racing-sans-one text-blue-600'>
                  #7
                </span>
              </div>
              <div className='text-xs text-muted-foreground'>Xếp hạng tuần</div>
              <div className='text-xs text-green-600 font-medium'>
                ↗️ +3 bậc
              </div>
            </CardContent>
          </Card>

          {/* Activity Card */}
          <Card className='h-20'>
            <CardContent className='p-3 h-full flex flex-col justify-center'>
              <div className='flex items-center justify-between mb-1'>
                <Activity className='w-4 h-4 text-orange-500' />
                <span className='text-2xl font-racing-sans-one text-orange-600'>
                  6
                </span>
              </div>
              <div className='text-xs text-muted-foreground'>
                Trận tháng này
              </div>
              <div className='text-xs text-orange-600 font-medium'>
                Tích cực
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions - 2x3 Grid */}
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-base font-epilogue'>
              Hành động nhanh
            </CardTitle>
          </CardHeader>
          <CardContent className='p-4 pt-0'>
            <div className='grid grid-cols-2 gap-3'>
              <Button
                variant='default'
                size='sm'
                className='h-12 flex-col gap-1'
              >
                <Edit3 className='w-4 h-4' />
                <span className='text-xs'>Chỉnh sửa</span>
              </Button>
              <Button
                variant='outline'
                size='sm'
                className='h-12 flex-col gap-1'
                onClick={() => (window.location.href = '/leaderboard')}
              >
                <Trophy className='w-4 h-4' />
                <span className='text-xs'>Bảng xếp hạng</span>
              </Button>
              <Button
                variant='outline'
                size='sm'
                className='h-12 flex-col gap-1'
                onClick={() => (window.location.href = '/challenges')}
              >
                <Target className='w-4 h-4' />
                <span className='text-xs'>Thách đấu</span>
              </Button>
              <Button
                variant='outline'
                size='sm'
                className='h-12 flex-col gap-1'
                onClick={() => (window.location.href = '/settings')}
              >
                <Settings className='w-4 h-4' />
                <span className='text-xs'>Cài đặt</span>
              </Button>
              <Button
                variant='outline'
                size='sm'
                className='h-12 flex-col gap-1 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'
                onClick={() => (window.location.href = '/rank-registration')}
              >
                <Award className='w-4 h-4 text-amber-600' />
                <span className='text-xs text-amber-700'>Đăng ký hạng</span>
              </Button>
              <Button
                variant='outline'
                size='sm'
                className='h-12 flex-col gap-1'
                onClick={() => (window.location.href = '/wallet')}
              >
                <Zap className='w-4 h-4' />
                <span className='text-xs'>Ví & Điểm</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities - Compact */}
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-base font-epilogue flex items-center justify-between'>
              Hoạt động gần đây
              <Button variant='ghost' size='sm' className='text-xs h-6 px-2'>
                Xem tất cả <ChevronRight className='w-3 h-3 ml-1' />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className='p-4 pt-0 space-y-3'>
            <div className='flex items-center gap-3 p-2 bg-blue-50 rounded-lg'>
              <div className='w-2 h-2 bg-blue-500 rounded-full flex-shrink-0'></div>
              <div className='flex-1 min-w-0'>
                <div className='text-sm font-medium truncate'>
                  Tham gia giải đấu mới
                </div>
                <div className='text-xs text-muted-foreground'>2 giờ trước</div>
              </div>
            </div>

            <div className='flex items-center gap-3 p-2 bg-green-50 rounded-lg'>
              <div className='w-2 h-2 bg-green-500 rounded-full flex-shrink-0'></div>
              <div className='flex-1 min-w-0'>
                <div className='text-sm font-medium truncate'>
                  Nhận 50 SPA Points
                </div>
                <div className='text-xs text-muted-foreground'>
                  1 ngày trước
                </div>
              </div>
            </div>

            <div className='flex items-center gap-3 p-2 bg-yellow-50 rounded-lg'>
              <div className='w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0'></div>
              <div className='flex-1 min-w-0'>
                <div className='text-sm font-medium truncate'>
                  Cập nhật hồ sơ
                </div>
                <div className='text-xs text-muted-foreground'>
                  3 ngày trước
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Achievements - Compact */}
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-base font-epilogue flex items-center justify-between'>
              Thành tích
              <Button variant='ghost' size='sm' className='text-xs h-6 px-2'>
                Xem tất cả <ChevronRight className='w-3 h-3 ml-1' />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className='p-4 pt-0 space-y-3'>
            <div className='flex items-center gap-3 p-2 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg'>
              <div className='w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0'>
                <Trophy className='w-4 h-4 text-white' />
              </div>
              <div className='flex-1 min-w-0'>
                <div className='text-sm font-medium truncate'>
                  Người mới xuất sắc
                </div>
                <div className='text-xs text-muted-foreground'>
                  Thắng 5 trận đầu tiên
                </div>
              </div>
            </div>

            <div className='flex items-center gap-3 p-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg'>
              <div className='w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0'>
                <span className='text-sm'>🎯</span>
              </div>
              <div className='flex-1 min-w-0'>
                <div className='text-sm font-medium truncate'>Chính xác</div>
                <div className='text-xs text-muted-foreground'>
                  Độ chính xác &gt; 80%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Completion */}
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between mb-3'>
              <span className='text-sm font-medium'>Hoàn thiện hồ sơ</span>
              <span className='text-sm font-racing-sans-one text-primary'>
                {profile.completion_percentage || 0}%
              </span>
            </div>
            <div className='w-full bg-muted rounded-full h-2 mb-2'>
              <div
                className='bg-primary h-2 rounded-full transition-all duration-300'
                style={{ width: `${profile.completion_percentage || 0}%` }}
              />
            </div>
            <p className='text-xs text-muted-foreground'>
              Hoàn thiện hồ sơ để tăng uy tín và cơ hội tham gia giải đấu
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Back to Top Button */}
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          className='fixed bottom-20 right-4 w-12 h-12 rounded-full shadow-lg z-50'
          size='sm'
        >
          <ArrowUp className='w-4 h-4' />
        </Button>
      )}
    </PageLayout>
  );
};

export default OptimizedMobileProfile;
