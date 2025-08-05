import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Users, CheckCircle, XCircle } from 'lucide-react';

const AdminRankVerification = () => {
  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-2'>
        <Shield className='h-6 w-6' />
        <h1 className='text-3xl font-bold'>Xác Thực Rank</h1>
      </div>

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Chờ Xác Thực</CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>12</div>
            <p className='text-xs text-muted-foreground'>+2 từ hôm qua</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Đã Xác Thực</CardTitle>
            <CheckCircle className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>156</div>
            <p className='text-xs text-muted-foreground'>+15 tuần này</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Từ Chối</CardTitle>
            <XCircle className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>8</div>
            <p className='text-xs text-muted-foreground'>-2 từ tuần trước</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Tổng Cộng</CardTitle>
            <Shield className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>176</div>
            <p className='text-xs text-muted-foreground'>Tất cả yêu cầu</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Yêu Cầu Xác Thực Gần Đây</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground'>
            Danh sách yêu cầu xác thực rank sẽ hiển thị ở đây.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRankVerification;
