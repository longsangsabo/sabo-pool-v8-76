import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle,
  Trash2,
  RefreshCw,
  Database,
  Shield,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ResetOption {
  id: string;
  name: string;
  description: string;
  danger: 'low' | 'medium' | 'high' | 'critical';
  icon: React.ReactNode;
}

const resetOptions: ResetOption[] = [
  {
    id: 'stats_only',
    name: 'Reset Stats Only',
    description:
      'Reset user stats, ELO, SPA points to defaults. Keep profiles and history.',
    danger: 'low',
    icon: <RefreshCw className='h-4 w-4' />,
  },
  {
    id: 'soft',
    name: 'Soft Reset',
    description:
      'Reset all user stats, rankings, and wallets. Keep profiles and basic data.',
    danger: 'medium',
    icon: <Database className='h-4 w-4' />,
  },
  {
    id: 'club_reset',
    name: 'Club Reset',
    description: 'Reset club registrations, verifications, and related data.',
    danger: 'medium',
    icon: <Shield className='h-4 w-4' />,
  },
  {
    id: 'demo_cleanup',
    name: 'Demo Cleanup',
    description: 'Remove demo users and test data only. Safe for production.',
    danger: 'low',
    icon: <Trash2 className='h-4 w-4' />,
  },
  {
    id: 'hard',
    name: 'Hard Reset',
    description:
      'Delete ALL matches, challenges, tournaments, and reset all stats. IRREVERSIBLE!',
    danger: 'critical',
    icon: <AlertTriangle className='h-4 w-4' />,
  },
];

export const SystemResetPanel: React.FC = () => {
  const [selectedReset, setSelectedReset] = useState<string>('');
  const [confirmationText, setConfirmationText] = useState('');
  const [backupEnabled, setBackupEnabled] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetProgress, setResetProgress] = useState(0);
  const [resetResults, setResetResults] = useState<any>(null);

  const selectedOption = resetOptions.find(opt => opt.id === selectedReset);

  const handleResetClick = () => {
    if (!selectedReset) {
      toast.error('Please select a reset type');
      return;
    }
    setShowConfirmation(true);
  };

  const executeReset = async () => {
    if (confirmationText !== 'RESET') {
      toast.error('Please type "RESET" to confirm');
      return;
    }

    setIsResetting(true);
    setResetProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setResetProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const { data, error } = await supabase.functions.invoke(
        'admin-system-reset',
        {
          body: {
            resetType: selectedReset,
            confirmation: confirmationText,
            backup: backupEnabled,
          },
        }
      );

      clearInterval(progressInterval);
      setResetProgress(100);

      if (error) {
        throw error;
      }

      setResetResults(data);
      toast.success(`${selectedOption?.name} completed successfully!`);
    } catch (error) {
      console.error('Reset error:', error);
      toast.error(`Reset failed: ${error.message}`);
    } finally {
      setIsResetting(false);
      setShowConfirmation(false);
      setConfirmationText('');
    }
  };

  const getDangerColor = (danger: string) => {
    switch (danger) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (resetResults) {
    return (
      <Card className='w-full max-w-4xl'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <CheckCircle className='h-5 w-5 text-green-600' />
            Reset Complete
          </CardTitle>
          <CardDescription>
            System reset has been completed successfully.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label>Reset Type</Label>
                <p className='text-sm text-muted-foreground'>
                  {resetResults.reset_type}
                </p>
              </div>
              <div>
                <Label>Completed At</Label>
                <p className='text-sm text-muted-foreground'>
                  {new Date(resetResults.timestamp).toLocaleString()}
                </p>
              </div>
            </div>

            {resetResults.results && (
              <div className='space-y-2'>
                <Label>Results</Label>
                <div className='bg-gray-50 p-3 rounded-lg'>
                  <pre className='text-xs overflow-auto'>
                    {JSON.stringify(resetResults.results, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            <Button onClick={() => setResetResults(null)} className='w-full'>
              Perform Another Reset
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='w-full max-w-4xl'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <AlertTriangle className='h-5 w-5 text-red-600' />
          System Reset Panel
        </CardTitle>
        <CardDescription>
          Reset user data, club data, or perform system cleanup. These actions
          are irreversible.
        </CardDescription>
      </CardHeader>

      <CardContent className='space-y-6'>
        {/* Warning Alert */}
        <Alert>
          <AlertTriangle className='h-4 w-4' />
          <AlertDescription>
            <strong>Warning:</strong> System reset operations are irreversible.
            Always ensure you have proper backups before proceeding.
          </AlertDescription>
        </Alert>

        {/* Reset Options */}
        <div className='space-y-3'>
          <Label>Select Reset Type</Label>
          <div className='grid gap-3'>
            {resetOptions.map(option => (
              <div
                key={option.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedReset === option.id
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedReset(option.id)}
              >
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    {option.icon}
                    <div>
                      <div className='font-medium'>{option.name}</div>
                      <div className='text-sm text-muted-foreground'>
                        {option.description}
                      </div>
                    </div>
                  </div>
                  <Badge className={getDangerColor(option.danger)}>
                    {option.danger}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Backup Option */}
        <div className='flex items-center space-x-2'>
          <Checkbox
            id='backup'
            checked={backupEnabled}
            onCheckedChange={checked => setBackupEnabled(checked === true)}
          />
          <Label htmlFor='backup'>
            Create backup before reset (recommended)
          </Label>
        </div>

        {/* Action Buttons */}
        <div className='flex gap-3'>
          <Button
            onClick={handleResetClick}
            disabled={!selectedReset || isResetting}
            variant='destructive'
            className='flex-1'
          >
            {isResetting ? 'Resetting...' : 'Execute Reset'}
          </Button>
        </div>

        {/* Progress */}
        {isResetting && (
          <div className='space-y-2'>
            <Label>Reset Progress</Label>
            <Progress value={resetProgress} className='w-full' />
            <p className='text-sm text-muted-foreground'>
              Executing {selectedOption?.name}... {resetProgress}%
            </p>
          </div>
        )}

        {/* Confirmation Dialog */}
        {showConfirmation && (
          <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
            <Card className='w-full max-w-md'>
              <CardHeader>
                <CardTitle className='text-red-600'>Confirm Reset</CardTitle>
                <CardDescription>
                  This action cannot be undone. Type "RESET" to confirm.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div>
                  <Label>Selected Reset Type</Label>
                  <p className='text-sm font-medium'>{selectedOption?.name}</p>
                  <p className='text-sm text-muted-foreground'>
                    {selectedOption?.description}
                  </p>
                </div>

                <div>
                  <Label htmlFor='confirmation'>Type "RESET" to confirm</Label>
                  <Input
                    id='confirmation'
                    value={confirmationText}
                    onChange={e => setConfirmationText(e.target.value)}
                    placeholder='RESET'
                    className='mt-1'
                  />
                </div>

                <div className='flex gap-2'>
                  <Button
                    onClick={() => setShowConfirmation(false)}
                    variant='outline'
                    className='flex-1'
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={executeReset}
                    disabled={confirmationText !== 'RESET'}
                    variant='destructive'
                    className='flex-1'
                  >
                    Confirm Reset
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
