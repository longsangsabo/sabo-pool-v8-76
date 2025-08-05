import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, PieChart, FileText } from 'lucide-react';

const AdminReports = () => {
  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-2'>
        <BarChart3 className='h-6 w-6' />
        <h1 className='text-3xl font-bold'>Báo Cáo & Thống Kê</h1>
      </div>

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Báo Cáo Tháng</CardTitle>
            <FileText className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>15</div>
            <p className='text-xs text-muted-foreground'>Báo cáo đã tạo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Doanh Thu</CardTitle>
            <TrendingUp className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>125M</div>
            <p className='text-xs text-muted-foreground'>VNĐ tháng này</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Người Dùng Hoạt Động
            </CardTitle>
            <PieChart className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>2,345</div>
            <p className='text-xs text-muted-foreground'>
              +12% so với tháng trước
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Tỷ Lệ Chuyển Đổi
            </CardTitle>
            <BarChart3 className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>15.2%</div>
            <p className='text-xs text-muted-foreground'>+2.1% từ tuần trước</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Báo Cáo Chi Tiết</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground'>
            Các biểu đồ và báo cáo chi tiết sẽ hiển thị ở đây.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminReports;
