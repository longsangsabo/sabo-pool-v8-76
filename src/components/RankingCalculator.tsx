import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import EloCalculator from './EloCalculator';
import {
  calculateElo,
  getKFactor,
  getRankFromRating,
  predictMatchResult,
} from '../utils/eloCalculator';

const RankingCalculator = () => {
  const [player1Rating, setPlayer1Rating] = useState(1500);
  const [player2Rating, setPlayer2Rating] = useState(1500);
  const [player1Matches, setPlayer1Matches] = useState(50);
  const [player2Matches, setPlayer2Matches] = useState(50);

  const player1KFactor = getKFactor(player1Rating, player1Matches);
  const player2KFactor = getKFactor(player2Rating, player2Matches);

  const matchPrediction = predictMatchResult(player1Rating, player2Rating);

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle>Ranking Calculator</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue='calculator' className='space-y-4'>
            <TabsList className='grid w-full grid-cols-2'>
              <TabsTrigger value='calculator'>ELO Calculator</TabsTrigger>
              <TabsTrigger value='prediction'>Match Prediction</TabsTrigger>
            </TabsList>

            <TabsContent value='calculator'>
              <EloCalculator />
            </TabsContent>

            <TabsContent value='prediction' className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='p1-rating'>Player 1 Rating</Label>
                  <Input
                    id='p1-rating'
                    type='number'
                    value={player1Rating}
                    onChange={e => setPlayer1Rating(Number(e.target.value))}
                  />
                  <p className='text-sm text-gray-500 mt-1'>
                    Rank: {getRankFromRating(player1Rating)} | K-Factor:{' '}
                    {player1KFactor}
                  </p>
                </div>
                <div>
                  <Label htmlFor='p2-rating'>Player 2 Rating</Label>
                  <Input
                    id='p2-rating'
                    type='number'
                    value={player2Rating}
                    onChange={e => setPlayer2Rating(Number(e.target.value))}
                  />
                  <p className='text-sm text-gray-500 mt-1'>
                    Rank: {getRankFromRating(player2Rating)} | K-Factor:{' '}
                    {player2KFactor}
                  </p>
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='p1-matches'>Player 1 Matches Played</Label>
                  <Input
                    id='p1-matches'
                    type='number'
                    value={player1Matches}
                    onChange={e => setPlayer1Matches(Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor='p2-matches'>Player 2 Matches Played</Label>
                  <Input
                    id='p2-matches'
                    type='number'
                    value={player2Matches}
                    onChange={e => setPlayer2Matches(Number(e.target.value))}
                  />
                </div>
              </div>

              <Card className='bg-gray-50'>
                <CardHeader>
                  <CardTitle className='text-lg'>Match Prediction</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-2 gap-4 text-center'>
                    <div>
                      <p className='text-2xl font-bold text-blue-600'>
                        {(matchPrediction.player1WinProbability * 100).toFixed(
                          1
                        )}
                        %
                      </p>
                      <p className='text-sm text-gray-600'>
                        Player 1 Win Chance
                      </p>
                    </div>
                    <div>
                      <p className='text-2xl font-bold text-red-600'>
                        {(matchPrediction.player2WinProbability * 100).toFixed(
                          1
                        )}
                        %
                      </p>
                      <p className='text-sm text-gray-600'>
                        Player 2 Win Chance
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default RankingCalculator;
