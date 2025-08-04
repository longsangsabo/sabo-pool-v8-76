import React from 'react';
import { Bell, Zap } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';

interface NotificationBadgeProps {
  count: number;
  hasUrgent?: boolean;
  onClick?: () => void;
  className?: string;
}

const NotificationBadge = ({
  count,
  hasUrgent = false,
  onClick,
  className,
}: NotificationBadgeProps) => {
  return (
    <Button
      variant='ghost'
      size='icon'
      onClick={onClick}
      className={`relative ${className}`}
    >
      {hasUrgent ? (
        <Zap className='h-5 w-5 text-orange-500 animate-pulse' />
      ) : (
        <Bell className='h-5 w-5' />
      )}

      {count > 0 && (
        <Badge
          variant={hasUrgent ? 'destructive' : 'secondary'}
          className={`absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs ${
            hasUrgent ? 'animate-pulse' : ''
          }`}
        >
          {count > 99 ? '99+' : count}
        </Badge>
      )}
    </Button>
  );
};

export default NotificationBadge;
