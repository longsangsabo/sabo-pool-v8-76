import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Shield, Users, FileText, Phone } from 'lucide-react';

import { TournamentFormData } from '@/schemas/tournamentSchema';

interface RegistrationSettingsStepProps {
  form: UseFormReturn<TournamentFormData>;
}

const RANK_OPTIONS = [
  { value: 'E+', label: 'Chuyên nghiệp tiến bộ (E+)' },
  { value: 'E', label: 'Chuyên nghiệp (E)' },
  { value: 'F+', label: 'Xuất sắc tiến bộ (F+)' },
  { value: 'F', label: 'Xuất sắc (F)' },
  { value: 'G+', label: 'Giỏi tiến bộ (G+)' },
  { value: 'G', label: 'Giỏi (G)' },
  { value: 'H+', label: 'Khá tiến bộ (H+)' },
  { value: 'H', label: 'Khá (H)' },
  { value: 'I+', label: 'Trung bình tiến bộ (I+)' },
  { value: 'I', label: 'Trung bình (I)' },
  { value: 'K+', label: 'Người mới tiến bộ (K+)' },
  { value: 'K', label: 'Người mới (K)' },
];

export const RegistrationSettingsStep: React.FC<
  RegistrationSettingsStepProps
> = ({ form }) => {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const watchedData = watch();

  return (
    <div className='space-y-6'>
      {/* Registration Period */}
      <Card>
        <CardHeader>
          <CardTitle className='text-sm flex items-center gap-2'>
            <Calendar className='h-4 w-4' />
            Thời gian đăng ký
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label
                htmlFor='registration_start'
                className='text-sm font-medium'
              >
                Mở đăng ký <span className='text-destructive'>*</span>
              </Label>
              <Input
                id='registration_start'
                type='datetime-local'
                {...register('registration_start')}
                className={
                  errors.registration_start ? 'border-destructive' : ''
                }
              />
              {errors.registration_start && (
                <p className='text-sm text-destructive'>
                  {errors.registration_start.message}
                </p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='registration_end' className='text-sm font-medium'>
                Đóng đăng ký <span className='text-destructive'>*</span>
              </Label>
              <Input
                id='registration_end'
                type='datetime-local'
                {...register('registration_end')}
                className={errors.registration_end ? 'border-destructive' : ''}
              />
              {errors.registration_end && (
                <p className='text-sm text-destructive'>
                  {errors.registration_end.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rank Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className='text-sm flex items-center gap-2'>
            <Shield className='h-4 w-4' />
            Yêu cầu hạng
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label className='text-sm font-medium'>Hạng tối thiểu</Label>
              <Select
                value={watchedData.min_rank_requirement || 'none'}
                onValueChange={value =>
                  setValue(
                    'min_rank_requirement',
                    value === 'none' ? undefined : value
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Không giới hạn' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='none'>Không giới hạn</SelectItem>
                  {RANK_OPTIONS.map(rank => (
                    <SelectItem key={rank.value} value={rank.value}>
                      <div className='flex items-center gap-2'>
                        <Badge variant='outline'>{rank.value}</Badge>
                        <span className='text-xs'>{rank.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label className='text-sm font-medium'>Hạng tối đa</Label>
              <Select
                value={watchedData.max_rank_requirement || 'none'}
                onValueChange={value =>
                  setValue(
                    'max_rank_requirement',
                    value === 'none' ? undefined : value
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Không giới hạn' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='none'>Không giới hạn</SelectItem>
                  {RANK_OPTIONS.map(rank => (
                    <SelectItem key={rank.value} value={rank.value}>
                      <div className='flex items-center gap-2'>
                        <Badge variant='outline'>{rank.value}</Badge>
                        <span className='text-xs'>{rank.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registration Settings */}
      <Card>
        <CardHeader>
          <CardTitle className='text-sm flex items-center gap-2'>
            <Users className='h-4 w-4' />
            Cài đặt đăng ký
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center space-x-2'>
            <Checkbox
              id='is_public'
              checked={watchedData.is_public}
              onCheckedChange={checked => setValue('is_public', !!checked)}
            />
            <Label htmlFor='is_public' className='text-sm cursor-pointer'>
              Công khai (mọi người có thể xem)
            </Label>
          </div>

          <div className='flex items-center space-x-2'>
            <Checkbox
              id='requires_approval'
              checked={watchedData.requires_approval}
              onCheckedChange={checked =>
                setValue('requires_approval', !!checked)
              }
            />
            <Label
              htmlFor='requires_approval'
              className='text-sm cursor-pointer'
            >
              Yêu cầu phê duyệt đăng ký
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle className='text-sm flex items-center gap-2'>
            <FileText className='h-4 w-4' />
            Thông tin bổ sung
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='rules' className='text-sm font-medium'>
              Luật lệ giải đấu
            </Label>
            <Textarea
              id='rules'
              placeholder='Nhập luật lệ và quy định chi tiết của giải đấu...'
              rows={4}
              {...register('rules')}
              className={errors.rules ? 'border-destructive' : ''}
            />
            {errors.rules && (
              <p className='text-sm text-destructive'>{errors.rules.message}</p>
            )}
          </div>

          <div className='space-y-2'>
            <Label
              htmlFor='contact_info'
              className='text-sm font-medium flex items-center gap-2'
            >
              <Phone className='h-4 w-4' />
              Thông tin liên hệ
            </Label>
            <Input
              id='contact_info'
              placeholder='Email hoặc số điện thoại liên hệ'
              {...register('contact_info')}
              className={errors.contact_info ? 'border-destructive' : ''}
            />
            {errors.contact_info && (
              <p className='text-sm text-destructive'>
                {errors.contact_info.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
