import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { 
  Trophy, 
  Calendar, 
  Users, 
  Award,
  TrendingUp,
  BarChart3,
  Clock,
  Crown,
  Medal,
  Star
} from 'lucide-react';

const SeasonHistoryPage: React.FC = () => {
  const seasons = [
    {
      id: 'season-2024-2',
      name: 'Season 2024.2',
      period: 'Jul 2024 - Dec 2024',
      status: 'current',
      tournaments: 45,
      participants: 1250,
      champion: 'PoolMaster2024',
      myRank: 15,
      myStats: { matches: 32, wins: 22, winRate: 68.75 }
    },
    {
      id: 'season-2024-1', 
      name: 'Season 2024.1',
      period: 'Jan 2024 - Jun 2024',
      status: 'completed',
      tournaments: 38,
      participants: 980,
      champion: 'CueStick99',
      myRank: 8,
      myStats: { matches: 28, wins: 20, winRate: 71.43 }
    },
    {
      id: 'season-2023-2',
      name: 'Season 2023.2', 
      period: 'Jul 2023 - Dec 2023',
      status: 'completed',
      tournaments: 42,
      participants: 850,
      champion: 'BallHunter',
      myRank: 12,
      myStats: { matches: 25, wins: 16, winRate: 64.00 }
    },
    {
      id: 'season-2023-1',
      name: 'Season 2023.1',
      period: 'Jan 2023 - Jun 2023', 
      status: 'completed',
      tournaments: 35,
      participants: 720,
      champion: 'ShotCaller',
      myRank: 20,
      myStats: { matches: 20, wins: 12, winRate: 60.00 }
    }
  ];

  const achievements = [
    { season: 'Season 2024.1', achievement: 'Top 10 Finisher', icon: Medal },
    { season: 'Season 2023.2', achievement: 'Most Improved Player', icon: TrendingUp },
    { season: 'Season 2023.1', achievement: 'Newcomer of the Season', icon: Star }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
          <Clock className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Season History</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Your performance across all seasons
          </p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Seasons</p>
                <p className="text-2xl font-bold">4</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Best Rank</p>
                <p className="text-2xl font-bold">#8</p>
              </div>
              <Crown className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Matches</p>
                <p className="text-2xl font-bold">105</p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Achievements</p>
                <p className="text-2xl font-bold">{achievements.length}</p>
              </div>
              <Award className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="seasons" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="seasons">Seasons</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="progress">Progress Chart</TabsTrigger>
        </TabsList>

        {/* Seasons Tab */}
        <TabsContent value="seasons" className="space-y-6">
          <div className="space-y-4">
            {seasons.map((season) => (
              <Card key={season.id} className={`${season.status === 'current' ? 'ring-2 ring-blue-500' : ''}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5" />
                        {season.name}
                        {season.status === 'current' && (
                          <Badge variant="default">Current</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{season.period}</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">#{season.myRank}</div>
                      <div className="text-sm text-gray-500">Your Rank</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold">{season.tournaments}</div>
                      <div className="text-sm text-gray-500">Tournaments</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold">{season.participants}</div>
                      <div className="text-sm text-gray-500">Players</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold">{season.myStats.wins}/{season.myStats.matches}</div>
                      <div className="text-sm text-gray-500">Your W/L</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold">{season.myStats.winRate}%</div>
                      <div className="text-sm text-gray-500">Win Rate</div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Season Champion:</span>
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-yellow-500" />
                        <span className="font-semibold">{season.champion}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Season Achievements
              </CardTitle>
              <CardDescription>
                Special recognition earned throughout different seasons
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {achievements.map((achievement, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900">
                      <achievement.icon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{achievement.achievement}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Earned in {achievement.season}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      <Star className="h-3 w-3 mr-1" />
                      Unlocked
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Progress Chart Tab */}
        <TabsContent value="progress" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Progress
              </CardTitle>
              <CardDescription>
                Your rank and performance evolution over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Rank Progress Chart */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Rank Progress</h3>
                  <div className="space-y-2">
                    {seasons.map((season, index) => (
                      <div key={season.id} className="flex items-center space-x-4">
                        <div className="w-24 text-sm">{season.name}</div>
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Rank #{season.myRank}</span>
                            <span>{Math.round(((season.participants - season.myRank) / season.participants) * 100)}th percentile</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                              style={{ width: `${((season.participants - season.myRank) / season.participants) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Win Rate Progress */}
                <div className="space-y-4 pt-6 border-t">
                  <h3 className="font-semibold">Win Rate Progress</h3>
                  <div className="space-y-2">
                    {seasons.map((season, index) => (
                      <div key={season.id} className="flex items-center space-x-4">
                        <div className="w-24 text-sm">{season.name}</div>
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{season.myStats.wins}W-{season.myStats.matches - season.myStats.wins}L</span>
                            <span>{season.myStats.winRate}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full"
                              style={{ width: `${season.myStats.winRate}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SeasonHistoryPage;
