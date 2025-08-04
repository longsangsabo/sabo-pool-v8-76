import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
import { 
  Bell, 
  Send,
  Users,
  User,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Settings,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Copy,
  Download,
  Upload,
  Calendar,
  MessageSquare,
  Mail,
  Smartphone,
  Globe,
  Target,
  Activity,
  TrendingUp,
  BarChart3,
  Zap,
  Layers,
  RefreshCw,
  Play,
  Pause,
  Square,
  ChevronRight,
  ExternalLink,
  Archive,
  Star,
  Flag,
  Bookmark
} from 'lucide-react';
import { AdminCoreProvider } from '@/features/admin/components/core/AdminCoreProvider';
import { AdminPageLayout } from '@/features/admin/components/shared/AdminPageLayout';
import { toast } from 'sonner';

interface Notification {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'announcement';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'draft' | 'scheduled' | 'sent' | 'failed' | 'cancelled';
  recipients: {
    type: 'all' | 'specific' | 'role' | 'segment';
    count: number;
    targets?: string[];
  };
  channels: ('push' | 'email' | 'sms' | 'in_app')[];
  scheduledAt?: Date;
  sentAt?: Date;
  createdAt: Date;
  createdBy: string;
  deliveryStats: {
    sent: number;
    delivered: number;
    read: number;
    clicked: number;
    failed: number;
  };
  campaign?: string;
  tags: string[];
}

interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'announcement';
  category: 'tournament' | 'payment' | 'system' | 'marketing' | 'emergency';
  variables: string[];
  isActive: boolean;
  usage: number;
  lastUsed?: Date;
  createdAt: Date;
}

interface NotificationSettings {
  id: string;
  name: string;
  description: string;
  channels: {
    push: { enabled: boolean; settings: any };
    email: { enabled: boolean; settings: any };
    sms: { enabled: boolean; settings: any };
    in_app: { enabled: boolean; settings: any };
  };
  frequency: {
    maxPerDay: number;
    maxPerWeek: number;
    cooldownMinutes: number;
  };
  targeting: {
    allowSegmentation: boolean;
    maxRecipients: number;
    requireApproval: boolean;
  };
}

