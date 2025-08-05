import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Building,
  MapPin,
  Phone,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';

interface ClubProfile {
  id: string;
  club_name: string;
  address: string;
  phone: string;
  operating_hours: any;
  number_of_tables: number;
  verification_status: string;
  verification_notes: string | null;
  created_at: string;
}

const ClubRegistrationForm = () => {
  const { user } = useAuth();
  const [clubProfile, setClubProfile] = useState<ClubProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    club_name: '',
    address: '',
    city: 'TP. Hồ Chí Minh',
    district: '',
    phone: '',
    opening_time: '08:00',
    closing_time: '23:00',
    table_count: 1,
    table_types: ['Pool'],
    basic_price: 0,
    email: '',
    manager_name: '',
    manager_phone: '',
  });

  useEffect(() => {
    fetchClubProfile();
  }, [user]);

  const fetchClubProfile = async () => {
    if (!user) return;

    try {
      // Check if user owns a club
      const { data: clubData, error: clubError } = await supabase
        .from('clubs')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (clubData) {
        setFormData({
          club_name: clubData.name || '',
          address: clubData.address || '',
          city: 'TP. Hồ Chí Minh',
          district: '',
          phone: clubData.contact_info || '',
          opening_time: '08:00',
          closing_time: '23:00',
          table_count: 1,
          table_types: ['Pool'],
          basic_price: 0,
          email: '',
          manager_name: '',
          manager_phone: '',
        });
        setClubProfile({
          id: clubData.id,
          club_name: clubData.name || '',
          address: clubData.address || '',
          phone: clubData.contact_info || '',
          operating_hours: {},
          number_of_tables: 1,
          verification_status: clubData.status || 'pending',
          verification_notes: null,
          created_at: clubData.created_at,
        });
      } else {
        // No existing club
        setClubProfile(null);
      }
    } catch (error) {
      console.error('Error fetching club profile:', error);
      setClubProfile(null);
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
      [name]:
        name === 'table_count' || name === 'basic_price'
          ? parseInt(value) || 0
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      // Create new club
      const { data, error } = await supabase
        .from('clubs')
        .insert([
          {
            name: formData.club_name,
            address: formData.address,
            contact_info: formData.phone,
            owner_id: user.id,
            status: 'pending',
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Create notification
      await supabase.from('notifications').insert({
        user_id: user.id,
        type: 'club_registration_submitted',
        title: 'Đăng ký CLB thành công!',
        message: `Bạn đã gửi đăng ký câu lạc bộ "${formData.club_name}" thành công. Chúng tôi sẽ xem xét và thông báo kết quả sớm nhất.`,
        action_url: '/profile?tab=club',
      });

      toast.success('Đăng ký CLB thành công! Vui lòng chờ admin xét duyệt.');
      await fetchClubProfile(); // Refresh data
    } catch (error: any) {
      console.error('Error registering club:', error);
      toast.error(
        'Có lỗi xảy ra khi đăng ký CLB: ' + (error.message || 'Unknown error')
      );
    } finally {
      setSaving(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className='w-5 h-5 text-green-500' />;
      case 'rejected':
        return <XCircle className='w-5 h-5 text-red-500' />;
      default:
        return <AlertCircle className='w-5 h-5 text-yellow-500' />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Đã được phê duyệt';
      case 'rejected':
        return 'Bị từ chối';
      case 'pending':
        return 'Đang chờ phê duyệt';
      default:
        return 'Không xác định';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <Card className='bg-card text-card-foreground'>
        <CardContent className='pt-6'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4'></div>
            <p className='text-muted-foreground'>Đang tải thông tin...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Existing Club Status */}
      {clubProfile && (
        <Card className='bg-card text-card-foreground border-border'>
          <CardHeader>
            <CardTitle className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                {getStatusIcon(clubProfile.verification_status)}
                Trạng thái đăng ký
              </div>
              <Badge
                className={getStatusColor(clubProfile.verification_status)}
              >
                {getStatusText(clubProfile.verification_status)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              <div>
                <p className='font-medium'>{clubProfile.club_name}</p>
                <p className='text-sm text-muted-foreground'>
                  {clubProfile.address}
                </p>
              </div>
              {clubProfile.verification_notes && (
                <div className='p-3 bg-muted rounded-lg'>
                  <p className='text-sm text-muted-foreground'>
                    <strong>Ghi chú:</strong> {clubProfile.verification_notes}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Registration Form */}
      {!clubProfile && (
        <Card className='bg-card text-card-foreground border-border'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Building className='w-5 h-5' />
              Đăng ký Câu lạc bộ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className='space-y-6'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <label
                    htmlFor='club_name'
                    className='block text-sm font-medium mb-2'
                  >
                    Tên câu lạc bộ *
                  </label>
                  <Input
                    id='club_name'
                    name='club_name'
                    value={formData.club_name}
                    onChange={handleInputChange}
                    placeholder='Ví dụ: SABO Billiards'
                    required
                    className='bg-background border-border'
                  />
                </div>

                <div>
                  <label
                    htmlFor='phone'
                    className='block text-sm font-medium mb-2'
                  >
                    Số điện thoại *
                  </label>
                  <div className='relative'>
                    <Phone className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                    <Input
                      id='phone'
                      name='phone'
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder='Nhập số điện thoại'
                      className='pl-10 bg-background border-border'
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor='address'
                  className='block text-sm font-medium mb-2'
                >
                  Địa chỉ *
                </label>
                <div className='relative'>
                  <MapPin className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                  <Textarea
                    id='address'
                    name='address'
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder='Nhập địa chỉ đầy đủ của câu lạc bộ'
                    className='pl-10 min-h-[80px] bg-background border-border'
                    required
                  />
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                <div>
                  <label
                    htmlFor='table_count'
                    className='block text-sm font-medium mb-2'
                  >
                    Số bàn bi-a
                  </label>
                  <div className='relative'>
                    <Users className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                    <Input
                      id='table_count'
                      name='table_count'
                      type='number'
                      min='1'
                      value={formData.table_count}
                      onChange={handleInputChange}
                      className='pl-10 bg-background border-border'
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor='opening_time'
                    className='block text-sm font-medium mb-2'
                  >
                    Giờ mở cửa
                  </label>
                  <div className='relative'>
                    <Clock className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                    <Input
                      id='opening_time'
                      name='opening_time'
                      type='time'
                      value={formData.opening_time}
                      onChange={handleInputChange}
                      className='pl-10 bg-background border-border'
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor='closing_time'
                    className='block text-sm font-medium mb-2'
                  >
                    Giờ đóng cửa
                  </label>
                  <div className='relative'>
                    <Clock className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                    <Input
                      id='closing_time'
                      name='closing_time'
                      type='time'
                      value={formData.closing_time}
                      onChange={handleInputChange}
                      className='pl-10 bg-background border-border'
                    />
                  </div>
                </div>
              </div>

              <Button type='submit' disabled={saving} className='w-full'>
                {saving ? 'Đang gửi...' : 'Gửi đăng ký'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ClubRegistrationForm;
