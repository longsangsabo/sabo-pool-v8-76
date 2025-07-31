import React from 'react';
import { Badge } from '@/components/ui/badge';

interface TrustScoreBadgeProps {
  userId?: string;
  playerId?: string;
  size?: 'sm' | 'md' | 'lg';
  showFullDetails?: boolean;
}

const TrustScoreBadge = ({ userId, playerId, size = 'md', showFullDetails }: TrustScoreBadgeProps) => {
  return (
    <Badge variant="outline">
      Trust: 85%
    </Badge>
  );
};

export default TrustScoreBadge;