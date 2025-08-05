import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Edit,
  Trophy,
  Medal,
  Award,
  Crown,
  Star,
  Gift,
  Coins,
  Target,
  Download,
  DollarSign,
  Info,
  RefreshCw,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TournamentRewards } from '@/types/tournament-extended';
import { RewardsEditModal } from './RewardsEditModal';
import type { RankCode } from '@/utils/eloConstants';
import { formatPrizeAmount } from '@/utils/tournamentHelpers';
import { toast } from 'sonner';
import { useTournamentRewardsManager } from '@/hooks/useTournamentRewardsManager';
import { useRewardTemplates } from '@/hooks/useRewardTemplates';

interface OptimizedRewardsSectionProps {
  rewards?: TournamentRewards;
  isEditable?: boolean;
  onRewardsUpdated?: (rewards: TournamentRewards) => void;
  showAsTemplate?: boolean;
  maxParticipants?: number;
  entryFee?: number;
  onUseTemplate?: (rewards: TournamentRewards) => void;
  showFinancialSummary?: boolean;
  tournamentId?: string;
  onRewardsChange?: (rewards: TournamentRewards) => void;
  maxRankRequirement?: RankCode;
}

export const OptimizedRewardsSection: React.FC<
  OptimizedRewardsSectionProps
> = ({
  rewards,
  isEditable = false,
  onRewardsUpdated,
  showAsTemplate = false,
  maxParticipants = 16,
  entryFee = 0,
  onUseTemplate,
  showFinancialSummary = false,
  tournamentId,
  onRewardsChange,
  maxRankRequirement,
}) => {
  const [isEditing, setIsEditing] = useState(false);

  // Get tournament rewards manager
  const {
    rewards: currentRewards,
    saveRewards,
    isSaving,
    isLoading: rewardsLoading,
  } = useTournamentRewardsManager(tournamentId || '');

  // Get template system
  const {
    templates,
    saveTemplate,
    isSaving: isSavingTemplate,
    convertTemplatesToRewards,
    copyTemplateToTournament,
  } = useRewardTemplates();

  // Initialize rewards state - prioritize template data over current tournament data
  const [rewards_state, setRewards] = useState<TournamentRewards>(() => {
    // If we have templates, use them first
    if (templates?.length > 0) {
      return convertTemplatesToRewards(templates);
    }

    // Fallback to current tournament rewards if available
    if (currentRewards?.positions?.length > 0) {
      return currentRewards;
    }

    // Default rewards as last resort
    return {
      totalPrize: 10000000,
      showPrizes: true,
      positions: [
        {
          position: 1,
          name: 'Vô địch',
          eloPoints: 100,
          spaPoints: 500,
          cashPrize: 5000000,
          items: [],
          isVisible: true,
        },
        {
          position: 2,
          name: 'Á quân',
          eloPoints: 75,
          spaPoints: 300,
          cashPrize: 3000000,
          items: [],
          isVisible: true,
        },
        {
          position: 3,
          name: 'Hạng 3',
          eloPoints: 50,
          spaPoints: 200,
          cashPrize: 2000000,
          items: [],
          isVisible: true,
        },
      ],
      specialAwards: [],
    };
  });

  // Update rewards when templates or currentRewards change
  useEffect(() => {
    // Prioritize templates over current tournament rewards
    if (templates?.length > 0) {
      setRewards(convertTemplatesToRewards(templates));
    } else if (currentRewards?.positions?.length > 0) {
      setRewards(currentRewards);
    }
  }, [templates, currentRewards, convertTemplatesToRewards]);

  const handleEditRewards = () => {
    setIsEditing(true);
  };

  const handleSaveRewards = async (updatedRewards: TournamentRewards) => {
    try {
      console.log('💾 Saving rewards to template:', updatedRewards);

      // Always update local state first
      setRewards(updatedRewards);

      // Save to template system (this will be the primary storage)
      await saveTemplate(updatedRewards);

      console.log('✅ Template saved successfully');

      // Call onRewardsChange if provided
      if (onRewardsChange) {
        onRewardsChange(updatedRewards);
      }
    } catch (error) {
      console.error('❌ Error saving template:', error);
      toast.error('Lỗi khi lưu template phần thưởng');
    }
  };

  // Function to apply template to tournament when creating
  const applyTemplateToTournament = async (tournamentId: string) => {
    if (rewards_state && tournamentId) {
      return await copyTemplateToTournament(tournamentId, rewards_state);
    }
    return false;
  };

  // Export needed for parent components
  const exportData = {
    rewards: rewards_state,
    isEditing,
    setIsEditing,
    handleEditRewards,
    applyTemplateToTournament,
    isLoading: rewardsLoading,
    onRewardsUpdate: (newRewards: TournamentRewards) => {
      setRewards(newRewards);
      if (onRewardsChange) {
        onRewardsChange(newRewards);
      }
    },
  };

  // Position icons mapping
  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className='h-5 w-5 text-yellow-500' />;
      case 2:
        return <Medal className='h-5 w-5 text-gray-400' />;
      case 3:
        return <Award className='h-5 w-5 text-amber-600' />;
      default:
        return <Trophy className='h-5 w-5 text-muted-foreground' />;
    }
  };

  // Position color mapping
  const getPositionColor = (position: number) => {
    switch (position) {
      case 1:
        return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200';
      case 2:
        return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200';
      case 3:
        return 'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200';
      default:
        return 'bg-gradient-to-r from-muted/30 to-muted/50 border-border';
    }
  };

  if (rewardsLoading) {
    return (
      <Card className='mb-6'>
        <CardContent className='p-6'>
          <div className='flex items-center justify-center space-x-2 text-muted-foreground'>
            <RefreshCw className='h-4 w-4 animate-spin' />
            <span>Đang tải thông tin phần thưởng...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className='mb-6'>
        <CardHeader className='pb-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-2'>
              <Trophy className='h-5 w-5 text-primary' />
              <CardTitle className='text-lg'>
                {showAsTemplate
                  ? 'Template Phần Thưởng'
                  : 'Phần Thưởng Giải Đấu'}
              </CardTitle>
              {rewards_state.showPrizes && rewards_state.totalPrize > 0 && (
                <Badge variant='secondary' className='ml-2'>
                  <Coins className='h-3 w-3 mr-1' />
                  {formatPrizeAmount(rewards_state.totalPrize)}
                </Badge>
              )}
            </div>

            {isEditable && (
              <Button
                variant='outline'
                size='sm'
                onClick={handleEditRewards}
                disabled={isSavingTemplate}
                className='flex items-center space-x-1'
              >
                <Edit className='h-4 w-4' />
                <span>Chỉnh sửa</span>
              </Button>
            )}
          </div>

          <CardDescription>
            {showAsTemplate
              ? 'Mẫu phần thưởng sẽ được áp dụng cho các giải đấu mới'
              : 'Thông tin chi tiết về phần thưởng và hệ thống điểm'}
          </CardDescription>
        </CardHeader>

        <CardContent className='space-y-4'>
          {/* Prize Positions */}
          <div className='space-y-3'>
            <h4 className='font-medium text-sm text-muted-foreground flex items-center'>
              <Target className='h-4 w-4 mr-1' />
              Thứ hạng & Phần thưởng
            </h4>

            <div className='grid gap-3'>
              {rewards_state.positions
                .filter(pos => pos.isVisible !== false)
                .slice(0, showAsTemplate ? 8 : rewards_state.positions.length)
                .map(position => (
                  <div
                    key={position.position}
                    className={`p-4 rounded-lg border transition-all ${getPositionColor(position.position)}`}
                  >
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center space-x-3'>
                        {getPositionIcon(position.position)}
                        <div>
                          <div className='font-medium text-sm'>
                            {position.name}
                          </div>
                          <div className='text-xs text-muted-foreground'>
                            Hạng {position.position}
                          </div>
                        </div>
                      </div>

                      <div className='flex items-center space-x-4 text-sm'>
                        {position.cashPrize > 0 && (
                          <div className='text-green-600 font-medium'>
                            <DollarSign className='h-3 w-3 inline mr-1' />
                            {formatPrizeAmount(position.cashPrize)}
                          </div>
                        )}

                        {position.spaPoints > 0 && (
                          <div className='text-blue-600 font-medium'>
                            <Star className='h-3 w-3 inline mr-1' />
                            {position.spaPoints} SPA
                          </div>
                        )}

                        {position.eloPoints > 0 && (
                          <div className='text-purple-600 font-medium'>
                            <Target className='h-3 w-3 inline mr-1' />
                            {position.eloPoints} ELO
                          </div>
                        )}

                        {position.items && position.items.length > 0 && (
                          <div className='text-orange-600 font-medium'>
                            <Gift className='h-3 w-3 inline mr-1' />
                            {position.items.length} vật phẩm
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Special Awards */}
          {rewards_state.specialAwards &&
            rewards_state.specialAwards.length > 0 && (
              <div className='space-y-3 pt-4 border-t'>
                <h4 className='font-medium text-sm text-muted-foreground flex items-center'>
                  <Award className='h-4 w-4 mr-1' />
                  Giải thưởng đặc biệt
                </h4>

                <div className='grid gap-2'>
                  {rewards_state.specialAwards.map(award => (
                    <div
                      key={award.id}
                      className='p-3 rounded-lg bg-muted/30 border border-border'
                    >
                      <div className='flex items-center justify-between'>
                        <div>
                          <div className='font-medium text-sm'>
                            {award.name}
                          </div>
                          {award.description && (
                            <div className='text-xs text-muted-foreground mt-1'>
                              {award.description}
                            </div>
                          )}
                        </div>
                        {award.cashPrize > 0 && (
                          <div className='text-green-600 font-medium text-sm'>
                            <DollarSign className='h-3 w-3 inline mr-1' />
                            {formatPrizeAmount(award.cashPrize)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Template Actions */}
          {showAsTemplate && onUseTemplate && (
            <div className='pt-4 border-t'>
              <Button
                onClick={() => onUseTemplate(rewards_state)}
                className='w-full'
                variant='default'
              >
                <Download className='h-4 w-4 mr-2' />
                Sử dụng template này
              </Button>
            </div>
          )}

          {/* Financial Summary */}
          {showFinancialSummary && rewards_state.showPrizes && (
            <div className='pt-4 border-t'>
              <div className='bg-muted/50 rounded-lg p-4'>
                <h4 className='font-medium text-sm mb-3 flex items-center'>
                  <Info className='h-4 w-4 mr-1' />
                  Tóm tắt tài chính
                </h4>

                <div className='grid grid-cols-2 gap-4 text-sm'>
                  <div>
                    <div className='text-muted-foreground'>
                      Tổng thu từ phí tham gia
                    </div>
                    <div className='font-medium text-green-600'>
                      {formatPrizeAmount(maxParticipants * entryFee)}
                    </div>
                  </div>

                  <div>
                    <div className='text-muted-foreground'>
                      Tổng giải thưởng
                    </div>
                    <div className='font-medium text-red-600'>
                      {formatPrizeAmount(rewards_state.totalPrize)}
                    </div>
                  </div>

                  <div className='col-span-2 pt-2 border-t border-border/50'>
                    <div className='text-muted-foreground'>
                      Lợi nhuận ước tính
                    </div>
                    <div
                      className={`font-medium ${
                        maxParticipants * entryFee - rewards_state.totalPrize >=
                        0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {formatPrizeAmount(
                        maxParticipants * entryFee - rewards_state.totalPrize
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <RewardsEditModal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        rewards={rewards_state}
        onSave={handleSaveRewards}
        disabled={isSavingTemplate}
        maxRankRequirement={maxRankRequirement}
      />

      {/* Return data for parent component usage */}
      {typeof window !== 'undefined' && (
        <script
          dangerouslySetInnerHTML={{
            __html: `window.optimizedRewardsData = ${JSON.stringify(exportData)};`,
          }}
        />
      )}
    </>
  );
};

// Export the hook functionality for parent components
export const useOptimizedRewards = (
  tournamentId?: string,
  onRewardsChange?: (rewards: TournamentRewards) => void
) => {
  const [isEditing, setIsEditing] = useState(false);

  // Get rewards from manager
  const {
    rewards: currentRewards,
    saveRewards,
    isSaving,
    isLoading: rewardsLoading,
  } = useTournamentRewardsManager(tournamentId || '');

  // Get template system
  const {
    templates,
    saveTemplate,
    isSaving: isSavingTemplate,
    convertTemplatesToRewards,
    copyTemplateToTournament,
  } = useRewardTemplates();

  // Initialize rewards state - prioritize template data over current tournament data
  const [rewards, setRewards] = useState<TournamentRewards>(() => {
    // If we have templates, use them first
    if (templates?.length > 0) {
      return convertTemplatesToRewards(templates);
    }

    // Fallback to current tournament rewards if available
    if (currentRewards?.positions?.length > 0) {
      return currentRewards;
    }

    // Default rewards as last resort
    return {
      totalPrize: 10000000,
      showPrizes: true,
      positions: [
        {
          position: 1,
          name: 'Vô địch',
          eloPoints: 100,
          spaPoints: 500,
          cashPrize: 5000000,
          items: [],
          isVisible: true,
        },
        {
          position: 2,
          name: 'Á quân',
          eloPoints: 75,
          spaPoints: 300,
          cashPrize: 3000000,
          items: [],
          isVisible: true,
        },
        {
          position: 3,
          name: 'Hạng 3',
          eloPoints: 50,
          spaPoints: 200,
          cashPrize: 2000000,
          items: [],
          isVisible: true,
        },
      ],
      specialAwards: [],
    };
  });

  // Update rewards when templates or currentRewards change
  useEffect(() => {
    // Prioritize templates over current tournament rewards
    if (templates?.length > 0) {
      setRewards(convertTemplatesToRewards(templates));
    } else if (currentRewards?.positions?.length > 0) {
      setRewards(currentRewards);
    }
  }, [templates, currentRewards, convertTemplatesToRewards]);

  const handleEditRewards = () => {
    setIsEditing(true);
  };

  const handleSaveRewards = async (updatedRewards: TournamentRewards) => {
    try {
      console.log('💾 Saving rewards to template:', updatedRewards);

      // Always update local state first
      setRewards(updatedRewards);

      // Save to template system (this will be the primary storage)
      await saveTemplate(updatedRewards);

      console.log('✅ Template saved successfully');

      // Call onRewardsChange if provided
      if (onRewardsChange) {
        onRewardsChange(updatedRewards);
      }
    } catch (error) {
      console.error('❌ Error saving template:', error);
      toast.error('Lỗi khi lưu template phần thưởng');
    }
  };

  // Function to apply template to tournament when creating
  const applyTemplateToTournament = async (tournamentId: string) => {
    if (rewards && tournamentId) {
      return await copyTemplateToTournament(tournamentId, rewards);
    }
    return false;
  };

  return {
    rewards,
    isEditing,
    setIsEditing,
    handleEditRewards,
    applyTemplateToTournament, // Export this function for tournament creation
    isLoading: rewardsLoading,
    onRewardsUpdate: (newRewards: TournamentRewards) => {
      setRewards(newRewards);
      if (onRewardsChange) {
        onRewardsChange(newRewards);
      }
    },
  };
};
