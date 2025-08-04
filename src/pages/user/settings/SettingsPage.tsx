import { useState } from 'react';
import {
  Settings,
  User,
  Bell,
  Shield,
  Globe,
  Moon,
  Sun,
  Download,
  Trash2,
  Lock,
  Mail,
  Phone,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const SettingsPage = () => {
  const { user, signOut } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  // Settings state
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    tournaments: true,
    challenges: true,
    marketing: false,
  });

  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    statsVisible: true,
    onlineStatus: true,
  });

  const [security, setSecurity] = useState({
    twoFactor: false,
    loginAlerts: true,
  });

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Đăng xuất thành công');
    } catch (error) {
      toast.error('Có lỗi xảy ra khi đăng xuất');
    }
  };

  const handleSaveSettings = () => {
    toast.success('Cài đặt đã được lưu');
  };

  const handleChangePassword = () => {
    toast.info('Tính năng đổi mật khẩu sắp có');
  };

  const handleExportData = () => {
    toast.info('Tính năng xuất dữ liệu sắp có');
  };

  const handleDeleteAccount = () => {
    toast.error('Tính năng xóa tài khoản cần xác nhận bổ sung');
  };

  if (!user) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <p className='text-gray-600'>Vui lòng đăng nhập để truy cập cài đặt</p>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='bg-white border-b border-gray-200 px-4 py-4'>
        <h1 className='text-xl font-bold text-gray-900'>Cài đặt</h1>
      </div>

      <div className='p-4 space-y-6'>
        {/* Notifications */}
        <section className='bg-white rounded-lg shadow-sm border border-gray-200 p-4'>
          <h2 className='text-lg font-semibold text-gray-900 mb-4'>
            Thông báo
          </h2>

          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <div>
                <Label htmlFor='notifications'>Thông báo push</Label>
                <p className='text-sm text-gray-500'>
                  Nhận thông báo về thách đấu và giải đấu
                </p>
              </div>
              <Switch
                id='notifications'
                checked={notifications.push}
                onCheckedChange={checked =>
                  setNotifications(prev => ({ ...prev, push: checked }))
                }
              />
            </div>

            <div className='flex items-center justify-between'>
              <div>
                <Label htmlFor='email-notifications'>Thông báo email</Label>
                <p className='text-sm text-gray-500'>
                  Nhận email về hoạt động quan trọng
                </p>
              </div>
              <Switch
                id='email-notifications'
                checked={notifications.email}
                onCheckedChange={checked =>
                  setNotifications(prev => ({ ...prev, email: checked }))
                }
              />
            </div>
          </div>
        </section>

        {/* Privacy */}
        <section className='bg-white rounded-lg shadow-sm border border-gray-200 p-4'>
          <h2 className='text-lg font-semibold text-gray-900 mb-4'>
            Quyền riêng tư
          </h2>

          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <div>
                <Label htmlFor='public-profile'>Hồ sơ công khai</Label>
                <p className='text-sm text-gray-500'>
                  Cho phép người khác xem hồ sơ của bạn
                </p>
              </div>
              <Switch
                id='public-profile'
                checked={privacy.profileVisible}
                onCheckedChange={checked =>
                  setPrivacy(prev => ({ ...prev, profileVisible: checked }))
                }
              />
            </div>

            <div className='flex items-center justify-between'>
              <div>
                <Label htmlFor='show-online'>Hiển thị trạng thái online</Label>
                <p className='text-sm text-gray-500'>
                  Cho người khác biết khi bạn đang online
                </p>
              </div>
              <Switch
                id='show-online'
                checked={privacy.onlineStatus}
                onCheckedChange={checked =>
                  setPrivacy(prev => ({ ...prev, onlineStatus: checked }))
                }
              />
            </div>
          </div>
        </section>

        {/* Account Actions */}
        <section className='bg-white rounded-lg shadow-sm border border-gray-200 p-4'>
          <h2 className='text-lg font-semibold text-gray-900 mb-4'>
            Tài khoản
          </h2>

          <div className='space-y-3'>
            <Button
              variant='outline'
              className='w-full justify-start'
              onClick={handleChangePassword}
            >
              Đổi mật khẩu
            </Button>

            <Button
              variant='outline'
              className='w-full justify-start'
              onClick={handleExportData}
            >
              Xuất dữ liệu
            </Button>

            <Button
              variant='destructive'
              className='w-full justify-start'
              onClick={handleLogout}
            >
              Đăng xuất
            </Button>
          </div>
        </section>

        {/* Save Button */}
        <div className='pb-6'>
          <Button
            onClick={handleSaveSettings}
            className='w-full bg-blue-600 hover:bg-blue-700'
          >
            Lưu thay đổi
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
