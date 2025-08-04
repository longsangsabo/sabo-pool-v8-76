import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  ArrowRight, 
  BarChart3,
  Users,
  Building,
  Receipt,
  Trophy,
  Settings,
  Database,
  Zap,
  TrendingUp
} from 'lucide-react';
import { AdminCoreProvider } from '@/components/admin/core/AdminCoreProvider';
import { AdminPageLayout } from '@/components/admin/shared/AdminPageLayout';

interface MigrationItem {
  id: string;
  name: string;
  description: string;
  status: 'completed' | 'in-progress' | 'pending' | 'deprecated';
  oldPath: string;
  newPath: string;
  icon: React.ComponentType<any>;
  priority: 'high' | 'medium' | 'low';
  estimatedTime: string;
  benefits: string[];
  dependencies?: string[];
}

const AdminMigrationDashboard = () => {
  const [selectedItem, setSelectedItem] = useState<MigrationItem | null>(null);

    const migrationComponents = [
    { name: 'AdminClubsNew', status: 'completed', description: 'Modern club management system', progress: 100 },
    { name: 'AdminUsersNew', status: 'completed', description: 'Enhanced user management', progress: 100 },
    { name: 'AdminTransactionsNew', status: 'completed', description: 'Advanced transaction handling', progress: 100 },
    { name: 'AdminTournamentsNew', status: 'completed', description: 'Complete tournament system', progress: 100 },
    { name: 'AdminAnalyticsNew', status: 'completed', description: 'Advanced analytics dashboard', progress: 100 },
    { name: 'AdminSettingsNew', status: 'completed', description: 'Comprehensive settings management', progress: 100 },
    { name: 'AdminDatabaseNew', status: 'completed', description: 'Database administration tools', progress: 100 },
    { name: 'AdminAutomationNew', status: 'completed', description: 'Workflow automation center', progress: 100 },
  ];

  const getStatusColor = (status: MigrationItem['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'deprecated': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: MigrationItem['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'in-progress': return <Clock className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'deprecated': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: MigrationItem['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-orange-100 text-orange-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const completedItems = migrationItems.filter(item => item.status === 'completed').length;
  const totalItems = migrationItems.length;
  const progressPercentage = (completedItems / totalItems) * 100;

  const stats = [
    {
      title: 'Migration Progress',
      value: `${completedItems}/${totalItems}`,
      description: 'Pages migrated',
      icon: TrendingUp,
    },
    {
      title: 'Completion Rate',
      value: `${Math.round(progressPercentage)}%`,
      description: 'Overall progress',
      icon: BarChart3,
    },
    {
      title: 'High Priority',
      value: migrationItems.filter(item => item.priority === 'high' && item.status !== 'completed').length.toString(),
      description: 'Items remaining',
      icon: AlertTriangle,
    },
    {
      title: 'Estimated Time',
      value: '10-15',
      description: 'Days remaining',
      icon: Clock,
    },
  ];

  return (
    <AdminCoreProvider>
      <AdminPageLayout
        title="Admin System Migration"
        description="Theo dõi tiến độ migration từ hệ thống cũ sang hệ thống admin mới"
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
          {/* Overall Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Migration Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm text-muted-foreground">{completedItems} of {totalItems} completed</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{completedItems}</div>
                    <div className="text-sm text-muted-foreground">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {migrationItems.filter(item => item.status === 'in-progress').length}
                    </div>
                    <div className="text-sm text-muted-foreground">In Progress</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {migrationItems.filter(item => item.status === 'pending').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Pending</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Migration Items */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {migrationItems.map((item) => (
              <Card key={item.id} className={`cursor-pointer transition-all hover:shadow-md ${
                selectedItem?.id === item.id ? 'ring-2 ring-primary' : ''
              }`} onClick={() => setSelectedItem(item)}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <item.icon className="h-6 w-6 text-primary" />
                      <div>
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={getStatusColor(item.status)}>
                        {getStatusIcon(item.status)}
                        <span className="ml-1 capitalize">{item.status}</span>
                      </Badge>
                      <Badge variant="outline" className={getPriorityColor(item.priority)}>
                        {item.priority} priority
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>Old: <code>{item.oldPath}</code></span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <span>New: <code>{item.newPath}</code></span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <strong>Estimated Time:</strong> {item.estimatedTime}
                    </div>
                    {item.status === 'completed' && (
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(item.newPath, '_blank');
                        }}
                      >
                        View New Version
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Selected Item Details */}
          {selectedItem && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <selectedItem.icon className="h-5 w-5" />
                  {selectedItem.name} - Benefits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Key Benefits:</h4>
                    <ul className="space-y-2">
                      {selectedItem.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3">Migration Details:</h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>Status:</strong> <Badge className={getStatusColor(selectedItem.status)}>{selectedItem.status}</Badge></div>
                      <div><strong>Priority:</strong> <Badge className={getPriorityColor(selectedItem.priority)}>{selectedItem.priority}</Badge></div>
                      <div><strong>Time Required:</strong> {selectedItem.estimatedTime}</div>
                      <div><strong>Old Path:</strong> <code>{selectedItem.oldPath}</code></div>
                      <div><strong>New Path:</strong> <code>{selectedItem.newPath}</code></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </AdminPageLayout>
    </AdminCoreProvider>
  );
};

export default AdminMigrationDashboard;
