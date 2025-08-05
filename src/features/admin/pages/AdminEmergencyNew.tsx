import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import { Switch } from '@/shared/components/ui/switch';
import { Separator } from '@/shared/components/ui/separator';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/shared/components/ui/alert';
import {
  AlertTriangle,
  Shield,
  Zap,
  Power,
  Database,
  Server,
  Wifi,
  WifiOff,
  Activity,
  Clock,
  Bell,
  Users,
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
  StopCircle,
  ChevronRight,
  ExternalLink,
  Archive,
  Star,
  Flag,
  Bookmark,
  Phone,
  Mail,
  MessageSquare,
  Smartphone,
  Globe,
  MapPin,
  Calendar,
  FileText,
  Download,
  Upload,
  Share,
  Layers,
  Target,
  Crosshair,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  HelpCircle,
  Lock,
  Unlock,
  Key,
  UserX,
  Ban,
} from 'lucide-react';
import { AdminCoreProvider } from '@/features/admin/components/core/AdminCoreProvider';
import { AdminPageLayout } from '@/features/admin/components/shared/AdminPageLayout';
import { toast } from 'sonner';

interface EmergencyIncident {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'security' | 'technical' | 'financial' | 'user' | 'legal' | 'other';
  status: 'open' | 'investigating' | 'resolving' | 'resolved' | 'closed';
  priority: 'p1' | 'p2' | 'p3' | 'p4';
  impact: 'system_wide' | 'partial' | 'service_specific' | 'minimal';
  affectedServices: string[];
  affectedUsers: number;
  reporter: string;
  assignee?: string;
  team?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  timeline: IncidentUpdate[];
  actions: EmergencyAction[];
  tags: string[];
  metadata: Record<string, any>;
}

interface IncidentUpdate {
  id: string;
  timestamp: Date;
  author: string;
  type: 'status_change' | 'comment' | 'action_taken' | 'escalation';
  content: string;
  attachments?: string[];
}

interface EmergencyAction {
  id: string;
  title: string;
  description: string;
  type:
    | 'immediate'
    | 'investigation'
    | 'communication'
    | 'mitigation'
    | 'prevention';
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  assignee: string;
  priority: 'high' | 'medium' | 'low';
  deadline?: Date;
  completedAt?: Date;
  dependencies?: string[];
  results?: string;
}

interface EmergencyContact {
  id: string;
  name: string;
  role: string;
  department: string;
  level: 'primary' | 'secondary' | 'escalation';
  availability: '24/7' | 'business_hours' | 'on_call';
  phone: string;
  email: string;
  alternate?: string;
  lastContacted?: Date;
  responseTime: number; // minutes
  isActive: boolean;
}

