import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import BookingHeader from '@/components/booking/BookingHeader';
import BookingForm from '@/components/booking/BookingForm';
import BookingConfirmation from '@/components/booking/BookingConfirmation';

const SimpleClubBookingPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    date: undefined as Date | undefined,
    timeSlot: '',
    tableNumber: '',
    duration: '1',
    notificationMethod: 'sms',
  });
  const [loading, setLoading] = useState(false);
  const [availableTables, setAvailableTables] = useState<number[]>([]);
  const [bookingStep, setBookingStep] = useState(1);
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [connectionSpeed, setConnectionSpeed] = useState<'fast' | 'slow'>(
    'fast'
  );

  // Simulate connection speed detection
  useEffect(() => {
    const connection = (navigator as any).connection;
    if (connection) {
      setConnectionSpeed(
        connection.effectiveType === '3g' || connection.effectiveType === '2g'
          ? 'slow'
          : 'fast'
      );
    }
  }, []);

  // Real-time table availability simulation
  useEffect(() => {
    if (formData.date && formData.timeSlot) {
      setLoading(true);
      const delay = connectionSpeed === 'slow' ? 2000 : 500;

      setTimeout(() => {
        const totalTables = 12;
        const occupiedTables = Math.floor(Math.random() * 6) + 1;
        const available = Array.from(
          { length: totalTables - occupiedTables },
          (_, i) => i + 1
        );
        setAvailableTables(available);
        setLoading(false);
      }, delay);
    }
  }, [formData.date, formData.timeSlot, connectionSpeed]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập họ tên đầy đủ');
      return false;
    }
    if (!formData.phone.trim()) {
      toast.error('Vui lòng nhập số điện thoại');
      return false;
    }
    if (!/^0\d{9}$/.test(formData.phone)) {
      toast.error('Số điện thoại không đúng định dạng (VD: 0901234567)');
      return false;
    }
    if (!formData.date) {
      toast.error('Vui lòng chọn ngày chơi');
      return false;
    }
    if (!formData.timeSlot) {
      toast.error('Vui lòng chọn giờ bắt đầu');
      return false;
    }
    if (!formData.tableNumber) {
      toast.error('Vui lòng chọn bàn');
      return false;
    }
    return true;
  };

  const calculatePrice = () => {
    if (!formData.timeSlot || !formData.duration) return 0;

    const hour = parseInt(formData.timeSlot.split(':')[0]);
    const duration = parseInt(formData.duration);
    const pricePerHour = hour < 17 ? 25000 : 35000;

    return pricePerHour * duration;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const delay = connectionSpeed === 'slow' ? 3000 : 1500;
      await new Promise(resolve => setTimeout(resolve, delay));

      toast.success(
        `🎉 Đặt bàn thành công! Bàn ${formData.tableNumber} - ${formData.date ? formData.date.toLocaleDateString('vi-VN') : ''} lúc ${formData.timeSlot}`
      );

      setBookingStep(3);
    } catch (error) {
      toast.error(
        'Có lỗi xảy ra. Vui lòng thử lại hoặc gọi hotline: 0901 234 567'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = () => {
    if (confirm('Bạn có chắc muốn hủy đặt bàn này không?')) {
      setFormData({
        name: '',
        phone: '',
        date: undefined,
        timeSlot: '',
        tableNumber: '',
        duration: '1',
        notificationMethod: 'sms',
      });
      setBookingStep(1);
      toast.success('Đã hủy đặt bàn thành công');
    }
  };

  const themeClasses = isHighContrast
    ? 'bg-black text-white'
    : 'bg-gradient-to-br from-green-900 via-green-800 to-green-900';

  if (bookingStep === 3) {
    return (
      <BookingConfirmation
        formData={formData}
        totalPrice={calculatePrice()}
        isHighContrast={isHighContrast}
        onCancelBooking={handleCancelBooking}
      />
    );
  }

  return (
    <>
      <Helmet>
        <title>Đặt bàn billiards - SABO Billiards</title>
        <meta
          name='description'
          content='Đặt bàn billiards online nhanh chóng, dễ dàng tại SABO Billiards'
        />
      </Helmet>

      <div className={`min-h-screen ${themeClasses}`}>
        <BookingHeader
          isHighContrast={isHighContrast}
          onToggleContrast={() => setIsHighContrast(!isHighContrast)}
          connectionSpeed={connectionSpeed}
          loading={loading}
        />

        <BookingForm
          formData={formData}
          availableTables={availableTables}
          loading={loading}
          isHighContrast={isHighContrast}
          onInputChange={handleInputChange}
          onSubmit={handleSubmit}
          calculatePrice={calculatePrice}
        />
      </div>
    </>
  );
};

export default SimpleClubBookingPage;
