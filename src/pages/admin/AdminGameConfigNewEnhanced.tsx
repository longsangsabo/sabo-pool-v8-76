import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Trophy, Star, BarChart3, Target } from 'lucide-react';
import { EloRulesManager } from '@/components/admin/game-config/EloRulesManager';
import { RankDefinitionsManager } from '@/components/admin/game-config/RankDefinitionsManager';
import { SPARewardsManager } from '@/components/admin/game-config/SPARewardsManager';
import { TournamentRewardsManager } from '@/components/admin/game-config/TournamentRewardsManager';
import { GameConfigOverview } from '@/components/admin/game-config/GameConfigOverview';
import { GameConfigSync } from '@/components/admin/game-config/GameConfigSync';
import { DatabaseMigrationRunner } from '@/components/admin/game-config/DatabaseMigrationRunner';
import { AdminPageLayout } from '@/components/admin/shared/AdminPageLayout';

const AdminGameConfigNewEnhanced = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <AdminPageLayout 
      title="Game Configuration" 
      description="Quản lý và cấu hình toàn bộ các thông số game logic cho SABO Pool Arena"
    >
      <div className='space-y-6'>
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
          <div className="flex-1">
            {/* Title and description are handled by AdminPageLayout */}
          </div>
          <GameConfigSync />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
          <TabsList className='grid w-full grid-cols-5'>
            <TabsTrigger value='overview' className='gap-2'>
              <BarChart3 className='h-4 w-4' />
              Overview
            </TabsTrigger>
            <TabsTrigger value='elo' className='gap-2'>
              <Target className='h-4 w-4' />
              ELO Rules
            </TabsTrigger>
            <TabsTrigger value='ranks' className='gap-2'>
              <Star className='h-4 w-4' />
              Ranks
            </TabsTrigger>
            <TabsTrigger value='spa' className='gap-2'>
              <Trophy className='h-4 w-4' />
              SPA Rewards
            </TabsTrigger>
            <TabsTrigger value='tournaments' className='gap-2'>
              <Settings className='h-4 w-4' />
              Tournaments
            </TabsTrigger>
          </TabsList>

                <TabsContent value="overview" className="space-y-6">
        <GameConfigOverview />
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium mb-4">Database Setup</h3>
          <p className="text-sm text-muted-foreground mb-4">
            If you're seeing empty data or disabled features, run these migrations to create the required database tables:
          </p>
          <DatabaseMigrationRunner />
        </div>
      </TabsContent>

          <TabsContent value='elo' className='space-y-6'>
            <EloRulesManager />
          </TabsContent>

          <TabsContent value='ranks' className='space-y-6'>
            <RankDefinitionsManager />
          </TabsContent>

          <TabsContent value='spa' className='space-y-6'>
            <SPARewardsManager />
          </TabsContent>

          <TabsContent value='tournaments' className='space-y-6'>
            <TournamentRewardsManager />
          </TabsContent>
        </Tabs>
      </div>
    </AdminPageLayout>
  );
};

export default AdminGameConfigNewEnhanced;
