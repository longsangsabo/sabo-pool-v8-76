import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Settings,
  Bell,
  Clock,
  Image,
  Info,
  Building,
  Save,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Club, OperatingHours } from '../../types/club.types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ClubSettingsProps {
  club: Club;
}

interface SettingsFormData {
  club_name: string;
  address: string;
  district: string;
  city: string;
  phone: string;
  email: string;
  description: string;
  operating_hours: OperatingHours;
  notifications: {
    rank_requests: boolean;
    member_updates: boolean;
    reports: boolean;
  };
}

export const ClubSettings: React.FC<ClubSettingsProps> = ({ club }) => {
  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<SettingsFormData>({
    defaultValues: {
      club_name: club.club_name,
      address: club.address,
      district: club.district || '',
      city: club.city || '',
      phone: club.phone,
      email: club.email || '',
      description: club.description || '',
      operating_hours: club.operating_hours || {},
      notifications: {
        rank_requests: true,
        member_updates: true,
        reports: true,
      },
    },
  });

  const onSubmit = async (data: SettingsFormData) => {
    try {
      const { error } = await supabase
        .from('club_profiles')
        .update({
          club_name: data.club_name,
          address: data.address,
          district: data.district,
          city: data.city,
          phone: data.phone,
          email: data.email,
          description: data.description,
          operating_hours: data.operating_hours,
        })
        .eq('id', club.id);

      if (error) throw error;
      toast.success('Cập nhật thông tin thành công');
    } catch (error) {
      console.error('Error updating club settings:', error);
      toast.error('Không thể cập nhật thông tin');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Info className="w-4 h-4" />
            Thông tin chung
          </TabsTrigger>
          <TabsTrigger value="operating-hours" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Giờ hoạt động
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Thông báo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Thông tin cơ bản
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="club_name">Tên CLB</Label>
                  <Input
                    id="club_name"
                    {...register('club_name', { required: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input
                    id="phone"
                    {...register('phone', { required: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Địa chỉ</Label>
                  <Input
                    id="address"
                    {...register('address', { required: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="district">Quận/Huyện</Label>
                  <Input
                    id="district"
                    {...register('district')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Thành phố</Label>
                  <Input
                    id="city"
                    {...register('city')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Cài đặt thông báo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Yêu cầu xác thực rank</Label>
                  <p className="text-sm text-muted-foreground">
                    Nhận thông báo khi có yêu cầu xác thực mới
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Cập nhật thành viên</Label>
                  <p className="text-sm text-muted-foreground">
                    Thông báo khi có thành viên mới hoặc thay đổi
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Báo cáo định kỳ</Label>
                  <p className="text-sm text-muted-foreground">
                    Nhận báo cáo hoạt động hàng tuần
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end mt-6">
        <Button
          type="submit"
          disabled={!isDirty}
          className="flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Lưu thay đổi
        </Button>
      </div>
    </form>
  );
};
