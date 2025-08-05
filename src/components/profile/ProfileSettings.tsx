import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Settings,
  User,
  Shield,
  Bell,
  Eye,
  EyeOff,
  Camera,
  Save,
  X,
  Edit,
} from 'lucide-react';
// Define UserProfile type locally since it's not exported from ProfilePage
interface UserProfile {
  user_id: string;
  full_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
  verified_rank: string | null;
  skill_level: string | null;
}

interface ProfileSettingsProps {
  profile: UserProfile;
  onUpdate: (profile: UserProfile) => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({
  profile,
  onUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    display_name: profile.display_name || '',
    bio: profile.bio || '',
    phone: profile.phone || '',
    skill_level: profile.skill_level || 'beginner',
  });

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const updatedProfile = {
        ...profile,
        ...formData,
      };

      onUpdate(updatedProfile);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      display_name: profile.display_name || '',
      bio: profile.bio || '',
      phone: profile.phone || '',
      skill_level: profile.skill_level || 'beginner',
    });
    setIsEditing(false);
  };

  const privacyOptions = [
    {
      value: 'public',
      label: 'Công khai',
      description: 'Tất cả mọi người có thể xem hồ sơ của bạn',
      icon: <Eye className='h-4 w-4' />,
    },
    {
      value: 'friends',
      label: 'Bạn bè',
      description: 'Chỉ bạn bè có thể xem hồ sơ của bạn',
      icon: <User className='h-4 w-4' />,
    },
    {
      value: 'private',
      label: 'Riêng tư',
      description: 'Chỉ bạn có thể xem hồ sơ của bạn',
      icon: <EyeOff className='h-4 w-4' />,
    },
  ];

  return (
    <div className='space-y-6'>
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <User className='h-5 w-5' />
            Thông tin cơ bản
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* Avatar Section */}
          <div className='flex items-center gap-4'>
            <div className='relative'>
              <Avatar className='h-20 w-20'>
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className='text-xl'>
                  {profile.display_name?.[0] || profile.full_name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <Button
                size='sm'
                variant='outline'
                className='absolute -bottom-1 -right-1 h-8 w-8 rounded-full p-0'
              >
                <Camera className='h-4 w-4' />
              </Button>
            </div>
            <div>
              <h3 className='font-medium'>Ảnh đại diện</h3>
              <p className='text-sm text-gray-600'>
                Thay đổi ảnh đại diện của bạn
              </p>
            </div>
          </div>

          {/* Form Fields */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Tên hiển thị
              </label>
              {isEditing ? (
                <Input
                  value={formData.display_name}
                  onChange={e =>
                    setFormData({ ...formData, display_name: e.target.value })
                  }
                  placeholder='Nhập tên hiển thị'
                />
              ) : (
                <div className='flex items-center gap-2'>
                  <span className='text-gray-900'>
                    {profile.display_name || profile.full_name}
                  </span>
                  {profile.verified_rank && (
                    <Badge
                      variant='outline'
                      className='bg-blue-100 text-blue-800'
                    >
                      {profile.verified_rank}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Số điện thoại
              </label>
              {isEditing ? (
                <Input
                  value={formData.phone}
                  onChange={e =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder='Nhập số điện thoại'
                />
              ) : (
                <span className='text-gray-900'>
                  {profile.phone || 'Chưa cập nhật'}
                </span>
              )}
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Giới thiệu
            </label>
            {isEditing ? (
              <Textarea
                value={formData.bio}
                onChange={e =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                placeholder='Viết giới thiệu về bản thân...'
                rows={3}
              />
            ) : (
              <p className='text-gray-900'>
                {profile.bio || 'Chưa có giới thiệu'}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          {isEditing ? (
            <div className='flex gap-2'>
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? (
                  <div className='flex items-center gap-2'>
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                    Đang lưu...
                  </div>
                ) : (
                  <>
                    <Save className='h-4 w-4 mr-2' />
                    Lưu thay đổi
                  </>
                )}
              </Button>
              <Button variant='outline' onClick={handleCancel}>
                <X className='h-4 w-4 mr-2' />
                Hủy
              </Button>
            </div>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className='h-4 w-4 mr-2' />
              Chỉnh sửa
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Skill Level Settings */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Shield className='h-5 w-5' />
            Cài đặt kỹ năng
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Trình độ
              </label>
              {isEditing ? (
                <select
                  value={formData.skill_level}
                  onChange={e =>
                    setFormData({ ...formData, skill_level: e.target.value })
                  }
                  className='w-full p-2 border rounded-md'
                >
                  <option value='beginner'>Người mới bắt đầu</option>
                  <option value='intermediate'>Trung cấp</option>
                  <option value='advanced'>Nâng cao</option>
                  <option value='expert'>Chuyên gia</option>
                </select>
              ) : (
                <span className='text-gray-900'>
                  {formData.skill_level === 'beginner' && 'Người mới bắt đầu'}
                  {formData.skill_level === 'intermediate' && 'Trung cấp'}
                  {formData.skill_level === 'advanced' && 'Nâng cao'}
                  {formData.skill_level === 'expert' && 'Chuyên gia'}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Settings className='h-5 w-5' />
            Thông tin tài khoản
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <div className='flex justify-between items-center'>
              <div>
                <div className='font-medium'>ID Người dùng</div>
                <div className='text-sm text-gray-600'>{profile.user_id}</div>
              </div>
            </div>

            <div className='flex justify-between items-center'>
              <div>
                <div className='font-medium'>Hạng hiện tại</div>
                <div className='text-sm text-gray-600'>
                  {profile.verified_rank || 'Chưa có'}
                </div>
              </div>
              {profile.verified_rank && (
                <Badge
                  variant='outline'
                  className='bg-yellow-100 text-yellow-800'
                >
                  Đã xác thực
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className='border-red-200'>
        <CardHeader>
          <CardTitle className='text-red-600'>Khu vực nguy hiểm</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <div className='flex justify-between items-center'>
              <div>
                <div className='font-medium text-red-600'>Xóa tài khoản</div>
                <div className='text-sm text-gray-600'>
                  Xóa vĩnh viễn tài khoản và tất cả dữ liệu
                </div>
              </div>
              <Button variant='destructive' size='sm'>
                Xóa tài khoản
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
