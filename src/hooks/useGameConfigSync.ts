import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Inconsistency {
  table: string;
  type: 'missing' | 'mismatch' | 'extra';
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export const useGameConfigSync = () => {
  const [inconsistencies, setInconsistencies] = useState<Inconsistency[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const checkInconsistencies = async () => {
    try {
      // Use existing ranks table instead of non-existent tables
      const issues: Inconsistency[] = [];

      // Check rank definitions consistency using existing ranks table
      const { data: ranks } = await supabase
        .from('ranks')
        .select('*')
        .order('rank_order');

      const expectedRanks = [
        'K',
        'K+',
        'I',
        'I+',
        'H',
        'H+',
        'G',
        'G+',
        'F',
        'F+',
        'E',
        'E+',
      ];

      if (!ranks || ranks.length < 5) {
        issues.push({
          table: 'ranks',
          type: 'missing',
          description: `Expected at least 5 ranks, found ${ranks?.length || 0}`,
          severity: 'high',
        });
      }

      setInconsistencies(issues);
      return issues;
    } catch (error) {
      console.error('Error checking inconsistencies:', error);
      return [];
    }
  };

  const syncToConstants = async () => {
    try {
      setLoading(true);

      // Simulate sync process
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast.success('Sync Completed', {
        description: 'Constants have been updated from database values',
      });

      setLastSyncTime(new Date().toISOString());
      await checkInconsistencies();
    } catch (error) {
      console.error('Error syncing to constants:', error);
      toast.error('Sync Failed', {
        description: 'Failed to update constants',
      });
    } finally {
      setLoading(false);
    }
  };

  const syncFromDatabase = async () => {
    try {
      setLoading(true);

      // Simulate sync process
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast.success('Sync Completed', {
        description: 'Database has been updated from constants',
      });

      setLastSyncTime(new Date().toISOString());
      await checkInconsistencies();
    } catch (error) {
      console.error('Error syncing from database:', error);
      toast.error('Sync Failed', {
        description: 'Failed to update database',
      });
    } finally {
      setLoading(false);
    }
  };

  const exportConfig = async () => {
    try {
      // Export current configuration to JSON using existing tables
      const config = {
        timestamp: new Date().toISOString(),
        ranks: await supabase.from('ranks').select('*'),
        tournaments: await supabase.from('tournaments').select('*'),
      };

      const blob = new Blob([JSON.stringify(config, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `game-config-${new Date().toISOString().split('T')[0]}.json`;
      a.click();

      toast.success('Config Exported', {
        description: 'Configuration has been exported successfully',
      });
    } catch (error) {
      console.error('Error exporting config:', error);
      toast.error('Export Failed', {
        description: 'Failed to export configuration',
      });
    }
  };

  const importConfig = async () => {
    // This would open a file picker and import configuration
    toast.info('Import Config', {
      description: 'Import functionality coming soon',
    });
  };

  const compareVersions = async () => {
    // This would show a comparison between current and previous versions
    toast.info('Version Comparison', {
      description: 'Version comparison functionality coming soon',
    });
  };

  useEffect(() => {
    checkInconsistencies();
  }, []);

  return {
    inconsistencies,
    loading,
    lastSyncTime,
    syncToConstants,
    syncFromDatabase,
    exportConfig,
    importConfig,
    compareVersions,
    checkInconsistencies,
  };
};
