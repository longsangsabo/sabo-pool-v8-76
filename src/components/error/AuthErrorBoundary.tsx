import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AuthErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

const AuthErrorFallback: React.FC<AuthErrorFallbackProps> = ({
  error,
  resetErrorBoundary,
}) => {
  const handleClearAuthAndReload = () => {
    // Clear all auth-related storage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });

    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
      }
    });

    // Reload the page
    window.location.reload();
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-background p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10'>
            <AlertTriangle className='h-6 w-6 text-destructive' />
          </div>
          <CardTitle className='text-xl'>Lỗi Xác Thực</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='text-center text-sm text-muted-foreground'>
            <p>Có lỗi trong hệ thống xác thực. Thường xảy ra do:</p>
            <ul className='mt-2 text-left list-disc list-inside space-y-1'>
              <li>Provider không được thiết lập đúng</li>
              <li>Token xác thực bị hỏng</li>
              <li>Conflict giữa các session</li>
            </ul>
          </div>

          <div className='flex flex-col gap-2'>
            <Button onClick={resetErrorBoundary} className='w-full'>
              <RefreshCw className='h-4 w-4 mr-2' />
              Thử Lại
            </Button>
            <Button
              variant='outline'
              onClick={handleClearAuthAndReload}
              className='w-full'
            >
              Xóa Dữ Liệu & Tải Lại
            </Button>
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
        </CardContent>
      </Card>
    </div>
  );
};

export const AuthErrorBoundary: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <ErrorBoundary
      FallbackComponent={AuthErrorFallback}
      onError={(error, errorInfo) => {
        console.error('Auth Error Boundary caught error:', error);
        console.error('Error Info:', errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
};
