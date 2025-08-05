import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Trophy,
  Activity,
  BarChart3,
  Calculator,
  Users,
} from 'lucide-react';
import {
  calculateElo,
  getRankFromRating,
  getRatingFromRank,
  getRankProgression,
  calculateEloEfficiency,
  calculateRecentForm,
  calculateConsistencyScore,
} from '../utils/eloCalculator';
import { PlayerStats } from '../types/common';

interface EloStatisticsProps {
  playerStats?: PlayerStats;
  className?: string;
}

const EloStatistics: React.FC<EloStatisticsProps> = ({
  playerStats,
  className,
}) => {
  const [customRating, setCustomRating] = useState(1500);
  const [opponentRating, setOpponentRating] = useState(1500);
  const [ratingHistory, setRatingHistory] = useState<number[]>([]);
  const [recentResults, setRecentResults] = useState<boolean[]>([]);

  // Mock data for demonstration
  const mockRatingHistory = [
    { date: '2024-01', rating: 1400, matches: 15 },
    { date: '2024-02', rating: 1450, matches: 18 },
    { date: '2024-03', rating: 1420, matches: 12 },
    { date: '2024-04', rating: 1480, matches: 20 },
    { date: '2024-05', rating: 1520, matches: 16 },
    { date: '2024-06', rating: 1550, matches: 14 },
  ];

  const mockMatchResults = [
    {
      date: '2024-06-01',
      result: 'Win',
      ratingChange: +15,
      opponent: 'Player A',
    },
    {
      date: '2024-06-03',
      result: 'Loss',
      ratingChange: -12,
      opponent: 'Player B',
    },
    {
      date: '2024-06-05',
      result: 'Win',
      ratingChange: +18,
      opponent: 'Player C',
    },
    {
      date: '2024-06-07',
      result: 'Win',
      ratingChange: +14,
      opponent: 'Player D',
    },
    {
      date: '2024-06-10',
      result: 'Loss',
      ratingChange: -16,
      opponent: 'Player E',
    },
  ];

  useEffect(() => {
    // Initialize with mock data or player stats
    if (playerStats) {
      setCustomRating(playerStats.elo_rating);
    }

    // Mock recent results for demonstration
    setRecentResults([
      true,
      false,
      true,
      true,
      false,
      true,
      true,
      false,
      true,
      true,
    ]);
    setRatingHistory([
      1400, 1420, 1380, 1450, 1480, 1460, 1520, 1500, 1550, 1520,
    ]);
  }, [playerStats]);

  const calculateWinProbability = (
    rating1: number,
    rating2: number
  ): number => {
    return 1 / (1 + Math.pow(10, (rating2 - rating1) / 400));
  };

  const getRequiredWinsForRank = (
    currentRating: number,
    targetRank: string
  ): number => {
    const targetRating = getRatingFromRank(targetRank);
    const ratingDifference = targetRating - currentRating;

    if (ratingDifference <= 0) return 0;

    // Assume average rating gain of 15 points per win
    return Math.ceil(ratingDifference / 15);
  };

  const getRankDistribution = () => {
    const ranks = [
      'K1',
      'K2',
      'K3',
      'D1',
      'D2',
      'D3',
      'D4',
      'D5',
      'Dan1',
      'Dan2',
      'Dan3',
      'Dan4',
      'Dan5',
      'Dan6',
      'Dan7',
    ];
    const distribution = ranks.map(rank => ({
      rank,
      count: Math.floor(Math.random() * 100) + 10, // Mock data
      percentage: Math.floor(Math.random() * 15) + 5,
    }));
    return distribution;
  };

  const currentRank = getRankFromRating(customRating);
  const winProbability = calculateWinProbability(customRating, opponentRating);
  const nextRanks = getRankProgression(currentRank).slice(0, 3);
  const eloEfficiency = calculateEloEfficiency(
    ratingHistory.length > 0
      ? ratingHistory[ratingHistory.length - 1] - ratingHistory[0]
      : 0,
    ratingHistory.length
  );
  const recentForm = calculateRecentForm(recentResults);
  const consistencyScore = calculateConsistencyScore(ratingHistory);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overview Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>Current Rating</p>
                <p className='text-2xl font-bold'>{customRating}</p>
                <Badge className='mt-1'>{currentRank}</Badge>
              </div>
              <Trophy className='h-8 w-8 text-yellow-500' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>Recent Form</p>
                <p className='text-2xl font-bold'>{recentForm.toFixed(1)}%</p>
                <div className='flex items-center mt-1'>
                  {recentForm >= 60 ? (
                    <TrendingUp className='h-4 w-4 text-green-500 mr-1' />
                  ) : (
                    <TrendingDown className='h-4 w-4 text-red-500 mr-1' />
                  )}
                  <span className='text-xs text-gray-500'>
                    {recentResults.filter(r => r).length}/{recentResults.length}{' '}
                    wins
                  </span>
                </div>
              </div>
              <Activity className='h-8 w-8 text-blue-500' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>Consistency</p>
                <p className='text-2xl font-bold'>{consistencyScore}%</p>
                <div className='flex items-center mt-1'>
                  <Target className='h-4 w-4 text-purple-500 mr-1' />
                  <span className='text-xs text-gray-500'>
                    {consistencyScore >= 80
                      ? 'Very Stable'
                      : consistencyScore >= 60
                        ? 'Stable'
                        : 'Variable'}
                  </span>
                </div>
              </div>
              <BarChart3 className='h-8 w-8 text-purple-500' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>ELO Efficiency</p>
                <p className='text-2xl font-bold'>{eloEfficiency.toFixed(1)}</p>
                <div className='flex items-center mt-1'>
                  <Calculator className='h-4 w-4 text-orange-500 mr-1' />
                  <span className='text-xs text-gray-500'>pts/match</span>
                </div>
              </div>
              <Users className='h-8 w-8 text-orange-500' />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue='analysis' className='space-y-4'>
        <TabsList className='grid w-full grid-cols-4'>
          <TabsTrigger value='analysis'>Analysis</TabsTrigger>
          <TabsTrigger value='progression'>Progression</TabsTrigger>
          <TabsTrigger value='calculator'>Calculator</TabsTrigger>
          <TabsTrigger value='distribution'>Distribution</TabsTrigger>
        </TabsList>

        <TabsContent value='analysis' className='space-y-4'>
          {/* Rating History Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Rating History</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width='100%' height={300}>
                <LineChart data={mockRatingHistory}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='date' />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type='monotone'
                    dataKey='rating'
                    stroke='#8884d8'
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Recent Match Results */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Match Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-2'>
                {mockMatchResults.map((match, index) => (
                  <div
                    key={index}
                    className='flex items-center justify-between p-3 border rounded-lg'
                  >
                    <div className='flex items-center space-x-3'>
                      <Badge
                        variant={
                          match.result === 'Win' ? 'default' : 'destructive'
                        }
                        className='w-12 justify-center'
                      >
                        {match.result}
                      </Badge>
                      <div>
                        <p className='font-medium'>vs {match.opponent}</p>
                        <p className='text-sm text-gray-500'>{match.date}</p>
                      </div>
                    </div>
                    <div
                      className={`font-bold ${match.ratingChange > 0 ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {match.ratingChange > 0 ? '+' : ''}
                      {match.ratingChange}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='progression' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Rank Progression Path</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div className='flex items-center justify-between p-4 bg-blue-50 rounded-lg'>
                  <div>
                    <p className='font-semibold'>Current Rank</p>
                    <Badge className='mt-1'>{currentRank}</Badge>
                  </div>
                  <div className='text-right'>
                    <p className='text-2xl font-bold text-blue-600'>
                      {customRating}
                    </p>
                    <p className='text-sm text-gray-500'>ELO Rating</p>
                  </div>
                </div>

                <div className='space-y-3'>
                  <h4 className='font-medium'>Next Rank Targets:</h4>
                  {nextRanks.map(rank => {
                    const targetRating = getRatingFromRank(rank);
                    const requiredWins = getRequiredWinsForRank(
                      customRating,
                      rank
                    );
                    const progress = Math.max(
                      0,
                      ((customRating - getRatingFromRank(currentRank)) /
                        (targetRating - getRatingFromRank(currentRank))) *
                        100
                    );

                    return (
                      <div
                        key={rank}
                        className='flex items-center justify-between p-3 border rounded-lg'
                      >
                        <div className='flex items-center space-x-3'>
                          <Badge variant='outline'>{rank}</Badge>
                          <div>
                            <p className='font-medium'>{targetRating} ELO</p>
                            <p className='text-sm text-gray-500'>
                              {targetRating - customRating} points needed
                            </p>
                          </div>
                        </div>
                        <div className='text-right'>
                          <p className='font-semibold text-blue-600'>
                            ~{requiredWins} wins
                          </p>
                          <div className='w-24 bg-gray-200 rounded-full h-2 mt-1'>
                            <div
                              className='bg-blue-600 h-2 rounded-full transition-all'
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='calculator' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Match Outcome Calculator</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='your-rating'>Your Rating</Label>
                  <Input
                    id='your-rating'
                    type='number'
                    value={customRating}
                    onChange={e => setCustomRating(Number(e.target.value))}
                  />
                  <Badge className='mt-2'>
                    {getRankFromRating(customRating)}
                  </Badge>
                </div>
                <div>
                  <Label htmlFor='opponent-rating'>Opponent Rating</Label>
                  <Input
                    id='opponent-rating'
                    type='number'
                    value={opponentRating}
                    onChange={e => setOpponentRating(Number(e.target.value))}
                  />
                  <Badge className='mt-2'>
                    {getRankFromRating(opponentRating)}
                  </Badge>
                </div>
              </div>

              <Card className='bg-gray-50'>
                <CardContent className='p-4'>
                  <div className='grid grid-cols-2 gap-4 text-center'>
                    <div>
                      <p className='text-lg font-bold text-green-600'>
                        {(winProbability * 100).toFixed(1)}%
                      </p>
                      <p className='text-sm text-gray-600'>Win Probability</p>
                    </div>
                    <div>
                      <p className='text-lg font-bold text-red-600'>
                        {((1 - winProbability) * 100).toFixed(1)}%
                      </p>
                      <p className='text-sm text-gray-600'>Loss Probability</p>
                    </div>
                  </div>

                  <div className='mt-4 space-y-2'>
                    <div className='flex justify-between'>
                      <span className='text-sm'>If you win:</span>
                      <span className='font-medium text-green-600'>
                        +{Math.round(32 * (1 - winProbability))} ELO
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-sm'>If you lose:</span>
                      <span className='font-medium text-red-600'>
                        -{Math.round(32 * winProbability)} ELO
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='distribution' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Rank Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width='100%' height={400}>
                <BarChart data={getRankDistribution()}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='rank' />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey='count' fill='#8884d8' />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Player Distribution by Rank</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width='100%' height={300}>
                <PieChart>
                  <Pie
                    data={getRankDistribution().slice(0, 5)}
                    cx='50%'
                    cy='50%'
                    labelLine={false}
                    label={({ rank, percentage }) => `${rank} (${percentage}%)`}
                    outerRadius={80}
                    fill='#8884d8'
                    dataKey='percentage'
                  >
                    {getRankDistribution()
                      .slice(0, 5)
                      .map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EloStatistics;
