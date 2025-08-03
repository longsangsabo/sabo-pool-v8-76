import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Phone, Shield, Users } from 'lucide-react';

const AdminEmergency = () => {
  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-2'>
        <AlertTriangle className='h-6 w-6 text-destructive' />
        <h1 className='text-3xl font-bold'>Quản Lý Khẩn Cấp</h1>
      </div>

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card className='border-destructive'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Cảnh Báo Hoạt Động
            </CardTitle>
            <AlertTriangle className='h-4 w-4 text-destructive' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-destructive'>3</div>
            <p className='text-xs text-muted-foreground'>Cần xử lý ngay</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Hỗ Trợ Khẩn Cấp
            </CardTitle>
            <Phone className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>7</div>
            <p className='text-xs text-muted-foreground'>Cuộc gọi hôm nay</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Tài Khoản Bị Khóa
            </CardTitle>
            <Shield className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>12</div>
            <p className='text-xs text-muted-foreground'>Chờ xem xét</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Báo Cáo Vi Phạm
            </CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>5</div>
            <p className='text-xs text-muted-foreground'>Chưa xử lý</p>
          </CardContent>
        </Card>
      </div>

      <Card className='border-destructive'>
        <CardHeader>
          <CardTitle className='text-destructive'>
            Tình Huống Khẩn Cấp
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground'>
            Các tình huống khẩn cấp và hành động cần thiết sẽ hiển thị ở đây.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminEmergency;
