import React, { useState, useCallback } from 'react';
import { TechCard, TechHeader } from '@/components/ui/sabo-tech-global';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Shield, Trophy, Users, Camera, Upload } from 'lucide-react';
import { useOptimizedResponsive } from '@/hooks/useOptimizedResponsive';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface ProfileHeaderProps {
  profile: any;
  className?: string;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  className = '',
}) => {
  const { isMobile } = useOptimizedResponsive();
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);

  const uploadCoverImage = useCallback(
    async (file: File) => {
      if (!user) return;

      setIsUploading(true);
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `cover-${user.id}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from('avatars').getPublicUrl(fileName);

        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl } as any)
          .eq('user_id', user.id);

        if (updateError) throw updateError;

        toast.success('Cập nhật ảnh bìa thành công!');
        window.location.reload();
      } catch (error) {
        console.error('Upload error:', error);
        toast.error('Lỗi khi tải ảnh bìa lên');
      } finally {
        setIsUploading(false);
      }
    },
    [user]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: useCallback(
      (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
          uploadCoverImage(acceptedFiles[0]);
        }
      },
      [uploadCoverImage]
    ),
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    },
    maxFiles: 1,
    disabled: !user || isUploading,
  });

  if (isMobile) {
    return (
      <div className={`relative ${className}`}>
        <div className='theme-toggle-container'>
          <button
            className='theme-toggle-btn'
            onClick={() => document.documentElement.classList.toggle('dark')}
          >
            <svg
              className='w-5 h-5'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z'
              />
            </svg>
          </button>
        </div>

        <TechCard className='mx-4 my-6' variant='premium'>
          <div className='text-center space-y-4'>
            <div className='relative inline-block'>
              <Avatar className='w-20 h-20 sabo-tech-avatar'>
                <AvatarImage
                  src={profile?.avatar_url}
                  alt={profile?.display_name || profile?.full_name}
                  className='object-cover'
                />
                <AvatarFallback className='text-2xl font-semibold bg-primary/20'>
                  {(profile?.display_name || profile?.full_name || 'U')
                    .charAt(0)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className='absolute -bottom-1 -right-1 bg-background rounded-full p-1 border-2 border-primary'>
                <Star className='w-3 h-3 text-primary' />
              </div>
            </div>

            <div className='space-y-2'>
              {profile?.bio && (
                <p className='text-sm text-muted-foreground max-w-xs mx-auto'>
                  {profile.bio}
                </p>
              )}
            </div>
          </div>
        </TechCard>

        <div className='user-info-section'>
          <h1 className='username-display'>
            {profile?.display_name || profile?.full_name || 'Người dùng'}
          </h1>
          <div className='rank-badge-simple'>
            <span className='rank-text'>
              {profile?.verified_rank || 'BRONZE'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TechCard className={`overflow-hidden ${className}`} variant='premium'>
      <div
        {...getRootProps()}
        className={`h-36 bg-gradient-to-r from-primary/20 to-accent-blue/20 relative overflow-hidden cursor-pointer transition-all duration-300 ${
          isDragActive ? 'ring-2 ring-primary ring-offset-2' : ''
        } ${isUploading ? 'opacity-50' : ''}`}
      >
        <input {...getInputProps()} />
        {(profile as any)?.cover_image_url ? (
          <img
            src={(profile as any).cover_image_url}
            alt='Cover'
            className='w-full h-full object-cover'
          />
        ) : (
          <div className='w-full h-full bg-gradient-to-r from-primary/20 to-accent-blue/20' />
        )}

        {user && user.id === profile?.user_id && (
          <div className='absolute inset-0 bg-black/10 hover:bg-black/20 transition-opacity duration-300'>
            <div className='absolute inset-0 flex items-center justify-center'>
              <div
                className={`sabo-tech-card bg-card/80 text-foreground px-4 py-2 flex items-center gap-2 transition-opacity duration-300 ${
                  isDragActive || isUploading
                    ? 'opacity-100'
                    : 'opacity-0 hover:opacity-100'
                }`}
              >
                {isUploading ? (
                  <>
                    <div className='w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin' />
                    <span>Đang tải lên...</span>
                  </>
                ) : isDragActive ? (
                  <>
                    <Upload className='w-4 h-4' />
                    <span>Thả ảnh để tải lên</span>
                  </>
                ) : (
                  <>
                    <Camera className='w-4 h-4' />
                    <span>Thay đổi ảnh bìa</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className='p-6'>
        <div className='flex items-center space-x-6 -mt-12 relative z-10'>
          <div className='relative'>
            <Avatar className='w-20 h-20 sabo-tech-avatar border-4 border-background shadow-lg'>
              <AvatarImage
                src={profile?.avatar_url}
                alt={profile?.display_name || profile?.full_name}
                className='object-cover'
              />
              <AvatarFallback className='text-xl bg-primary/20'>
                {(profile?.display_name || profile?.full_name || 'U')
                  .charAt(0)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className='absolute -bottom-2 -right-2 bg-background rounded-full p-1.5 border-2 border-primary shadow-sm'>
              <Star className='w-4 h-4 text-primary' />
            </div>
          </div>

          <div className='flex-1 space-y-3'>
            <div className='bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-sm'>
              <h1 className='text-3xl font-bold text-gray-900 mb-2'>
                {profile?.display_name || profile?.full_name || 'Người dùng'}
              </h1>
              <div className='flex items-center gap-2'>
                <Badge className='bg-blue-100 text-blue-800 border-blue-200'>
                  {profile?.verified_rank || 'Chưa xác thực'}
                </Badge>
                {profile?.role === 'admin' && (
                  <Badge className='bg-red-100 text-red-800 border-red-200'>
                    <Shield className='w-3 h-3 mr-1' />
                    Admin
                  </Badge>
                )}
                {profile?.club_profile && (
                  <Badge className='bg-green-100 text-green-800 border-green-200'>
                    <Users className='w-3 h-3 mr-1' />
                    CLB Owner
                  </Badge>
                )}
              </div>
            </div>

            {profile?.bio && (
              <p className='text-muted-foreground max-w-2xl text-sm'>
                {profile.bio}
              </p>
            )}

            {/* Hidden city and completion info */}
          </div>
        </div>
      </div>
    </TechCard>
  );
};
