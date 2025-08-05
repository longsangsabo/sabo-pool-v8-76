import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

class ProfileErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, retryCount: 0 };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Profile Error Boundary caught an error:', error, errorInfo);

    // Log error for monitoring
    toast.error('Lỗi tải thông tin profile', {
      description: 'Đã xảy ra lỗi khi tải thông tin. Đang thử tải lại...',
      duration: 3000,
    });
  }

  handleRetry = () => {
    const newRetryCount = this.state.retryCount + 1;

    if (newRetryCount >= 3) {
      toast.error('Không thể tải thông tin profile', {
        description: 'Vui lòng thử lại sau hoặc liên hệ hỗ trợ.',
        duration: 5000,
      });
      return;
    }

    this.setState({
      hasError: false,
      error: null,
      retryCount: newRetryCount,
    });

    toast.info('Đang thử tải lại...', {
      duration: 2000,
    });
  };

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className='min-h-screen bg-background flex items-center justify-center p-4'>
          <Card className='w-full max-w-md'>
            <CardHeader className='text-center'>
              <div className='mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center'>
                <AlertTriangle className='h-6 w-6 text-destructive' />
              </div>
              <CardTitle>Lỗi tải thông tin profile</CardTitle>
              <CardDescription>
                Không thể tải thông tin cá nhân của bạn. Vui lòng thử lại.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='text-sm text-muted-foreground bg-muted p-3 rounded-md'>
                <strong>Chi tiết lỗi:</strong>
                <br />
                {this.state.error?.message || 'Lỗi không xác định'}
              </div>

              <div className='flex flex-col gap-2'>
                <Button
                  onClick={this.handleRetry}
                  disabled={this.state.retryCount >= 3}
                  className='w-full'
                >
                  <RefreshCw className='mr-2 h-4 w-4' />
                  Thử lại{' '}
                  {this.state.retryCount > 0 && `(${this.state.retryCount}/3)`}
                </Button>

                <Button
                  variant='outline'
                  onClick={this.handleRefresh}
                  className='w-full'
                >
                  Tải lại trang
                </Button>
              </div>

              {this.state.retryCount >= 3 && (
                <div className='text-sm text-muted-foreground text-center'>
                  Nếu vấn đề vẫn tiếp tục, vui lòng liên hệ hỗ trợ kỹ thuật.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ProfileErrorBoundary;
