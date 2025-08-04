import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Switch } from '@/shared/components/ui/switch';
import { Textarea } from '@/shared/components/ui/textarea';
import { Progress } from '@/shared/components/ui/progress';
import { Separator } from '@/shared/components/ui/separator';
import { 
  Zap, 
  Play, 
  Pause,
  Square,
  Plus,
  Trash2,
  Edit,
  Save,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertTriangle,
  Settings,
  BarChart3,
  Calendar,
  Mail,
  Database,
  Users,
  Trophy,
  Building,
  Target,
  GitBranch,
  Workflow,
  Timer,
  Bell
} from 'lucide-react';
import { AdminCoreProvider } from '@/features/admin/components/core/AdminCoreProvider';
import { AdminPageLayout } from '@/features/admin/components/shared/AdminPageLayout';
import { toast } from 'sonner';

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: AutomationTrigger;
  actions: AutomationAction[];
  status: 'active' | 'paused' | 'disabled';
  lastRun: Date | null;
  nextRun: Date | null;
  runCount: number;
  successRate: number;
}

interface AutomationTrigger {
  type: 'schedule' | 'event' | 'webhook' | 'manual';
  config: any;
}

interface AutomationAction {
  id: string;
  type: 'email' | 'database' | 'api' | 'notification';
  config: any;
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  triggers: string[];
  actions: string[];
  popularity: number;
}

