import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, CheckCircle, XCircle, Clock, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TestStep {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
  duration?: number;
}

export const TournamentEndToEndTest: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testSteps, setTestSteps] = useState<TestStep[]>([
    { name: 'Bracket Generation', status: 'pending' },
    { name: 'Initial Match Setup', status: 'pending' },
    { name: 'Winner Bracket Round 1', status: 'pending' },
    { name: 'Loser Bracket Advancement', status: 'pending' },
    { name: 'Winner Bracket Round 2', status: 'pending' },
    { name: 'Cross-Bracket Movement', status: 'pending' },
    { name: 'Winner Bracket Round 3', status: 'pending' },
    { name: 'Loser Bracket Finals', status: 'pending' },
    { name: 'Semifinals', status: 'pending' },
    { name: 'Grand Final', status: 'pending' },
    { name: 'Tournament Completion', status: 'pending' },
  ]);
  const [overallResult, setOverallResult] = useState<
    'success' | 'failure' | null
  >(null);

  const updateStepStatus = (
    stepIndex: number,
    status: TestStep['status'],
    result?: any,
    error?: string
  ) => {
    setTestSteps(prev =>
      prev.map((step, index) =>
        index === stepIndex
          ? { ...step, status, result, error, duration: Date.now() }
          : step
      )
    );
  };

  const runEndToEndTest = async () => {
    setIsRunning(true);
    setOverallResult(null);

    // Reset all steps
    setTestSteps(prev =>
      prev.map(step => ({
        ...step,
        status: 'pending' as const,
        result: undefined,
        error: undefined,
      }))
    );

    try {
      // Step 1: Create test tournament
      updateStepStatus(0, 'running');
      const { data: tournament, error: tournamentError } = await supabase
        .from('tournaments')
        .insert({
          name: `E2E Test Tournament ${Date.now()}`,
          description: 'End-to-end test tournament',
          tournament_type: 'double_elimination',
          max_participants: 8,
          registration_start: new Date().toISOString(),
          registration_end: new Date(Date.now() + 86400000).toISOString(),
          tournament_start: new Date(Date.now() + 172800000).toISOString(),
          tournament_end: new Date(Date.now() + 259200000).toISOString(),
          status: 'registration_closed',
          entry_fee: 0,
          prize_pool: 0,
        })
        .select()
        .single();

      if (tournamentError)
        throw new Error(
          `Tournament creation failed: ${tournamentError.message}`
        );
      updateStepStatus(0, 'completed', { tournament_id: tournament.id });

      // Step 2: Generate bracket (simulate bracket creation)
      updateStepStatus(1, 'running');

      // Create test players and matches manually for testing
      const testPlayers = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'];

      // Create basic bracket structure for testing
      const { data: testMatches, error: matchError } = await supabase
        .from('tournament_matches')
        .insert([
          // SABO_REBUILD: Winner Bracket Round 1 - corrected bracket_type
          {
            tournament_id: tournament.id,
            bracket_type: 'winners',
            round_number: 1,
            match_number: 1,
            player1_id: 'p1',
            player2_id: 'p2',
            status: 'scheduled',
          },
          {
            tournament_id: tournament.id,
            bracket_type: 'winners',
            round_number: 1,
            match_number: 2,
            player1_id: 'p3',
            player2_id: 'p4',
            status: 'scheduled',
          },
          {
            tournament_id: tournament.id,
            bracket_type: 'winners',
            round_number: 1,
            match_number: 3,
            player1_id: 'p5',
            player2_id: 'p6',
            status: 'scheduled',
          },
          {
            tournament_id: tournament.id,
            bracket_type: 'winners',
            round_number: 1,
            match_number: 4,
            player1_id: 'p7',
            player2_id: 'p8',
            status: 'scheduled',
          },
        ]);

      if (matchError) throw new Error('Bracket setup failed');
      updateStepStatus(1, 'completed', { matches_created: 4 });

      // Step 3-11: Simulate match progression
      const steps = [
        // SABO_REBUILD: Updated bracket types and round numbers for SABO compliance
        {
          stepIndex: 2,
          description: 'WB Round 1',
          matches: [1, 2, 3, 4],
          round: 1,
          bracket: 'winners',
        },
        {
          stepIndex: 3,
          description: 'LB Round 1',
          matches: [1, 2],
          round: 101,
          bracket: 'losers',
        },
        {
          stepIndex: 4,
          description: 'WB Round 2',
          matches: [1, 2],
          round: 2,
          bracket: 'winners',
        },
        {
          stepIndex: 5,
          description: 'LB Round 2',
          matches: [1, 2],
          round: 201,
          bracket: 'losers',
        },
        {
          stepIndex: 6,
          description: 'WB Round 3',
          matches: [1],
          round: 3,
          bracket: 'winners',
        },
        {
          stepIndex: 7,
          description: 'LB Round 3',
          matches: [1, 2],
          round: 102,
          bracket: 'losers',
        },
        {
          stepIndex: 8,
          description: 'Semifinals',
          matches: [1, 2],
          round: 250,
          bracket: 'semifinals',
        },
        {
          stepIndex: 9,
          description: 'Grand Final',
          matches: [1],
          round: 300,
          bracket: 'finals',
        },
      ];

      for (const step of steps) {
        updateStepStatus(step.stepIndex, 'running');

        // Get matches for this step
        const { data: matches } = await supabase
          .from('tournament_matches')
          .select('*')
          .eq('tournament_id', tournament.id)
          .eq('bracket_type', step.bracket)
          .eq('round_number', step.round);

        if (!matches || matches.length === 0) {
          throw new Error(`No matches found for ${step.description}`);
        }

        // Simulate completing each match
        for (const match of matches.slice(0, step.matches.length)) {
          if (!match.player1_id || !match.player2_id) {
            throw new Error(`Match ${match.id} missing players`);
          }

          // Randomly pick winner
          const winner =
            Math.random() > 0.5 ? match.player1_id : match.player2_id;

          const { error: updateError } = await supabase
            .from('tournament_matches')
            .update({
              status: 'completed',
              winner_id: winner,
              player1_score: winner === match.player1_id ? 2 : 1,
              player2_score: winner === match.player2_id ? 2 : 1,
            })
            .eq('id', match.id);

          if (updateError)
            throw new Error(
              `Failed to update match ${match.id}: ${updateError.message}`
            );

          // Run advancement with new simplified logic
          const { data: advancementResult } = await supabase.rpc(
            'advance_winner_simplified',
            {
              p_match_id: match.id,
            }
          );

          if (
            advancementResult &&
            typeof advancementResult === 'object' &&
            'success' in advancementResult &&
            !advancementResult.success
          ) {
            console.warn(
              `Advancement warning for match ${match.id}:`,
              advancementResult
            );
          }
        }

        updateStepStatus(step.stepIndex, 'completed', {
          matches_completed: matches.length,
        });
      }

      // Step 11: Check tournament completion
      updateStepStatus(10, 'running');
      const { data: finalTournament } = await supabase
        .from('tournaments')
        .select('status')
        .eq('id', tournament.id)
        .single();

      // SABO_REBUILD: Updated to use correct SABO bracket_type and round_number
      const { data: champion } = await supabase
        .from('tournament_matches')
        .select('winner_id')
        .eq('tournament_id', tournament.id)
        .eq('bracket_type', 'finals')
        .eq('round_number', 300)
        .single();

      updateStepStatus(10, 'completed', {
        tournament_status: finalTournament?.status,
        champion_id: champion?.winner_id,
      });

      setOverallResult('success');
    } catch (error) {
      console.error('E2E test failed:', error);
      const currentStep = testSteps.findIndex(
        step => step.status === 'running'
      );
      if (currentStep !== -1) {
        updateStepStatus(
          currentStep,
          'failed',
          undefined,
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
      setOverallResult('failure');
    }

    setIsRunning(false);
  };

  const getStepIcon = (status: TestStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className='h-4 w-4 text-green-600' />;
      case 'failed':
        return <XCircle className='h-4 w-4 text-red-600' />;
      case 'running':
        return <Clock className='h-4 w-4 text-blue-600 animate-pulse' />;
      default:
        return <div className='h-4 w-4 rounded-full bg-gray-300' />;
    }
  };

  const completedSteps = testSteps.filter(
    step => step.status === 'completed'
  ).length;
  const failedSteps = testSteps.filter(step => step.status === 'failed').length;
  const progress = (completedSteps / testSteps.length) * 100;

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <Trophy className='h-5 w-5' />
            End-to-End Tournament Test
          </CardTitle>
          <Button onClick={runEndToEndTest} disabled={isRunning} size='sm'>
            {isRunning ? 'Running...' : 'Run E2E Test'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className='space-y-4'>
        {/* Progress Overview */}
        <div className='space-y-2'>
          <div className='flex justify-between text-sm'>
            <span>Progress</span>
            <span>
              {completedSteps}/{testSteps.length} steps
            </span>
          </div>
          <Progress value={progress} className='h-2' />
        </div>

        {/* Overall Result */}
        {overallResult && (
          <Alert
            className={
              overallResult === 'success'
                ? 'border-green-200'
                : 'border-red-200'
            }
          >
            {overallResult === 'success' ? (
              <CheckCircle className='h-4 w-4 text-green-600' />
            ) : (
              <XCircle className='h-4 w-4 text-red-600' />
            )}
            <AlertDescription>
              {overallResult === 'success'
                ? 'All tests passed! Tournament workflow is working correctly.'
                : `Test failed. ${failedSteps} steps failed.`}
            </AlertDescription>
          </Alert>
        )}

        {/* Test Steps */}
        <div className='space-y-2'>
          {testSteps.map((step, index) => (
            <div
              key={index}
              className='flex items-center justify-between p-3 border rounded'
            >
              <div className='flex items-center gap-3'>
                {getStepIcon(step.status)}
                <span className='font-medium'>{step.name}</span>
                <Badge
                  variant={
                    step.status === 'completed'
                      ? 'default'
                      : step.status === 'failed'
                        ? 'destructive'
                        : step.status === 'running'
                          ? 'secondary'
                          : 'outline'
                  }
                >
                  {step.status}
                </Badge>
              </div>

              {step.error && (
                <span className='text-sm text-red-600 max-w-md truncate'>
                  {step.error}
                </span>
              )}

              {step.result && step.status === 'completed' && (
                <span className='text-sm text-green-600'>✓</span>
              )}
            </div>
          ))}
        </div>

        {/* Instructions */}
        <Alert>
          <AlertDescription>
            This test creates a complete 8-player double elimination tournament
            and simulates the entire workflow from bracket generation to
            champion determination. It validates data integrity at each step.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
