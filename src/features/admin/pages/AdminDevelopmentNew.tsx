import React, { useState, useEffect } from 'react';
import { AdminPageLayout } from '@/components/admin/shared/AdminPageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import {
  Code,
  Terminal,
  Database,
  Bug,
  Zap,
  Activity,
  Settings,
  FileText,
  Download,
  Upload,
  Trash2,
  Play,
  Square,
  RefreshCw,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Server,
  Monitor,
  Cpu,
  HardDrive,
  MemoryStick,
  Network,
  Globe,
  Lock,
  Unlock,
  Key,
  Shield,
  Search,
  Filter,
  MoreHorizontal
} from 'lucide-react';

interface SystemMetric {
  id: string;
  name: string;
  value: string;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  lastUpdated: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  source: string;
  details?: any;
}

interface DatabaseQuery {
  id: string;
  name: string;
  query: string;
  description: string;
  category: 'performance' | 'data' | 'maintenance' | 'debug';
  executionTime?: number;
  lastRun?: string;
}

interface FeatureFlag {
  id: string;
  name: string;
  key: string;
  enabled: boolean;
  description: string;
  environment: 'development' | 'staging' | 'production' | 'all';
  rolloutPercentage: number;
  createdAt: string;
}

interface DeploymentInfo {
  id: string;
  version: string;
  environment: string;
  status: 'pending' | 'deploying' | 'success' | 'failed';
  deployedAt: string;
  deployedBy: string;
  changes: string[];
  rollbackAvailable: boolean;
}

