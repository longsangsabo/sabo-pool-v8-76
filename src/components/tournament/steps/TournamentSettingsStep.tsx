import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, DollarSign, Trophy, Settings, Target } from 'lucide-react';

import {
  TournamentFormData,
  PARTICIPANT_SLOTS,
  TOURNAMENT_FORMATS,
  GAME_FORMATS,
} from '@/schemas/tournamentSchema';
import { useTournamentTiers } from '@/hooks/useTournamentTiers';

interface TournamentSettingsStepProps {
  form: UseFormReturn<TournamentFormData>;
}

export const TournamentSettingsStep: React.FC<TournamentSettingsStepProps> = ({
  form,
}) => {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;
  const { getTierByLevel, getSuggestedEntryFees } = useTournamentTiers();

  const watchedData = watch();
  const selectedTierLevel = watchedData.tier_level;
  const maxParticipants = watchedData.max_participants;
  const entryFee = watchedData.entry_fee || 0;
  const prizePool = watchedData.prize_pool || 0;

  const selectedTier = getTierByLevel(selectedTierLevel);
  const suggestedFees = selectedTierLevel
    ? getSuggestedEntryFees(selectedTierLevel)
    : null;

  // Calculate suggested prize pool based on participants and entry fee
  const suggestedPrizePool = maxParticipants * entryFee * 0.8; // 80% of total collected

  const calculatePrizeDistribution = (total: number) => ({
    first: Math.floor(total * 0.5),
    second: Math.floor(total * 0.3),
    third: Math.floor(total * 0.2),
  });

  const prizeDistribution = calculatePrizeDistribution(prizePool);

  return (
    <div className='space-y-8'>
      {/* Participants Section */}
      <div className='form-section bg-gradient-to-r from-background to-blue-50 rounded-lg p-6 border border-blue-200'>
        <h3 className='section-title text-lg font-semibold text-foreground mb-6 pb-3 border-b border-blue-300 flex items-center gap-2'>
          <Users className='h-5 w-5 text-blue-600' />
          Số lượng tham gia
        </h3>

        <div className='space-y-4'>
          <Label className='text-sm font-semibold flex items-center gap-2'>
            <div className='w-2 h-2 bg-destructive rounded-full'></div>
            Chọn số người tham gia
          </Label>

          {/* Enhanced Participant Selection Grid */}
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
            {PARTICIPANT_SLOTS.map(slot => (
              <button
                key={slot}
                type='button'
                onClick={() => setValue('max_participants', slot)}
                className={`
                  p-4 rounded-xl border-2 transition-all duration-200 text-center hover:shadow-md
                  ${
                    maxParticipants === slot
                      ? 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                      : 'border-muted hover:border-primary/50 bg-background hover:bg-primary/5'
                  }
                `}
              >
                <div className='font-bold text-lg'>{slot}</div>
                <div className='text-xs opacity-80'>người</div>
              </button>
            ))}
          </div>

          {errors.max_participants && (
            <p className='text-sm text-destructive flex items-center gap-1'>
              <span className='w-1 h-1 bg-destructive rounded-full'></span>
              {errors.max_participants.message}
            </p>
          )}

          {maxParticipants && (
            <div className='bg-primary/10 rounded-lg p-3 text-sm'>
              <p className='font-medium text-primary'>
                Đã chọn: {maxParticipants} người tham gia
              </p>
              <p className='text-xs text-muted-foreground mt-1'>
                Số vòng đấu loại trực tiếp:{' '}
                {Math.ceil(Math.log2(maxParticipants))} vòng
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tournament Format Section */}
      <div className='form-section bg-gradient-to-r from-background to-purple-50 rounded-lg p-6 border border-purple-200'>
        <h3 className='section-title text-lg font-semibold text-foreground mb-6 pb-3 border-b border-purple-300 flex items-center gap-2'>
          <Settings className='h-5 w-5 text-purple-600' />
          Định dạng giải đấu
        </h3>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='space-y-3'>
            <Label className='text-sm font-semibold flex items-center gap-2'>
              <div className='w-2 h-2 bg-destructive rounded-full'></div>
              Hình thức thi đấu
            </Label>
            <Select
              value={watchedData.tournament_type}
              onValueChange={value => {
                console.log('🔥 TOURNAMENT TYPE SELECTED:', value);
                console.log('🔥 Available formats:', TOURNAMENT_FORMATS);
                setValue('tournament_type', value as any);
                console.log(
                  '🔥 After setValue, form tournament_type:',
                  form.getValues('tournament_type')
                );
              }}
            >
              <SelectTrigger
                className={`h-12 ${errors.tournament_type ? 'border-destructive focus:border-destructive' : 'focus:border-purple-500'} transition-colors`}
              >
                <SelectValue placeholder='Chọn hình thức' />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TOURNAMENT_FORMATS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    <div className='flex items-center gap-2'>
                      <Badge variant='outline' className='text-xs'>
                        {key}
                      </Badge>
                      <span>{label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.tournament_type && (
              <p className='text-sm text-destructive flex items-center gap-1'>
                <span className='w-1 h-1 bg-destructive rounded-full'></span>
                {errors.tournament_type.message}
              </p>
            )}
          </div>

          <div className='space-y-3'>
            <Label className='text-sm font-semibold flex items-center gap-2'>
              <div className='w-2 h-2 bg-destructive rounded-full'></div>
              Môn thi đấu
            </Label>
            <Select
              value={watchedData.game_format}
              onValueChange={value => setValue('game_format', value as any)}
            >
              <SelectTrigger
                className={`h-12 ${errors.game_format ? 'border-destructive focus:border-destructive' : 'focus:border-purple-500'} transition-colors`}
              >
                <SelectValue placeholder='Chọn môn' />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(GAME_FORMATS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    <div className='flex items-center gap-2'>
                      <Target className='h-3 w-3' />
                      <span>{label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.game_format && (
              <p className='text-sm text-destructive flex items-center gap-1'>
                <span className='w-1 h-1 bg-destructive rounded-full'></span>
                {errors.game_format.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Entry Fee Section */}
      <div className='form-section bg-gradient-to-r from-background to-green-50 rounded-lg p-6 border border-green-200'>
        <h3 className='section-title text-lg font-semibold text-foreground mb-6 pb-3 border-b border-green-300 flex items-center gap-2'>
          <DollarSign className='h-5 w-5 text-green-600' />
          Phí tham gia
        </h3>

        <div className='space-y-4'>
          <div className='space-y-3'>
            <Label
              htmlFor='entry_fee'
              className='text-sm font-semibold flex items-center gap-2'
            >
              <div className='w-2 h-2 bg-destructive rounded-full'></div>
              Phí đăng ký (VNĐ)
            </Label>
            <Input
              id='entry_fee'
              type='number'
              min='0'
              step='1000'
              placeholder='0'
              {...register('entry_fee', { valueAsNumber: true })}
              className={`h-12 text-lg ${errors.entry_fee ? 'border-destructive focus:border-destructive' : 'focus:border-green-500'} transition-colors`}
            />
            {errors.entry_fee && (
              <p className='text-sm text-destructive flex items-center gap-1'>
                <span className='w-1 h-1 bg-destructive rounded-full'></span>
                {errors.entry_fee.message}
              </p>
            )}
          </div>

          {selectedTier && suggestedFees && (
            <div className='bg-green-100 rounded-lg p-4 border border-green-200'>
              <div className='text-sm space-y-2'>
                <div className='font-medium text-green-800'>
                  Phí đề xuất cho {selectedTier.tier_name}:
                </div>
                <div className='text-green-700'>
                  {suggestedFees.min.toLocaleString('vi-VN')}đ -{' '}
                  {suggestedFees.max.toLocaleString('vi-VN')}đ
                </div>
                <div className='flex items-center gap-2 text-xs'>
                  <Badge variant='outline' className='bg-white'>
                    Level {selectedTier.tier_level}
                  </Badge>
                  <span className='text-green-600'>•</span>
                  <span className='text-green-600'>
                    Hệ số SPA: x{selectedTier.points_multiplier}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Prize Pool Section */}
      <div className='form-section bg-gradient-to-r from-background to-yellow-50 rounded-lg p-6 border border-yellow-200'>
        <h3 className='section-title text-lg font-semibold text-foreground mb-6 pb-3 border-b border-yellow-300 flex items-center gap-2'>
          <Trophy className='h-5 w-5 text-yellow-600' />
          Giải thưởng
        </h3>

        <div className='space-y-6'>
          <div className='space-y-3'>
            <Label
              htmlFor='prize_pool'
              className='text-sm font-semibold flex items-center gap-2'
            >
              <div className='w-2 h-2 bg-destructive rounded-full'></div>
              Tổng giải thưởng (VNĐ)
            </Label>
            <div className='flex gap-3'>
              <Input
                id='prize_pool'
                type='number'
                min='0'
                step='1000'
                placeholder='0'
                {...register('prize_pool', { valueAsNumber: true })}
                className={`h-12 text-lg flex-1 ${errors.prize_pool ? 'border-destructive focus:border-destructive' : 'focus:border-yellow-500'} transition-colors`}
              />
              {maxParticipants && entryFee > 0 && (
                <button
                  type='button'
                  onClick={() => setValue('prize_pool', suggestedPrizePool)}
                  className='px-4 py-2 text-sm bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border border-yellow-300 rounded-lg transition-colors font-medium'
                >
                  Gợi ý: {suggestedPrizePool.toLocaleString('vi-VN')}đ
                </button>
              )}
            </div>
            {errors.prize_pool && (
              <p className='text-sm text-destructive flex items-center gap-1'>
                <span className='w-1 h-1 bg-destructive rounded-full'></span>
                {errors.prize_pool.message}
              </p>
            )}
          </div>

          {/* Enhanced Prize Distribution Preview */}
          {prizePool > 0 && (
            <Card className='border-yellow-200 bg-gradient-to-b from-yellow-50 to-background'>
              <CardHeader className='pb-4'>
                <CardTitle className='text-base flex items-center gap-2'>
                  <Trophy className='h-4 w-4 text-yellow-600' />
                  Phân chia giải thưởng
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                  <div className='bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-lg p-4 text-center text-white'>
                    <div className='text-2xl font-bold'>🥇</div>
                    <div className='text-xs font-medium mt-1'>
                      Vô địch (50%)
                    </div>
                    <div className='text-lg font-bold mt-2'>
                      {prizeDistribution.first.toLocaleString('vi-VN')}đ
                    </div>
                  </div>
                  <div className='bg-gradient-to-r from-gray-300 to-gray-400 rounded-lg p-4 text-center text-white'>
                    <div className='text-2xl font-bold'>🥈</div>
                    <div className='text-xs font-medium mt-1'>Á quân (30%)</div>
                    <div className='text-lg font-bold mt-2'>
                      {prizeDistribution.second.toLocaleString('vi-VN')}đ
                    </div>
                  </div>
                  <div className='bg-gradient-to-r from-amber-600 to-amber-700 rounded-lg p-4 text-center text-white'>
                    <div className='text-2xl font-bold'>🥉</div>
                    <div className='text-xs font-medium mt-1'>
                      Hạng ba (20%)
                    </div>
                    <div className='text-lg font-bold mt-2'>
                      {prizeDistribution.third.toLocaleString('vi-VN')}đ
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enhanced Revenue Calculation */}
          {maxParticipants && entryFee > 0 && (
            <div className='bg-gradient-to-r from-muted/50 to-muted/30 rounded-lg p-4 border border-muted'>
              <h4 className='font-semibold text-sm mb-3 flex items-center gap-2'>
                <DollarSign className='h-4 w-4' />
                Tính toán tài chính
              </h4>
              <div className='space-y-2 text-sm'>
                <div className='flex justify-between items-center'>
                  <span className='text-muted-foreground'>
                    Tổng thu từ phí đăng ký:
                  </span>
                  <span className='font-semibold text-green-600'>
                    {(maxParticipants * entryFee).toLocaleString('vi-VN')}đ
                  </span>
                </div>
                <div className='flex justify-between items-center'>
                  <span className='text-muted-foreground'>
                    Tổng giải thưởng:
                  </span>
                  <span className='font-semibold text-yellow-600'>
                    -{prizePool.toLocaleString('vi-VN')}đ
                  </span>
                </div>
                <div className='border-t border-muted/50 pt-2 mt-2'>
                  <div className='flex justify-between items-center'>
                    <span className='font-semibold'>Lợi nhuận ròng:</span>
                    <span
                      className={`font-bold text-lg ${maxParticipants * entryFee - prizePool >= 0 ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {maxParticipants * entryFee - prizePool >= 0 ? '+' : ''}
                      {(maxParticipants * entryFee - prizePool).toLocaleString(
                        'vi-VN'
                      )}
                      đ
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
