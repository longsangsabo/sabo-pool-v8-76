import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className='m-4 border-destructive'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-destructive'>
              <AlertTriangle className='w-5 h-5' />
              Something went wrong
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <p className='text-muted-foreground'>
              An error occurred while loading this component. This is likely a
              temporary issue.
            </p>
            {this.state.error && (
              <details className='text-sm'>
                <summary className='cursor-pointer font-medium'>
                  Error details
                </summary>
                <pre className='mt-2 p-2 bg-muted rounded text-xs overflow-auto'>
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <Button
              onClick={() =>
                this.setState({ hasError: false, error: undefined })
              }
              variant='outline'
              className='gap-2'
            >
              <RefreshCw className='w-4 h-4' />
              Try again
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
