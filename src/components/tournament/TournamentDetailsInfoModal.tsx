import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, Trophy, DollarSign } from 'lucide-react';
import { EnhancedTournament } from '@/types/tournament-extended';
import {
  formatPrizeDistribution,
  calculateTotalPrizePool,
  formatCurrency,
} from '@/utils/prizeUtils';
import { TournamentAdapter } from '@/utils/tournamentAdapter';
import { formatSafeDate, formatSafeDateWithTime } from '@/utils/dateUtils';

interface TournamentDetailsInfoModalProps {
  tournament: EnhancedTournament | any; // Accept both types for compatibility
  isOpen: boolean;
  onClose: () => void;
}

const TournamentDetailsInfoModal: React.FC<TournamentDetailsInfoModalProps> = ({
  tournament,
  isOpen,
  onClose,
}) => {
  // Convert to legacy format for prize calculations if needed
  const legacyTournament =
    tournament.first_prize !== undefined
      ? tournament
      : TournamentAdapter.toLegacy(tournament);

  const prizeDistribution = formatPrizeDistribution(legacyTournament);
  const totalPrizePool =
    tournament.prize_pool || calculateTotalPrizePool(legacyTournament);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      upcoming: {
        label: 'Sắp diễn ra',
        className: 'bg-blue-100 text-blue-800',
      },
      registration_open: {
        label: 'Đang mở đăng ký',
        className: 'bg-green-100 text-green-800',
      },
      registration_closed: {
        label: 'Đã đóng đăng ký',
        className: 'bg-yellow-100 text-yellow-800',
      },
      ongoing: {
        label: 'Đang diễn ra',
        className: 'bg-orange-100 text-orange-800',
      },
      completed: {
        label: 'Đã kết thúc',
        className: 'bg-gray-100 text-gray-800',
      },
    };

    return (
      statusConfig[status as keyof typeof statusConfig] || {
        label: status,
        className: 'bg-gray-100 text-gray-800',
      }
    );
  };

  const statusBadge = getStatusBadge(tournament.status || 'upcoming');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Trophy className='w-5 h-5 text-tournament-gold' />
            {tournament.name}
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Status and Tournament Type */}
          <div className='flex justify-center gap-4'>
            <Badge className={statusBadge.className}>{statusBadge.label}</Badge>
            <Badge variant='outline'>
              {tournament.tournament_type === 'single_elimination'
                ? 'Loại trực tiếp'
                : tournament.tournament_type === 'double_elimination'
                  ? 'Loại kép'
                  : tournament.tournament_type || 'Chưa xác định'}
            </Badge>
          </div>

          {/* Basic Info */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='flex items-center gap-2'>
              <Calendar className='w-4 h-4 text-muted-foreground' />
              <div>
                <p className='text-sm text-muted-foreground'>Ngày bắt đầu</p>
                <p className='font-medium'>
                  {formatSafeDate(
                    tournament.tournament_start,
                    tournament.start_date
                  )}
                </p>
              </div>
            </div>

            <div className='flex items-center gap-2'>
              <Users className='w-4 h-4 text-muted-foreground' />
              <div>
                <p className='text-sm text-muted-foreground'>
                  Số lượng tham gia
                </p>
                <p className='font-medium'>
                  {tournament.max_participants || 'Không giới hạn'} người
                </p>
              </div>
            </div>

            <div className='flex items-center gap-2'>
              <DollarSign className='w-4 h-4 text-muted-foreground' />
              <div>
                <p className='text-sm text-muted-foreground'>Lệ phí tham gia</p>
                <p className='font-medium'>
                  {formatCurrency(tournament.entry_fee || 0)}
                </p>
              </div>
            </div>

            <div className='flex items-center gap-2'>
              <MapPin className='w-4 h-4 text-muted-foreground' />
              <div>
                <p className='text-sm text-muted-foreground'>Địa điểm</p>
                <p className='font-medium'>
                  {tournament.venue_address || 'Chưa xác định'}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          {tournament.description && (
            <div>
              <h3 className='text-lg font-semibold mb-2'>Mô tả</h3>
              <p className='text-muted-foreground whitespace-pre-wrap'>
                {tournament.description}
              </p>
            </div>
          )}

          {/* Prize Distribution */}
          {prizeDistribution.length > 0 && (
            <div>
              <h3 className='text-lg font-semibold mb-3 flex items-center gap-2'>
                <Trophy className='w-5 h-5 text-tournament-gold' />
                Phân bố giải thưởng
              </h3>

              {/* Total Prize Pool */}
              <div className='bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg mb-4'>
                <div className='text-center'>
                  <p className='text-sm text-muted-foreground'>
                    Tổng giải thưởng
                  </p>
                  <p className='text-2xl font-bold text-tournament-gold'>
                    {formatCurrency(totalPrizePool)}
                  </p>
                </div>
              </div>

              {/* Prize Breakdown */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                {prizeDistribution.map((prize, index) => (
                  <div
                    key={index}
                    className='flex justify-between items-center p-3 bg-muted/50 rounded-lg'
                  >
                    <span className='font-medium'>{prize.position}</span>
                    <span className='text-tournament-gold font-semibold'>
                      {formatCurrency(prize.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tournament Rules */}
          <div>
            <h3 className='text-lg font-semibold mb-2'>Thể thức thi đấu</h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <p className='text-sm text-muted-foreground'>Loại giải đấu</p>
                <p className='font-medium capitalize'>
                  {tournament.tournament_type?.replace('_', ' ') ||
                    'Single Elimination'}
                </p>
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>Cấp độ</p>
                <p className='font-medium'>
                  {tournament.tier_level
                    ? `Cấp ${tournament.tier_level}`
                    : 'Mở rộng'}
                </p>
              </div>
            </div>
          </div>

          {/* Registration Deadline */}
          {tournament.registration_end && (
            <div className='bg-blue-50 p-4 rounded-lg'>
              <div className='flex items-center gap-2'>
                <Calendar className='w-4 h-4 text-blue-600' />
                <div>
                  <p className='text-sm text-blue-600'>Hạn chót đăng ký</p>
                  <p className='font-medium text-blue-800'>
                    {formatSafeDateWithTime(tournament.registration_end)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TournamentDetailsInfoModal;
