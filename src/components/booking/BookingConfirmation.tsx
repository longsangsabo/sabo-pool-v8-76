import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface BookingData {
  name: string;
  phone: string;
  date: Date | undefined;
  timeSlot: string;
  tableNumber: string;
  duration: string;
}

interface BookingConfirmationProps {
  formData: BookingData;
  totalPrice: number;
  isHighContrast: boolean;
  onCancelBooking: () => void;
}

const BookingConfirmation = ({
  formData,
  totalPrice,
  isHighContrast,
  onCancelBooking,
}: BookingConfirmationProps) => {
  const themeClasses = isHighContrast
    ? 'bg-black text-white'
    : 'bg-gradient-to-br from-green-900 via-green-800 to-green-900';

  return (
    <div className={`min-h-screen ${themeClasses}`}>
      <div className='container mx-auto px-4 py-16 text-center'>
        <CheckCircle className='h-20 w-20 text-green-400 mx-auto mb-6' />
        <h1 className='text-4xl font-bold text-white mb-4'>
          Đặt Bàn Thành Công!
        </h1>
        <div className='bg-green-800 rounded-xl p-6 max-w-md mx-auto mb-8'>
          <p className='text-white text-lg mb-2'>Thông tin đặt bàn:</p>
          <p className='text-green-200'>Tên: {formData.name}</p>
          <p className='text-green-200'>SĐT: {formData.phone}</p>
          <p className='text-green-200'>Bàn: {formData.tableNumber}</p>
          <p className='text-green-200'>
            Ngày:{' '}
            {formData.date
              ? format(formData.date, 'dd/MM/yyyy', { locale: vi })
              : ''}
          </p>
          <p className='text-green-200'>Giờ: {formData.timeSlot}</p>
          <p className='text-yellow-400 font-bold text-xl mt-4'>
            Tổng: {totalPrice.toLocaleString('vi-VN')}đ
          </p>
        </div>
        <div className='space-y-4'>
          <Button
            onClick={onCancelBooking}
            variant='outline'
            className='border-red-400 text-red-400 hover:bg-red-400 hover:text-white min-h-[44px]'
          >
            Hủy đặt bàn
          </Button>
          <br />
          <Link to='/simple-club'>
            <Button className='bg-yellow-400 text-green-900 hover:bg-yellow-500 min-h-[44px]'>
              Về trang chủ
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
