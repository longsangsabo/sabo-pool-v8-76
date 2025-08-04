import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface MigrationResult {
  success: boolean;
  migrated?: boolean;
  already_sabo?: boolean;
  tournament_id: string;
  tournament_name: string;
  previous_matches?: number;
  new_matches?: number;
  error?: string;
}

interface BulkMigrationResult {
  success: boolean;
  migrated_count: number;
  already_sabo_count: number;
  error_count: number;
  error?: string;
}

export const SABOMigrationManager = () => {
  const [selectedTournament, setSelectedTournament] = useState<string | null>(
    null
  );
  const queryClient = useQueryClient();

  // Get tournaments that might need migration
  const { data: tournaments, isLoading: loadingTournaments } = useQuery({
    queryKey: ['migration-tournaments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tournaments')
        .select(
          `
          id,
          name,
          tournament_type,
          status,
          created_at,
          tournament_matches(count)
        `
        )
        .eq('tournament_type', 'double_elimination')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Single tournament migration
  const migrateSingle = useMutation({
    mutationFn: async (tournamentId: string) => {
      const { data, error } = await supabase.rpc('migrate_tournament_to_sabo', {
        p_tournament_id: tournamentId,
      });
      if (error) throw error;
      return data as unknown as MigrationResult;
    },
    onSuccess: result => {
      if (result.success) {
        if (result.migrated) {
          toast.success(
            `✅ Migrated "${result.tournament_name}" to SABO structure`
          );
        } else if (result.already_sabo) {
          toast.info(
            `ℹ️ "${result.tournament_name}" already has SABO structure`
          );
        }
      } else {
        toast.error(`❌ Migration failed: ${result.error}`);
      }
      queryClient.invalidateQueries({ queryKey: ['migration-tournaments'] });
    },
    onError: error => {
      console.error('Migration error:', error);
      toast.error('Migration failed');
    },
  });

  // Bulk migration
  const migrateAll = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc(
        'migrate_all_tournaments_to_sabo'
      );
      if (error) throw error;
      return data as unknown as BulkMigrationResult;
    },
    onSuccess: result => {
      if (result.success) {
        toast.success(
          `🚀 Migration completed: ${result.migrated_count} migrated, ${result.already_sabo_count} already SABO`
        );
      } else {
        toast.error(`❌ Bulk migration failed: ${result.error}`);
      }
      queryClient.invalidateQueries({ queryKey: ['migration-tournaments'] });
    },
    onError: error => {
      console.error('Bulk migration error:', error);
      toast.error('Bulk migration failed');
    },
  });

  const getTournamentStatus = (tournament: any) => {
    const matchCount = tournament.tournament_matches?.[0]?.count || 0;

    if (matchCount === 0) {
      return {
        status: 'no_matches',
        color: 'bg-yellow-500',
        text: 'No Matches',
      };
    } else if (matchCount === 27) {
      return {
        status: 'sabo_compliant',
        color: 'bg-green-500',
        text: '27 Matches (SABO?)',
      };
    } else {
      return {
        status: 'needs_migration',
        color: 'bg-red-500',
        text: `${matchCount} Matches`,
      };
    }
  };

  if (loadingTournaments) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <RefreshCw className='h-5 w-5 animate-spin' />
            Loading tournaments...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Download className='h-5 w-5' />
            SABO Migration Manager
          </CardTitle>
          <p className='text-sm text-muted-foreground'>
            Migrate double elimination tournaments to SABO structure (27
            matches)
          </p>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex gap-4'>
            <Button
              onClick={() => migrateAll.mutate()}
              disabled={migrateAll.isPending}
              className='flex items-center gap-2'
            >
              {migrateAll.isPending ? (
                <RefreshCw className='h-4 w-4 animate-spin' />
              ) : (
                <Download className='h-4 w-4' />
              )}
              Migrate All Tournaments
            </Button>
            <Button
              variant='outline'
              onClick={() =>
                queryClient.invalidateQueries({
                  queryKey: ['migration-tournaments'],
                })
              }
            >
              <RefreshCw className='h-4 w-4' />
              Refresh
            </Button>
          </div>

          <div className='grid gap-4'>
            <h3 className='text-lg font-semibold'>Tournament Status</h3>
            {tournaments?.map(tournament => {
              const status = getTournamentStatus(tournament);
              return (
                <div
                  key={tournament.id}
                  className='flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors'
                >
                  <div className='space-y-1'>
                    <div className='flex items-center gap-2'>
                      <h4 className='font-medium'>{tournament.name}</h4>
                      <Badge variant='outline'>{tournament.status}</Badge>
                      <Badge className={`text-white ${status.color}`}>
                        {status.text}
                      </Badge>
                    </div>
                    <p className='text-sm text-muted-foreground'>
                      Created:{' '}
                      {new Date(tournament.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className='flex items-center gap-2'>
                    {status.status === 'sabo_compliant' ? (
                      <CheckCircle2 className='h-5 w-5 text-green-600' />
                    ) : status.status === 'needs_migration' ? (
                      <AlertTriangle className='h-5 w-5 text-red-600' />
                    ) : null}

                    <Button
                      size='sm'
                      variant={
                        status.status === 'sabo_compliant'
                          ? 'outline'
                          : 'default'
                      }
                      onClick={() => migrateSingle.mutate(tournament.id)}
                      disabled={migrateSingle.isPending}
                      className='flex items-center gap-1'
                    >
                      {migrateSingle.isPending &&
                      selectedTournament === tournament.id ? (
                        <RefreshCw className='h-3 w-3 animate-spin' />
                      ) : (
                        <ArrowRight className='h-3 w-3' />
                      )}
                      {status.status === 'sabo_compliant'
                        ? 'Verify'
                        : 'Migrate'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {tournaments?.length === 0 && (
            <div className='text-center py-8 text-muted-foreground'>
              No double elimination tournaments found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