const AdminDevelopmentNew: React.FC = () => {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([
    { id: '1', name: 'CPU Usage', value: '45.2', unit: '%', status: 'normal', lastUpdated: '2 minutes ago' },
    { id: '2', name: 'Memory Usage', value: '2.8', unit: 'GB', status: 'normal', lastUpdated: '2 minutes ago' },
    { id: '3', name: 'Disk Usage', value: '78.5', unit: '%', status: 'warning', lastUpdated: '2 minutes ago' },
    { id: '4', name: 'Network I/O', value: '125.6', unit: 'MB/s', status: 'normal', lastUpdated: '2 minutes ago' },
    { id: '5', name: 'Database Connections', value: '45', unit: 'active', status: 'normal', lastUpdated: '1 minute ago' },
    { id: '6', name: 'Cache Hit Rate', value: '94.2', unit: '%', status: 'normal', lastUpdated: '1 minute ago' }
  ]);

  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', timestamp: '2025-08-03 14:30:25', level: 'info', message: 'User authentication successful', source: 'auth-service', details: { userId: '12345', method: 'oauth' } },
    { id: '2', timestamp: '2025-08-03 14:29:18', level: 'warn', message: 'High memory usage detected', source: 'system-monitor', details: { usage: '85%', threshold: '80%' } },
    { id: '3', timestamp: '2025-08-03 14:28:45', level: 'error', message: 'Database query timeout', source: 'api-server', details: { query: 'SELECT * FROM tournaments', timeout: '30s' } },
    { id: '4', timestamp: '2025-08-03 14:27:32', level: 'debug', message: 'Cache miss for user profile', source: 'cache-service', details: { key: 'user:profile:67890' } },
    { id: '5', timestamp: '2025-08-03 14:26:15', level: 'info', message: 'Tournament created successfully', source: 'tournament-service', details: { tournamentId: 'T123', name: 'Summer Championship' } }
  ]);

  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([
    { id: '1', name: 'New Dashboard UI', key: 'new_dashboard_ui', enabled: true, description: 'Enable the redesigned dashboard interface', environment: 'development', rolloutPercentage: 100, createdAt: '2025-08-01' },
    { id: '2', name: 'Advanced Analytics', key: 'advanced_analytics', enabled: false, description: 'Enable advanced analytics features', environment: 'staging', rolloutPercentage: 50, createdAt: '2025-07-28' },
    { id: '3', name: 'AI Tournament Recommendations', key: 'ai_recommendations', enabled: true, description: 'AI-powered tournament recommendations', environment: 'production', rolloutPercentage: 25, createdAt: '2025-07-25' },
    { id: '4', name: 'Real-time Notifications', key: 'realtime_notifications', enabled: true, description: 'WebSocket-based real-time notifications', environment: 'all', rolloutPercentage: 75, createdAt: '2025-07-20' }
  ]);

  const [deployments, setDeployments] = useState<DeploymentInfo[]>([
    { id: '1', version: 'v8.76.1', environment: 'production', status: 'success', deployedAt: '2025-08-03 10:30:00', deployedBy: 'admin@sabo.vn', changes: ['Fixed tournament bracket generation', 'Updated ELO calculation'], rollbackAvailable: true },
    { id: '2', version: 'v8.76.0', environment: 'staging', status: 'success', deployedAt: '2025-08-02 16:45:00', deployedBy: 'dev@sabo.vn', changes: ['Added new admin features', 'Performance improvements'], rollbackAvailable: true },
    { id: '3', version: 'v8.75.9', environment: 'development', status: 'deploying', deployedAt: '2025-08-03 14:20:00', deployedBy: 'dev@sabo.vn', changes: ['Bug fixes', 'UI improvements'], rollbackAvailable: false }
  ]);

  const [selectedLogLevel, setSelectedLogLevel] = useState<string>('all');
  const [logSearch, setLogSearch] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);

  const dbQueries: DatabaseQuery[] = [
    { id: '1', name: 'Active Users Count', query: 'SELECT COUNT(*) FROM users WHERE last_active > NOW() - INTERVAL \'1 DAY\'', description: 'Count users active in the last 24 hours', category: 'performance' },
    { id: '2', name: 'Slow Queries', query: 'SELECT query, mean_exec_time FROM pg_stat_statements WHERE mean_exec_time > 1000 ORDER BY mean_exec_time DESC LIMIT 10', description: 'Find queries taking more than 1 second', category: 'performance' },
    { id: '3', name: 'Tournament Statistics', query: 'SELECT status, COUNT(*) FROM tournaments GROUP BY status', description: 'Get tournament status distribution', category: 'data' },
    { id: '4', name: 'Database Size', query: 'SELECT pg_size_pretty(pg_database_size(current_database()))', description: 'Get current database size', category: 'maintenance' },
    { id: '5', name: 'User Registration Trend', query: 'SELECT DATE(created_at), COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL \'30 DAYS\' GROUP BY DATE(created_at) ORDER BY DATE(created_at)', description: 'User registrations in the last 30 days', category: 'data' }
  ];

  const filteredLogs = logs.filter(log => {
    const levelMatch = selectedLogLevel === 'all' || log.level === selectedLogLevel;
    const searchMatch = logSearch === '' || 
      log.message.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.source.toLowerCase().includes(logSearch.toLowerCase());
    return levelMatch && searchMatch;
  });

  const getMetricStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'info': return 'text-blue-600 bg-blue-50';
      case 'warn': return 'text-yellow-600 bg-yellow-50';
      case 'error': return 'text-red-600 bg-red-50';
      case 'debug': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getDeploymentStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50';
      case 'deploying': return 'text-blue-600 bg-blue-50';
      case 'failed': return 'text-red-600 bg-red-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const toggleFeatureFlag = (id: string) => {
    setFeatureFlags(flags => 
      flags.map(flag => 
        flag.id === id ? { ...flag, enabled: !flag.enabled } : flag
      )
    );
  };

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        // Simulate real-time updates
        setSystemMetrics(metrics => 
          metrics.map(metric => ({
            ...metric,
            value: (parseFloat(metric.value) + (Math.random() - 0.5) * 5).toFixed(1),
            lastUpdated: 'Just now'
          }))
        );
      }, refreshInterval * 1000);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  return (
    <AdminPageLayout
      title="Development Tools"
      description="System monitoring, debugging tools, and development utilities"
    >
      <Tabs defaultValue="system-monitor" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="system-monitor" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            System Monitor
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Logs
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Database
          </TabsTrigger>
          <TabsTrigger value="feature-flags" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Feature Flags
          </TabsTrigger>
          <TabsTrigger value="deployments" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            Deployments
          </TabsTrigger>
          <TabsTrigger value="tools" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Tools
          </TabsTrigger>
        </TabsList>

        <TabsContent value="system-monitor" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">System Metrics</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={autoRefresh}
                  onCheckedChange={setAutoRefresh}
                />
                <Label>Auto Refresh</Label>
              </div>
              <Select value={refreshInterval.toString()} onValueChange={(value) => setRefreshInterval(parseInt(value))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5s</SelectItem>
                  <SelectItem value="10">10s</SelectItem>
                  <SelectItem value="30">30s</SelectItem>
                  <SelectItem value="60">1m</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {systemMetrics.map((metric) => (
              <Card key={metric.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                    <div className={`w-3 h-3 rounded-full ${
                      metric.status === 'normal' ? 'bg-green-500' :
                      metric.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-end gap-1">
                      <span className={`text-2xl font-bold ${getMetricStatusColor(metric.status)}`}>
                        {metric.value}
                      </span>
                      <span className="text-sm text-gray-500">{metric.unit}</span>
                    </div>
                    <p className="text-xs text-gray-500">Updated {metric.lastUpdated}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">System Logs</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search logs..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="w-64"
                />
              </div>
              <Select value={selectedLogLevel} onValueChange={setSelectedLogLevel}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warn">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="debug">Debug</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="border-b p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Badge className={`${getLogLevelColor(log.level)} border-0`}>
                          {log.level.toUpperCase()}
                        </Badge>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{log.message}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{log.timestamp}</span>
                            <span>Source: {log.source}</span>
                          </div>
                          {log.details && (
                            <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-x-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Database Tools</h3>
            <Button variant="outline">
              <Terminal className="h-4 w-4 mr-2" />
              Open DB Console
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Queries</CardTitle>
                <CardDescription>Pre-built queries for common tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {dbQueries.map((query) => (
                  <div key={query.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{query.name}</h4>
                      <Badge variant="outline">{query.category}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{query.description}</p>
                    <div className="flex items-center gap-2">
                      <Button size="sm">
                        <Play className="h-3 w-3 mr-1" />
                        Run
                      </Button>
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3 mr-1" />
                        View SQL
                      </Button>
                    </div>
                    {query.executionTime && (
                      <p className="text-xs text-gray-500 mt-2">
                        Last run: {query.lastRun} ({query.executionTime}ms)
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Custom Query</CardTitle>
                <CardDescription>Execute custom SQL queries</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>SQL Query</Label>
                  <Textarea
                    placeholder="SELECT * FROM users LIMIT 10;"
                    className="font-mono text-sm"
                    rows={8}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button>
                    <Play className="h-4 w-4 mr-2" />
                    Execute Query
                  </Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export Results
                  </Button>
                </div>
                <div className="text-xs text-gray-500">
                  <p>⚠️ Use caution with UPDATE/DELETE queries</p>
                  <p>🔒 Read-only mode enabled for safety</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="feature-flags" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Feature Flags</h3>
            <Button>
              <Zap className="h-4 w-4 mr-2" />
              New Flag
            </Button>
          </div>

          <div className="space-y-4">
            {featureFlags.map((flag) => (
              <Card key={flag.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium">{flag.name}</h4>
                        <Badge variant={flag.enabled ? "default" : "secondary"}>
                          {flag.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                        <Badge variant="outline">{flag.environment}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">{flag.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Key: {flag.key}</span>
                        <span>Rollout: {flag.rolloutPercentage}%</span>
                        <span>Created: {flag.createdAt}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={flag.enabled}
                        onCheckedChange={() => toggleFeatureFlag(flag.id)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="deployments" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Deployments</h3>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              New Deployment
            </Button>
          </div>

          <div className="space-y-4">
            {deployments.map((deployment) => (
              <Card key={deployment.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium">{deployment.version}</h4>
                      <Badge className={getDeploymentStatusColor(deployment.status)}>
                        {deployment.status}
                      </Badge>
                      <Badge variant="outline">{deployment.environment}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {deployment.rollbackAvailable && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Rollback
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirm Rollback</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to rollback {deployment.version} in {deployment.environment}?
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction className="bg-red-600 hover:bg-red-700">
                                Rollback
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      <Button variant="outline" size="sm">
                        <Eye className="h-3 w-3 mr-1" />
                        Details
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Deployed: {deployment.deployedAt}</span>
                      <span>By: {deployment.deployedBy}</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Changes:</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {deployment.changes.map((change, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            {change}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tools" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trash2 className="h-5 w-5" />
                  Cache Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" variant="outline">
                  Clear All Cache
                </Button>
                <Button className="w-full" variant="outline">
                  Clear User Sessions
                </Button>
                <Button className="w-full" variant="outline">
                  Clear Tournament Cache
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Data Export
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" variant="outline">
                  Export System Logs
                </Button>
                <Button className="w-full" variant="outline">
                  Export Metrics
                </Button>
                <Button className="w-full" variant="outline">
                  Export Database Backup
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bug className="h-5 w-5" />
                  Debug Tools
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" variant="outline">
                  Generate Test Data
                </Button>
                <Button className="w-full" variant="outline">
                  Run Health Check
                </Button>
                <Button className="w-full" variant="outline">
                  Performance Profiler
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </AdminPageLayout>
  );
};

export default AdminDevelopmentNew;
