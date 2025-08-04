import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Edit, 
  MapPin, 
  Calendar,
  Trophy,
  Target,
  Users,
  Phone,
  Mail,
  Clock,
  TrendingUp,
  Award,
  Star,
  Crown
} from 'lucide-react';

const UserProfilePage: React.FC = () => {
  // Mock user data
  const userProfile = {
    id: '1',
    fullName: 'Nguyễn Văn A',
    username: 'poolmaster2024',
    email: 'nguyenvana@example.com',
    phone: '+84 901 234 567',
    avatar: '/avatars/user.jpg',
    location: 'TP. Hồ Chí Minh, Việt Nam',
    joinDate: '2023-01-15',
    rank: 'Gold II',
    elo: 1847,
    membershipType: 'Premium',
    club: 'Sabo Pool Arena',
    bio: 'Passionate pool player with 5+ years of experience. Love competing in tournaments and improving my skills every day.',
    
    stats: {
      totalMatches: 156,
      wins: 98,
      losses: 58,
      winRate: 62.8,
      currentStreak: 5,
      bestStreak: 12,
      hoursPlayed: 124,
      favoriteGame: '8-Ball'
    },

    recentAchievements: [
      { name: 'Tournament Champion', date: '2024-04-10', description: 'Won Spring Championship 2024' },
      { name: 'Streak Master', date: '2024-03-22', description: 'Won 10 matches in a row' },
      { name: 'Century Club', date: '2024-05-20', description: 'Played 100+ matches' }
    ],

    recentMatches: [
      { date: '2024-06-15', opponent: 'Player123', result: 'Win', score: '8-6' },
      { date: '2024-06-14', opponent: 'PoolMaster', result: 'Win', score: '8-4' },
      { date: '2024-06-13', opponent: 'BallHunter', result: 'Loss', score: '5-8' },
      { date: '2024-06-12', opponent: 'ShotCaller', result: 'Win', score: '8-7' },
      { date: '2024-06-11', opponent: 'CueStick99', result: 'Win', score: '8-3' }
    ]
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={userProfile.avatar} />
              <AvatarFallback className="text-2xl">
                {userProfile.fullName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-bold">{userProfile.fullName}</h1>
                <Badge variant="default" className="bg-yellow-500">
                  <Crown className="h-3 w-3 mr-1" />
                  {userProfile.rank}
                </Badge>
                <Badge variant="secondary">
                  {userProfile.membershipType}
                </Badge>
              </div>
              
              <p className="text-lg text-gray-600 dark:text-gray-400">@{userProfile.username}</p>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {userProfile.location}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Joined {new Date(userProfile.joinDate).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {userProfile.club}
                </div>
              </div>
              
              <p className="text-gray-700 dark:text-gray-300 max-w-2xl">
                {userProfile.bio}
              </p>
            </div>
            
            <div className="flex flex-col space-y-2">
              <Button>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
              <div className="text-center">
                <div className="text-2xl font-bold">{userProfile.elo}</div>
                <div className="text-sm text-gray-500">ELO Rating</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <div className="text-2xl font-bold">{userProfile.stats.wins}</div>
            <div className="text-sm text-gray-500">Wins</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">{userProfile.stats.winRate}%</div>
            <div className="text-sm text-gray-500">Win Rate</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">{userProfile.stats.currentStreak}</div>
            <div className="text-sm text-gray-500">Current Streak</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 mx-auto mb-2 text-purple-500" />
            <div className="text-2xl font-bold">{userProfile.stats.hoursPlayed}h</div>
            <div className="text-sm text-gray-500">Hours Played</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contact">Contact Info</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
                <CardDescription>Your overall pool performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">{userProfile.stats.wins}</div>
                    <div className="text-sm text-gray-500">Total Wins</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-500">{userProfile.stats.losses}</div>
                    <div className="text-sm text-gray-500">Total Losses</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Win Rate</span>
                    <span>{userProfile.stats.winRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${userProfile.stats.winRate}%` }}
                    />
                  </div>
                </div>
                
                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Best Streak:</span>
                    <span className="font-semibold">{userProfile.stats.bestStreak} wins</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Favorite Game:</span>
                    <span className="font-semibold">{userProfile.stats.favoriteGame}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ranking & Progress</CardTitle>
                <CardDescription>Your current standing and progression</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center space-y-2">
                  <Crown className="h-12 w-12 mx-auto text-yellow-500" />
                  <div className="text-2xl font-bold">{userProfile.rank}</div>
                  <div className="text-sm text-gray-500">Current Rank</div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>ELO Rating</span>
                    <span>{userProfile.elo}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full" 
                      style={{ width: '75%' }}
                    />
                  </div>
                  <div className="text-xs text-gray-500">153 points to next rank</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Contact Info Tab */}
        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Contact Information
              </CardTitle>
              <CardDescription>Personal contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-gray-500" />
                  <div>
                    <div className="font-medium">{userProfile.email}</div>
                    <div className="text-sm text-gray-500">Primary Email</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-gray-500" />
                  <div>
                    <div className="font-medium">{userProfile.phone}</div>
                    <div className="text-sm text-gray-500">Mobile Phone</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-gray-500" />
                  <div>
                    <div className="font-medium">{userProfile.location}</div>
                    <div className="text-sm text-gray-500">Location</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-gray-500" />
                  <div>
                    <div className="font-medium">{userProfile.club}</div>
                    <div className="text-sm text-gray-500">Club Membership</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Recent Achievements
              </CardTitle>
              <CardDescription>Your latest accomplishments and milestones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userProfile.recentAchievements.map((achievement, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900">
                      <Trophy className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{achievement.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {achievement.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(achievement.date).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      <Star className="h-3 w-3 mr-1" />
                      Earned
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Match History
              </CardTitle>
              <CardDescription>Your latest matches and results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userProfile.recentMatches.map((match, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${
                        match.result === 'Win' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <div>
                        <p className="font-medium">vs {match.opponent}</p>
                        <p className="text-sm text-gray-500">{match.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{match.score}</p>
                      <Badge variant={match.result === 'Win' ? 'default' : 'destructive'}>
                        {match.result}
                      </Badge>
                    </div>
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

export default UserProfilePage;
