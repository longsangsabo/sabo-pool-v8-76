import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Crown,
  Star,
  Shield,
  Flame,
  Zap,
  Users,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Target,
  Activity,
  Award,
  Medal,
  TrendingUpIcon,
  TrendingDownIcon,
  BarChart3,
} from 'lucide-react';
import { getRankFromRating, type PlayerStats } from '../utils/eloCalculator';

interface LeaderboardPlayer extends PlayerStats {
  username: string;
  avatar_url?: string;
  club_name?: string;
  last_active?: Date;
  season_points?: number;
  tournament_wins?: number;
  challenge_wins?: number;
}

interface EnhancedLeaderboardProps {
  players: LeaderboardPlayer[];
  className?: string;
}

export const EnhancedLeaderboard: React.FC<EnhancedLeaderboardProps> = ({
  players,
  className,
}) => {
  const [filteredPlayers, setFilteredPlayers] =
    useState<LeaderboardPlayer[]>(players);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<
    'rating' | 'matches' | 'win_rate' | 'streak' | 'form' | 'consistency'
  >('rating');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [rankFilter, setRankFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  useEffect(() => {
    let filtered = [...players];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        player =>
          player.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          player.club_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Rank filter
    if (rankFilter !== 'all') {
      filtered = filtered.filter(
        player => getRankFromRating(player.current_rating) === rankFilter
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: number;
      let bValue: number;

      switch (sortBy) {
        case 'rating':
          aValue = a.current_rating;
          bValue = b.current_rating;
          break;
        case 'matches':
          aValue = a.matches_played;
          bValue = b.matches_played;
          break;
        case 'win_rate':
          aValue = a.win_rate || 0;
          bValue = b.win_rate || 0;
          break;
        case 'streak':
          aValue = a.current_streak;
          bValue = b.current_streak;
          break;
        case 'form':
          aValue = a.recent_form || 0;
          bValue = b.recent_form || 0;
          break;
        case 'consistency':
          aValue = a.consistency_score || 50;
          bValue = b.consistency_score || 50;
          break;
        default:
          aValue = a.current_rating;
          bValue = b.current_rating;
      }

      if (sortOrder === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    setFilteredPlayers(filtered);
  }, [players, searchTerm, sortBy, sortOrder, rankFilter]);

  const getRankColor = (rating: number) => {
    if (rating >= 2800)
      return 'bg-purple-100 text-purple-800 border-purple-200';
    if (rating >= 2600)
      return 'bg-purple-100 text-purple-800 border-purple-200';
    if (rating >= 2400) return 'bg-red-100 text-red-800 border-red-200';
    if (rating >= 2200) return 'bg-red-100 text-red-800 border-red-200';
    if (rating >= 2000)
      return 'bg-orange-100 text-orange-800 border-orange-200';
    if (rating >= 1800)
      return 'bg-orange-100 text-orange-800 border-orange-200';
    if (rating >= 1600) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (rating >= 1400) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (rating >= 1200) return 'bg-green-100 text-green-800 border-green-200';
    if (rating >= 1000) return 'bg-green-100 text-green-800 border-green-200';
    if (rating >= 800) return 'bg-gray-100 text-gray-800 border-gray-200';
    if (rating >= 600) return 'bg-gray-100 text-gray-800 border-gray-200';
    if (rating >= 400) return 'bg-gray-100 text-gray-800 border-gray-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getRankName = (rating: number) => {
    const rank = getRankFromRating(rating);
    const names: { [key: string]: string } = {
      'E+': 'Chuyên nghiệp tiến bộ',
      E: 'Chuyên nghiệp',
      'F+': 'Xuất sắc tiến bộ',
      F: 'Xuất sắc',
      'G+': 'Giỏi tiến bộ',
      G: 'Giỏi',
      'H+': 'Khá tiến bộ',
      H: 'Khá',
      'I+': 'Trung bình tiến bộ',
      I: 'Trung bình',
      'K+': 'Người mới tiến bộ',
      K: 'Người mới',
    };
    return `${rank} (${names[rank]})`;
  };

  const getFormIcon = (form: number) => {
    if (form > 50) return <Flame className='h-4 w-4 text-red-500' />;
    if (form > 20) return <TrendingUpIcon className='h-4 w-4 text-green-500' />;
    if (form > -20) return <Activity className='h-4 w-4 text-yellow-500' />;
    if (form > -50)
      return <TrendingDownIcon className='h-4 w-4 text-orange-500' />;
    return <TrendingDown className='h-4 w-4 text-red-500' />;
  };

  const getConsistencyIcon = (score: number) => {
    if (score > 80) return <Shield className='h-4 w-4 text-green-500' />;
    if (score > 60) return <Shield className='h-4 w-4 text-blue-500' />;
    if (score > 40) return <BarChart3 className='h-4 w-4 text-yellow-500' />;
    return <BarChart3 className='h-4 w-4 text-red-500' />;
  };

  const getVolatilityIcon = (volatility: number) => {
    if (volatility < 30) return <Target className='h-4 w-4 text-green-500' />;
    if (volatility < 60) return <Activity className='h-4 w-4 text-blue-500' />;
    if (volatility < 100) return <Zap className='h-4 w-4 text-yellow-500' />;
    return <Zap className='h-4 w-4 text-red-500' />;
  };

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className='h-5 w-5 text-yellow-500' />;
      case 2:
        return <Medal className='h-5 w-5 text-gray-400' />;
      case 3:
        return <Award className='h-5 w-5 text-orange-500' />;
      default:
        return (
          <span className='text-sm font-medium text-gray-500'>#{position}</span>
        );
    }
  };

  const getPositionColor = (position: number) => {
    switch (position) {
      case 1:
        return 'bg-yellow-50 border-yellow-200';
      case 2:
        return 'bg-gray-50 border-gray-200';
      case 3:
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Trophy className='h-5 w-5' />
              Enhanced ELO Leaderboard
            </div>
            <div className='flex items-center gap-2'>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size='sm'
                onClick={() => setViewMode('table')}
              >
                Table
              </Button>
              <Button
                variant={viewMode === 'cards' ? 'default' : 'outline'}
                size='sm'
                onClick={() => setViewMode('cards')}
              >
                Cards
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters and Search */}
          <div className='flex flex-col md:flex-row gap-4 mb-6'>
            <div className='flex-1'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                <Input
                  placeholder='Search players or clubs...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='pl-10'
                />
              </div>
            </div>
            <div className='flex gap-2'>
              <Select value={rankFilter} onValueChange={setRankFilter}>
                <SelectTrigger className='w-32'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Ranks</SelectItem>
                  <SelectItem value='E+'>E+ (Chuyên nghiệp tiến bộ)</SelectItem>
                  <SelectItem value='E'>E (Chuyên nghiệp)</SelectItem>
                  <SelectItem value='F+'>F+ (Xuất sắc tiến bộ)</SelectItem>
                  <SelectItem value='F'>F (Xuất sắc)</SelectItem>
                  <SelectItem value='G+'>G+ (Giỏi tiến bộ)</SelectItem>
                  <SelectItem value='G'>G (Giỏi)</SelectItem>
                  <SelectItem value='H+'>H+ (Khá tiến bộ)</SelectItem>
                  <SelectItem value='H'>H (Khá)</SelectItem>
                  <SelectItem value='I+'>I+ (Trung bình tiến bộ)</SelectItem>
                  <SelectItem value='I'>I (Trung bình)</SelectItem>
                  <SelectItem value='K+'>K+ (Người mới tiến bộ)</SelectItem>
                  <SelectItem value='K'>K (Người mới)</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={sortBy}
                onValueChange={(value: any) => setSortBy(value)}
              >
                <SelectTrigger className='w-40'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='rating'>Rating</SelectItem>
                  <SelectItem value='matches'>Matches</SelectItem>
                  <SelectItem value='win_rate'>Win Rate</SelectItem>
                  <SelectItem value='streak'>Streak</SelectItem>
                  <SelectItem value='form'>Recent Form</SelectItem>
                  <SelectItem value='consistency'>Consistency</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant='outline'
                size='sm'
                onClick={() =>
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                }
              >
                {sortOrder === 'asc' ? (
                  <SortAsc className='h-4 w-4' />
                ) : (
                  <SortDesc className='h-4 w-4' />
                )}
              </Button>
            </div>
          </div>

          {/* Table View */}
          {viewMode === 'table' && (
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead>
                  <tr className='border-b'>
                    <th className='text-left p-3 font-medium'>Position</th>
                    <th className='text-left p-3 font-medium'>Player</th>
                    <th className='text-left p-3 font-medium'>Rank</th>
                    <th className='text-left p-3 font-medium'>Rating</th>
                    <th className='text-left p-3 font-medium'>Matches</th>
                    <th className='text-left p-3 font-medium'>Win Rate</th>
                    <th className='text-left p-3 font-medium'>Streak</th>
                    <th className='text-left p-3 font-medium'>Form</th>
                    <th className='text-left p-3 font-medium'>Consistency</th>
                    <th className='text-left p-3 font-medium'>Volatility</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlayers.map((player, index) => (
                    <tr
                      key={player.user_id}
                      className={`border-b hover:bg-gray-50 transition-colors ${getPositionColor(index + 1)}`}
                    >
                      <td className='p-3'>
                        <div className='flex items-center gap-2'>
                          {getPositionIcon(index + 1)}
                        </div>
                      </td>
                      <td className='p-3'>
                        <div className='flex items-center gap-3'>
                          <div className='w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center'>
                            {player.avatar_url ? (
                              <img
                                src={player.avatar_url}
                                alt={player.username}
                                className='w-8 h-8 rounded-full'
                              />
                            ) : (
                              <Users className='h-4 w-4 text-gray-500' />
                            )}
                          </div>
                          <div>
                            <div className='font-medium'>{player.username}</div>
                            {player.club_name && (
                              <div className='text-sm text-gray-500'>
                                {player.club_name}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className='p-3'>
                        <Badge className={getRankColor(player.current_rating)}>
                          {getRankName(player.current_rating)}
                        </Badge>
                      </td>
                      <td className='p-3 font-mono font-semibold'>
                        {player.current_rating}
                      </td>
                      <td className='p-3'>{player.matches_played}</td>
                      <td className='p-3'>
                        <div className='flex items-center gap-2'>
                          <span className='font-medium'>
                            {(player.win_rate || 0).toFixed(1)}%
                          </span>
                          <div className='w-16 bg-gray-200 rounded-full h-2'>
                            <div
                              className='bg-green-500 h-2 rounded-full'
                              style={{ width: `${player.win_rate || 0}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className='p-3'>
                        <div className='flex items-center gap-1'>
                          {player.current_streak > 0 ? (
                            <TrendingUp className='h-4 w-4 text-green-500' />
                          ) : player.current_streak < 0 ? (
                            <TrendingDown className='h-4 w-4 text-red-500' />
                          ) : (
                            <Activity className='h-4 w-4 text-gray-500' />
                          )}
                          <span
                            className={
                              player.current_streak > 0
                                ? 'text-green-600'
                                : player.current_streak < 0
                                  ? 'text-red-600'
                                  : 'text-gray-600'
                            }
                          >
                            {player.current_streak > 0 ? '+' : ''}
                            {player.current_streak}
                          </span>
                        </div>
                      </td>
                      <td className='p-3'>
                        <div className='flex items-center gap-1'>
                          {getFormIcon(player.recent_form || 0)}
                          <span
                            className={`font-medium ${
                              (player.recent_form || 0) > 50
                                ? 'text-green-600'
                                : (player.recent_form || 0) > 20
                                  ? 'text-blue-600'
                                  : (player.recent_form || 0) > -20
                                    ? 'text-yellow-600'
                                    : (player.recent_form || 0) > -50
                                      ? 'text-orange-600'
                                      : 'text-red-600'
                            }`}
                          >
                            {player.recent_form || 0}
                          </span>
                        </div>
                      </td>
                      <td className='p-3'>
                        <div className='flex items-center gap-1'>
                          {getConsistencyIcon(player.consistency_score || 50)}
                          <span
                            className={`font-medium ${
                              (player.consistency_score || 50) > 80
                                ? 'text-green-600'
                                : (player.consistency_score || 50) > 60
                                  ? 'text-blue-600'
                                  : (player.consistency_score || 50) > 40
                                    ? 'text-yellow-600'
                                    : 'text-red-600'
                            }`}
                          >
                            {player.consistency_score || 50}%
                          </span>
                        </div>
                      </td>
                      <td className='p-3'>
                        <div className='flex items-center gap-1'>
                          {getVolatilityIcon(player.rating_volatility || 0)}
                          <span
                            className={`font-medium ${
                              (player.rating_volatility || 0) < 30
                                ? 'text-green-600'
                                : (player.rating_volatility || 0) < 60
                                  ? 'text-blue-600'
                                  : (player.rating_volatility || 0) < 100
                                    ? 'text-yellow-600'
                                    : 'text-red-600'
                            }`}
                          >
                            {player.rating_volatility || 0}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Cards View */}
          {viewMode === 'cards' && (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              {filteredPlayers.map((player, index) => (
                <Card
                  key={player.user_id}
                  className={`${getPositionColor(index + 1)} hover:shadow-lg transition-shadow`}
                >
                  <CardContent className='p-4'>
                    <div className='flex items-center justify-between mb-3'>
                      <div className='flex items-center gap-2'>
                        {getPositionIcon(index + 1)}
                        <span className='text-sm font-medium text-gray-500'>
                          #{index + 1}
                        </span>
                      </div>
                      <Badge className={getRankColor(player.current_rating)}>
                        {getRankName(player.current_rating)}
                      </Badge>
                    </div>

                    <div className='flex items-center gap-3 mb-4'>
                      <div className='w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center'>
                        {player.avatar_url ? (
                          <img
                            src={player.avatar_url}
                            alt={player.username}
                            className='w-12 h-12 rounded-full'
                          />
                        ) : (
                          <Users className='h-6 w-6 text-gray-500' />
                        )}
                      </div>
                      <div>
                        <div className='font-semibold text-lg'>
                          {player.username}
                        </div>
                        {player.club_name && (
                          <div className='text-sm text-gray-500'>
                            {player.club_name}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className='space-y-2'>
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>Rating:</span>
                        <span className='font-mono font-semibold'>
                          {player.current_rating}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>Matches:</span>
                        <span>{player.matches_played}</span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>Win Rate:</span>
                        <span className='font-medium'>
                          {(player.win_rate || 0).toFixed(1)}%
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>Streak:</span>
                        <div className='flex items-center gap-1'>
                          {player.current_streak > 0 ? (
                            <TrendingUp className='h-3 w-3 text-green-500' />
                          ) : player.current_streak < 0 ? (
                            <TrendingDown className='h-3 w-3 text-red-500' />
                          ) : (
                            <Activity className='h-3 w-3 text-gray-500' />
                          )}
                          <span
                            className={
                              player.current_streak > 0
                                ? 'text-green-600'
                                : player.current_streak < 0
                                  ? 'text-red-600'
                                  : 'text-gray-600'
                            }
                          >
                            {player.current_streak > 0 ? '+' : ''}
                            {player.current_streak}
                          </span>
                        </div>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>Form:</span>
                        <div className='flex items-center gap-1'>
                          {getFormIcon(player.recent_form || 0)}
                          <span
                            className={`font-medium ${
                              (player.recent_form || 0) > 50
                                ? 'text-green-600'
                                : (player.recent_form || 0) > 20
                                  ? 'text-blue-600'
                                  : (player.recent_form || 0) > -20
                                    ? 'text-yellow-600'
                                    : (player.recent_form || 0) > -50
                                      ? 'text-orange-600'
                                      : 'text-red-600'
                            }`}
                          >
                            {player.recent_form || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* No Results */}
          {filteredPlayers.length === 0 && (
            <div className='text-center py-8'>
              <Users className='h-12 w-12 text-gray-400 mx-auto mb-4' />
              <h3 className='text-lg font-medium text-gray-900 mb-2'>
                No players found
              </h3>
              <p className='text-gray-500'>
                Try adjusting your search or filter criteria.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
