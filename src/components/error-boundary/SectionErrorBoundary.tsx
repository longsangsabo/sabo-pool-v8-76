import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SectionErrorBoundaryProps {
  children: ReactNode;
  section: string;
  onError?: (error: Error) => void;
}

interface SectionErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class SectionErrorBoundary extends Component<
  SectionErrorBoundaryProps,
  SectionErrorBoundaryState
> {
  constructor(props: SectionErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): SectionErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[${this.props.section}] Error caught:`, error, errorInfo);
    this.props.onError?.(error);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className='min-h-[400px] flex items-center justify-center p-4'>
          <Card className='w-full max-w-md'>
            <CardHeader className='text-center'>
              <div className='flex justify-center mb-4'>
                <AlertTriangle className='h-8 w-8 text-destructive' />
              </div>
              <CardTitle>Lỗi {this.props.section}</CardTitle>
            </CardHeader>
            <CardContent className='text-center space-y-4'>
              <p className='text-muted-foreground'>
                Đã xảy ra lỗi khi tải {this.props.section.toLowerCase()}. Vui
                lòng thử lại.
              </p>

              <div className='flex gap-2 justify-center'>
                <Button onClick={this.handleRetry} size='sm' className='gap-2'>
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
    }

    return this.props.children;
  }
}
