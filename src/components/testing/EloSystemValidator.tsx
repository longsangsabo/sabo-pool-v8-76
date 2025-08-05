import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trophy, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { RANK_ELO } from '@/utils/eloConstants';
import { eloToSaboRank, saboRankToElo } from '@/utils/eloToSaboRank';

interface EloTestResult {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

export const EloSystemValidator: React.FC = () => {
  const [testResults, setTestResults] = useState<EloTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runEloSystemTests = () => {
    setIsRunning(true);
    const results: EloTestResult[] = [];

    // Test 1: ELO Constants Consistency
    try {
      const ranks = Object.keys(RANK_ELO);
      const eloValues = Object.values(RANK_ELO);

      // Check if ELO values are ascending
      let isAscending = true;
      for (let i = 1; i < eloValues.length; i++) {
        if (eloValues[i] <= eloValues[i - 1]) {
          isAscending = false;
          break;
        }
      }

      results.push({
        test: 'ELO Constants Progression',
        status: isAscending ? 'pass' : 'fail',
        message: isAscending
          ? 'ELO values properly ascend by rank'
          : 'ELO values do not properly ascend',
        details: { ranks, eloValues },
      });
    } catch (error) {
      results.push({
        test: 'ELO Constants Progression',
        status: 'fail',
        message: `Error testing constants: ${error}`,
      });
    }

    // Test 2: Bidirectional Conversion
    try {
      const conversions = Object.entries(RANK_ELO).map(([rank, elo]) => {
        const convertedRank = eloToSaboRank(elo);
        const convertedElo = saboRankToElo(rank);
        return {
          originalRank: rank,
          originalElo: elo,
          convertedRank,
          convertedElo,
          rankMatches: convertedRank === rank,
          eloMatches: convertedElo === elo,
        };
      });

      const allMatch = conversions.every(c => c.rankMatches && c.eloMatches);
      const failedConversions = conversions.filter(
        c => !c.rankMatches || !c.eloMatches
      );

      results.push({
        test: 'Bidirectional ELO-Rank Conversion',
        status: allMatch ? 'pass' : 'fail',
        message: allMatch
          ? 'All ELO-Rank conversions are consistent'
          : `${failedConversions.length} conversion(s) failed`,
        details: failedConversions,
      });
    } catch (error) {
      results.push({
        test: 'Bidirectional ELO-Rank Conversion',
        status: 'fail',
        message: `Error testing conversions: ${error}`,
      });
    }

    // Test 3: Boundary Testing
    try {
      const boundaries = [
        { elo: 999, expectedRank: 'K' },
        { elo: 1000, expectedRank: 'K' },
        { elo: 1099, expectedRank: 'K' },
        { elo: 1100, expectedRank: 'K+' },
        { elo: 1199, expectedRank: 'K+' },
        { elo: 1200, expectedRank: 'I' },
        { elo: 1400, expectedRank: 'H' },
        { elo: 1800, expectedRank: 'F' },
        { elo: 2000, expectedRank: 'E' },
        { elo: 2100, expectedRank: 'E+' },
        { elo: 2500, expectedRank: 'E+' }, // Should still be E+ (highest)
      ];

      const boundaryTests = boundaries.map(({ elo, expectedRank }) => {
        const actualRank = eloToSaboRank(elo);
        return {
          elo,
          expectedRank,
          actualRank,
          matches: actualRank === expectedRank,
        };
      });

      const allBoundariesPass = boundaryTests.every(test => test.matches);
      const failedBoundaries = boundaryTests.filter(test => !test.matches);

      results.push({
        test: 'ELO Boundary Testing',
        status: allBoundariesPass ? 'pass' : 'fail',
        message: allBoundariesPass
          ? 'All boundary conditions pass'
          : `${failedBoundaries.length} boundary test(s) failed`,
        details: failedBoundaries,
      });
    } catch (error) {
      results.push({
        test: 'ELO Boundary Testing',
        status: 'fail',
        message: `Error testing boundaries: ${error}`,
      });
    }

    // Test 4: Rank Coverage
    try {
      const allRanks = [
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
      const constantRanks = Object.keys(RANK_ELO);
      const conversionRanks = allRanks.map(rank => ({
        rank,
        hasConstant: constantRanks.includes(rank),
        hasConversion: saboRankToElo(rank) > 0,
      }));

      const allCovered = conversionRanks.every(
        r => r.hasConstant && r.hasConversion
      );
      const missingRanks = conversionRanks.filter(
        r => !r.hasConstant || !r.hasConversion
      );

      results.push({
        test: 'Rank Coverage Completeness',
        status: allCovered ? 'pass' : 'warning',
        message: allCovered
          ? 'All ranks have constants and conversions'
          : `${missingRanks.length} rank(s) missing coverage`,
        details: missingRanks,
      });
    } catch (error) {
      results.push({
        test: 'Rank Coverage Completeness',
        status: 'fail',
        message: `Error testing coverage: ${error}`,
      });
    }

    setTestResults(results);
    setIsRunning(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className='w-4 h-4 text-green-500' />;
      case 'fail':
        return <AlertTriangle className='w-4 h-4 text-red-500' />;
      case 'warning':
        return <Info className='w-4 h-4 text-yellow-500' />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'fail':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'warning':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  return (
    <Card className='w-full'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Trophy className='w-5 h-5' />
          ELO System Validator
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <Alert>
          <Info className='w-4 h-4' />
          <AlertDescription>
            This validator checks the consistency and correctness of the ELO
            ranking system. It tests constants, conversions, boundaries, and
            coverage.
          </AlertDescription>
        </Alert>

        <Button
          onClick={runEloSystemTests}
          disabled={isRunning}
          className='w-full'
        >
          {isRunning ? 'Running Tests...' : 'Run ELO System Tests'}
        </Button>

        {testResults.length > 0 && (
          <div className='space-y-3'>
            <h3 className='font-semibold text-lg'>Test Results</h3>
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${getStatusColor(result.status)}`}
              >
                <div className='flex items-center gap-2 mb-1'>
                  {getStatusIcon(result.status)}
                  <span className='font-medium'>{result.test}</span>
                  <Badge
                    variant={
                      result.status === 'pass' ? 'default' : 'destructive'
                    }
                  >
                    {result.status.toUpperCase()}
                  </Badge>
                </div>
                <p className='text-sm'>{result.message}</p>
                {result.details && (
                  <details className='mt-2'>
                    <summary className='text-sm font-medium cursor-pointer'>
                      View Details
                    </summary>
                    <pre className='mt-2 text-xs bg-black/5 p-2 rounded overflow-auto'>
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}

        {testResults.length > 0 && (
          <div className='mt-4 p-4 bg-gray-50 rounded-lg'>
            <h4 className='font-semibold mb-2'>Summary</h4>
            <div className='grid grid-cols-3 gap-4 text-center'>
              <div>
                <div className='text-2xl font-bold text-green-600'>
                  {testResults.filter(r => r.status === 'pass').length}
                </div>
                <div className='text-sm text-gray-600'>Passed</div>
              </div>
              <div>
                <div className='text-2xl font-bold text-yellow-600'>
                  {testResults.filter(r => r.status === 'warning').length}
                </div>
                <div className='text-sm text-gray-600'>Warnings</div>
              </div>
              <div>
                <div className='text-2xl font-bold text-red-600'>
                  {testResults.filter(r => r.status === 'fail').length}
                </div>
                <div className='text-sm text-gray-600'>Failed</div>
              </div>
            </div>
          </div>
        )}

        <Alert className='bg-blue-50 border-blue-200'>
          <Info className='w-4 h-4' />
          <AlertDescription>
            <strong>Current ELO System:</strong>
            <br />
            K: 1000, K+: 1100, I: 1200, I+: 1300, H: 1400, H+: 1500, G: 1600,
            G+: 1700, F: 1800, F+: 1900, E: 2000, E+: 2100
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
