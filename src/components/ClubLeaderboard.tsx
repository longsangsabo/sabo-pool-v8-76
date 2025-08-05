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
  Users,
  Search,
  Filter,
  SortAsc,
  SortDesc,
} from 'lucide-react';

interface ClubPlayer {
  id: string;
  username: string;
  current_rating: number;
  matches_played: number;
  wins: number;
  losses: number;
  win_rate: number;
  current_streak: number;
  rank: string;
  avatar_url?: string;
  club_contribution_points?: number;
  recent_form?: number;
  last_active?: Date;
}

interface ClubLeaderboardProps {
  clubId: string;
  players: ClubPlayer[];
  className?: string;
}

export const ClubLeaderboard: React.FC<ClubLeaderboardProps> = ({
  clubId,
  players,
  className,
}) => {
  const [filteredPlayers, setFilteredPlayers] = useState<ClubPlayer[]>(players);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<
    'rating' | 'matches' | 'win_rate' | 'streak' | 'contribution' | 'form'
  >('rating');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [rankFilter, setRankFilter] = useState<string>('all');

  useEffect(() => {
    let filtered = [...players];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(player =>
        player.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Rank filter
    if (rankFilter !== 'all') {
      filtered = filtered.filter(player => player.rank === rankFilter);
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
          aValue = a.win_rate;
          bValue = b.win_rate;
          break;
        case 'streak':
          aValue = a.current_streak;
          bValue = b.current_streak;
          break;
        case 'contribution':
          aValue = a.club_contribution_points || 0;
          bValue = b.club_contribution_points || 0;
          break;
        case 'form':
          aValue = a.recent_form || 0;
          bValue = b.recent_form || 0;
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

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'E+':
      case 'E':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'F+':
      case 'F':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'G+':
      case 'G':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'H+':
      case 'H':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'I+':
      case 'I':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'K+':
      case 'K':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className='h-5 w-5 text-yellow-500' />;
      case 2:
        return <Crown className='h-5 w-5 text-gray-400' />;
      case 3:
        return <Star className='h-5 w-5 text-orange-500' />;
      default:
        return (
          <span className='text-sm font-medium text-gray-500'>#{position}</span>
        );
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Shield className='h-5 w-5' />
              Club Leaderboard
            </div>
            <Badge variant='outline'>{filteredPlayers.length} Members</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters and Search */}
          <div className='flex flex-col md:flex-row gap-4 mb-6'>
            <div className='flex-1'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                <Input
                  placeholder='Search players...'
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
                  <SelectItem value='E+'>E+</SelectItem>
                  <SelectItem value='E'>E</SelectItem>
                  <SelectItem value='F+'>F+</SelectItem>
                  <SelectItem value='F'>F</SelectItem>
                  <SelectItem value='G+'>G+</SelectItem>
                  <SelectItem value='G'>G</SelectItem>
                  <SelectItem value='H+'>H+</SelectItem>
                  <SelectItem value='H'>H</SelectItem>
                  <SelectItem value='I+'>I+</SelectItem>
                  <SelectItem value='I'>I</SelectItem>
                  <SelectItem value='K+'>K+</SelectItem>
                  <SelectItem value='K'>K</SelectItem>
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
                  <SelectItem value='contribution'>Contribution</SelectItem>
                  <SelectItem value='form'>Recent Form</SelectItem>
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

          {/* Table */}
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
                  <th className='text-left p-3 font-medium'>Contribution</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlayers.map((player, index) => (
                  <tr
                    key={player.id}
                    className='border-b hover:bg-gray-50 transition-colors'
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
                        </div>
                      </div>
                    </td>
                    <td className='p-3'>
                      <Badge className={getRankColor(player.rank)}>
                        {player.rank}
                      </Badge>
                    </td>
                    <td className='p-3 font-mono font-semibold'>
                      {player.current_rating}
                    </td>
                    <td className='p-3'>{player.matches_played}</td>
                    <td className='p-3'>
                      <div className='flex items-center gap-2'>
                        <span className='font-medium'>
                          {player.win_rate.toFixed(1)}%
                        </span>
                        <div className='w-16 bg-gray-200 rounded-full h-2'>
                          <div
                            className='bg-green-500 h-2 rounded-full'
                            style={{ width: `${player.win_rate}%` }}
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
                        ) : null}
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
                      <span className='font-medium text-blue-600'>
                        {player.club_contribution_points || 0}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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

export default ClubLeaderboard;
