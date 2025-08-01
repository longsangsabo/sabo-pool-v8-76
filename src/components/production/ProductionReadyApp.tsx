import React from 'react';
import {
  FeatureFlagsProvider,
  useFeatureFlags,
} from '@/contexts/FeatureFlagsContext';
import ResponsiveErrorBoundary from '@/components/error/ResponsiveErrorBoundary';
import { useOptimizedResponsive } from '@/hooks/useOptimizedResponsive';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Info, Rocket } from 'lucide-react';

interface ProductionReadyAppProps {
  children: React.ReactNode;
  environment?: 'development' | 'staging' | 'production';
}

const ProductionReadyAppContent: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { flags, isEnabled, userGroup, environment } = useFeatureFlags();
  const responsive = useOptimizedResponsive();

  return (
    <ResponsiveErrorBoundary>
      {/* Development/Staging Banner */}
      {environment !== 'production' && (
        <div className='bg-yellow-100 border-b border-yellow-200 p-2'>
          <div className='container mx-auto'>
            <Alert className='border-none bg-transparent p-2'>
              <Info className='h-4 w-4' />
              <AlertDescription className='flex items-center gap-2 text-sm'>
                <span>
                  <strong>{environment.toUpperCase()} Environment</strong> -
                  User Group: <Badge variant='outline'>{userGroup}</Badge> -
                  Device:{' '}
                  <Badge variant='outline'>{responsive.breakpoint}</Badge>
                </span>
                {isEnabled('experimentalLayouts') && (
                  <Badge variant='secondary'>
                    Experimental Features Active
                  </Badge>
                )}
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )}

      {/* Feature Flag Status (Development Only) */}
      {environment === 'development' && (
        <div className='fixed bottom-4 right-4 z-50'>
          <details className='bg-card border rounded-lg shadow-lg max-w-xs'>
            <summary className='p-3 cursor-pointer text-sm font-medium'>
              <Rocket className='inline h-4 w-4 mr-2' />
              Feature Flags
            </summary>
            <div className='p-3 pt-0 space-y-2 text-xs'>
              {Object.entries(flags).map(([key, enabled]) => (
                <div key={key} className='flex items-center justify-between'>
                  <span className='truncate'>{key}</span>
                  <Badge
                    variant={enabled ? 'default' : 'outline'}
                    className='ml-2'
                  >
                    {enabled ? 'ON' : 'OFF'}
                  </Badge>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}

      {children}
    </ResponsiveErrorBoundary>
  );
};

export const ProductionReadyApp: React.FC<ProductionReadyAppProps> = ({
  children,
  environment = 'development',
}) => {
  return (
    <FeatureFlagsProvider environment={environment}>
      <ProductionReadyAppContent>{children}</ProductionReadyAppContent>
    </FeatureFlagsProvider>
  );
};
