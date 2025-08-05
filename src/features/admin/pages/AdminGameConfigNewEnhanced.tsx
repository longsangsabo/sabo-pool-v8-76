import React, { useState, useEffect } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/components/ui/tabs';
import {
  Settings,
  Trophy,
  Star,
  BarChart3,
  Target,
  CheckCircle,
  Shield,
} from 'lucide-react';
import { EloRulesManager } from '@/features/admin/components/game-config/EloRulesManager';
import { RankDefinitionsManager } from '@/features/admin/components/game-config/RankDefinitionsManager';
import { SPARewardsManager } from '@/features/admin/components/game-config/SPARewardsManager';
import { TournamentRewardsManager } from '@/features/admin/components/game-config/TournamentRewardsManager';
import { GameConfigOverview } from '@/features/admin/components/game-config/GameConfigOverview';
import { GameConfigSync } from '@/features/admin/components/game-config/GameConfigSync';
import { DatabaseMigrationRunner } from '@/features/admin/components/game-config/DatabaseMigrationRunner';
import { OfficialELOIntegrationStatus } from '@/features/admin/components/game-config/OfficialELOIntegrationStatus';
import { ELOIntegrationValidator } from '@/features/admin/components/game-config/ELOIntegrationValidator';
import { AdminPageLayout } from '@/features/admin/components/shared/AdminPageLayout';
import { DatabaseTest } from '@/components/DatabaseTest';
import { useAdminGameConfig } from '@/hooks/useAdminGameConfig';

function AdminGameConfigContent() {
  const [activeTab, setActiveTab] = useState('overview');

  // Admin Game Config Hook
  const {
    stats,
    inconsistencies,
    loading,
    error,
    getAllConfigs,
    getAllEloRules,
    getAllRanks,
    getConfigStats,
    refetchStats,
  } = useAdminGameConfig();

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      console.log('AdminGameConfig: Starting to fetch data...');
      try {
        const [configsData, eloRulesData, ranksData, statsData] =
          await Promise.all([
            getAllConfigs(),
            getAllEloRules(),
            getAllRanks(),
            getConfigStats(),
          ]);

        console.log('AdminGameConfig: Data loaded:', {
          configs: configsData.length,
          eloRules: eloRulesData.length,
          ranks: ranksData.length,
          stats: statsData,
        });
      } catch (error) {
        console.error('AdminGameConfig: Error loading data:', error);
      }
    };

    loadData();
  }, [getAllConfigs, getAllEloRules, getAllRanks, getConfigStats]);

  // Update when loading state changes
  useEffect(() => {
    console.log('AdminGameConfig: Loading state:', loading);
  }, [loading]);

  // Update when stats change
  useEffect(() => {
    if (stats) {
      console.log('AdminGameConfig: Stats updated:', stats);
    }
  }, [stats]);

  return (
    <div className='space-y-6'>
      {/* Database Test Component */}
      <DatabaseTest />

      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div className='flex-1'>
          {/* Title and description are handled by AdminPageLayout */}
        </div>
        <GameConfigSync />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
        <TabsList className='grid w-full grid-cols-7'>
          <TabsTrigger value='overview' className='gap-2'>
            <BarChart3 className='h-4 w-4' />
            Overview
          </TabsTrigger>
          <TabsTrigger value='integration' className='gap-2'>
            <CheckCircle className='h-4 w-4' />
            ELO Integration
          </TabsTrigger>
          <TabsTrigger value='validation' className='gap-2'>
            <Shield className='h-4 w-4' />
            Validation
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

        <TabsContent value='overview' className='space-y-6'>
          <GameConfigOverview />
          <div className='border-t pt-6'>
            <h3 className='text-lg font-medium mb-4'>Database Setup</h3>
            <p className='text-sm text-muted-foreground mb-4'>
              If you're seeing empty data or disabled features, run these
              migrations to create the required database tables:
            </p>
            <DatabaseMigrationRunner />
          </div>
        </TabsContent>

        <TabsContent value='integration' className='space-y-6'>
          <OfficialELOIntegrationStatus />
        </TabsContent>

        <TabsContent value='validation' className='space-y-6'>
          <ELOIntegrationValidator />
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
  );
}

export default function AdminGameConfigNewEnhanced() {
  return (
    <AdminPageLayout title='Game Configuration'>
      <AdminGameConfigContent />
    </AdminPageLayout>
  );
}
