import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

const SimpleRankVerificationMock = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <AlertTriangle className='w-5 h-5 text-yellow-500' />
          Xác thực hạng đơn giản
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className='text-muted-foreground'>
          Tính năng xác thực hạng đơn giản đang được phát triển. Vui lòng quay
          lại sau.
        </p>
      </CardContent>
    </Card>
  );
};

export default SimpleRankVerificationMock;
