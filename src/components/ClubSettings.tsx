import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  Settings,
  Building,
  Bell,
  Shield,
  Save,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

interface ClubSettings {
  id: string;
  club_name: string;
  address: string;
  phone: string;
  operating_hours: any;
  number_of_tables: number;
  verification_notes?: string;
}

interface NotificationSettings {
  new_rank_requests: boolean;
  member_updates: boolean;
  system_announcements: boolean;
  weekly_reports: boolean;
}

const ClubSettings = () => {
  const { user } = useAuth();
  const [clubSettings, setClubSettings] = useState<ClubSettings | null>(null);
  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>({
      new_rank_requests: true,
      member_updates: true,
      system_announcements: true,
      weekly_reports: false,
    });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchClubSettings();
  }, [user]);

  const fetchClubSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setClubSettings({
          id: data.id,
          club_name: data.name,
          address: data.address,
          phone: data.contact_info,
          operating_hours: {},
          number_of_tables: 10,
          verification_notes: data.description,
        });
      }
    } catch (error) {
      console.error('Error fetching club settings:', error);
      toast.error('Lỗi khi tải cài đặt CLB');
    } finally {
      setLoading(false);
    }
  };

  const saveClubSettings = async () => {
    if (!clubSettings || !user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('clubs')
        .update({
          name: clubSettings.club_name,
          address: clubSettings.address,
          contact_info: clubSettings.phone,
          description: clubSettings.verification_notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', clubSettings.id);

      if (error) throw error;

      toast.success('Đã lưu cài đặt CLB');
    } catch (error) {
      console.error('Error saving club settings:', error);
      toast.error('Lỗi khi lưu cài đặt');
    } finally {
      setSaving(false);
    }
  };

  const saveNotificationSettings = async () => {
    // Placeholder for notification settings
    toast.success('Đã lưu cài đặt thông báo');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className='pt-6'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2'></div>
            <p className='text-sm text-muted-foreground'>Đang tải cài đặt...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!clubSettings) {
    return (
      <Card>
        <CardContent className='pt-6'>
          <div className='text-center py-8 text-muted-foreground'>
            <AlertTriangle className='w-12 h-12 mx-auto mb-4 text-red-500' />
            <p className='font-medium'>Không tìm thấy thông tin CLB</p>
            <p className='text-sm mt-1'>
              Vui lòng liên hệ admin để được hỗ trợ
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Club Information Settings */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Building className='w-5 h-5' />
            Thông tin Câu lạc bộ
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <Label htmlFor='club_name'>Tên câu lạc bộ</Label>
              <Input
                id='club_name'
                value={clubSettings.club_name}
                onChange={e =>
                  setClubSettings({
                    ...clubSettings,
                    club_name: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <Label htmlFor='phone'>Số điện thoại</Label>
              <Input
                id='phone'
                value={clubSettings.phone}
                onChange={e =>
                  setClubSettings({ ...clubSettings, phone: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor='address'>Địa chỉ</Label>
            <Textarea
              id='address'
              value={clubSettings.address}
              onChange={e =>
                setClubSettings({ ...clubSettings, address: e.target.value })
              }
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor='tables'>Số bàn billiards</Label>
            <Input
              id='tables'
              type='number'
              min='1'
              value={clubSettings.number_of_tables}
              onChange={e =>
                setClubSettings({
                  ...clubSettings,
                  number_of_tables: parseInt(e.target.value) || 1,
                })
              }
            />
          </div>

          <div>
            <Label htmlFor='notes'>Ghi chú</Label>
            <Textarea
              id='notes'
              value={clubSettings.verification_notes || ''}
              onChange={e =>
                setClubSettings({
                  ...clubSettings,
                  verification_notes: e.target.value,
                })
              }
              placeholder='Ghi chú thêm về câu lạc bộ...'
              rows={3}
            />
          </div>

          <Button onClick={saveClubSettings} disabled={saving}>
            <Save className='w-4 h-4 mr-2' />
            {saving ? 'Đang lưu...' : 'Lưu thông tin CLB'}
          </Button>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Bell className='w-5 h-5' />
            Cài đặt Thông báo
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <div>
                <Label>Yêu cầu xác thực hạng mới</Label>
                <p className='text-sm text-muted-foreground'>
                  Nhận thông báo khi có người yêu cầu xác thực hạng
                </p>
              </div>
              <Switch
                checked={notificationSettings.new_rank_requests}
                onCheckedChange={checked =>
                  setNotificationSettings({
                    ...notificationSettings,
                    new_rank_requests: checked,
                  })
                }
              />
            </div>

            <Separator />

            <div className='flex items-center justify-between'>
              <div>
                <Label>Cập nhật thành viên</Label>
                <p className='text-sm text-muted-foreground'>
                  Thông báo về hoạt động của thành viên
                </p>
              </div>
              <Switch
                checked={notificationSettings.member_updates}
                onCheckedChange={checked =>
                  setNotificationSettings({
                    ...notificationSettings,
                    member_updates: checked,
                  })
                }
              />
            </div>

            <Separator />

            <div className='flex items-center justify-between'>
              <div>
                <Label>Thông báo hệ thống</Label>
                <p className='text-sm text-muted-foreground'>
                  Nhận thông báo quan trọng từ hệ thống
                </p>
              </div>
              <Switch
                checked={notificationSettings.system_announcements}
                onCheckedChange={checked =>
                  setNotificationSettings({
                    ...notificationSettings,
                    system_announcements: checked,
                  })
                }
              />
            </div>

            <Separator />

            <div className='flex items-center justify-between'>
              <div>
                <Label>Báo cáo hàng tuần</Label>
                <p className='text-sm text-muted-foreground'>
                  Nhận báo cáo tổng kết hoạt động CLB hàng tuần
                </p>
              </div>
              <Switch
                checked={notificationSettings.weekly_reports}
                onCheckedChange={checked =>
                  setNotificationSettings({
                    ...notificationSettings,
                    weekly_reports: checked,
                  })
                }
              />
            </div>
          </div>

          <Button onClick={saveNotificationSettings}>
            <Bell className='w-4 h-4 mr-2' />
            Lưu cài đặt thông báo
          </Button>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Shield className='w-5 h-5' />
            Bảo mật
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
            <div className='flex items-start gap-3'>
              <AlertTriangle className='w-5 h-5 text-yellow-600 mt-0.5' />
              <div>
                <h3 className='font-medium text-yellow-800'>Lưu ý bảo mật</h3>
                <p className='text-sm text-yellow-700 mt-1'>
                  Việc xác thực hạng sai quá nhiều sẽ ảnh hưởng đến uy tín của
                  câu lạc bộ. Hãy luôn kiểm tra kỹ trước khi xác nhận.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClubSettings;
