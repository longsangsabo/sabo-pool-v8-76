import React, { useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Calendar,
  FileText,
  Phone,
  Shield,
  Clock,
  User,
  Building2,
} from 'lucide-react';
import { AutoFillInput } from '@/components/common/AutoFillInput';
import { useAuth } from '@/hooks/useAuth';
import { useProfileContext } from '@/contexts/ProfileContext';
import { toast } from 'sonner';

interface AdvancedSettingsSectionProps {
  form: UseFormReturn<any>;
}

export const AdvancedSettingsSection: React.FC<
  AdvancedSettingsSectionProps
> = ({ form }) => {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = form;
  const watchedData = watch();
  const { user } = useAuth();
  const { playerProfile, clubProfile } = useProfileContext();

  // Tournament rules template
  const tournamentRulesTemplate = `LUẬT LỆ GIẢI ĐẤU BIDA

1. QUY ĐỊNH CHUNG
- Tất cả người chơi phải tuân thủ luật chơi và quyết định của trọng tài
- Thời gian đến muộn >15 phút sẽ bị xử thua
- Không được sử dụng điện thoại khi thi đấu

2. LUẬT THI ĐẤU
- Áp dụng luật WPA 9-Ball
- Race to ${watchedData.race_to || 5}
- Người thắng break ván tiếp theo
- Đánh bi rõ ràng, không fouls liên tiếp

3. GIẢI QUYẾT TRANH CHẤP
- Mọi tranh chấp sẽ do trọng tài giải quyết
- Quyết định của BTC là quyết định cuối cùng

4. PHẦN THƯỞNG
- Giải thưởng sẽ được trao ngay sau khi kết thúc giải đấu
- Người chơi phải có mặt khi nhận giải`;

  // Auto-fill functions
  const handleAutoFillRegistrationStart = () => {
    const now = new Date();
    const value = now.toISOString().slice(0, 16);
    setValue('registration_start', value, {
      shouldValidate: true,
      shouldDirty: true,
    });

    // Add animation class to input
    const element = document.getElementById('registration_start');
    if (element) {
      element.classList.add('animate-pulse');
      setTimeout(() => element.classList.remove('animate-pulse'), 1000);
    }

    toast.success('Đã điền thời gian mở đăng ký');
  };

  const handleAutoFillRegistrationEnd = () => {
    const tournamentStart = watchedData.tournament_start;
    if (!tournamentStart) {
      toast.error('Vui lòng chọn thời gian bắt đầu giải đấu trước');
      return;
    }

    const startDate = new Date(tournamentStart);
    const registrationEnd = new Date(startDate);
    registrationEnd.setDate(startDate.getDate() - 1);

    const value = registrationEnd.toISOString().slice(0, 16);
    setValue('registration_end', value, {
      shouldValidate: true,
      shouldDirty: true,
    });

    // Add animation class to input
    const element = document.getElementById('registration_end');
    if (element) {
      element.classList.add('animate-pulse');
      setTimeout(() => element.classList.remove('animate-pulse'), 1000);
    }

    toast.success('Đã điền thời gian đóng đăng ký (1 ngày trước giải đấu)');
  };

  const handleAutoFillContactInfo = () => {
    let contactInfo = '';

    if (clubProfile?.phone) {
      contactInfo = clubProfile.phone;
    } else if (clubProfile?.email) {
      contactInfo = clubProfile.email;
    } else if (playerProfile?.phone) {
      contactInfo = playerProfile.phone;
    } else if (playerProfile?.email) {
      contactInfo = playerProfile.email;
    } else if (user?.email) {
      contactInfo = user.email;
    }

    if (contactInfo) {
      setValue('contact_info', contactInfo, {
        shouldValidate: true,
        shouldDirty: true,
      });

      // Add animation class to input
      const element = document.getElementById('contact_info');
      if (element) {
        element.classList.add('animate-pulse');
        setTimeout(() => element.classList.remove('animate-pulse'), 1000);
      }

      toast.success('Đã điền thông tin liên hệ từ hồ sơ của bạn');
    } else {
      toast.error('Không tìm thấy thông tin liên hệ trong hồ sơ của bạn');
    }
  };

  const handleAutoFillRules = () => {
    setValue('rules', tournamentRulesTemplate, {
      shouldValidate: true,
      shouldDirty: true,
    });

    // Add animation class to textarea
    const element = document.getElementById('rules');
    if (element) {
      element.classList.add('animate-pulse');
      setTimeout(() => element.classList.remove('animate-pulse'), 1000);
    }

    toast.success('Đã điền mẫu luật lệ giải đấu');
  };

  // Auto-fill registration start time on component mount
  useEffect(() => {
    if (!watchedData.registration_start) {
      const now = new Date();
      setValue('registration_start', now.toISOString().slice(0, 16));
    }
  }, [setValue, watchedData.registration_start]);

  // Auto-update registration end when tournament start changes
  useEffect(() => {
    if (watchedData.tournament_start && !watchedData.registration_end) {
      const startDate = new Date(watchedData.tournament_start);
      const registrationEnd = new Date(startDate);
      registrationEnd.setHours(registrationEnd.getHours() - 2); // 2 hours before tournament
      setValue('registration_end', registrationEnd.toISOString().slice(0, 16));
    }
  }, [watchedData.tournament_start, setValue, watchedData.registration_end]);

  return (
    <div className='space-y-3'>
      {/* Compact Registration Period */}
      <div className='space-y-2'>
        <h4 className='text-xs font-medium flex items-center gap-2 text-primary'>
          <Calendar className='h-3 w-3' />
          Thời gian đăng ký
        </h4>
        <div className='grid grid-cols-2 gap-2'>
          <div className='space-y-1'>
            <Label htmlFor='registration_start' className='text-xs'>
              Mở đăng ký
            </Label>
            <div className='flex gap-1'>
              <Input
                id='registration_start'
                type='datetime-local'
                {...register('registration_start')}
                className='flex-1 h-8 text-xs'
              />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={handleAutoFillRegistrationStart}
                      className='h-8 px-2'
                    >
                      <Clock className='h-3 w-3' />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Bây giờ</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <div className='space-y-1'>
            <Label htmlFor='registration_end' className='text-xs'>
              Đóng đăng ký
            </Label>
            <div className='flex gap-1'>
              <Input
                id='registration_end'
                type='datetime-local'
                {...register('registration_end')}
                className='flex-1 h-8 text-xs'
              />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={handleAutoFillRegistrationEnd}
                      disabled={!watchedData.tournament_start}
                      className='h-8 px-2'
                    >
                      <Calendar className='h-3 w-3' />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>1 ngày trước</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Contact Information */}
      <div className='space-y-1'>
        <Label
          htmlFor='contact_info'
          className='text-xs font-medium flex items-center gap-2'
        >
          <Phone className='h-3 w-3' />
          Thông tin liên hệ
        </Label>
        <div className='flex gap-1'>
          <Input
            id='contact_info'
            placeholder='Email hoặc SĐT liên hệ'
            {...register('contact_info')}
            className='flex-1 h-8 text-sm'
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={handleAutoFillContactInfo}
                  disabled={
                    !clubProfile?.phone &&
                    !clubProfile?.email &&
                    !playerProfile?.phone &&
                    !playerProfile?.email &&
                    !user?.email
                  }
                  className='h-8 px-2'
                >
                  <User className='h-3 w-3' />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Dùng thông tin từ hồ sơ</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Compact Rules */}
      <div className='space-y-1'>
        <div className='flex items-center justify-between'>
          <Label
            htmlFor='rules'
            className='text-xs font-medium flex items-center gap-2'
          >
            <FileText className='h-3 w-3' />
            Luật lệ giải đấu
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={handleAutoFillRules}
                  className='h-6 px-2 text-xs'
                >
                  <FileText className='h-3 w-3 mr-1' />
                  Mẫu
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Điền mẫu luật lệ</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Textarea
          id='rules'
          placeholder='Luật lệ chi tiết (tùy chọn)...'
          rows={3}
          {...register('rules')}
          className='text-sm'
        />
      </div>

      {/* Compact Privacy Settings */}
      <div className='space-y-2'>
        <h4 className='text-xs font-medium flex items-center gap-2 text-primary'>
          <Shield className='h-3 w-3' />
          Quyền riêng tư
        </h4>
        <div className='space-y-2'>
          <div className='flex items-center space-x-2'>
            <Checkbox
              id='is_public'
              checked={watchedData.is_public}
              onCheckedChange={checked => setValue('is_public', !!checked)}
            />
            <Label htmlFor='is_public' className='text-xs cursor-pointer'>
              Công khai
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
              className='text-xs cursor-pointer'
            >
              Phê duyệt đăng ký
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
};
