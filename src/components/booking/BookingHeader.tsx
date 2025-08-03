import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BookingHeaderProps {
  isHighContrast: boolean;
  onToggleContrast: () => void;
  connectionSpeed: 'fast' | 'slow';
  loading: boolean;
}

const BookingHeader = ({
  isHighContrast,
  onToggleContrast,
  connectionSpeed,
  loading,
}: BookingHeaderProps) => {
  return (
    <>
      <header className='bg-green-800 border-b border-green-700 sticky top-0 z-50'>
        <div className='container mx-auto px-4 py-4'>
          <div className='flex items-center justify-between'>
            <Link to='/simple-club'>
              <Button
                variant='ghost'
                size='sm'
                className='text-yellow-400 hover:bg-green-700 min-h-[44px]'
              >
                <ArrowLeft className='h-4 w-4 mr-2' />
                Về trang chủ
              </Button>
            </Link>
            <h1 className='text-xl font-bold text-yellow-400'>
              🎱 Đặt bàn bi-a
            </h1>
            <Button
              variant='ghost'
              size='sm'
              onClick={onToggleContrast}
              className='text-green-200 hover:bg-green-700 min-h-[44px]'
            >
              {isHighContrast ? '🌞' : '🌙'}
            </Button>
          </div>
        </div>
      </header>

      {/* Loading indicator for slow connections */}
      {connectionSpeed === 'slow' && loading && (
        <div className='bg-yellow-400 text-green-900 text-center py-2 px-4'>
          <div className='flex items-center justify-center space-x-2'>
            <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-green-900'></div>
            <span className='font-medium'>Đang tải dữ liệu...</span>
          </div>
        </div>
      )}
    </>
  );
};

export default BookingHeader;
