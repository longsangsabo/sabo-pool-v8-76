import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Trophy, Save } from 'lucide-react';

interface MatchScoreInputProps {
  matchId: string;
  player1Name: string;
  player2Name: string;
  onScoreSubmitted: () => void;
}

export function MatchScoreInput({
  matchId,
  player1Name,
  player2Name,
  onScoreSubmitted,
}: MatchScoreInputProps) {
  const [player1Score, setPlayer1Score] = useState<number>(0);
  const [player2Score, setPlayer2Score] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmitScore = async () => {
    if (player1Score < 0 || player2Score < 0) {
      toast({
        title: 'Invalid Scores',
        description: 'Scores cannot be negative',
        variant: 'destructive',
      });
      return;
    }

    if (player1Score === player2Score) {
      toast({
        title: 'Invalid Scores',
        description: 'Scores cannot be tied in single elimination',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      console.log('🎯 Updating score using safe method:', {
        matchId,
        player1Score,
        player2Score,
        submittedBy: user.id,
      });

      const { data, error } = await supabase.rpc('update_match_score_safe', {
        p_match_id: matchId,
        p_player1_score: player1Score,
        p_player2_score: player2Score,
        p_submitted_by: user.id,
      });

      if (error) {
        console.error('❌ Error calling update_match_score_safe:', error);
        throw error;
      }

      if (data && typeof data === 'object' && 'error' in data && data.error) {
        console.error('❌ Function returned error:', data.error);
        toast({
          title: 'Score Submission Failed',
          description: String(data.error),
          variant: 'destructive',
        });
        return;
      }

      console.log('✅ Score updated successfully:', data);
      const winner = player1Score > player2Score ? player1Name : player2Name;
      toast({
        title: 'Score Submitted!',
        description: `Match result recorded. Winner: ${winner}`,
      });

      onScoreSubmitted();

      // Refresh to see changes
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('❌ Error submitting score:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit match score',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Trophy className='h-5 w-5' />
          Submit Match Result
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='grid grid-cols-2 gap-4'>
          <div className='space-y-2'>
            <Label htmlFor='player1Score'>{player1Name}</Label>
            <Input
              id='player1Score'
              type='number'
              min='0'
              value={player1Score}
              onChange={e => setPlayer1Score(parseInt(e.target.value) || 0)}
              placeholder='Score'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='player2Score'>{player2Name}</Label>
            <Input
              id='player2Score'
              type='number'
              min='0'
              value={player2Score}
              onChange={e => setPlayer2Score(parseInt(e.target.value) || 0)}
              placeholder='Score'
            />
          </div>
        </div>

        <div className='text-sm text-muted-foreground'>
          <p>
            Winner:{' '}
            {player1Score > player2Score
              ? player1Name
              : player2Score > player1Score
                ? player2Name
                : 'Tied (invalid)'}
          </p>
        </div>

        <Button
          onClick={handleSubmitScore}
          disabled={isSubmitting || player1Score === player2Score}
          className='w-full'
        >
          {isSubmitting ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Submitting Score...
            </>
          ) : (
            <>
              <Save className='mr-2 h-4 w-4' />
              Submit Match Result
            </>
          )}
        </Button>

        {player1Score === player2Score && (
          <p className='text-sm text-destructive'>
            Ties are not allowed in single elimination tournaments
          </p>
        )}
      </CardContent>
    </Card>
  );
}
