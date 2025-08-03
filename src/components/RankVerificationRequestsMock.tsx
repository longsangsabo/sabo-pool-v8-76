import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

const RankVerificationRequestsMock = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <AlertTriangle className='w-5 h-5 text-yellow-500' />
          Yêu cầu xác thực hạng
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className='text-muted-foreground'>
          Tính năng quản lý yêu cầu xác thực hạng đang được phát triển. Vui lòng
          quay lại sau.
        </p>
      </CardContent>
    </Card>
  );
};

export default RankVerificationRequestsMock;
