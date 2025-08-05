import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetErrorBoundary,
}) => {
  const isAuthError =
    error.message.includes('useAuth') || error.message.includes('AuthProvider');

  return (
    <div className='min-h-screen flex items-center justify-center bg-background p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10'>
            <AlertTriangle className='h-6 w-6 text-destructive' />
          </div>
          <CardTitle className='text-xl'>
            {isAuthError ? 'Lỗi Xác Thực' : 'Có Lỗi Xảy Ra'}
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='text-center text-sm text-muted-foreground'>
            {isAuthError ? (
              <p>
                Có lỗi trong hệ thống xác thực. Vui lòng tải lại trang để khắc
                phục.
              </p>
            ) : (
              <p>Ứng dụng đã gặp lỗi không mong muốn. Vui lòng thử lại.</p>
            )}
          </div>

          {process.env.NODE_ENV === 'development' && (
            <details className='text-xs text-muted-foreground'>
              <summary className='cursor-pointer hover:text-foreground'>
                Chi tiết lỗi (Development)
              </summary>
              <pre className='mt-2 whitespace-pre-wrap break-all bg-muted p-2 rounded'>
                {error.message}
              </pre>
            </details>
          )}

          <div className='flex gap-2'>
            <Button onClick={resetErrorBoundary} className='flex-1'>
              <RefreshCw className='h-4 w-4 mr-2' />
              Thử Lại
            </Button>
            <Button
              variant='outline'
              onClick={() => window.location.reload()}
              className='flex-1'
            >
              Tải Lại Trang
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const AppErrorBoundary: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error('App Error Boundary caught error:', error);
        console.error('Error Info:', errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
};
