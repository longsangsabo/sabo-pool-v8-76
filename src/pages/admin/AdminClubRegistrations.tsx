import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Building,
  Eye,
  Check,
  X,
  Clock,
  MapPin,
  Phone,
  Users,
  Calendar,
  ExternalLink,
} from 'lucide-react';

interface ClubRegistration {
  id: string;
  owner_id: string;
  name: string;
  address?: string;
  contact_info?: string;
  description?: string;
  status: 'pending' | 'active' | 'rejected';
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    display_name: string;
    full_name: string;
    phone?: string;
  };
}

const AdminClubRegistrations = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<ClubRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegistration, setSelectedRegistration] =
    useState<ClubRegistration | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRegistrations();

    // Set up real-time subscription for club registrations
    console.log('Setting up real-time subscription for club registrations');
    const channel = supabase
      .channel('admin-club-registrations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'clubs',
        },
        payload => {
          console.log('Real-time club registration update:', payload);

          if (payload.eventType === 'INSERT') {
            // Add new registration to the list
            const newRegistration = payload.new as ClubRegistration;
            setRegistrations(prev => [newRegistration, ...prev]);
            toast.info(`Đăng ký CLB mới: ${newRegistration.name}`);
          } else if (payload.eventType === 'UPDATE') {
            // Update existing registration
            const updatedRegistration = payload.new as ClubRegistration;
            setRegistrations(prev =>
              prev.map(reg =>
                reg.id === updatedRegistration.id ? updatedRegistration : reg
              )
            );

            // Show status change notification
            if (payload.old?.status !== payload.new?.status) {
              const statusText =
                payload.new?.status === 'active'
                  ? 'đã duyệt'
                  : payload.new?.status === 'rejected'
                    ? 'bị từ chối'
                    : payload.new?.status;
              toast.success(`CLB "${updatedRegistration.name}" ${statusText}`);
            }
          } else if (payload.eventType === 'DELETE') {
            // Remove registration from list
            const deletedId = payload.old?.id;
            setRegistrations(prev => prev.filter(reg => reg.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up club registrations subscription');
      supabase.removeChannel(channel);
    };
  }, [statusFilter]);

  // Debug effect to check registrations table
  useEffect(() => {
    const debugCheck = async () => {
      console.log('🔍 Checking clubs table...');

      const { data, error, count } = await supabase
        .from('clubs')
        .select('*', { count: 'exact' });

      console.log('Total clubs:', count);
      console.log('Data:', data);
      console.log('Error:', error);
    };

    debugCheck();
  }, []);

  const fetchRegistrations = async () => {
    console.log('🔍 Admin accessing club panel, filtering by:', statusFilter);
    setLoading(true);

    try {
      // Simple query without joins first
      let query = supabase
        .from('clubs')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply status filter - only filter if not 'all'
      if (statusFilter !== 'all') {
        // Map filter values to match clubs table schema
        const mappedFilter =
          statusFilter === 'approved' ? 'active' : statusFilter;
        query = query.eq('status', mappedFilter);
      }

      const { data: clubs, error } = await query;

      if (error) {
        console.error('Club query error:', error);
        toast.error('Không thể tải danh sách CLB: ' + error.message);
        return;
      }

      console.log(
        '📋 Found clubs with filter:',
        statusFilter,
        'Count:',
        clubs?.length || 0
      );
      console.log(
        'Club statuses:',
        clubs?.map(c => c.status)
      );

      // If we have clubs, get user info separately
      let clubsWithUsers = clubs || [];
      if (clubs && clubs.length > 0) {
        const userIds = [
          ...new Set(clubs.map(c => c.owner_id).filter(Boolean)),
        ];

        if (userIds.length > 0) {
          const { data: users, error: usersError } = await supabase
            .from('profiles')
            .select('user_id, display_name, full_name, phone')
            .in('user_id', userIds);

          if (usersError) {
            console.error('Users query error:', usersError);
          } else {
            // Merge user data with clubs
            clubsWithUsers = clubs.map(club => ({
              ...club,
              profiles: users?.find(u => u.user_id === club.owner_id) || null,
            }));
          }
        }
      }

      setRegistrations(
        clubsWithUsers.map(item => ({
          ...item,
          status: item.status as 'pending' | 'active' | 'rejected',
        }))
      );
    } catch (error: any) {
      console.error('Error fetching registrations:', error);
      toast.error('Lỗi khi tải danh sách đăng ký: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const approveRegistration = async (registration: ClubRegistration) => {
    console.log('✅ Starting approval for club:', registration.name);
    setProcessing(true);

    try {
      // First, update the club status to active
      const { error: clubUpdateError } = await supabase
        .from('clubs')
        .update({ status: 'active' })
        .eq('id', registration.id);

      if (clubUpdateError) {
        console.error('❌ Club approval error:', clubUpdateError);
        throw new Error(`Lỗi duyệt câu lạc bộ: ${clubUpdateError.message}`);
      }

      // Create complete club data using the new zero-based function
      const { data: clubCreationResult, error: clubCreationError } =
        await supabase.rpc('create_club_zero_data', {
          p_club_id: registration.id,
          p_user_id: registration.owner_id,
        });

      if (clubCreationError) {
        console.error('❌ Club creation error:', clubCreationError);
        throw new Error(
          `Lỗi tạo dữ liệu câu lạc bộ: ${clubCreationError.message}`
        );
      }

      console.log('✅ Club data created:', clubCreationResult);

      // Send notification to club owner
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: registration.owner_id,
          type: 'club_approved',
          title: 'Câu lạc bộ đã được duyệt!',
          message: `Câu lạc bộ "${registration.name}" của bạn đã được admin duyệt và có thể hoạt động. Chúc mừng!`,
          action_url: `/clubs/${registration.id}`,
        });

      if (notificationError) {
        console.warn('⚠️ Could not send notification:', notificationError);
      }

      console.log('🎉 Club approval completed successfully!');
      toast.success(
        `Đã duyệt thành công câu lạc bộ "${registration.name}"! Chủ CLB đã được thông báo.`
      );

      // Refresh the list to show updated status
      await fetchRegistrations();
      setSelectedRegistration(null);
    } catch (error: any) {
      console.error('💥 Error during club approval:', error);
      toast.error(`Lỗi khi duyệt đăng ký: ${error.message || 'Unknown error'}`);
    } finally {
      setProcessing(false);
    }
  };

  const rejectRegistration = async (registration: ClubRegistration) => {
    if (!rejectionReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }

    console.log(
      '❌ Rejecting club:',
      registration.name,
      'Reason:',
      rejectionReason
    );
    setProcessing(true);

    try {
      // Update status with rejection reason
      const { error } = await supabase
        .from('clubs')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason,
        })
        .eq('id', registration.id);

      if (error) {
        console.error('❌ Rejection error:', error);
        throw new Error(`Lỗi từ chối đăng ký: ${error.message}`);
      }

      // Send notification to club owner about rejection
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: registration.owner_id,
          type: 'club_rejected',
          title: 'Đăng ký câu lạc bộ bị từ chối',
          message: `Đăng ký câu lạc bộ "${registration.name}" đã bị từ chối. Lý do: ${rejectionReason}`,
          action_url: `/clubs/register`,
        });

      if (notificationError) {
        console.warn(
          '⚠️ Could not send rejection notification:',
          notificationError
        );
      }

      console.log('❌ Club rejected successfully:', registration.name);
      toast.success(
        `Đã từ chối đăng ký câu lạc bộ "${registration.name}" và gửi thông báo cho chủ CLB`
      );
      setRejectionReason('');
      await fetchRegistrations();
      setSelectedRegistration(null);
    } catch (error: any) {
      console.error('Error rejecting registration:', error);
      toast.error('Lỗi khi từ chối đăng ký: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className='bg-green-100 text-green-800'>Đã duyệt</Badge>;
      case 'rejected':
        return <Badge className='bg-red-100 text-red-800'>Bị từ chối</Badge>;
      case 'pending':
        return (
          <Badge className='bg-yellow-100 text-yellow-800'>Chờ duyệt</Badge>
        );
      default:
        return (
          <Badge className='bg-gray-100 text-gray-800'>Không xác định</Badge>
        );
    }
  };

  const formatPrice = (price?: number) => {
    if (!price) return 'Chưa đặt';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const getAmenityLabels = (amenities: Record<string, boolean>) => {
    const labels: Record<string, string> = {
      wifi: 'WiFi miễn phí',
      car_parking: 'Chỗ đậu xe ô tô',
      bike_parking: 'Chỗ đậu xe máy',
      canteen: 'Căn tin/Đồ ăn',
      air_conditioning: 'Máy lạnh',
      vip_room: 'Phòng VIP riêng',
      equipment_rental: 'Cho thuê dụng cụ',
      coach: 'Có HLV/Coach',
    };

    return Object.entries(amenities)
      .filter(([_, value]) => value)
      .map(([key, _]) => labels[key])
      .filter(Boolean);
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-2xl font-bold'>Quản lý đăng ký câu lạc bộ</h1>
          <p className='text-gray-600'>
            Xét duyệt các yêu cầu đăng ký câu lạc bộ ({registrations.length}{' '}
            đăng ký)
          </p>
          {statusFilter !== 'all' && (
            <p className='text-sm text-blue-600'>
              Đang lọc:{' '}
              {statusFilter === 'pending'
                ? 'Chờ duyệt'
                : statusFilter === 'approved'
                  ? 'Đã duyệt'
                  : statusFilter === 'rejected'
                    ? 'Bị từ chối'
                    : 'Bản nháp'}
            </p>
          )}
        </div>
        <div className='flex gap-3 items-center'>
          <Button
            onClick={fetchRegistrations}
            variant='outline'
            disabled={loading}
          >
            🔄 Refresh danh sách
          </Button>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className='w-48'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>
                Tất cả ({registrations.length})
              </SelectItem>
              <SelectItem value='pending'>
                Chờ duyệt (
                {registrations.filter(r => r.status === 'pending').length})
              </SelectItem>
              <SelectItem value='approved'>
                Đã duyệt (
                {registrations.filter(r => r.status === 'active').length})
              </SelectItem>
              <SelectItem value='rejected'>
                Bị từ chối (
                {registrations.filter(r => r.status === 'rejected').length})
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Registration List */}
      <div className='grid gap-4'>
        {registrations.length === 0 ? (
          <Card>
            <CardContent className='pt-6 text-center'>
              <Building className='w-12 h-12 mx-auto mb-4 text-gray-400' />
              <p className='text-gray-500'>Không có đăng ký nào</p>
            </CardContent>
          </Card>
        ) : (
          registrations.map(registration => (
            <Card key={registration.id}>
              <CardContent className='pt-6'>
                <div className='flex justify-between items-start'>
                  <div className='flex-1'>
                    <div className='flex items-center gap-2 mb-2'>
                      <Building className='w-5 h-5 text-blue-600' />
                      <h3 className='text-lg font-semibold'>
                        {registration.name}
                      </h3>
                      {getStatusBadge(registration.status)}
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
                      <div className='space-y-2'>
                        <div className='flex items-center gap-2 text-sm'>
                          <MapPin className='w-4 h-4 text-gray-500' />
                          <span>
                            {registration.address || 'Chưa có địa chỉ'}
                          </span>
                        </div>
                        <div className='flex items-center gap-2 text-sm'>
                          <Phone className='w-4 h-4 text-gray-500' />
                          <span>
                            {registration.contact_info ||
                              'Chưa có số điện thoại'}
                          </span>
                        </div>
                        {registration.description && (
                          <div className='flex items-center gap-2 text-sm'>
                            <span className='text-gray-500'>Mô tả:</span>
                            <span>{registration.description}</span>
                          </div>
                        )}
                      </div>

                      <div className='space-y-2'>
                        <div className='flex items-center gap-2 text-sm'>
                          <Calendar className='w-4 h-4 text-gray-500' />
                          <span>
                            {new Date(
                              registration.created_at
                            ).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                        <div className='text-sm'>
                          <span className='font-medium'>Người đăng ký:</span>{' '}
                          {registration.profiles?.display_name ||
                            registration.profiles?.full_name ||
                            'Chưa có thông tin'}
                        </div>
                        {registration.profiles?.phone && (
                          <div className='text-sm'>
                            <span className='font-medium'>SĐT:</span>{' '}
                            {registration.profiles.phone}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className='flex gap-2'>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() =>
                              setSelectedRegistration(registration)
                            }
                          >
                            <Eye className='w-4 h-4 mr-2' />
                            Xem chi tiết
                          </Button>
                        </DialogTrigger>
                        <DialogContent className='max-w-4xl max-h-[80vh] overflow-y-auto'>
                          <DialogHeader>
                            <DialogTitle className='flex items-center gap-2'>
                              <Building className='w-5 h-5' />
                              {registration.name}
                              {getStatusBadge(registration.status)}
                            </DialogTitle>
                          </DialogHeader>

                          {selectedRegistration && (
                            <div className='space-y-6'>
                              {/* Basic Info */}
                              <div>
                                <h4 className='font-semibold mb-3'>
                                  Thông tin cơ bản
                                </h4>
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                  <div>
                                    <label className='text-sm font-medium text-gray-700'>
                                      Tên câu lạc bộ
                                    </label>
                                    <p className='text-sm'>
                                      {selectedRegistration.name}
                                    </p>
                                  </div>
                                  <div>
                                    <label className='text-sm font-medium text-gray-700'>
                                      Số điện thoại
                                    </label>
                                    <p className='text-sm'>
                                      {selectedRegistration.contact_info ||
                                        'Chưa có'}
                                    </p>
                                  </div>
                                  <div className='md:col-span-2'>
                                    <label className='text-sm font-medium text-gray-700'>
                                      Địa chỉ
                                    </label>
                                    <p className='text-sm'>
                                      {selectedRegistration.address ||
                                        'Chưa có'}
                                    </p>
                                  </div>
                                  {selectedRegistration.description && (
                                    <div className='md:col-span-2'>
                                      <label className='text-sm font-medium text-gray-700'>
                                        Mô tả
                                      </label>
                                      <p className='text-sm'>
                                        {selectedRegistration.description}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Action Buttons */}
                              {selectedRegistration.status === 'pending' && (
                                <div className='space-y-4 pt-4 border-t'>
                                  <div className='flex gap-4'>
                                    <Button
                                      onClick={() =>
                                        approveRegistration(
                                          selectedRegistration
                                        )
                                      }
                                      disabled={processing}
                                      className='bg-green-600 hover:bg-green-700'
                                    >
                                      <Check className='w-4 h-4 mr-2' />
                                      {processing
                                        ? 'Đang duyệt...'
                                        : 'Duyệt đăng ký'}
                                    </Button>
                                    <Button
                                      variant='destructive'
                                      onClick={() =>
                                        rejectRegistration(selectedRegistration)
                                      }
                                      disabled={
                                        processing || !rejectionReason.trim()
                                      }
                                    >
                                      <X className='w-4 h-4 mr-2' />
                                      {processing
                                        ? 'Đang từ chối...'
                                        : 'Từ chối'}
                                    </Button>
                                  </div>
                                  <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                      Lý do từ chối (bắt buộc nếu từ chối)
                                    </label>
                                    <Textarea
                                      value={rejectionReason}
                                      onChange={e =>
                                        setRejectionReason(e.target.value)
                                      }
                                      placeholder='Nhập lý do từ chối...'
                                      className='min-h-[80px]'
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Rejection Reason */}
                              {selectedRegistration.status === 'rejected' &&
                                selectedRegistration.rejection_reason && (
                                  <div className='p-4 bg-red-50 rounded-lg'>
                                    <h4 className='font-semibold text-red-900 mb-2'>
                                      Lý do từ chối:
                                    </h4>
                                    <p className='text-red-800 text-sm'>
                                      {selectedRegistration.rejection_reason}
                                    </p>
                                  </div>
                                )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      {registration.status === 'pending' && (
                        <>
                          <Button
                            size='sm'
                            onClick={() => approveRegistration(registration)}
                            disabled={processing}
                            className='bg-green-600 hover:bg-green-700'
                          >
                            <Check className='w-4 h-4 mr-2' />
                            Duyệt
                          </Button>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size='sm' variant='destructive'>
                                <X className='w-4 h-4 mr-2' />
                                Từ chối
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Từ chối đăng ký</DialogTitle>
                              </DialogHeader>
                              <div className='space-y-4'>
                                <p>
                                  Bạn có chắc chắn muốn từ chối đăng ký câu lạc
                                  bộ "{registration.name}"?
                                </p>
                                <div>
                                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                                    Lý do từ chối *
                                  </label>
                                  <Textarea
                                    value={rejectionReason}
                                    onChange={e =>
                                      setRejectionReason(e.target.value)
                                    }
                                    placeholder='Nhập lý do từ chối...'
                                    className='min-h-[80px]'
                                  />
                                </div>
                                <div className='flex gap-2 justify-end'>
                                  <Button
                                    variant='destructive'
                                    onClick={() =>
                                      rejectRegistration(registration)
                                    }
                                    disabled={
                                      processing || !rejectionReason.trim()
                                    }
                                  >
                                    {processing ? 'Đang từ chối...' : 'Từ chối'}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminClubRegistrations;
