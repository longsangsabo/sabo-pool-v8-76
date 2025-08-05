import React from 'react';
import { Card, CardContent } from './card';

export function LoadingCard() {
  return (
    <Card>
      <CardContent className='pt-6'>
        <div className='animate-pulse'>
          <div className='h-4 bg-gray-200 rounded w-3/4 mb-2'></div>
          <div className='h-8 bg-gray-200 rounded w-1/2'></div>
        </div>
      </CardContent>
    </Card>
  );
}
