import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import TableSelector from './TableSelector';

interface BookingFormData {
  name: string;
  phone: string;
  date: Date | undefined;
  timeSlot: string;
  tableNumber: string;
  duration: string;
  notificationMethod: string;
}

interface BookingFormProps {
  formData: BookingFormData;
  availableTables: number[];
  loading: boolean;
  isHighContrast: boolean;
  onInputChange: (field: string, value: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  calculatePrice: () => number;
}

const BookingForm = ({
  formData,
  availableTables,
  loading,
  isHighContrast,
  onInputChange,
  onSubmit,
  calculatePrice,
}: BookingFormProps) => {
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
    '23:00',
  ];

  return (
    <div className='container mx-auto px-4 py-8'>
      <form
        onSubmit={onSubmit}
        className='max-w-2xl mx-auto bg-green-800 rounded-xl p-6 space-y-6'
      >
        <h2 className='text-2xl font-bold text-yellow-400 text-center mb-6'>
          Thông tin đặt bàn
        </h2>

        {/* Personal Information */}
        <div className='grid md:grid-cols-2 gap-4'>
          <div className='space-y-2'>
            <Label
              className={`${isHighContrast ? 'text-white' : 'text-white'} text-lg font-medium`}
            >
              Họ và tên *
            </Label>
            <Input
              type='text'
              value={formData.name}
              onChange={e => onInputChange('name', e.target.value)}
              placeholder='VD: Nguyễn Văn A'
              className='min-h-[44px] text-lg'
              required
            />
          </div>

          <div className='space-y-2'>
            <Label
              className={`${isHighContrast ? 'text-white' : 'text-white'} text-lg font-medium`}
            >
              Số điện thoại *
            </Label>
            <Input
              type='tel'
              value={formData.phone}
              onChange={e => onInputChange('phone', e.target.value)}
              placeholder='VD: 0901234567'
              className='min-h-[44px] text-lg'
              pattern='[0-9]{10}'
              required
            />
          </div>
        </div>

        {/* Date Selection */}
        <div className='space-y-2'>
          <Label
            className={`${isHighContrast ? 'text-white' : 'text-white'} text-lg font-medium`}
          >
            Chọn ngày *
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant='outline'
                className='w-full justify-start min-h-[44px] text-lg'
              >
                <CalendarIcon className='mr-2 h-4 w-4' />
                {formData.date
                  ? format(formData.date, 'dd/MM/yyyy', { locale: vi })
                  : 'Chọn ngày chơi'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-auto p-0' align='start'>
              <Calendar
                mode='single'
                selected={formData.date}
                onSelect={date => onInputChange('date', date)}
                disabled={date =>
                  date < new Date() || date < new Date('1900-01-01')
                }
                initialFocus
                locale={vi}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Time and Duration */}
        <div className='grid md:grid-cols-2 gap-4'>
          <div className='space-y-2'>
            <Label
              className={`${isHighContrast ? 'text-white' : 'text-white'} text-lg font-medium`}
            >
              Giờ bắt đầu *
            </Label>
            <Select
              value={formData.timeSlot}
              onValueChange={value => onInputChange('timeSlot', value)}
            >
              <SelectTrigger className='min-h-[44px] text-lg'>
                <SelectValue placeholder='Chọn giờ' />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map(time => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label
              className={`${isHighContrast ? 'text-white' : 'text-white'} text-lg font-medium`}
            >
              Thời gian chơi
            </Label>
            <Select
              value={formData.duration}
              onValueChange={value => onInputChange('duration', value)}
            >
              <SelectTrigger className='min-h-[44px] text-lg'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='1'>1 giờ</SelectItem>
                <SelectItem value='2'>2 giờ</SelectItem>
                <SelectItem value='3'>3 giờ</SelectItem>
                <SelectItem value='4'>4 giờ</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table Selection */}
        <TableSelector
          availableTables={availableTables}
          selectedTable={formData.tableNumber}
          loading={loading}
          isHighContrast={isHighContrast}
          onSelectTable={tableNumber =>
            onInputChange('tableNumber', tableNumber)
          }
        />

        {/* Notification Method */}
        <div className='space-y-2'>
          <Label
            className={`${isHighContrast ? 'text-white' : 'text-white'} text-lg font-medium`}
          >
            Phương thức nhận thông báo
          </Label>
          <RadioGroup
            value={formData.notificationMethod}
            onValueChange={value => onInputChange('notificationMethod', value)}
            className='flex flex-col space-y-2'
          >
            <div className='flex items-center space-x-2'>
              <RadioGroupItem value='sms' id='sms' />
              <Label htmlFor='sms' className='text-white'>
                📱 SMS
              </Label>
            </div>
            <div className='flex items-center space-x-2'>
              <RadioGroupItem value='zalo' id='zalo' />
              <Label htmlFor='zalo' className='text-white'>
                💬 Zalo
              </Label>
            </div>
            <div className='flex items-center space-x-2'>
              <RadioGroupItem value='call' id='call' />
              <Label htmlFor='call' className='text-white'>
                📞 Gọi điện
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Price Display */}
        {formData.timeSlot && formData.duration && (
          <div className='bg-green-700 rounded-lg p-4'>
            <div className='flex justify-between items-center'>
              <span className='text-white text-lg'>Tổng tiền:</span>
              <span className='text-yellow-400 text-2xl font-bold'>
                {calculatePrice().toLocaleString('vi-VN')}đ
              </span>
            </div>
            <p className='text-green-200 text-sm mt-2'>
              * Giá {formData.timeSlot < '17:00' ? 'giờ thường' : 'giờ vàng'}:{' '}
              {formData.timeSlot < '17:00' ? '25,000đ' : '35,000đ'}/giờ
            </p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type='submit'
          disabled={loading}
          className='w-full bg-yellow-400 text-green-900 hover:bg-yellow-500 min-h-[50px] text-lg font-bold'
        >
          {loading ? (
            <>
              <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-green-900 mr-2'></div>
              Đang xử lý...
            </>
          ) : (
            '🎯 Xác nhận đặt bàn'
          )}
        </Button>
      </form>
    </div>
  );
};

export default BookingForm;
