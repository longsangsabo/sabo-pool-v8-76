import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, CreditCard, TrendingUp, Users } from 'lucide-react';

const AdminPayments = () => {
  const payments = [
    {
      id: 1,
      user: 'Nguyễn Văn A',
      amount: 100000,
      type: 'Tournament Registration',
      status: 'completed',
      date: '2024-03-15',
      method: 'momo',
    },
    {
      id: 2,
      user: 'Trần Thị B',
      amount: 50000,
      type: 'Challenge Fee',
      status: 'pending',
      date: '2024-03-14',
      method: 'banking',
    },
    {
      id: 3,
      user: 'Lê Văn C',
      amount: 200000,
      type: 'Club Membership',
      status: 'failed',
      date: '2024-03-13',
      method: 'vnpay',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Hoàn thành';
      case 'pending':
        return 'Đang xử lý';
      case 'failed':
        return 'Thất bại';
      default:
        return 'Không xác định';
    }
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-2'>
        <DollarSign className='w-6 h-6 text-blue-600' />
        <h1 className='text-2xl font-bold'>Quản lý thanh toán</h1>
      </div>

      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Tổng doanh thu
            </CardTitle>
            <DollarSign className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>5,240,000₫</div>
            <p className='text-xs text-muted-foreground'>
              +12% so với tháng trước
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Giao dịch hôm nay
            </CardTitle>
            <CreditCard className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>43</div>
            <p className='text-xs text-muted-foreground'>+5 so với hôm qua</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Tỷ lệ thành công
            </CardTitle>
            <TrendingUp className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>94.2%</div>
            <p className='text-xs text-muted-foreground'>
              +2.1% so với tuần trước
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Người dùng thanh toán
            </CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>186</div>
            <p className='text-xs text-muted-foreground'>+8 người dùng mới</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Giao dịch gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {payments.map(payment => (
              <div
                key={payment.id}
                className='flex items-center justify-between p-4 border rounded-lg'
              >
                <div className='flex-1'>
                  <div className='flex items-center gap-2'>
                    <span className='font-medium'>{payment.user}</span>
                    <Badge className={getStatusColor(payment.status)}>
                      {getStatusText(payment.status)}
                    </Badge>
                  </div>
                  <p className='text-sm text-muted-foreground'>
                    {payment.type}
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    {payment.date}
                  </p>
                </div>
                <div className='text-right'>
                  <p className='font-semibold'>
                    {payment.amount.toLocaleString()}₫
                  </p>
                  <p className='text-xs text-muted-foreground capitalize'>
                    {payment.method}
                  </p>
                </div>
                {payment.status === 'pending' && (
                  <div className='ml-4'>
                    <Button size='sm' variant='outline'>
                      Xử lý
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPayments;