const AdminAutomationNew = () => {
  const [selectedRule, setSelectedRule] = useState<AutomationRule | null>(null);
  const [isCreatingRule, setIsCreatingRule] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');

  // Mock automation rules
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([
    {
      id: '1',
      name: 'Daily User Activity Report',
      description: 'Send daily email report with user activity statistics',
      trigger: { type: 'schedule', config: { cron: '0 9 * * *' } },
      actions: [
        { id: '1', type: 'database', config: { query: 'SELECT COUNT(*) FROM users WHERE last_active > NOW() - INTERVAL 1 DAY' } },
        { id: '2', type: 'email', config: { recipients: ['admin@sabopool.com'], template: 'daily-report' } }
      ],
      status: 'active',
      lastRun: new Date('2025-08-03T09:00:00'),
      nextRun: new Date('2025-08-04T09:00:00'),
      runCount: 45,
      successRate: 97.8
    },
    {
      id: '2',
      name: 'Tournament Reminder',
      description: 'Send reminder emails 24 hours before tournament starts',
      trigger: { type: 'schedule', config: { cron: '0 12 * * *' } },
      actions: [
        { id: '1', type: 'database', config: { query: 'SELECT * FROM tournaments WHERE start_date = DATE_ADD(NOW(), INTERVAL 1 DAY)' } },
        { id: '2', type: 'email', config: { template: 'tournament-reminder' } }
      ],
      status: 'active',
      lastRun: new Date('2025-08-03T12:00:00'),
      nextRun: new Date('2025-08-04T12:00:00'),
      runCount: 23,
      successRate: 100
    },
    {
      id: '3',
      name: 'Inactive User Cleanup',
      description: 'Mark users as inactive if no activity for 90 days',
      trigger: { type: 'schedule', config: { cron: '0 2 1 * *' } },
      actions: [
        { id: '1', type: 'database', config: { query: 'UPDATE users SET status = "inactive" WHERE last_active < NOW() - INTERVAL 90 DAY' } },
        { id: '2', type: 'notification', config: { message: 'Inactive user cleanup completed' } }
      ],
      status: 'active',
      lastRun: new Date('2025-08-01T02:00:00'),
      nextRun: new Date('2025-09-01T02:00:00'),
      runCount: 12,
      successRate: 95.5
    },
    {
      id: '4',
      name: 'Database Backup Alert',
      description: 'Monitor backup completion and send alerts on failure',
      trigger: { type: 'event', config: { event: 'backup_completed' } },
      actions: [
        { id: '1', type: 'email', config: { recipients: ['tech@sabopool.com'], template: 'backup-status' } },
        { id: '2', type: 'notification', config: { channel: 'slack', webhook: 'https://hooks.slack.com/...' } }
      ],
      status: 'paused',
      lastRun: new Date('2025-08-02T23:30:00'),
      nextRun: null,
      runCount: 67,
      successRate: 98.5
    }
  ]);

  // Mock workflow templates
  const workflowTemplates: WorkflowTemplate[] = [
    {
      id: '1',
      name: 'Welcome New User',
      description: 'Send welcome email and setup default preferences',
      category: 'User Management',
      triggers: ['user_registered'],
      actions: ['send_email', 'set_preferences'],
      popularity: 95
    },
    {
      id: '2',
      name: 'Tournament Lifecycle',
      description: 'Automated tournament notifications and updates',
      category: 'Tournament',
      triggers: ['tournament_created', 'tournament_started'],
      actions: ['notify_participants', 'update_status'],
      popularity: 87
    },
    {
      id: '3',
      name: 'Payment Processing',
      description: 'Handle payment confirmations and receipts',
      category: 'Finance',
      triggers: ['payment_received'],
      actions: ['update_balance', 'send_receipt'],
      popularity: 92
    },
    {
      id: '4',
      name: 'System Health Check',
      description: 'Monitor system performance and send alerts',
      category: 'Monitoring',
      triggers: ['scheduled_check'],
      actions: ['check_resources', 'send_alert'],
      popularity: 78
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'disabled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Play className="h-4 w-4" />;
      case 'paused':
        return <Pause className="h-4 w-4" />;
      case 'disabled':
        return <Square className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case 'schedule':
        return <Clock className="h-4 w-4" />;
      case 'event':
        return <Zap className="h-4 w-4" />;
      case 'webhook':
        return <GitBranch className="h-4 w-4" />;
      case 'manual':
        return <Target className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'api':
        return <GitBranch className="h-4 w-4" />;
      case 'notification':
        return <Bell className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const toggleRuleStatus = (ruleId: string) => {
    setAutomationRules(prev => 
      prev.map(rule => 
        rule.id === ruleId 
          ? { 
              ...rule, 
              status: rule.status === 'active' ? 'paused' : 'active'
            }
          : rule
      )
    );
    toast.success('Rule status updated successfully!');
  };

  const runRuleManually = (rule: AutomationRule) => {
    toast.info(`Running "${rule.name}" manually...`);
    // Simulate manual execution
    setTimeout(() => {
      setAutomationRules(prev => 
        prev.map(r => 
          r.id === rule.id 
            ? { 
                ...r, 
                lastRun: new Date(),
                runCount: r.runCount + 1
              }
            : r
        )
      );
      toast.success('Rule executed successfully!');
    }, 2000);
  };

  const createNewRule = () => {
    if (!newRuleName.trim()) {
      toast.error('Please enter a rule name');
      return;
    }

    const newRule: AutomationRule = {
      id: Date.now().toString(),
      name: newRuleName,
      description: 'New automation rule',
      trigger: { type: 'manual', config: {} },
      actions: [],
      status: 'disabled',
      lastRun: null,
      nextRun: null,
      runCount: 0,
      successRate: 0
    };

    setAutomationRules(prev => [...prev, newRule]);
    setNewRuleName('');
    setIsCreatingRule(false);
    toast.success('New automation rule created!');
  };

  const stats = [
    {
      title: 'Active Rules',
      value: automationRules.filter(r => r.status === 'active').length.toString(),
      description: 'Currently running',
      icon: Play,
    },
    {
      title: 'Total Executions',
      value: automationRules.reduce((sum, rule) => sum + rule.runCount, 0).toLocaleString(),
      description: 'All time',
      icon: BarChart3,
    },
    {
      title: 'Success Rate',
      value: `${Math.round(automationRules.reduce((sum, rule) => sum + rule.successRate, 0) / automationRules.length)}%`,
      description: 'Average success',
      icon: CheckCircle,
    },
    {
      title: 'Next Run',
      value: '2 hours',
      description: 'Next scheduled',
      icon: Timer,
    },
  ];

  const pageActions = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm">
        <Workflow className="h-4 w-4 mr-2" />
        Templates
      </Button>
      <Button variant="outline" size="sm">
        <BarChart3 className="h-4 w-4 mr-2" />
        Analytics
      </Button>
      <Button 
        onClick={() => setIsCreatingRule(true)}
        size="sm"
      >
        <Plus className="h-4 w-4 mr-2" />
        New Rule
      </Button>
    </div>
  );

  return (
    <AdminCoreProvider>
      <AdminPageLayout
        title="Automation Center"
        description="Create and manage automated workflows and rules"
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
          <Tabs defaultValue="rules" className="space-y-6">
            <TabsList>
              <TabsTrigger value="rules">Automation Rules</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="history">Execution History</TabsTrigger>
              <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            </TabsList>

            {/* Automation Rules */}
            <TabsContent value="rules" className="space-y-6">
              {/* Create New Rule Modal */}
              {isCreatingRule && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle>Create New Automation Rule</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Rule Name</Label>
                      <Input
                        value={newRuleName}
                        onChange={(e) => setNewRuleName(e.target.value)}
                        placeholder="Enter rule name..."
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button onClick={createNewRule}>
                        <Save className="h-4 w-4 mr-2" />
                        Create Rule
                      </Button>
                      <Button variant="outline" onClick={() => setIsCreatingRule(false)}>
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Rules List */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {automationRules.map((rule) => (
                  <Card key={rule.id} className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedRule?.id === rule.id ? 'ring-2 ring-primary' : ''
                  }`} onClick={() => setSelectedRule(rule)}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{rule.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{rule.description}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge className={getStatusColor(rule.status)}>
                            {getStatusIcon(rule.status)}
                            <span className="ml-1 capitalize">{rule.status}</span>
                          </Badge>
                          <div className="text-xs text-muted-foreground">
                            {rule.successRate.toFixed(1)}% success
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Trigger */}
                        <div className="flex items-center gap-2 text-sm">
                          {getTriggerIcon(rule.trigger.type)}
                          <span className="font-medium">Trigger:</span>
                          <span className="text-muted-foreground capitalize">{rule.trigger.type}</span>
                        </div>

                        {/* Actions */}
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Actions:</div>
                          <div className="flex flex-wrap gap-1">
                            {rule.actions.map((action) => (
                              <Badge key={action.id} variant="outline" className="text-xs">
                                {getActionIcon(action.type)}
                                <span className="ml-1 capitalize">{action.type}</span>
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Schedule Info */}
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div>Runs: {rule.runCount} times</div>
                          {rule.lastRun && (
                            <div>Last: {rule.lastRun.toLocaleString()}</div>
                          )}
                          {rule.nextRun && (
                            <div>Next: {rule.nextRun.toLocaleString()}</div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRuleStatus(rule.id);
                            }}
                          >
                            {rule.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              runRuleManually(rule);
                            }}
                          >
                            <Zap className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Templates */}
            <TabsContent value="templates" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Workflow className="h-5 w-5" />
                    Workflow Templates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {workflowTemplates.map((template) => (
                      <div key={template.id} className="p-4 border rounded-lg">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">{template.name}</h3>
                            <Badge variant="outline">{template.category}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{template.description}</p>
                          <div className="space-y-2">
                            <div className="text-xs">
                              <span className="font-medium">Triggers: </span>
                              {template.triggers.join(', ')}
                            </div>
                            <div className="text-xs">
                              <span className="font-medium">Actions: </span>
                              {template.actions.join(', ')}
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-muted-foreground">
                              {template.popularity}% popular
                            </div>
                            <Button size="sm" variant="outline">
                              Use Template
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Execution History */}
            <TabsContent value="history" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Recent Executions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {automationRules.slice(0, 5).map((rule) => (
                      <div key={rule.id} className="flex items-center justify-between p-3 border rounded">
                        <div className="space-y-1">
                          <div className="font-medium">{rule.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {rule.lastRun ? rule.lastRun.toLocaleString() : 'Never run'}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-sm font-medium">{rule.runCount} runs</div>
                            <div className="text-xs text-muted-foreground">
                              {rule.successRate.toFixed(1)}% success
                            </div>
                          </div>
                          <Badge className={getStatusColor(rule.status)}>
                            {getStatusIcon(rule.status)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Monitoring */}
            <TabsContent value="monitoring" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>System Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>CPU Usage</span>
                          <span>23%</span>
                        </div>
                        <Progress value={23} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Memory Usage</span>
                          <span>67%</span>
                        </div>
                        <Progress value={67} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Queue Size</span>
                          <span>12 jobs</span>
                        </div>
                        <Progress value={12} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Automation Health</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <div>
                          <div className="text-sm font-medium">All systems operational</div>
                          <div className="text-xs text-muted-foreground">Last checked: 30 seconds ago</div>
                        </div>
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <div className="text-sm">Recent Issues:</div>
                        <div className="text-xs text-muted-foreground">
                          No issues in the last 24 hours
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </AdminPageLayout>
    </AdminCoreProvider>
  );
};

export default AdminAutomationNew;
