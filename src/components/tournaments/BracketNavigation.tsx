import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Trophy,
  Medal,
  Crown,
  Users,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Round {
  number: number;
  name: string;
  matches: number;
  completedMatches: number;
  bracketType: 'winner' | 'loser' | 'final';
}

interface BracketNavigationProps {
  rounds: Round[];
  currentRound?: number;
  onRoundSelect: (roundNumber: number) => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onReset?: () => void;
  zoomLevel?: number;
  totalPlayers?: number;
  completedMatches?: number;
  totalMatches?: number;
  tournamentStatus?: string;
}

export const BracketNavigation: React.FC<BracketNavigationProps> = ({
  rounds,
  currentRound,
  onRoundSelect,
  onZoomIn,
  onZoomOut,
  onReset,
  zoomLevel = 100,
  totalPlayers = 0,
  completedMatches = 0,
  totalMatches = 0,
  tournamentStatus = 'ongoing',
}) => {
  const getRoundIcon = (bracketType: string) => {
    switch (bracketType) {
      case 'winner':
        return <Trophy className='w-4 h-4 text-accent-blue' />;
      case 'loser':
        return <Medal className='w-4 h-4 text-accent-red' />;
      case 'final':
        return <Crown className='w-4 h-4 text-tournament-gold' />;
      default:
        return <Trophy className='w-4 h-4 text-muted-foreground' />;
    }
  };

  const getRoundProgress = (round: Round) => {
    const percentage =
      round.matches > 0 ? (round.completedMatches / round.matches) * 100 : 0;
    return percentage;
  };

  const getStatusColor = () => {
    switch (tournamentStatus) {
      case 'completed':
        return 'text-accent-green';
      case 'ongoing':
        return 'text-accent-blue';
      case 'scheduled':
        return 'text-muted-foreground';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusIcon = () => {
    switch (tournamentStatus) {
      case 'completed':
        return <CheckCircle className='w-4 h-4' />;
      case 'ongoing':
        return <Clock className='w-4 h-4 animate-pulse' />;
      case 'scheduled':
        return <Clock className='w-4 h-4' />;
      default:
        return <Users className='w-4 h-4' />;
    }
  };

  return (
    <Card className='mb-6'>
      <CardContent className='p-4'>
        {/* Tournament Overview */}
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center gap-4'>
            <div className='flex items-center gap-2'>
              <Users className='w-5 h-5 text-muted-foreground' />
              <span className='font-medium'>{totalPlayers} Players</span>
            </div>
            <div className={cn('flex items-center gap-2', getStatusColor())}>
              {getStatusIcon()}
              <span className='font-medium capitalize'>{tournamentStatus}</span>
            </div>
            <div className='flex items-center gap-2'>
              <Trophy className='w-5 h-5 text-muted-foreground' />
              <span className='font-medium'>
                {completedMatches}/{totalMatches} Matches
              </span>
              <div className='w-20 h-2 bg-muted rounded-full overflow-hidden'>
                <div
                  className='h-full bg-accent-green transition-all duration-300'
                  style={{
                    width: `${totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Zoom Controls */}
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={onZoomOut}
              disabled={zoomLevel <= 50}
              className='h-8 w-8 p-0'
            >
              <ZoomOut className='w-4 h-4' />
            </Button>
            <span className='text-sm font-medium min-w-[3rem] text-center'>
              {zoomLevel}%
            </span>
            <Button
              variant='outline'
              size='sm'
              onClick={onZoomIn}
              disabled={zoomLevel >= 150}
              className='h-8 w-8 p-0'
            >
              <ZoomIn className='w-4 h-4' />
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={onReset}
              className='h-8 w-8 p-0'
            >
              <RotateCcw className='w-4 h-4' />
            </Button>
          </div>
        </div>

        {/* Round Navigation */}
        <div className='space-y-3'>
          <h4 className='text-sm font-medium text-muted-foreground'>
            Round Navigation
          </h4>
          <ScrollArea className='w-full whitespace-nowrap'>
            <div className='flex gap-2 pb-2'>
              {rounds.map(round => {
                const isActive = currentRound === round.number;
                const progress = getRoundProgress(round);
                const isCompleted = progress === 100;

                return (
                  <Button
                    key={round.number}
                    variant={isActive ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => onRoundSelect(round.number)}
                    className={cn(
                      'flex flex-col gap-1 h-auto py-2 px-3 min-w-[80px] relative overflow-hidden',
                      isActive && 'ring-2 ring-primary/50'
                    )}
                  >
                    {/* Progress bar background */}
                    <div
                      className={cn(
                        'absolute inset-0 transition-all duration-500',
                        isCompleted ? 'bg-accent-green/20' : 'bg-accent-blue/10'
                      )}
                      style={{
                        background: `linear-gradient(to right, ${
                          isCompleted
                            ? 'hsl(var(--accent-green) / 0.2)'
                            : 'hsl(var(--accent-blue) / 0.1)'
                        } ${progress}%, transparent ${progress}%)`,
                      }}
                    />

                    <div className='relative flex items-center gap-1'>
                      {getRoundIcon(round.bracketType)}
                      <span className='text-xs font-medium'>{round.name}</span>
                    </div>

                    <div className='relative flex items-center gap-1'>
                      <Badge
                        variant='secondary'
                        className={cn(
                          'text-xs px-1.5 py-0.5',
                          isCompleted && 'bg-accent-green/20 text-accent-green'
                        )}
                      >
                        {round.completedMatches}/{round.matches}
                      </Badge>
                      {isCompleted && (
                        <CheckCircle className='w-3 h-3 text-accent-green' />
                      )}
                    </div>
                  </Button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Quick Navigation Arrows */}
        <div className='flex items-center justify-center gap-4 mt-4 pt-3 border-t border-border/50'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              const currentIndex = rounds.findIndex(
                r => r.number === currentRound
              );
              if (currentIndex > 0) {
                onRoundSelect(rounds[currentIndex - 1].number);
              }
            }}
            disabled={
              !currentRound ||
              rounds.findIndex(r => r.number === currentRound) === 0
            }
            className='flex items-center gap-2'
          >
            <ChevronLeft className='w-4 h-4' />
            Previous Round
          </Button>

          <div className='text-center'>
            <div className='text-sm font-medium'>
              {currentRound
                ? rounds.find(r => r.number === currentRound)?.name
                : 'Select Round'}
            </div>
            <div className='text-xs text-muted-foreground'>
              {rounds.length} total rounds
            </div>
          </div>

          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              const currentIndex = rounds.findIndex(
                r => r.number === currentRound
              );
              if (currentIndex < rounds.length - 1) {
                onRoundSelect(rounds[currentIndex + 1].number);
              }
            }}
            disabled={
              !currentRound ||
              rounds.findIndex(r => r.number === currentRound) ===
                rounds.length - 1
            }
            className='flex items-center gap-2'
          >
            Next Round
            <ChevronRight className='w-4 h-4' />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
