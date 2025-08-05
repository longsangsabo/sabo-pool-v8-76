import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TrustScoreCompact } from '@/components/ui/trust-score-badge';

interface TrustScoreBadgeProps {
  userId?: string;
  playerId?: string;
  size?: 'sm' | 'md' | 'lg';
  showFullDetails?: boolean;
}

const TrustScoreBadge = ({
  userId,
  playerId,
  size = 'md',
  showFullDetails,
}: TrustScoreBadgeProps) => {
  const targetId = userId || playerId;

  const { data: trustScore } = useQuery({
    queryKey: ['trust-score', targetId],
    queryFn: async () => {
      if (!targetId) return 85; // Default fallback

      const { data } = await supabase
        .from('player_trust_scores')
        .select('trust_percentage')
        .eq('user_id', targetId)
        .single();

      return data?.trust_percentage || 85;
    },
    enabled: !!targetId,
  });

  return (
    <TrustScoreCompact
      score={trustScore || 85}
      className={size === 'sm' ? 'scale-90' : undefined}
    />
  );
};

export default TrustScoreBadge;
