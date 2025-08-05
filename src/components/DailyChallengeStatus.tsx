import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export function DailyChallengeStatus() {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['daily-challenges', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await (supabase as any)
        .from('daily_challenge_stats')
        .select('challenge_count')
        .eq('user_id', user.id)
        .eq('challenge_date', today)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching daily challenge stats:', error);
        return 0;
      }

      return data?.challenge_count || 0;
    },
    enabled: !!user,
  });

  if (!user || isLoading) return null;

  const challengeCount = stats || 0;
  const isLimited = challengeCount >= 2;

  return (
    <Alert
      className={`transition-colors ${isLimited ? 'border-warning bg-warning/5' : 'border-muted'}`}
    >
      <div className='flex items-center gap-2'>
        {isLimited ? (
          <AlertTriangle className='h-4 w-4 text-warning' />
        ) : (
          <Clock className='h-4 w-4 text-muted-foreground' />
        )}

        <AlertDescription className='flex items-center gap-2'>
          <span>Kèo hôm nay:</span>
          <Badge variant={isLimited ? 'destructive' : 'secondary'}>
            {challengeCount}/2
          </Badge>

          {isLimited && (
            <span className='text-warning font-medium'>
              (Kèo tiếp theo chỉ nhận 30% điểm)
            </span>
          )}
        </AlertDescription>
      </div>
    </Alert>
  );
}

export default DailyChallengeStatus;
