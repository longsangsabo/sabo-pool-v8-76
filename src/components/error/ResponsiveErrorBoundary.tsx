import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, RefreshCw, Bug, Monitor } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

class ResponsiveErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    errorId: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log responsive-related errors
    this.logResponsiveError(error, errorInfo);

    // Send to monitoring service (example)
    this.reportErrorToMonitoring(error, errorInfo);
  }

  private logResponsiveError = (error: Error, errorInfo: ErrorInfo) => {
    const isResponsiveError = this.isResponsiveRelatedError(error);

    console.group(`🔧 Responsive Error Boundary - ${this.state.errorId}`);
    console.error('Error caught:', error);
    console.error('Error info:', errorInfo);
    console.log('Screen dimensions:', {
      width: window.innerWidth,
      height: window.innerHeight,
      userAgent: navigator.userAgent,
    });
    console.log('Is responsive-related:', isResponsiveError);
    console.groupEnd();
  };

  private isResponsiveRelatedError = (error: Error): boolean => {
    const responsiveKeywords = [
      'useOptimizedResponsive',
      'useResponsive',
      'breakpoint',
      'ResponsiveLayout',
      'MobileLayout',
      'TabletLayout',
      'DesktopLayout',
      'responsive',
    ];

    const errorString = error.toString() + (error.stack || '');
    return responsiveKeywords.some(keyword =>
      errorString.toLowerCase().includes(keyword.toLowerCase())
    );
  };

  private reportErrorToMonitoring = (error: Error, errorInfo: ErrorInfo) => {
    // Example: Send to external monitoring service
    try {
      // Replace with your actual monitoring service
      // Example: Sentry, LogRocket, Bugsnag, etc.
      const errorReport = {
        errorId: this.state.errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        screenDimensions: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        url: window.location.href,
        isResponsiveRelated: this.isResponsiveRelatedError(error),
      };

      console.log('Error report prepared for monitoring:', errorReport);

      // Example API call to monitoring service
      // fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorReport)
      // });
    } catch (reportingError) {
      console.error(
        'Failed to report error to monitoring service:',
        reportingError
      );
    }
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className='min-h-screen flex items-center justify-center p-4'>
          <Card className='max-w-2xl w-full'>
            <CardHeader>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-destructive/10 rounded-full'>
                  <AlertTriangle className='h-6 w-6 text-destructive' />
                </div>
                <div>
                  <CardTitle className='text-destructive'>
                    Responsive Layout Error
                  </CardTitle>
                  <p className='text-sm text-muted-foreground mt-1'>
                    Something went wrong with the responsive system
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className='space-y-4'>
              {/* Error Details */}
              <Alert>
                <Bug className='h-4 w-4' />
                <AlertDescription>
                  <div className='space-y-2'>
                    <div>
                      <strong>Error:</strong> {this.state.error?.message}
                    </div>
                    <div>
                      <strong>Error ID:</strong>
                      <Badge variant='outline' className='ml-2'>
                        {this.state.errorId}
                      </Badge>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Monitor className='h-4 w-4' />
                      <span>
                        Screen: {window.innerWidth}×{window.innerHeight}
                      </span>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>

              {/* Debug Information */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className='bg-muted p-4 rounded-lg'>
                  <summary className='cursor-pointer font-medium mb-2'>
                    Debug Information (Development Only)
                  </summary>
                  <div className='space-y-2 text-sm font-mono'>
                    <div>
                      <strong>Stack Trace:</strong>
                      <pre className='mt-1 whitespace-pre-wrap text-xs'>
                        {this.state.error.stack}
                      </pre>
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className='mt-1 whitespace-pre-wrap text-xs'>
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Recovery Actions */}
              <div className='flex gap-3'>
                <Button
                  onClick={this.handleRetry}
                  variant='default'
                  className='flex-1'
                >
                  <RefreshCw className='h-4 w-4 mr-2' />
                  Try Again
                </Button>

                <Button
                  onClick={this.handleReload}
                  variant='outline'
                  className='flex-1'
                >
                  Reload Page
                </Button>
              </div>

              {/* Help Information */}
              <Alert className='bg-blue-50'>
                <AlertDescription>
                  <div className='space-y-2 text-sm'>
                    <strong>What you can do:</strong>
                    <ul className='list-disc list-inside space-y-1 ml-2'>
                      <li>Try refreshing the page</li>
                      <li>
                        Check if the issue persists on different screen sizes
                      </li>
                      <li>
                        Report this error with ID:{' '}
                        <code>{this.state.errorId}</code>
                      </li>
                      <li>Disable browser extensions that might interfere</li>
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ResponsiveErrorBoundary;
