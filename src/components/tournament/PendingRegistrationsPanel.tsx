import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PendingRegistrationsPanelProps {
  tournamentId: string;
}

export const PendingRegistrationsPanel: React.FC<
  PendingRegistrationsPanelProps
> = ({ tournamentId }) => {
  const [pendingRegistrations, setPendingRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingRegistrations();
  }, [tournamentId]);

  const loadPendingRegistrations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tournament_registrations')
        .select(
          `
          id, 
          registration_date, 
          entry_fee,
          notes,
          profiles:user_id (
            full_name,
            phone,
            email
          )
        `
        )
        .eq('tournament_id', tournamentId)
        .eq('registration_status', 'pending')
        .order('registration_date');

      if (error) throw error;
      setPendingRegistrations(data || []);
    } catch (error) {
      console.error('Error loading pending registrations:', error);
      toast.error('Không thể tải danh sách đăng ký chờ xác nhận');
    } finally {
      setLoading(false);
    }
  };

  const confirmRegistration = async (registrationId: string) => {
    try {
      const { error } = await supabase
        .from('tournament_registrations')
        .update({
          registration_status: 'confirmed',
          payment_status: 'completed',
          confirmed_at: new Date().toISOString(),
        })
        .eq('id', registrationId);

      if (error) throw error;

      toast.success('Đã xác nhận đăng ký!');
      loadPendingRegistrations();
    } catch (error: any) {
      toast.error('Lỗi xác nhận: ' + error.message);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
        <div className='animate-pulse'>
          <div className='h-4 bg-yellow-200 rounded w-1/3 mb-3'></div>
          <div className='space-y-2'>
            <div className='h-16 bg-yellow-100 rounded'></div>
            <div className='h-16 bg-yellow-100 rounded'></div>
          </div>
        </div>
      </div>
    );
  }

  if (pendingRegistrations.length === 0) {
    return (
      <div className='bg-gray-50 border border-gray-200 rounded-lg p-4'>
        <h3 className='font-semibold text-gray-700 mb-2'>
          ⏳ Đăng ký chờ xác nhận (0)
        </h3>
        <p className='text-sm text-gray-600'>
          Không có đăng ký nào đang chờ xác nhận
        </p>
      </div>
    );
  }

  return (
    <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
      <h3 className='font-semibold text-yellow-900 mb-3'>
        ⏳ Đăng ký chờ xác nhận ({pendingRegistrations.length})
      </h3>

      <div className='space-y-2'>
        {pendingRegistrations.map(registration => (
          <div
            key={registration.id}
            className='bg-white p-3 rounded border flex items-center justify-between'
          >
            <div className='flex-1'>
              <h4 className='font-medium'>
                {registration.profiles?.full_name || 'Không có tên'}
              </h4>
              <div className='text-sm text-gray-600'>
                📞 {registration.profiles?.phone || 'Chưa có SĐT'} • 💰{' '}
                {registration.entry_fee?.toLocaleString('vi-VN') || '0'} VNĐ •
                📅 {formatDate(registration.registration_date)}
              </div>
              {registration.notes && (
                <div className='text-xs text-gray-500 mt-1'>
                  💬 {registration.notes}
                </div>
              )}
            </div>

            <Button
              size='sm'
              onClick={() => confirmRegistration(registration.id)}
              className='bg-green-600 hover:bg-green-700 ml-2'
            >
              ✅ Xác nhận
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
