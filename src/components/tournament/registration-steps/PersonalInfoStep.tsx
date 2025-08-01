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
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  User,
  Phone,
  Mail,
  Calendar,
  AlertTriangle,
  Shield,
  FileText,
  Trophy,
} from 'lucide-react';

import {
  TournamentRegistrationFormData,
  REGISTRATION_RANKS,
  EXPERIENCE_LEVELS,
} from '@/schemas/tournamentRegistrationSchema';

interface PersonalInfoStepProps {
  form: UseFormReturn<TournamentRegistrationFormData>;
  selectedTournament: any;
}

export const PersonalInfoStep: React.FC<PersonalInfoStepProps> = ({
  form,
  selectedTournament,
}) => {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;
  const watchedData = watch();

  const checkRankEligibility = (rank: string): boolean => {
    if (!selectedTournament) return true;

    if (selectedTournament.min_rank_requirement) {
      const minRank = REGISTRATION_RANKS.find(
        r => r.value === selectedTournament.min_rank_requirement
      );
      const currentRank = REGISTRATION_RANKS.find(r => r.value === rank);

      if (minRank && currentRank) {
        const minIndex = REGISTRATION_RANKS.indexOf(minRank);
        const currentIndex = REGISTRATION_RANKS.indexOf(currentRank);

        if (currentIndex < minIndex) return false;
      }
    }

    if (selectedTournament.max_rank_requirement) {
      const maxRank = REGISTRATION_RANKS.find(
        r => r.value === selectedTournament.max_rank_requirement
      );
      const currentRank = REGISTRATION_RANKS.find(r => r.value === rank);

      if (maxRank && currentRank) {
        const maxIndex = REGISTRATION_RANKS.indexOf(maxRank);
        const currentIndex = REGISTRATION_RANKS.indexOf(currentRank);

        if (currentIndex > maxIndex) return false;
      }
    }

    return true;
  };

  return (
    <div className='space-y-6'>
      <div className='text-center'>
        <h3 className='text-lg font-semibold mb-2'>Thông tin cá nhân</h3>
        <p className='text-muted-foreground'>
          Vui lòng cung cấp thông tin chính xác để hoàn tất đăng ký
        </p>
      </div>

      {/* Tournament Info Banner */}
      {selectedTournament && (
        <Card className='bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-lg flex items-center gap-2'>
              <Trophy className='h-5 w-5 text-primary' />
              {selectedTournament.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex flex-wrap gap-2'>
              <Badge variant='secondary'>Hạng {selectedTournament.tier}</Badge>
              <Badge variant='outline'>
                Phí: {selectedTournament.entry_fee?.toLocaleString('vi-VN')}đ
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className='text-base flex items-center gap-2'>
            <User className='h-4 w-4' />
            Thông tin cá nhân
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* Full Name */}
          <div className='space-y-2'>
            <Label htmlFor='player_name' className='text-sm font-medium'>
              Họ và tên <span className='text-destructive'>*</span>
            </Label>
            <Input
              id='player_name'
              placeholder='VD: Nguyễn Văn An'
              {...register('player_name')}
              className={errors.player_name ? 'border-destructive' : ''}
            />
            {errors.player_name && (
              <p className='text-sm text-destructive'>
                {errors.player_name.message}
              </p>
            )}
          </div>

          {/* Phone & Email */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label
                htmlFor='phone'
                className='text-sm font-medium flex items-center gap-2'
              >
                <Phone className='h-4 w-4' />
                Số điện thoại <span className='text-destructive'>*</span>
              </Label>
              <Input
                id='phone'
                placeholder='0901234567'
                {...register('phone')}
                className={errors.phone ? 'border-destructive' : ''}
              />
              {errors.phone && (
                <p className='text-sm text-destructive'>
                  {errors.phone.message}
                </p>
              )}
            </div>

            <div className='space-y-2'>
              <Label
                htmlFor='email'
                className='text-sm font-medium flex items-center gap-2'
              >
                <Mail className='h-4 w-4' />
                Email (tùy chọn)
              </Label>
              <Input
                id='email'
                type='email'
                placeholder='your.email@example.com'
                {...register('email')}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className='text-sm text-destructive'>
                  {errors.email.message}
                </p>
              )}
            </div>
          </div>

          {/* Age & Emergency Contact */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label
                htmlFor='age'
                className='text-sm font-medium flex items-center gap-2'
              >
                <Calendar className='h-4 w-4' />
                Tuổi <span className='text-destructive'>*</span>
              </Label>
              <Input
                id='age'
                type='number'
                min='16'
                max='80'
                placeholder='25'
                {...register('age', { valueAsNumber: true })}
                className={errors.age ? 'border-destructive' : ''}
              />
              {errors.age && (
                <p className='text-sm text-destructive'>{errors.age.message}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label
                htmlFor='emergency_contact'
                className='text-sm font-medium'
              >
                Liên hệ khẩn cấp
              </Label>
              <Input
                id='emergency_contact'
                placeholder='Số điện thoại người thân'
                {...register('emergency_contact')}
                className={errors.emergency_contact ? 'border-destructive' : ''}
              />
              {errors.emergency_contact && (
                <p className='text-sm text-destructive'>
                  {errors.emergency_contact.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ranking Information */}
      <Card>
        <CardHeader>
          <CardTitle className='text-base flex items-center gap-2'>
            <Shield className='h-4 w-4' />
            Thông tin hạng đấu
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {/* Current Rank */}
            <div className='space-y-2'>
              <Label className='text-sm font-medium'>
                Hạng hiện tại <span className='text-destructive'>*</span>
              </Label>
              <Select
                value={watchedData.current_rank}
                onValueChange={value => setValue('current_rank', value)}
              >
                <SelectTrigger
                  className={errors.current_rank ? 'border-destructive' : ''}
                >
                  <SelectValue placeholder='Chọn hạng của bạn' />
                </SelectTrigger>
                <SelectContent>
                  {REGISTRATION_RANKS.map(rank => {
                    const isEligible = checkRankEligibility(rank.value);

                    return (
                      <SelectItem
                        key={rank.value}
                        value={rank.value}
                        disabled={!isEligible}
                      >
                        <div className='flex items-center gap-2'>
                          <Badge variant={isEligible ? 'outline' : 'secondary'}>
                            {rank.value}
                          </Badge>
                          <span
                            className={
                              !isEligible ? 'text-muted-foreground' : ''
                            }
                          >
                            {rank.label}
                          </span>
                          {!isEligible && (
                            <span className='text-xs text-destructive'>
                              (Không đủ điều kiện)
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {errors.current_rank && (
                <p className='text-sm text-destructive'>
                  {errors.current_rank.message}
                </p>
              )}
            </div>

            {/* Tournament Experience */}
            <div className='space-y-2'>
              <Label className='text-sm font-medium'>
                Kinh nghiệm thi đấu <span className='text-destructive'>*</span>
              </Label>
              <Select
                value={watchedData.tournament_experience}
                onValueChange={value =>
                  setValue('tournament_experience', value as any)
                }
              >
                <SelectTrigger
                  className={
                    errors.tournament_experience ? 'border-destructive' : ''
                  }
                >
                  <SelectValue placeholder='Chọn kinh nghiệm' />
                </SelectTrigger>
                <SelectContent>
                  {EXPERIENCE_LEVELS.map(level => (
                    <SelectItem key={level.value} value={level.value}>
                      <div>
                        <div className='font-medium'>{level.label}</div>
                        <div className='text-xs text-muted-foreground'>
                          {level.description}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.tournament_experience && (
                <p className='text-sm text-destructive'>
                  {errors.tournament_experience.message}
                </p>
              )}
            </div>
          </div>

          {/* Rank Requirements Alert */}
          {selectedTournament &&
            (selectedTournament.min_rank_requirement ||
              selectedTournament.max_rank_requirement) && (
              <Alert>
                <AlertTriangle className='h-4 w-4' />
                <AlertDescription>
                  <strong>Yêu cầu hạng cho giải này:</strong>
                  <br />
                  {selectedTournament.min_rank_requirement && (
                    <>Tối thiểu: {selectedTournament.min_rank_requirement}</>
                  )}
                  {selectedTournament.min_rank_requirement &&
                    selectedTournament.max_rank_requirement && <br />}
                  {selectedTournament.max_rank_requirement && (
                    <>Tối đa: {selectedTournament.max_rank_requirement}</>
                  )}
                </AlertDescription>
              </Alert>
            )}
        </CardContent>
      </Card>

      {/* Additional Notes */}
      <Card>
        <CardHeader>
          <CardTitle className='text-base flex items-center gap-2'>
            <FileText className='h-4 w-4' />
            Ghi chú thêm
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-2'>
            <Label htmlFor='notes' className='text-sm font-medium'>
              Ghi chú (tùy chọn)
            </Label>
            <Textarea
              id='notes'
              rows={3}
              placeholder='Ví dụ: Yêu cầu đặc biệt, lịch trình cá nhân, v.v...'
              {...register('notes')}
              className={errors.notes ? 'border-destructive' : ''}
            />
            {errors.notes && (
              <p className='text-sm text-destructive'>{errors.notes.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Terms and Agreements */}
      <Card>
        <CardHeader>
          <CardTitle className='text-base flex items-center gap-2'>
            <Shield className='h-4 w-4' />
            Điều khoản và quy định
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-start space-x-2'>
            <Checkbox
              id='agree_terms'
              checked={watchedData.agree_terms}
              onCheckedChange={checked => setValue('agree_terms', !!checked)}
            />
            <Label
              htmlFor='agree_terms'
              className='text-sm leading-relaxed cursor-pointer'
            >
              Tôi đồng ý với <strong>điều lệ giải đấu</strong> và cam kết tuân
              thủ các quy định về thời gian, địa điểm và cách thức thi đấu.
            </Label>
          </div>
          {errors.agree_terms && (
            <p className='text-sm text-destructive ml-6'>
              {errors.agree_terms.message}
            </p>
          )}

          <div className='flex items-start space-x-2'>
            <Checkbox
              id='agree_rules'
              checked={watchedData.agree_rules}
              onCheckedChange={checked => setValue('agree_rules', !!checked)}
            />
            <Label
              htmlFor='agree_rules'
              className='text-sm leading-relaxed cursor-pointer'
            >
              Tôi đồng ý với <strong>quy tắc thi đấu</strong> và chấp nhận quyết
              định của ban tổ chức là quyết định cuối cùng.
            </Label>
          </div>
          {errors.agree_rules && (
            <p className='text-sm text-destructive ml-6'>
              {errors.agree_rules.message}
            </p>
          )}

          <Alert>
            <Shield className='h-4 w-4' />
            <AlertDescription className='text-xs'>
              Bằng việc đăng ký, bạn đồng ý cho phép BTC sử dụng hình ảnh/video
              trong quá trình thi đấu cho mục đích quảng bá và lưu trữ.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};
