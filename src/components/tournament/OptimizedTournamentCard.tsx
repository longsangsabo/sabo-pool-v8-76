import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CalendarDays,
  MapPin,
  Users,
  Trophy,
  Star,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { Tournament } from '@/types/tournament';
import { formatCurrency } from '@/utils/prizeUtils';
import {
  getTournamentTypeText,
  getTierText,
  formatTournamentDateTime,
} from '@/utils/tournamentHelpers';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useOptimizedResponsive } from '@/hooks/useOptimizedResponsive';

interface OptimizedTournamentCardProps {
  tournament: Tournament;
  onRegister?: () => void;
  onViewDetails?: () => void;
  showActions?: boolean;
}

const OptimizedTournamentCard: React.FC<OptimizedTournamentCardProps> = ({
  tournament,
  onRegister,
  onViewDetails,
  showActions = true,
}) => {
  const { user } = useAuth();
  const { isMobile } = useOptimizedResponsive();
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [checkingRegistration, setCheckingRegistration] = useState(false);
  const [currentParticipants, setCurrentParticipants] = useState(
    tournament.current_participants || 0
  );
  const [realTimePrizeInfo, setRealTimePrizeInfo] = useState({
    totalPrize: 0,
    spaPoints: 0,
    physicalPrizes: [],
  });

  // Check if user is registered for this tournament and get real participant count
  useEffect(() => {
    const checkRegistrationAndParticipants = async () => {
      setCheckingRegistration(true);
      try {
        // Get total participants count - count all registrations regardless of status
        const { data: allRegistrations, error: countError } = await supabase
          .from('tournament_registrations')
          .select('user_id, registration_status')
          .eq('tournament_id', tournament.id);

        if (countError) {
          console.error('Error getting participant count:', countError);
        } else {
          setCurrentParticipants(allRegistrations?.length || 0);
        }

        // Check user registration if logged in
        if (user?.id) {
          const { data, error } = await supabase
            .from('tournament_registrations')
            .select('*')
            .eq('tournament_id', tournament.id)
            .eq('user_id', user.id)
            .maybeSingle();

          if (error && error.code !== 'PGRST116') {
            console.error('Error checking registration:', error);
            return;
          }

          setIsRegistered(!!data);
        } else {
          setIsRegistered(false);
        }
      } catch (error) {
        console.error('Error checking registration:', error);
      } finally {
        setCheckingRegistration(false);
      }
    };

    checkRegistrationAndParticipants();
  }, [user?.id, tournament.id]);

  // Get real-time prize and reward information
  useEffect(() => {
    const fetchTournamentRewards = async () => {
      try {
        // Use tournament.prize_pool directly as primary source
        let totalCashPrize = tournament.prize_pool || 0;
        let totalSpaPoints = 0;
        let physicalPrizesList: string[] = [];

        // Only fetch from database tables if prize_pool is 0
        if (totalCashPrize === 0) {
          // Fetch from tournament_prize_tiers table for accurate prize info
          const { data: prizeTiers, error: prizeError } = await supabase
            .from('tournament_prize_tiers')
            .select('*')
            .eq('tournament_id', tournament.id)
            .order('position');

          // Fetch from tournament_point_configs for SPA points
          const { data: pointConfig, error: pointError } = await supabase
            .from('tournament_point_configs')
            .select('*')
            .eq('tournament_id', tournament.id)
            .maybeSingle();

          // Fetch physical prizes
          const { data: physicalPrizes, error: physicalError } = await supabase
            .from('tournament_physical_prizes')
            .select('*')
            .eq('tournament_id', tournament.id);

          // Calculate total cash prize from prize tiers
          if (prizeTiers && !prizeError) {
            totalCashPrize = prizeTiers.reduce(
              (sum, tier) => sum + (tier.cash_amount || 0),
              0
            );
          }

          // Get SPA points from point config
          if (pointConfig && !pointError) {
            totalSpaPoints = pointConfig.base_points || 0;
          }

          // Get physical prizes list
          if (physicalPrizes && !physicalError) {
            physicalPrizesList = physicalPrizes.map(
              prize => prize.item_name || ''
            );
          }

          // Final fallback to original calculation if still 0
          if (totalCashPrize === 0) {
            const fallbackInfo = calculatePrizeInfo();
            totalCashPrize = fallbackInfo.totalPrize;
            totalSpaPoints = fallbackInfo.spaPoints;
            physicalPrizesList = fallbackInfo.physicalPrizes;
          }
        }

        setRealTimePrizeInfo({
          totalPrize: totalCashPrize,
          spaPoints: totalSpaPoints,
          physicalPrizes: physicalPrizesList,
        });
      } catch (error) {
        console.error('Error fetching tournament rewards:', error);
        // Use fallback calculation
        const fallbackInfo = calculatePrizeInfo();
        setRealTimePrizeInfo({
          totalPrize: fallbackInfo.totalPrize,
          spaPoints: fallbackInfo.spaPoints,
          physicalPrizes: fallbackInfo.physicalPrizes,
        });
      }
    };

    fetchTournamentRewards();
  }, [tournament.id, tournament.prize_pool]);

  // Get current SPA points
  const getCurrentSpaPoints = async (): Promise<number> => {
    try {
      const { data, error } = await supabase
        .from('player_rankings')
        .select('spa_points')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error || !data) return 0;
      return data.spa_points || 0;
    } catch {
      return 0;
    }
  };

  // Handle unregister with SPA penalty
  const handleUnregister = async () => {
    if (!user?.id || registrationLoading) return;

    const confirmed = window.confirm(
      `Bạn có chắc muốn hủy đăng ký giải đấu này không?\n\n` +
        `⚠️ Lưu ý: Bạn sẽ bị trừ 20 điểm SPA khi hủy đăng ký!`
    );

    if (!confirmed) return;

    setRegistrationLoading(true);
    try {
      // Delete registration
      const { error: deleteError } = await supabase
        .from('tournament_registrations')
        .delete()
        .eq('tournament_id', tournament.id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // Apply SPA penalty (-20 points)
      const currentSpaPoints = await getCurrentSpaPoints();
      const { error: spaError } = await supabase
        .from('player_rankings')
        .update({
          spa_points: Math.max(0, currentSpaPoints - 20),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (spaError) console.error('SPA penalty error:', spaError);

      // Log the penalty
      await supabase.from('spa_points_log').insert({
        user_id: user.id,
        points: -20,
        category: 'tournament_cancellation',
        description: `Hủy đăng ký giải đấu: ${tournament.name}`,
        reference_id: tournament.id,
        reference_type: 'tournament',
      });

      setIsRegistered(false);
      toast.success('Đã hủy đăng ký thành công. Bạn bị trừ 20 điểm SPA.');
    } catch (error: any) {
      console.error('Unregister error:', error);
      toast.error('Có lỗi xảy ra khi hủy đăng ký: ' + error.message);
    } finally {
      setRegistrationLoading(false);
    }
  };

  // Handle register click
  const handleRegisterClick = () => {
    if (isRegistered) {
      handleUnregister();
    } else {
      onRegister?.();
    }
  };

  // Calculate prize and rewards information
  const calculatePrizeInfo = () => {
    let totalPrize = tournament.prize_pool || 0;
    let spaPoints = 0;
    let physicalPrizes: string[] = [];

    // Calculate from entry_fee if no prize_pool is set
    if (
      totalPrize === 0 &&
      tournament.entry_fee &&
      tournament.max_participants
    ) {
      totalPrize = tournament.entry_fee * tournament.max_participants;
    }

    // Note: prize_distribution removed - using tournament_prize_tiers table

    // Get SPA points
    if (tournament.spa_points_config) {
      const spaData =
        typeof tournament.spa_points_config === 'string'
          ? JSON.parse(tournament.spa_points_config)
          : tournament.spa_points_config;

      spaPoints =
        spaData?.['1'] || spaData?.winner || spaData?.winner_points || 0;
    }

    // Get physical prizes
    if (
      tournament.physical_prizes &&
      Array.isArray(tournament.physical_prizes)
    ) {
      physicalPrizes = tournament.physical_prizes;
    }

    return { totalPrize, spaPoints, physicalPrizes };
  };

  const { totalPrize, spaPoints, physicalPrizes } = calculatePrizeInfo();

  // Get tournament status info
  const getStatusInfo = () => {
    const now = new Date();
    const regStart = tournament.registration_start
      ? new Date(tournament.registration_start)
      : null;
    const regEnd = tournament.registration_end
      ? new Date(tournament.registration_end)
      : null;
    const tournamentStart = tournament.tournament_start
      ? new Date(tournament.tournament_start)
      : null;

    if (tournament.status === 'completed') {
      return {
        status: 'completed',
        text: 'Đã hoàn thành',
        color: 'bg-gray-500',
      };
    }

    if (tournament.status === 'ongoing') {
      return { status: 'ongoing', text: 'Đang diễn ra', color: 'bg-green-500' };
    }

    if (tournament.status === 'cancelled') {
      return { status: 'cancelled', text: 'Đã hủy', color: 'bg-red-500' };
    }

    if (regStart && now < regStart) {
      return {
        status: 'upcoming',
        text: 'Sắp mở đăng ký',
        color: 'bg-blue-500',
      };
    }

    if (regEnd && now > regEnd) {
      return {
        status: 'registration_closed',
        text: 'Đã đóng đăng ký',
        color: 'bg-orange-500',
      };
    }

    if (currentParticipants >= tournament.max_participants) {
      return { status: 'full', text: 'Đã đầy', color: 'bg-red-500' };
    }

    return {
      status: 'registration_open',
      text: 'Đang mở đăng ký',
      color: 'bg-green-500',
    };
  };

  const statusInfo = getStatusInfo();

  // Calculate available slots
  const availableSlots = tournament.max_participants - currentParticipants;

  return (
    <Card className='w-full max-w-md mx-auto hover:shadow-lg transition-shadow duration-200 overflow-hidden'>
      <CardHeader className={isMobile ? 'pb-2 px-4 pt-4' : 'pb-3'}>
        <div className='flex items-start justify-between'>
          <CardTitle
            className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-gray-900 line-clamp-2 flex-1 mr-2`}
          >
            {tournament.name}
          </CardTitle>
          <Badge
            className={`${statusInfo.color} text-white text-xs px-2 py-1 rounded-full whitespace-nowrap`}
          >
            {statusInfo.text}
          </Badge>
        </div>

        {tournament.description && (
          <p
            className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 line-clamp-2 mt-1`}
          >
            {tournament.description}
          </p>
        )}
      </CardHeader>

      <CardContent
        className={`pt-0 ${isMobile ? 'space-y-2 px-4 pb-4' : 'space-y-3'}`}
      >
        {/* Tournament Format & Type */}
        <div
          className={`flex items-center justify-between ${isMobile ? 'text-xs' : 'text-sm'}`}
        >
          <div className='flex items-center space-x-2'>
            <Trophy
              className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-amber-500`}
            />
            <span className='font-medium text-gray-700'>
              {getTournamentTypeText(tournament.tournament_type)}
            </span>
          </div>
          <span className='text-gray-500'>
            {tournament.game_format === '8_ball'
              ? '8-Ball'
              : tournament.game_format === '9_ball'
                ? '9-Ball'
                : tournament.game_format === '10_ball'
                  ? '10-Ball'
                  : '8-Ball'}
          </span>
        </div>

        {/* Participants */}
        <div
          className={`flex items-center justify-between ${isMobile ? 'text-xs' : 'text-sm'}`}
        >
          <div className='flex items-center space-x-2'>
            <Users
              className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-blue-500`}
            />
            <span className='text-gray-700'>
              {currentParticipants}/{tournament.max_participants} người
            </span>
          </div>
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              tournament.max_participants - currentParticipants > 0
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {tournament.max_participants - currentParticipants > 0
              ? `Còn ${tournament.max_participants - currentParticipants} chỗ`
              : 'Hết chỗ'}
          </span>
        </div>

        {/* Rank Range */}
        {(() => {
          let rankRange = '';

          // Check for specific rank requirements first
          if (
            tournament.min_rank_requirement &&
            tournament.max_rank_requirement
          ) {
            rankRange = `${getTierText(tournament.min_rank_requirement)} → ${getTierText(tournament.max_rank_requirement)}`;
          } else if (tournament.min_rank_requirement) {
            rankRange = `Từ ${getTierText(tournament.min_rank_requirement)} trở lên`;
          } else if (tournament.max_rank_requirement) {
            rankRange = `Tối đa ${getTierText(tournament.max_rank_requirement)}`;
          } else {
            // For tier-based tournaments, show appropriate range
            if (tournament.tier_level) {
              switch (tournament.tier_level) {
                case 1:
                  rankRange = 'Hạng K → Hạng G+';
                  break;
                case 2:
                  rankRange = 'Hạng H → Hạng F+';
                  break;
                case 3:
                  rankRange = 'Hạng F → Hạng E+';
                  break;
                default:
                  rankRange = 'Tất cả hạng';
              }
            } else {
              rankRange = 'Tất cả hạng';
            }
          }

          return (
            <div
              className={`flex items-center justify-between ${isMobile ? 'text-xs' : 'text-sm'}`}
            >
              <div className='flex items-center space-x-2'>
                <Star
                  className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-purple-500`}
                />
                <span className='text-gray-700'>Hạng tham gia:</span>
              </div>
              <span className='text-purple-600 font-medium'>{rankRange}</span>
            </div>
          );
        })()}

        {/* Entry Fee */}
        <div
          className={`flex items-center justify-between ${isMobile ? 'text-xs' : 'text-sm'}`}
        >
          <span className='text-gray-700'>Lệ phí tham gia:</span>
          <span className='font-medium text-gray-900'>
            {tournament.entry_fee
              ? formatCurrency(tournament.entry_fee)
              : 'Miễn phí'}
          </span>
        </div>

        {/* Prize Pool - Make this prominent */}
        <div
          className={`bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg ${isMobile ? 'p-2' : 'p-3'} border border-amber-200`}
        >
          <div className='text-center'>
            <div
              className={`${isMobile ? 'text-xs' : 'text-xs'} text-amber-700 font-medium mb-1`}
            >
              TỔNG GIẢI THƯỞNG
            </div>
            <div
              className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-amber-800 ${isMobile ? 'mb-1' : 'mb-2'}`}
            >
              {realTimePrizeInfo.totalPrize > 0
                ? formatCurrency(realTimePrizeInfo.totalPrize)
                : 'Miễn phí tham gia'}
            </div>
            {realTimePrizeInfo.spaPoints > 0 && (
              <div
                className={`${isMobile ? 'text-xs' : 'text-sm'} text-amber-700`}
              >
                + {realTimePrizeInfo.spaPoints.toLocaleString()} điểm SPA
              </div>
            )}
            {realTimePrizeInfo.physicalPrizes.length > 0 && (
              <div className='text-xs text-amber-600 mt-1'>
                + {realTimePrizeInfo.physicalPrizes.join(', ')}
              </div>
            )}
          </div>
        </div>

        {/* Tournament Date */}
        <div
          className={`flex items-center space-x-2 ${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}
        >
          <CalendarDays className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
          <span>
            {formatTournamentDateTime(
              tournament.tournament_start || (tournament as any).start_date
            )}
          </span>
        </div>

        {/* Location */}
        {tournament.venue_address && (
          <div
            className={`flex items-center space-x-2 ${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}
          >
            <MapPin className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
            <span className='line-clamp-1'>{tournament.venue_address}</span>
          </div>
        )}

        {/* Registration Deadline */}
        {tournament.registration_end && (
          <div
            className={`flex items-center space-x-2 ${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}
          >
            <Clock className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
            <span>
              {isMobile ? 'Hạn ĐK:' : 'Hạn đăng ký:'}{' '}
              {formatTournamentDateTime(tournament.registration_end)}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        {showActions && (
          <div className={`flex space-x-2 ${isMobile ? 'pt-1' : 'pt-2'}`}>
            <Button
              variant='outline'
              size='sm'
              onClick={onViewDetails}
              className={`flex-1 ${isMobile ? 'text-xs h-8' : ''}`}
            >
              Chi tiết
            </Button>
            {((statusInfo.status === 'registration_open' &&
              availableSlots > 0) ||
              isRegistered) && (
              <Button
                size='sm'
                onClick={handleRegisterClick}
                disabled={checkingRegistration || registrationLoading}
                className={`flex-1 flex items-center gap-2 ${isMobile ? 'text-xs h-8' : ''} ${
                  isRegistered
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {registrationLoading ? (
                  <>
                    <div className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin'></div>
                    {isRegistered
                      ? isMobile
                        ? 'Hủy...'
                        : 'Đang hủy...'
                      : isMobile
                        ? 'Đăng ký...'
                        : 'Đang đăng ký...'}
                  </>
                ) : isRegistered ? (
                  <>
                    <AlertTriangle
                      className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`}
                    />
                    {isMobile ? 'Hủy' : 'Hủy đăng ký'}
                  </>
                ) : (
                  'Đăng ký'
                )}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OptimizedTournamentCard;
