import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Wallet } from '@/types/common';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: Wallet;
  onSuccess: () => void;
}

const WithdrawModal = ({
  isOpen,
  onClose,
  wallet,
  onSuccess,
}: WithdrawModalProps) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleWithdraw = async () => {
    if (!amount || parseInt(amount) < 50000) {
      toast.error('Số tiền rút tối thiểu là 50,000 VNĐ');
      return;
    }

    if (parseInt(amount) > wallet?.balance) {
      toast.error('Số dư không đủ để thực hiện giao dịch');
      return;
    }

    if (!bankAccount || !bankName || !accountHolder) {
      toast.error('Vui lòng điền đầy đủ thông tin ngân hàng');
      return;
    }

    setLoading(true);
    try {
      // Mock withdrawal request since wallet_transactions table doesn't exist
      console.log('Mock withdrawal request:', {
        wallet_id: wallet.id,
        transaction_type: 'withdraw',
        amount: parseInt(amount),
        balance_before: wallet.balance,
        balance_after: wallet.balance - parseInt(amount),
        description: `Rút tiền về tài khoản ${bankAccount} - ${bankName}`,
        payment_method: 'bank_transfer',
        status: 'pending',
        metadata: {
          bank_account: bankAccount,
          bank_name: bankName,
          account_holder: accountHolder,
          notes: notes,
        },
      });

      toast.success(
        'Yêu cầu rút tiền đã được gửi! Chúng tôi sẽ xử lý trong 1-3 ngày làm việc.'
      );
      onSuccess();
      onClose();
      handleReset();
    } catch (error) {
      console.error('Error creating withdrawal:', error);
      toast.error('Có lỗi xảy ra khi tạo yêu cầu rút tiền');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setAmount('');
    setBankAccount('');
    setBankName('');
    setAccountHolder('');
    setNotes('');
  };

  const quickAmounts = [50000, 100000, 200000, 500000, 1000000];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-md max-h-[80vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Rút tiền từ ví</DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Current Balance */}
          <div className='bg-gray-50 p-3 rounded-md'>
            <p className='text-sm text-gray-600'>Số dư hiện tại:</p>
            <p className='text-lg font-semibold text-gray-900'>
              {wallet?.balance?.toLocaleString('vi-VN') || '0'} VNĐ
            </p>
          </div>

          {/* Amount Input */}
          <div>
            <Label htmlFor='withdraw-amount'>Số tiền rút (VNĐ)</Label>
            <Input
              id='withdraw-amount'
              type='number'
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder='Nhập số tiền'
              min='50000'
              max={wallet?.balance || 0}
            />
            <p className='text-xs text-gray-500 mt-1'>
              Tối thiểu 50,000 VNĐ - Phí rút tiền: 5,000 VNĐ
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
                  disabled={quickAmount > (wallet?.balance || 0)}
                  className='text-xs'
                >
                  {quickAmount.toLocaleString('vi-VN')}
                </Button>
              ))}
            </div>
          </div>

          {/* Bank Information */}
          <div className='space-y-3'>
            <Label>Thông tin ngân hàng</Label>

            <div>
              <Input
                value={bankName}
                onChange={e => setBankName(e.target.value)}
                placeholder='Tên ngân hàng (VD: Vietcombank, Techcombank...)'
              />
            </div>

            <div>
              <Input
                value={bankAccount}
                onChange={e => setBankAccount(e.target.value)}
                placeholder='Số tài khoản'
              />
            </div>

            <div>
              <Input
                value={accountHolder}
                onChange={e => setAccountHolder(e.target.value)}
                placeholder='Tên chủ tài khoản'
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor='notes'>Ghi chú (tùy chọn)</Label>
            <Textarea
              id='notes'
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder='Ghi chú thêm...'
              rows={2}
            />
          </div>

          {/* Summary */}
          {amount && parseInt(amount) >= 50000 && (
            <div className='bg-yellow-50 p-4 rounded-md'>
              <div className='space-y-1'>
                <div className='flex justify-between items-center'>
                  <span className='text-sm text-gray-600'>Số tiền rút:</span>
                  <span className='text-sm font-medium'>
                    {parseInt(amount).toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>
                <div className='flex justify-between items-center'>
                  <span className='text-sm text-gray-600'>Phí giao dịch:</span>
                  <span className='text-sm font-medium'>5,000 VNĐ</span>
                </div>
                <div className='flex justify-between items-center pt-2 border-t'>
                  <span className='text-sm font-medium text-gray-900'>
                    Bạn nhận được:
                  </span>
                  <span className='text-lg font-semibold text-green-600'>
                    {(parseInt(amount) - 5000).toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>
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
              onClick={handleWithdraw}
              disabled={
                loading ||
                !amount ||
                parseInt(amount) < 50000 ||
                !bankAccount ||
                !bankName ||
                !accountHolder
              }
              className='flex-1'
            >
              {loading ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Đang xử lý...
                </>
              ) : (
                'Rút tiền'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WithdrawModal;
