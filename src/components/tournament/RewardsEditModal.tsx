import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Plus,
  Trash2,
  Trophy,
  DollarSign,
  AlertTriangle,
  Gift,
  X,
  Zap,
} from 'lucide-react';
import { TournamentRewards, RewardPosition } from '@/types/tournament-extended';
import { formatPrizeAmount } from '@/utils/tournamentHelpers';
import { toast } from 'sonner';
import { SPA_TOURNAMENT_REWARDS } from '@/utils/eloConstants';
import type { RankCode, TournamentPosition } from '@/utils/eloConstants';

// Schema for form validation
const rewardsSchema = z.object({
  totalPrize: z.number().min(0),
  showPrizes: z.boolean(),
  positions: z.array(
    z.object({
      position: z.number(),
      name: z.string(),
      cashPrize: z.number().min(0),
      eloPoints: z.number(),
      spaPoints: z.number(),
      items: z.array(z.string()).optional(),
    })
  ),
  specialAwards: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        cashPrize: z.number().min(0),
        eloPoints: z.number(),
        spaPoints: z.number(),
      })
    )
    .optional(),
});

interface RewardsEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  rewards: TournamentRewards;
  onSave: (rewards: TournamentRewards) => Promise<void>;
  maxParticipants?: number;
  entryFee?: number;
  maxRankRequirement?: RankCode;
  disabled?: boolean;
}

// Default positions to add when modal opens with no positions
const getDefaultPositions = (): RewardPosition[] => [
  {
    position: 1,
    name: 'Vô địch',
    cashPrize: 0,
    eloPoints: 100,
    spaPoints: 500,
    items: ['Cúp vô địch', 'Huy chương vàng'],
    isVisible: true,
  },
  {
    position: 2,
    name: 'Á quân',
    cashPrize: 0,
    eloPoints: 75,
    spaPoints: 300,
    items: ['Huy chương bạc'],
    isVisible: true,
  },
  {
    position: 3,
    name: 'Hạng 3',
    cashPrize: 0,
    eloPoints: 50,
    spaPoints: 200,
    items: ['Huy chương đồng'],
    isVisible: true,
  },
];

