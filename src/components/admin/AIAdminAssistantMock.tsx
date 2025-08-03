import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

const AIAdminAssistantMock = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <AlertTriangle className='w-5 h-5 text-yellow-500' />
          AI Admin Assistant
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className='text-muted-foreground'>
          AI Admin Assistant đang được phát triển. Vui lòng quay lại sau.
        </p>
      </CardContent>
    </Card>
  );
};

export default AIAdminAssistantMock;
