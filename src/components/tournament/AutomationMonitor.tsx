import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AutomationMonitorProps {
  tournamentId?: string;
  className?: string;
}

const AutomationMonitor: React.FC<AutomationMonitorProps> = ({
  tournamentId,
  className,
}) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Automation Monitor</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-2'>
          <div className='flex items-center justify-between'>
            <span>Status</span>
            <Badge variant='outline'>Active</Badge>
          </div>
          <div className='flex items-center justify-between'>
            <span>Last Check</span>
            <span className='text-sm text-muted-foreground'>Just now</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AutomationMonitor;
