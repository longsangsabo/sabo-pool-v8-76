import React from 'react';
import { FormInput } from '@/components/common/FormInput';
import { Button } from '@/components/common/Button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface BasicProfileFormProps {
  register: any;
  handleSubmit: any;
  handleUpdateProfile: (data: any) => void;
  errors: any;
  saving: boolean;
  user: any;
  clubs: any[];
  setValue: (field: string, value: any) => void;
}

export const BasicProfileForm: React.FC<BasicProfileFormProps> = ({
  register,
  handleSubmit,
  handleUpdateProfile,
  errors,
  saving,
  user,
  clubs,
  setValue,
}) => {
  return (
    <form onSubmit={handleSubmit(handleUpdateProfile)} className='space-y-4'>
      <div>
        <Label htmlFor='nickname'>Nickname *</Label>
        <Input
          id='nickname'
          {...register('nickname', {
            required: 'Vui lòng nhập nickname',
            minLength: {
              value: 2,
              message: 'Nickname phải có ít nhất 2 ký tự',
            },
            maxLength: {
              value: 20,
              message: 'Nickname không được quá 20 ký tự',
            },
          })}
          placeholder='Biệt danh hiển thị chính trong hệ thống'
        />
        {errors.nickname && (
          <p className='text-sm text-red-600 mt-1'>
            {String(errors.nickname.message)}
          </p>
        )}
      </div>

      <div className='grid grid-cols-2 gap-4'>
        <div>
          <Label htmlFor='full_name'>Họ tên *</Label>
          <Input
            id='full_name'
            {...register('full_name', { required: 'Vui lòng nhập họ tên' })}
          />
          {errors.full_name && (
            <p className='text-sm text-red-600 mt-1'>
              {String(errors.full_name.message)}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor='phone'>Số điện thoại *</Label>
          <Input
            id='phone'
            {...register('phone', { required: 'Vui lòng nhập số điện thoại' })}
          />
          {errors.phone && (
            <p className='text-sm text-red-600 mt-1'>
              {String(errors.phone.message)}
            </p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor='email'>Email *</Label>
        <Input
          id='email'
          value={user?.email || ''}
          readOnly
          className='bg-gray-50'
        />
      </div>

      <div className='grid grid-cols-2 gap-4'>
        <div>
          <Label htmlFor='date_of_birth'>Ngày sinh</Label>
          <Input
            id='date_of_birth'
            type='date'
            {...register('date_of_birth')}
          />
        </div>
        <div>
          <Label htmlFor='gender'>Giới tính</Label>
          <Select onValueChange={value => setValue('gender', value)}>
            <SelectTrigger>
              <SelectValue placeholder='Chọn giới tính' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='Nam'>Nam</SelectItem>
              <SelectItem value='Nữ'>Nữ</SelectItem>
              <SelectItem value='Khác'>Khác</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor='club'>CLB</Label>
        <Select onValueChange={value => setValue('club_id', value)}>
          <SelectTrigger>
            <SelectValue placeholder='Chọn CLB' />
          </SelectTrigger>
          <SelectContent>
            {clubs.map(club => (
              <SelectItem key={club.id} value={club.id}>
                {club.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor='experience_years'>Năm kinh nghiệm</Label>
        <Input
          id='experience_years'
          type='number'
          min='0'
          {...register('experience_years')}
        />
      </div>

      <div>
        <Label htmlFor='address'>Địa chỉ</Label>
        <Input id='address' {...register('address')} />
      </div>

      <div>
        <Label htmlFor='bio'>Giới thiệu bản thân</Label>
        <Textarea
          id='bio'
          {...register('bio')}
          placeholder='Chia sẻ về bản thân, sở thích và mục tiêu...'
          rows={4}
        />
      </div>

      <Button type='submit' disabled={saving} className='w-full'>
        {saving ? 'Đang cập nhật...' : 'Cập nhật thông tin'}
      </Button>
    </form>
  );
};
