import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Info, Users, Trophy, Gamepad2, Medal } from 'lucide-react';
import { TournamentFormData } from '@/types/tournament-extended';
import { TournamentType, GameFormat } from '@/types/tournament-enums';
import {
  PARTICIPANT_SLOTS,
  TOURNAMENT_FORMATS,
  GAME_FORMATS,
} from '@/schemas/tournamentSchema';
import { RANK_ELO } from '@/utils/eloConstants';

interface TournamentSettingsSectionProps {
  form: UseFormReturn<TournamentFormData>;
}

export const TournamentSettingsSection: React.FC<
  TournamentSettingsSectionProps
> = ({ form }) => {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = form;
  const watchedData = watch();

  // Calculate estimated duration based on participants and format
  const getEstimatedDuration = (
    participants: number,
    format: TournamentType
  ): string => {
    const baseTime = {
      [TournamentType.SINGLE_ELIMINATION]: participants * 30, // 30 minutes per participant
      [TournamentType.DOUBLE_ELIMINATION]: participants * 45, // 45 minutes per participant
      [TournamentType.ROUND_ROBIN]: participants * participants * 15, // More complex calculation
      [TournamentType.SWISS]: participants * 40, // 40 minutes per participant
    };

    const minutes = baseTime[format] || participants * 30;
    const hours = Math.ceil(minutes / 60);

    if (hours < 24) {
      return `~${hours} giờ`;
    } else {
      const days = Math.ceil(hours / 24);
      return `~${days} ngày`;
    }
  };

  const handleParticipantsChange = (value: string) => {
    const participants = parseInt(value);
    setValue('max_participants', participants, { shouldValidate: true });
  };

  return (
    <div className='space-y-3'>
      {/* Compact Participants */}
      <div className='space-y-2'>
        <div className='flex items-center gap-2'>
          <Users className='h-4 w-4 text-primary' />
          <Label className='text-xs font-medium'>Số người tham gia</Label>
        </div>

        <div className='grid grid-cols-4 gap-1'>
          {PARTICIPANT_SLOTS.map(slot => (
            <button
              key={slot}
              type='button'
              onClick={() => handleParticipantsChange(slot.toString())}
              className={`p-2 border rounded text-center transition-all ${
                watchedData.max_participants === slot
                  ? 'border-primary bg-primary/10 text-primary font-medium'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
              }`}
            >
              <div className='text-sm font-semibold'>{slot}</div>
              <div className='text-xs text-muted-foreground'>người</div>
            </button>
          ))}
        </div>

        {errors.max_participants && (
          <p className='text-xs text-destructive'>
            {String(errors.max_participants.message)}
          </p>
        )}

        {watchedData.max_participants && watchedData.tournament_type && (
          <div className='flex items-center gap-1 text-xs text-muted-foreground'>
            <Info className='h-3 w-3' />
            <span>
              Ước tính:{' '}
              {getEstimatedDuration(
                watchedData.max_participants,
                watchedData.tournament_type
              )}
            </span>
          </div>
        )}
      </div>

      {/* Rank Selection */}
      <div className='space-y-2'>
        <div className='flex items-center gap-2'>
          <Medal className='h-4 w-4 text-primary' />
          <Label className='text-xs font-medium'>Giới hạn hạng tham gia</Label>
        </div>

        <div className='space-y-3'>
          <div className='grid grid-cols-2 gap-3'>
            <div className='space-y-1'>
              <Label className='text-xs text-muted-foreground'>
                Hạng thấp nhất
              </Label>
              <select
                value={watchedData.min_rank_requirement || ''}
                onChange={e =>
                  setValue('min_rank_requirement', e.target.value as any, {
                    shouldValidate: true,
                  })
                }
                className='w-full h-8 px-2 text-sm border border-border rounded bg-background hover:bg-muted/50 focus:border-primary focus:outline-none'
              >
                <option value=''>Không giới hạn</option>
                {Object.keys(RANK_ELO).map(rank => (
                  <option key={rank} value={rank}>
                    {rank}
                  </option>
                ))}
              </select>
            </div>

            <div className='space-y-1'>
              <Label className='text-xs text-muted-foreground'>
                Hạng cao nhất
              </Label>
              <select
                value={watchedData.max_rank_requirement || ''}
                onChange={e =>
                  setValue('max_rank_requirement', e.target.value as any, {
                    shouldValidate: true,
                  })
                }
                className='w-full h-8 px-2 text-sm border border-border rounded bg-background hover:bg-muted/50 focus:border-primary focus:outline-none'
              >
                <option value=''>Không giới hạn</option>
                {Object.keys(RANK_ELO).map(rank => (
                  <option key={rank} value={rank}>
                    {rank}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(watchedData.min_rank_requirement ||
            watchedData.max_rank_requirement) && (
            <div className='p-2 bg-blue-50/50 rounded border border-blue-200'>
              <div className='flex items-center gap-1 text-xs text-blue-700'>
                <Info className='h-3 w-3' />
                <span>
                  {watchedData.min_rank_requirement &&
                  watchedData.max_rank_requirement
                    ? `Chỉ cho phép hạng từ ${watchedData.min_rank_requirement} đến ${watchedData.max_rank_requirement}`
                    : watchedData.min_rank_requirement
                      ? `Chỉ cho phép hạng ${watchedData.min_rank_requirement} trở lên`
                      : `Chỉ cho phép hạng ${watchedData.max_rank_requirement} trở xuống`}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compact Tournament Format */}
      <div className='space-y-2'>
        <div className='flex items-center gap-2'>
          <Trophy className='h-4 w-4 text-primary' />
          <Label className='text-xs font-medium'>Hình thức thi đấu</Label>
        </div>

        <div className='grid grid-cols-2 gap-2'>
          {Object.entries(TOURNAMENT_FORMATS).map(([key, label]) => (
            <button
              key={key}
              type='button'
              onClick={() =>
                setValue('tournament_type', key as TournamentType, {
                  shouldValidate: true,
                })
              }
              className={`p-2 border rounded text-left transition-all ${
                watchedData.tournament_type === key
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
              }`}
            >
              <div className='text-sm font-medium'>{label}</div>
              <div className='text-xs text-muted-foreground'>
                {key === 'single_elimination' && 'Thua 1 trận là loại'}
                {key === 'double_elimination' && 'Có cơ hội phục hồi'}
                {key === 'round_robin' && 'Đấu vòng tròn'}
                {key === 'swiss' && 'Đấu cùng điểm'}
              </div>
            </button>
          ))}
        </div>

        {errors.tournament_type && (
          <p className='text-xs text-destructive'>
            {String(errors.tournament_type.message)}
          </p>
        )}
      </div>

      {/* Compact Game Format */}
      <div className='space-y-2'>
        <div className='flex items-center gap-2'>
          <Gamepad2 className='h-4 w-4 text-primary' />
          <Label className='text-xs font-medium'>Môn thi đấu</Label>
        </div>

        <div className='grid grid-cols-4 gap-1'>
          {Object.entries(GAME_FORMATS).map(([key, label]) => (
            <button
              key={key}
              type='button'
              onClick={() =>
                setValue('game_format', key as GameFormat, {
                  shouldValidate: true,
                })
              }
              className={`p-2 border rounded text-center transition-all ${
                watchedData.game_format === key
                  ? 'border-primary bg-primary/10 text-primary font-medium'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
              }`}
            >
              <div className='text-xs font-medium'>{label}</div>
            </button>
          ))}
        </div>

        {errors.game_format && (
          <p className='text-xs text-destructive'>
            {String(errors.game_format.message)}
          </p>
        )}
      </div>

      {/* Third Place Match Setting - Only for Single Elimination */}
      {watchedData.tournament_type === 'single_elimination' && (
        <div className='space-y-3'>
          <div className='flex items-center gap-2'>
            <Medal className='h-4 w-4' />
            <Label className='text-sm font-medium'>Cài đặt nâng cao</Label>
          </div>

          <div className='flex items-center justify-between p-4 border rounded-lg'>
            <div className='space-y-1'>
              <div className='font-medium text-sm'>Trận tranh hạng 3</div>
              <div className='text-xs text-muted-foreground'>
                Tạo trận đấu cho 2 người thua bán kết để tranh hạng 3
              </div>
            </div>
            <Switch
              checked={watchedData.has_third_place_match ?? true}
              onCheckedChange={checked =>
                setValue('has_third_place_match', checked, {
                  shouldValidate: true,
                })
              }
            />
          </div>

          {watchedData.has_third_place_match && (
            <div className='flex items-center gap-2 text-sm text-muted-foreground ml-6'>
              <Info className='h-4 w-4' />
              <span>
                Trận tranh hạng 3 sẽ được tự động tạo khi hoàn thành bán kết
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
