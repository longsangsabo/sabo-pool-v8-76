import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DepositModal = ({ isOpen, onClose, onSuccess }: DepositModalProps) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('vnpay');
  const [loading, setLoading] = useState(false);

  const quickAmounts = [50000, 100000, 200000, 500000, 1000000, 2000000];

  const handleDeposit = async () => {
    if (!amount || parseInt(amount) < 10000) {
      toast.error('Số tiền nạp tối thiểu là 10,000 VNĐ');
      return;
    }

    if (parseInt(amount) > 50000000) {
      toast.error('Số tiền nạp tối đa là 50,000,000 VNĐ');
      return;
    }

    setLoading(true);
    try {
      // Tạo URL thanh toán thông qua Edge Function
      const { data, error } = await supabase.functions.invoke(
        'create-payment',
        {
          body: {
            userId: user?.id,
            amount: parseInt(amount),
            type: 'wallet_deposit',
            paymentMethod,
            description: `Nạp tiền vào ví - ${parseInt(amount).toLocaleString('vi-VN')} VNĐ`,
          },
        }
      );

      if (error) throw error;

      if (data?.paymentUrl) {
        // Chuyển hướng đến trang thanh toán
        window.location.href = data.paymentUrl;
      } else {
        toast.error('Không thể tạo link thanh toán');
      }
    } catch (error) {
      console.error('Error creating deposit:', error);
      toast.error('Có lỗi xảy ra khi tạo giao dịch');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setAmount('');
    setPaymentMethod('vnpay');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>Nạp tiền vào ví</DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Amount Input */}
          <div>
            <Label htmlFor='amount'>Số tiền nạp (VNĐ)</Label>
            <Input
              id='amount'
              type='number'
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder='Nhập số tiền'
              min='10000'
              max='50000000'
            />
            <p className='text-xs text-gray-500 mt-1'>
              Tối thiểu 10,000 VNĐ - Tối đa 50,000,000 VNĐ
            </p>
          </div>

          {/* Quick Amount Buttons */}
          <div>
            <Label>Chọn nhanh:</Label>
            <div className='grid grid-cols-3 gap-2 mt-2'>
              {quickAmounts.map(quickAmount => (
                <Button
                  key={quickAmount}
                  variant='outline'
                  size='sm'
                  onClick={() => setAmount(quickAmount.toString())}
                  className='text-xs'
                >
                  {quickAmount.toLocaleString('vi-VN')}
                </Button>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <Label>Phương thức thanh toán</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='vnpay'>VNPay</SelectItem>
                <SelectItem value='momo'>MoMo</SelectItem>
                <SelectItem value='zalopay'>ZaloPay</SelectItem>
                <SelectItem value='bank_transfer'>
                  Chuyển khoản ngân hàng
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Total Display */}
          {amount && parseInt(amount) >= 10000 && (
            <div className='bg-blue-50 p-4 rounded-md'>
              <div className='flex justify-between items-center'>
                <span className='text-sm text-gray-600'>Số tiền nạp:</span>
                <span className='text-lg font-semibold text-blue-600'>
                  {parseInt(amount || '0').toLocaleString('vi-VN')} VNĐ
                </span>
              </div>
              <div className='flex justify-between items-center mt-1'>
                <span className='text-xs text-gray-500'>Phí giao dịch:</span>
                <span className='text-xs text-gray-500'>Miễn phí</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className='flex space-x-3 pt-4'>
            <Button
              variant='outline'
              onClick={() => {
                handleReset();
                onClose();
              }}
              className='flex-1'
            >
              Hủy
            </Button>
            <Button
              onClick={handleDeposit}
              disabled={loading || !amount || parseInt(amount) < 10000}
              className='flex-1'
            >
              {loading ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Đang xử lý...
                </>
              ) : (
                'Nạp tiền'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DepositModal;
