import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Trophy, MapPin, Calendar, Star, Verified } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAvatar } from '@/contexts/AvatarContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ProfileHeaderProps {
  profile: any;
  variant?: 'mobile' | 'desktop';
  arenaMode?: boolean;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ 
  profile, 
  variant = 'mobile',
  arenaMode = false 
}) => {
  const { user } = useAuth();
  const { avatarUrl, updateAvatar } = useAvatar();
  const [uploading, setUploading] = React.useState(false);

  const skillLevels = {
    beginner: { label: 'Người mới', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
    intermediate: { label: 'Trung bình', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
    advanced: { label: 'Khá', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' },
    pro: { label: 'Chuyên nghiệp', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300' },
  };

  // Safe access to skill level
  const currentSkillLevel = profile?.skill_level || 'beginner';
  const skillLevelInfo = skillLevels[currentSkillLevel as keyof typeof skillLevels] || skillLevels.beginner;

  const compressImage = (file: File, maxSizeKB: number = 500): Promise<File> => {
    return new Promise((resolve) => {
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
          offsetX, offsetY, size, size,
          0, 0, targetSize, targetSize
        );
        
        let quality = 0.8;
        const tryCompress = () => {
          canvas.toBlob((blob) => {
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
          }, 'image/jpeg', quality);
        };
        
        tryCompress();
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

      const newAvatarUrl = urlData.publicUrl + '?t=' + new Date().getTime();

      await supabase
        .from('profiles')
        .update({ avatar_url: newAvatarUrl })
        .eq('user_id', user.id);
      
      await supabase.auth.updateUser({
        data: { avatar_url: newAvatarUrl }
      });

      updateAvatar(newAvatarUrl);
      toast.success('Đã cập nhật ảnh đại diện!');

    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error('Lỗi khi tải ảnh: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  if (variant === 'mobile') {
    return (
      <Card className={`${arenaMode ? 'bg-slate-800/50 border-cyan-500/30' : 'border-gradient-primary bg-gradient-subtle'}`}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="w-16 h-16 border-2 border-primary/20">
                <AvatarImage src={profile?.avatar_url || avatarUrl} />
                <AvatarFallback className="text-lg font-racing-sans-one">
                  {profile?.display_name ? profile.display_name[0]?.toUpperCase() : user?.email?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <label className="absolute -bottom-1 -right-1 bg-primary hover:bg-primary/90 w-6 h-6 rounded-full border-2 border-background cursor-pointer flex items-center justify-center transition-colors">
                <Camera className="w-3 h-3 text-primary-foreground" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
              {uploading && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                </div>
              )}
              {/* Verified Badge */}
              {profile?.verified_rank && (
                <div className="absolute -top-1 -right-1 bg-green-500 w-5 h-5 rounded-full border-2 border-background flex items-center justify-center">
                  <Verified className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </div>
            
            {/* User Info */}
            <div className="flex-1 min-w-0">
              <h1 className={`text-lg font-bebas-neue truncate ${arenaMode ? 'text-cyan-300' : 'text-foreground'}`}>
                {profile?.display_name || profile?.full_name || 'Chưa đặt tên'}
              </h1>
              <p className={`text-sm ${arenaMode ? 'text-slate-400' : 'text-muted-foreground'}`}>
                {profile?.member_since ? `Từ ${new Date(profile.member_since).getFullYear()}` : 'Thành viên mới'}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {profile?.verified_rank || 'Chưa xếp hạng'}
                </Badge>
                <Badge variant="outline" className={`text-xs ${skillLevelInfo.color}`}>
                  {skillLevelInfo.label}
                </Badge>
              </div>
            </div>

            {/* Basic Stats */}
            <div className="text-right">
              <div className={`text-lg font-racing-sans-one ${arenaMode ? 'text-cyan-400' : 'text-primary'}`}>
                {profile?.total_matches || 0}
              </div>
              <div className={`text-xs ${arenaMode ? 'text-slate-400' : 'text-muted-foreground'}`}>
                Trận đấu
              </div>
              <div className={`text-sm font-medium mt-1 ${profile?.win_percentage >= 50 ? 'text-green-600' : 'text-orange-600'}`}>
                {profile?.win_percentage || 0}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Desktop variant
  return (
    <Card className="border-gradient-primary bg-gradient-subtle">
      <CardContent className="p-6">
        <div className="flex items-start space-x-6">
          {/* Avatar */}
          <div className="relative">
            <Avatar className="w-24 h-24 border-4 border-primary/20">
              <AvatarImage src={profile?.avatar_url || avatarUrl} />
              <AvatarFallback className="text-2xl font-racing-sans-one">
                {profile?.display_name ? profile.display_name[0]?.toUpperCase() : user?.email?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <label className="absolute -bottom-2 -right-2 bg-primary hover:bg-primary/90 w-8 h-8 rounded-full border-2 border-background cursor-pointer flex items-center justify-center transition-colors">
              <Camera className="w-4 h-4 text-primary-foreground" />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </label>
            {uploading && (
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
              </div>
            )}
            {/* Verified Badge */}
            {profile?.verified_rank && (
              <div className="absolute -top-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-2 border-background flex items-center justify-center">
                <Verified className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          
          {/* User Info */}
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-2xl font-bebas-neue text-foreground">
                {profile?.display_name || profile?.full_name || 'Chưa đặt tên'}
              </h1>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {profile?.verified_rank || 'Chưa xếp hạng'}
                </Badge>
                <Badge variant="outline" className={skillLevelInfo.color}>
                  {skillLevelInfo.label}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {profile?.member_since ? `Tham gia ${new Date(profile.member_since).getFullYear()}` : 'Thành viên mới'}
              </div>
              {profile?.city && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {profile.city}{profile.district ? `, ${profile.district}` : ''}
                </div>
              )}
            </div>

            {profile?.bio && (
              <p className="text-sm text-muted-foreground mb-4 max-w-2xl">
                {profile.bio}
              </p>
            )}

            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-racing-sans-one text-primary">{profile?.total_matches || 0}</div>
                <div className="text-xs text-muted-foreground">Tổng trận</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-racing-sans-one text-green-600">{profile?.matches_won || 0}</div>
                <div className="text-xs text-muted-foreground">Thắng</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-racing-sans-one ${profile?.win_percentage >= 50 ? 'text-green-600' : 'text-orange-600'}`}>
                  {profile?.win_percentage || 0}%
                </div>
                <div className="text-xs text-muted-foreground">Tỷ lệ thắng</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-racing-sans-one text-yellow-600">{profile?.spa_points || 0}</div>
                <div className="text-xs text-muted-foreground">SPA Points</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
