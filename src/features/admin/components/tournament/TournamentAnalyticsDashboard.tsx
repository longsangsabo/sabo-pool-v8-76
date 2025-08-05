import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
  TrendingUp,
  Users,
  Trophy,
  DollarSign,
  Calendar,
  Target,
  Award,
  BarChart3,
  PieChart,
  Download,
} from 'lucide-react';
import { AdminTournament } from '@/hooks/admin/useAdminData';

interface TournamentAnalyticsDashboardProps {
  tournament: AdminTournament;
  onClose: () => void;
}

interface TournamentStats {
  totalParticipants: number;
  confirmedParticipants: number;
  totalPrizePool: number;
  averageElo: number;
  registrationProgress: number;
  popularTimeSlots: string[];
  participantsByRank: { rank: string; count: number }[];
  revenueBreakdown: { source: string; amount: number }[];
  historicalComparison: {
    metric: string;
    current: number;
    previous: number;
    change: number;
  }[];
}

const TournamentAnalyticsDashboard: React.FC<
  TournamentAnalyticsDashboardProps
> = ({ tournament, onClose }) => {
  // Mock analytics data - would come from API in real app
  const stats: TournamentStats = {
    totalParticipants: 128,
    confirmedParticipants: 95,
    totalPrizePool: 50000000,
    averageElo: 1650,
    registrationProgress: 74,
    popularTimeSlots: ['19:00-21:00', '14:00-16:00', '21:00-23:00'],
    participantsByRank: [
      { rank: 'Beginner', count: 35 },
      { rank: 'Intermediate', count: 42 },
      { rank: 'Advanced', count: 18 },
      { rank: 'Expert', count: 5 },
    ],
    revenueBreakdown: [
      { source: 'Entry Fees', amount: 38000000 },
      { source: 'Sponsorship', amount: 12000000 },
      { source: 'Merchandise', amount: 3500000 },
    ],
    historicalComparison: [
      { metric: 'Participants', current: 128, previous: 95, change: 34.7 },
      {
        metric: 'Prize Pool',
        current: 50000000,
        previous: 35000000,
        change: 42.9,
      },
      { metric: 'Average ELO', current: 1650, previous: 1580, change: 4.4 },
    ],
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold'>Tournament Analytics</h2>
          <p className='text-muted-foreground'>{tournament.name}</p>
        </div>
        <div className='flex items-center gap-2'>
          <Button variant='outline' size='sm'>
            <Download className='h-4 w-4 mr-2' />
            Export Report
          </Button>
          <Button variant='outline' onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-muted-foreground'>
                  Total Participants
                </p>
                <p className='text-2xl font-bold'>
                  {formatNumber(stats.totalParticipants)}
                </p>
                <p className='text-xs text-green-600'>
                  +{((stats.totalParticipants / 95 - 1) * 100).toFixed(1)}% vs
                  last tournament
                </p>
              </div>
              <Users className='h-8 w-8 text-blue-500' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-muted-foreground'>Prize Pool</p>
                <p className='text-2xl font-bold'>
                  {formatCurrency(stats.totalPrizePool)}
                </p>
                <p className='text-xs text-green-600'>
                  +{((stats.totalPrizePool / 35000000 - 1) * 100).toFixed(1)}%
                  vs last tournament
                </p>
              </div>
              <Trophy className='h-8 w-8 text-yellow-500' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-muted-foreground'>Average ELO</p>
                <p className='text-2xl font-bold'>
                  {formatNumber(stats.averageElo)}
                </p>
                <p className='text-xs text-green-600'>
                  +{((stats.averageElo / 1580 - 1) * 100).toFixed(1)}% vs last
                  tournament
                </p>
              </div>
              <Target className='h-8 w-8 text-purple-500' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-muted-foreground'>
                  Registration Progress
                </p>
                <p className='text-2xl font-bold'>
                  {stats.registrationProgress}%
                </p>
                <p className='text-xs text-muted-foreground'>
                  {stats.confirmedParticipants}/{stats.totalParticipants}{' '}
                  confirmed
                </p>
              </div>
              <Calendar className='h-8 w-8 text-green-500' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Participants by Rank */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <PieChart className='h-5 w-5' />
              Participants by Rank
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {stats.participantsByRank.map((item, index) => (
                <div key={index} className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div
                      className='w-3 h-3 rounded-full'
                      style={{
                        backgroundColor: [
                          '#3b82f6',
                          '#10b981',
                          '#f59e0b',
                          '#ef4444',
                        ][index],
                      }}
                    />
                    <span className='font-medium'>{item.rank}</span>
                  </div>
                  <div className='text-right'>
                    <div className='font-bold'>{item.count}</div>
                    <div className='text-xs text-muted-foreground'>
                      {((item.count / stats.totalParticipants) * 100).toFixed(
                        1
                      )}
                      %
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Revenue Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <DollarSign className='h-5 w-5' />
              Revenue Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {stats.revenueBreakdown.map((item, index) => (
                <div key={index} className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div
                      className='w-3 h-3 rounded-full'
                      style={{
                        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'][
                          index
                        ],
                      }}
                    />
                    <span className='font-medium'>{item.source}</span>
                  </div>
                  <div className='text-right'>
                    <div className='font-bold'>
                      {formatCurrency(item.amount)}
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      {((item.amount / stats.totalPrizePool) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Historical Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <BarChart3 className='h-5 w-5' />
            Historical Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            {stats.historicalComparison.map((item, index) => (
              <div key={index} className='p-4 border rounded-lg'>
                <div className='text-sm text-muted-foreground mb-1'>
                  {item.metric}
                </div>
                <div className='flex items-center justify-between mb-2'>
                  <div className='text-lg font-bold'>
                    {item.metric === 'Prize Pool'
                      ? formatCurrency(item.current)
                      : formatNumber(item.current)}
                  </div>
                  <Badge variant={item.change > 0 ? 'default' : 'secondary'}>
                    <TrendingUp className='h-3 w-3 mr-1' />+
                    {item.change.toFixed(1)}%
                  </Badge>
                </div>
                <div className='text-xs text-muted-foreground'>
                  Previous:{' '}
                  {item.metric === 'Prize Pool'
                    ? formatCurrency(item.previous)
                    : formatNumber(item.previous)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Popular Time Slots */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Award className='h-5 w-5' />
            Popular Time Slots
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-wrap gap-2'>
            {stats.popularTimeSlots.map((timeSlot, index) => (
              <Badge key={index} variant='outline' className='px-3 py-1'>
                {timeSlot}
              </Badge>
            ))}
          </div>
          <p className='text-sm text-muted-foreground mt-4'>
            Most popular registration times based on participant preferences
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TournamentAnalyticsDashboard;
