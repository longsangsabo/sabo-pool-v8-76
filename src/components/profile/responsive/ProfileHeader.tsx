
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profile, className = '' }) => {
  const { isMobile } = useOptimizedResponsive();
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);

  const uploadCoverImage = useCallback(async (file: File) => {
    if (!user) return;
    
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `cover-${user.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl } as any) // Temporary fix for cover_image_url
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      toast.success('Cập nhật ảnh bìa thành công!');
      window.location.reload(); // Refresh to show new cover
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Lỗi khi tải ảnh bìa lên');
    } finally {
      setIsUploading(false);
    }
  }, [user]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: useCallback((acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        uploadCoverImage(acceptedFiles[0]);
      }
    }, [uploadCoverImage]),
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxFiles: 1,
    disabled: !user || isUploading
  });

  if (isMobile) {
    return (
      <div className={`profile-header-mobile ${className}`}>
        <div className="profile-avatar-section">
          <Avatar className="profile-avatar-large">
            <AvatarImage 
              src={profile?.avatar_url} 
              alt={profile?.display_name || profile?.full_name}
              className="object-cover"
            />
            <AvatarFallback className="text-2xl font-semibold">
              {(profile?.display_name || profile?.full_name || 'U').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h2 className="profile-name">
            {profile?.display_name || profile?.full_name || 'Người dùng'}
          </h2>
          <Badge className="profile-rank-badge">
            {profile?.verified_rank || 'Chưa xác thực'}
          </Badge>
          {profile?.bio && (
            <p className="profile-bio">
              {profile.bio}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className={`overflow-hidden bg-card border-border ${className}`}>
      {/* Cover Image with Upload */}
      <div 
        {...getRootProps()}
        className={`h-36 bg-gradient-to-r from-primary/20 to-primary/5 relative overflow-hidden cursor-pointer transition-all duration-300 ${
          isDragActive ? 'ring-2 ring-primary ring-offset-2' : ''
        } ${isUploading ? 'opacity-50' : ''}`}
      >
        <input {...getInputProps()} />
        {(profile as any)?.cover_image_url ? (
          <img 
            src={(profile as any).cover_image_url} 
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-primary/20 to-primary/5" />
        )}
        
        {/* Upload Overlay */}
        <div className={`absolute inset-0 bg-black/10 transition-opacity duration-300 ${
          isDragActive ? 'bg-black/30' : 'hover:bg-black/20'
        }`}>
          {user && user.id === profile?.user_id && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`bg-black/50 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-opacity duration-300 ${
                isDragActive || isUploading ? 'opacity-100' : 'opacity-0 hover:opacity-100'
              }`}>
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang tải lên...</span>
                  </>
                ) : isDragActive ? (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Thả ảnh để tải lên</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    <span>Thay đổi ảnh bìa</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <CardHeader className="pt-0">
        <div className="flex items-center space-x-6 -mt-8 relative z-10">
          <div className="relative">
            <Avatar className="w-20 h-20 border-4 border-background shadow-lg">
              <AvatarImage 
                src={profile?.avatar_url} 
                alt={profile?.display_name || profile?.full_name}
                className="object-cover"
              />
              <AvatarFallback className="text-xl bg-primary/10">
                {(profile?.display_name || profile?.full_name || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 -right-2 bg-background rounded-full p-1.5 border-2 border-border shadow-sm">
              <Star className="w-4 h-4 text-primary" />
            </div>
          </div>
          
          <div className="flex-1 space-y-2">
            <div>
              <h1 className="text-2xl font-bold text-foreground drop-shadow-sm">
                {profile?.display_name || profile?.full_name || 'Người dùng'}
              </h1>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge variant="secondary" className="bg-primary/90 text-white border border-primary shadow-sm">
                  {profile?.verified_rank || 'Chưa xác thực'}
                </Badge>
                {profile?.role === 'admin' && (
                  <Badge variant="destructive" className="shadow-sm">
                    <Shield className="w-3 h-3 mr-1" />
                    Admin
                  </Badge>
                )}
                {profile?.club_profile && (
                  <Badge variant="outline" className="bg-background/90 shadow-sm">
                    <Users className="w-3 h-3 mr-1" />
                    CLB Owner
                  </Badge>
                )}
              </div>
            </div>
            
            {profile?.bio && (
              <p className="text-foreground/80 max-w-2xl text-sm drop-shadow-sm">
                {profile.bio}
              </p>
            )}
            
            <div className="flex items-center gap-3 text-xs text-foreground/70">
              {profile?.city && (
                <span className="bg-background/80 px-2 py-1 rounded shadow-sm">📍 {profile.city}</span>
              )}
              {profile?.completion_percentage && (
                <span className="bg-background/80 px-2 py-1 rounded shadow-sm">📊 Profile: {profile.completion_percentage}%</span>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
};
