import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Play,
  Pause,
  Square,
  Trophy,
  Users,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TournamentStateManagerProps {
  tournament: any;
  onStateChange?: () => void;
  isAdmin?: boolean;
}

export const TournamentStateManager: React.FC<TournamentStateManagerProps> = ({
  tournament,
  onStateChange,
  isAdmin = false,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);

  if (!tournament) return null;

  const getStateInfo = (status: string) => {
    switch (status) {
      case 'registration_open':
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: Users,
          label: 'Registration Open',
          description: 'Players can register for this tournament',
        };
      case 'registration_closed':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: Calendar,
          label: 'Registration Closed',
          description:
            'Registration period has ended, tournament ready to start',
        };
      case 'ongoing':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: Play,
          label: 'In Progress',
          description: 'Tournament matches are currently being played',
        };
      case 'completed':
        return {
          color: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: Trophy,
          label: 'Completed',
          description: 'Tournament has finished successfully',
        };
      case 'cancelled':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: AlertTriangle,
          label: 'Cancelled',
          description: 'Tournament was cancelled',
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: Square,
          label: status,
          description: 'Unknown status',
        };
    }
  };

  const stateInfo = getStateInfo(tournament.status);
  const StateIcon = stateInfo.icon;

  const updateTournamentState = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('tournaments')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tournament.id);

      if (error) throw error;

      toast.success(`✅ Tournament status updated to: ${newStatus}`);
      onStateChange?.();
    } catch (error) {
      console.error('❌ Error updating tournament status:', error);
      toast.error(`❌ Failed to update tournament status`);
    } finally {
      setIsUpdating(false);
    }
  };

  const getAvailableTransitions = () => {
    const transitions = [];

    switch (tournament.status) {
      case 'registration_open':
        transitions.push({
          status: 'registration_closed',
          label: 'Close Registration',
          icon: Calendar,
          color: 'bg-yellow-500 hover:bg-yellow-600',
          description: 'Close registration and prepare to start tournament',
        });
        break;

      case 'registration_closed':
        transitions.push({
          status: 'ongoing',
          label: 'Start Tournament',
          icon: Play,
          color: 'bg-green-500 hover:bg-green-600',
          description: 'Begin tournament matches',
        });
        break;

      case 'ongoing':
        transitions.push({
          status: 'completed',
          label: 'Complete Tournament',
          icon: Trophy,
          color: 'bg-purple-500 hover:bg-purple-600',
          description: 'Mark tournament as completed',
        });
        break;
    }

    // Admin can always cancel (except if already completed)
    if (
      tournament.status !== 'completed' &&
      tournament.status !== 'cancelled'
    ) {
      transitions.push({
        status: 'cancelled',
        label: 'Cancel Tournament',
        icon: AlertTriangle,
        color: 'bg-red-500 hover:bg-red-600',
        description: 'Cancel the tournament',
        dangerous: true,
      });
    }

    return transitions;
  };

  const availableTransitions = getAvailableTransitions();

  return (
    <Card className='border-2 border-accent-blue/20'>
      <CardHeader className='pb-3'>
        <CardTitle className='flex items-center gap-2'>
          <StateIcon className='w-5 h-5 text-accent-blue' />
          Tournament State Management
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Current State Display */}
        <div className='flex items-center gap-3 p-4 bg-gradient-to-r from-accent-blue/5 to-accent-blue/10 rounded-lg border border-accent-blue/20'>
          <StateIcon className='w-6 h-6 text-accent-blue' />
          <div className='flex-1'>
            <div className='flex items-center gap-2'>
              <span className='font-semibold text-lg'>Current Status:</span>
              <Badge className={stateInfo.color}>{stateInfo.label}</Badge>
            </div>
            <p className='text-sm text-muted-foreground mt-1'>
              {stateInfo.description}
            </p>
          </div>
        </div>

        {/* Tournament Info */}
        <div className='grid grid-cols-2 gap-4 text-sm'>
          <div>
            <span className='text-muted-foreground'>Tournament:</span>
            <p className='font-medium'>{tournament.name}</p>
          </div>
          <div>
            <span className='text-muted-foreground'>Type:</span>
            <p className='font-medium capitalize'>
              {tournament.tournament_type || 'Single Elimination'}
            </p>
          </div>
          <div>
            <span className='text-muted-foreground'>Start Date:</span>
            <p className='font-medium'>
              {tournament.tournament_start
                ? new Date(tournament.tournament_start).toLocaleDateString()
                : 'Not set'}
            </p>
          </div>
          <div>
            <span className='text-muted-foreground'>Participants:</span>
            <p className='font-medium'>
              {tournament.current_participants || 0}
            </p>
          </div>
        </div>

        {/* State Transition Controls */}
        {isAdmin && availableTransitions.length > 0 && (
          <div className='space-y-3 pt-3 border-t'>
            <h4 className='font-medium text-sm text-muted-foreground'>
              Available Actions:
            </h4>
            <div className='flex flex-wrap gap-2'>
              {availableTransitions.map(transition => {
                const TransitionIcon = transition.icon;

                if (transition.dangerous) {
                  return (
                    <AlertDialog key={transition.status}>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant='outline'
                          size='sm'
                          disabled={isUpdating}
                          className={`text-white ${transition.color} border-0`}
                        >
                          <TransitionIcon className='w-3 h-3 mr-1' />
                          {transition.label}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className='flex items-center gap-2'>
                            <AlertTriangle className='w-5 h-5 text-red-500' />
                            Confirm {transition.label}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {transition.description}. This action cannot be
                            undone. Are you sure you want to proceed?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              updateTournamentState(transition.status)
                            }
                            className='bg-red-500 hover:bg-red-600'
                          >
                            {transition.label}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  );
                }

                return (
                  <Button
                    key={transition.status}
                    variant='outline'
                    size='sm'
                    disabled={isUpdating}
                    onClick={() => updateTournamentState(transition.status)}
                    className={`text-white ${transition.color} border-0`}
                  >
                    <TransitionIcon className='w-3 h-3 mr-1' />
                    {transition.label}
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Help Text */}
        {!isAdmin && (
          <div className='text-xs text-muted-foreground bg-gray-50 p-3 rounded-lg'>
            <p>
              🔒 Only tournament administrators can change the tournament state.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