interface EmergencyProcedure {
  id: string;
  name: string;
  description: string;
  category: 'security' | 'technical' | 'financial' | 'user' | 'legal' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  steps: ProcedureStep[];
  estimatedTime: number;
  requiredRoles: string[];
  checklist: string[];
  isActive: boolean;
  lastUsed?: Date;
  usage: number;
  successRate: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ProcedureStep {
  id: string;
  order: number;
  title: string;
  description: string;
  type: 'action' | 'verification' | 'communication' | 'escalation';
  assignee?: string;
  estimatedTime: number;
  isRequired: boolean;
  dependencies?: string[];
}

const AdminEmergencyNew = () => {
  const { t } = useTranslation();
  const [selectedIncident, setSelectedIncident] =
    useState<EmergencyIncident | null>(null);
  const [selectedProcedure, setSelectedProcedure] =
    useState<EmergencyProcedure | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [alertMode, setAlertMode] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data
  const [incidents, setIncidents] = useState<EmergencyIncident[]>([
    {
      id: 'incident_001',
      title: 'Database Connection Pool Exhaustion',
      description:
        'Database connection pool has reached maximum capacity causing application timeouts and service degradation.',
      severity: 'critical',
      category: 'technical',
      status: 'investigating',
      priority: 'p1',
      impact: 'system_wide',
      affectedServices: [
        'user_authentication',
        'tournament_system',
        'payment_processing',
      ],
      affectedUsers: 2340,
      reporter: 'System Monitor',
      assignee: 'Database Team Lead',
      team: 'Engineering',
      createdAt: new Date('2025-08-03T14:30:00'),
      updatedAt: new Date('2025-08-03T15:15:00'),
      timeline: [
        {
          id: 'update_001',
          timestamp: new Date('2025-08-03T14:30:00'),
          author: 'System Monitor',
          type: 'status_change',
          content: 'Incident created - High database connection usage detected',
        },
        {
          id: 'update_002',
          timestamp: new Date('2025-08-03T14:45:00'),
          author: 'Engineering Lead',
          type: 'action_taken',
          content:
            'Increased connection pool size temporarily. Investigating root cause.',
        },
        {
          id: 'update_003',
          timestamp: new Date('2025-08-03T15:15:00'),
          author: 'Database Team Lead',
          type: 'comment',
          content:
            'Found memory leak in tournament service causing connections to not be released properly.',
        },
      ],
      actions: [
        {
          id: 'action_001',
          title: 'Increase Connection Pool',
          description:
            'Temporarily increase database connection pool size to handle load',
          type: 'immediate',
          status: 'completed',
          assignee: 'Database Admin',
          priority: 'high',
          completedAt: new Date('2025-08-03T14:45:00'),
          results:
            'Connection pool increased from 100 to 200. Service restored.',
        },
        {
          id: 'action_002',
          title: 'Fix Memory Leak',
          description: 'Identify and fix memory leak in tournament service',
          type: 'mitigation',
          status: 'in_progress',
          assignee: 'Senior Developer',
          priority: 'high',
          deadline: new Date('2025-08-03T18:00:00'),
        },
      ],
      tags: ['database', 'performance', 'system_wide', 'p1'],
      metadata: {
        errorRate: 23.5,
        responseTime: 5.2,
        peakUsers: 2340,
      },
    },
    {
      id: 'incident_002',
      title: 'Suspicious Payment Activity Detected',
      description:
        'Automated fraud detection system flagged unusual payment patterns indicating potential fraudulent activity.',
      severity: 'high',
      category: 'security',
      status: 'resolving',
      priority: 'p2',
      impact: 'service_specific',
      affectedServices: ['payment_processing'],
      affectedUsers: 45,
      reporter: 'Fraud Detection System',
      assignee: 'Security Team',
      team: 'Security',
      createdAt: new Date('2025-08-03T12:00:00'),
      updatedAt: new Date('2025-08-03T13:30:00'),
      timeline: [
        {
          id: 'update_004',
          timestamp: new Date('2025-08-03T12:00:00'),
          author: 'Fraud Detection System',
          type: 'status_change',
          content:
            'Suspicious payment pattern detected - Multiple failed high-value transactions',
        },
        {
          id: 'update_005',
          timestamp: new Date('2025-08-03T12:15:00'),
          author: 'Security Analyst',
          type: 'action_taken',
          content: 'Temporarily blocked suspicious accounts and IP addresses',
        },
      ],
      actions: [
        {
          id: 'action_003',
          title: 'Block Suspicious Accounts',
          description: 'Temporarily block accounts showing fraudulent patterns',
          type: 'immediate',
          status: 'completed',
          assignee: 'Security Analyst',
          priority: 'high',
          completedAt: new Date('2025-08-03T12:15:00'),
          results: '12 accounts blocked, 3 IP addresses blacklisted',
        },
        {
          id: 'action_004',
          title: 'Investigation Report',
          description: 'Complete detailed investigation and prepare report',
          type: 'investigation',
          status: 'in_progress',
          assignee: 'Security Team Lead',
          priority: 'medium',
          deadline: new Date('2025-08-04T17:00:00'),
        },
      ],
      tags: ['security', 'fraud', 'payments', 'investigation'],
      metadata: {
        blockedAccounts: 12,
        blockedIPs: 3,
        flaggedTransactions: 45,
      },
    },
    {
      id: 'incident_003',
      title: 'Server Hardware Failure - Node 3',
      description:
        'Hardware failure detected on application server node 3. System has automatically failed over to backup nodes.',
      severity: 'medium',
      category: 'technical',
      status: 'resolved',
      priority: 'p2',
      impact: 'partial',
      affectedServices: ['load_balancer'],
      affectedUsers: 0,
      reporter: 'Infrastructure Monitor',
      assignee: 'DevOps Team',
      team: 'Infrastructure',
      createdAt: new Date('2025-08-02T09:30:00'),
      updatedAt: new Date('2025-08-02T11:45:00'),
      resolvedAt: new Date('2025-08-02T11:45:00'),
      timeline: [
        {
          id: 'update_006',
          timestamp: new Date('2025-08-02T09:30:00'),
          author: 'Infrastructure Monitor',
          type: 'status_change',
          content: 'Hardware failure detected on Node 3 - Memory module error',
        },
        {
          id: 'update_007',
          timestamp: new Date('2025-08-02T11:45:00'),
          author: 'DevOps Engineer',
          type: 'action_taken',
          content:
            'Node 3 removed from load balancer. Hardware replacement scheduled.',
        },
      ],
      actions: [
        {
          id: 'action_005',
          title: 'Remove Failed Node',
          description: 'Remove failed node from load balancer rotation',
          type: 'immediate',
          status: 'completed',
          assignee: 'DevOps Engineer',
          priority: 'high',
          completedAt: new Date('2025-08-02T10:00:00'),
          results: 'Node successfully removed. No service impact.',
        },
      ],
      tags: ['hardware', 'infrastructure', 'resolved', 'no_impact'],
      metadata: {
        nodeId: 'app-node-3',
        failureType: 'memory',
        replacementScheduled: '2025-08-05',
      },
    },
  ]);

  const [contacts] = useState<EmergencyContact[]>([
    {
      id: 'contact_001',
      name: 'John Smith',
      role: 'Engineering Lead',
      department: 'Engineering',
      level: 'primary',
      availability: '24/7',
      phone: '+1-555-0101',
      email: 'john.smith@company.com',
      alternate: '+1-555-0102',
      lastContacted: new Date('2025-08-01T10:00:00'),
      responseTime: 5,
      isActive: true,
    },
    {
      id: 'contact_002',
      name: 'Sarah Johnson',
      role: 'Security Director',
      department: 'Security',
      level: 'primary',
      availability: 'on_call',
      phone: '+1-555-0201',
      email: 'sarah.johnson@company.com',
      responseTime: 8,
      isActive: true,
    },
    {
      id: 'contact_003',
      name: 'Mike Chen',
      role: 'Database Administrator',
      department: 'Engineering',
      level: 'secondary',
      availability: 'business_hours',
      phone: '+1-555-0301',
      email: 'mike.chen@company.com',
      responseTime: 15,
      isActive: true,
    },
  ]);

  const [procedures] = useState<EmergencyProcedure[]>([
    {
      id: 'procedure_001',
      name: 'Database Outage Response',
      description:
        'Standard procedure for handling database connectivity issues and outages',
      category: 'technical',
      severity: 'critical',
      steps: [
        {
          id: 'step_001',
          order: 1,
          title: 'Assess Impact',
          description: 'Determine scope of database connectivity issues',
          type: 'verification',
          estimatedTime: 5,
          isRequired: true,
        },
        {
          id: 'step_002',
          order: 2,
          title: 'Enable Maintenance Mode',
          description: 'Activate maintenance mode to prevent data corruption',
          type: 'action',
          estimatedTime: 2,
          isRequired: true,
        },
        {
          id: 'step_003',
          order: 3,
          title: 'Notify Stakeholders',
          description: 'Send notifications to engineering team and management',
          type: 'communication',
          estimatedTime: 3,
          isRequired: true,
        },
      ],
      estimatedTime: 30,
      requiredRoles: ['Database Admin', 'Engineering Lead'],
      checklist: [
        'Database connectivity verified',
        'Maintenance mode activated',
        'Stakeholders notified',
        'Backup systems verified',
      ],
      isActive: true,
      lastUsed: new Date('2025-07-15T10:00:00'),
      usage: 12,
      successRate: 94.2,
      createdAt: new Date('2025-01-01T00:00:00'),
      updatedAt: new Date('2025-07-01T00:00:00'),
    },
    {
      id: 'procedure_002',
      name: 'Security Breach Response',
      description:
        'Immediate response protocol for suspected security breaches',
      category: 'security',
      severity: 'critical',
      steps: [
        {
          id: 'step_004',
          order: 1,
          title: 'Isolate Affected Systems',
          description: 'Immediately isolate potentially compromised systems',
          type: 'action',
          estimatedTime: 3,
          isRequired: true,
        },
        {
          id: 'step_005',
          order: 2,
          title: 'Preserve Evidence',
          description: 'Capture system logs and forensic evidence',
          type: 'action',
          estimatedTime: 10,
          isRequired: true,
        },
      ],
      estimatedTime: 60,
      requiredRoles: ['Security Team', 'Legal'],
      checklist: [
        'Systems isolated',
        'Evidence preserved',
        'Legal team notified',
        'External authorities contacted if required',
      ],
      isActive: true,
      usage: 3,
      successRate: 100,
      createdAt: new Date('2025-01-01T00:00:00'),
      updatedAt: new Date('2025-06-01T00:00:00'),
    },
  ]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-800';
      case 'investigating':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolving':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'security':
        return 'bg-red-100 text-red-800';
      case 'technical':
        return 'bg-blue-100 text-blue-800';
      case 'financial':
        return 'bg-green-100 text-green-800';
      case 'user':
        return 'bg-purple-100 text-purple-800';
      case 'legal':
        return 'bg-orange-100 text-orange-800';
      case 'other':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'low':
        return <Info className='h-4 w-4' />;
      case 'medium':
        return <AlertCircle className='h-4 w-4' />;
      case 'high':
        return <AlertTriangle className='h-4 w-4' />;
      case 'critical':
        return <AlertTriangle className='h-4 w-4' />;
      default:
        return <Info className='h-4 w-4' />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertTriangle className='h-4 w-4' />;
      case 'investigating':
        return <Search className='h-4 w-4' />;
      case 'resolving':
        return <Settings className='h-4 w-4 animate-spin' />;
      case 'resolved':
        return <CheckCircle className='h-4 w-4' />;
      case 'closed':
        return <Archive className='h-4 w-4' />;
      default:
        return <HelpCircle className='h-4 w-4' />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security':
        return <Shield className='h-4 w-4' />;
      case 'technical':
        return <Server className='h-4 w-4' />;
      case 'financial':
        return <FileText className='h-4 w-4' />;
      case 'user':
        return <Users className='h-4 w-4' />;
      case 'legal':
        return <FileText className='h-4 w-4' />;
      case 'other':
        return <HelpCircle className='h-4 w-4' />;
      default:
        return <HelpCircle className='h-4 w-4' />;
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const handleIncidentStatusChange = (
    incidentId: string,
    newStatus: string
  ) => {
    setIncidents(prev =>
      prev.map(incident => {
        if (incident.id === incidentId) {
          const updatedIncident = {
            ...incident,
            status: newStatus as any,
            updatedAt: new Date(),
            ...(newStatus === 'resolved' && { resolvedAt: new Date() }),
          };

          // Add timeline update
          const newUpdate: IncidentUpdate = {
            id: `update_${Date.now()}`,
            timestamp: new Date(),
            author: 'Current Admin',
            type: 'status_change',
            content: `Status changed to ${newStatus}`,
          };

          updatedIncident.timeline = [...incident.timeline, newUpdate];
          return updatedIncident;
        }
        return incident;
      })
    );
    toast.success(`Incident status updated to ${newStatus}`);
  };

  const handleEmergencyAlert = () => {
    setAlertMode(!alertMode);
    if (!alertMode) {
      toast.error('Emergency Alert Mode ACTIVATED!');
    } else {
      toast.info('Emergency Alert Mode deactivated');
    }
  };

  const filteredIncidents = incidents.filter(incident => {
    const matchesSeverity =
      filterSeverity === 'all' || incident.severity === filterSeverity;
    const matchesStatus =
      filterStatus === 'all' || incident.status === filterStatus;
    const matchesCategory =
      filterCategory === 'all' || incident.category === filterCategory;
    const matchesSearch =
      incident.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesStatus && matchesCategory && matchesSearch;
  });

  const activeIncidents = incidents.filter(i =>
    ['open', 'investigating', 'resolving'].includes(i.status)
  );
  const criticalIncidents = incidents.filter(i => i.severity === 'critical');
  const todayIncidents = incidents.filter(i => {
    const today = new Date();
    return i.createdAt.toDateString() === today.toDateString();
  });

  const stats = [
    {
      title: 'Active Incidents',
      value: activeIncidents.length.toString(),
      description: `${criticalIncidents.length} critical`,
      icon: AlertTriangle,
      color: activeIncidents.length > 0 ? 'text-red-600' : 'text-green-600',
    },
    {
      title: "Today's Incidents",
      value: todayIncidents.length.toString(),
      description: 'New incidents',
      icon: Calendar,
      color: 'text-blue-600',
    },
    {
      title: 'Avg Response Time',
      value: '12m',
      description: 'Last 30 days',
      icon: Clock,
      color: 'text-green-600',
    },
    {
      title: 'Resolution Rate',
      value: '94.2%',
      description: 'This month',
      icon: CheckCircle,
      color: 'text-green-600',
    },
  ];

  const pageActions = (
    <div className='flex items-center gap-2'>
      {alertMode && (
        <div className='flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 rounded-lg animate-pulse'>
          <AlertTriangle className='h-4 w-4' />
          <span className='text-sm font-medium'>EMERGENCY MODE</span>
        </div>
      )}
      <Button
        variant={alertMode ? 'destructive' : 'outline'}
        size='sm'
        onClick={handleEmergencyAlert}
      >
        <AlertTriangle className='h-4 w-4 mr-2' />
        Emergency Alert
      </Button>
      <Button variant='outline' size='sm'>
        <Download className='h-4 w-4 mr-2' />
        Export
      </Button>
      <Button onClick={() => setShowCreateModal(true)} size='sm'>
        <Plus className='h-4 w-4 mr-2' />
        New Incident
      </Button>
    </div>
  );

  return (
    <AdminCoreProvider>
      <AdminPageLayout
        title={t('emergency.title')}
        description={t('emergency.description')}
        actions={pageActions}
      >
        <div className='space-y-6'>
          {/* Emergency Alert Banner */}
          {alertMode && (
            <Alert className='border-red-200 bg-red-50'>
              <AlertTriangle className='h-4 w-4 text-red-600' />
              <AlertTitle className='text-red-800'>
                Emergency Alert Mode Active
              </AlertTitle>
              <AlertDescription className='text-red-700'>
                Emergency response protocols are now active. All critical
                notifications will be sent immediately. Emergency contacts will
                be notified of any new critical incidents.
              </AlertDescription>
            </Alert>
          )}

          {/* Stats Cards */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            {stats.map((stat, index) => (
              <Card
                key={index}
                className={
                  activeIncidents.length > 0 &&
                  stat.title === 'Active Incidents'
                    ? 'border-red-200'
                    : ''
                }
              >
                <CardContent className='p-6'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm font-medium text-muted-foreground'>
                        {stat.title}
                      </p>
                      <p className={`text-2xl font-bold ${stat.color}`}>
                        {stat.value}
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        {stat.description}
                      </p>
                    </div>
                    <stat.icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue='incidents' className='space-y-6'>
            <TabsList>
              <TabsTrigger value='incidents'>Active Incidents</TabsTrigger>
              <TabsTrigger value='procedures'>Procedures</TabsTrigger>
              <TabsTrigger value='contacts'>Emergency Contacts</TabsTrigger>
              <TabsTrigger value='history'>History</TabsTrigger>
              <TabsTrigger value='settings'>Settings</TabsTrigger>
            </TabsList>

            {/* Active Incidents Tab */}
            <TabsContent value='incidents' className='space-y-6'>
              {/* Filters */}
              <Card>
                <CardContent className='p-4'>
                  <div className='flex flex-col sm:flex-row gap-4'>
                    <div className='flex-1'>
                      <div className='relative'>
                        <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                        <Input
                          placeholder='Search incidents...'
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          className='pl-10'
                        />
                      </div>
                    </div>
                    <Select
                      value={filterSeverity}
                      onValueChange={setFilterSeverity}
                    >
                      <SelectTrigger className='w-full sm:w-48'>
                        <SelectValue placeholder='Filter by severity' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='all'>All Severity</SelectItem>
                        <SelectItem value='critical'>Critical</SelectItem>
                        <SelectItem value='high'>High</SelectItem>
                        <SelectItem value='medium'>Medium</SelectItem>
                        <SelectItem value='low'>Low</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={filterStatus}
                      onValueChange={setFilterStatus}
                    >
                      <SelectTrigger className='w-full sm:w-48'>
                        <SelectValue placeholder='Filter by status' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='all'>All Status</SelectItem>
                        <SelectItem value='open'>Open</SelectItem>
                        <SelectItem value='investigating'>
                          Investigating
                        </SelectItem>
                        <SelectItem value='resolving'>Resolving</SelectItem>
                        <SelectItem value='resolved'>Resolved</SelectItem>
                        <SelectItem value='closed'>Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={filterCategory}
                      onValueChange={setFilterCategory}
                    >
                      <SelectTrigger className='w-full sm:w-48'>
                        <SelectValue placeholder='Filter by category' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='all'>All Categories</SelectItem>
                        <SelectItem value='security'>Security</SelectItem>
                        <SelectItem value='technical'>Technical</SelectItem>
                        <SelectItem value='financial'>Financial</SelectItem>
                        <SelectItem value='user'>User</SelectItem>
                        <SelectItem value='legal'>Legal</SelectItem>
                        <SelectItem value='other'>Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                {/* Incidents List */}
                <div className='lg:col-span-1 space-y-4'>
                  <div className='flex items-center justify-between'>
                    <h3 className='text-lg font-medium'>
                      Incidents ({filteredIncidents.length})
                    </h3>
                  </div>

                  <ScrollArea className='h-[600px]'>
                    <div className='space-y-3'>
                      {filteredIncidents.map(incident => (
                        <Card
                          key={incident.id}
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            selectedIncident?.id === incident.id
                              ? 'ring-2 ring-primary'
                              : ''
                          } ${incident.severity === 'critical' ? 'border-red-200' : ''}`}
                          onClick={() => setSelectedIncident(incident)}
                        >
                          <CardContent className='p-4'>
                            <div className='space-y-3'>
                              <div className='flex items-start justify-between'>
                                <div className='space-y-1 flex-1'>
                                  <h4 className='font-medium line-clamp-1'>
                                    {incident.title}
                                  </h4>
                                  <p className='text-sm text-muted-foreground line-clamp-2'>
                                    {incident.description}
                                  </p>
                                </div>
                                <Badge
                                  className={getStatusColor(incident.status)}
                                >
                                  {getStatusIcon(incident.status)}
                                  <span className='ml-1 capitalize'>
                                    {incident.status}
                                  </span>
                                </Badge>
                              </div>

                              <div className='flex items-center justify-between'>
                                <div className='flex items-center gap-2'>
                                  <Badge
                                    className={getSeverityColor(
                                      incident.severity
                                    )}
                                  >
                                    {getSeverityIcon(incident.severity)}
                                    <span className='ml-1 capitalize'>
                                      {incident.severity}
                                    </span>
                                  </Badge>
                                  <Badge
                                    className={getCategoryColor(
                                      incident.category
                                    )}
                                  >
                                    {getCategoryIcon(incident.category)}
                                    <span className='ml-1 capitalize'>
                                      {incident.category}
                                    </span>
                                  </Badge>
                                </div>
                                <Badge variant='outline' className='text-xs'>
                                  {incident.priority.toUpperCase()}
                                </Badge>
                              </div>

                              <div className='flex items-center justify-between text-sm text-muted-foreground'>
                                <span>
                                  {incident.affectedUsers} affected users
                                </span>
                                <span>
                                  {incident.createdAt.toLocaleDateString()}
                                </span>
                              </div>

                              {incident.assignee && (
                                <div className='text-xs text-muted-foreground'>
                                  Assigned to: {incident.assignee}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                      {filteredIncidents.length === 0 && (
                        <div className='text-center py-8'>
                          <CheckCircle className='h-12 w-12 text-green-500 mx-auto mb-4' />
                          <h3 className='text-lg font-medium mb-2'>
                            All Clear
                          </h3>
                          <p className='text-muted-foreground'>
                            {searchQuery ||
                            filterSeverity !== 'all' ||
                            filterStatus !== 'all' ||
                            filterCategory !== 'all'
                              ? 'No incidents match your current filters.'
                              : 'No active incidents at this time.'}
                          </p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>

                {/* Incident Details */}
                <div className='lg:col-span-2'>
                  {selectedIncident ? (
                    <Card>
                      <CardHeader>
                        <div className='flex items-center justify-between'>
                          <CardTitle className='flex items-center gap-2'>
                            {getSeverityIcon(selectedIncident.severity)}
                            {selectedIncident.title}
                          </CardTitle>
                          <div className='flex items-center gap-2'>
                            {selectedIncident.status === 'open' && (
                              <Button
                                size='sm'
                                onClick={() =>
                                  handleIncidentStatusChange(
                                    selectedIncident.id,
                                    'investigating'
                                  )
                                }
                              >
                                <Search className='h-4 w-4 mr-2' />
                                Start Investigation
                              </Button>
                            )}
                            {selectedIncident.status === 'investigating' && (
                              <Button
                                size='sm'
                                onClick={() =>
                                  handleIncidentStatusChange(
                                    selectedIncident.id,
                                    'resolving'
                                  )
                                }
                              >
                                <Settings className='h-4 w-4 mr-2' />
                                Begin Resolution
                              </Button>
                            )}
                            {selectedIncident.status === 'resolving' && (
                              <Button
                                size='sm'
                                onClick={() =>
                                  handleIncidentStatusChange(
                                    selectedIncident.id,
                                    'resolved'
                                  )
                                }
                              >
                                <CheckCircle className='h-4 w-4 mr-2' />
                                Mark Resolved
                              </Button>
                            )}
                            <Button size='sm' variant='outline'>
                              <Edit className='h-4 w-4 mr-2' />
                              Edit
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className='space-y-6'>
                        {/* Incident Info */}
                        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                          <div>
                            <Label className='text-sm text-muted-foreground'>
                              Severity
                            </Label>
                            <div className='mt-1'>
                              <Badge
                                className={getSeverityColor(
                                  selectedIncident.severity
                                )}
                              >
                                {getSeverityIcon(selectedIncident.severity)}
                                <span className='ml-1 capitalize'>
                                  {selectedIncident.severity}
                                </span>
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <Label className='text-sm text-muted-foreground'>
                              Category
                            </Label>
                            <div className='mt-1'>
                              <Badge
                                className={getCategoryColor(
                                  selectedIncident.category
                                )}
                              >
                                {getCategoryIcon(selectedIncident.category)}
                                <span className='ml-1 capitalize'>
                                  {selectedIncident.category}
                                </span>
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <Label className='text-sm text-muted-foreground'>
                              Priority
                            </Label>
                            <div className='mt-1'>
                              <Badge variant='outline'>
                                {selectedIncident.priority.toUpperCase()}
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <Label className='text-sm text-muted-foreground'>
                              Affected Users
                            </Label>
                            <div className='mt-1 text-sm font-medium'>
                              {selectedIncident.affectedUsers.toLocaleString()}
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* Description */}
                        <div>
                          <Label className='text-sm text-muted-foreground'>
                            Description
                          </Label>
                          <div className='mt-2 p-4 bg-muted rounded-lg'>
                            <p className='text-sm whitespace-pre-wrap'>
                              {selectedIncident.description}
                            </p>
                          </div>
                        </div>

                        {/* Affected Services */}
                        {selectedIncident.affectedServices.length > 0 && (
                          <div>
                            <Label className='text-sm text-muted-foreground'>
                              Affected Services
                            </Label>
                            <div className='mt-2 flex flex-wrap gap-2'>
                              {selectedIncident.affectedServices.map(
                                (service, index) => (
                                  <Badge
                                    key={index}
                                    variant='outline'
                                    className='flex items-center gap-1'
                                  >
                                    <Server className='h-3 w-3' />
                                    {service.replace('_', ' ')}
                                  </Badge>
                                )
                              )}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        {selectedIncident.actions.length > 0 && (
                          <div>
                            <Label className='text-sm text-muted-foreground'>
                              Actions
                            </Label>
                            <div className='mt-2 space-y-3'>
                              {selectedIncident.actions.map(action => (
                                <div
                                  key={action.id}
                                  className='p-3 border rounded-lg'
                                >
                                  <div className='flex items-center justify-between mb-2'>
                                    <h4 className='font-medium'>
                                      {action.title}
                                    </h4>
                                    <Badge
                                      className={getStatusColor(action.status)}
                                    >
                                      {action.status.replace('_', ' ')}
                                    </Badge>
                                  </div>
                                  <p className='text-sm text-muted-foreground mb-2'>
                                    {action.description}
                                  </p>
                                  <div className='flex items-center justify-between text-sm'>
                                    <span>Assigned to: {action.assignee}</span>
                                    {action.deadline && (
                                      <span>
                                        Due: {action.deadline.toLocaleString()}
                                      </span>
                                    )}
                                  </div>
                                  {action.results && (
                                    <div className='mt-2 p-2 bg-green-50 rounded text-sm'>
                                      <strong>Results:</strong> {action.results}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Timeline */}
                        <div>
                          <Label className='text-sm text-muted-foreground'>
                            Timeline
                          </Label>
                          <div className='mt-2 space-y-3'>
                            {selectedIncident.timeline.map(update => (
                              <div key={update.id} className='flex gap-3'>
                                <div className='flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2'></div>
                                <div className='flex-1'>
                                  <div className='flex items-center gap-2 mb-1'>
                                    <span className='text-sm font-medium'>
                                      {update.author}
                                    </span>
                                    <span className='text-xs text-muted-foreground'>
                                      {update.timestamp.toLocaleString()}
                                    </span>
                                    <Badge
                                      variant='outline'
                                      className='text-xs'
                                    >
                                      {update.type.replace('_', ' ')}
                                    </Badge>
                                  </div>
                                  <p className='text-sm text-muted-foreground'>
                                    {update.content}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Tags */}
                        {selectedIncident.tags.length > 0 && (
                          <div>
                            <Label className='text-sm text-muted-foreground'>
                              Tags
                            </Label>
                            <div className='mt-2 flex flex-wrap gap-2'>
                              {selectedIncident.tags.map((tag, index) => (
                                <Badge key={index} variant='secondary'>
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Metadata */}
                        <div className='text-sm text-muted-foreground'>
                          <div>
                            Created:{' '}
                            {selectedIncident.createdAt.toLocaleString()} by{' '}
                            {selectedIncident.reporter}
                          </div>
                          <div>
                            Updated:{' '}
                            {selectedIncident.updatedAt.toLocaleString()}
                          </div>
                          {selectedIncident.resolvedAt && (
                            <div>
                              Resolved:{' '}
                              {selectedIncident.resolvedAt.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className='p-12 text-center'>
                        <AlertTriangle className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                        <h3 className='text-lg font-medium mb-2'>
                          Select an Incident
                        </h3>
                        <p className='text-muted-foreground'>
                          Choose an incident to view details and manage response
                          actions.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Emergency Procedures Tab */}
            <TabsContent value='procedures' className='space-y-6'>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {procedures.map(procedure => (
                  <Card key={procedure.id}>
                    <CardHeader>
                      <div className='flex items-center justify-between'>
                        <CardTitle className='text-lg line-clamp-1'>
                          {procedure.name}
                        </CardTitle>
                        <Badge className={getSeverityColor(procedure.severity)}>
                          {getSeverityIcon(procedure.severity)}
                          <span className='ml-1 capitalize'>
                            {procedure.severity}
                          </span>
                        </Badge>
                      </div>
                      <p className='text-sm text-muted-foreground line-clamp-2'>
                        {procedure.description}
                      </p>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <div className='flex items-center justify-between'>
                        <Badge className={getCategoryColor(procedure.category)}>
                          {getCategoryIcon(procedure.category)}
                          <span className='ml-1 capitalize'>
                            {procedure.category}
                          </span>
                        </Badge>
                        <span className='text-sm font-medium'>
                          {formatDuration(procedure.estimatedTime)}
                        </span>
                      </div>

                      <div className='space-y-2'>
                        <div className='flex justify-between text-sm'>
                          <span className='text-muted-foreground'>Steps:</span>
                          <span>{procedure.steps.length}</span>
                        </div>
                        <div className='flex justify-between text-sm'>
                          <span className='text-muted-foreground'>Usage:</span>
                          <span>{procedure.usage} times</span>
                        </div>
                        <div className='flex justify-between text-sm'>
                          <span className='text-muted-foreground'>
                            Success Rate:
                          </span>
                          <span>{procedure.successRate}%</span>
                        </div>
                      </div>

                      <div className='flex gap-2'>
                        <Button size='sm' variant='outline' className='flex-1'>
                          <Eye className='h-4 w-4 mr-2' />
                          View
                        </Button>
                        <Button size='sm' className='flex-1'>
                          <PlayCircle className='h-4 w-4 mr-2' />
                          Execute
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Emergency Contacts Tab */}
            <TabsContent value='contacts' className='space-y-6'>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {contacts.map(contact => (
                  <Card key={contact.id}>
                    <CardHeader>
                      <div className='flex items-center justify-between'>
                        <CardTitle className='text-lg'>
                          {contact.name}
                        </CardTitle>
                        <Badge
                          variant={contact.isActive ? 'default' : 'secondary'}
                        >
                          {contact.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className='text-sm text-muted-foreground'>
                        {contact.role} - {contact.department}
                      </p>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <div className='space-y-2'>
                        <div className='flex items-center gap-2'>
                          <Phone className='h-4 w-4 text-muted-foreground' />
                          <span className='text-sm'>{contact.phone}</span>
                        </div>
                        <div className='flex items-center gap-2'>
                          <Mail className='h-4 w-4 text-muted-foreground' />
                          <span className='text-sm'>{contact.email}</span>
                        </div>
                        <div className='flex items-center gap-2'>
                          <Clock className='h-4 w-4 text-muted-foreground' />
                          <span className='text-sm capitalize'>
                            {contact.availability.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      <div className='flex justify-between text-sm'>
                        <span className='text-muted-foreground'>
                          Response Time:
                        </span>
                        <span>{contact.responseTime}m avg</span>
                      </div>

                      <div className='flex gap-2'>
                        <Button size='sm' variant='outline' className='flex-1'>
                          <Phone className='h-4 w-4 mr-2' />
                          Call
                        </Button>
                        <Button size='sm' variant='outline' className='flex-1'>
                          <Mail className='h-4 w-4 mr-2' />
                          Email
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Other tabs placeholder */}
            <TabsContent value='history'>
              <Card>
                <CardContent className='p-12 text-center'>
                  <Archive className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                  <h3 className='text-lg font-medium mb-2'>Incident History</h3>
                  <p className='text-muted-foreground'>
                    Historical incident data and resolution analytics.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value='settings'>
              <Card>
                <CardContent className='p-12 text-center'>
                  <Settings className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                  <h3 className='text-lg font-medium mb-2'>
                    Emergency Settings
                  </h3>
                  <p className='text-muted-foreground'>
                    Configure emergency response settings, escalation rules, and
                    notification preferences.
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

export default AdminEmergencyNew;
