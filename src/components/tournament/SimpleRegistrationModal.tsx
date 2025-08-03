import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface SimpleRegistrationModalProps {
  tournament: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SimpleRegistrationModal: React.FC<
  SimpleRegistrationModalProps
> = ({ tournament, isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [registering, setRegistering] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCashRegistration = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để đăng ký');
      return;
    }

    setRegistering(true);

    try {
      console.log(
        '💵 Processing cash registration for tournament:',
        tournament.id
      );

      // Check if user is already registered
      const { data: existingRegistration, error: checkError } = await supabase
        .from('tournament_registrations')
        .select('*')
        .eq('tournament_id', tournament.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing registration:', checkError);
        throw checkError;
      }

      if (existingRegistration) {
        toast.success('Bạn đã đăng ký giải đấu này rồi!');
        onSuccess();
        onClose();
        return;
      }

      // Create registration with pending status
      const registrationData = {
        tournament_id: tournament.id,
        user_id: user.id,
        registration_status: 'pending', // ← Đợi xác nhận
        payment_method: 'cash',
        payment_status: 'pending', // ← Chưa thanh toán
        entry_fee: tournament.entry_fee,
        registration_date: new Date().toISOString(),
        notes: 'Thanh toán tiền mặt - đợi xác nhận từ CLB',
      };

      const { data, error } = await supabase
        .from('tournament_registrations')
        .insert([registrationData])
        .select()
        .single();

      if (error) {
        // Handle duplicate key error specifically
        if (error.code === '23505') {
          toast.success('Bạn đã đăng ký giải đấu này rồi!');
          onSuccess();
          onClose();
          return;
        }
        throw error;
      }

      console.log('✅ Registration created:', data);

      toast.success(
        'Đăng ký thành công! CLB sẽ xác nhận sau khi bạn thanh toán tiền mặt.',
        { duration: 5000 }
      );

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      toast.error('Lỗi đăng ký: ' + error.message);
    } finally {
      setRegistering(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>🏆 Đăng ký tham gia</DialogTitle>
          <DialogDescription>
            Giải đấu: <strong>{tournament.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Tournament Info */}
          <div className='bg-blue-50 p-4 rounded-lg'>
            <h3 className='font-medium text-blue-900 mb-2'>
              Thông tin giải đấu
            </h3>
            <div className='space-y-1 text-sm text-blue-800'>
              <div>📅 Bắt đầu: {formatDate(tournament.tournament_start)}</div>
              <div>
                📍 Địa điểm: {tournament.location || 'Chưa có thông tin'}
              </div>
              <div>
                💰 Phí tham gia:{' '}
                {tournament.entry_fee?.toLocaleString('vi-VN') || '0'} VNĐ
              </div>
              <div>
                👥 Số người: {tournament.current_participants || 0}/
                {tournament.max_participants}
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className='bg-yellow-50 p-4 rounded-lg border border-yellow-200'>
            <h3 className='font-medium text-yellow-900 mb-2 flex items-center'>
              💵 Thanh toán tiền mặt
            </h3>
            <div className='text-sm text-yellow-800 space-y-2'>
              <p>• Bạn sẽ thanh toán tiền mặt trực tiếp tại CLB</p>
              <p>• CLB sẽ xác nhận sau khi nhận được thanh toán</p>
              <p>• Trạng thái sẽ chuyển từ "Đợi xác nhận" → "Đã xác nhận"</p>
            </div>
          </div>

          {/* Terms */}
          <div className='text-xs text-gray-600 bg-gray-50 p-3 rounded'>
            <p className='font-medium mb-1'>Lưu ý:</p>
            <p>• Đăng ký có thể bị hủy nếu không thanh toán trong thời hạn</p>
            <p>• Vui lòng liên hệ CLB để biết thông tin thanh toán chi tiết</p>
          </div>
        </div>

        <div className='flex gap-3 pt-4'>
          <Button
            variant='outline'
            onClick={onClose}
            disabled={registering}
            className='flex-1'
          >
            Hủy
          </Button>
          <Button
            onClick={handleCashRegistration}
            disabled={registering}
            className='flex-1 bg-green-600 hover:bg-green-700'
          >
            {registering ? (
              <>
                <span className='animate-spin mr-2'>⏳</span>
                Đang đăng ký...
              </>
            ) : (
              <>💵 Đăng ký ngay</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
