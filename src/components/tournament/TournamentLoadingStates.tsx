import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const TournamentRegistrationSkeleton: React.FC = () => (
  <div className='space-y-3'>
    {[1, 2, 3, 4, 5].map(i => (
      <div
        key={i}
        className='flex items-center space-x-3 p-3 border rounded-lg'
      >
        <Skeleton className='h-10 w-10 rounded-full' />
        <div className='space-y-2 flex-1'>
          <Skeleton className='h-4 w-32' />
          <Skeleton className='h-3 w-24' />
        </div>
        <Skeleton className='h-6 w-20' />
      </div>
    ))}
  </div>
);

export const TournamentMatchesSkeleton: React.FC = () => (
  <div className='space-y-4'>
    {[1, 2, 3].map(round => (
      <Card key={round}>
        <CardHeader>
          <Skeleton className='h-6 w-24' />
        </CardHeader>
        <CardContent className='space-y-3'>
          {[1, 2].map(match => (
            <div
              key={match}
              className='flex items-center justify-between p-3 border rounded'
            >
              <div className='flex items-center space-x-2'>
                <Skeleton className='h-4 w-24' />
                <span className='text-muted-foreground'>vs</span>
                <Skeleton className='h-4 w-24' />
              </div>
              <Skeleton className='h-8 w-16' />
            </div>
          ))}
        </CardContent>
      </Card>
    ))}
  </div>
);

export const TournamentResultsSkeleton: React.FC = () => (
  <div className='space-y-3'>
    {[1, 2, 3, 4, 5].map(i => (
      <div
        key={i}
        className='flex items-center justify-between p-3 border rounded-lg'
      >
        <div className='flex items-center space-x-3'>
          <Skeleton className='h-6 w-8' />
          <Skeleton className='h-8 w-8 rounded-full' />
          <div className='space-y-1'>
            <Skeleton className='h-4 w-32' />
            <Skeleton className='h-3 w-20' />
          </div>
        </div>
        <div className='text-right space-y-1'>
          <Skeleton className='h-4 w-16' />
          <Skeleton className='h-3 w-12' />
        </div>
      </div>
    ))}
  </div>
);

interface TournamentErrorDisplayProps {
  error: string;
  onRetry?: () => void;
}

export const TournamentErrorDisplay: React.FC<TournamentErrorDisplayProps> = ({
  error,
  onRetry,
}) => (
  <Alert variant='destructive'>
    <AlertCircle className='h-4 w-4' />
    <AlertDescription className='flex items-center justify-between'>
      <span>{error}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className='text-sm underline hover:no-underline'
        >
          Thử lại
        </button>
      )}
    </AlertDescription>
  </Alert>
);

interface TournamentLoadingProps {
  message?: string;
}

export const TournamentLoading: React.FC<TournamentLoadingProps> = ({
  message = 'Đang tải...',
}) => (
  <div className='flex items-center justify-center p-8'>
    <div className='text-center space-y-2'>
      <Loader2 className='h-8 w-8 animate-spin mx-auto' />
      <p className='text-sm text-muted-foreground'>{message}</p>
    </div>
  </div>
);
