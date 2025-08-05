import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface DisabledFeatureProps {
  title: string;
  description?: string;
}

export const DisabledFeature: React.FC<DisabledFeatureProps> = ({
  title,
  description = 'Tính năng này đang được phát triển và sẽ có trong phiên bản tiếp theo.',
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <AlertCircle className='h-5 w-5 text-yellow-500' />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className='text-muted-foreground'>{description}</p>
      </CardContent>
    </Card>
  );
};
