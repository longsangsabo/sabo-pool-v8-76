import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Coins, AlertTriangle } from 'lucide-react';

export const EnhancedWalletBalance: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center'>
          <Coins className='w-5 h-5 mr-2 text-primary' />
          Ví SPA Points
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='flex items-center gap-2 text-amber-600'>
          <AlertTriangle className='w-4 h-4' />
          <span className='text-sm'>
            Enhanced wallet balance is temporarily disabled while database types
            are updated.
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedWalletBalance;
