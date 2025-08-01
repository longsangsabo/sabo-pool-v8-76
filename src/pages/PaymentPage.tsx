import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Wallet,
  Plus,
  ArrowUpDown,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { toast } from 'sonner';

const PaymentPage = () => {
  const [walletBalance] = useState(150000);

  const transactions = [
    {
      id: '1',
      type: 'deposit',
      description: 'Nạp tiền qua VNPay',
      amount: 100000,
      date: '2024-01-15',
    },
    {
      id: '2',
      type: 'withdraw',
      description: 'Tham gia giải đấu',
      amount: 50000,
      date: '2024-01-14',
    },
  ];

  const handleDepositSuccess = () => {
    toast.success('Nạp tiền thành công!');
  };

  const handlePaymentSuccess = () => {
    toast.success('Nâng cấp gói thành công!');
  };

  return (
    <div className='container mx-auto py-6 space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Wallet className='h-5 w-5' />
            Ví của tôi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-center space-y-4'>
            <div className='text-3xl font-bold text-primary'>
              {walletBalance.toLocaleString()} VNĐ
            </div>
            <p className='text-muted-foreground'>Số dư hiện tại</p>

            <div className='flex gap-2'>
              <Button className='flex-1' onClick={handleDepositSuccess}>
                <Plus className='h-4 w-4 mr-2' />
                Nạp tiền
              </Button>

              <Button variant='outline' className='flex-1'>
                <ArrowUpDown className='h-4 w-4 mr-2' />
                Chuyển khoản
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lịch sử giao dịch</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {transactions.map(transaction => (
            <div
              key={transaction.id}
              className='flex items-center justify-between p-4 border rounded-lg'
            >
              <div className='flex items-center gap-3'>
                <div
                  className={`p-2 rounded-full ${
                    transaction.type === 'deposit'
                      ? 'bg-green-100 text-green-600'
                      : 'bg-red-100 text-red-600'
                  }`}
                >
                  {transaction.type === 'deposit' ? (
                    <ArrowDownLeft className='h-4 w-4' />
                  ) : (
                    <ArrowUpRight className='h-4 w-4' />
                  )}
                </div>
                <div>
                  <p className='font-medium'>{transaction.description}</p>
                  <p className='text-sm text-muted-foreground'>
                    {new Date(transaction.date).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              </div>
              <div
                className={`font-bold ${
                  transaction.type === 'deposit'
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {transaction.type === 'deposit' ? '+' : '-'}
                {transaction.amount.toLocaleString()} VNĐ
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gói thành viên</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid gap-4'>
            <div className='border rounded-lg p-4'>
              <div className='flex justify-between items-center mb-2'>
                <h3 className='font-semibold'>Gói Cơ Bản</h3>
                <span className='text-xl font-bold'>Miễn phí</span>
              </div>
              <ul className='text-sm text-muted-foreground space-y-1'>
                <li>• Tham gia giải đấu cơ bản</li>
                <li>• Tạo thách đấu (giới hạn 5/tháng)</li>
                <li>• Hỗ trợ cơ bản</li>
              </ul>
              <Button variant='outline' className='w-full mt-3' disabled>
                Gói hiện tại
              </Button>
            </div>

            <div className='border-2 border-primary rounded-lg p-4 relative'>
              <div className='absolute -top-2 left-4 bg-primary text-primary-foreground px-2 py-1 text-xs rounded'>
                Phổ biến
              </div>
              <div className='flex justify-between items-center mb-2'>
                <h3 className='font-semibold'>Gói Pro</h3>
                <span className='text-xl font-bold'>99.000đ/tháng</span>
              </div>
              <ul className='text-sm text-muted-foreground space-y-1'>
                <li>• Tham gia tất cả giải đấu</li>
                <li>• Tạo thách đấu không giới hạn</li>
                <li>• Phân tích chi tiết</li>
                <li>• Hỗ trợ ưu tiên</li>
              </ul>
              <Button className='w-full mt-3' onClick={handlePaymentSuccess}>
                Nâng cấp ngay
              </Button>
            </div>

            <div className='border rounded-lg p-4'>
              <div className='flex justify-between items-center mb-2'>
                <h3 className='font-semibold'>Gói Elite</h3>
                <span className='text-xl font-bold'>199.000đ/tháng</span>
              </div>
              <ul className='text-sm text-muted-foreground space-y-1'>
                <li>• Tất cả tính năng Pro</li>
                <li>• Tạo giải đấu riêng</li>
                <li>• Quản lý đội nhóm</li>
                <li>• Hỗ trợ 24/7</li>
              </ul>
              <Button
                variant='outline'
                className='w-full mt-3'
                onClick={handlePaymentSuccess}
              >
                Nâng cấp
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentPage;
