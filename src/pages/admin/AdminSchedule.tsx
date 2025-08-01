import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, Users, MapPin } from 'lucide-react';

const AdminSchedule = () => {
  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-2'>
        <Calendar className='w-6 h-6 text-blue-600' />
        <h1 className='text-2xl font-bold'>Quản lý lịch trình</h1>
      </div>

      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Sự kiện hôm nay
            </CardTitle>
            <Clock className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>8</div>
            <p className='text-xs text-muted-foreground'>+2 so với hôm qua</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Giải đấu sắp tới
            </CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>12</div>
            <p className='text-xs text-muted-foreground'>Trong 7 ngày tới</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Địa điểm</CardTitle>
            <MapPin className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>5</div>
            <p className='text-xs text-muted-foreground'>Địa điểm đã đặt</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lịch trình chi tiết</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <div className='flex items-center justify-between p-4 border rounded-lg'>
              <div>
                <h3 className='font-semibold'>Giải đấu Cờ Tướng Mùa Xuân</h3>
                <p className='text-sm text-muted-foreground'>
                  15/03/2024 - 09:00 AM
                </p>
              </div>
              <div className='text-right'>
                <p className='text-sm font-medium'>Trung tâm Cờ Tướng</p>
                <p className='text-xs text-muted-foreground'>64 thí sinh</p>
              </div>
            </div>

            <div className='flex items-center justify-between p-4 border rounded-lg'>
              <div>
                <h3 className='font-semibold'>Thách đấu Cấp Cao</h3>
                <p className='text-sm text-muted-foreground'>
                  16/03/2024 - 14:00 PM
                </p>
              </div>
              <div className='text-right'>
                <p className='text-sm font-medium'>CLB Đại Việt</p>
                <p className='text-xs text-muted-foreground'>16 thí sinh</p>
              </div>
            </div>

            <div className='flex items-center justify-between p-4 border rounded-lg'>
              <div>
                <h3 className='font-semibold'>Giải Thiếu Nhi</h3>
                <p className='text-sm text-muted-foreground'>
                  17/03/2024 - 10:00 AM
                </p>
              </div>
              <div className='text-right'>
                <p className='text-sm font-medium'>Nhà Thiếu Nhi</p>
                <p className='text-xs text-muted-foreground'>32 thí sinh</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSchedule;
