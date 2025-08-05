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
import { Textarea } from '@/shared/components/ui/textarea';
import { Progress } from '@/shared/components/ui/progress';
import {
  Database,
  Play,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  HardDrive,
  Activity,
  BarChart3,
  Search,
  Filter,
  Trash2,
  Settings,
  Shield,
  Zap,
  FileText,
  Save,
} from 'lucide-react';
import { AdminCoreProvider } from '@/features/admin/components/core/AdminCoreProvider';
import { AdminPageLayout } from '@/features/admin/components/shared/AdminPageLayout';
import { toast } from 'sonner';

interface DatabaseMetric {
  name: string;
  value: string | number;
  description: string;
  status: 'good' | 'warning' | 'critical';
  icon: React.ComponentType<any>;
}

interface QueryResult {
  id: string;
  query: string;
  duration: number;
  rows: number;
  status: 'success' | 'error';
  timestamp: Date;
  error?: string;
}

interface BackupItem {
  id: string;
  name: string;
  size: string;
  date: Date;
  type: 'full' | 'incremental';
  status: 'completed' | 'running' | 'failed';
}

const AdminDatabaseNew = () => {
  const { t } = useTranslation();
  const [queryText, setQueryText] = useState('');
  const [executing, setExecuting] = useState(false);
  const [queryResults, setQueryResults] = useState<QueryResult[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');

  // Mock database metrics
  const metrics: DatabaseMetric[] = [
    {
      name: 'Database Size',
      value: '2.3 GB',
      description: 'Total database storage used',
      status: 'good',
      icon: HardDrive,
    },
    {
      name: 'Active Connections',
      value: 12,
      description: 'Current database connections',
      status: 'good',
      icon: Activity,
    },
    {
      name: 'Queries/Second',
      value: 85,
      description: 'Average queries per second',
      status: 'warning',
      icon: BarChart3,
    },
    {
      name: 'Cache Hit Rate',
      value: '94.2%',
      description: 'Database cache efficiency',
      status: 'good',
      icon: Zap,
    },
  ];

  // Mock table data
  const tables = [
    { name: 'users', rows: 12547, size: '45.2 MB', last_update: '2 mins ago' },
    {
      name: 'tournaments',
      rows: 234,
      size: '12.8 MB',
      last_update: '5 mins ago',
    },
    { name: 'clubs', rows: 89, size: '3.4 MB', last_update: '1 hour ago' },
    {
      name: 'transactions',
      rows: 8932,
      size: '67.1 MB',
      last_update: '30 secs ago',
    },
    {
      name: 'challenges',
      rows: 1567,
      size: '8.9 MB',
      last_update: '15 mins ago',
    },
  ];

  // Mock backup history
  const backups: BackupItem[] = [
    {
      id: '1',
      name: 'backup_2025_08_03_00_00',
      size: '2.1 GB',
      date: new Date('2025-08-03T00:00:00'),
      type: 'full',
      status: 'completed',
    },
    {
      id: '2',
      name: 'backup_2025_08_02_12_00',
      size: '156 MB',
      date: new Date('2025-08-02T12:00:00'),
      type: 'incremental',
      status: 'completed',
    },
    {
      id: '3',
      name: 'backup_2025_08_02_00_00',
      size: '2.0 GB',
      date: new Date('2025-08-02T00:00:00'),
      type: 'full',
      status: 'completed',
    },
  ];

  const executeQuery = async () => {
    if (!queryText.trim()) {
      toast.error('Please enter a query');
      return;
    }

    setExecuting(true);
    try {
      // Simulate query execution
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newResult: QueryResult = {
        id: Date.now().toString(),
        query: queryText,
        duration: Math.random() * 1000,
        rows: Math.floor(Math.random() * 1000),
        status: Math.random() > 0.2 ? 'success' : 'error',
        timestamp: new Date(),
        error:
          Math.random() > 0.2 ? undefined : 'Syntax error: unexpected token',
      };

      setQueryResults(prev => [newResult, ...prev.slice(0, 9)]);

      if (newResult.status === 'success') {
        toast.success(
          `Query executed successfully in ${newResult.duration.toFixed(2)}ms`
        );
      } else {
        toast.error('Query failed to execute');
      }
    } catch (error) {
      toast.error('Failed to execute query');
    } finally {
      setExecuting(false);
    }
  };

  const createBackup = async () => {
    toast.info('Starting database backup...');
    // Simulate backup process
    await new Promise(resolve => setTimeout(resolve, 3000));
    toast.success('Database backup completed successfully!');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
      case 'success':
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'warning':
      case 'running':
        return 'text-yellow-600 bg-yellow-100';
      case 'critical':
      case 'error':
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
      case 'success':
      case 'completed':
        return <CheckCircle className='h-4 w-4' />;
      case 'warning':
      case 'running':
        return <Clock className='h-4 w-4' />;
      case 'critical':
      case 'error':
      case 'failed':
        return <AlertTriangle className='h-4 w-4' />;
      default:
        return <Clock className='h-4 w-4' />;
    }
  };

  const pageActions = (
    <div className='flex items-center gap-2'>
      <Button variant='outline' size='sm' onClick={createBackup}>
        <Download className='h-4 w-4 mr-2' />
        Create Backup
      </Button>
      <Button variant='outline' size='sm'>
        <Shield className='h-4 w-4 mr-2' />
        Security Scan
      </Button>
      <Button variant='outline' size='sm'>
        <Settings className='h-4 w-4 mr-2' />
        Optimize
      </Button>
    </div>
  );

  return (
    <AdminCoreProvider>
      <AdminPageLayout
        title={t('database.title')}
        description={t('database.description')}
        actions={pageActions}
      >
        <div className='space-y-6'>
          {/* Database Metrics */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            {metrics.map((metric, index) => (
              <Card key={index}>
                <CardContent className='p-6'>
                  <div className='flex items-center justify-between'>
                    <div className='space-y-1'>
                      <p className='text-sm text-muted-foreground'>
                        {metric.name}
                      </p>
                      <p className='text-2xl font-bold'>{metric.value}</p>
                      <Badge className={getStatusColor(metric.status)}>
                        {getStatusIcon(metric.status)}
                        <span className='ml-1 capitalize'>{metric.status}</span>
                      </Badge>
                    </div>
                    <metric.icon className='h-8 w-8 text-muted-foreground' />
                  </div>
                  <p className='text-xs text-muted-foreground mt-3'>
                    {metric.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Database Operations Tabs */}
          <Tabs defaultValue='query' className='space-y-6'>
            <TabsList>
              <TabsTrigger value='query'>Query Console</TabsTrigger>
              <TabsTrigger value='tables'>Tables</TabsTrigger>
              <TabsTrigger value='backups'>Backups</TabsTrigger>
              <TabsTrigger value='performance'>Performance</TabsTrigger>
            </TabsList>

            {/* Query Console */}
            <TabsContent value='query' className='space-y-6'>
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Database className='h-5 w-5' />
                    SQL Query Console
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='space-y-2'>
                    <Label>SQL Query</Label>
                    <Textarea
                      value={queryText}
                      onChange={e => setQueryText(e.target.value)}
                      placeholder='Enter your SQL query here...'
                      rows={6}
                      className='font-mono text-sm'
                    />
                  </div>
                  <div className='flex items-center gap-2'>
                    <Button
                      onClick={executeQuery}
                      disabled={executing || !queryText.trim()}
                    >
                      {executing ? (
                        <RefreshCw className='h-4 w-4 mr-2 animate-spin' />
                      ) : (
                        <Play className='h-4 w-4 mr-2' />
                      )}
                      {executing ? 'Executing...' : 'Execute Query'}
                    </Button>
                    <Button variant='outline' onClick={() => setQueryText('')}>
                      Clear
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Query Results */}
              {queryResults.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Query History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-4'>
                      {queryResults.map(result => (
                        <div key={result.id} className='p-4 border rounded-lg'>
                          <div className='flex items-center justify-between mb-2'>
                            <Badge className={getStatusColor(result.status)}>
                              {getStatusIcon(result.status)}
                              <span className='ml-1 capitalize'>
                                {result.status}
                              </span>
                            </Badge>
                            <span className='text-xs text-muted-foreground'>
                              {result.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                          <pre className='text-sm bg-muted p-3 rounded font-mono overflow-x-auto'>
                            {result.query}
                          </pre>
                          {result.status === 'success' ? (
                            <div className='text-sm text-muted-foreground mt-2'>
                              Returned {result.rows} rows in{' '}
                              {result.duration.toFixed(2)}ms
                            </div>
                          ) : (
                            <div className='text-sm text-red-600 mt-2'>
                              Error: {result.error}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Tables Overview */}
            <TabsContent value='tables' className='space-y-6'>
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <FileText className='h-5 w-5' />
                    Database Tables
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    {tables.map((table, index) => (
                      <div
                        key={index}
                        className='flex items-center justify-between p-4 border rounded-lg'
                      >
                        <div className='space-y-1'>
                          <div className='font-medium'>{table.name}</div>
                          <div className='text-sm text-muted-foreground'>
                            {table.rows.toLocaleString()} rows • {table.size} •
                            Updated {table.last_update}
                          </div>
                        </div>
                        <div className='flex items-center gap-2'>
                          <Button variant='outline' size='sm'>
                            <Search className='h-4 w-4 mr-2' />
                            Browse
                          </Button>
                          <Button variant='outline' size='sm'>
                            <Download className='h-4 w-4 mr-2' />
                            Export
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Backups */}
            <TabsContent value='backups' className='space-y-6'>
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Download className='h-5 w-5' />
                    Database Backups
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    {backups.map(backup => (
                      <div
                        key={backup.id}
                        className='flex items-center justify-between p-4 border rounded-lg'
                      >
                        <div className='space-y-1'>
                          <div className='font-medium'>{backup.name}</div>
                          <div className='text-sm text-muted-foreground'>
                            {backup.size} • {backup.date.toLocaleString()} •{' '}
                            {backup.type} backup
                          </div>
                        </div>
                        <div className='flex items-center gap-2'>
                          <Badge className={getStatusColor(backup.status)}>
                            {getStatusIcon(backup.status)}
                            <span className='ml-1 capitalize'>
                              {backup.status}
                            </span>
                          </Badge>
                          <Button variant='outline' size='sm'>
                            <Download className='h-4 w-4 mr-2' />
                            Download
                          </Button>
                          <Button variant='outline' size='sm'>
                            <Upload className='h-4 w-4 mr-2' />
                            Restore
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Performance */}
            <TabsContent value='performance' className='space-y-6'>
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                <Card>
                  <CardHeader>
                    <CardTitle>Query Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-4'>
                      <div>
                        <div className='flex justify-between text-sm mb-1'>
                          <span>Slow Queries</span>
                          <span>23 queries {'>'}1s</span>
                        </div>
                        <Progress value={15} className='h-2' />
                      </div>
                      <div>
                        <div className='flex justify-between text-sm mb-1'>
                          <span>Index Usage</span>
                          <span>87% queries use indexes</span>
                        </div>
                        <Progress value={87} className='h-2' />
                      </div>
                      <div>
                        <div className='flex justify-between text-sm mb-1'>
                          <span>Lock Waits</span>
                          <span>2% queries waiting</span>
                        </div>
                        <Progress value={2} className='h-2' />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Storage Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-4'>
                      <div>
                        <div className='flex justify-between text-sm mb-1'>
                          <span>Data</span>
                          <span>1.8 GB</span>
                        </div>
                        <Progress value={78} className='h-2' />
                      </div>
                      <div>
                        <div className='flex justify-between text-sm mb-1'>
                          <span>Indexes</span>
                          <span>0.4 GB</span>
                        </div>
                        <Progress value={17} className='h-2' />
                      </div>
                      <div>
                        <div className='flex justify-between text-sm mb-1'>
                          <span>Logs</span>
                          <span>0.1 GB</span>
                        </div>
                        <Progress value={5} className='h-2' />
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

export default AdminDatabaseNew;
