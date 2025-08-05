import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Loader2,
  Trophy,
  Users,
  GitBranch,
  Target,
  Shuffle,
  TrendingUp,
} from 'lucide-react';

interface TournamentBracketGeneratorProps {
  tournamentId: string;
  tournamentType: string;
  participantCount: number;
  onBracketGenerated: () => void;
}

export function TournamentBracketGenerator({
  tournamentId,
  tournamentType,
  participantCount,
  onBracketGenerated,
}: TournamentBracketGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const isDoubleElimination = tournamentType === 'double_elimination';
  const isSingleElimination = tournamentType === 'single_elimination';

  // Validation logic based on tournament type
  const getValidParticipantCounts = () => {
    if (isDoubleElimination) {
      return [16]; // Double elimination only supports 16 players
    }
    return [4, 8, 16, 32]; // Single elimination supports multiple sizes
  };

  const validCounts = getValidParticipantCounts();
  const isValidCount = validCounts.includes(participantCount);

  const handleGenerateBracket = async (
    generationType: 'random' | 'elo_based'
  ) => {
    if (participantCount < 4 || !isValidCount) {
      const expectedCounts = validCounts.join(', ');
      toast({
        title: 'Invalid Participant Count',
        description: `${isDoubleElimination ? 'Double' : 'Single'} elimination requires exactly ${expectedCounts} participants. Current: ${participantCount}`,
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);

    try {
      let data, error;

      if (isDoubleElimination) {
        // Get confirmed participants for SABO initialization
        const { data: registrations, error: regError } = await supabase
          .from('tournament_registrations')
          .select('user_id')
          .eq('tournament_id', tournamentId)
          .eq('payment_status', 'paid')
          .limit(16);

        if (regError || !registrations || registrations.length !== 16) {
          toast({
            title: 'Error',
            description: `SABO Double Elimination requires exactly 16 paid participants. Found: ${registrations?.length || 0}`,
            variant: 'destructive',
          });
          return;
        }

        const playerIds = registrations.map(r => r.user_id);

        // Use SABO tournament initialization
        const result = await supabase.rpc('initialize_sabo_tournament', {
          p_tournament_id: tournamentId,
          p_player_ids: playerIds,
        });
        data = result.data;
        error = result.error;
      } else {
        // Call single elimination bracket creation function
        const result = await supabase.rpc(
          'generate_single_elimination_bracket' as any,
          {
            p_tournament_id: tournamentId,
            p_generation_type: generationType,
          }
        );
        data = result.data;
        error = result.error;
      }

      if (error) throw error;

      if (data?.error || (data && !data.success)) {
        toast({
          title: 'Bracket Generation Failed',
          description: data?.error || 'Failed to generate bracket',
          variant: 'destructive',
        });
      } else {
        const bracketType = isDoubleElimination
          ? 'Double Elimination'
          : 'Single Elimination';
        const generationMethod =
          generationType === 'elo_based' ? 'theo ELO' : 'ngẫu nhiên';
        toast({
          title: 'Bracket Generated!',
          description: `${bracketType} bracket created successfully with ${participantCount} players (${generationMethod}).`,
        });
        onBracketGenerated();
      }
    } catch (error) {
      console.error('Error generating bracket:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate tournament bracket',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getTournamentIcon = () => {
    if (isDoubleElimination) {
      return <GitBranch className='h-5 w-5' />;
    }
    return <Target className='h-5 w-5' />;
  };

  const getTournamentDescription = () => {
    if (isDoubleElimination) {
      return {
        title: 'Generate Double Elimination Bracket',
        requirements: [
          'Exactly 16 participants required',
          "Winner's Bracket + Loser's Bracket system",
          'Players get second chance after first loss',
          'Complex bracket with multiple advancement paths',
        ],
      };
    }

    return {
      title: 'Generate Single Elimination Bracket',
      requirements: [
        'Exactly 4, 8, 16, or 32 participants',
        'Winners advance to next round',
        'Losers are eliminated immediately',
        'Real matches with real scores',
      ],
    };
  };

  const description = getTournamentDescription();

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          {getTournamentIcon()}
          {description.title}
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
          <Users className='h-4 w-4' />
          <span>{participantCount} confirmed participants</span>
        </div>

        <div className='text-sm'>
          <p className='mb-2 font-medium'>
            {isDoubleElimination ? 'Double' : 'Single'} Elimination
            Requirements:
          </p>
          <ul className='list-disc list-inside space-y-1 text-muted-foreground'>
            {description.requirements.map((req, index) => (
              <li key={index}>{req}</li>
            ))}
          </ul>
        </div>

        <div className='space-y-3'>
          <div className='text-sm font-medium text-center'>
            Chọn phương thức tạo bảng đấu:
          </div>

          <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
            <Button
              onClick={() => handleGenerateBracket('random')}
              disabled={isGenerating || participantCount < 4 || !isValidCount}
              variant='outline'
              className='flex-1'
            >
              {isGenerating ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Đang tạo...
                </>
              ) : (
                <>
                  <Shuffle className='mr-2 h-4 w-4' />
                  Tạo bảng đấu ngẫu nhiên
                </>
              )}
            </Button>

            <Button
              onClick={() => handleGenerateBracket('elo_based')}
              disabled={isGenerating || participantCount < 4 || !isValidCount}
              className='flex-1'
            >
              {isGenerating ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Đang tạo...
                </>
              ) : (
                <>
                  <TrendingUp className='mr-2 h-4 w-4' />
                  Tạo bảng đấu theo ELO
                </>
              )}
            </Button>
          </div>
        </div>

        {participantCount < 4 && (
          <p className='text-sm text-muted-foreground'>
            Need at least 4 participants to generate bracket
          </p>
        )}

        {participantCount > 0 && !isValidCount && (
          <p className='text-sm text-destructive'>
            Current participant count ({participantCount}) is not valid for{' '}
            {isDoubleElimination ? 'double' : 'single'} elimination. Must be
            exactly {validCounts.join(', ')} participants.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
