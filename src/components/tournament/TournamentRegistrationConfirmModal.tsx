import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  MapPin,
  Users,
  Trophy,
  Coins,
  Clock,
  User,
} from 'lucide-react';
import { Tournament } from '@/types/tournament';
import { formatCurrency } from '@/lib/utils';

interface TournamentRegistrationConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  tournament: Tournament | null;
  isLoading?: boolean;
}

export const TournamentRegistrationConfirmModal: React.FC<
  TournamentRegistrationConfirmModalProps
> = ({ isOpen, onClose, onConfirm, tournament, isLoading = false }) => {
  if (!tournament) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTierColor = (status: string) => {
    switch (status) {
      case 'registration_open':
        return 'bg-green-100 text-green-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-2xl max-h-[80vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='text-xl font-bold text-center'>
            🏆 Xác nhận đăng ký tham gia giải đấu
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Tournament Basic Info */}
          <Card>
            <CardContent className='pt-6'>
              <div className='space-y-4'>
                <div className='flex items-start justify-between'>
                  <h3 className='text-lg font-semibold text-primary line-clamp-2'>
                    {tournament.name}
                  </h3>
                  <Badge className={getTierColor(tournament.status)}>
                    {tournament.status === 'registration_open'
                      ? 'Đang mở đăng ký'
                      : 'Sắp diễn ra'}
                  </Badge>
                </div>

                {tournament.description && (
                  <p className='text-sm text-muted-foreground line-clamp-2'>
                    {tournament.description}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Tournament Details */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {/* Date & Time */}
            <div className='space-y-3'>
              <div className='flex items-center gap-2 text-sm'>
                <Calendar className='h-4 w-4 text-primary' />
                <div>
                  <div className='font-medium'>Ngày thi đấu</div>
                  <div className='text-muted-foreground'>
                    {formatDate(tournament.tournament_start)}
                  </div>
                </div>
              </div>

              <div className='flex items-center gap-2 text-sm'>
                <Clock className='h-4 w-4 text-primary' />
                <div>
                  <div className='font-medium'>Thời gian</div>
                  <div className='text-muted-foreground'>
                    {formatTime(tournament.tournament_start)}
                  </div>
                </div>
              </div>
            </div>

            {/* Location & Participants */}
            <div className='space-y-3'>
              {tournament.venue_address && (
                <div className='flex items-center gap-2 text-sm'>
                  <MapPin className='h-4 w-4 text-primary' />
                  <div>
                    <div className='font-medium'>Địa điểm</div>
                    <div className='text-muted-foreground line-clamp-1'>
                      {tournament.venue_address}
                    </div>
                  </div>
                </div>
              )}

              <div className='flex items-center gap-2 text-sm'>
                <Users className='h-4 w-4 text-primary' />
                <div>
                  <div className='font-medium'>Số lượng tham gia</div>
                  <div className='text-muted-foreground'>
                    {tournament.current_participants}/
                    {tournament.max_participants} người
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Prize & Fee Information */}
          <div className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* Entry Fee */}
              <Card className='bg-blue-50 border-blue-200'>
                <CardContent className='pt-4'>
                  <div className='flex items-center gap-2'>
                    <Coins className='h-5 w-5 text-blue-600' />
                    <div>
                      <div className='font-semibold text-blue-800'>
                        Phí đăng ký
                      </div>
                      <div className='text-xl font-bold text-blue-900'>
                        {formatCurrency(tournament.entry_fee)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Prize Pool */}
              <Card className='bg-yellow-50 border-yellow-200'>
                <CardContent className='pt-4'>
                  <div className='flex items-center gap-2'>
                    <Trophy className='h-5 w-5 text-yellow-600' />
                    <div>
                      <div className='font-semibold text-yellow-800'>
                        Tổng giải thưởng
                      </div>
                      <div className='text-xl font-bold text-yellow-900'>
                        {formatCurrency(tournament.prize_pool)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Prize Distribution */}
            <div className='bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg'>
              <h4 className='font-semibold text-yellow-800 mb-3 flex items-center gap-2'>
                <Trophy className='h-4 w-4' />
                Phân bổ giải thưởng
              </h4>
              <div className='grid grid-cols-3 gap-3 text-center'>
                <div>
                  <div className='text-2xl mb-1'>🥇</div>
                  <div className='font-semibold text-yellow-700'>Nhất</div>
                  <div className='text-sm text-yellow-600'>
                    {formatCurrency(tournament.first_prize)}
                  </div>
                </div>
                <div>
                  <div className='text-2xl mb-1'>🥈</div>
                  <div className='font-semibold text-gray-700'>Nhì</div>
                  <div className='text-sm text-gray-600'>
                    {formatCurrency(tournament.second_prize)}
                  </div>
                </div>
                <div>
                  <div className='text-2xl mb-1'>🥉</div>
                  <div className='font-semibold text-orange-700'>Ba</div>
                  <div className='text-sm text-orange-600'>
                    {formatCurrency(tournament.third_prize)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Registration Info */}
          <div className='bg-blue-50 p-4 rounded-lg'>
            <div className='flex items-start gap-2'>
              <User className='h-5 w-5 text-blue-600 mt-0.5' />
              <div className='text-sm'>
                <div className='font-semibold text-blue-800 mb-1'>
                  Thông tin đăng ký
                </div>
                <ul className='text-blue-700 space-y-1'>
                  <li>
                    • Bạn sẽ được xác nhận tham gia sau khi thanh toán phí đăng
                    ký
                  </li>
                  <li>• Vui lòng đọc kỹ thể lệ giải đấu trước khi tham gia</li>
                  <li>• Có thể hủy đăng ký trước thời hạn quy định</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className='flex gap-3 pt-4'>
            <Button
              variant='outline'
              onClick={onClose}
              className='flex-1'
              disabled={isLoading}
            >
              Hủy bỏ
            </Button>
            <Button
              onClick={onConfirm}
              className='flex-1 bg-primary hover:bg-primary/90'
              disabled={isLoading}
            >
              {isLoading ? (
                <div className='flex items-center gap-2'>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                  Đang xử lý...
                </div>
              ) : (
                '✅ Xác nhận đăng ký'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TournamentRegistrationConfirmModal;
