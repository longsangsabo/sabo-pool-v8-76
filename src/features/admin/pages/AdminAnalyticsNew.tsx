import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  Users, 
  Trophy, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  Eye,
  Target,
  Zap
} from 'lucide-react';
import { AdminCoreProvider } from '@/components/admin/core/AdminCoreProvider';
import { AdminPageLayout } from '@/components/admin/shared/AdminPageLayout';

interface MetricCard {
  title: string;
  value: string | number;
  change: number;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<any>;
  description: string;
}

interface ChartData {
  name: string;
  value: number;
  change?: number;
}

const AdminAnalyticsNew = () => {
  const { t } = useTranslation();
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [refreshing, setRefreshing] = useState(false);

  // Mock analytics data - would come from API
  const overviewMetrics: MetricCard[] = [
    {
      title: 'Total Users',
      value: '12,547',
      change: 12.5,
      changeType: 'positive',
      icon: Users,
      description: '+1,394 new users this month'
    },
    {
      title: 'Active Tournaments',
      value: '23',
      change: 8.2,
      changeType: 'positive',
      icon: Trophy,
      description: '5 tournaments starting this week'
    },
    {
      title: 'Revenue',
      value: '₫127.5M',
      change: -3.1,
      changeType: 'negative',
      icon: DollarSign,
      description: 'Monthly recurring revenue'
    },
    {
      title: 'Engagement Rate',
      value: '78.4%',
      change: 5.7,
      changeType: 'positive',
      icon: Activity,
      description: 'Daily active users'
    }
  ];

  const userGrowthData: ChartData[] = [
    { name: 'Jan', value: 8500 },
    { name: 'Feb', value: 9200 },
    { name: 'Mar', value: 9800 },
    { name: 'Apr', value: 10500 },
    { name: 'May', value: 11200 },
    { name: 'Jun', value: 12547 }
  ];

  const tournamentData: ChartData[] = [
    { name: 'Completed', value: 156, change: 12 },
    { name: 'Active', value: 23, change: 3 },
    { name: 'Upcoming', value: 47, change: 8 },
    { name: 'Cancelled', value: 12, change: -2 }
  ];

  const revenueBreakdown = [
    { source: 'Tournament Entries', amount: 45600000, percentage: 35.8 },
    { source: 'Premium Subscriptions', amount: 38200000, percentage: 30.0 },
    { source: 'Club Memberships', amount: 28400000, percentage: 22.3 },
    { source: 'Equipment Sales', amount: 15300000, percentage: 11.9 }
  ];

  const topPerformingClubs = [
    { name: 'Sabo Pool Center', revenue: 12500000, members: 234, tournaments: 15 },
    { name: 'Vietnam Billiards', revenue: 9800000, members: 189, tournaments: 12 },
    { name: 'Golden Cue Club', revenue: 8200000, members: 156, tournaments: 10 },
    { name: 'Elite Pool Arena', revenue: 7100000, members: 143, tournaments: 8 },
    { name: 'Master Break Club', revenue: 6400000, members: 128, tournaments: 7 }
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const getChangeIcon = (changeType: MetricCard['changeType']) => {
    switch (changeType) {
      case 'positive':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'negative':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getChangeColor = (changeType: MetricCard['changeType']) => {
    switch (changeType) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const stats = [
    {
      title: 'Total Revenue',
      value: '₫127.5M',
      description: 'This month',
      icon: DollarSign,
    },
    {
      title: 'Active Users',
      value: '9,847',
      description: 'Daily average',
      icon: Users,
    },
    {
      title: 'Tournaments',
      value: '23',
      description: 'Currently active',
      icon: Trophy,
    },
    {
      title: 'Growth Rate',
      value: '+12.5%',
      description: 'Month over month',
      icon: TrendingUp,
    },
  ];

  const pageActions = (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {['7d', '30d', '90d', '1y'].map((period) => (
          <Button
            key={period}
            variant={selectedPeriod === period ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod(period as any)}
          >
            {period}
          </Button>
        ))}
      </div>
      <Button variant="outline" size="sm">
        <Filter className="h-4 w-4 mr-2" />
        Filter
      </Button>
      <Button 
        variant="outline" 
        size="sm"
        onClick={handleRefresh}
        disabled={refreshing}
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
        {refreshing ? 'Refreshing...' : 'Refresh'}
      </Button>
      <Button size="sm">
        <Download className="h-4 w-4 mr-2" />
        Export
      </Button>
    </div>
  );

  return (
    <AdminCoreProvider>
      <AdminPageLayout
        title={t('analytics.title')}
        description={t('analytics.description')}
        actions={pageActions}
      >
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.description}</p>
                    </div>
                    <stat.icon className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {/* Overview Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {overviewMetrics.map((metric, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">{metric.title}</p>
                      <p className="text-2xl font-bold">{metric.value}</p>
                      <div className={`flex items-center gap-1 text-sm ${getChangeColor(metric.changeType)}`}>
                        {getChangeIcon(metric.changeType)}
                        <span>{Math.abs(metric.change)}%</span>
                      </div>
                    </div>
                    <metric.icon className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">{metric.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Detailed Analytics Tabs */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="clubs">Clubs</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Growth Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      User Growth Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {userGrowthData.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{item.name}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${(item.value / 12547) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-bold">{formatNumber(item.value)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Tournament Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5" />
                      Tournament Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {tournamentData.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              ['bg-green-500', 'bg-blue-500', 'bg-yellow-500', 'bg-red-500'][index]
                            }`} />
                            <span className="font-medium">{item.name}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{item.value}</div>
                            {item.change && (
                              <div className={`text-xs ${item.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {item.change > 0 ? '+' : ''}{item.change}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="revenue" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Revenue Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {revenueBreakdown.map((item, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{item.source}</span>
                            <span className="text-sm font-bold">{formatCurrency(item.amount)}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                          <div className="text-xs text-muted-foreground">{item.percentage}% of total</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Revenue Goals
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Monthly Target</span>
                          <span className="text-sm font-bold">₫150M</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div className="bg-green-500 h-3 rounded-full" style={{ width: '85%' }} />
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">85% achieved</div>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Quarterly Target</span>
                          <span className="text-sm font-bold">₫450M</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div className="bg-blue-500 h-3 rounded-full" style={{ width: '78%' }} />
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">78% achieved</div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Annual Target</span>
                          <span className="text-sm font-bold">₫1.8B</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div className="bg-purple-500 h-3 rounded-full" style={{ width: '42%' }} />
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">42% achieved</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="clubs" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Top Performing Clubs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topPerformingClubs.map((club, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{club.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {club.members} members • {club.tournaments} tournaments
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">{formatCurrency(club.revenue)}</div>
                          <div className="text-xs text-muted-foreground">Monthly revenue</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </AdminPageLayout>
    </AdminCoreProvider>
  );
};

export default AdminAnalyticsNew;
