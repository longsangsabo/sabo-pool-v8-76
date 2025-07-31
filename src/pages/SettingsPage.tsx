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
import MobileLayout from '../components/MobileLayout';
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
      <MobileLayout>
        <div className='flex items-center justify-center min-h-screen'>
          <p className='text-gray-600'>
            Vui lòng đăng nhập để truy cập cài đặt
          </p>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className='min-h-screen bg-gray-50'>
        {/* Header */}
        <div className='bg-white border-b p-4'>
          <h1 className='text-2xl font-bold flex items-center gap-2'>
            <Settings className='w-6 h-6' />
            Cài đặt
          </h1>
        </div>

        <div className='p-4'>
          <Tabs defaultValue='account' className='w-full'>
            <TabsList className='grid w-full grid-cols-4'>
              <TabsTrigger value='account' className='text-xs'>
                <User className='w-4 h-4 mr-1' />
                Tài khoản
              </TabsTrigger>
              <TabsTrigger value='notifications' className='text-xs'>
                <Bell className='w-4 h-4 mr-1' />
                Thông báo
              </TabsTrigger>
              <TabsTrigger value='privacy' className='text-xs'>
                <Shield className='w-4 h-4 mr-1' />
                Riêng tư
              </TabsTrigger>
              <TabsTrigger value='system' className='text-xs'>
                <Globe className='w-4 h-4 mr-1' />
                Hệ thống
              </TabsTrigger>
            </TabsList>

            <TabsContent value='account' className='space-y-4 mt-4'>
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin tài khoản</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='space-y-2'>
                    <Label>Email</Label>
                    <div className='flex items-center gap-2'>
                      <Mail className='w-4 h-4 text-gray-400' />
                      <Input value={user.email || ''} disabled />
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <Label>Số điện thoại</Label>
                    <div className='flex items-center gap-2'>
                      <Phone className='w-4 h-4 text-gray-400' />
                      <Input
                        placeholder='Chưa cập nhật'
                        value={user.user_metadata?.phone || ''}
                        disabled
                      />
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <Label>Tên hiển thị</Label>
                    <Input
                      value={user.user_metadata?.full_name || ''}
                      placeholder='Nhập tên hiển thị'
                    />
                  </div>

                  <Button onClick={handleSaveSettings} className='w-full'>
                    Lưu thay đổi
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Bảo mật</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <Label>Xác thực 2 bước</Label>
                      <p className='text-sm text-gray-500'>
                        Tăng cường bảo mật tài khoản
                      </p>
                    </div>
                    <Switch
                      checked={security.twoFactor}
                      onCheckedChange={checked =>
                        setSecurity(prev => ({ ...prev, twoFactor: checked }))
                      }
                    />
                  </div>

                  <div className='flex items-center justify-between'>
                    <div>
                      <Label>Cảnh báo đăng nhập</Label>
                      <p className='text-sm text-gray-500'>
                        Nhận thông báo khi có đăng nhập mới
                      </p>
                    </div>
                    <Switch
                      checked={security.loginAlerts}
                      onCheckedChange={checked =>
                        setSecurity(prev => ({ ...prev, loginAlerts: checked }))
                      }
                    />
                  </div>

                  <Button
                    onClick={handleChangePassword}
                    variant='outline'
                    className='w-full'
                  >
                    <Lock className='w-4 h-4 mr-2' />
                    Đổi mật khẩu
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value='notifications' className='space-y-4 mt-4'>
              <Card>
                <CardHeader>
                  <CardTitle>Cài đặt thông báo</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <Label>Email</Label>
                      <p className='text-sm text-gray-500'>
                        Nhận thông báo qua email
                      </p>
                    </div>
                    <Switch
                      checked={notifications.email}
                      onCheckedChange={checked =>
                        setNotifications(prev => ({ ...prev, email: checked }))
                      }
                    />
                  </div>

                  <div className='flex items-center justify-between'>
                    <div>
                      <Label>Push notification</Label>
                      <p className='text-sm text-gray-500'>
                        Thông báo trên trình duyệt
                      </p>
                    </div>
                    <Switch
                      checked={notifications.push}
                      onCheckedChange={checked =>
                        setNotifications(prev => ({ ...prev, push: checked }))
                      }
                    />
                  </div>

                  <div className='flex items-center justify-between'>
                    <div>
                      <Label>SMS</Label>
                      <p className='text-sm text-gray-500'>
                        Thông báo qua tin nhắn
                      </p>
                    </div>
                    <Switch
                      checked={notifications.sms}
                      onCheckedChange={checked =>
                        setNotifications(prev => ({ ...prev, sms: checked }))
                      }
                    />
                  </div>

                  <hr />

                  <div className='flex items-center justify-between'>
                    <div>
                      <Label>Giải đấu</Label>
                      <p className='text-sm text-gray-500'>
                        Thông báo về giải đấu
                      </p>
                    </div>
                    <Switch
                      checked={notifications.tournaments}
                      onCheckedChange={checked =>
                        setNotifications(prev => ({
                          ...prev,
                          tournaments: checked,
                        }))
                      }
                    />
                  </div>

                  <div className='flex items-center justify-between'>
                    <div>
                      <Label>Thách đấu</Label>
                      <p className='text-sm text-gray-500'>
                        Thông báo về thách đấu
                      </p>
                    </div>
                    <Switch
                      checked={notifications.challenges}
                      onCheckedChange={checked =>
                        setNotifications(prev => ({
                          ...prev,
                          challenges: checked,
                        }))
                      }
                    />
                  </div>

                  <div className='flex items-center justify-between'>
                    <div>
                      <Label>Marketing</Label>
                      <p className='text-sm text-gray-500'>
                        Tin tức và khuyến mãi
                      </p>
                    </div>
                    <Switch
                      checked={notifications.marketing}
                      onCheckedChange={checked =>
                        setNotifications(prev => ({
                          ...prev,
                          marketing: checked,
                        }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value='privacy' className='space-y-4 mt-4'>
              <Card>
                <CardHeader>
                  <CardTitle>Quyền riêng tư</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <Label>Hồ sơ công khai</Label>
                      <p className='text-sm text-gray-500'>
                        Cho phép người khác xem hồ sơ
                      </p>
                    </div>
                    <Switch
                      checked={privacy.profileVisible}
                      onCheckedChange={checked =>
                        setPrivacy(prev => ({
                          ...prev,
                          profileVisible: checked,
                        }))
                      }
                    />
                  </div>

                  <div className='flex items-center justify-between'>
                    <div>
                      <Label>Thống kê công khai</Label>
                      <p className='text-sm text-gray-500'>
                        Hiển thị thống kê trận đấu
                      </p>
                    </div>
                    <Switch
                      checked={privacy.statsVisible}
                      onCheckedChange={checked =>
                        setPrivacy(prev => ({ ...prev, statsVisible: checked }))
                      }
                    />
                  </div>

                  <div className='flex items-center justify-between'>
                    <div>
                      <Label>Trạng thái online</Label>
                      <p className='text-sm text-gray-500'>
                        Hiển thị khi bạn đang online
                      </p>
                    </div>
                    <Switch
                      checked={privacy.onlineStatus}
                      onCheckedChange={checked =>
                        setPrivacy(prev => ({ ...prev, onlineStatus: checked }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value='system' className='space-y-4 mt-4'>
              <Card>
                <CardHeader>
                  <CardTitle>Cài đặt hệ thống</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='space-y-2'>
                    <Label>Ngôn ngữ</Label>
                    <Select defaultValue='vi'>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='vi'>Tiếng Việt</SelectItem>
                        <SelectItem value='en'>English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-2'>
                    <Label>Múi giờ</Label>
                    <Select defaultValue='asia/ho_chi_minh'>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='asia/ho_chi_minh'>
                          GMT+7 (Việt Nam)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={handleExportData}
                    variant='outline'
                    className='w-full'
                  >
                    <Download className='w-4 h-4 mr-2' />
                    Xuất dữ liệu cá nhân
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tài khoản</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <Button
                    onClick={handleLogout}
                    variant='outline'
                    className='w-full'
                  >
                    Đăng xuất
                  </Button>

                  <Button
                    onClick={handleDeleteAccount}
                    variant='destructive'
                    className='w-full'
                  >
                    <Trash2 className='w-4 h-4 mr-2' />
                    Xóa tài khoản
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MobileLayout>
  );
};

export default SettingsPage;
