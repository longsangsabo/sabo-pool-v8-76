import { AlertCircle, Trophy, Zap } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useDailyChallenges } from '@/hooks/useDailyChallenges';

export const ChallengeStatusBanner = () => {
  const { dailyChallenges, getStatusMessage, getPointsMultiplier, loading } =
    useDailyChallenges();

  if (loading) return null;

  const multiplier = getPointsMultiplier();
  const isReduced = multiplier < 1.0;

  return (
    <Alert variant={isReduced ? 'destructive' : 'default'} className='mb-4'>
      <div className='flex items-center gap-2'>
        {isReduced ? (
          <AlertCircle className='h-4 w-4' />
        ) : (
          <Trophy className='h-4 w-4' />
        )}
        <AlertDescription className='flex items-center justify-between w-full'>
          <span>{getStatusMessage()}</span>
          <div className='flex items-center gap-2'>
            <Badge
              variant={isReduced ? 'destructive' : 'secondary'}
              className='flex items-center gap-1'
            >
              <Zap className='h-3 w-3' />
              {Math.round(multiplier * 100)}%
            </Badge>
            <Badge variant='outline'>{dailyChallenges}/2+</Badge>
          </div>
        </AlertDescription>
      </div>
    </Alert>
  );
};