export const RewardsEditModal: React.FC<RewardsEditModalProps> = ({
  isOpen,
  onClose,
  rewards,
  onSave,
  maxParticipants,
  entryFee,
  maxRankRequirement,
  disabled = false,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [localRewards, setLocalRewards] = useState<TournamentRewards>(rewards);

  const form = useForm<TournamentRewards>({
    resolver: zodResolver(rewardsSchema),
    defaultValues: {
      totalPrize: rewards?.totalPrize || 0,
      showPrizes: rewards?.showPrizes || false,
      positions:
        rewards?.positions?.length > 0
          ? rewards.positions
          : getDefaultPositions(),
      specialAwards: rewards?.specialAwards || [],
    },
  });

  const {
    register,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = form;
  const watchedPositions = watch('positions');
  const watchedShowPrizes = watch('showPrizes');

  const addPosition = () => {
    const currentPositions = getValues('positions') || [];
    const nextPosition = currentPositions.length + 1;

    const newPosition: RewardPosition = {
      position: nextPosition,
      name: `Vị trí ${nextPosition}`,
      cashPrize: 0,
      eloPoints: 0,
      spaPoints: 0,
      items: [],
      isVisible: true,
    };

    setValue('positions', [...currentPositions, newPosition]);
  };

  const removePosition = (index: number) => {
    const currentPositions = getValues('positions') || [];
    const newPositions = currentPositions.filter((_, i) => i !== index);

    // Re-index positions
    const reindexedPositions = newPositions.map((pos, i) => ({
      ...pos,
      position: i + 1,
      name: pos.name.includes('Vị trí') ? `Vị trí ${i + 1}` : pos.name,
    }));

    setValue('positions', reindexedPositions);
  };

  const updatePosition = (
    index: number,
    field: keyof RewardPosition,
    value: any
  ) => {
    const currentPositions = getValues('positions') || [];
    const updatedPositions = [...currentPositions];
    updatedPositions[index] = {
      ...updatedPositions[index],
      [field]: value,
    };
    setValue('positions', updatedPositions);
  };

  const addPhysicalItem = (positionIndex: number) => {
    const currentPositions = getValues('positions') || [];
    const position = currentPositions[positionIndex];
    const updatedItems = [...(position.items || []), ''];
    updatePosition(positionIndex, 'items', updatedItems);
  };

  const removePhysicalItem = (positionIndex: number, itemIndex: number) => {
    const currentPositions = getValues('positions') || [];
    const position = currentPositions[positionIndex];
    const updatedItems = (position.items || []).filter(
      (_, i) => i !== itemIndex
    );
    updatePosition(positionIndex, 'items', updatedItems);
  };

  const updatePhysicalItem = (
    positionIndex: number,
    itemIndex: number,
    value: string
  ) => {
    const currentPositions = getValues('positions') || [];
    const position = currentPositions[positionIndex];
    const updatedItems = [...(position.items || [])];
    updatedItems[itemIndex] = value;
    updatePosition(positionIndex, 'items', updatedItems);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const formData = getValues();

      console.log('🔍 RewardsEditModal - Saving data:', formData);

      // Validate total prize vs individual prizes
      const totalCashPrizes = formData.positions.reduce(
        (sum, pos) => sum + (pos.cashPrize || 0),
        0
      );
      if (formData.showPrizes && totalCashPrizes > formData.totalPrize) {
        toast.error('Tổng tiền thưởng các vị trí vượt quá tổng giải thưởng');
        return;
      }

      await onSave(formData);

      // Mark form as clean after successful save to prevent reset
      form.reset(formData, { keepValues: true });
      setLocalRewards(formData);

      console.log('🔍 RewardsEditModal - Save successful');
    } catch (error) {
      console.error('Failed to save rewards:', error);
      // Error handled by parent component
    } finally {
      setIsSaving(false);
    }
  };

  const calculateTotalPrize = () => {
    const positions = watchedPositions || [];
    return positions.reduce((total, pos) => total + (pos.cashPrize || 0), 0);
  };

  const calculateRemainingPrize = () => {
    const totalPrize = watch('totalPrize') || 0;
    const usedPrize = calculateTotalPrize();
    return totalPrize - usedPrize;
  };

  const hasValidationErrors = () => {
    const positions = watchedPositions || [];
    if (positions.length === 0) return false; // Allow saving with no positions

    const positionNumbers = positions.map(p => p.position);
    const hasDuplicates = positionNumbers.some(
      (pos, index) => positionNumbers.indexOf(pos) !== index
    );
    const totalPrize = watch('totalPrize') || 0;
    const usedPrize = calculateTotalPrize();
    const exceedsTotal =
      watchedShowPrizes && totalPrize > 0 && usedPrize > totalPrize;

    return hasDuplicates || exceedsTotal;
  };

  // Auto-calculate prize distribution
  const autoDistributePrizes = () => {
    const totalPrize = watch('totalPrize') || 0;
    const positions = watchedPositions || [];

    if (totalPrize > 0 && positions.length > 0) {
      const updatedPositions = positions.map((pos, index) => {
        let percentage = 0;
        if (index === 0)
          percentage = 0.5; // 50% for 1st
        else if (index === 1)
          percentage = 0.3; // 30% for 2nd
        else if (index === 2)
          percentage = 0.2; // 20% for 3rd
        else percentage = 0; // 0% for others

        return {
          ...pos,
          cashPrize: Math.floor(totalPrize * percentage),
        };
      });

      setValue('positions', updatedPositions);
    }
  };

  // Auto-calculate SPA points using SABO tournament rewards (flexible by max rank)
  const autoCalculateSPA = () => {
    const positions = watchedPositions || [];

    if (positions.length === 0) {
      toast.error('Không có vị trí nào để tính SPA');
      return;
    }

    // Use maxRankRequirement or fallback to 'K' (lowest rank)
    const targetRank = maxRankRequirement || 'K';
    const rankRewards = SPA_TOURNAMENT_REWARDS[targetRank];

    const updatedPositions = positions.map(pos => {
      let spaPoints = 0;

      // Map position to tournament position
      switch (pos.position) {
        case 1:
          spaPoints = rankRewards.CHAMPION;
          break;
        case 2:
          spaPoints = rankRewards.RUNNER_UP;
          break;
        case 3:
          spaPoints = rankRewards.THIRD_PLACE;
          break;
        case 4:
          spaPoints = rankRewards.FOURTH_PLACE;
          break;
        case 5:
        case 6:
        case 7:
        case 8:
          spaPoints = rankRewards.TOP_8;
          break;
        default:
          spaPoints = rankRewards.PARTICIPATION;
          break;
      }

      return {
        ...pos,
        spaPoints,
      };
    });

    setValue('positions', updatedPositions);
    toast.success(
      `Đã áp dụng điểm SPA theo hạng ${targetRank} cho ${positions.length} vị trí`
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Trophy className='w-5 h-5' />
            Chỉnh sửa phần thưởng
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Prize Pool Settings */}
          <Card>
            <CardContent className='p-4 space-y-4'>
              <div className='flex items-center justify-between'>
                <Label htmlFor='showPrizes' className='font-semibold'>
                  Hiển thị giải thưởng tiền mặt
                </Label>
                <Switch
                  id='showPrizes'
                  checked={watchedShowPrizes}
                  onCheckedChange={checked => setValue('showPrizes', checked)}
                />
              </div>

              {watchedShowPrizes && (
                <div className='space-y-2'>
                  <Label htmlFor='totalPrize'>Tổng giải thưởng (VNĐ)</Label>
                  <Input
                    id='totalPrize'
                    type='number'
                    {...register('totalPrize', { valueAsNumber: true })}
                    placeholder='0'
                  />
                  <div className='space-y-2'>
                    <div className='text-sm text-muted-foreground'>
                      Tổng tiền thưởng từ các vị trí:{' '}
                      {formatPrizeAmount(calculateTotalPrize())}
                    </div>
                    <div
                      className={`text-sm font-medium ${calculateRemainingPrize() < 0 ? 'text-red-600' : 'text-green-600'}`}
                    >
                      Còn lại: {formatPrizeAmount(calculateRemainingPrize())}
                    </div>
                    {calculateRemainingPrize() < 0 && (
                      <div className='flex items-center gap-2 text-red-600 text-sm'>
                        <AlertTriangle className='w-4 h-4' />
                        Vượt quá tổng giải thưởng!
                      </div>
                    )}
                    <div className='flex gap-2 mt-2'>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={autoDistributePrizes}
                      >
                        Phân bố tự động (50%-30%-20%)
                      </Button>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={autoCalculateSPA}
                        className='flex items-center gap-1'
                        disabled={
                          !watchedPositions || watchedPositions.length === 0
                        }
                      >
                        <Zap className='w-3 h-3' />
                        Tự động SPA (Hạng {maxRankRequirement || 'K'})
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Position Rewards */}
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <h3 className='font-semibold text-lg'>Phần thưởng theo vị trí</h3>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={addPosition}
                className='flex items-center gap-2'
              >
                <Plus className='w-4 h-4' />
                Thêm vị trí
              </Button>
            </div>

            <div className='space-y-3'>
              {watchedPositions?.map((position, index) => (
                <Card key={index} className='border'>
                  <CardContent className='p-4'>
                    <div className='grid grid-cols-1 md:grid-cols-4 gap-4 items-center'>
                      <div className='flex items-center gap-3'>
                        <div className='w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center'>
                          <span className='font-bold text-primary text-sm'>
                            {position.position}
                          </span>
                        </div>
                        <div className='space-y-1'>
                          <Input
                            value={position.name}
                            onChange={e =>
                              updatePosition(index, 'name', e.target.value)
                            }
                            placeholder='Tên vị trí'
                            className='h-8'
                          />
                        </div>
                      </div>

                      {watchedShowPrizes && (
                        <div className='space-y-1'>
                          <Label className='text-xs'>Tiền thưởng (VNĐ)</Label>
                          <Input
                            type='number'
                            value={position.cashPrize}
                            onChange={e =>
                              updatePosition(
                                index,
                                'cashPrize',
                                parseInt(e.target.value) || 0
                              )
                            }
                            placeholder='0'
                            className='h-8'
                          />
                        </div>
                      )}

                      <div className='space-y-1'>
                        <Label className='text-xs'>ELO</Label>
                        <Input
                          type='number'
                          value={position.eloPoints}
                          onChange={e =>
                            updatePosition(
                              index,
                              'eloPoints',
                              parseInt(e.target.value) || 0
                            )
                          }
                          placeholder='0'
                          className='h-8'
                        />
                      </div>

                      <div className='flex items-center justify-between'>
                        <div className='space-y-1'>
                          <Label className='text-xs'>SPA</Label>
                          <Input
                            type='number'
                            value={position.spaPoints}
                            onChange={e =>
                              updatePosition(
                                index,
                                'spaPoints',
                                parseInt(e.target.value) || 0
                              )
                            }
                            placeholder='0'
                            className='h-8'
                          />
                        </div>

                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          onClick={() => removePosition(index)}
                          className='text-destructive hover:text-destructive'
                        >
                          <Trash2 className='w-4 h-4' />
                        </Button>
                      </div>
                    </div>

                    {/* Physical Rewards Section */}
                    <div className='mt-4 space-y-3'>
                      <div className='flex items-center justify-between'>
                        <Label className='text-sm font-medium flex items-center gap-2'>
                          <Gift className='w-4 h-4' />
                          Giải thưởng hiện vật
                        </Label>
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          onClick={() => addPhysicalItem(index)}
                          className='text-xs h-7'
                        >
                          <Plus className='w-3 h-3 mr-1' />
                          Thêm
                        </Button>
                      </div>

                      {position.items && position.items.length > 0 && (
                        <div className='space-y-2'>
                          {position.items.map((item, itemIndex) => (
                            <div
                              key={itemIndex}
                              className='flex items-center gap-2'
                            >
                              <Input
                                value={item}
                                onChange={e =>
                                  updatePhysicalItem(
                                    index,
                                    itemIndex,
                                    e.target.value
                                  )
                                }
                                placeholder='Ví dụ: Cúp vô địch, Huy chương vàng...'
                                className='h-8 text-sm'
                              />
                              <Button
                                type='button'
                                variant='ghost'
                                size='sm'
                                onClick={() =>
                                  removePhysicalItem(index, itemIndex)
                                }
                                className='h-8 w-8 p-0 text-destructive hover:text-destructive'
                              >
                                <X className='w-3 h-3' />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      {(!position.items || position.items.length === 0) && (
                        <div className='text-xs text-muted-foreground italic'>
                          Chưa có giải thưởng hiện vật
                        </div>
                      )}
                    </div>

                    {/* Position Preview */}
                    <div className='mt-3 pt-3 border-t'>
                      <div className='flex items-center gap-2 text-sm flex-wrap'>
                        <Badge
                          variant='secondary'
                          className='bg-blue-50 text-blue-700'
                        >
                          {position.eloPoints} ELO
                        </Badge>
                        <Badge
                          variant='secondary'
                          className='bg-yellow-50 text-yellow-700'
                        >
                          {position.spaPoints} SPA
                        </Badge>
                        {watchedShowPrizes && position.cashPrize > 0 && (
                          <Badge
                            variant='secondary'
                            className='bg-green-50 text-green-700'
                          >
                            {formatPrizeAmount(position.cashPrize)}
                          </Badge>
                        )}
                        {position.items &&
                          position.items.filter(item => item.trim()).length >
                            0 && (
                            <Badge
                              variant='secondary'
                              className='bg-purple-50 text-purple-700'
                            >
                              <Gift className='w-3 h-3 mr-1' />
                              {
                                position.items.filter(item => item.trim())
                                  .length
                              }{' '}
                              hiện vật
                            </Badge>
                          )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {(!watchedPositions || watchedPositions.length === 0) && (
                <div className='text-center py-8 text-muted-foreground'>
                  <Trophy className='w-12 h-12 mx-auto mb-4 opacity-50' />
                  <p>Chưa có vị trí nào</p>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={addPosition}
                    className='mt-4'
                  >
                    Thêm vị trí đầu tiên
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className='flex justify-between'>
          <Button
            type='button'
            variant='outline'
            onClick={onClose}
            disabled={isSaving || disabled}
          >
            Hủy
          </Button>
          <div className='flex gap-2'>
            <Button
              type='button'
              onClick={handleSave}
              disabled={isSaving || hasValidationErrors() || disabled}
              className='flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white'
            >
              {isSaving && (
                <div className='w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
              )}
              <Trophy className='w-4 h-4' />
              Lưu & Đóng
            </Button>
            <Button
              type='button'
              onClick={async () => {
                const formData = getValues();
                try {
                  await onSave(formData);
                  toast.success('Đã lưu thành công! Tiếp tục chỉnh sửa...');
                  // Don't close modal - allow continued editing
                } catch (error) {
                  // Error handled by parent
                }
              }}
              disabled={isSaving || hasValidationErrors() || disabled}
              variant='outline'
              className='flex items-center gap-2 border-green-500 text-green-600 hover:bg-green-50'
            >
              <DollarSign className='w-4 h-4' />
              Áp dụng
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RewardsEditModal;
