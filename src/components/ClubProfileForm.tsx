import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Building,
  Phone,
  MapPin,
  Clock,
  Users,
  Save,
  Loader2,
} from 'lucide-react';

interface ClubProfile {
  id: string;
  club_name: string;
  address: string;
  phone: string;
  operating_hours: any;
  number_of_tables: number;
  verification_status: string;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

const ClubProfileForm = () => {
  const { user } = useAuth();
  const [clubProfile, setClubProfile] = useState<ClubProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    club_name: '',
    address: '',
    phone: '',
    number_of_tables: 1,
    opening_time: '',
    closing_time: '',
    notes: '',
  });

  useEffect(() => {
    if (user) {
      fetchClubProfile();
    }
  }, [user]);

  const fetchClubProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .eq('owner_id', user?.id)
        .single();

      if (error) throw error;

      if (data) {
        const clubData = {
          id: data.id,
          club_name: data.name,
          address: data.address || '',
          phone: data.contact_info || '',
          operating_hours: {},
          number_of_tables: 1,
          verification_status: data.status || 'pending',
          verified_at: null,
          created_at: data.created_at,
          updated_at: data.updated_at,
        };
        setClubProfile(clubData);
        setFormData({
          club_name: data.name || '',
          address: data.address || '',
          phone: data.contact_info || '',
          number_of_tables: 1,
          opening_time: '',
          closing_time: '',
          notes: '',
        });
      }
    } catch (error) {
      console.error('Error fetching club profile:', error);
      toast.error('Không thể tải thông tin câu lạc bộ');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'number_of_tables' ? parseInt(value) || 1 : value,
    }));
  };

  const handleSave = async () => {
    if (!clubProfile) return;

    setSaving(true);
    try {
      const operatingHours = {
        open: formData.opening_time,
        close: formData.closing_time,
        days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      };

      const { error } = await supabase
        .from('clubs')
        .update({
          name: formData.club_name,
          address: formData.address,
          contact_info: formData.phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', clubProfile.id);

      if (error) throw error;

      toast.success('Cập nhật thông tin câu lạc bộ thành công!');
      await fetchClubProfile(); // Reload data
    } catch (error) {
      console.error('Error updating club profile:', error);
      toast.error('Không thể cập nhật thông tin câu lạc bộ');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className='bg-green-100 text-green-800'>Đã phê duyệt</Badge>
        );
      case 'pending':
        return (
          <Badge className='bg-yellow-100 text-yellow-800'>Chờ phê duyệt</Badge>
        );
      case 'rejected':
        return <Badge className='bg-red-100 text-red-800'>Bị từ chối</Badge>;
      default:
        return <Badge variant='secondary'>Chưa xác định</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className='pt-6'>
          <div className='flex items-center justify-center py-12'>
            <Loader2 className='w-8 h-8 animate-spin' />
            <span className='ml-2'>Đang tải thông tin...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!clubProfile) {
    return (
      <Card>
        <CardContent className='pt-6'>
          <div className='text-center py-12'>
            <Building className='h-12 w-12 mx-auto mb-4 text-muted-foreground' />
            <p className='text-lg font-medium'>
              Không tìm thấy thông tin câu lạc bộ
            </p>
            <p className='text-muted-foreground mt-2'>
              Vui lòng liên hệ quản trị viên để được hỗ trợ
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Club Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Building className='w-5 h-5' />
              Trạng thái Câu lạc bộ
            </div>
            {getStatusBadge(clubProfile.verification_status)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
            <div>
              <span className='text-muted-foreground'>Ngày tạo:</span>
              <p className='font-medium'>
                {new Date(clubProfile.created_at).toLocaleDateString('vi-VN')}
              </p>
            </div>
            {clubProfile.verified_at && (
              <div>
                <span className='text-muted-foreground'>Ngày phê duyệt:</span>
                <p className='font-medium'>
                  {new Date(clubProfile.verified_at).toLocaleDateString(
                    'vi-VN'
                  )}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Club Information Form */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Building className='w-5 h-5' />
            Thông tin Câu lạc bộ
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='space-y-2'>
              <Label htmlFor='club_name'>Tên câu lạc bộ</Label>
              <Input
                id='club_name'
                name='club_name'
                value={formData.club_name}
                onChange={handleInputChange}
                placeholder='Nhập tên câu lạc bộ...'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='phone'>Số điện thoại</Label>
              <div className='relative'>
                <Phone className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                <Input
                  id='phone'
                  name='phone'
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder='Nhập số điện thoại...'
                  className='pl-10'
                />
              </div>
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='address'>Địa chỉ</Label>
            <div className='relative'>
              <MapPin className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
              <Textarea
                id='address'
                name='address'
                value={formData.address}
                onChange={handleInputChange}
                placeholder='Nhập địa chỉ câu lạc bộ...'
                className='pl-10 min-h-[80px]'
              />
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div className='space-y-2'>
              <Label htmlFor='number_of_tables'>Số bàn bi-a</Label>
              <div className='relative'>
                <Users className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                <Input
                  id='number_of_tables'
                  name='number_of_tables'
                  type='number'
                  min='1'
                  value={formData.number_of_tables}
                  onChange={handleInputChange}
                  className='pl-10'
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='opening_time'>Giờ mở cửa</Label>
              <div className='relative'>
                <Clock className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                <Input
                  id='opening_time'
                  name='opening_time'
                  type='time'
                  value={formData.opening_time}
                  onChange={handleInputChange}
                  className='pl-10'
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='closing_time'>Giờ đóng cửa</Label>
              <div className='relative'>
                <Clock className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                <Input
                  id='closing_time'
                  name='closing_time'
                  type='time'
                  value={formData.closing_time}
                  onChange={handleInputChange}
                  className='pl-10'
                />
              </div>
            </div>
          </div>

          <div className='flex justify-end pt-4'>
            <Button
              onClick={handleSave}
              disabled={saving}
              className='flex items-center gap-2'
            >
              {saving ? (
                <Loader2 className='w-4 h-4 animate-spin' />
              ) : (
                <Save className='w-4 h-4' />
              )}
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClubProfileForm;
