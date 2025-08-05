import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Switch } from '@/shared/components/ui/switch';
import { Badge } from '@/shared/components/ui/badge';
import {
  Shield,
  Lock,
  Eye,
  EyeOff,
  Smartphone,
  Mail,
  Key,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';

interface SecuritySettingsProps {
  onSave: (settings: SecuritySettings) => void;
  isLoading?: boolean;
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  emailNotifications: boolean;
  loginAlerts: boolean;
  sessionTimeout: number;
  passwordExpiry: number;
  deviceManagement: boolean;
}

export const SecuritySettings: React.FC<SecuritySettingsProps> = ({
  onSave,
  isLoading = false,
}) => {
  const [settings, setSettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    emailNotifications: true,
    loginAlerts: true,
    sessionTimeout: 30,
    passwordExpiry: 90,
    deviceManagement: true,
  });

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleSettingChange = (key: keyof SecuritySettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = () => {
    onSave(settings);
  };

  const handleChangePassword = () => {
    if (newPassword === confirmPassword && newPassword.length >= 8) {
      // Handle password change

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const getSecurityScore = () => {
    let score = 0;
    if (settings.twoFactorEnabled) score += 30;
    if (settings.loginAlerts) score += 20;
    if (settings.deviceManagement) score += 20;
    if (settings.emailNotifications) score += 15;
    if (settings.sessionTimeout <= 30) score += 15;
    return Math.min(score, 100);
  };

  const getSecurityLevel = (score: number) => {
    if (score >= 80)
      return { level: 'Cao', color: 'bg-green-100 text-green-800' };
    if (score >= 60)
      return { level: 'Trung bình', color: 'bg-yellow-100 text-yellow-800' };
    return { level: 'Thấp', color: 'bg-red-100 text-red-800' };
  };

  const securityScore = getSecurityScore();
  const securityLevel = getSecurityLevel(securityScore);

  return (
    <div className='space-y-6'>
      {/* Security Overview */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Shield className='h-5 w-5' />
            Tổng quan bảo mật
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='text-center'>
              <div className='text-3xl font-bold text-blue-600'>
                {securityScore}%
              </div>
              <div className='text-sm text-gray-600'>Điểm bảo mật</div>
            </div>
            <div className='text-center'>
              <Badge className={securityLevel.color}>
                {securityLevel.level}
              </Badge>
              <div className='text-sm text-gray-600 mt-1'>Mức độ bảo mật</div>
            </div>
            <div className='text-center'>
              <div className='text-3xl font-bold text-green-600'>3</div>
              <div className='text-sm text-gray-600'>
                Thiết bị đang hoạt động
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Lock className='h-5 w-5' />
            Xác thực hai yếu tố
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div>
              <div className='font-medium'>Bảo mật tài khoản</div>
              <div className='text-sm text-gray-600'>
                Yêu cầu mã xác thực khi đăng nhập từ thiết bị mới
              </div>
            </div>
            <Switch
              checked={settings.twoFactorEnabled}
              onCheckedChange={checked =>
                handleSettingChange('twoFactorEnabled', checked)
              }
            />
          </div>

          {settings.twoFactorEnabled && (
            <div className='p-4 bg-blue-50 rounded-lg'>
              <div className='flex items-center gap-2 mb-2'>
                <CheckCircle className='h-4 w-4 text-blue-600' />
                <span className='text-sm font-medium text-blue-800'>
                  Xác thực hai yếu tố đã được bật
                </span>
              </div>
              <p className='text-sm text-blue-700'>
                Tài khoản của bạn được bảo vệ bằng mã xác thực từ ứng dụng hoặc
                SMS.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Password Management */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Key className='h-5 w-5' />
            Quản lý mật khẩu
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-3'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Mật khẩu hiện tại
              </label>
              <div className='relative'>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder='Nhập mật khẩu hiện tại'
                />
                <Button
                  variant='ghost'
                  size='sm'
                  className='absolute right-0 top-0 h-full px-3'
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className='h-4 w-4' />
                  ) : (
                    <Eye className='h-4 w-4' />
                  )}
                </Button>
              </div>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Mật khẩu mới
              </label>
              <div className='relative'>
                <Input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder='Nhập mật khẩu mới (tối thiểu 8 ký tự)'
                />
                <Button
                  variant='ghost'
                  size='sm'
                  className='absolute right-0 top-0 h-full px-3'
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className='h-4 w-4' />
                  ) : (
                    <Eye className='h-4 w-4' />
                  )}
                </Button>
              </div>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Xác nhận mật khẩu mới
              </label>
              <Input
                type='password'
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder='Nhập lại mật khẩu mới'
              />
            </div>

            <Button
              onClick={handleChangePassword}
              disabled={
                !currentPassword ||
                !newPassword ||
                newPassword !== confirmPassword ||
                newPassword.length < 8
              }
              className='w-full'
            >
              Đổi mật khẩu
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Session Management */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Clock className='h-5 w-5' />
            Quản lý phiên đăng nhập
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div>
              <div className='font-medium'>Thời gian timeout phiên</div>
              <div className='text-sm text-gray-600'>
                Tự động đăng xuất sau {settings.sessionTimeout} phút không hoạt
                động
              </div>
            </div>
            <Input
              type='number'
              value={settings.sessionTimeout}
              onChange={e =>
                handleSettingChange(
                  'sessionTimeout',
                  parseInt(e.target.value) || 30
                )
              }
              className='w-20'
              min='5'
              max='120'
            />
          </div>

          <div className='flex items-center justify-between'>
            <div>
              <div className='font-medium'>Cảnh báo đăng nhập</div>
              <div className='text-sm text-gray-600'>
                Gửi email khi có đăng nhập từ thiết bị mới
              </div>
            </div>
            <Switch
              checked={settings.loginAlerts}
              onCheckedChange={checked =>
                handleSettingChange('loginAlerts', checked)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Device Management */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Smartphone className='h-5 w-5' />
            Quản lý thiết bị
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-3'>
            <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
              <div className='flex items-center gap-3'>
                <Smartphone className='h-5 w-5 text-gray-600' />
                <div>
                  <div className='font-medium'>iPhone 14 Pro</div>
                  <div className='text-sm text-gray-600'>
                    Hà Nội, VN • Đang hoạt động
                  </div>
                </div>
              </div>
              <Badge className='bg-green-100 text-green-800'>Hiện tại</Badge>
            </div>

            <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
              <div className='flex items-center gap-3'>
                <Smartphone className='h-5 w-5 text-gray-600' />
                <div>
                  <div className='font-medium'>Samsung Galaxy S23</div>
                  <div className='text-sm text-gray-600'>
                    TP.HCM, VN • 2 giờ trước
                  </div>
                </div>
              </div>
              <Button variant='outline' size='sm'>
                Đăng xuất
              </Button>
            </div>

            <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
              <div className='flex items-center gap-3'>
                <Smartphone className='h-5 w-5 text-gray-600' />
                <div>
                  <div className='font-medium'>MacBook Pro</div>
                  <div className='text-sm text-gray-600'>
                    Đà Nẵng, VN • 1 ngày trước
                  </div>
                </div>
              </div>
              <Button variant='outline' size='sm'>
                Đăng xuất
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className='flex justify-end'>
        <Button
          onClick={handleSaveSettings}
          disabled={isLoading}
          className='px-8'
        >
          {isLoading ? 'Đang lưu...' : 'Lưu cài đặt'}
        </Button>
      </div>
    </div>
  );
};
