import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface GenericFallbackProps {
  error: Error;
  retry: () => void;
}

export const GenericFallback: React.FC<GenericFallbackProps> = ({
  error,
  retry,
}) => {
  return (
    <div className='min-h-[400px] flex items-center justify-center p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <div className='flex justify-center mb-4'>
            <AlertTriangle className='h-8 w-8 text-destructive' />
          </div>
          <CardTitle>Đã xảy ra lỗi</CardTitle>
        </CardHeader>
        <CardContent className='text-center space-y-4'>
          <p className='text-muted-foreground'>
            Ứng dụng đã gặp lỗi không mong muốn. Vui lòng thử lại.
          </p>

          {process.env.NODE_ENV === 'development' && (
            <details className='text-left text-xs'>
              <summary className='cursor-pointer font-medium'>
                Chi tiết lỗi
              </summary>
              <pre className='mt-2 p-2 bg-muted rounded overflow-auto'>
                {error.toString()}
              </pre>
            </details>
          )}

          <div className='flex gap-2 justify-center'>
            <Button onClick={retry} size='sm' className='gap-2'>
              <RefreshCw className='h-4 w-4' />
              Thử lại
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => (window.location.href = '/')}
            >
              Về trang chủ
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
