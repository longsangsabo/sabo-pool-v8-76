import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export const TournamentSkeleton: React.FC = () => {
  return (
    <div className='space-y-4'>
      {[1, 2, 3].map(index => (
        <Card
          key={index}
          className='bg-white rounded-2xl overflow-hidden shadow-sm border'
        >
          {/* Banner Skeleton */}
          <div className='h-48 bg-gray-200 animate-pulse relative'>
            <div className='absolute top-4 left-4 w-24 h-6 bg-gray-300 rounded-full'></div>
            <div className='absolute top-4 right-4 w-20 h-6 bg-gray-300 rounded-full'></div>
            <div className='absolute bottom-4 left-4'>
              <div className='w-48 h-6 bg-gray-300 rounded mb-2'></div>
              <div className='w-32 h-4 bg-gray-300 rounded'></div>
            </div>
          </div>

          <CardContent className='p-4'>
            {/* Quick Info Skeleton */}
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center space-x-4'>
                <div className='w-20 h-4 bg-gray-200 rounded animate-pulse'></div>
                <div className='w-16 h-4 bg-gray-200 rounded animate-pulse'></div>
              </div>
              <div className='text-right'>
                <div className='w-12 h-4 bg-gray-200 rounded animate-pulse mb-1'></div>
                <div className='w-16 h-3 bg-gray-200 rounded animate-pulse'></div>
              </div>
            </div>

            {/* Recommendation Section Skeleton */}
            <div className='bg-gray-50 rounded-lg p-3 mb-4'>
              <div className='w-32 h-4 bg-gray-200 rounded animate-pulse mb-2'></div>
              <div className='space-y-2'>
                <div className='w-40 h-3 bg-gray-200 rounded animate-pulse'></div>
                <div className='w-36 h-3 bg-gray-200 rounded animate-pulse'></div>
              </div>
            </div>

            {/* Club Info Skeleton */}
            <div className='bg-gray-50 rounded-lg p-3 mb-4'>
              <div className='flex items-center space-x-3'>
                <div className='w-10 h-10 bg-gray-200 rounded-full animate-pulse'></div>
                <div className='flex-1'>
                  <div className='w-32 h-4 bg-gray-200 rounded animate-pulse mb-1'></div>
                  <div className='w-48 h-3 bg-gray-200 rounded animate-pulse mb-2'></div>
                  <div className='flex items-center space-x-2'>
                    <div className='w-16 h-4 bg-gray-200 rounded animate-pulse'></div>
                    <div className='w-12 h-4 bg-gray-200 rounded animate-pulse'></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Prize Breakdown Skeleton */}
            <div className='grid grid-cols-3 gap-3 mb-4'>
              {[1, 2, 3].map(i => (
                <div key={i} className='text-center p-2 bg-gray-50 rounded-lg'>
                  <div className='w-6 h-6 bg-gray-200 rounded animate-pulse mx-auto mb-1'></div>
                  <div className='w-8 h-3 bg-gray-200 rounded animate-pulse mx-auto mb-1'></div>
                  <div className='w-12 h-4 bg-gray-200 rounded animate-pulse mx-auto'></div>
                </div>
              ))}
            </div>

            {/* Action Buttons Skeleton */}
            <div className='flex space-x-3'>
              <div className='flex-1 h-12 bg-gray-200 rounded-lg animate-pulse'></div>
              <div className='flex-1 h-12 bg-gray-200 rounded-lg animate-pulse'></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
