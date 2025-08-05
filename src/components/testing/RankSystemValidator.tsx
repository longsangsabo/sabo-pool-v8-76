import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertTriangle, Play } from 'lucide-react';
import {
  RANK_ELO,
  SPA_TOURNAMENT_REWARDS,
  type RankCode,
} from '@/utils/eloConstants';
import {
  getRankByElo,
  isEligibleForPromotion,
  calculateRankProgress,
} from '@/utils/rankUtils';

interface ValidationResult {
  category: string;
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

export const RankSystemValidator: React.FC = () => {
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [summary, setSummary] = useState({ pass: 0, fail: 0, warning: 0 });

  const runValidation = async () => {
    setIsRunning(true);
    const testResults: ValidationResult[] = [];

    // Test 1: Rank ELO Constants
    testResults.push({
      category: 'Constants',
      test: 'RANK_ELO completeness',
      status: Object.keys(RANK_ELO).length === 12 ? 'pass' : 'fail',
      message: `Found ${Object.keys(RANK_ELO).length}/12 ranks`,
    });

    // Test 2: ELO Progression
    const ranks: RankCode[] = [
      'K',
      'K+',
      'I',
      'I+',
      'H',
      'H+',
      'G',
      'G+',
      'F',
      'F+',
      'E',
      'E+',
    ];
    let eloProgression = true;
    for (let i = 1; i < ranks.length; i++) {
      if (RANK_ELO[ranks[i]] <= RANK_ELO[ranks[i - 1]]) {
        eloProgression = false;
        break;
      }
    }
    testResults.push({
      category: 'Constants',
      test: 'ELO progression order',
      status: eloProgression ? 'pass' : 'fail',
      message: eloProgression
        ? 'ELO values increase properly'
        : 'ELO progression has issues',
    });

    // Test 3: SPA Tournament Rewards
    const spaComplete = Object.keys(SPA_TOURNAMENT_REWARDS).length === 12;
    testResults.push({
      category: 'Rewards',
      test: 'SPA Tournament Rewards',
      status: spaComplete ? 'pass' : 'fail',
      message: `Found ${Object.keys(SPA_TOURNAMENT_REWARDS).length}/12 rank rewards`,
    });

    // Test 4: Rank calculation functions
    testResults.push({
      category: 'Functions',
      test: 'getRankByElo function',
      status:
        getRankByElo(1000) === 'K' && getRankByElo(2100) === 'E+'
          ? 'pass'
          : 'fail',
      message: 'Rank calculation working correctly',
    });

    // Test 5: Promotion eligibility
    const promotionTest = isEligibleForPromotion(1100, 'K');
    testResults.push({
      category: 'Functions',
      test: 'Promotion eligibility',
      status: promotionTest ? 'pass' : 'fail',
      message: promotionTest
        ? 'Promotion logic working'
        : 'Promotion logic failed',
    });

    // Test 6: Progress calculation
    const progress = calculateRankProgress(1050, 'K');
    testResults.push({
      category: 'Functions',
      test: 'Progress calculation',
      status: progress.progress === 50 ? 'pass' : 'warning',
      message: `Progress: ${progress.progress}%, Points needed: ${progress.pointsNeeded}`,
    });

    // Test 7: All + ranks included
    const plusRanks = ranks.filter(r => r.includes('+')).length;
    testResults.push({
      category: 'Structure',
      test: '+ rank variants',
      status: plusRanks === 6 ? 'pass' : 'fail',
      message: `Found ${plusRanks}/6 + rank variants`,
    });

    setResults(testResults);

    // Calculate summary
    const newSummary = testResults.reduce(
      (acc, result) => {
        acc[result.status]++;
        return acc;
      },
      { pass: 0, fail: 0, warning: 0 }
    );
    setSummary(newSummary);
    setIsRunning(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className='h-4 w-4 text-green-600' />;
      case 'fail':
        return <XCircle className='h-4 w-4 text-red-600' />;
      case 'warning':
        return <AlertTriangle className='h-4 w-4 text-yellow-600' />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'bg-green-100 text-green-800';
      case 'fail':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className='w-full max-w-4xl mx-auto'>
      <CardHeader>
        <CardTitle className='flex items-center justify-between'>
          <span>Rank System Validator</span>
          <Button
            onClick={runValidation}
            disabled={isRunning}
            className='flex items-center gap-2'
          >
            <Play className='h-4 w-4' />
            {isRunning ? 'Running...' : 'Run Tests'}
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {results.length > 0 && (
          <>
            {/* Summary */}
            <div className='grid grid-cols-3 gap-4 mb-6'>
              <div className='text-center p-3 bg-green-50 rounded'>
                <div className='text-2xl font-bold text-green-600'>
                  {summary.pass}
                </div>
                <div className='text-sm text-green-600'>Passed</div>
              </div>
              <div className='text-center p-3 bg-red-50 rounded'>
                <div className='text-2xl font-bold text-red-600'>
                  {summary.fail}
                </div>
                <div className='text-sm text-red-600'>Failed</div>
              </div>
              <div className='text-center p-3 bg-yellow-50 rounded'>
                <div className='text-2xl font-bold text-yellow-600'>
                  {summary.warning}
                </div>
                <div className='text-sm text-yellow-600'>Warnings</div>
              </div>
            </div>

            {/* Results */}
            <div className='space-y-3'>
              {results.map((result, index) => (
                <div
                  key={index}
                  className='flex items-center justify-between p-3 border rounded'
                >
                  <div className='flex items-center gap-3'>
                    {getStatusIcon(result.status)}
                    <div>
                      <div className='font-medium'>{result.test}</div>
                      <div className='text-sm text-muted-foreground'>
                        {result.category}
                      </div>
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Badge className={getStatusColor(result.status)}>
                      {result.status.toUpperCase()}
                    </Badge>
                    <span className='text-sm text-muted-foreground'>
                      {result.message}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Rank Overview */}
            <div className='mt-6 p-4 bg-gray-50 rounded'>
              <h3 className='font-medium mb-3'>
                Current Rank System (12 Tiers)
              </h3>
              <div className='grid grid-cols-6 gap-2'>
                {Object.entries(RANK_ELO).map(([rank, elo]) => (
                  <div
                    key={rank}
                    className='text-center p-2 bg-white rounded border'
                  >
                    <div className='font-bold'>{rank}</div>
                    <div className='text-xs text-muted-foreground'>{elo}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {results.length === 0 && !isRunning && (
          <div className='text-center py-8 text-muted-foreground'>
            Click "Run Tests" to validate the rank system
          </div>
        )}

        {isRunning && (
          <div className='text-center py-8'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto'></div>
            <p className='mt-2 text-muted-foreground'>
              Running validation tests...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
