import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AlertTriangle, Calculator } from 'lucide-react';

export const ELOValidationPanel: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Calculator className='w-5 h-5' />
          ELO System Validation
        </CardTitle>
        <CardDescription>
          ELO validation is temporarily disabled while database types are
          updated.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='flex items-center gap-2 text-amber-600'>
          <AlertTriangle className='w-4 h-4' />
          <span className='text-sm'>
            Component temporarily disabled due to missing database tables in
            type definitions.
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
