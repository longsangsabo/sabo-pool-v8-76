import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useAvatarUpload, useFileUpload } from '@/hooks/useFileUpload';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Camera, Upload, Loader2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface EditableProfileFormProps {
  profile?: any;
  onProfileUpdate?: () => void;
}

const vietnamCities = [
  'Hà Nội',
  'Hồ Chí Minh',
  'Đà Nẵng',
  'Hải Phòng',
  'Cần Thơ',
  'Biên Hòa',
  'Huế',
  'Nha Trang',
  'Buôn Ma Thuột',
  'Thái Nguyên',
  'Phan Thiết',
  'Thái Bình',
  'Nam Định',
  'Vinh',
  'Vũng Tàu',
  'Rạch Giá',
  'Long Xuyên',
  'Quảng Ngãi',
];

const skillLevels = [
  { value: 'beginner', label: 'Người mới bắt đầu' },
  { value: 'intermediate', label: 'Trung bình' },
  { value: 'advanced', label: 'Nâng cao' },
  { value: 'expert', label: 'Chuyên gia' },
];

export const EditableProfileForm: React.FC<EditableProfileFormProps> = ({
  profile,
  onProfileUpdate,
}) => {
  const { user } = useAuth();
  const { uploadAvatar, uploading: avatarUploading } = useAvatarUpload(
    user?.id
  );
  const { uploadFile, uploading: coverUploading } = useFileUpload();

  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    display_name: profile?.display_name || '',
    email: profile?.email || user?.email || '',
    phone: profile?.phone || '',
    bio: profile?.bio || '',
    city: profile?.city || '',
    district: profile?.district || '',
    skill_level: profile?.skill_level || 'beginner',
  });

  const [saving, setSaving] = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const [previewCover, setPreviewCover] = useState<string | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = e => setPreviewAvatar(e.target?.result as string);
    reader.readAsDataURL(file);

    try {
      const result = await uploadAvatar(file);
      if (result.url) {
        await updateProfileField('avatar_url', result.url);
        toast.success('Cập nhật avatar thành công');
        onProfileUpdate?.();
      }
    } catch (error) {
      toast.error('Lỗi khi tải lên avatar');
      setPreviewAvatar(null);
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = e => setPreviewCover(e.target?.result as string);
    reader.readAsDataURL(file);

    try {
      const result = await uploadFile(
        file,
        {
          bucket: 'avatars',
          folder: 'covers',
          maxSize: 5,
          allowedTypes: ['image/*'],
        },
        user?.id
      );

      if (result.url) {
        await updateProfileField('cover_image_url', result.url);
        toast.success('Cập nhật ảnh bìa thành công');
        onProfileUpdate?.();
      }
    } catch (error) {
      toast.error('Lỗi khi tải lên ảnh bìa');
      setPreviewCover(null);
    }
  };

  const updateProfileField = async (field: string, value: any) => {
    const { error } = await supabase
      .from('profiles')
      .update({ [field]: value, updated_at: new Date().toISOString() })
      .eq('user_id', user?.id);

    if (error) throw error;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      console.error('❌ No user ID found');
      toast.error('Vui lòng đăng nhập lại');
      return;
    }

    console.log('🔄 Starting profile update...', {
      userId: user.id,
      formData,
    });

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('❌ Supabase update error:', error);
        throw error;
      }

      console.log('✅ Profile updated successfully');
      toast.success('Cập nhật thông tin thành công');
      onProfileUpdate?.();
    } catch (error: any) {
      console.error('❌ Profile update failed:', {
        error,
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
      });
      toast.error(
        `Có lỗi xảy ra khi cập nhật thông tin: ${error?.message || 'Lỗi không xác định'}`
      );
    } finally {
      setSaving(false);
    }
  };

  const currentAvatar = previewAvatar || profile?.avatar_url;
  const currentCover = previewCover || profile?.cover_image_url;

  return (
    <div className='space-y-6'>
      {/* Cover Image Section */}
      <Card>
        <CardContent className='p-0'>
          <div className='relative h-48 bg-gradient-to-r from-primary/20 to-primary/5 overflow-hidden rounded-t-lg'>
            {currentCover && (
              <img
                src={currentCover}
                alt='Cover'
                className='w-full h-full object-cover'
              />
            )}
            <div className='absolute inset-0 bg-black/20' />
            <Button
              size='sm'
              variant='secondary'
              className='absolute top-4 right-4 bg-background/80 hover:bg-background'
              onClick={() => coverInputRef.current?.click()}
              disabled={coverUploading}
            >
              {coverUploading ? (
                <Loader2 className='w-4 h-4 animate-spin' />
              ) : (
                <>
                  <Camera className='w-4 h-4 mr-2' />
                  Đổi ảnh bìa
                </>
              )}
            </Button>
            <input
              ref={coverInputRef}
              type='file'
              accept='image/*'
              onChange={handleCoverChange}
              className='hidden'
            />
          </div>
        </CardContent>
      </Card>

      {/* Avatar Section */}
      <Card>
        <CardHeader>
          <CardTitle>Ảnh đại diện</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center space-x-4'>
            <div className='relative'>
              <Avatar className='w-20 h-20'>
                <AvatarImage src={currentAvatar} className='object-cover' />
                <AvatarFallback className='text-xl'>
                  {(formData.display_name || formData.full_name || 'U')
                    .charAt(0)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button
                size='sm'
                variant='secondary'
                className='absolute -bottom-2 -right-2 rounded-full p-2'
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
              >
                {avatarUploading ? (
                  <Loader2 className='w-3 h-3 animate-spin' />
                ) : (
                  <Camera className='w-3 h-3' />
                )}
              </Button>
              <input
                ref={avatarInputRef}
                type='file'
                accept='image/*'
                onChange={handleAvatarChange}
                className='hidden'
              />
            </div>
            <div className='flex-1'>
              <h3 className='font-medium'>Thay đổi ảnh đại diện</h3>
              <p className='text-sm text-muted-foreground'>
                JPG, PNG hoặc GIF. Tối đa 2MB.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Information Form */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin cá nhân</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='full_name'>Họ và tên *</Label>
                <Input
                  id='full_name'
                  value={formData.full_name}
                  onChange={e => handleInputChange('full_name', e.target.value)}
                  placeholder='Nhập họ và tên của bạn'
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='display_name'>Tên hiển thị</Label>
                <Input
                  id='display_name'
                  value={formData.display_name}
                  onChange={e =>
                    handleInputChange('display_name', e.target.value)
                  }
                  placeholder='Tên muốn hiển thị'
                />
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='email'>Email</Label>
                <Input
                  id='email'
                  type='email'
                  value={formData.email}
                  onChange={e => handleInputChange('email', e.target.value)}
                  placeholder='your@email.com'
                  disabled
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='phone'>Số điện thoại</Label>
                <Input
                  id='phone'
                  value={formData.phone}
                  onChange={e => handleInputChange('phone', e.target.value)}
                  placeholder='0123456789'
                />
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='city'>Thành phố</Label>
                <Select
                  value={formData.city}
                  onValueChange={value => handleInputChange('city', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Chọn thành phố' />
                  </SelectTrigger>
                  <SelectContent>
                    {vietnamCities.map(city => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='district'>Quận/Huyện</Label>
                <Input
                  id='district'
                  value={formData.district}
                  onChange={e => handleInputChange('district', e.target.value)}
                  placeholder='Nhập quận/huyện'
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='skill_level'>Trình độ</Label>
              <Select
                value={formData.skill_level}
                onValueChange={value => handleInputChange('skill_level', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Chọn trình độ' />
                </SelectTrigger>
                <SelectContent>
                  {skillLevels.map(skill => (
                    <SelectItem key={skill.value} value={skill.value}>
                      {skill.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='bio'>Giới thiệu bản thân</Label>
              <Textarea
                id='bio'
                value={formData.bio}
                onChange={e => handleInputChange('bio', e.target.value)}
                placeholder='Chia sẻ về bản thân, kinh nghiệm chơi billiard...'
                rows={4}
                maxLength={500}
              />
              <div className='text-xs text-muted-foreground text-right'>
                {formData.bio.length}/500 ký tự
              </div>
            </div>

            <div className='flex justify-end space-x-2 pt-4'>
              <Button type='submit' disabled={saving} className='min-w-[120px]'>
                {saving ? (
                  <>
                    <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                    Đang lưu...
                  </>
                ) : (
                  'Lưu thay đổi'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Profile Status */}
      <Card>
        <CardHeader>
          <CardTitle>Trạng thái hồ sơ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <span>Tỷ lệ hoàn thành hồ sơ</span>
              <Badge variant='secondary'>
                {profile?.completion_percentage || 0}%
              </Badge>
            </div>

            <div className='space-y-2'>
              <div className='flex items-center justify-between text-sm'>
                <span>Hạng xác thực</span>
                <Badge variant={profile?.verified_rank ? 'default' : 'outline'}>
                  {profile?.verified_rank || 'Chưa xác thực'}
                </Badge>
              </div>

              <div className='flex items-center justify-between text-sm'>
                <span>Thành viên từ</span>
                <span className='text-muted-foreground'>
                  {profile?.member_since
                    ? new Date(profile.member_since).toLocaleDateString('vi-VN')
                    : 'Chưa xác định'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditableProfileForm;
