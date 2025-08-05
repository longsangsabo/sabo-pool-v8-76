import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import {
  calculateEloRating,
  getRankFromRating,
  getRatingFromRank,
  getRankColor,
  getExpectedScore,
} from '../utils/eloCalculator';

const EloCalculator = () => {
  const [player1Rating, setPlayer1Rating] = useState(1500);
  const [player2Rating, setPlayer2Rating] = useState(1500);
  const [kFactor, setKFactor] = useState(32);
  const [result, setResult] = useState<'win' | 'loss' | 'draw'>('win');
  const [calculationResult, setCalculationResult] = useState<{
    player1NewRating: number;
    player2NewRating: number;
    player1Change: number;
    player2Change: number;
    expectedScore: number;
  } | null>(null);

  const handleCalculate = () => {
    const player1NewRating = calculateEloRating(
      player1Rating,
      player2Rating,
      result,
      kFactor
    );
    const player2NewRating = calculateEloRating(
      player2Rating,
      player1Rating,
      result === 'win' ? 'loss' : result === 'loss' ? 'win' : 'draw',
      kFactor
    );
    const expectedScore = getExpectedScore(player1Rating, player2Rating);

    setCalculationResult({
      player1NewRating,
      player2NewRating,
      player1Change: player1NewRating - player1Rating,
      player2Change: player2NewRating - player2Rating,
      expectedScore,
    });
  };

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle>ELO Rating Calculator</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <Label htmlFor='player1-rating'>Player 1 Rating</Label>
              <Input
                id='player1-rating'
                type='number'
                value={player1Rating}
                onChange={e => setPlayer1Rating(Number(e.target.value))}
              />
              <Badge
                className={`mt-2 ${getRankColor(getRankFromRating(player1Rating))}`}
              >
                {getRankFromRating(player1Rating)}
              </Badge>
            </div>
            <div>
              <Label htmlFor='player2-rating'>Player 2 Rating</Label>
              <Input
                id='player2-rating'
                type='number'
                value={player2Rating}
                onChange={e => setPlayer2Rating(Number(e.target.value))}
              />
              <Badge
                className={`mt-2 ${getRankColor(getRankFromRating(player2Rating))}`}
              >
                {getRankFromRating(player2Rating)}
              </Badge>
            </div>
          </div>

          <div>
            <Label htmlFor='k-factor'>K-Factor</Label>
            <Input
              id='k-factor'
              type='number'
              value={kFactor}
              onChange={e => setKFactor(Number(e.target.value))}
            />
          </div>

          <div>
            <Label>Match Result (Player 1 perspective)</Label>
            <div className='flex gap-2 mt-2'>
              <Button
                variant={result === 'win' ? 'default' : 'outline'}
                onClick={() => setResult('win')}
              >
                Win
              </Button>
              <Button
                variant={result === 'loss' ? 'default' : 'outline'}
                onClick={() => setResult('loss')}
              >
                Loss
              </Button>
              <Button
                variant={result === 'draw' ? 'default' : 'outline'}
                onClick={() => setResult('draw')}
              >
                Draw
              </Button>
            </div>
          </div>

          <Button onClick={handleCalculate} className='w-full'>
            Calculate ELO Changes
          </Button>
        </CardContent>
      </Card>

      {calculationResult && (
        <Card>
          <CardHeader>
            <CardTitle>Calculation Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <h4 className='font-semibold'>Player 1</h4>
                <p>Old Rating: {player1Rating}</p>
                <p>New Rating: {calculationResult.player1NewRating}</p>
                <p
                  className={
                    calculationResult.player1Change >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }
                >
                  Change: {calculationResult.player1Change >= 0 ? '+' : ''}
                  {calculationResult.player1Change}
                </p>
              </div>
              <div>
                <h4 className='font-semibold'>Player 2</h4>
                <p>Old Rating: {player2Rating}</p>
                <p>New Rating: {calculationResult.player2NewRating}</p>
                <p
                  className={
                    calculationResult.player2Change >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }
                >
                  Change: {calculationResult.player2Change >= 0 ? '+' : ''}
                  {calculationResult.player2Change}
                </p>
              </div>
            </div>
            <div className='mt-4'>
              <p>
                Expected Score (Player 1):{' '}
                {(calculationResult.expectedScore * 100).toFixed(1)}%
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EloCalculator;
