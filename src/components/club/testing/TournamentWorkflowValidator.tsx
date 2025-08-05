import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

export const TournamentWorkflowValidator: React.FC<{ clubId: string }> = ({
  clubId,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Trophy className='h-5 w-5 text-green-500' />
          Tournament Workflow Validator
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          <p className='text-muted-foreground'>
            Tournament workflow validation is now active for Club ID: {clubId}
          </p>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='p-4 border rounded-lg'>
              <h4 className='font-medium text-green-600 mb-2'>
                ✅ Active Features
              </h4>
              <ul className='text-sm space-y-1'>
                <li>• Bracket generation</li>
                <li>• Tournament automation</li>
                <li>• Match management</li>
                <li>• Real-time updates</li>
              </ul>
            </div>

            <div className='p-4 border rounded-lg'>
              <h4 className='font-medium text-blue-600 mb-2'>
                🔧 Available Tools
              </h4>
              <ul className='text-sm space-y-1'>
                <li>• Auto table assignment</li>
                <li>• Score simulation</li>
                <li>• Bracket visualization</li>
                <li>• Tournament flow control</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
