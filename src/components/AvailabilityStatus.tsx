import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePlayerAvailability } from '@/hooks/usePlayerAvailability';
import { Users, MapPin, Clock } from 'lucide-react';

const AvailabilityStatus = () => {
  const { myAvailability, updateAvailability, isUpdating } =
    usePlayerAvailability();

  const [status, setStatus] = useState('unavailable');
  const [location, setLocation] = useState(myAvailability?.location || '');
  const [maxDistance, setMaxDistance] = useState(
    myAvailability?.max_distance_km || 5
  );

  const statusOptions = [
    {
      value: 'available_now',
      label: 'Rảnh bây giờ',
      color: 'bg-green-100 text-green-800',
    },
    {
      value: 'available_tonight',
      label: 'Rảnh tối nay',
      color: 'bg-blue-100 text-blue-800',
    },
    {
      value: 'available_weekend',
      label: 'Rảnh cuối tuần',
      color: 'bg-purple-100 text-purple-800',
    },
    {
      value: 'unavailable',
      label: 'Không rảnh',
      color: 'bg-gray-100 text-gray-800',
    },
  ];

  const handleUpdateStatus = () => {
    const availableUntil =
      status === 'available_now'
        ? new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString() // 4 hours from now
        : status === 'available_tonight'
          ? new Date(new Date().setHours(23, 59, 59, 999)).toISOString() // End of today
          : status === 'available_weekend'
            ? new Date(
                new Date().setDate(
                  new Date().getDate() + (7 - new Date().getDay())
                )
              ).toISOString() // End of weekend
            : null;

    updateAvailability({
      location,
      max_distance_km: maxDistance,
      available_until: availableUntil,
    });
  };

  const currentStatusOption = statusOptions.find(opt => opt.value === status);

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Users className='w-5 h-5' />
          Trạng thái tìm bạn tập
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Current Status Display */}
        {myAvailability && (
          <div className='p-3 bg-gray-50 rounded-lg'>
            <div className='flex items-center gap-2 mb-2'>
              <Badge className={currentStatusOption?.color}>
                {currentStatusOption?.label}
              </Badge>
              {myAvailability.available_until && (
                <span className='text-xs text-gray-500 flex items-center gap-1'>
                  <Clock className='w-3 h-3' />
                  Đến{' '}
                  {new Date(myAvailability.available_until).toLocaleTimeString(
                    'vi-VN',
                    {
                      hour: '2-digit',
                      minute: '2-digit',
                    }
                  )}
                </span>
              )}
            </div>
            {myAvailability.location && (
              <div className='text-xs text-gray-500 flex items-center gap-1'>
                <MapPin className='w-3 h-3' />
                {myAvailability.location} (bán kính{' '}
                {myAvailability.max_distance_km}km)
              </div>
            )}
          </div>
        )}

        {/* Update Status Form */}
        <div className='space-y-3'>
          <div>
            <Label htmlFor='status' className='text-sm'>
              Trạng thái
            </Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder='Chọn trạng thái' />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {status !== 'unavailable' && (
            <>
              <div>
                <Label htmlFor='location' className='text-sm'>
                  Vị trí
                </Label>
                <Input
                  id='location'
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder='VD: Quận 1, TP.HCM'
                  className='text-sm'
                />
              </div>

              <div>
                <Label htmlFor='distance' className='text-sm'>
                  Bán kính tìm kiếm
                </Label>
                <Select
                  value={maxDistance.toString()}
                  onValueChange={value => setMaxDistance(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='2'>2km</SelectItem>
                    <SelectItem value='5'>5km</SelectItem>
                    <SelectItem value='10'>10km</SelectItem>
                    <SelectItem value='20'>20km</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <Button
            onClick={handleUpdateStatus}
            disabled={isUpdating}
            className='w-full'
          >
            {isUpdating ? 'Đang cập nhật...' : 'Cập nhật trạng thái'}
          </Button>
        </div>

        {/* Help Text */}
        <div className='text-xs text-gray-500 bg-blue-50 p-3 rounded-lg'>
          <p className='font-medium mb-1'>Mẹo:</p>
          <ul className='space-y-1'>
            <li>• "Rảnh bây giờ" sẽ tự động tắt sau 4 tiếng</li>
            <li>• Bật trạng thái để người khác tìm thấy bạn</li>
            <li>• Cung cấp vị trí chính xác để tìm bạn tập gần</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default AvailabilityStatus;
