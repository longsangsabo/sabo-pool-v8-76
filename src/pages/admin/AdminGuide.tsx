import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Users, Video, FileText } from 'lucide-react';

const AdminGuide = () => {
  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-2'>
        <BookOpen className='h-6 w-6' />
        <h1 className='text-3xl font-bold'>Hướng Dẫn & Tài Liệu</h1>
      </div>

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Tài Liệu Hướng Dẫn
            </CardTitle>
            <FileText className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>25</div>
            <p className='text-xs text-muted-foreground'>Tài liệu có sẵn</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Video Hướng Dẫn
            </CardTitle>
            <Video className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>12</div>
            <p className='text-xs text-muted-foreground'>Video tutorials</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Lượt Xem</CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>1,234</div>
            <p className='text-xs text-muted-foreground'>Tổng lượt xem</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Cập Nhật Gần Đây
            </CardTitle>
            <BookOpen className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>3</div>
            <p className='text-xs text-muted-foreground'>Tuần này</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quản Lý Nội Dung Hướng Dẫn</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground'>
            Công cụ quản lý tài liệu và video hướng dẫn sẽ hiển thị ở đây.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminGuide;
