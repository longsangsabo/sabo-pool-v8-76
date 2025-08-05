import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, Trophy, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { SimpleRegistrationModal } from './SimpleRegistrationModal';
import { RegistrationStatusBadge } from './RegistrationStatusBadge';
import { useTournamentRealtime } from '@/hooks/useTournamentRealtime';

interface EnhancedTournamentCardProps {
  tournament: import('@/types/tournament-extended').EnhancedTournament;
  onView?: (
    tournament: import('@/types/tournament-extended').EnhancedTournament
  ) => void;
  onTournamentClick?: (id: string) => void;
  onRegister?: (id: string) => void;
  isRegistered?: (id: string) => boolean;
  className?: string;
}

export const EnhancedTournamentCard: React.FC<EnhancedTournamentCardProps> = ({
  tournament,
  onView,
  onTournamentClick,
  onRegister,
  isRegistered,
  className,
}) => {
  const { user } = useAuth();
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [userRegistration, setUserRegistration] = useState<any>(null);
  const { participants } = useTournamentRealtime(tournament.id);

  // Check if user is already registered
  useEffect(() => {
    checkUserRegistration();
  }, [tournament.id, user?.id]);

  const checkUserRegistration = async () => {
    if (!user?.id) return;

    try {
      const { data } = await supabase
        .from('tournament_registrations')
        .select('registration_status, payment_status, registration_date')
        .eq('tournament_id', tournament.id)
        .eq('user_id', user.id)
        .single();

      setUserRegistration(data);
    } catch (error) {
      // User not registered yet
      setUserRegistration(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'registration_open':
        return 'bg-green-100 text-green-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'ongoing':
        return 'bg-orange-100 text-orange-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'registration_open':
        return 'Đang mở ĐK';
      case 'upcoming':
        return 'Sắp diễn ra';
      case 'ongoing':
        return 'Đang diễn ra';
      case 'completed':
        return 'Đã kết thúc';
      default:
        return status;
    }
  };

  const getButtonContent = () => {
    if (!user) {
      return { text: '🔒 Đăng nhập để tham gia', disabled: true };
    }

    if (userRegistration || (isRegistered && isRegistered(tournament.id))) {
      const status = userRegistration?.registration_status || 'confirmed';
      switch (status) {
        case 'pending':
          return { text: '⏳ Đợi xác nhận', disabled: true };
        case 'confirmed':
          return { text: '✅ Đã đăng ký', disabled: true };
        default:
          return { text: '❓ Liên hệ CLB', disabled: true };
      }
    }

    if (tournament.current_participants >= tournament.max_participants) {
      return { text: '👥 Đã đầy', disabled: true };
    }

    if (tournament.status !== 'registration_open') {
      return { text: '🔒 Đã đóng ĐK', disabled: true };
    }

    return { text: '💵 Đăng ký ngay', disabled: false };
  };

  const buttonContent = getButtonContent();
  const currentParticipants =
    participants.length || tournament.current_participants || 0;

  return (
    <>
      <Card
        className={`hover:shadow-lg transition-shadow duration-200 ${className || ''}`}
      >
        <CardHeader className='pb-4'>
          <div className='flex justify-between items-start'>
            <CardTitle className='text-lg font-bold line-clamp-2'>
              {tournament.name}
            </CardTitle>
            <Badge className={getStatusBadgeColor(tournament.status)}>
              {getStatusText(tournament.status)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className='space-y-4'>
          {/* Tournament Details */}
          <div className='space-y-2 text-sm'>
            <div className='flex items-center gap-2 text-gray-600'>
              <Calendar className='h-4 w-4' />
              <span>{formatDate(tournament.tournament_start)}</span>
            </div>

            <div className='flex items-center gap-2 text-gray-600'>
              <MapPin className='h-4 w-4' />
              <span>{tournament.venue_address || 'Chưa có thông tin'}</span>
            </div>

            <div className='flex items-center gap-2 text-gray-600'>
              <Users className='h-4 w-4' />
              <span>
                {currentParticipants}/{tournament.max_participants} người
              </span>
            </div>

            <div className='flex items-center gap-2 text-gray-600'>
              <Trophy className='h-4 w-4' />
              <span>
                {tournament.entry_fee?.toLocaleString('vi-VN') || '0'} VNĐ
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className='w-full bg-gray-200 rounded-full h-2'>
            <div
              className='bg-blue-600 h-2 rounded-full transition-all duration-300'
              style={{
                width: `${Math.min((currentParticipants / tournament.max_participants) * 100, 100)}%`,
              }}
            />
          </div>

          {/* Registration status for user */}
          {userRegistration && (
            <div className='py-2'>
              <RegistrationStatusBadge registration={userRegistration} />
            </div>
          )}

          {/* Action buttons */}
          <div className='flex gap-2 pt-2'>
            <Button
              variant='outline'
              size='sm'
              className='flex-1'
              onClick={() => {
                if (onView) onView(tournament);
                if (onTournamentClick) onTournamentClick(tournament.id);
              }}
            >
              👁️ Xem chi tiết
            </Button>

            <Button
              size='sm'
              className='flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400'
              disabled={buttonContent.disabled}
              onClick={() => {
                if (!buttonContent.disabled) {
                  if (onRegister) {
                    onRegister(tournament.id);
                  } else {
                    setShowRegistrationModal(true);
                  }
                }
              }}
            >
              {buttonContent.text}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Registration Modal */}
      <SimpleRegistrationModal
        tournament={tournament}
        isOpen={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
        onSuccess={() => {
          checkUserRegistration(); // Refresh registration status
        }}
      />
    </>
  );
};
