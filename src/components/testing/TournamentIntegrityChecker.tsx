import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Play,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface IntegrityIssue {
  type: 'error' | 'warning' | 'info';
  category: string;
  description: string;
  affected_matches?: string[];
  suggested_fix?: string;
}

export const TournamentIntegrityChecker: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [issues, setIssues] = useState<IntegrityIssue[]>([]);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [selectedTournament, setSelectedTournament] = useState<string>('');

  const runIntegrityCheck = async (tournamentId?: string) => {
    setIsRunning(true);
    const checkResults: IntegrityIssue[] = [];

    try {
      // Check for duplicate players in matches
      const { data: duplicateMatches } = await supabase
        .from('tournament_matches')
        .select('id, player1_id, player2_id, tournament_id')
        .eq(
          'tournament_id',
          tournamentId || 'd528882d-bf18-4db7-b4d6-7b9f80cc7939'
        )
        .not('player1_id', 'is', null)
        .not('player2_id', 'is', null);

      duplicateMatches?.forEach(match => {
        if (match.player1_id === match.player2_id) {
          checkResults.push({
            type: 'error',
            category: 'Data Integrity',
            description: `Match ${match.id} has duplicate players`,
            affected_matches: [match.id],
            suggested_fix: 'Remove duplicate player assignment',
          });
        }
      });

      // Check for completed matches without winners
      const { data: incompleteBrackets } = await supabase
        .from('tournament_matches')
        .select('id, status, winner_id')
        .eq(
          'tournament_id',
          tournamentId || 'd528882d-bf18-4db7-b4d6-7b9f80cc7939'
        )
        .eq('status', 'completed')
        .is('winner_id', null);

      if (incompleteBrackets && incompleteBrackets.length > 0) {
        checkResults.push({
          type: 'error',
          category: 'Match Status',
          description: `${incompleteBrackets.length} completed matches missing winners`,
          affected_matches: incompleteBrackets.map(m => m.id),
          suggested_fix: 'Set winner_id for completed matches',
        });
      }

      // Check for gaps in bracket progression
      const { data: allMatches } = await supabase
        .from('tournament_matches')
        .select('*')
        .eq(
          'tournament_id',
          tournamentId || 'd528882d-bf18-4db7-b4d6-7b9f80cc7939'
        )
        .order('round_number')
        .order('match_number');

      if (allMatches) {
        // Check for empty next round matches when previous round is complete
        const roundGroups = allMatches.reduce(
          (acc, match) => {
            const key = `${match.bracket_type}-${match.round_number}`;
            if (!acc[key]) acc[key] = [];
            acc[key].push(match);
            return acc;
          },
          {} as Record<string, any[]>
        );

        Object.entries(roundGroups).forEach(([roundKey, matches]) => {
          const completedMatches = matches.filter(
            m => m.status === 'completed' && m.winner_id
          );
          if (
            completedMatches.length === matches.length &&
            completedMatches.length > 0
          ) {
            // Check if next round has proper player assignments
            const [bracketType, roundNum] = roundKey.split('-');
            const nextRoundMatches = allMatches.filter(
              m =>
                m.bracket_type === bracketType &&
                m.round_number === parseInt(roundNum) + 1
            );

            const emptyNextMatches = nextRoundMatches.filter(
              m => !m.player1_id || !m.player2_id
            );
            if (emptyNextMatches.length > 0) {
              checkResults.push({
                type: 'warning',
                category: 'Bracket Progression',
                description: `Round ${roundNum} ${bracketType} completed but next round has empty slots`,
                suggested_fix: 'Run bracket repair to fix advancement',
              });
            }
          }
        });
      }

      // Check tournament status consistency
      const { data: tournament } = await supabase
        .from('tournaments')
        .select('id, status, name')
        .eq('id', tournamentId || 'd528882d-bf18-4db7-b4d6-7b9f80cc7939')
        .single();

      if (tournament) {
        // SABO_REBUILD: Updated to use correct SABO bracket_type and round_number
        const { data: finalMatch } = await supabase
          .from('tournament_matches')
          .select('status, winner_id')
          .eq('tournament_id', tournament.id)
          .eq('bracket_type', 'finals')
          .eq('round_number', 300)
          .single();

        if (
          finalMatch?.status === 'completed' &&
          finalMatch.winner_id &&
          tournament.status !== 'completed'
        ) {
          checkResults.push({
            type: 'warning',
            category: 'Tournament Status',
            description:
              'Final match completed but tournament status not updated',
            suggested_fix: 'Update tournament status to completed',
          });
        }
      }

      setIssues(checkResults);
      setLastCheck(new Date());
    } catch (error) {
      console.error('Integrity check failed:', error);
      setIssues([
        {
          type: 'error',
          category: 'System Error',
          description: 'Failed to run integrity check',
          suggested_fix: 'Check console for detailed error',
        },
      ]);
    }

    setIsRunning(false);
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'error':
        return <XCircle className='h-4 w-4 text-destructive' />;
      case 'warning':
        return <AlertTriangle className='h-4 w-4 text-warning' />;
      default:
        return <CheckCircle className='h-4 w-4 text-success' />;
    }
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const errorCount = issues.filter(i => i.type === 'error').length;
  const warningCount = issues.filter(i => i.type === 'warning').length;
  const infoCount = issues.filter(i => i.type === 'info').length;

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle>Tournament Data Integrity Checker</CardTitle>
          <Button
            onClick={() => runIntegrityCheck(selectedTournament)}
            disabled={isRunning}
            size='sm'
          >
            {isRunning ? (
              <>
                <RefreshCw className='h-4 w-4 mr-2 animate-spin' />
                Checking...
              </>
            ) : (
              <>
                <Play className='h-4 w-4 mr-2' />
                Run Check
              </>
            )}
          </Button>
        </div>
        {lastCheck && (
          <p className='text-sm text-muted-foreground'>
            Last check: {lastCheck.toLocaleTimeString()}
          </p>
        )}
      </CardHeader>

      <CardContent className='space-y-4'>
        {/* Summary */}
        <div className='grid grid-cols-3 gap-4'>
          <div className='text-center p-3 bg-red-50 rounded-lg'>
            <div className='text-2xl font-bold text-red-600'>{errorCount}</div>
            <div className='text-sm text-red-600'>Errors</div>
          </div>
          <div className='text-center p-3 bg-yellow-50 rounded-lg'>
            <div className='text-2xl font-bold text-yellow-600'>
              {warningCount}
            </div>
            <div className='text-sm text-yellow-600'>Warnings</div>
          </div>
          <div className='text-center p-3 bg-blue-50 rounded-lg'>
            <div className='text-2xl font-bold text-blue-600'>{infoCount}</div>
            <div className='text-sm text-blue-600'>Info</div>
          </div>
        </div>

        {/* Issues List */}
        <div className='space-y-3'>
          {issues.length === 0 && !isRunning && (
            <Alert>
              <CheckCircle className='h-4 w-4' />
              <AlertDescription>
                {lastCheck
                  ? 'No integrity issues found!'
                  : 'Click "Run Check" to validate tournament data'}
              </AlertDescription>
            </Alert>
          )}

          {issues.map((issue, index) => (
            <Alert key={index}>
              <div className='flex items-start space-x-3'>
                {getIconForType(issue.type)}
                <div className='flex-1'>
                  <div className='flex items-center gap-2'>
                    <span className='font-medium'>{issue.category}</span>
                    <Badge variant={getBadgeVariant(issue.type)}>
                      {issue.type.toUpperCase()}
                    </Badge>
                  </div>
                  <AlertDescription className='mt-1'>
                    {issue.description}
                    {issue.suggested_fix && (
                      <div className='mt-1 text-sm font-medium text-blue-600'>
                        Fix: {issue.suggested_fix}
                      </div>
                    )}
                    {issue.affected_matches && (
                      <div className='mt-1 text-xs text-muted-foreground'>
                        Affected matches:{' '}
                        {issue.affected_matches.slice(0, 3).join(', ')}
                        {issue.affected_matches.length > 3 &&
                          ` (+${issue.affected_matches.length - 3} more)`}
                      </div>
                    )}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
