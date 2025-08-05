import React from 'react';
import { Eye, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface MobileLiveIndicatorProps {
  type: 'live_match' | 'live_tournament' | 'live_challenge';
  viewers?: number;
  status: string;
  className?: string;
}

export const MobileLiveIndicator: React.FC<MobileLiveIndicatorProps> = ({
  type,
  viewers,
  status,
  className = '',
}) => {
  const getIndicatorColor = () => {
    switch (type) {
      case 'live_match':
        return 'bg-red-500 text-white';
      case 'live_tournament':
        return 'bg-purple-500 text-white';
      case 'live_challenge':
        return 'bg-orange-500 text-white';
      default:
        return 'bg-red-500 text-white';
    }
  };

  return (
    <div className={`mobile-live-indicator ${className}`}>
      <Badge className={`${getIndicatorColor()} animate-pulse`}>
        <div className='live-dot'></div>
        <span className='font-semibold text-xs uppercase tracking-wide'>
          {status}
        </span>
      </Badge>

      {viewers && (
        <div className='flex items-center gap-1 ml-2 text-xs text-muted-foreground'>
          <Eye className='w-3 h-3' />
          <span>{viewers.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
};

export default MobileLiveIndicator;