const AdminNotificationsNew = () => {
  const { t } = useTranslation();
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 'notif_001',
      title: 'Tournament Registration Open',
      content: 'Registration for the Summer Championship is now open! Join now and compete for the grand prize.',
      type: 'announcement',
      priority: 'high',
      status: 'sent',
      recipients: { type: 'all', count: 1250 },
      channels: ['push', 'email', 'in_app'],
      sentAt: new Date('2025-08-02T10:00:00'),
      createdAt: new Date('2025-08-02T09:30:00'),
      createdBy: 'Tournament Manager',
      deliveryStats: {
        sent: 1250,
        delivered: 1180,
        read: 890,
        clicked: 156,
        failed: 70
      },
      campaign: 'summer_tournament_2025',
      tags: ['tournament', 'registration', 'championship']
    },
    {
      id: 'notif_002',
      title: 'System Maintenance Notice',
      content: 'Scheduled maintenance will occur tonight from 2:00 AM to 4:00 AM. Please save your progress.',
      type: 'warning',
      priority: 'medium',
      status: 'scheduled',
      recipients: { type: 'all', count: 2340 },
      channels: ['push', 'email'],
      scheduledAt: new Date('2025-08-03T20:00:00'),
      createdAt: new Date('2025-08-03T14:00:00'),
      createdBy: 'System Admin',
      deliveryStats: {
        sent: 0,
        delivered: 0,
        read: 0,
        clicked: 0,
        failed: 0
      },
      tags: ['maintenance', 'system', 'scheduled']
    },
    {
      id: 'notif_003',
      title: 'Payment Confirmation',
      content: 'Your tournament entry fee has been successfully processed. Good luck in the competition!',
      type: 'success',
      priority: 'low',
      status: 'sent',
      recipients: { type: 'specific', count: 45 },
      channels: ['push', 'email'],
      sentAt: new Date('2025-08-03T15:30:00'),
      createdAt: new Date('2025-08-03T15:25:00'),
      createdBy: 'Payment System',
      deliveryStats: {
        sent: 45,
        delivered: 44,
        read: 38,
        clicked: 12,
        failed: 1
      },
      campaign: 'payment_confirmations',
      tags: ['payment', 'confirmation', 'tournament']
    }
  ]);

  const [templates, setTemplates] = useState<NotificationTemplate[]>([
    {
      id: 'template_001',
      name: 'Tournament Announcement',
      title: '{tournament_name} Registration Open',
      content: 'Registration for {tournament_name} is now open! Entry fee: {entry_fee}. Deadline: {deadline}.',
      type: 'announcement',
      category: 'tournament',
      variables: ['tournament_name', 'entry_fee', 'deadline'],
      isActive: true,
      usage: 45,
      lastUsed: new Date('2025-08-02T10:00:00'),
      createdAt: new Date('2025-07-01T00:00:00')
    },
    {
      id: 'template_002',
      name: 'Payment Received',
      title: 'Payment Confirmation',
      content: 'Your payment of {amount} has been received. Transaction ID: {transaction_id}.',
      type: 'success',
      category: 'payment',
      variables: ['amount', 'transaction_id'],
      isActive: true,
      usage: 234,
      lastUsed: new Date('2025-08-03T15:30:00'),
      createdAt: new Date('2025-07-01T00:00:00')
    },
    {
      id: 'template_003',
      name: 'System Alert',
      title: 'System Notification',
      content: 'Alert: {alert_message}. Please take necessary action.',
      type: 'warning',
      category: 'system',
      variables: ['alert_message'],
      isActive: true,
      usage: 12,
      lastUsed: new Date('2025-08-01T08:00:00'),
      createdAt: new Date('2025-07-01T00:00:00')
    }
  ]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info':
        return 'bg-blue-100 text-blue-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'announcement':
        return 'bg-purple-100 text-purple-800';
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-yellow-100 text-yellow-800';
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
      case 'sent':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4" />;
      case 'cancelled':
        return <Square className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'push':
        return <Smartphone className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'sms':
        return <MessageSquare className="h-4 w-4" />;
      case 'in_app':
        return <Bell className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  const handleSendNotification = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId
          ? { ...notif, status: 'sent', sentAt: new Date() }
          : notif
      )
    );
    toast.success('Notification sent successfully!');
  };

  const handleCancelNotification = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId
          ? { ...notif, status: 'cancelled' }
          : notif
      )
    );
    toast.info('Notification cancelled');
  };

  const filteredNotifications = notifications.filter(notif => {
    const matchesStatus = filterStatus === 'all' || notif.status === filterStatus;
    const matchesType = filterType === 'all' || notif.type === filterType;
    const matchesSearch = notif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         notif.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesType && matchesSearch;
  });

  const stats = [
    {
      title: 'Total Sent',
      value: notifications.filter(n => n.status === 'sent').length.toString(),
      description: 'This month',
      icon: Send,
    },
    {
      title: 'Delivery Rate',
      value: '94.2%',
      description: 'Average delivery',
      icon: TrendingUp,
    },
    {
      title: 'Open Rate',
      value: '67.8%',
      description: 'Average open rate',
      icon: Eye,
    },
    {
      title: 'Click Rate',
      value: '12.4%',
      description: 'Average CTR',
      icon: Activity,
    },
  ];

  const pageActions = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm">
        <Download className="h-4 w-4 mr-2" />
        Export
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
        New Notification
      </Button>
    </div>
  );

  return (
    <AdminCoreProvider>
      <AdminPageLayout
        title={t('notifications.title')}
        description={t('notifications.description')}
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

          {/* Main Content Tabs */}
          <Tabs defaultValue="notifications" className="space-y-6">
            <TabsList>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6">
              {/* Filters */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder={t('notifications.search_placeholder')}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="Filter by type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="success">Success</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                        <SelectItem value="announcement">Announcement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Notifications List */}
                <div className="lg:col-span-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">
                      Notifications ({filteredNotifications.length})
                    </h3>
                  </div>

                  <ScrollArea className="h-[600px]">
                    <div className="space-y-3">
                      {filteredNotifications.map((notification) => (
                        <Card 
                          key={notification.id} 
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            selectedNotification?.id === notification.id ? 'ring-2 ring-primary' : ''
                          }`}
                          onClick={() => setSelectedNotification(notification)}
                        >
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <div className="space-y-1 flex-1">
                                  <h4 className="font-medium line-clamp-1">{notification.title}</h4>
                                  <p className="text-sm text-muted-foreground line-clamp-2">
                                    {notification.content}
                                  </p>
                                </div>
                                <Badge className={getStatusColor(notification.status)}>
                                  {getStatusIcon(notification.status)}
                                  <span className="ml-1 capitalize">{notification.status}</span>
                                </Badge>
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Badge className={getTypeColor(notification.type)}>
                                    {notification.type}
                                  </Badge>
                                  <Badge className={getPriorityColor(notification.priority)}>
                                    {notification.priority}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-1">
                                  {notification.channels.map((channel) => (
                                    <div 
                                      key={channel} 
                                      className="p-1 rounded bg-muted"
                                      title={channel}
                                    >
                                      {getChannelIcon(channel)}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <span>{notification.recipients.count} recipients</span>
                                <span>
                                  {notification.sentAt 
                                    ? notification.sentAt.toLocaleDateString()
                                    : notification.scheduledAt
                                    ? `Scheduled: ${notification.scheduledAt.toLocaleDateString()}`
                                    : 'Draft'
                                  }
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                      {filteredNotifications.length === 0 && (
                        <div className="text-center py-8">
                          <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-medium mb-2">No Notifications Found</h3>
                          <p className="text-muted-foreground">
                            {searchQuery || filterStatus !== 'all' || filterType !== 'all'
                              ? 'No notifications match your current filters.'
                              : 'Create your first notification to get started.'
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>

                {/* Notification Details */}
                <div className="lg:col-span-2">
                  {selectedNotification ? (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            {selectedNotification.title}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            {selectedNotification.status === 'draft' && (
                              <Button size="sm" variant="outline">
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Button>
                            )}
                            {selectedNotification.status === 'scheduled' && (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleCancelNotification(selectedNotification.id)}
                                >
                                  <Square className="h-4 w-4 mr-2" />
                                  Cancel
                                </Button>
                                <Button 
                                  size="sm"
                                  onClick={() => handleSendNotification(selectedNotification.id)}
                                >
                                  <Send className="h-4 w-4 mr-2" />
                                  Send Now
                                </Button>
                              </>
                            )}
                            {selectedNotification.status === 'sent' && (
                              <Button size="sm" variant="outline">
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Notification Info */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <Label className="text-sm text-muted-foreground">Status</Label>
                            <div className="mt-1">
                              <Badge className={getStatusColor(selectedNotification.status)}>
                                {getStatusIcon(selectedNotification.status)}
                                <span className="ml-1 capitalize">{selectedNotification.status}</span>
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Type</Label>
                            <div className="mt-1">
                              <Badge className={getTypeColor(selectedNotification.type)}>
                                {selectedNotification.type}
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Priority</Label>
                            <div className="mt-1">
                              <Badge className={getPriorityColor(selectedNotification.priority)}>
                                {selectedNotification.priority}
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Recipients</Label>
                            <div className="mt-1 text-sm font-medium">
                              {selectedNotification.recipients.count} users
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* Content */}
                        <div>
                          <Label className="text-sm text-muted-foreground">Content</Label>
                          <div className="mt-2 p-4 bg-muted rounded-lg">
                            <p className="text-sm whitespace-pre-wrap">
                              {selectedNotification.content}
                            </p>
                          </div>
                        </div>

                        {/* Channels */}
                        <div>
                          <Label className="text-sm text-muted-foreground">Delivery Channels</Label>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {selectedNotification.channels.map((channel) => (
                              <Badge key={channel} variant="outline" className="flex items-center gap-1">
                                {getChannelIcon(channel)}
                                <span className="capitalize">{channel}</span>
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Delivery Stats */}
                        {selectedNotification.status === 'sent' && (
                          <>
                            <Separator />
                            <div>
                              <Label className="text-sm text-muted-foreground">Delivery Statistics</Label>
                              <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4">
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-blue-600">
                                    {selectedNotification.deliveryStats.sent}
                                  </div>
                                  <div className="text-sm text-muted-foreground">Sent</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-green-600">
                                    {selectedNotification.deliveryStats.delivered}
                                  </div>
                                  <div className="text-sm text-muted-foreground">Delivered</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-purple-600">
                                    {selectedNotification.deliveryStats.read}
                                  </div>
                                  <div className="text-sm text-muted-foreground">Read</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-orange-600">
                                    {selectedNotification.deliveryStats.clicked}
                                  </div>
                                  <div className="text-sm text-muted-foreground">Clicked</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-red-600">
                                    {selectedNotification.deliveryStats.failed}
                                  </div>
                                  <div className="text-sm text-muted-foreground">Failed</div>
                                </div>
                              </div>
                            </div>
                          </>
                        )}

                        {/* Tags */}
                        {selectedNotification.tags.length > 0 && (
                          <div>
                            <Label className="text-sm text-muted-foreground">Tags</Label>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {selectedNotification.tags.map((tag, index) => (
                                <Badge key={index} variant="secondary">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Metadata */}
                        <div className="text-sm text-muted-foreground">
                          <div>Created: {selectedNotification.createdAt.toLocaleString()} by {selectedNotification.createdBy}</div>
                          {selectedNotification.scheduledAt && (
                            <div>Scheduled: {selectedNotification.scheduledAt.toLocaleString()}</div>
                          )}
                          {selectedNotification.sentAt && (
                            <div>Sent: {selectedNotification.sentAt.toLocaleString()}</div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">Select a Notification</h3>
                        <p className="text-muted-foreground">
                          Choose a notification to view details and manage delivery.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
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
                            {template.type}
                          </Badge>
                          {!template.isActive && (
                            <Badge variant="outline">Inactive</Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm text-muted-foreground">Title Template</Label>
                        <p className="text-sm font-medium">{template.title}</p>
                      </div>
                      
                      <div>
                        <Label className="text-sm text-muted-foreground">Content Preview</Label>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {template.content}
                        </p>
                      </div>

                      {template.variables.length > 0 && (
                        <div>
                          <Label className="text-sm text-muted-foreground">Variables</Label>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {template.variables.map((variable, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {variable}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Used {template.usage} times</span>
                        <span>
                          {template.lastUsed 
                            ? `Last: ${template.lastUsed.toLocaleDateString()}`
                            : 'Never used'
                          }
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button size="sm" className="flex-1">
                          <Play className="h-4 w-4 mr-2" />
                          Use
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Other tabs placeholder */}
            <TabsContent value="campaigns">
              <Card>
                <CardContent className="p-12 text-center">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Campaign Management</h3>
                  <p className="text-muted-foreground">
                    Advanced campaign tracking and management features coming soon.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <Card>
                <CardContent className="p-12 text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Notification Analytics</h3>
                  <p className="text-muted-foreground">
                    Detailed analytics and reporting for notification performance.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardContent className="p-12 text-center">
                  <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Notification Settings</h3>
                  <p className="text-muted-foreground">
                    Configure notification channels, delivery settings, and preferences.
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

export default AdminNotificationsNew;
