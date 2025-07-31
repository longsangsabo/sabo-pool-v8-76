import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
          <Card className='w-full max-w-md'>
            <CardHeader className='text-center'>
              <div className='mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4'>
                <AlertTriangle className='h-6 w-6 text-red-600' />
              </div>
              <CardTitle className='text-xl'>Đã xảy ra lỗi</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <p className='text-gray-600 text-center'>
                Rất tiếc, đã xảy ra lỗi không mong muốn. Vui lòng thử lại hoặc
                liên hệ hỗ trợ nếu vấn đề vẫn tiếp tục.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className='text-sm'>
                  <summary className='cursor-pointer text-gray-500 hover:text-gray-700'>
                    Chi tiết lỗi (Chỉ hiển thị trong development)
                  </summary>
                  <pre className='mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto'>
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}

              <div className='flex gap-2'>
                <Button onClick={this.handleRetry} className='flex-1'>
                  <RefreshCw className='h-4 w-4 mr-2' />
                  Thử lại
                </Button>
                <Button
                  variant='outline'
                  onClick={this.handleGoHome}
                  className='flex-1'
                >
                  <Home className='h-4 w-4 mr-2' />
                  Về trang chủ
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
