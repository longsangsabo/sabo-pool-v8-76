import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminPageLayout } from '@/features/admin/components/shared/AdminPageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';
import { Switch } from '@/shared/components/ui/switch';
import { Progress } from '@/shared/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Trophy,
  DollarSign,
  Activity,
  Calendar,
  Target,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  MessageSquare,
  Star,
  ArrowUp,
  ArrowDown,
  Minus,
  RefreshCw,
  Download,
  Filter,
  Settings,
  Maximize2,
  MoreHorizontal,
  Plus,
  PieChart,
  LineChart,
  BarChart,
  Map,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  Heart,
  ThumbsUp,
  Share2,
  Bell,
  AlertCircle,
  Info,
  ChevronUp,
  ChevronDown,
  ExternalLink
} from 'lucide-react';

interface DashboardMetric {
  id: string;
  title: string;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  period: string;
  icon: React.ReactNode;
  color: string;
  trend: number[];
}

interface RecentActivity {
  id: string;
  type: 'user' | 'tournament' | 'payment' | 'system';
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error' | 'info';
  user?: string;
}

interface TopPerformer {
  id: string;
  name: string;
  metric: string;
  value: string;
  change: number;
  rank: number;
  avatar?: string;
}

interface SystemAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  resolved: boolean;
  action?: string;
}

interface ChartData {
  label: string;
  value: number;
  change?: number;
}

