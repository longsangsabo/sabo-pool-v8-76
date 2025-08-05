import * as React from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DatePickerProps {
  date?: Date;
  onSelect?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showTime?: boolean;
}

export function DatePicker({
  date,
  onSelect,
  placeholder = 'Chọn ngày',
  className,
  disabled = false,
  showTime = false,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleSelect = (selectedDate: Date | undefined) => {
    if (selectedDate && showTime && date) {
      // Preserve time if showTime is true and we already have a date with time
      const existingTime = date;
      selectedDate.setHours(existingTime.getHours());
      selectedDate.setMinutes(existingTime.getMinutes());
    }
    onSelect?.(selectedDate);
    setIsOpen(false);
  };

  const formatDate = (date: Date) => {
    if (showTime) {
      return format(date, 'dd/MM/yyyy HH:mm', { locale: vi });
    }
    return format(date, 'dd/MM/yyyy', { locale: vi });
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          className={cn(
            'justify-start text-left font-normal h-9',
            !date && 'text-muted-foreground',
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className='mr-2 h-4 w-4' />
          {date ? formatDate(date) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0' align='start'>
        <Calendar
          mode='single'
          selected={date}
          onSelect={handleSelect}
          initialFocus
          className={cn('p-3 pointer-events-auto')}
          locale={vi}
        />
      </PopoverContent>
    </Popover>
  );
}

interface DateTimePickerProps extends Omit<DatePickerProps, 'showTime'> {
  showTime?: true;
}

export function DateTimePicker({
  date,
  onSelect,
  placeholder = 'Chọn ngày và giờ',
  className,
  disabled = false,
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    date
  );
  const [time, setTime] = React.useState({
    hours: date ? date.getHours() : 12,
    minutes: date ? date.getMinutes() : 0,
  });

  React.useEffect(() => {
    setSelectedDate(date);
    if (date) {
      setTime({
        hours: date.getHours(),
        minutes: date.getMinutes(),
      });
    }
  }, [date]);

  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      const dateTime = new Date(newDate);
      dateTime.setHours(time.hours);
      dateTime.setMinutes(time.minutes);
      setSelectedDate(dateTime);
      onSelect?.(dateTime);
    } else {
      setSelectedDate(undefined);
      onSelect?.(undefined);
    }
  };

  const handleTimeChange = (field: 'hours' | 'minutes', value: number) => {
    const newTime = { ...time, [field]: value };
    setTime(newTime);

    if (selectedDate) {
      const dateTime = new Date(selectedDate);
      dateTime.setHours(newTime.hours);
      dateTime.setMinutes(newTime.minutes);
      setSelectedDate(dateTime);
      onSelect?.(dateTime);
    }
  };

  const formatDateTime = (date: Date) => {
    return format(date, 'dd/MM/yyyy HH:mm', { locale: vi });
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          className={cn(
            'justify-start text-left font-normal h-9',
            !selectedDate && 'text-muted-foreground',
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className='mr-2 h-4 w-4' />
          {selectedDate ? (
            formatDateTime(selectedDate)
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0' align='start'>
        <div className='p-3 pointer-events-auto'>
          <Calendar
            mode='single'
            selected={selectedDate}
            onSelect={handleDateSelect}
            initialFocus
            className='mb-3'
            locale={vi}
          />
          <div className='border-t pt-3'>
            <div className='flex items-center gap-2'>
              <label className='text-sm font-medium'>Giờ:</label>
              <select
                value={time.hours}
                onChange={e =>
                  handleTimeChange('hours', parseInt(e.target.value))
                }
                className='px-2 py-1 border border-border rounded text-sm'
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, '0')}
                  </option>
                ))}
              </select>
              <span>:</span>
              <select
                value={time.minutes}
                onChange={e =>
                  handleTimeChange('minutes', parseInt(e.target.value))
                }
                className='px-2 py-1 border border-border rounded text-sm'
              >
                {[0, 15, 30, 45].map(minute => (
                  <option key={minute} value={minute}>
                    {minute.toString().padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
