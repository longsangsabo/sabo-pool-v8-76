import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Trophy,
  Settings,
  Activity,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { TournamentBracketManager } from '@/components/admin/TournamentBracketManager';
import { RealTimeBracketUpdates } from '@/components/admin/RealTimeBracketUpdates';
import { TournamentIntegrityChecker } from '@/components/testing/TournamentIntegrityChecker';
import { TournamentEndToEndTest } from '@/components/testing/TournamentEndToEndTest';
import { PerformanceProfiler } from '@/components/testing/PerformanceProfiler';
import { ResponsiveTestSuite } from '@/components/testing/ResponsiveTestSuite';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Tournament {
  id: string;
  name: string;
  status: string;
  tournament_type: string;
  participant_count?: number;
  completed_matches?: number;
  total_matches?: number;
}

interface DashboardStats {
  total_tournaments: number;
  active_tournaments: number;
  completed_matches: number;
  pending_repairs: number;
}

export default function AdminDashboard() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total_tournaments: 0,
    active_tournaments: 0,
    completed_matches: 0,
    pending_repairs: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch tournaments with match counts
      const { data: tournamentsData, error: tournamentsError } = await supabase
        .from('tournaments')
        .select(
          `
          id,
          name,
          status,
          tournament_type
        `
        )
        .order('created_at', { ascending: false });

      if (tournamentsError) throw tournamentsError;

      // Get match statistics for each tournament
      const tournamentsWithStats = await Promise.all(
        (tournamentsData || []).map(async tournament => {
          const { data: matchStats } = await supabase
            .from('tournament_matches')
            .select('status, id')
            .eq('tournament_id', tournament.id);

          const totalMatches = matchStats?.length || 0;
          const completedMatches =
            matchStats?.filter(m => m.status === 'completed').length || 0;

          // Get participant count
          const { data: participants } = await supabase
            .from('tournament_registrations')
            .select('id')
            .eq('tournament_id', tournament.id)
            .eq('registration_status', 'confirmed');

          return {
            ...tournament,
            total_matches: totalMatches,
            completed_matches: completedMatches,
            participant_count: participants?.length || 0,
          };
        })
      );

      setTournaments(tournamentsWithStats);

      // Calculate dashboard stats
      const activeCount = tournamentsWithStats.filter(t =>
        ['ongoing', 'registration_closed'].includes(t.status)
      ).length;

      const totalCompleted = tournamentsWithStats.reduce(
        (sum, t) => sum + (t.completed_matches || 0),
        0
      );

      const pendingRepairs = tournamentsWithStats.filter(
        t =>
          t.tournament_type === 'double_elimination' &&
          t.status === 'ongoing' &&
          (t.completed_matches || 0) > 0
      ).length;

      setStats({
        total_tournaments: tournamentsWithStats.length,
        active_tournaments: activeCount,
        completed_matches: totalCompleted,
        pending_repairs: pendingRepairs,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast({
        title: '❌ Load Failed',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const StatCard = ({
    title,
    value,
    description,
    icon: Icon,
    variant = 'default',
  }: {
    title: string;
    value: number;
    description: string;
    icon: any;
    variant?: 'default' | 'warning' | 'success';
  }) => {
    const getVariantStyles = () => {
      switch (variant) {
        case 'warning':
          return 'border-orange-200 bg-orange-50';
        case 'success':
          return 'border-green-200 bg-green-50';
        default:
          return 'border-border bg-background';
      }
    };

    return (
      <Card className={getVariantStyles()}>
        <CardContent className='p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-muted-foreground'>
                {title}
              </p>
              <p className='text-2xl font-bold'>{value}</p>
              <p className='text-xs text-muted-foreground mt-1'>
                {description}
              </p>
            </div>
            <Icon className='h-8 w-8 text-muted-foreground' />
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className='container mx-auto p-6 space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Admin Dashboard</h1>
          <p className='text-muted-foreground'>
            Manage tournaments and monitor bracket progression
          </p>
        </div>
        <Button
          onClick={fetchDashboardData}
          disabled={isLoading}
          variant='outline'
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
          />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <StatCard
          title='Total Tournaments'
          value={stats.total_tournaments}
          description='All tournaments in system'
          icon={Trophy}
        />
        <StatCard
          title='Active Tournaments'
          value={stats.active_tournaments}
          description='Currently running'
          icon={Activity}
          variant='success'
        />
        <StatCard
          title='Completed Matches'
          value={stats.completed_matches}
          description='Total matches played'
          icon={CheckCircle}
        />
        <StatCard
          title='Needs Attention'
          value={stats.pending_repairs}
          description='Tournaments needing repair'
          icon={AlertTriangle}
          variant={stats.pending_repairs > 0 ? 'warning' : 'default'}
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue='bracket-manager' className='space-y-6'>
        <TabsList className='grid w-full grid-cols-4'>
          <TabsTrigger
            value='bracket-manager'
            className='flex items-center gap-2'
          >
            <Settings className='h-4 w-4' />
            Bracket Manager
          </TabsTrigger>
          <TabsTrigger value='real-time' className='flex items-center gap-2'>
            <Activity className='h-4 w-4' />
            Real-time Updates
          </TabsTrigger>
          <TabsTrigger value='tournaments' className='flex items-center gap-2'>
            <Trophy className='h-4 w-4' />
            All Tournaments
          </TabsTrigger>
          <TabsTrigger value='testing' className='flex items-center gap-2'>
            <CheckCircle className='h-4 w-4' />
            Testing & Validation
          </TabsTrigger>
        </TabsList>

        <TabsContent value='bracket-manager' className='space-y-6'>
          <TournamentBracketManager
            tournaments={tournaments}
            onRefresh={fetchDashboardData}
          />
        </TabsContent>

        <TabsContent value='real-time' className='space-y-6'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <RealTimeBracketUpdates maxUpdates={15} />
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>
                  Current system health and performance
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium'>
                    Database Connection
                  </span>
                  <Badge className='bg-green-500/10 text-green-700 border-green-200'>
                    <CheckCircle className='h-3 w-3 mr-1' />
                    Healthy
                  </Badge>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium'>
                    Real-time Subscriptions
                  </span>
                  <Badge className='bg-green-500/10 text-green-700 border-green-200'>
                    <Activity className='h-3 w-3 mr-1' />
                    Active
                  </Badge>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium'>
                    Bracket Automation
                  </span>
                  <Badge className='bg-green-500/10 text-green-700 border-green-200'>
                    <Settings className='h-3 w-3 mr-1' />
                    Running
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value='tournaments' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>All Tournaments</CardTitle>
              <CardDescription>
                Complete list of tournaments with their current status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {tournaments.map(tournament => (
                  <div
                    key={tournament.id}
                    className='flex items-center justify-between p-4 border rounded-lg'
                  >
                    <div>
                      <h4 className='font-medium'>{tournament.name}</h4>
                      <div className='flex items-center gap-2 mt-1'>
                        <Badge variant='outline'>{tournament.status}</Badge>
                        <Badge variant='outline'>
                          {tournament.tournament_type}
                        </Badge>
                        <span className='text-sm text-muted-foreground'>
                          {tournament.participant_count} players
                        </span>
                      </div>
                    </div>
                    <div className='text-right'>
                      <p className='text-sm font-medium'>
                        {tournament.completed_matches}/
                        {tournament.total_matches} matches
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        {tournament.total_matches > 0
                          ? Math.round(
                              (tournament.completed_matches! /
                                tournament.total_matches) *
                                100
                            )
                          : 0}
                        % complete
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='testing' className='space-y-6'>
          <div className='grid gap-6'>
            <TournamentIntegrityChecker />
            <div className='grid lg:grid-cols-2 gap-6'>
              <TournamentEndToEndTest />
              <PerformanceProfiler />
            </div>
            <ResponsiveTestSuite />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
