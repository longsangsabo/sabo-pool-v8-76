import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export interface TournamentActionsProps {
  tournamentId: string;
  tournamentName: string;
  tournamentStatus: string;
  managementStatus: string;
  onTournamentStarted: () => void;
  className?: string;
}

const TournamentActions: React.FC<TournamentActionsProps> = ({
  tournamentId,
  tournamentName,
  tournamentStatus,
  managementStatus,
  onTournamentStarted,
  className,
}) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Tournament Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          <div className='space-y-2'>
            <p>Tournament: {tournamentName}</p>
            <p>Status: {tournamentStatus}</p>
            <p>Management: {managementStatus}</p>
          </div>
          <Button onClick={onTournamentStarted} className='w-full'>
            Start Tournament
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TournamentActions;
