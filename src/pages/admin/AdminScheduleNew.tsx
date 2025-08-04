import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar, 
  Clock,
  Plus,
  Edit,
  Trash2,
  Copy,
  Play,
  Pause,
  Square,
  RefreshCw,
  Download,
  Upload,
  Settings,
  Search,
  Filter,
  Eye,
  Users,
  Trophy,
  Building,
  Target,
  DollarSign,
  Bell,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  TrendingUp,
  BarChart3,
  PieChart,
  MapPin,
  Globe,
  Wifi,
  WifiOff,
  Repeat,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  Archive,
  Star,
  Flag,
  Bookmark,
  Calendar as CalendarIcon
} from 'lucide-react';
import { AdminCoreProvider } from '@/components/admin/core/AdminCoreProvider';
import { AdminPageLayout } from '@/components/admin/shared/AdminPageLayout';
import { toast } from 'sonner';

interface ScheduledEvent {
  id: string;
  title: string;
  description: string;
  type: 'tournament' | 'maintenance' | 'meeting' | 'deadline' | 'notification' | 'backup';
  status: 'scheduled' | 'running' | 'completed' | 'cancelled' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  startTime: Date;
  endTime?: Date;
  duration?: number; // in minutes
  recurrence?: {
    type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
    interval: number;
    endDate?: Date;
    daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
    dayOfMonth?: number;
  };
  location?: string;
  participants?: string[];
  organizer: string;
  notifications: {
    enabled: boolean;
    times: number[]; // minutes before event
    channels: ('email' | 'push' | 'sms')[];
  };
  attachments?: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: any;
}

interface ScheduleTemplate {
  id: string;
  name: string;
  description: string;
  type: 'tournament' | 'maintenance' | 'meeting' | 'deadline' | 'notification' | 'backup';
  duration: number;
  settings: {
    notifications: boolean;
    recurrence: boolean;
    participants: boolean;
    location: boolean;
  };
  defaultValues: Partial<ScheduledEvent>;
  usage: number;
  isActive: boolean;
  createdAt: Date;
}

interface ScheduleSettings {
  workingHours: {
    start: string;
    end: string;
    timezone: string;
  };
  notifications: {
    enabled: boolean;
    defaultTimes: number[];
    channels: string[];
  };
  conflicts: {
    allowOverlap: boolean;
    bufferMinutes: number;
    autoResolve: boolean;
  };
  automation: {
    autoBackup: boolean;
    maintenanceWindows: boolean;
    notificationScheduling: boolean;
  };
}

