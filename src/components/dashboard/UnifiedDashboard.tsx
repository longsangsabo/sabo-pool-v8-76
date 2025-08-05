import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/components/ui/tabs';
import { DashboardStats } from './DashboardStats';
import { QuickActions } from './QuickActions';
import { RecentActivity } from './RecentActivity';

export const UnifiedDashboard: React.FC = () => {
  return (
    <div className='space-y-6'>
      <DashboardStats dashboardType='player' />

      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
        <QuickActions />
        <Card className='md:col-span-1 lg:col-span-2'>
          <CardHeader>
            <CardTitle>Your Progress</CardTitle>
          </CardHeader>
          <CardContent className='p-6'>
            <Tabs defaultValue='challenges'>
              <TabsList className='mb-4'>
                <TabsTrigger value='challenges'>Challenges</TabsTrigger>
                <TabsTrigger value='tournaments'>Tournaments</TabsTrigger>
                <TabsTrigger value='rankings'>Rankings</TabsTrigger>
              </TabsList>

              <TabsContent value='challenges'>
                <div className='p-4 bg-muted/50 rounded-md'>
                  <h3 className='font-medium mb-2'>Recent Challenges</h3>
                  <p className='text-sm text-muted-foreground'>
                    You have 2 pending challenges and 1 completed match this
                    week.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value='tournaments'>
                <div className='p-4 bg-muted/50 rounded-md'>
                  <h3 className='font-medium mb-2'>Tournament Performance</h3>
                  <p className='text-sm text-muted-foreground'>
                    You've participated in 3 tournaments this season with 1
                    podium finish.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value='rankings'>
                <div className='p-4 bg-muted/50 rounded-md'>
                  <h3 className='font-medium mb-2'>Current Ranking</h3>
                  <p className='text-sm text-muted-foreground'>
                    Your current ELO: 1850 (Top 15% of all players)
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        <RecentActivity />
      </div>
    </div>
  );
};
