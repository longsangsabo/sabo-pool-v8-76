import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Progress } from '@/shared/components/ui/progress';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/components/ui/tabs';
import {
  Trophy,
  Target,
  TrendingUp,
  Award,
  Calendar,
  Clock,
  Zap,
  Star,
  Medal,
  Crown,
  Activity,
  BarChart3,
} from 'lucide-react';

const UserStatsPage: React.FC = () => {
  // Mock data
  const overallStats = {
    totalMatches: 156,
    wins: 98,
    losses: 58,
    winRate: 62.8,
    currentStreak: 5,
    bestStreak: 12,
    rank: 'Gold II',
    elo: 1847,
    hoursPlayed: 124,
  };

  const monthlyStats = [
    { month: 'Jan', matches: 18, wins: 12 },
    { month: 'Feb', matches: 22, wins: 14 },
    { month: 'Mar', matches: 25, wins: 16 },
    { month: 'Apr', matches: 28, wins: 19 },
    { month: 'May', matches: 31, wins: 20 },
    { month: 'Jun', matches: 32, wins: 17 },
  ];

  const achievements = [
    {
      id: 1,
      name: 'First Victory',
      description: 'Win your first match',
      unlocked: true,
      date: '2024-01-15',
    },
    {
      id: 2,
      name: 'Streak Master',
      description: 'Win 10 matches in a row',
      unlocked: true,
      date: '2024-03-22',
    },
    {
      id: 3,
      name: 'Tournament Champion',
      description: 'Win a tournament',
      unlocked: true,
      date: '2024-04-10',
    },
    {
      id: 4,
      name: 'Century Club',
      description: 'Play 100 matches',
      unlocked: true,
      date: '2024-05-20',
    },
    {
      id: 5,
      name: 'Perfectionist',
      description: 'Win 50 matches in a row',
      unlocked: false,
      date: null,
    },
    {
      id: 6,
      name: 'Legend',
      description: 'Reach Diamond rank',
      unlocked: false,
      date: null,
    },
  ];

  return (
    <div className='container mx-auto py-6 space-y-6'>
      <div className='flex items-center space-x-4'>
        <div className='h-10 w-10 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center'>
          <BarChart3 className='h-6 w-6 text-white' />
        </div>
        <div>
          <h1 className='text-3xl font-bold'>Player Statistics</h1>
          <p className='text-gray-600 dark:text-gray-400'>
            Track your performance and progress over time
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                  Total Matches
                </p>
                <p className='text-2xl font-bold'>
                  {overallStats.totalMatches}
                </p>
              </div>
              <Trophy className='h-8 w-8 text-blue-500' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                  Win Rate
                </p>
                <p className='text-2xl font-bold'>{overallStats.winRate}%</p>
              </div>
              <Target className='h-8 w-8 text-green-500' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                  Current Streak
                </p>
                <p className='text-2xl font-bold'>
                  {overallStats.currentStreak}
                </p>
              </div>
              <Zap className='h-8 w-8 text-yellow-500' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                  Current Rank
                </p>
                <p className='text-2xl font-bold'>{overallStats.rank}</p>
              </div>
              <Crown className='h-8 w-8 text-purple-500' />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue='overview' className='space-y-6'>
        <TabsList className='grid w-full grid-cols-4'>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          <TabsTrigger value='performance'>Performance</TabsTrigger>
          <TabsTrigger value='achievements'>Achievements</TabsTrigger>
          <TabsTrigger value='history'>Match History</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value='overview' className='space-y-6'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Activity className='h-5 w-5' />
                  Performance Overview
                </CardTitle>
                <CardDescription>
                  Your overall pool performance statistics
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <div className='flex justify-between text-sm'>
                    <span>Win Rate</span>
                    <span>{overallStats.winRate}%</span>
                  </div>
                  <Progress value={overallStats.winRate} className='h-2' />
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div className='text-center'>
                    <p className='text-2xl font-bold text-green-500'>
                      {overallStats.wins}
                    </p>
                    <p className='text-sm text-gray-500'>Wins</p>
                  </div>
                  <div className='text-center'>
                    <p className='text-2xl font-bold text-red-500'>
                      {overallStats.losses}
                    </p>
                    <p className='text-sm text-gray-500'>Losses</p>
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-4 pt-4 border-t'>
                  <div className='text-center'>
                    <p className='text-lg font-semibold'>
                      {overallStats.bestStreak}
                    </p>
                    <p className='text-sm text-gray-500'>Best Streak</p>
                  </div>
                  <div className='text-center'>
                    <p className='text-lg font-semibold'>
                      {overallStats.hoursPlayed}h
                    </p>
                    <p className='text-sm text-gray-500'>Hours Played</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <TrendingUp className='h-5 w-5' />
                  Rank Progress
                </CardTitle>
                <CardDescription>
                  Your current ranking and ELO rating
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='text-center space-y-2'>
                  <div className='flex justify-center'>
                    <Crown className='h-16 w-16 text-yellow-500' />
                  </div>
                  <h3 className='text-2xl font-bold'>{overallStats.rank}</h3>
                  <p className='text-sm text-gray-500'>
                    ELO: {overallStats.elo}
                  </p>
                </div>

                <div className='space-y-2'>
                  <div className='flex justify-between text-sm'>
                    <span>Progress to Gold I</span>
                    <span>78%</span>
                  </div>
                  <Progress value={78} className='h-2' />
                  <p className='text-xs text-gray-500'>153 ELO points needed</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Performance</CardTitle>
              <CardDescription>
                Your match performance over the last 6 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {monthlyStats.map((month, index) => (
                  <div key={index} className='flex items-center space-x-4'>
                    <div className='w-12 text-sm font-medium'>
                      {month.month}
                    </div>
                    <div className='flex-1 space-y-1'>
                      <div className='flex justify-between text-sm'>
                        <span>
                          {month.wins}/{month.matches} wins
                        </span>
                        <span>
                          {Math.round((month.wins / month.matches) * 100)}%
                        </span>
                      </div>
                      <Progress
                        value={(month.wins / month.matches) * 100}
                        className='h-2'
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value='performance' className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <Card>
              <CardHeader>
                <CardTitle>Recent Form</CardTitle>
                <CardDescription>Your last 10 matches</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='flex space-x-1'>
                  {['W', 'W', 'L', 'W', 'W', 'W', 'L', 'W', 'W', 'W'].map(
                    (result, index) => (
                      <div
                        key={index}
                        className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold text-white ${
                          result === 'W' ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      >
                        {result}
                      </div>
                    )
                  )}
                </div>
                <p className='text-sm text-gray-500 mt-2'>
                  7 wins in last 10 matches (70%)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Time Analysis</CardTitle>
                <CardDescription>Playing patterns and activity</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm'>Average match duration</span>
                  <Badge variant='secondary'>28 minutes</Badge>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm'>Most active time</span>
                  <Badge variant='secondary'>7-9 PM</Badge>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm'>Favorite day</span>
                  <Badge variant='secondary'>Saturday</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value='achievements' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Award className='h-5 w-5' />
                Achievements
              </CardTitle>
              <CardDescription>
                Your accomplishments and milestones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {achievements.map(achievement => (
                  <div
                    key={achievement.id}
                    className={`p-4 border rounded-lg flex items-center space-x-4 ${
                      achievement.unlocked
                        ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                        : 'bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-700'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-full ${
                        achievement.unlocked ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                    >
                      <Medal className='h-5 w-5 text-white' />
                    </div>
                    <div className='flex-1'>
                      <h4 className='font-semibold'>{achievement.name}</h4>
                      <p className='text-sm text-gray-600 dark:text-gray-400'>
                        {achievement.description}
                      </p>
                      {achievement.unlocked && achievement.date && (
                        <p className='text-xs text-green-600 dark:text-green-400 mt-1'>
                          Unlocked:{' '}
                          {new Date(achievement.date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    {achievement.unlocked && (
                      <Badge
                        variant='secondary'
                        className='bg-green-100 text-green-800'
                      >
                        <Star className='h-3 w-3 mr-1' />
                        Unlocked
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Match History Tab */}
        <TabsContent value='history' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Clock className='h-5 w-5' />
                Recent Matches
              </CardTitle>
              <CardDescription>
                Your latest match results and details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {[
                  {
                    date: '2024-06-15',
                    opponent: 'Player123',
                    result: 'Win',
                    score: '8-6',
                    duration: '32m',
                  },
                  {
                    date: '2024-06-14',
                    opponent: 'PoolMaster',
                    result: 'Win',
                    score: '8-4',
                    duration: '28m',
                  },
                  {
                    date: '2024-06-13',
                    opponent: 'BallHunter',
                    result: 'Loss',
                    score: '5-8',
                    duration: '35m',
                  },
                  {
                    date: '2024-06-12',
                    opponent: 'ShotCaller',
                    result: 'Win',
                    score: '8-7',
                    duration: '41m',
                  },
                  {
                    date: '2024-06-11',
                    opponent: 'CueStick99',
                    result: 'Win',
                    score: '8-3',
                    duration: '25m',
                  },
                ].map((match, index) => (
                  <div
                    key={index}
                    className='flex items-center justify-between p-4 border rounded-lg'
                  >
                    <div className='flex items-center space-x-4'>
                      <div
                        className={`w-3 h-3 rounded-full ${
                          match.result === 'Win' ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      />
                      <div>
                        <p className='font-medium'>vs {match.opponent}</p>
                        <p className='text-sm text-gray-500'>{match.date}</p>
                      </div>
                    </div>
                    <div className='text-right'>
                      <p className='font-medium'>{match.score}</p>
                      <p className='text-sm text-gray-500'>{match.duration}</p>
                    </div>
                    <Badge
                      variant={
                        match.result === 'Win' ? 'default' : 'destructive'
                      }
                    >
                      {match.result}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserStatsPage;
