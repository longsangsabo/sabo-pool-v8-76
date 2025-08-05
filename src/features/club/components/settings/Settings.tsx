import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import {
  Settings as SettingsIcon,
  MapPin,
  Clock,
  DollarSign,
  Users,
  Shield,
  Palette,
  Bell,
  Save,
  Camera,
} from 'lucide-react';

interface ClubSettings {
  // Basic Info
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;

  // Operating Hours
  openTime: string;
  closeTime: string;
  workingDays: string[];

  // Pricing
  standardRate: number;
  vipRate: number;
  memberDiscount: number;

  // Features
  allowReservations: boolean;
  requireMembership: boolean;
  enableTournaments: boolean;
  autoCalculateElo: boolean;

  // Notifications
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
}

interface SettingsProps {
  clubId: string;
}

export const Settings: React.FC<SettingsProps> = ({ clubId }) => {
  const [settings, setSettings] = useState<ClubSettings>({
    name: 'Sabo Pool Club',
    description:
      'CLB Pool chuyên nghiệp với không gian hiện đại và dịch vụ tốt nhất',
    address: 'Số 123, Đường ABC, Quận 1, TP.HCM',
    phone: '0901234567',
    email: 'info@sabopoolclub.com',
    openTime: '08:00',
    closeTime: '23:00',
    workingDays: [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ],
    standardRate: 50000,
    vipRate: 80000,
    memberDiscount: 10,
    allowReservations: true,
    requireMembership: false,
    enableTournaments: true,
    autoCalculateElo: true,
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: keyof ClubSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleWorkingDayToggle = (day: string) => {
    setSettings(prev => ({
      ...prev,
      workingDays: prev.workingDays.includes(day)
        ? prev.workingDays.filter(d => d !== day)
        : [...prev.workingDays, day],
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    // TODO: Save settings to backend
    setTimeout(() => {
      setIsLoading(false);
      // Show success message
    }, 1000);
  };

  const dayLabels = {
    monday: 'Thứ 2',
    tuesday: 'Thứ 3',
    wednesday: 'Thứ 4',
    thursday: 'Thứ 5',
    friday: 'Thứ 6',
    saturday: 'Thứ 7',
    sunday: 'Chủ nhật',
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <SettingsIcon className='h-6 w-6' />
          <h2 className='text-2xl font-bold'>Cài đặt CLB</h2>
        </div>
        <Button onClick={handleSave} disabled={isLoading} className='px-6'>
          <Save className='h-4 w-4 mr-2' />
          {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
        </Button>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <MapPin className='h-5 w-5' />
            Thông tin cơ bản
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium mb-2'>Tên CLB</label>
              <Input
                value={settings.name}
                onChange={e => handleInputChange('name', e.target.value)}
                placeholder='Nhập tên CLB'
              />
            </div>
            <div>
              <label className='block text-sm font-medium mb-2'>
                Số điện thoại
              </label>
              <Input
                value={settings.phone}
                onChange={e => handleInputChange('phone', e.target.value)}
                placeholder='Nhập số điện thoại'
              />
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium mb-2'>Mô tả</label>
            <textarea
              value={settings.description}
              onChange={e => handleInputChange('description', e.target.value)}
              placeholder='Nhập mô tả CLB'
              className='w-full p-3 border rounded-md resize-none'
              rows={3}
            />
          </div>

          <div>
            <label className='block text-sm font-medium mb-2'>Địa chỉ</label>
            <Input
              value={settings.address}
              onChange={e => handleInputChange('address', e.target.value)}
              placeholder='Nhập địa chỉ CLB'
            />
          </div>

          <div>
            <label className='block text-sm font-medium mb-2'>Email</label>
            <Input
              type='email'
              value={settings.email}
              onChange={e => handleInputChange('email', e.target.value)}
              placeholder='Nhập email liên hệ'
            />
          </div>
        </CardContent>
      </Card>

      {/* Operating Hours */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Clock className='h-5 w-5' />
            Giờ hoạt động
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium mb-2'>
                Giờ mở cửa
              </label>
              <Input
                type='time'
                value={settings.openTime}
                onChange={e => handleInputChange('openTime', e.target.value)}
              />
            </div>
            <div>
              <label className='block text-sm font-medium mb-2'>
                Giờ đóng cửa
              </label>
              <Input
                type='time'
                value={settings.closeTime}
                onChange={e => handleInputChange('closeTime', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium mb-3'>
              Ngày hoạt động
            </label>
            <div className='flex flex-wrap gap-2'>
              {Object.entries(dayLabels).map(([day, label]) => (
                <Badge
                  key={day}
                  variant={
                    settings.workingDays.includes(day) ? 'default' : 'outline'
                  }
                  className='cursor-pointer px-3 py-1'
                  onClick={() => handleWorkingDayToggle(day)}
                >
                  {label}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <DollarSign className='h-5 w-5' />
            Bảng giá
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div>
              <label className='block text-sm font-medium mb-2'>
                Giá bàn thường (VNĐ/giờ)
              </label>
              <Input
                type='number'
                value={settings.standardRate}
                onChange={e =>
                  handleInputChange('standardRate', parseInt(e.target.value))
                }
                placeholder='50000'
              />
            </div>
            <div>
              <label className='block text-sm font-medium mb-2'>
                Giá bàn VIP (VNĐ/giờ)
              </label>
              <Input
                type='number'
                value={settings.vipRate}
                onChange={e =>
                  handleInputChange('vipRate', parseInt(e.target.value))
                }
                placeholder='80000'
              />
            </div>
            <div>
              <label className='block text-sm font-medium mb-2'>
                Giảm giá thành viên (%)
              </label>
              <Input
                type='number'
                value={settings.memberDiscount}
                onChange={e =>
                  handleInputChange('memberDiscount', parseInt(e.target.value))
                }
                placeholder='10'
                min='0'
                max='100'
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Shield className='h-5 w-5' />
            Tính năng
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <label className='flex items-center gap-3 cursor-pointer'>
              <input
                type='checkbox'
                checked={settings.allowReservations}
                onChange={e =>
                  handleInputChange('allowReservations', e.target.checked)
                }
                className='w-4 h-4'
              />
              <span>Cho phép đặt bàn trước</span>
            </label>

            <label className='flex items-center gap-3 cursor-pointer'>
              <input
                type='checkbox'
                checked={settings.requireMembership}
                onChange={e =>
                  handleInputChange('requireMembership', e.target.checked)
                }
                className='w-4 h-4'
              />
              <span>Yêu cầu thành viên để chơi</span>
            </label>

            <label className='flex items-center gap-3 cursor-pointer'>
              <input
                type='checkbox'
                checked={settings.enableTournaments}
                onChange={e =>
                  handleInputChange('enableTournaments', e.target.checked)
                }
                className='w-4 h-4'
              />
              <span>Kích hoạt giải đấu</span>
            </label>

            <label className='flex items-center gap-3 cursor-pointer'>
              <input
                type='checkbox'
                checked={settings.autoCalculateElo}
                onChange={e =>
                  handleInputChange('autoCalculateElo', e.target.checked)
                }
                className='w-4 h-4'
              />
              <span>Tự động tính ELO</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Bell className='h-5 w-5' />
            Thông báo
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <label className='flex items-center gap-3 cursor-pointer'>
              <input
                type='checkbox'
                checked={settings.emailNotifications}
                onChange={e =>
                  handleInputChange('emailNotifications', e.target.checked)
                }
                className='w-4 h-4'
              />
              <span>Thông báo Email</span>
            </label>

            <label className='flex items-center gap-3 cursor-pointer'>
              <input
                type='checkbox'
                checked={settings.smsNotifications}
                onChange={e =>
                  handleInputChange('smsNotifications', e.target.checked)
                }
                className='w-4 h-4'
              />
              <span>Thông báo SMS</span>
            </label>

            <label className='flex items-center gap-3 cursor-pointer'>
              <input
                type='checkbox'
                checked={settings.pushNotifications}
                onChange={e =>
                  handleInputChange('pushNotifications', e.target.checked)
                }
                className='w-4 h-4'
              />
              <span>Thông báo Push</span>
            </label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
