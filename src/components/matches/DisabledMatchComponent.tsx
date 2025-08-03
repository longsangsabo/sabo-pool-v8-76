import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface DisabledMatchComponentProps {
  title: string;
  description?: string;
}

export const DisabledMatchComponent = ({
  title,
  description,
}: DisabledMatchComponentProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <AlertTriangle className='h-5 w-5 text-amber-500' />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className='text-muted-foreground'>
          {description ||
            `${title} is temporarily disabled while database types are updated.`}
        </p>
      </CardContent>
    </Card>
  );
};
