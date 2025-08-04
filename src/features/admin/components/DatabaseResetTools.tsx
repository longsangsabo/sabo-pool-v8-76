import React, { useState } from 'react';
import {
  Database,
  Trash2,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const DatabaseResetTools = () => {
  const [selectedTables, setSelectedTables] = useState({
    tournaments: false,
    tournament_registrations: false,
    matches: false,
    match_results: false,
    challenges: false,
    spa_points_log: false,
    notifications: false,
    club_registrations: false,
    club_profiles: false,
    profiles: false,
  });
  const [isResetting, setIsResetting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const tableDescriptions = {
    tournaments: 'All tournament data',
    tournament_registrations: 'Tournament registration records',
    matches: 'Match history and results',
    match_results: 'Detailed match result data',
    challenges: 'Challenge requests between users',
    spa_points_log: 'SPA points transaction history',
    notifications: 'System notifications',
    club_registrations: 'Club registration applications',
    club_profiles: 'Approved club profiles',
    profiles: '⚠️ USER PROFILES (DANGEROUS - Keep real users)',
  };

  const dangerousTables = ['profiles'];

  const resetSelectedTables = async () => {
    setIsResetting(true);

    try {
      const tablesToReset = Object.entries(selectedTables)
        .filter(([_, selected]) => selected)
        .map(([table, _]) => table);

      if (tablesToReset.length === 0) {
        toast.error('No tables selected for reset');
        return;
      }

      let resetCount = 0;

      for (const table of tablesToReset) {
        try {
          // Special handling for dangerous tables
          if (dangerousTables.includes(table)) {
            // For profiles, only delete test users (those with test emails)
            if (table === 'profiles') {
              const { error } = await supabase
                .from(table as any)
                .delete()
                .like('phone', '09%') // Delete users with generated phone numbers
                .or('full_name.like.*Test*,full_name.like.*Club Owner*');

              if (error) throw error;
            }
          } else {
            // For other tables, delete all data
            const { error } = await supabase
              .from(table as any)
              .delete()
              .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all except impossible ID

            if (error) throw error;
          }

          resetCount++;
          toast.success(`Reset ${table} successfully`);
        } catch (error) {
          console.error(`Error resetting ${table}:`, error);
          toast.error(`Failed to reset ${table}`);
        }
      }

      toast.success(`Successfully reset ${resetCount} tables`);
      setShowConfirmDialog(false);
    } catch (error) {
      console.error('Error during reset:', error);
      toast.error('Reset operation failed');
    } finally {
      setIsResetting(false);
    }
  };

  const exportData = async () => {
    try {
      const exportData: any = {};

      for (const table of Object.keys(selectedTables)) {
        if (selectedTables[table as keyof typeof selectedTables]) {
          const { data, error } = await supabase.from(table as any).select('*');

          if (error) throw error;
          exportData[table] = data;
        }
      }

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });

      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sabo_pool_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  const handleFileImport = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importData = JSON.parse(text);

      for (const [table, data] of Object.entries(importData)) {
        if (Array.isArray(data) && data.length > 0) {
          const { error } = await supabase.from(table as any).insert(data);

          if (error) {
            console.error(`Error importing ${table}:`, error);
            toast.error(`Failed to import ${table}`);
          } else {
            toast.success(`Imported ${data.length} records to ${table}`);
          }
        }
      }

      toast.success('Data import completed');
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import data');
    }
  };

  const selectedCount = Object.values(selectedTables).filter(Boolean).length;
  const hasDangerousSelection = Object.entries(selectedTables).some(
    ([table, selected]) => selected && dangerousTables.includes(table)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Database className='h-5 w-5' />
          Database Reset Tools
        </CardTitle>
        <CardDescription>
          Clear test data, export/import datasets, and manage database state
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        <Alert>
          <AlertTriangle className='h-4 w-4' />
          <AlertDescription>
            <strong>WARNING:</strong> These tools will permanently delete data.
            Always backup important data before proceeding.
          </AlertDescription>
        </Alert>

        <div className='space-y-4'>
          <h4 className='font-medium'>Select Tables to Reset:</h4>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
            {Object.entries(selectedTables).map(([table, selected]) => (
              <div key={table} className='flex items-start space-x-2'>
                <Checkbox
                  id={table}
                  checked={selected}
                  onCheckedChange={checked =>
                    setSelectedTables(prev => ({
                      ...prev,
                      [table]: checked as boolean,
                    }))
                  }
                />
                <div className='grid gap-1.5 leading-none'>
                  <Label
                    htmlFor={table}
                    className={`text-sm font-medium ${dangerousTables.includes(table) ? 'text-red-600' : ''}`}
                  >
                    {table}
                  </Label>
                  <p
                    className={`text-xs ${dangerousTables.includes(table) ? 'text-red-500' : 'text-muted-foreground'}`}
                  >
                    {tableDescriptions[table as keyof typeof tableDescriptions]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {hasDangerousSelection && (
          <Alert className='border-red-200 bg-red-50'>
            <AlertTriangle className='h-4 w-4 text-red-600' />
            <AlertDescription className='text-red-800'>
              <strong>DANGER:</strong> You have selected tables containing user
              data. This operation will only delete test users, but use extreme
              caution.
            </AlertDescription>
          </Alert>
        )}

        <div className='flex flex-col sm:flex-row gap-2'>
          <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
            <DialogTrigger asChild>
              <Button
                variant='destructive'
                disabled={selectedCount === 0}
                className='flex-1'
              >
                <Trash2 className='h-4 w-4 mr-2' />
                Reset Selected Tables ({selectedCount})
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Database Reset</DialogTitle>
                <DialogDescription>
                  This action will permanently delete data from the selected
                  tables. This cannot be undone.
                  {hasDangerousSelection && (
                    <div className='mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-800'>
                      <strong>WARNING:</strong> You are about to modify user
                      data tables. Only test data will be removed.
                    </div>
                  )}
                </DialogDescription>
              </DialogHeader>
              <div className='py-4'>
                <h4 className='font-medium mb-2'>Tables to be reset:</h4>
                <ul className='list-disc list-inside space-y-1 text-sm'>
                  {Object.entries(selectedTables)
                    .filter(([_, selected]) => selected)
                    .map(([table]) => (
                      <li
                        key={table}
                        className={
                          dangerousTables.includes(table)
                            ? 'text-red-600 font-medium'
                            : ''
                        }
                      >
                        {table}
                      </li>
                    ))}
                </ul>
              </div>
              <DialogFooter>
                <Button
                  variant='outline'
                  onClick={() => setShowConfirmDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant='destructive'
                  onClick={resetSelectedTables}
                  disabled={isResetting}
                >
                  {isResetting ? 'Resetting...' : 'Confirm Reset'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button
            variant='outline'
            onClick={exportData}
            disabled={selectedCount === 0}
            className='flex-1'
          >
            <Download className='h-4 w-4 mr-2' />
            Export Data
          </Button>

          <div className='flex-1'>
            <input
              type='file'
              accept='.json'
              onChange={handleFileImport}
              className='hidden'
              id='import-file'
            />
            <Button
              variant='outline'
              onClick={() => document.getElementById('import-file')?.click()}
              className='w-full'
            >
              <Upload className='h-4 w-4 mr-2' />
              Import Data
            </Button>
          </div>
        </div>

        <div className='p-4 bg-blue-50 rounded-lg'>
          <h4 className='font-medium text-blue-900 mb-2'>Safety Features:</h4>
          <ul className='text-sm text-blue-800 space-y-1'>
            <li>
              • Profile reset only removes test users (phone starting with 09)
            </li>
            <li>• Export functionality backs up data before reset</li>
            <li>• Import allows restoration from backup files</li>
            <li>• Confirmation dialog prevents accidental resets</li>
            <li>• Real user data is preserved when possible</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default DatabaseResetTools;
