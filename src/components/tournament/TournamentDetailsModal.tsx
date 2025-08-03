import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  MapPin,
  Users,
  Trophy,
  DollarSign,
  Clock,
  Star,
  User,
  Shield,
  FileText,
  Phone,
} from 'lucide-react';
import { Tournament } from '@/types/tournament';

interface TournamentDetailsModalProps {
  tournament: Tournament | null;
  isOpen: boolean;
  onClose: () => void;
  onRegister?: (tournamentId: string) => void;
  isRegistered?: boolean;
}

export const TournamentDetailsModal: React.FC<TournamentDetailsModalProps> = ({
  tournament,
  isOpen,
  onClose,
  onRegister,
  isRegistered = false,
}) => {
  if (!tournament) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'registration_open':
        return 'bg-accent-green text-white';
      case 'ongoing':
        return 'bg-accent-red text-white animate-pulse';
      case 'completed':
        return 'bg-muted text-muted-foreground';
      case 'registration_closed':
        return 'bg-muted text-muted-foreground';
      case 'cancelled':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'registration_open':
        return 'Đang mở đăng ký';
      case 'ongoing':
        return 'Đang diễn ra';
      case 'completed':
        return 'Đã kết thúc';
      case 'registration_closed':
        return 'Đã đóng đăng ký';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Chưa xác định';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const gameFormatDisplay = {
    '8_ball': '8-Ball Pool',
    '9_ball': '9-Ball Pool',
    '10_ball': '10-Ball Pool',
    straight_pool: 'Straight Pool',
  };

  const tournamentTypeDisplay = {
    single_elimination: 'Loại trực tiếp',
    double_elimination: 'Loại kép',
    round_robin: 'Vòng tròn',
    swiss: 'Swiss System',
  };

  const participantPercentage = Math.round(
    ((tournament.current_participants || 0) /
      (tournament.max_participants || 1)) *
      100
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className='max-w-2xl max-h-[90vh] overflow-y-auto'
        onInteractOutside={e => e.preventDefault()}
      >
        <DialogHeader>
          <div className='flex items-start justify-between'>
            <DialogTitle className='text-xl font-bold pr-4 line-clamp-2'>
              {tournament.name}
            </DialogTitle>
            <Badge className={getStatusColor(tournament.status)}>
              {getStatusText(tournament.status)}
            </Badge>
          </div>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Description */}
          {tournament.description && (
            <div>
              <h3 className='font-semibold mb-2 flex items-center'>
                <FileText className='h-4 w-4 mr-2 text-primary' />
                Mô tả
              </h3>
              <p className='text-muted-foreground leading-relaxed'>
                {tournament.description}
              </p>
            </div>
          )}

          <Separator />

          {/* Tournament Info Grid */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {/* Date & Time */}
            <div className='space-y-2'>
              <h3 className='font-semibold flex items-center'>
                <Calendar className='h-4 w-4 mr-2 text-accent-blue' />
                Thời gian
              </h3>
              <div className='space-y-1 text-sm'>
                <div>
                  <span className='text-muted-foreground'>Bắt đầu: </span>
                  <span>{formatDate(tournament.tournament_start)}</span>
                </div>
                {tournament.tournament_end && (
                  <div>
                    <span className='text-muted-foreground'>Kết thúc: </span>
                    <span>{formatDate(tournament.tournament_end)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Registration Period */}
            <div className='space-y-2'>
              <h3 className='font-semibold flex items-center'>
                <Clock className='h-4 w-4 mr-2 text-accent-purple' />
                Đăng ký
              </h3>
              <div className='space-y-1 text-sm'>
                {tournament.registration_start && (
                  <div>
                    <span className='text-muted-foreground'>Mở: </span>
                    <span>{formatDate(tournament.registration_start)}</span>
                  </div>
                )}
                {tournament.registration_end && (
                  <div>
                    <span className='text-muted-foreground'>Đóng: </span>
                    <span>{formatDate(tournament.registration_end)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Location */}
            {tournament.venue_address && (
              <div className='space-y-2'>
                <h3 className='font-semibold flex items-center'>
                  <MapPin className='h-4 w-4 mr-2 text-accent-red' />
                  Địa điểm
                </h3>
                <p className='text-sm text-muted-foreground'>
                  {tournament.venue_address}
                </p>
              </div>
            )}

            {/* Contact Info */}
            {tournament.contact_info && (
              <div className='space-y-2'>
                <h3 className='font-semibold flex items-center'>
                  <Phone className='h-4 w-4 mr-2 text-accent-green' />
                  Liên hệ
                </h3>
                <p className='text-sm text-muted-foreground'>
                  {tournament.contact_info}
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Tournament Details */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-muted-foreground flex items-center'>
                  <Star className='h-4 w-4 mr-2 text-primary' />
                  Thể thức
                </span>
                <span className='text-sm font-medium'>
                  {gameFormatDisplay[
                    tournament.game_format as keyof typeof gameFormatDisplay
                  ] ||
                    tournament.game_format ||
                    'Chưa xác định'}
                </span>
              </div>

              <div className='flex items-center justify-between'>
                <span className='text-sm text-muted-foreground flex items-center'>
                  <Trophy className='h-4 w-4 mr-2 text-primary' />
                  Loại giải
                </span>
                <span className='text-sm font-medium'>
                  {tournamentTypeDisplay[
                    tournament.tournament_type as keyof typeof tournamentTypeDisplay
                  ] ||
                    tournament.tournament_type ||
                    'Chưa xác định'}
                </span>
              </div>

              <div className='flex items-center justify-between'>
                <span className='text-sm text-muted-foreground flex items-center'>
                  <DollarSign className='h-4 w-4 mr-2 text-accent-green' />
                  Phí tham gia
                </span>
                <span className='text-sm font-medium text-primary'>
                  {(tournament.entry_fee || 0) === 0
                    ? 'Miễn phí'
                    : formatCurrency(tournament.entry_fee || 0)}
                </span>
              </div>
            </div>

            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-muted-foreground flex items-center'>
                  <Users className='h-4 w-4 mr-2 text-accent-blue' />
                  Số lượng
                </span>
                <span className='text-sm font-medium'>
                  {tournament.current_participants || 0}/
                  {tournament.max_participants || 0} người
                </span>
              </div>

              {tournament.prize_pool && tournament.prize_pool > 0 && (
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-muted-foreground flex items-center'>
                    <Trophy className='h-4 w-4 mr-2 text-accent-gold' />
                    Tổng giải thưởng
                  </span>
                  <span className='text-sm font-medium text-primary'>
                    {formatCurrency(tournament.prize_pool)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className='space-y-2'>
            <div className='flex items-center justify-between text-sm'>
              <span className='text-muted-foreground'>Tiến độ đăng ký</span>
              <span className='font-medium'>{participantPercentage}%</span>
            </div>
            <div className='w-full bg-muted rounded-full h-2 overflow-hidden'>
              <div
                className='h-full bg-gradient-to-r from-accent-blue to-primary rounded-full transition-all duration-500'
                style={{ width: `${participantPercentage}%` }}
              />
            </div>
          </div>

          {/* Rules */}
          {tournament.rules && (
            <>
              <Separator />
              <div>
                <h3 className='font-semibold mb-2'>Thể lệ</h3>
                <p className='text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap'>
                  {tournament.rules}
                </p>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className='flex gap-3 pt-4'>
            <Button
              variant='outline'
              onClick={e => {
                e.stopPropagation();
                onClose();
              }}
              className='flex-1'
            >
              Đóng
            </Button>

            {tournament.status === 'registration_open' &&
              !isRegistered &&
              (tournament.current_participants || 0) <
                (tournament.max_participants || 0) && (
                <Button
                  onClick={() => onRegister?.(tournament.id)}
                  className='flex-1 bg-green-600 hover:bg-green-700 text-white'
                >
                  <Users className='h-4 w-4 mr-2' />
                  Đăng ký tham gia
                </Button>
              )}

            {isRegistered && (
              <Button
                variant='outline'
                disabled
                className='flex-1 border-green-200 text-green-700'
              >
                ✓ Đã đăng ký
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
