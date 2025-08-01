import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Clock, Users, Ban } from 'lucide-react';
import { Tournament } from '@/types/tournament';
import { useTournamentRegistrationFlow } from '@/hooks/useTournamentRegistrationFlow';

interface TournamentRegistrationStatusProps {
  tournament: Tournament;
  onViewDetails?: () => void;
  compact?: boolean;
}

export const TournamentRegistrationStatus: React.FC<
  TournamentRegistrationStatusProps
> = ({ tournament, onViewDetails, compact = false }) => {
  const {
    handleRegistrationFlow,
    isPending,
    isRegistered,
    getButtonText,
    checkRegistrationEligibility,
  } = useTournamentRegistrationFlow();

  const tournamentId = tournament.id;
  const isRegistering = isPending(tournamentId);
  const userIsRegistered = isRegistered(tournamentId);
  const eligibility = checkRegistrationEligibility(tournament);

  const getReasonIcon = (reason: string) => {
    if (reason.includes('thời gian')) return <Clock className='w-4 h-4' />;
    if (reason.includes('đủ số lượng')) return <Users className='w-4 h-4' />;
    if (reason.includes('hạng') || reason.includes('tuổi'))
      return <Ban className='w-4 h-4' />;
    return <AlertTriangle className='w-4 h-4' />;
  };

  if (compact) {
    return (
      <div className='space-y-2'>
        {/* Registration Button */}
        <div className='flex gap-2'>
          {onViewDetails && (
            <Button
              variant='outline'
              size='sm'
              onClick={onViewDetails}
              className='flex-1'
            >
              Xem chi tiết
            </Button>
          )}

          {eligibility.canRegister ? (
            <Button
              size='sm'
              onClick={() => handleRegistrationFlow(tournament)}
              disabled={isRegistering}
              className='flex-1'
              variant={userIsRegistered ? 'destructive' : 'default'}
            >
              {getButtonText(tournamentId)}
            </Button>
          ) : (
            <Button size='sm' variant='secondary' disabled className='flex-1'>
              {eligibility.reasons[0] || 'Không thể đăng ký'}
            </Button>
          )}
        </div>

        {/* Blocking Reasons */}
        {!eligibility.canRegister && eligibility.reasons.length > 1 && (
          <div className='text-xs text-muted-foreground'>
            {eligibility.reasons.slice(1).map((reason, index) => (
              <div key={index} className='flex items-center gap-1'>
                {getReasonIcon(reason)}
                <span>{reason}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center justify-between'>
          <span>Trạng thái đăng ký</span>
          <Badge variant={eligibility.canRegister ? 'default' : 'secondary'}>
            {eligibility.canRegister ? 'Có thể đăng ký' : 'Không thể đăng ký'}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className='space-y-4'>
        {/* Eligibility Status */}
        {eligibility.canRegister ? (
          <Alert>
            <AlertTriangle className='h-4 w-4' />
            <AlertDescription>
              Bạn đã đủ điều kiện tham gia giải đấu này.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert variant='destructive'>
            <AlertTriangle className='h-4 w-4' />
            <AlertDescription>
              <div className='space-y-2'>
                <div className='font-medium'>Không đủ điều kiện tham gia:</div>
                <div className='space-y-1'>
                  {eligibility.reasons.map((reason, index) => (
                    <div
                      key={index}
                      className='flex items-center gap-2 text-sm'
                    >
                      {getReasonIcon(reason)}
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className='flex gap-2'>
          {onViewDetails && (
            <Button
              variant='outline'
              onClick={onViewDetails}
              className='flex-1'
            >
              Xem chi tiết giải đấu
            </Button>
          )}

          {eligibility.canRegister && (
            <Button
              onClick={() => handleRegistrationFlow(tournament)}
              disabled={isRegistering}
              className='flex-1'
              variant={userIsRegistered ? 'destructive' : 'default'}
            >
              {getButtonText(tournamentId)}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
