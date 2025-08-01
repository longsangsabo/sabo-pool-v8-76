import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Settings, Database, Users, Trophy } from 'lucide-react';
import { SABOMigrationManager } from './SABOMigrationManager';
import { TournamentStatusFixer } from '../debug/TournamentStatusFixer';

export const AdminDashboard = () => {
  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-2'>
        <Settings className='h-6 w-6' />
        <h1 className='text-2xl font-bold'>Admin Dashboard</h1>
      </div>

      <Tabs defaultValue='migration' className='space-y-4'>
        <TabsList className='grid w-full grid-cols-4'>
          <TabsTrigger value='migration' className='flex items-center gap-2'>
            <Database className='h-4 w-4' />
            SABO Migration
          </TabsTrigger>
          <TabsTrigger value='tournaments' className='flex items-center gap-2'>
            <Trophy className='h-4 w-4' />
            Tournaments
          </TabsTrigger>
          <TabsTrigger value='users' className='flex items-center gap-2'>
            <Users className='h-4 w-4' />
            Users
          </TabsTrigger>
          <TabsTrigger value='system' className='flex items-center gap-2'>
            <Settings className='h-4 w-4' />
            System
          </TabsTrigger>
        </TabsList>

        <TabsContent value='migration'>
          <SABOMigrationManager />
        </TabsContent>

        <TabsContent value='tournaments'>
          <Card>
            <CardHeader>
              <CardTitle>Tournament Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-muted-foreground'>
                Tournament management tools will be available here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='users'>
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-muted-foreground'>
                User management tools will be available here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='system'>
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-muted-foreground'>
                System configuration tools will be available here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
