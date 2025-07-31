import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Trophy, Medal, Award, Crown, Star, Gift, Coins, Target, Download, DollarSign, Info, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TournamentRewards } from '@/types/tournament-extended';
import { RewardsEditModal } from './RewardsEditModal';
import { formatPrizeAmount } from '@/utils/tournamentHelpers';
import { toast } from 'sonner';
import { useTournamentRewardsManager } from '@/hooks/useTournamentRewardsManager';

interface OptimizedRewardsSectionProps {
  rewards?: TournamentRewards;
  isEditable?: boolean;
  onRewardsUpdated?: (rewards: TournamentRewards) => void;
  showAsTemplate?: boolean;
  maxParticipants?: number;
  entryFee?: number;
  onUseTemplate?: (rewards: TournamentRewards) => void;
  showFinancialSummary?: boolean;
  tournamentId?: string; // Add tournamentId to enable database save
}

export const OptimizedRewardsSection: React.FC<OptimizedRewardsSectionProps> = ({
  rewards,
  isEditable = false,
  onRewardsUpdated,
  showAsTemplate = false,
  maxParticipants = 16,
  entryFee = 0,
  onUseTemplate,
  showFinancialSummary = false,
  tournamentId
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentRewards, setCurrentRewards] = useState<TournamentRewards | null>(null);
  
  // Use tournament rewards manager if tournamentId is provided
  const {
    rewards: dbRewards,
    isLoading: isLoadingRewards,
    saveRewards,
    isSaving,
    refetch: refetchRewards
  } = useTournamentRewardsManager(tournamentId || '');
  
  // Generate default rewards function
  const generateDefaultRewards = (): TournamentRewards => {
    // Generate simple default rewards for all positions
    const positions = Array.from({ length: Math.min(maxParticipants, 16) }, (_, i) => {
      const position = i + 1;
      return {
        position,
        name: position === 1 ? 'Vô địch' : 
              position === 2 ? 'Á quân' : 
              position === 3 ? 'Hạng 3' : 
              `Hạng ${position}`,
        eloPoints: position <= 3 ? 100 - (position - 1) * 25 : 
                  position <= 8 ? 25 : 10,
        spaPoints: position <= 3 ? 1000 - (position - 1) * 200 : 
                  position <= 8 ? 300 : 100,
        cashPrize: 0,
        items: position <= 3 ? ['Giấy chứng nhận'] : [],
        isVisible: true
      };
    });

    return {
      totalPrize: 0,
      showPrizes: false,
      positions,
      specialAwards: []
    };
  };
  
  // Determine which rewards to use - prioritize database rewards if available, fallback to default template
  const activeRewards = tournamentId && dbRewards && dbRewards.positions.length > 0 
    ? dbRewards 
    : (currentRewards || rewards || generateDefaultRewards());
  
  // Update local state when props change
  useEffect(() => {
    if (rewards && !tournamentId) {
      setCurrentRewards(rewards);
      console.log('🔄 OptimizedRewardsSection: Using props rewards', rewards);
    }
  }, [rewards, tournamentId]);
  
  // Update local state when database rewards change
  useEffect(() => {
    if (tournamentId && dbRewards) {
      setCurrentRewards(dbRewards);
      console.log('🔄 OptimizedRewardsSection: Using database rewards', dbRewards);
    }
  }, [dbRewards, tournamentId]);
  
  // Add debug logging
  console.log('🎯 OptimizedRewardsSection render:', {
    hasRewards: !!rewards,
    hasCurrentRewards: !!currentRewards,
    hasDbRewards: !!dbRewards,
    tournamentId,
    isLoadingRewards,
    rewardsPositions: rewards?.positions?.length || 0,
    currentRewardsPositions: currentRewards?.positions?.length || 0,
    dbRewardsPositions: dbRewards?.positions?.length || 0,
    showAsTemplate,
    isEditable,
    usingSource: tournamentId && dbRewards ? 'database' : 'props'
  });

  // Template reward generation functions
  const getTemplateRewardData = (position: number) => {
    switch (position) {
      case 1:
        return {
          spaPoints: 1000,
          eloPoints: 100,
          prizeMoney: 2000000,
          physicalRewards: ['Cúp vô địch', 'Huy chương vàng', 'Giấy chứng nhận'],
          icon: <Crown className="w-5 h-5 text-yellow-500" />,
          badge: { text: 'Vô địch', className: 'bg-yellow-500 text-white' }
        };
      case 2:
        return {
          spaPoints: 700,
          eloPoints: 75,
          prizeMoney: 1200000,
          physicalRewards: ['Huy chương bạc', 'Giấy chứng nhận'],
          icon: <Medal className="w-5 h-5 text-gray-400" />,
          badge: { text: 'Á quân', className: 'bg-gray-400 text-white' }
        };
      case 3:
        return {
          spaPoints: 500,
          eloPoints: 50,
          prizeMoney: 800000,
          physicalRewards: ['Huy chương đồng', 'Giấy chứng nhận'],
          icon: <Award className="w-5 h-5 text-amber-600" />,
          badge: { text: 'Hạng 3', className: 'bg-amber-600 text-white' }
        };
      default:
        if (position <= 8) {
          return {
            spaPoints: 300,
            eloPoints: 25,
            prizeMoney: 400000,
            physicalRewards: ['Giấy chứng nhận'],
            icon: <Star className="w-5 h-5 text-blue-500" />,
            badge: { text: `Top ${position}`, className: 'bg-blue-500 text-white' }
          };
        } else {
          return {
            spaPoints: 100,
            eloPoints: 10,
            prizeMoney: 100000,
            physicalRewards: ['Giấy chứng nhận'],
            icon: <Gift className="w-5 h-5 text-gray-500" />,
            badge: { text: `Hạng ${position}`, className: 'bg-gray-500 text-white' }
          };
        }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getPhysicalRewardIcons = (rewardItems?: string[]) => {
    if (!rewardItems) return '';
    return rewardItems.map((reward) => {
      if (reward.includes('Cúp')) return '🏆';
      if (reward.includes('Huy chương bạc')) return '🥈';
      if (reward.includes('Huy chương đồng')) return '🥉';
      if (reward.includes('Huy chương vàng')) return '🥇';
      if (reward.includes('Giấy chứng nhận')) return '📜';
      return '🎁';
    }).join(' ');
  };


  const generateTemplateRewards = (): TournamentRewards => {
    const positions = Array.from({ length: Math.min(maxParticipants, 16) }, (_, i) => i + 1);
    const calculatedTotalPrize = entryFee > 0 ? entryFee * maxParticipants * 0.75 : 0;
    
    const rewardPositions = positions.map((position) => {
      const reward = getTemplateRewardData(position);
      let calculatedCashPrize = reward.prizeMoney;
      
      // Use entry fee calculation if available
      if (calculatedTotalPrize > 0) {
        if (position === 1) calculatedCashPrize = Math.floor(calculatedTotalPrize * 0.5);
        else if (position === 2) calculatedCashPrize = Math.floor(calculatedTotalPrize * 0.3);
        else if (position === 3) calculatedCashPrize = Math.floor(calculatedTotalPrize * 0.2);
        else calculatedCashPrize = 0;
      }
      
      return {
        position,
        name: reward.badge.text,
        eloPoints: reward.eloPoints,
        spaPoints: reward.spaPoints,
        cashPrize: calculatedCashPrize,
        items: reward.physicalRewards,
        isVisible: true
      };
    });

    const totalPrizeMoney = calculatedTotalPrize || positions.reduce((total, pos) => total + getTemplateRewardData(pos).prizeMoney, 0);

    return {
      totalPrize: totalPrizeMoney,
      showPrizes: totalPrizeMoney > 0,
      positions: rewardPositions,
      specialAwards: []
    };
  };

  // Use current rewards state for display, fallback to props, then template/default
  const displayRewards = showAsTemplate ? generateTemplateRewards() : 
    (activeRewards || {
      totalPrize: 0,
      showPrizes: false,
      positions: [],
      specialAwards: []
    });
  
  console.log('📊 Display rewards final:', {
    totalPrize: displayRewards.totalPrize,
    positionsCount: displayRewards.positions?.length || 0,
    usingTemplate: showAsTemplate,
    source: showAsTemplate ? 'template' : 
           (tournamentId && dbRewards ? 'database' :
           (activeRewards ? 'active-rewards' : 'default')),
    firstPosition: displayRewards.positions?.[0],
    isLoadingRewards
  });

  const handleSaveRewards = async (updatedRewards: TournamentRewards) => {
    console.log('💾 OptimizedRewardsSection save rewards:', updatedRewards);
    
    // Update local state immediately for instant UI update
    setCurrentRewards(updatedRewards);
    
    // Save to database if tournamentId is provided
    if (tournamentId && saveRewards) {
      try {
        await saveRewards(updatedRewards);
        console.log('✅ Rewards saved to database successfully');
      } catch (error) {
        console.error('❌ Failed to save rewards to database:', error);
        // Revert local state on error
        setCurrentRewards(activeRewards);
        return; // Don't close modal or show success message
      }
    }
    
    // Call parent callback for additional handling (context updates, etc.)
    if (onRewardsUpdated) {
      onRewardsUpdated(updatedRewards);
    }
    
    setIsEditModalOpen(false);
    
    // Success message is already shown by the mutation
    if (!tournamentId) {
      toast.success('Đã cập nhật phần thưởng thành công!');
    }
  };

  const handleUseTemplate = () => {
    if (onUseTemplate) {
      const templateRewards = generateTemplateRewards();
      onUseTemplate(templateRewards);
      toast.success('Đã áp dụng template phần thưởng!');
    }
  };

  const handleRefresh = async () => {
    console.log('🔄 [OptimizedRewardsSection] Manual refresh triggered');
    try {
      if (tournamentId && refetchRewards) {
        console.log('📡 [OptimizedRewardsSection] Calling refetch for tournament:', tournamentId);
        await refetchRewards();
        console.log('✅ [OptimizedRewardsSection] Refetch completed');
        toast.success('Đã cập nhật dữ liệu phần thưởng từ database');
      } else if (!tournamentId) {
        console.log('⚠️ [OptimizedRewardsSection] No tournament ID, skipping refresh');
        toast.info('Chưa có tournament ID để tải dữ liệu');
      } else {
        console.log('⚠️ [OptimizedRewardsSection] No refetch function available');
        toast.warning('Không thể tải lại dữ liệu');
      }
    } catch (error) {
      console.error('❌ [OptimizedRewardsSection] Error during refresh:', error);
      toast.error('Lỗi khi tải lại dữ liệu');
    }
  };

  // Financial calculations
  const totalRevenue = entryFee * maxParticipants;
  const clubProfit = totalRevenue - displayRewards.totalPrize;

  return (
    <div className="space-y-6">
      {/* Loading State */}
      {isLoadingRewards && tournamentId && (
        <div className="flex items-center justify-center p-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Đang tải phần thưởng...
          </div>
        </div>
      )}

      {/* Skip loading section if loading */}
      {(!isLoadingRewards || !tournamentId) && (
        <>
          {/* Quick Stats - Enhanced Mode Only */}
          {showFinancialSummary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">Tổng giải thưởng</span>
              </div>
              <p className="text-2xl font-bold text-yellow-900">
                {displayRewards.totalPrize.toLocaleString('vi-VN')}₫
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Coins className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Điểm ELO cao nhất</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">
                +{displayRewards.positions.length > 0 ? Math.max(...displayRewards.positions.map(p => p.eloPoints)) : 0}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-800">Điểm SPA cao nhất</span>
              </div>
              <p className="text-2xl font-bold text-purple-900">
                +{displayRewards.positions.length > 0 ? Math.max(...displayRewards.positions.map(p => p.spaPoints)).toLocaleString() : 0}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Vị trí có thưởng</span>
              </div>
              <p className="text-2xl font-bold text-green-900">
                {displayRewards.positions.filter(p => p.isVisible).length}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-yellow-600">
                <Trophy className="w-5 h-5" />
                {showAsTemplate ? 'Bảng phần thưởng' : 'Phần thưởng giải đấu'}
                {!showAsTemplate && activeRewards && (
                  <Badge variant="secondary" className="ml-2">
                    {tournamentId && dbRewards ? 'Database' : 'Đã lưu'}
                  </Badge>
                )}
                {showAsTemplate && (
                  <Badge variant="outline" className="ml-2">Template</Badge>
                )}
                {tournamentId && !isLoadingRewards && (
                  <Badge variant="outline" className="ml-2 text-xs bg-green-50 text-green-700 border-green-200">
                    Real-time
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {showAsTemplate ? (
                  <>
                    Tổng giải thưởng: <span className="font-semibold text-yellow-600">{formatCurrency(displayRewards.totalPrize)}</span>
                    {entryFee > 0 && <span className="ml-2 text-xs text-blue-600">(Từ phí đăng ký: {formatCurrency(entryFee)} × {maxParticipants})</span>}
                  </>
                ) : tournamentId && dbRewards ? (
                  <span className="text-green-600">Dữ liệu từ database • Cập nhật thời gian thực</span>
                ) : (
                  'Phần thưởng được cấu hình cho giải đấu này'
                )}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {/* Refresh Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoadingRewards || isSaving}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                title="Cập nhật dữ liệu từ database"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingRewards ? 'animate-spin' : ''}`} />
                {isLoadingRewards ? 'Đang tải...' : 'Làm mới'}
              </Button>
              
              {isEditable && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditModalOpen(true)}
                  disabled={isSaving || isLoadingRewards}
                  className="flex items-center gap-2 border-blue-500 text-blue-600 hover:bg-blue-50"
                >
                  <Edit className="w-4 h-4" />
                  {isSaving ? 'Đang lưu...' : 'Chỉnh sửa'}
                </Button>
              )}
              {showAsTemplate && onUseTemplate && (
                <Button 
                  onClick={handleUseTemplate} 
                  size="sm" 
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Áp dụng template
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
        {/* Prize Pool Summary */}
        {displayRewards.showPrizes && displayRewards.totalPrize > 0 && (
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-yellow-600" />
              <span className="font-semibold text-yellow-800">
                Tổng giải thưởng: {formatPrizeAmount(displayRewards.totalPrize)}
              </span>
            </div>
          </div>
        )}

        {/* Position Rewards */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Phần thưởng theo vị trí</h3>
          
          {(displayRewards.positions && displayRewards.positions.length > 0) ? (
            <div className="space-y-2">
              {/* Display all positions from 1 to 16 */}
              {Array.from({ length: Math.min(maxParticipants, 16) }, (_, i) => i + 1).map((positionNumber) => {
                const position = displayRewards.positions.find(p => p.position === positionNumber);
                const templateData = showAsTemplate ? getTemplateRewardData(positionNumber) : null;
                
                // If no position data exists for this position, create default one
                const displayPosition = position || {
                  position: positionNumber,
                  name: `Hạng ${positionNumber}`,
                  eloPoints: positionNumber <= 8 ? 25 : 10,
                  spaPoints: positionNumber <= 8 ? 300 : 100,
                  cashPrize: 0,
                  items: [],
                  isVisible: true
                };
                
                return showAsTemplate ? (
                  // Template display format
                  <div
                    key={positionNumber}
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      {templateData?.icon}
                      <div>
                        <Badge className={templateData?.badge.className}>
                          {displayPosition.name}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 items-center text-sm">
                      {/* Physical Rewards */}
                      <div className="text-center">
                        <div className="text-lg">
                          {getPhysicalRewardIcons(displayPosition.items)}
                        </div>
                        <p className="text-xs text-muted-foreground">Hiện vật</p>
                      </div>

                      {/* Prize Money */}
                      <div className="text-center">
                        <p className="font-semibold text-yellow-600">
                          {formatCurrency(displayPosition.cashPrize)}
                        </p>
                        <p className="text-xs text-muted-foreground">Tiền thưởng</p>
                      </div>

                      {/* SPA Points */}
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-blue-600">
                          <Coins className="w-4 h-4" />
                          <span className="font-semibold">{displayPosition.spaPoints}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">SPA</p>
                      </div>

                      {/* ELO Points */}
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-green-600">
                          <Target className="w-4 h-4" />
                          <span className="font-semibold">+{displayPosition.eloPoints}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">ELO</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Standard display format
                  <div key={positionNumber} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="font-bold text-primary">{displayPosition.position}</span>
                        </div>
                        <div>
                          <h4 className="font-semibold">{displayPosition.name}</h4>
                          {displayRewards.showPrizes && displayPosition.cashPrize > 0 && (
                            <p className="text-sm text-green-600 font-medium">
                              {formatPrizeAmount(displayPosition.cashPrize)}
                            </p>
                          )}
                          {!position && (
                            <p className="text-xs text-gray-400">Chưa có phần thưởng</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                          {displayPosition.eloPoints} ELO
                        </Badge>
                        <Badge variant="secondary" className="bg-yellow-50 text-yellow-700">
                          {displayPosition.spaPoints} SPA
                        </Badge>
                      </div>
                    </div>
                    
                    {displayPosition.items?.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Gift className="w-3 h-3" />
                          Giải thưởng hiện vật:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {displayPosition.items.map((item: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                              <Gift className="w-3 h-3 mr-1" />
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Chưa có phần thưởng nào được cấu hình</p>
              {isEditable && (
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditModalOpen(true)}
                  className="mt-4"
                >
                  Thiết lập phần thưởng
                </Button>
              )}
            </div>
          )}
          
          {showAsTemplate && maxParticipants > 16 && (
            <p className="text-xs text-muted-foreground mt-3 text-center">
              * Chỉ hiển thị top 16 vị trí có phần thưởng
            </p>
          )}
        </div>
        </CardContent>
      </Card>

      {/* Financial Summary - Enhanced Mode Only */}
      {showFinancialSummary && entryFee > 0 && maxParticipants > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="w-5 h-5 text-green-500" />
              Tổng quan tài chính
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {totalRevenue.toLocaleString('vi-VN')}₫
                </div>
                <div className="text-sm text-blue-700">Tổng thu</div>
                <div className="text-xs text-muted-foreground">
                  {maxParticipants} × {entryFee.toLocaleString('vi-VN')}₫
                </div>
              </div>
              
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {displayRewards.totalPrize.toLocaleString('vi-VN')}₫
                </div>
                <div className="text-sm text-yellow-700">Giải thưởng</div>
                <div className="text-xs text-muted-foreground">
                  {totalRevenue > 0 ? ((displayRewards.totalPrize / totalRevenue) * 100).toFixed(1) : 0}% tổng thu
                </div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className={`text-2xl font-bold ${clubProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {clubProfit.toLocaleString('vi-VN')}₫
                </div>
                <div className="text-sm text-green-700">Lợi nhuận CLB</div>
                <div className="text-xs text-muted-foreground">
                  {totalRevenue > 0 ? ((clubProfit / totalRevenue) * 100).toFixed(1) : 0}% tổng thu
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Information */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-primary">
            <Info className="w-4 h-4" />
            Thông tin quan trọng
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">ELO</Badge>
              <span>Điểm chính thức, ảnh hưởng trực tiếp đến hạng của bạn</span>
            </div>
            
            <div className="flex items-start gap-2">
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 text-xs">SPA</Badge>
              <span>Điểm "vui", không ảnh hưởng hạng chính thức nhưng có thể đổi quà</span>
            </div>
            
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="text-xs">Hạng</Badge>
              <span>Điểm SPA phụ thuộc vào hạng hiện tại - hạng cao hơn = SPA nhiều hơn</span>
            </div>
            
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="text-xs">Vị trí</Badge>
              <span>Điểm ELO cố định theo vị trí cuối cùng trong giải đấu</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <RewardsEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          rewards={activeRewards || generateTemplateRewards()}
          onSave={handleSaveRewards}
          maxParticipants={maxParticipants}
          entryFee={entryFee}
          disabled={isSaving}
        />
      )}
        </>
      )}
    </div>
  );
};

export default OptimizedRewardsSection;