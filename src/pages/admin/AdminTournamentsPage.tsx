import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Settings, Users, Crown } from 'lucide-react';
import { TournamentBracketTemplates } from '@/components/tournament/templates/TournamentBracketTemplates';
import { Badge } from '@/components/ui/badge';

export default function AdminTournamentsPage() {
  return (
    <div className='p-6 space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>Tournament Administration</h1>
          <p className='text-muted-foreground'>
            Manage tournament systems and bracket templates
          </p>
        </div>
        <Badge variant='outline' className='flex items-center gap-2'>
          <Crown className='h-4 w-4' />
          Enhanced Double Elimination System
        </Badge>
      </div>

      <Tabs defaultValue='templates' className='space-y-6'>
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='templates' className='flex items-center gap-2'>
            <Trophy className='h-4 w-4' />
            Tournament Templates
          </TabsTrigger>
          <TabsTrigger value='management' className='flex items-center gap-2'>
            <Settings className='h-4 w-4' />
            System Management
          </TabsTrigger>
          <TabsTrigger value='statistics' className='flex items-center gap-2'>
            <Users className='h-4 w-4' />
            Statistics
          </TabsTrigger>
        </TabsList>

        <TabsContent value='templates'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Trophy className='h-5 w-5' />
                Enhanced Tournament System
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TournamentBracketTemplates />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='management'>
          <Card>
            <CardHeader>
              <CardTitle>System Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-center py-12'>
                <Settings className='h-12 w-12 mx-auto text-muted-foreground mb-4' />
                <h3 className='text-lg font-semibold mb-2'>
                  Tournament System Management
                </h3>
                <p className='text-muted-foreground'>
                  Advanced tournament configuration and system controls.
                </p>
                <Badge variant='outline' className='mt-4'>
                  Coming Soon
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='statistics'>
          <Card>
            <CardHeader>
              <CardTitle>Tournament Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-center py-12'>
                <Users className='h-12 w-12 mx-auto text-muted-foreground mb-4' />
                <h3 className='text-lg font-semibold mb-2'>
                  Tournament Analytics
                </h3>
                <p className='text-muted-foreground'>
                  Comprehensive tournament performance metrics and insights.
                </p>
                <Badge variant='outline' className='mt-4'>
                  Coming Soon
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
