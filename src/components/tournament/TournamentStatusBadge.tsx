import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Play, Trophy, XCircle } from 'lucide-react';

interface TournamentStatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

export const TournamentStatusBadge: React.FC<TournamentStatusBadgeProps> = ({
  status,
  size = 'md',
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <Trophy className='h-3 w-3' />;
      case 'ongoing':
        return <Play className='h-3 w-3' />;
      case 'scheduled':
        return <Clock className='h-3 w-3' />;
      case 'cancelled':
        return <XCircle className='h-3 w-3' />;
      default:
        return <CheckCircle className='h-3 w-3' />;
    }
  };

  const getStatusVariant = () => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'ongoing':
        return 'secondary';
      case 'scheduled':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'ongoing':
        return 'Ongoing';
      case 'scheduled':
        return 'Scheduled';
      case 'cancelled':
        return 'Cancelled';
      case 'registration_open':
        return 'Registration Open';
      case 'registration_closed':
        return 'Registration Closed';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  return (
    <Badge
      variant={getStatusVariant()}
      className={`flex items-center gap-1 ${size === 'sm' ? 'text-xs px-2 py-1' : size === 'lg' ? 'text-sm px-3 py-1.5' : ''}`}
    >
      {getStatusIcon()}
      {getStatusLabel()}
    </Badge>
  );
};