const AdminDashboardNew: React.FC = () => {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState('7d');
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const [metrics, setMetrics] = useState<DashboardMetric[]>([
    {
      id: '1',
      title: t('dashboard.total_users'),
      value: '24,567',
      change: 12.5,
      changeType: 'increase',
      period: t('dashboard.vs_last_week'),
      icon: <Users className="h-5 w-5" />,
      color: 'text-blue-600',
      trend: [100, 120, 140, 135, 155, 145, 165, 180, 190, 185, 200, 195, 210, 225]
    },
    {
      id: '2',
      title: t('dashboard.active_tournaments'),
      value: 156,
      change: 8.3,
      changeType: 'increase',
      period: t('dashboard.vs_last_week'),
      icon: <Trophy className="h-5 w-5" />,
      color: 'text-yellow-600',
      trend: [50, 55, 48, 62, 58, 65, 70, 68, 75, 72, 78, 80, 85, 90]
    },
    {
      id: '3',
      title: t('dashboard.revenue'),
      value: '$48,392',
      change: 15.7,
      changeType: 'increase',
      period: t('dashboard.vs_last_week'),
      icon: <DollarSign className="h-5 w-5" />,
      color: 'text-green-600',
      trend: [1000, 1200, 1100, 1400, 1300, 1500, 1600, 1550, 1700, 1650, 1800, 1750, 1900, 2000]
    },
    {
      id: '4',
      title: t('dashboard.performance'),
      value: '99.98%',
      change: 0.02,
      changeType: 'increase',
      period: t('dashboard.vs_last_month'),
      icon: <Activity className="h-5 w-5" />,
      color: 'text-emerald-600',
      trend: [99.95, 99.96, 99.97, 99.98, 99.99, 99.98, 99.97, 99.98, 99.99, 99.98, 99.97, 99.98, 99.99, 99.98]
    },
    {
      id: '5',
      title: t('dashboard.daily_active_users'),
      value: '12,834',
      change: -3.2,
      changeType: 'decrease',
      period: t('dashboard.vs_yesterday'),
      icon: <Eye className="h-5 w-5" />,
      color: 'text-orange-600',
      trend: [800, 850, 820, 880, 860, 900, 920, 910, 950, 940, 980, 970, 1000, 950]
    },
    {
      id: '6',
      title: t('dashboard.avg_session_time'),
      value: '3.45%',
      change: 2.1,
      changeType: 'increase',
      period: t('dashboard.vs_last_week'),
      icon: <Target className="h-5 w-5" />,
      color: 'text-purple-600',
      trend: [2.1, 2.3, 2.2, 2.5, 2.4, 2.7, 2.8, 2.9, 3.0, 2.9, 3.2, 3.1, 3.4, 3.5]
    }
  ]);

  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([
    {
      id: '1',
      type: 'tournament',
      title: 'Summer Championship Created',
      description: 'New tournament with 128 player capacity',
      timestamp: '2 minutes ago',
      status: 'success',
      user: 'admin@sabo.vn'
    },
    {
      id: '2',
      type: 'user',
      title: 'Mass User Registration',
      description: '45 new users registered in the last hour',
      timestamp: '15 minutes ago',
      status: 'info'
    },
    {
      id: '3',
      type: 'payment',
      title: 'Payment Processing Issue',
      description: 'VNPay gateway timeout resolved',
      timestamp: '32 minutes ago',
      status: 'warning',
      user: 'system'
    },
    {
      id: '4',
      type: 'system',
      title: 'Database Backup Completed',
      description: 'Automated daily backup successful',
      timestamp: '1 hour ago',
      status: 'success',
      user: 'system'
    },
    {
      id: '5',
      type: 'tournament',
      title: 'Tournament Bracket Generated',
      description: 'Bracket for "Pro League Season 8" generated',
      timestamp: '2 hours ago',
      status: 'success',
      user: 'tournament-admin'
    }
  ]);

  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([
    { id: '1', name: 'PlayerPro2024', metric: 'Tournament Wins', value: '23', change: 15.2, rank: 1 },
    { id: '2', name: 'PoolMaster', metric: 'ELO Rating', value: '2,456', change: 8.7, rank: 2 },
    { id: '3', name: 'ChampionShot', metric: 'Revenue Generated', value: '$2,340', change: 22.1, rank: 3 },
    { id: '4', name: 'CueKing', metric: 'Games Played', value: '189', change: 12.5, rank: 4 },
    { id: '5', name: 'BilliardBoss', metric: 'Win Rate', value: '87.3%', change: 5.8, rank: 5 }
  ]);

  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([
    {
      id: '1',
      type: 'warning',
      title: 'High Memory Usage',
      message: 'Server memory usage has reached 85%. Consider scaling resources.',
      timestamp: '5 minutes ago',
      resolved: false,
      action: 'Scale Resources'
    },
    {
      id: '2',
      type: 'info',
      title: 'Scheduled Maintenance',
      message: 'Database maintenance scheduled for tonight at 2:00 AM.',
      timestamp: '2 hours ago',
      resolved: false,
      action: 'View Schedule'
    },
    {
      id: '3',
      type: 'critical',
      title: 'Payment Gateway Alert',
      message: 'VNPay API response time increased by 200%.',
      timestamp: '3 hours ago',
      resolved: true,
      action: 'View Details'
    }
  ]);

  const revenueData: ChartData[] = [
    { label: 'Jan', value: 35000, change: 12 },
    { label: 'Feb', value: 42000, change: 8 },
    { label: 'Mar', value: 38000, change: -5 },
    { label: 'Apr', value: 45000, change: 15 },
    { label: 'May', value: 48000, change: 7 },
    { label: 'Jun', value: 52000, change: 8 },
    { label: 'Jul', value: 48000, change: -8 }
  ];

  const userGrowthData: ChartData[] = [
    { label: 'Week 1', value: 1200 },
    { label: 'Week 2', value: 1450 },
    { label: 'Week 3', value: 1380 },
    { label: 'Week 4', value: 1620 },
    { label: 'Week 5', value: 1580 },
    { label: 'Week 6', value: 1750 },
    { label: 'Week 7', value: 1890 }
  ];

  const deviceData: ChartData[] = [
    { label: 'Desktop', value: 45.2 },
    { label: 'Mobile', value: 38.7 },
    { label: 'Tablet', value: 16.1 }
  ];

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'increase': return <ArrowUp className="h-3 w-3 text-green-600" />;
      case 'decrease': return <ArrowDown className="h-3 w-3 text-red-600" />;
      default: return <Minus className="h-3 w-3 text-gray-600" />;
    }
  };

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'increase': return 'text-green-600';
      case 'decrease': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user': return <Users className="h-4 w-4" />;
      case 'tournament': return <Trophy className="h-4 w-4" />;
      case 'payment': return <DollarSign className="h-4 w-4" />;
      case 'system': return <Activity className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getActivityColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'error': return 'text-red-600 bg-red-50';
      case 'info': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'info': return <Info className="h-4 w-4 text-blue-600" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getAlertBgColor = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'info': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const resolveAlert = (alertId: string) => {
    setSystemAlerts(alerts => 
      alerts.map(alert => 
        alert.id === alertId ? { ...alert, resolved: true } : alert
      )
    );
  };

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        // Simulate real-time data updates
        setMetrics(currentMetrics => 
          currentMetrics.map(metric => ({
            ...metric,
            value: typeof metric.value === 'string' 
              ? metric.value 
              : Math.floor(metric.value + (Math.random() - 0.5) * 100)
          }))
        );
      }, refreshInterval * 1000);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  return (
    <AdminPageLayout
      title={t('dashboard.title')}
      description={t('dashboard.overview')}
    >
      <div className="space-y-6">
        {/* Dashboard Controls */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1d">{t('dashboard.time_range.1d')}</SelectItem>
                    <SelectItem value="7d">{t('dashboard.time_range.7d')}</SelectItem>
                    <SelectItem value="30d">{t('dashboard.time_range.30d')}</SelectItem>
                    <SelectItem value="90d">{t('dashboard.time_range.90d')}</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={autoRefresh}
                    onCheckedChange={setAutoRefresh}
                  />
                  <Label>{t('dashboard.auto_refresh')}</Label>
                </div>
                <Select value={refreshInterval.toString()} onValueChange={(value) => setRefreshInterval(parseInt(value))}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10s</SelectItem>
                    <SelectItem value="30">30s</SelectItem>
                    <SelectItem value="60">1m</SelectItem>
                    <SelectItem value="300">5m</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  {t('common.export')}
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  {t('dashboard.customize')}
                </Button>
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {metrics.map((metric) => (
            <Card key={metric.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg bg-gray-50 ${metric.color}`}>
                    {metric.icon}
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-4 space-y-2">
                  <h3 className="text-2xl font-bold">{metric.value}</h3>
                  <p className="text-sm text-gray-600">{metric.title}</p>
                  <div className="flex items-center gap-1">
                    {getChangeIcon(metric.changeType)}
                    <span className={`text-sm font-medium ${getChangeColor(metric.changeType)}`}>
                      {Math.abs(metric.change)}%
                    </span>
                    <span className="text-xs text-gray-500">{metric.period}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Charts Section */}
          <div className="xl:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  {t('dashboard.revenue_analytics')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center space-y-2">
                    <TrendingUp className="h-12 w-12 text-gray-400 mx-auto" />
                    <p className="text-gray-500">Revenue chart would be rendered here</p>
                    <p className="text-sm text-gray-400">Integration with chart library needed</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  {t('dashboard.user_growth_trend')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center space-y-2">
                    <Users className="h-12 w-12 text-gray-400 mx-auto" />
                    <p className="text-gray-500">User growth chart would be rendered here</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Panels */}
          <div className="space-y-6">
            {/* System Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    {t('dashboard.system_alerts')}
                  </div>
                  <Badge variant="secondary">{systemAlerts.filter(a => !a.resolved).length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {systemAlerts.slice(0, 3).map((alert) => (
                  <div key={alert.id} className={`p-3 rounded-lg border ${getAlertBgColor(alert.type)}`}>
                    <div className="flex items-start gap-3">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1 space-y-1">
                        <h4 className="font-medium text-sm">{alert.title}</h4>
                        <p className="text-xs text-gray-600">{alert.message}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">{alert.timestamp}</span>
                          {!alert.resolved && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => resolveAlert(alert.id)}
                              className="h-6 text-xs"
                            >
                              Resolve
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full" size="sm">
                  {t('dashboard.view_all_alerts')}
                </Button>
              </CardContent>
            </Card>

            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  {t('dashboard.top_performers')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topPerformers.map((performer) => (
                  <div key={performer.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">
                        {performer.rank}
                      </Badge>
                      <div>
                        <p className="font-medium text-sm">{performer.name}</p>
                        <p className="text-xs text-gray-500">{performer.metric}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">{performer.value}</p>
                      <div className="flex items-center gap-1">
                        <ArrowUp className="h-3 w-3 text-green-600" />
                        <span className="text-xs text-green-600">{performer.change}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {t('dashboard.recent_activity')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-lg">
                  <div className={`p-2 rounded-lg ${getActivityColor(activity.status)}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{activity.title}</h4>
                      <span className="text-sm text-gray-500">{activity.timestamp}</span>
                    </div>
                    <p className="text-sm text-gray-600">{activity.description}</p>
                    {activity.user && (
                      <p className="text-xs text-gray-500">by {activity.user}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Additional Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                {t('dashboard.device_usage')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {deviceData.map((device) => (
                  <div key={device.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {device.label === 'Desktop' && <Monitor className="h-4 w-4" />}
                      {device.label === 'Mobile' && <Smartphone className="h-4 w-4" />}
                      {device.label === 'Tablet' && <Tablet className="h-4 w-4" />}
                      <span className="text-sm">{device.label}</span>
                    </div>
                    <span className="font-medium">{device.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                {t('dashboard.geographic_data')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Vietnam</span>
                  <span className="font-medium">65.2%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Thailand</span>
                  <span className="font-medium">18.7%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Singapore</span>
                  <span className="font-medium">12.1%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Others</span>
                  <span className="font-medium">4.0%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                {t('dashboard.user_satisfaction')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">4.8/5</div>
                <p className="text-sm text-gray-500">Average Rating</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Positive Reviews</span>
                  <span>89%</span>
                </div>
                <Progress value={89} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                {t('dashboard.conversion_funnel')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Visitors</span>
                  <span>10,234</span>
                </div>
                <Progress value={100} className="h-1" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Signups</span>
                  <span>2,456</span>
                </div>
                <Progress value={24} className="h-1" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Active Users</span>
                  <span>1,834</span>
                </div>
                <Progress value={18} className="h-1" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Paying Users</span>
                  <span>456</span>
                </div>
                <Progress value={4.5} className="h-1" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminPageLayout>
  );
};

export default AdminDashboardNew;
