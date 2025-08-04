import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import { Switch } from '@/shared/components/ui/switch';
import { Separator } from '@/shared/components/ui/separator';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
// import { DatePickerWithRange } from '@/shared/components/ui/date-range-picker';
import { 
  FileText, 
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Download,
  Upload,
  Share,
  Calendar,
  Clock,
  Users,
  Trophy,
  DollarSign,
  Activity,
  Target,
  Bell,
  Settings,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Copy,
  RefreshCw,
  PlayCircle,
  Pause,
  Square,
  ChevronRight,
  ExternalLink,
  Archive,
  Star,
  Flag,
  Bookmark,
  Database,
  Zap,
  Globe,
  Layers,
  LineChart,
  AreaChart,
  Building,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Mail,
  Smartphone,
  MessageSquare
} from 'lucide-react';
import { AdminCoreProvider } from '@/features/admin/components/core/AdminCoreProvider';
import { AdminPageLayout } from '@/features/admin/components/shared/AdminPageLayout';
import { toast } from 'sonner';

interface Report {
  id: string;
  name: string;
  description: string;
  type: 'financial' | 'user' | 'tournament' | 'system' | 'analytics' | 'custom';
  category: 'operational' | 'business' | 'technical' | 'compliance';
  status: 'draft' | 'scheduled' | 'generating' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  format: 'pdf' | 'excel' | 'csv' | 'json' | 'html';
  parameters: {
    dateRange: { start: Date; end: Date };
    filters: Record<string, any>;
    groupBy: string[];
    metrics: string[];
  };
  schedule?: {
    enabled: boolean;
    time: string;
    timezone: string;
    nextRun?: Date;
    lastRun?: Date;
  };
  recipients: {
    emails: string[];
    notifications: boolean;
    shareUrl?: string;
  };
  data?: any;
  fileSize?: number;
  downloadUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  tags: string[];
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'financial' | 'user' | 'tournament' | 'system' | 'analytics' | 'custom';
  category: 'operational' | 'business' | 'technical' | 'compliance';
  defaultFormat: 'pdf' | 'excel' | 'csv' | 'json' | 'html';
  requiredParams: string[];
  optionalParams: string[];
  metrics: string[];
  visualizations: string[];
  isPublic: boolean;
  usage: number;
  rating: number;
  createdAt: Date;
  author: string;
}

interface ReportMetrics {
  totalReports: number;
  scheduledReports: number;
  completedToday: number;
  failedReports: number;
  averageGenerationTime: number;
  totalDownloads: number;
  diskUsage: number;
  popularFormats: Record<string, number>;
}

