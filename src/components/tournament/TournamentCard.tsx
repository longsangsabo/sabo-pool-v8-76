import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarIcon, MapPinIcon, UsersIcon, TrophyIcon } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { EnhancedTournamentDetailsModal } from './EnhancedTournamentDetailsModal';
import { TournamentRegistrationModal } from './TournamentRegistrationModal';
import type { Tournament } from '@/types/tournament';

interface TournamentCardProps {
  tournament: Tournament;
}

export function TournamentCard({ tournament }: TournamentCardProps) {
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'registration_open':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'registration_closed':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ongoing':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'Sắp diễn ra';
      case 'registration_open':
        return 'Đang đăng ký';
      case 'registration_closed':
        return 'Đã đóng đăng ký';
      case 'ongoing':
        return 'Đang diễn ra';
      case 'completed':
        return 'Đã kết thúc';
      default:
        return 'Không xác định';
    }
  };

  return (
    <>
      <Card className='group hover:shadow-lg transition-all duration-200 cursor-pointer border-border/50 hover:border-border'>
        <CardHeader className='pb-3'>
          <div className='flex items-start justify-between'>
            <CardTitle className='text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2'>
              {tournament.name}
            </CardTitle>
            <Badge
              variant='outline'
              className={`ml-2 flex-shrink-0 ${getStatusColor(tournament.status)}`}
            >
              {getStatusText(tournament.status)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className='space-y-3'>
          <div className='flex items-center text-sm text-muted-foreground'>
            <CalendarIcon className='h-4 w-4 mr-2 flex-shrink-0' />
            <span>
              {tournament.tournament_start
                ? format(
                    new Date(tournament.tournament_start),
                    'dd/MM/yyyy HH:mm',
                    { locale: vi }
                  )
                : 'Chưa xác định'}
            </span>
          </div>

          <div className='flex items-center text-sm text-muted-foreground'>
            <MapPinIcon className='h-4 w-4 mr-2 flex-shrink-0' />
            <span className='line-clamp-1'>
              {tournament.venue_address || 'Chưa xác định địa điểm'}
            </span>
          </div>

          <div className='flex items-center justify-between text-sm'>
            <div className='flex items-center text-muted-foreground'>
              <UsersIcon className='h-4 w-4 mr-2' />
              <span>
                {tournament.current_participants || 0}/
                {tournament.max_participants}
              </span>
            </div>
            <div className='flex items-center text-muted-foreground'>
              <TrophyIcon className='h-4 w-4 mr-2' />
              <span className='font-medium'>
                {tournament.prize_pool
                  ? `${tournament.prize_pool.toLocaleString('vi-VN')}đ`
                  : 'Chưa công bố'}
              </span>
            </div>
          </div>

          {tournament.description && (
            <p className='text-sm text-muted-foreground line-clamp-2 mt-2'>
              {tournament.description}
            </p>
          )}

          <div className='flex gap-2 mt-4'>
            <Button
              onClick={() => setIsDetailsModalOpen(true)}
              className='flex-1'
              variant='outline'
            >
              Chi tiết
            </Button>
            {tournament.status === 'registration_open' && (
              <Button
                onClick={() => setIsRegistrationModalOpen(true)}
                className='flex-1'
              >
                Đăng ký
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <EnhancedTournamentDetailsModal
        tournament={tournament}
        open={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
      />

      <TournamentRegistrationModal
        tournament={tournament}
        isOpen={isRegistrationModalOpen}
        onClose={() => setIsRegistrationModalOpen(false)}
        onRegistrationSuccess={() => {
          setIsRegistrationModalOpen(false);
          // Refresh the tournament data if needed
        }}
      />
    </>
  );
}
