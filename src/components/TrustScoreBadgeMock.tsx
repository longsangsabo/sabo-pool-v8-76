import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';

interface TrustScoreBadgeProps {
  playerId: string;
  showFullDetails?: boolean;
}

const TrustScoreBadgeMock: React.FC<TrustScoreBadgeProps> = ({
  playerId,
  showFullDetails = false,
}) => {
  // Mock trust score
  const trustScore = 85;

  const getTrustColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <Badge className={getTrustColor(trustScore)}>
      <Shield className='w-3 h-3 mr-1' />
      {trustScore}
      {showFullDetails && '/100'}
    </Badge>
  );
};

export default TrustScoreBadgeMock;
