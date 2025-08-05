import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Loader2 } from 'lucide-react';

interface Club {
  id: string;
  name: string;
  hourly_rate?: number;
  phone?: string;
  address: string;
}

interface TableBookingFormProps {
  club: Club;
}

const TableBookingForm = ({ club }: TableBookingFormProps) => {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [duration, setDuration] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timeSlots = [
    '08:00',
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
    '18:00',
    '19:00',
    '20:00',
    '21:00',
    '22:00',
  ];

  // Function to calculate end time based on start time and duration
  const calculateEndTime = (
    startTime: string,
    durationHours: number
  ): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);

    const endDate = new Date(
      startDate.getTime() + durationHours * 60 * 60 * 1000
    );

    return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        toast({
          title: 'Yêu cầu đăng nhập',
          description: 'Vui lòng đăng nhập để đặt bàn',
          variant: 'destructive',
        });
        return;
      }

      const totalCost = (club.hourly_rate || 0) * duration;
      const endTime = calculateEndTime(selectedTime, duration);

      // Mock booking submission since table_bookings table doesn't exist
      console.log('Mock table booking:', {
        club_id: club.id,
        user_id: user.user.id,
        table_number: 1,
        booking_date: selectedDate,
        start_time: selectedTime,
        end_time: endTime,
        duration_hours: duration,
        total_cost: totalCost,
        status: 'confirmed',
      });

      toast({
        title: 'Thành công',
        description: 'Đặt bàn thành công!',
      });

      // Reset form
      setSelectedDate('');
      setSelectedTime('');
      setDuration(1);
    } catch (error) {
      console.error('Error booking table:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Error booking table: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleBooking} className='space-y-4'>
      <div>
        <label className='block text-sm font-medium text-gray-700 mb-2'>
          Ngày đặt bàn *
        </label>
        <input
          type='date'
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          required
          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
        />
      </div>

      <div>
        <label className='block text-sm font-medium text-gray-700 mb-2'>
          Giờ bắt đầu *
        </label>
        <select
          value={selectedTime}
          onChange={e => setSelectedTime(e.target.value)}
          required
          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
        >
          <option value=''>Chọn giờ</option>
          {timeSlots.map(time => (
            <option key={time} value={time}>
              {time}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className='block text-sm font-medium text-gray-700 mb-2'>
          Thời gian chơi (giờ) *
        </label>
        <select
          value={duration}
          onChange={e => setDuration(parseInt(e.target.value))}
          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
        >
          {[1, 2, 3, 4, 5, 6].map(hour => (
            <option key={hour} value={hour}>
              {hour} giờ
            </option>
          ))}
        </select>
      </div>

      {/* Show calculated end time */}
      {selectedTime && duration && (
        <div className='bg-gray-50 p-3 rounded-md'>
          <div className='text-sm text-gray-600'>
            <strong>Thời gian:</strong> {selectedTime} -{' '}
            {calculateEndTime(selectedTime, duration)}
          </div>
        </div>
      )}

      {/* Cost Calculation */}
      {club.hourly_rate && duration && (
        <div className='bg-blue-50 p-4 rounded-md'>
          <div className='flex justify-between items-center'>
            <span className='text-sm text-gray-600'>Tổng chi phí:</span>
            <span className='text-lg font-semibold text-blue-600'>
              {(club.hourly_rate * duration).toLocaleString('vi-VN')} VNĐ
            </span>
          </div>
          <p className='text-xs text-gray-500 mt-1'>
            {club.hourly_rate.toLocaleString('vi-VN')} VNĐ/giờ × {duration} giờ
          </p>
        </div>
      )}

      {/* Club Contact Info */}
      {club.phone && (
        <div className='bg-green-50 p-3 rounded-md'>
          <div className='text-sm text-gray-600'>
            <strong>Liên hệ câu lạc bộ:</strong> {club.phone}
          </div>
        </div>
      )}

      <Button
        type='submit'
        disabled={loading || !selectedDate || !selectedTime}
        className='w-full'
      >
        {loading ? (
          <>
            <Loader2 className='w-4 h-4 mr-2 animate-spin' />
            Đang đặt bàn...
          </>
        ) : (
          <>
            <Calendar className='w-4 h-4 mr-2' />
            Đặt bàn ngay
          </>
        )}
      </Button>

      <p className='text-xs text-gray-500 text-center'>
        Bạn sẽ nhận được xác nhận qua email sau khi đặt bàn thành công
      </p>
    </form>
  );
};

export default TableBookingForm;