const AdminScheduleNew = () => {
  const [selectedEvent, setSelectedEvent] = useState<ScheduledEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data
  const [events, setEvents] = useState<ScheduledEvent[]>([
    {
      id: 'event_001',
      title: 'Summer Championship Final',
      description: 'Final tournament of the Summer Championship series with live streaming and prizes.',
      type: 'tournament',
      status: 'scheduled',
      priority: 'high',
      startTime: new Date('2025-08-05T19:00:00'),
      endTime: new Date('2025-08-05T23:00:00'),
      duration: 240,
      location: 'Main Arena - Live Stream',
      participants: ['tournament_director', 'stream_operator', 'judges'],
      organizer: 'Tournament Committee',
      notifications: {
        enabled: true,
        times: [1440, 60, 15], // 24h, 1h, 15min before
        channels: ['email', 'push']
      },
      tags: ['tournament', 'championship', 'final', 'live-stream'],
      createdAt: new Date('2025-07-20T10:00:00'),
      updatedAt: new Date('2025-08-01T15:30:00')
    },
    {
      id: 'event_002',
      title: 'System Maintenance Window',
      description: 'Scheduled database optimization and server updates. Expected downtime: 2 hours.',
      type: 'maintenance',
      status: 'scheduled',
      priority: 'medium',
      startTime: new Date('2025-08-04T02:00:00'),
      endTime: new Date('2025-08-04T04:00:00'),
      duration: 120,
      organizer: 'System Administrator',
      notifications: {
        enabled: true,
        times: [1440, 120, 30], // 24h, 2h, 30min before
        channels: ['email', 'push']
      },
      recurrence: {
        type: 'weekly',
        interval: 1,
        daysOfWeek: [0], // Sunday
        endDate: new Date('2025-12-31T23:59:59')
      },
      tags: ['maintenance', 'database', 'server', 'downtime'],
      createdAt: new Date('2025-07-01T10:00:00'),
      updatedAt: new Date('2025-07-01T10:00:00')
    },
    {
      id: 'event_003',
      title: 'Weekly Admin Meeting',
      description: 'Review weekly metrics, discuss upcoming features, and address any issues.',
      type: 'meeting',
      status: 'completed',
      priority: 'medium',
      startTime: new Date('2025-08-02T14:00:00'),
      endTime: new Date('2025-08-02T15:00:00'),
      duration: 60,
      location: 'Virtual - Zoom Room #1',
      participants: ['admin_team', 'dev_team', 'support_team'],
      organizer: 'Project Manager',
      notifications: {
        enabled: true,
        times: [30, 5], // 30min, 5min before
        channels: ['email']
      },
      recurrence: {
        type: 'weekly',
        interval: 1,
        daysOfWeek: [5], // Friday
        endDate: new Date('2025-12-31T23:59:59')
      },
      tags: ['meeting', 'admin', 'weekly', 'review'],
      createdAt: new Date('2025-07-01T10:00:00'),
      updatedAt: new Date('2025-08-02T15:00:00')
    },
    {
      id: 'event_004',
      title: 'Payment Processing Audit',
      description: 'Monthly audit of payment transactions and financial reconciliation.',
      type: 'deadline',
      status: 'scheduled',
      priority: 'high',
      startTime: new Date('2025-08-10T09:00:00'),
      duration: 480, // 8 hours
      organizer: 'Finance Team',
      notifications: {
        enabled: true,
        times: [2880, 1440, 60], // 48h, 24h, 1h before
        channels: ['email', 'push']
      },
      recurrence: {
        type: 'monthly',
        interval: 1,
        dayOfMonth: 10
      },
      tags: ['audit', 'finance', 'payment', 'monthly'],
      createdAt: new Date('2025-07-01T10:00:00'),
      updatedAt: new Date('2025-07-01T10:00:00')
    }
  ]);

  const [templates] = useState<ScheduleTemplate[]>([
    {
      id: 'template_001',
      name: 'Tournament Event',
      description: 'Standard tournament with registration, matches, and awards',
      type: 'tournament',
      duration: 180,
      settings: {
        notifications: true,
        recurrence: false,
        participants: true,
        location: true
      },
      defaultValues: {
        notifications: {
          enabled: true,
          times: [1440, 60, 15],
          channels: ['email', 'push']
        },
        priority: 'high'
      },
      usage: 45,
      isActive: true,
      createdAt: new Date('2025-07-01T00:00:00')
    },
    {
      id: 'template_002',
      name: 'System Maintenance',
      description: 'Scheduled system maintenance and updates',
      type: 'maintenance',
      duration: 120,
      settings: {
        notifications: true,
        recurrence: true,
        participants: false,
        location: false
      },
      defaultValues: {
        notifications: {
          enabled: true,
          times: [1440, 120, 30],
          channels: ['email', 'push']
        },
        priority: 'medium'
      },
      usage: 12,
      isActive: true,
      createdAt: new Date('2025-07-01T00:00:00')
    }
  ]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'tournament':
        return 'bg-purple-100 text-purple-800';
      case 'maintenance':
        return 'bg-orange-100 text-orange-800';
      case 'meeting':
        return 'bg-blue-100 text-blue-800';
      case 'deadline':
        return 'bg-red-100 text-red-800';
      case 'notification':
        return 'bg-green-100 text-green-800';
      case 'backup':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'running':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-yellow-100 text-yellow-800';
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'tournament':
        return <Trophy className="h-4 w-4" />;
      case 'maintenance':
        return <Settings className="h-4 w-4" />;
      case 'meeting':
        return <Users className="h-4 w-4" />;
      case 'deadline':
        return <AlertTriangle className="h-4 w-4" />;
      case 'notification':
        return <Bell className="h-4 w-4" />;
      case 'backup':
        return <Archive className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="h-4 w-4" />;
      case 'running':
        return <Play className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  const handleEventAction = (eventId: string, action: 'start' | 'pause' | 'complete' | 'cancel') => {
    setEvents(prev =>
      prev.map(event => {
        if (event.id === eventId) {
          let newStatus = event.status;
          switch (action) {
            case 'start':
              newStatus = 'running';
              break;
            case 'pause':
              newStatus = 'scheduled';
              break;
            case 'complete':
              newStatus = 'completed';
              break;
            case 'cancel':
              newStatus = 'cancelled';
              break;
          }
          return { ...event, status: newStatus, updatedAt: new Date() };
        }
        return event;
      })
    );
    toast.success(`Event ${action}ed successfully!`);
  };

  const filteredEvents = events.filter(event => {
    const matchesType = filterType === 'all' || event.type === filterType;
    const matchesStatus = filterStatus === 'all' || event.status === filterStatus;
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  const upcomingEvents = events
    .filter(event => event.startTime > new Date() && event.status === 'scheduled')
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
    .slice(0, 5);

  const todayEvents = events.filter(event => {
    const today = new Date();
    const eventDate = event.startTime;
    return eventDate.toDateString() === today.toDateString();
  });

  const stats = [
    {
      title: 'Today\'s Events',
      value: todayEvents.length.toString(),
      description: `${todayEvents.filter(e => e.status === 'completed').length} completed`,
      icon: CalendarIcon,
    },
    {
      title: 'This Week',
      value: events.filter(e => {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        return e.startTime >= weekStart && e.startTime <= weekEnd;
      }).length.toString(),
      description: 'Scheduled events',
      icon: Activity,
    },
    {
      title: 'Running',
      value: events.filter(e => e.status === 'running').length.toString(),
      description: 'Active events',
      icon: Play,
    },
    {
      title: 'Success Rate',
      value: `${Math.round((events.filter(e => e.status === 'completed').length / events.length) * 100)}%`,
      description: 'Event completion',
      icon: TrendingUp,
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
        New Event
      </Button>
    </div>
  );

  return (
    <AdminCoreProvider>
      <AdminPageLayout
        title="Schedule Manager"
        description="Manage events, tournaments, maintenance windows, and automated scheduling"
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
          <Tabs defaultValue="calendar" className="space-y-6">
            <TabsList>
              <TabsTrigger value="calendar">Calendar View</TabsTrigger>
              <TabsTrigger value="events">All Events</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="automation">Automation</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* Calendar View Tab */}
            <TabsContent value="calendar" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Upcoming Events */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Upcoming Events</h3>
                    <Select value={viewMode} onValueChange={(value: 'day' | 'week' | 'month') => setViewMode(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">Day</SelectItem>
                        <SelectItem value="week">Week</SelectItem>
                        <SelectItem value="month">Month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <ScrollArea className="h-[600px]">
                    <div className="space-y-3">
                      {upcomingEvents.map((event) => (
                        <Card 
                          key={event.id} 
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            selectedEvent?.id === event.id ? 'ring-2 ring-primary' : ''
                          }`}
                          onClick={() => setSelectedEvent(event)}
                        >
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <div className="space-y-1 flex-1">
                                  <h4 className="font-medium line-clamp-1">{event.title}</h4>
                                  <p className="text-sm text-muted-foreground line-clamp-2">
                                    {event.description}
                                  </p>
                                </div>
                                <Badge className={getStatusColor(event.status)}>
                                  {getStatusIcon(event.status)}
                                  <span className="ml-1 capitalize">{event.status}</span>
                                </Badge>
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Badge className={getTypeColor(event.type)}>
                                    {getTypeIcon(event.type)}
                                    <span className="ml-1 capitalize">{event.type}</span>
                                  </Badge>
                                  <Badge className={getPriorityColor(event.priority)}>
                                    {event.priority}
                                  </Badge>
                                </div>
                                {event.recurrence && (
                                  <Badge variant="outline">
                                    <Repeat className="h-3 w-3 mr-1" />
                                    Recurring
                                  </Badge>
                                )}
                              </div>

                              <div className="space-y-1 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  <span>{formatDateTime(event.startTime)}</span>
                                </div>
                                {event.duration && (
                                  <div className="flex items-center gap-2">
                                    <Activity className="h-4 w-4" />
                                    <span>{formatDuration(event.duration)}</span>
                                  </div>
                                )}
                                {event.location && (
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    <span className="truncate">{event.location}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                      {upcomingEvents.length === 0 && (
                        <div className="text-center py-8">
                          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-medium mb-2">No Upcoming Events</h3>
                          <p className="text-muted-foreground">
                            No events scheduled for the near future.
                          </p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>

                {/* Event Details / Calendar */}
                <div className="lg:col-span-2">
                  {selectedEvent ? (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            {getTypeIcon(selectedEvent.type)}
                            {selectedEvent.title}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            {selectedEvent.status === 'scheduled' && (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleEventAction(selectedEvent.id, 'cancel')}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Cancel
                                </Button>
                                <Button 
                                  size="sm"
                                  onClick={() => handleEventAction(selectedEvent.id, 'start')}
                                >
                                  <Play className="h-4 w-4 mr-2" />
                                  Start
                                </Button>
                              </>
                            )}
                            {selectedEvent.status === 'running' && (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleEventAction(selectedEvent.id, 'pause')}
                                >
                                  <Pause className="h-4 w-4 mr-2" />
                                  Pause
                                </Button>
                                <Button 
                                  size="sm"
                                  onClick={() => handleEventAction(selectedEvent.id, 'complete')}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Complete
                                </Button>
                              </>
                            )}
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Event Info */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <Label className="text-sm text-muted-foreground">Status</Label>
                            <div className="mt-1">
                              <Badge className={getStatusColor(selectedEvent.status)}>
                                {getStatusIcon(selectedEvent.status)}
                                <span className="ml-1 capitalize">{selectedEvent.status}</span>
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Type</Label>
                            <div className="mt-1">
                              <Badge className={getTypeColor(selectedEvent.type)}>
                                {getTypeIcon(selectedEvent.type)}
                                <span className="ml-1 capitalize">{selectedEvent.type}</span>
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Priority</Label>
                            <div className="mt-1">
                              <Badge className={getPriorityColor(selectedEvent.priority)}>
                                {selectedEvent.priority}
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Duration</Label>
                            <div className="mt-1 text-sm font-medium">
                              {selectedEvent.duration ? formatDuration(selectedEvent.duration) : 'Not specified'}
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* Description */}
                        <div>
                          <Label className="text-sm text-muted-foreground">Description</Label>
                          <div className="mt-2 p-4 bg-muted rounded-lg">
                            <p className="text-sm whitespace-pre-wrap">
                              {selectedEvent.description}
                            </p>
                          </div>
                        </div>

                        {/* Schedule */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm text-muted-foreground">Start Time</Label>
                            <div className="mt-1 text-sm font-medium">
                              {formatDateTime(selectedEvent.startTime)}
                            </div>
                          </div>
                          {selectedEvent.endTime && (
                            <div>
                              <Label className="text-sm text-muted-foreground">End Time</Label>
                              <div className="mt-1 text-sm font-medium">
                                {formatDateTime(selectedEvent.endTime)}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Location */}
                        {selectedEvent.location && (
                          <div>
                            <Label className="text-sm text-muted-foreground">Location</Label>
                            <div className="mt-1 text-sm font-medium flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              {selectedEvent.location}
                            </div>
                          </div>
                        )}

                        {/* Participants */}
                        {selectedEvent.participants && selectedEvent.participants.length > 0 && (
                          <div>
                            <Label className="text-sm text-muted-foreground">Participants</Label>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {selectedEvent.participants.map((participant, index) => (
                                <Badge key={index} variant="outline">
                                  <Users className="h-3 w-3 mr-1" />
                                  {participant.replace('_', ' ')}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recurrence */}
                        {selectedEvent.recurrence && (
                          <div>
                            <Label className="text-sm text-muted-foreground">Recurrence</Label>
                            <div className="mt-2 p-3 bg-muted rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <Repeat className="h-4 w-4" />
                                <span className="text-sm font-medium capitalize">
                                  {selectedEvent.recurrence.type}
                                </span>
                                {selectedEvent.recurrence.interval > 1 && (
                                  <span className="text-sm text-muted-foreground">
                                    (every {selectedEvent.recurrence.interval} {selectedEvent.recurrence.type}s)
                                  </span>
                                )}
                              </div>
                              {selectedEvent.recurrence.endDate && (
                                <div className="text-sm text-muted-foreground">
                                  Until: {selectedEvent.recurrence.endDate.toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Notifications */}
                        {selectedEvent.notifications.enabled && (
                          <div>
                            <Label className="text-sm text-muted-foreground">Notifications</Label>
                            <div className="mt-2 space-y-2">
                              <div className="flex flex-wrap gap-2">
                                {selectedEvent.notifications.times.map((time, index) => (
                                  <Badge key={index} variant="outline">
                                    <Bell className="h-3 w-3 mr-1" />
                                    {time >= 1440 ? `${Math.floor(time / 1440)}d` : 
                                     time >= 60 ? `${Math.floor(time / 60)}h` : `${time}m`} before
                                  </Badge>
                                ))}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Channels: {selectedEvent.notifications.channels.join(', ')}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Tags */}
                        {selectedEvent.tags.length > 0 && (
                          <div>
                            <Label className="text-sm text-muted-foreground">Tags</Label>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {selectedEvent.tags.map((tag, index) => (
                                <Badge key={index} variant="secondary">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Metadata */}
                        <div className="text-sm text-muted-foreground">
                          <div>Created: {selectedEvent.createdAt.toLocaleString()} by {selectedEvent.organizer}</div>
                          <div>Updated: {selectedEvent.updatedAt.toLocaleString()}</div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">Calendar View</h3>
                        <p className="text-muted-foreground">
                          Interactive calendar view will be available here. Select an event to view details.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* All Events Tab */}
            <TabsContent value="events" className="space-y-6">
              {/* Filters */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search events..."
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
                        <SelectItem value="tournament">Tournament</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="meeting">Meeting</SelectItem>
                        <SelectItem value="deadline">Deadline</SelectItem>
                        <SelectItem value="notification">Notification</SelectItem>
                        <SelectItem value="backup">Backup</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="running">Running</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Events List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event) => (
                  <Card key={event.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg line-clamp-1">{event.title}</CardTitle>
                        <Badge className={getStatusColor(event.status)}>
                          {getStatusIcon(event.status)}
                          <span className="ml-1 capitalize">{event.status}</span>
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Badge className={getTypeColor(event.type)}>
                          {getTypeIcon(event.type)}
                          <span className="ml-1 capitalize">{event.type}</span>
                        </Badge>
                        <Badge className={getPriorityColor(event.priority)}>
                          {event.priority}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{formatDateTime(event.startTime)}</span>
                        </div>
                        {event.duration && (
                          <div className="flex items-center gap-2 text-sm">
                            <Activity className="h-4 w-4 text-muted-foreground" />
                            <span>{formatDuration(event.duration)}</span>
                          </div>
                        )}
                        {event.location && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}
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

                {filteredEvents.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Events Found</h3>
                    <p className="text-muted-foreground">
                      {searchQuery || filterType !== 'all' || filterStatus !== 'all'
                        ? 'No events match your current filters.'
                        : 'Create your first event to get started.'
                      }
                    </p>
                  </div>
                )}
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
                        <Badge className={getTypeColor(template.type)}>
                          {getTypeIcon(template.type)}
                          <span className="ml-1 capitalize">{template.type}</span>
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Duration:</span>
                          <span className="text-sm font-medium">{formatDuration(template.duration)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Usage:</span>
                          <span className="text-sm">{template.usage} times</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Status:</span>
                          <Badge variant={template.isActive ? "default" : "secondary"}>
                            {template.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button size="sm" className="flex-1">
                          <Plus className="h-4 w-4 mr-2" />
                          Use
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Other tabs placeholder */}
            <TabsContent value="automation">
              <Card>
                <CardContent className="p-12 text-center">
                  <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Schedule Automation</h3>
                  <p className="text-muted-foreground">
                    Automated scheduling rules and recurring event management.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardContent className="p-12 text-center">
                  <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Schedule Settings</h3>
                  <p className="text-muted-foreground">
                    Configure time zones, working hours, and notification preferences.
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

export default AdminScheduleNew;
