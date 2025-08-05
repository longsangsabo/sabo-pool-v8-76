import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

const RankRegistrationMock = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <AlertCircle className='w-5 h-5 text-orange-500' />
          Tính năng đăng ký xác nhận hạng
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className='text-muted-foreground'>
          Tính năng xác nhận hạng tại CLB đang được phát triển và sẽ sớm có mặt.
          Hiện tại bạn có thể tham gia các giải đấu và thách đấu để tích lũy
          kinh nghiệm.
        </p>
      </CardContent>
    </Card>
  );
};

export default RankRegistrationMock;
