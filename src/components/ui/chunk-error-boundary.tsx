import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ChunkErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

const ChunkErrorFallback: React.FC<ChunkErrorFallbackProps> = ({
  error,
  resetErrorBoundary,
}) => {
  const isChunkError =
    error.message.includes('Loading chunk') ||
    error.message.includes('Cannot access') ||
    error.name === 'ChunkLoadError';

  return (
    <Card className='max-w-md mx-auto mt-8'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-destructive'>
          <AlertTriangle className='w-5 h-5' />
          {isChunkError ? 'Lỗi tải trang' : 'Đã xảy ra lỗi'}
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <p className='text-sm text-muted-foreground'>
          {isChunkError
            ? 'Không thể tải trang này. Vui lòng thử lại.'
            : 'Đã xảy ra lỗi không mong muốn.'}
        </p>

        {process.env.NODE_ENV === 'development' && (
          <details className='text-xs'>
            <summary className='cursor-pointer text-muted-foreground'>
              Chi tiết lỗi
            </summary>
            <pre className='mt-2 p-2 bg-muted rounded text-xs overflow-auto'>
              {error.stack}
            </pre>
          </details>
        )}

        <div className='flex gap-2'>
          <Button onClick={resetErrorBoundary} size='sm'>
            <RefreshCw className='w-4 h-4 mr-2' />
            Thử lại
          </Button>

          {isChunkError && (
            <Button
              variant='outline'
              size='sm'
              onClick={() => window.location.reload()}
            >
              Tải lại trang
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface ChunkErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ChunkErrorFallbackProps>;
}

export const ChunkErrorBoundary: React.FC<ChunkErrorBoundaryProps> = ({
  children,
  fallback = ChunkErrorFallback,
}) => {
  return (
    <ErrorBoundary
      FallbackComponent={fallback}
      onError={(error, errorInfo) => {
        console.error('Chunk loading error:', error, errorInfo);

        // Report to monitoring service in production
        if (process.env.NODE_ENV === 'production') {
          // Add error reporting logic here
        }
      }}
      onReset={() => {
        // Clear any cached states that might be causing issues
        console.log('Resetting chunk error boundary');
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

export default ChunkErrorBoundary;
