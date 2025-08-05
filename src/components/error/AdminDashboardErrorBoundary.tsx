import React, { Component, ReactNode, ErrorInfo } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class AdminDashboardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AdminDashboard Error:', error);
    console.error('Error Info:', errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className='flex items-center justify-center min-h-[400px] p-8'>
          <div className='text-center max-w-md'>
            <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10'>
              <AlertTriangle className='h-6 w-6 text-destructive' />
            </div>
            <h3 className='text-lg font-semibold mb-2'>Lỗi Tải Dashboard</h3>
            <p className='text-muted-foreground mb-4'>
              Không thể tải trang Dashboard admin. Vui lòng thử lại.
            </p>
            <div className='flex gap-2 justify-center'>
              <Button onClick={this.handleRetry} variant='outline' size='sm'>
                <RefreshCw className='h-4 w-4 mr-2' />
                Thử Lại
              </Button>
              <Button onClick={this.handleReload} size='sm'>
                Tải Lại Trang
              </Button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className='mt-4 text-left'>
                <summary className='cursor-pointer text-sm text-muted-foreground'>
                  Chi tiết lỗi (Development)
                </summary>
                <pre className='mt-2 text-xs bg-muted p-2 rounded overflow-auto'>
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AdminDashboardErrorBoundary;
