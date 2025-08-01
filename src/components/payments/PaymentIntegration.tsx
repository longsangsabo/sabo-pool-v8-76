import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

/**
 * Temporary disabled payment integration component
 * Payment infrastructure is under development
 */
export function PaymentIntegration() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <AlertTriangle className='h-5 w-5 text-amber-500' />
          Payment System
        </CardTitle>
        <CardDescription>
          Payment integration is currently being developed
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='text-center py-8'>
          <p className='text-muted-foreground'>
            This feature will be available soon
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default PaymentIntegration;
