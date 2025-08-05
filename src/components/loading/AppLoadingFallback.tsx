import React from 'react';
import { Loader2 } from 'lucide-react';

export const AppLoadingFallback: React.FC = () => {
  return (
    <div className='min-h-screen flex items-center justify-center bg-background'>
      <div className='text-center'>
        <Loader2 className='h-8 w-8 animate-spin mx-auto mb-4 text-primary' />
        <p className='text-muted-foreground'>Đang tải ứng dụng...</p>
      </div>
    </div>
  );
};
