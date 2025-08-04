import React, { useState, lazy, Suspense } from 'react';
import {
  Code,
  AlertTriangle,
  BarChart3,
  ExternalLink,
  Search,
  Keyboard,
  Users,
  Settings,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import ErrorBoundary from '@/components/ui/error-boundary';
import { LoadingState } from '@/components/ui/loading-state';

// Lazy load remaining components
const UserTestingManager = lazy(() => import('./UserTestingManager'));
const MasterDataPopulator = lazy(() => import('./MasterDataPopulator'));
const SystemManagementHub = lazy(() => import('./SystemManagementHub'));

const DevelopmentTools = () => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('users');

  const tabs = [
    {
      id: 'users',
      label: 'Users',
      icon: 'Users',
      description: 'Manage demo users and create test accounts',
    },
    {
      id: 'data',
      label: 'Data',
      icon: 'Database',
      description: 'Populate test data and manage datasets',
    },
    {
      id: 'system',
      label: 'System',
      icon: 'Settings',
      description: 'Monitor system health and manage components',
    },
  ];

  const filteredTabs = tabs.filter(
    tab =>
      tab.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tab.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className='space-y-6'>
      {/* Header with enhanced navigation */}
      <div className='flex flex-col lg:flex-row lg:items-center justify-between gap-4'>
        <div className='flex items-center gap-2'>
          <Code className='w-6 h-6 text-primary' />
          <h1 className='text-2xl font-bold'>{t('admin.dev_tools')}</h1>
          <Badge variant='secondary' className='ml-2'>
            v2.0 Optimized
          </Badge>
        </div>

        {/* Search and Quick Actions */}
        <div className='flex items-center gap-2'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
            <Input
              placeholder='Search tools...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='pl-9 w-48'
            />
          </div>
          <Badge variant='outline' className='gap-1'>
            <Keyboard className='h-3 w-3' />
            Ctrl+K
          </Badge>
        </div>
      </div>

      {/* Success Banner */}
      <Card className='border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 animate-fade-in'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-green-800'>
            <BarChart3 className='w-5 h-5' />✅ Development Tools Consolidated!
          </CardTitle>
          <CardDescription className='text-green-700'>
            Tournament management moved to /admin/tournaments. Simplified dev
            tools with essential features only.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex flex-wrap gap-2'>
            <Badge variant='secondary'>Tournament Tools Moved</Badge>
            <Badge variant='secondary'>Simplified Interface</Badge>
            <Badge variant='secondary'>Better Organization</Badge>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <AlertTriangle className='h-4 w-4' />
        <AlertDescription>
          Tournament management has been moved to{' '}
          <strong>/admin/tournaments</strong> for better organization.
        </AlertDescription>
      </Alert>

      {/* Enhanced Tabs with Suspense */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className='space-y-4'
      >
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='users' className='flex items-center gap-2'>
            <Users className='h-4 w-4' />
            Users
          </TabsTrigger>
          <TabsTrigger value='data' className='flex items-center gap-2'>
            <Settings className='h-4 w-4' />
            Data
          </TabsTrigger>
          <TabsTrigger value='system' className='flex items-center gap-2'>
            <BarChart3 className='h-4 w-4' />
            System
          </TabsTrigger>
        </TabsList>

        <TabsContent value='users' className='space-y-4'>
          <ErrorBoundary>
            <Suspense
              fallback={
                <LoadingState
                  variant='card'
                  text='Loading User Testing Manager...'
                />
              }
            >
              <UserTestingManager />
            </Suspense>
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value='data' className='space-y-4'>
          <ErrorBoundary>
            <Suspense
              fallback={
                <LoadingState variant='card' text='Loading Data Populator...' />
              }
            >
              <MasterDataPopulator />
            </Suspense>
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value='system' className='space-y-4'>
          <ErrorBoundary>
            <Suspense
              fallback={
                <LoadingState variant='card' text='Loading System Hub...' />
              }
            >
              <SystemManagementHub />
            </Suspense>
          </ErrorBoundary>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DevelopmentTools;
