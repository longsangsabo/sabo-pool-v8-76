import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface DisabledAdminComponentProps {
  title: string;
  description?: string;
  reason?: string;
}

export const DisabledAdminComponent: React.FC<DisabledAdminComponentProps> = ({
  title,
  description = 'This component is currently disabled.',
  reason = 'Database schema incompatibility - some required tables/columns are missing',
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <AlertTriangle className='h-5 w-5 text-orange-500' />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='p-4 bg-orange-50 border border-orange-200 rounded-lg'>
          <p className='text-sm text-orange-700'>
            <strong>Component Disabled:</strong> {reason}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
