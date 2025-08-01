import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useUnifiedProfile } from '@/contexts/UnifiedProfileContext';
import { Camera, Save, RotateCcw, User, Trophy, Target } from 'lucide-react';

export const UnifiedProfileForm: React.FC = () => {
  const {
    profile,
    stats,
    loading,
    uploadAvatar,
    updateField,
    hasChanges,
    saveChanges,
    resetChanges,
  } = useUnifiedProfile();

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      return;
    }

    await uploadAvatar(file);
  };

  if (!profile) {
    return (
      <div className='flex items-center justify-center p-8'>
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
    pro: { label: 'Chuyên nghiệp', color: 'bg-yellow-100 text-yellow-800' },
  };

  return (
    <div className='max-w-4xl mx-auto space-y-6'>
      {/* Profile Header with Avatar */}
      <Card>
        <CardContent className='pt-6'>
          <div className='flex flex-col md:flex-row items-center gap-6'>
            <div className='relative'>
              <Avatar className='w-24 h-24'>
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className='text-2xl'>
                  {profile.display_name?.[0] || profile.full_name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <label className='absolute bottom-0 right-0 p-1 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90'>
                <Camera className='w-4 h-4' />
                <input
                  type='file'
                  accept='image/*'
                  onChange={handleAvatarUpload}
                  className='hidden'
                />
              </label>
            </div>

            <div className='flex-1 text-center md:text-left'>
              <h2 className='text-2xl font-bold'>
                {profile.display_name || profile.full_name || 'Người dùng'}
              </h2>
              <p className='text-muted-foreground'>
                {profile.bio || 'Chưa có mô tả'}
              </p>

              <div className='flex flex-wrap gap-2 mt-2 justify-center md:justify-start'>
                <Badge className={skillLevels[profile.skill_level].color}>
                  {skillLevels[profile.skill_level].label}
                </Badge>
                <Badge variant='outline'>
                  {profile.role === 'player'
                    ? 'Người chơi'
                    : profile.role === 'club_owner'
                      ? 'Chủ CLB'
                      : 'Cả hai'}
                </Badge>
              </div>
            </div>

            {/* Stats */}
            {stats && (
              <div className='grid grid-cols-3 gap-4 text-center'>
                <div>
                  <div className='text-2xl font-bold text-primary'>
                    {stats.total_matches}
                  </div>
                  <div className='text-sm text-muted-foreground'>Trận đấu</div>
                </div>
                <div>
                  <div className='text-2xl font-bold text-green-600'>
                    {stats.wins}
                  </div>
                  <div className='text-sm text-muted-foreground'>Thắng</div>
                </div>
                <div>
                  <div className='text-2xl font-bold text-yellow-600'>
                    {stats.spa_points}
                  </div>
                  <div className='text-sm text-muted-foreground'>SPA</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <User className='w-5 h-5' />
            Thông tin cơ bản
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='display_name'>Tên hiển thị</Label>
              <Input
                id='display_name'
                value={profile.display_name}
                onChange={e => updateField('display_name', e.target.value)}
                placeholder='Nhập tên hiển thị'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='phone'>Số điện thoại</Label>
              <Input
                id='phone'
                value={profile.phone}
                onChange={e => updateField('phone', e.target.value)}
                placeholder='Nhập số điện thoại'
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='bio'>Mô tả bản thân</Label>
            <Textarea
              id='bio'
              value={profile.bio}
              onChange={e => updateField('bio', e.target.value)}
              placeholder='Viết vài dòng về bản thân...'
              rows={3}
            />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='skill_level'>Trình độ</Label>
              <Select
                value={profile.skill_level}
                onValueChange={value => updateField('skill_level', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='beginner'>Người mới</SelectItem>
                  <SelectItem value='intermediate'>Trung bình</SelectItem>
                  <SelectItem value='advanced'>Khá</SelectItem>
                  <SelectItem value='pro'>Chuyên nghiệp</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='city'>Thành phố</Label>
              <Input
                id='city'
                value={profile.city}
                onChange={e => updateField('city', e.target.value)}
                placeholder='Thành phố'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='district'>Quận/Huyện</Label>
              <Input
                id='district'
                value={profile.district}
                onChange={e => updateField('district', e.target.value)}
                placeholder='Quận/Huyện'
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Stats */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Trophy className='w-5 h-5' />
              Thống kê thi đấu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              <div className='text-center p-4 bg-muted rounded-lg'>
                <div className='text-2xl font-bold'>{stats.total_matches}</div>
                <div className='text-sm text-muted-foreground'>Tổng trận</div>
              </div>
              <div className='text-center p-4 bg-green-50 rounded-lg'>
                <div className='text-2xl font-bold text-green-600'>
                  {stats.wins}
                </div>
                <div className='text-sm text-muted-foreground'>Thắng</div>
              </div>
              <div className='text-center p-4 bg-red-50 rounded-lg'>
                <div className='text-2xl font-bold text-red-600'>
                  {stats.losses}
                </div>
                <div className='text-sm text-muted-foreground'>Thua</div>
              </div>
              <div className='text-center p-4 bg-blue-50 rounded-lg'>
                <div className='text-2xl font-bold text-blue-600'>
                  {stats.win_rate.toFixed(1)}%
                </div>
                <div className='text-sm text-muted-foreground'>Tỷ lệ thắng</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {hasChanges && (
        <Card>
          <CardContent className='pt-6'>
            <div className='flex justify-end gap-2'>
              <Button variant='outline' onClick={resetChanges}>
                <RotateCcw className='w-4 h-4 mr-2' />
                Hủy thay đổi
              </Button>
              <Button onClick={saveChanges} disabled={loading}>
                <Save className='w-4 h-4 mr-2' />
                {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