const AdminReportsNew = () => {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data
  const [reports, setReports] = useState<Report[]>([
    {
      id: 'report_001',
      name: 'Monthly Revenue Report',
      description: 'Comprehensive monthly revenue analysis including tournament fees, subscriptions, and transaction data.',
      type: 'financial',
      category: 'business',
      status: 'completed',
      priority: 'high',
      frequency: 'monthly',
      format: 'pdf',
      parameters: {
        dateRange: { 
          start: new Date('2025-07-01'), 
          end: new Date('2025-07-31') 
        },
        filters: { includeRefunds: true, currency: 'USD' },
        groupBy: ['date', 'source'],
        metrics: ['revenue', 'transactions', 'fees']
      },
      schedule: {
        enabled: true,
        time: '09:00',
        timezone: 'UTC',
        nextRun: new Date('2025-09-01T09:00:00'),
        lastRun: new Date('2025-08-01T09:00:00')
      },
      recipients: {
        emails: ['finance@company.com', 'admin@company.com'],
        notifications: true,
        shareUrl: 'https://reports.company.com/monthly-revenue-july-2025'
      },
      data: {
        totalRevenue: 45780.50,
        transactions: 1234,
        growth: 12.5
      },
      fileSize: 2.4, // MB
      downloadUrl: '/downloads/monthly-revenue-july-2025.pdf',
      createdAt: new Date('2025-07-25T10:00:00'),
      updatedAt: new Date('2025-08-01T09:15:00'),
      createdBy: 'Finance Manager',
      tags: ['revenue', 'monthly', 'financial', 'automated']
    },
    {
      id: 'report_002',
      name: 'User Activity Analytics',
      description: 'Daily active users, engagement metrics, and user behavior analysis for the past week.',
      type: 'analytics',
      category: 'operational',
      status: 'generating',
      priority: 'medium',
      frequency: 'weekly',
      format: 'excel',
      parameters: {
        dateRange: { 
          start: new Date('2025-07-27'), 
          end: new Date('2025-08-03') 
        },
        filters: { minSessionTime: 5, excludeBots: true },
        groupBy: ['date', 'userType'],
        metrics: ['dau', 'sessions', 'retention']
      },
      schedule: {
        enabled: true,
        time: '08:00',
        timezone: 'UTC',
        nextRun: new Date('2025-08-10T08:00:00'),
        lastRun: new Date('2025-08-03T08:00:00')
      },
      recipients: {
        emails: ['analytics@company.com', 'product@company.com'],
        notifications: true
      },
      createdAt: new Date('2025-08-03T08:00:00'),
      updatedAt: new Date('2025-08-03T08:00:00'),
      createdBy: 'Analytics Team',
      tags: ['users', 'analytics', 'weekly', 'engagement']
    },
    {
      id: 'report_003',
      name: 'Tournament Performance Summary',
      description: 'Analysis of tournament participation, completion rates, and prize distribution.',
      type: 'tournament',
      category: 'operational',
      status: 'completed',
      priority: 'medium',
      frequency: 'weekly',
      format: 'pdf',
      parameters: {
        dateRange: { 
          start: new Date('2025-07-27'), 
          end: new Date('2025-08-03') 
        },
        filters: { minParticipants: 4, status: 'completed' },
        groupBy: ['tournamentType', 'date'],
        metrics: ['participants', 'completionRate', 'prizePool']
      },
      recipients: {
        emails: ['tournaments@company.com'],
        notifications: false,
        shareUrl: 'https://reports.company.com/tournament-summary-week-31'
      },
      data: {
        totalTournaments: 45,
        totalParticipants: 890,
        completionRate: 87.2
      },
      fileSize: 1.8,
      downloadUrl: '/downloads/tournament-summary-week-31.pdf',
      createdAt: new Date('2025-08-03T12:00:00'),
      updatedAt: new Date('2025-08-03T12:30:00'),
      createdBy: 'Tournament Director',
      tags: ['tournament', 'weekly', 'performance', 'summary']
    },
    {
      id: 'report_004',
      name: 'System Health Check',
      description: 'Infrastructure monitoring report including server performance, database metrics, and error rates.',
      type: 'system',
      category: 'technical',
      status: 'failed',
      priority: 'high',
      frequency: 'daily',
      format: 'json',
      parameters: {
        dateRange: { 
          start: new Date('2025-08-02'), 
          end: new Date('2025-08-03') 
        },
        filters: { includeWarnings: true, severity: 'all' },
        groupBy: ['service', 'hour'],
        metrics: ['uptime', 'responseTime', 'errorRate']
      },
      schedule: {
        enabled: true,
        time: '06:00',
        timezone: 'UTC',
        nextRun: new Date('2025-08-04T06:00:00'),
        lastRun: new Date('2025-08-03T06:00:00')
      },
      recipients: {
        emails: ['devops@company.com', 'engineering@company.com'],
        notifications: true
      },
      createdAt: new Date('2025-08-03T06:00:00'),
      updatedAt: new Date('2025-08-03T06:05:00'),
      createdBy: 'System Monitor',
      tags: ['system', 'health', 'daily', 'monitoring']
    }
  ]);

  const [templates] = useState<ReportTemplate[]>([
    {
      id: 'template_001',
      name: 'Revenue Analysis',
      description: 'Complete financial revenue analysis with trends and forecasting',
      type: 'financial',
      category: 'business',
      defaultFormat: 'pdf',
      requiredParams: ['dateRange'],
      optionalParams: ['currency', 'includeRefunds', 'groupBy'],
      metrics: ['totalRevenue', 'transactions', 'averageValue', 'growth'],
      visualizations: ['lineChart', 'barChart', 'pieChart'],
      isPublic: true,
      usage: 89,
      rating: 4.8,
      createdAt: new Date('2025-06-01T00:00:00'),
      author: 'Finance Team'
    },
    {
      id: 'template_002',
      name: 'User Engagement Dashboard',
      description: 'User activity metrics and engagement analysis',
      type: 'analytics',
      category: 'operational',
      defaultFormat: 'excel',
      requiredParams: ['dateRange'],
      optionalParams: ['userSegment', 'platform', 'minSessionTime'],
      metrics: ['dau', 'mau', 'sessionDuration', 'retention'],
      visualizations: ['areaChart', 'heatmap', 'funnel'],
      isPublic: true,
      usage: 156,
      rating: 4.6,
      createdAt: new Date('2025-06-01T00:00:00'),
      author: 'Analytics Team'
    },
    {
      id: 'template_003',
      name: 'Tournament Statistics',
      description: 'Tournament participation and performance metrics',
      type: 'tournament',
      category: 'operational',
      defaultFormat: 'pdf',
      requiredParams: ['dateRange'],
      optionalParams: ['tournamentType', 'minParticipants', 'prizeRange'],
      metrics: ['tournaments', 'participants', 'completionRate', 'avgDuration'],
      visualizations: ['barChart', 'lineChart', 'donutChart'],
      isPublic: true,
      usage: 67,
      rating: 4.4,
      createdAt: new Date('2025-06-01T00:00:00'),
      author: 'Tournament Team'
    }
  ]);

  const [metrics] = useState<ReportMetrics>({
    totalReports: 127,
    scheduledReports: 23,
    completedToday: 8,
    failedReports: 2,
    averageGenerationTime: 45.6, // seconds
    totalDownloads: 1456,
    diskUsage: 2.8, // GB
    popularFormats: {
      pdf: 45,
      excel: 38,
      csv: 12,
      json: 5
    }
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'financial':
        return 'bg-green-100 text-green-800';
      case 'user':
        return 'bg-blue-100 text-blue-800';
      case 'tournament':
        return 'bg-purple-100 text-purple-800';
      case 'system':
        return 'bg-orange-100 text-orange-800';
      case 'analytics':
        return 'bg-pink-100 text-pink-800';
      case 'custom':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'operational':
        return 'bg-blue-100 text-blue-800';
      case 'business':
        return 'bg-green-100 text-green-800';
      case 'technical':
        return 'bg-orange-100 text-orange-800';
      case 'compliance':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'generating':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-gray-100 text-gray-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Edit className="h-4 w-4" />;
      case 'scheduled':
        return <Clock className="h-4 w-4" />;
      case 'generating':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
        return <XCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'financial':
        return <DollarSign className="h-4 w-4" />;
      case 'user':
        return <Users className="h-4 w-4" />;
      case 'tournament':
        return <Trophy className="h-4 w-4" />;
      case 'system':
        return <Database className="h-4 w-4" />;
      case 'analytics':
        return <BarChart3 className="h-4 w-4" />;
      case 'custom':
        return <Settings className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf':
        return <FileText className="h-4 w-4" />;
      case 'excel':
        return <BarChart3 className="h-4 w-4" />;
      case 'csv':
        return <Database className="h-4 w-4" />;
      case 'json':
        return <Layers className="h-4 w-4" />;
      case 'html':
        return <Globe className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatFileSize = (sizeMB: number) => {
    if (sizeMB < 1) {
      return `${(sizeMB * 1024).toFixed(0)} KB`;
    }
    return `${sizeMB.toFixed(1)} MB`;
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds.toFixed(1)}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  };

  const handleGenerateReport = (reportId: string) => {
    setReports(prev =>
      prev.map(report =>
        report.id === reportId
          ? { ...report, status: 'generating', updatedAt: new Date() }
          : report
      )
    );

    // Simulate report generation
    setTimeout(() => {
      setReports(prev =>
        prev.map(report =>
          report.id === reportId
            ? { 
                ...report, 
                status: 'completed', 
                updatedAt: new Date(),
                downloadUrl: `/downloads/${report.name.toLowerCase().replace(/\s+/g, '-')}.${report.format}`,
                fileSize: Math.random() * 5 + 0.5
              }
            : report
        )
      );
      toast.success('Report generated successfully!');
    }, 3000);

    toast.info('Report generation started...');
  };

  const handleDownloadReport = (report: Report) => {
    if (report.downloadUrl) {
      // Simulate download
      toast.success(`Downloading ${report.name}...`);
    } else {
      toast.error('Report file not available');
    }
  };

  const handleShareReport = (report: Report) => {
    if (report.recipients.shareUrl) {
      navigator.clipboard.writeText(report.recipients.shareUrl);
      toast.success('Share URL copied to clipboard!');
    } else {
      toast.error('Share URL not available');
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesType = filterType === 'all' || report.type === filterType;
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || report.category === filterCategory;
    const matchesSearch = report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesStatus && matchesCategory && matchesSearch;
  });

  const stats = [
    {
      title: 'Total Reports',
      value: metrics.totalReports.toString(),
      description: `${metrics.scheduledReports} scheduled`,
      icon: FileText,
      trend: { value: 12, isPositive: true }
    },
    {
      title: 'Generated Today',
      value: metrics.completedToday.toString(),
      description: `${metrics.failedReports} failed`,
      icon: TrendingUp,
      trend: { value: 8, isPositive: true }
    },
    {
      title: 'Avg Generation',
      value: formatDuration(metrics.averageGenerationTime),
      description: 'Processing time',
      icon: Clock,
      trend: { value: 15, isPositive: false }
    },
    {
      title: 'Total Downloads',
      value: metrics.totalDownloads.toLocaleString(),
      description: `${formatFileSize(metrics.diskUsage * 1024)} storage`,
      icon: Download,
      trend: { value: 23, isPositive: true }
    },
  ];

  const pageActions = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm">
        <Upload className="h-4 w-4 mr-2" />
        Import
      </Button>
      <Button variant="outline" size="sm">
        <Settings className="h-4 w-4 mr-2" />
        Settings
      </Button>
      <Button 
        onClick={() => setShowCreateModal(true)}
        size="sm"
      >
        <Plus className="h-4 w-4 mr-2" />
        New Report
      </Button>
    </div>
  );

  return (
    <AdminCoreProvider>
      <AdminPageLayout
        title="Reports Center"
        description="Generate, schedule, and manage comprehensive reports across all system areas"
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
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">{stat.description}</p>
                        {stat.trend && (
                          <div className={`flex items-center gap-1 text-xs ${
                            stat.trend.isPositive ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {stat.trend.isPositive ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {stat.trend.value}%
                          </div>
                        )}
                      </div>
                    </div>
                    <stat.icon className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="reports" className="space-y-6">
            <TabsList>
              <TabsTrigger value="reports">All Reports</TabsTrigger>
              <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* All Reports Tab */}
            <TabsContent value="reports" className="space-y-6">
              {/* Filters */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search reports..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="Filter by type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="financial">Financial</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="tournament">Tournament</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                        <SelectItem value="analytics">Analytics</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="generating">Generating</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="Filter by category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="operational">Operational</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                        <SelectItem value="technical">Technical</SelectItem>
                        <SelectItem value="compliance">Compliance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Reports List */}
                <div className="lg:col-span-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">
                      Reports ({filteredReports.length})
                    </h3>
                  </div>

                  <ScrollArea className="h-[600px]">
                    <div className="space-y-3">
                      {filteredReports.map((report) => (
                        <Card 
                          key={report.id} 
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            selectedReport?.id === report.id ? 'ring-2 ring-primary' : ''
                          }`}
                          onClick={() => setSelectedReport(report)}
                        >
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <div className="space-y-1 flex-1">
                                  <h4 className="font-medium line-clamp-1">{report.name}</h4>
                                  <p className="text-sm text-muted-foreground line-clamp-2">
                                    {report.description}
                                  </p>
                                </div>
                                <Badge className={getStatusColor(report.status)}>
                                  {getStatusIcon(report.status)}
                                  <span className="ml-1 capitalize">{report.status}</span>
                                </Badge>
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Badge className={getTypeColor(report.type)}>
                                    {getTypeIcon(report.type)}
                                    <span className="ml-1 capitalize">{report.type}</span>
                                  </Badge>
                                  <Badge className={getPriorityColor(report.priority)}>
                                    {report.priority}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-1">
                                  {getFormatIcon(report.format)}
                                  <span className="text-sm font-medium uppercase">{report.format}</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <span className="capitalize">{report.frequency}</span>
                                <span>
                                  {report.schedule?.lastRun 
                                    ? report.schedule.lastRun.toLocaleDateString()
                                    : report.updatedAt.toLocaleDateString()
                                  }
                                </span>
                              </div>

                              {report.fileSize && (
                                <div className="text-xs text-muted-foreground">
                                  Size: {formatFileSize(report.fileSize)}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                      {filteredReports.length === 0 && (
                        <div className="text-center py-8">
                          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-medium mb-2">No Reports Found</h3>
                          <p className="text-muted-foreground">
                            {searchQuery || filterType !== 'all' || filterStatus !== 'all' || filterCategory !== 'all'
                              ? 'No reports match your current filters.'
                              : 'Create your first report to get started.'
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>

                {/* Report Details */}
                <div className="lg:col-span-2">
                  {selectedReport ? (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            {getTypeIcon(selectedReport.type)}
                            {selectedReport.name}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            {selectedReport.status === 'completed' && selectedReport.downloadUrl && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleDownloadReport(selectedReport)}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </Button>
                            )}
                            {selectedReport.recipients.shareUrl && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleShareReport(selectedReport)}
                              >
                                <Share className="h-4 w-4 mr-2" />
                                Share
                              </Button>
                            )}
                            {(selectedReport.status === 'draft' || selectedReport.status === 'failed' || selectedReport.status === 'generating') && (
                              <Button 
                                size="sm"
                                onClick={() => handleGenerateReport(selectedReport.id)}
                                disabled={selectedReport.status === 'generating'}
                              >
                                {selectedReport.status === 'generating' ? (
                                  <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Generating
                                  </>
                                ) : (
                                  <>
                                    <PlayCircle className="h-4 w-4 mr-2" />
                                    Generate
                                  </>
                                )}
                              </Button>
                            )}
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Report Info */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <Label className="text-sm text-muted-foreground">Status</Label>
                            <div className="mt-1">
                              <Badge className={getStatusColor(selectedReport.status)}>
                                {getStatusIcon(selectedReport.status)}
                                <span className="ml-1 capitalize">{selectedReport.status}</span>
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Type</Label>
                            <div className="mt-1">
                              <Badge className={getTypeColor(selectedReport.type)}>
                                {getTypeIcon(selectedReport.type)}
                                <span className="ml-1 capitalize">{selectedReport.type}</span>
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Category</Label>
                            <div className="mt-1">
                              <Badge className={getCategoryColor(selectedReport.category)}>
                                {selectedReport.category}
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Format</Label>
                            <div className="mt-1 flex items-center gap-1">
                              {getFormatIcon(selectedReport.format)}
                              <span className="text-sm font-medium uppercase">{selectedReport.format}</span>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* Description */}
                        <div>
                          <Label className="text-sm text-muted-foreground">Description</Label>
                          <div className="mt-2 p-4 bg-muted rounded-lg">
                            <p className="text-sm whitespace-pre-wrap">
                              {selectedReport.description}
                            </p>
                          </div>
                        </div>

                        {/* Parameters */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <Label className="text-sm text-muted-foreground">Date Range</Label>
                            <div className="mt-2 text-sm">
                              {selectedReport.parameters.dateRange.start.toLocaleDateString()} - {selectedReport.parameters.dateRange.end.toLocaleDateString()}
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Frequency</Label>
                            <div className="mt-2 text-sm capitalize font-medium">
                              {selectedReport.frequency}
                            </div>
                          </div>
                        </div>

                        {/* Metrics */}
                        {selectedReport.parameters.metrics.length > 0 && (
                          <div>
                            <Label className="text-sm text-muted-foreground">Metrics</Label>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {selectedReport.parameters.metrics.map((metric, index) => (
                                <Badge key={index} variant="outline">
                                  {metric}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Schedule */}
                        {selectedReport.schedule?.enabled && (
                          <div>
                            <Label className="text-sm text-muted-foreground">Schedule</Label>
                            <div className="mt-2 p-3 bg-muted rounded-lg space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm">Time:</span>
                                <span className="text-sm font-medium">
                                  {selectedReport.schedule.time} ({selectedReport.schedule.timezone})
                                </span>
                              </div>
                              {selectedReport.schedule.nextRun && (
                                <div className="flex items-center justify-between">
                                  <span className="text-sm">Next Run:</span>
                                  <span className="text-sm font-medium">
                                    {selectedReport.schedule.nextRun.toLocaleString()}
                                  </span>
                                </div>
                              )}
                              {selectedReport.schedule.lastRun && (
                                <div className="flex items-center justify-between">
                                  <span className="text-sm">Last Run:</span>
                                  <span className="text-sm font-medium">
                                    {selectedReport.schedule.lastRun.toLocaleString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Recipients */}
                        {selectedReport.recipients.emails.length > 0 && (
                          <div>
                            <Label className="text-sm text-muted-foreground">Recipients</Label>
                            <div className="mt-2 space-y-2">
                              <div className="flex flex-wrap gap-2">
                                {selectedReport.recipients.emails.map((email, index) => (
                                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {email}
                                  </Badge>
                                ))}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Notifications: {selectedReport.recipients.notifications ? 'Enabled' : 'Disabled'}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Data Preview */}
                        {selectedReport.data && selectedReport.status === 'completed' && (
                          <div>
                            <Label className="text-sm text-muted-foreground">Report Summary</Label>
                            <div className="mt-2 p-4 bg-muted rounded-lg">
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {Object.entries(selectedReport.data).map(([key, value]) => (
                                  <div key={key} className="text-center">
                                    <div className="text-lg font-bold">
                                      {typeof value === 'number' ? 
                                        (key.includes('rate') || key.includes('growth') ? 
                                          `${value}%` : 
                                          key.includes('revenue') || key.includes('total') ? 
                                            `$${value.toLocaleString()}` : 
                                            value.toLocaleString()
                                        ) : 
                                        String(value)
                                      }
                                    </div>
                                    <div className="text-xs text-muted-foreground capitalize">
                                      {key.replace(/([A-Z])/g, ' $1').trim()}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* File Info */}
                        {selectedReport.fileSize && (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <Label className="text-sm text-muted-foreground">File Size</Label>
                              <div className="mt-1 font-medium">
                                {formatFileSize(selectedReport.fileSize)}
                              </div>
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Created</Label>
                              <div className="mt-1">
                                {selectedReport.createdAt.toLocaleDateString()}
                              </div>
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Created By</Label>
                              <div className="mt-1">
                                {selectedReport.createdBy}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Tags */}
                        {selectedReport.tags.length > 0 && (
                          <div>
                            <Label className="text-sm text-muted-foreground">Tags</Label>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {selectedReport.tags.map((tag, index) => (
                                <Badge key={index} variant="secondary">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">Select a Report</h3>
                        <p className="text-muted-foreground">
                          Choose a report to view details, download, or manage settings.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Scheduled Reports Tab */}
            <TabsContent value="scheduled" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reports.filter(r => r.schedule?.enabled).map((report) => (
                  <Card key={report.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg line-clamp-1">{report.name}</CardTitle>
                        <Badge className={getStatusColor(report.status)}>
                          {getStatusIcon(report.status)}
                          <span className="ml-1 capitalize">{report.status}</span>
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Badge className={getTypeColor(report.type)}>
                          {getTypeIcon(report.type)}
                          <span className="ml-1 capitalize">{report.type}</span>
                        </Badge>
                        <span className="text-sm font-medium capitalize">{report.frequency}</span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Next Run:</span>
                          <span className="font-medium">
                            {report.schedule?.nextRun?.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Last Run:</span>
                          <span>
                            {report.schedule?.lastRun?.toLocaleDateString() || 'Never'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Recipients:</span>
                          <span>{report.recipients.emails.length}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Templates Tab */}
            <TabsContent value="templates" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((template) => (
                  <Card key={template.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge className={getTypeColor(template.type)}>
                            {getTypeIcon(template.type)}
                            <span className="ml-1 capitalize">{template.type}</span>
                          </Badge>
                          {template.isPublic && (
                            <Badge variant="outline">Public</Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Format:</span>
                          <div className="flex items-center gap-1">
                            {getFormatIcon(template.defaultFormat)}
                            <span className="text-sm font-medium uppercase">{template.defaultFormat}</span>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Usage:</span>
                          <span className="text-sm">{template.usage} reports</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Rating:</span>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm">{template.rating}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm text-muted-foreground">Metrics</Label>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {template.metrics.slice(0, 3).map((metric, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {metric}
                            </Badge>
                          ))}
                          {template.metrics.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{template.metrics.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </Button>
                        <Button size="sm" className="flex-1">
                          <Plus className="h-4 w-4 mr-2" />
                          Use Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Other tabs placeholder */}
            <TabsContent value="analytics">
              <Card>
                <CardContent className="p-12 text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Report Analytics</h3>
                  <p className="text-muted-foreground">
                    Detailed analytics for report usage, performance, and trends.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardContent className="p-12 text-center">
                  <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Report Settings</h3>
                  <p className="text-muted-foreground">
                    Configure report generation settings, storage, and permissions.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </AdminPageLayout>
    </AdminCoreProvider>
  );
};

export default AdminReportsNew;
