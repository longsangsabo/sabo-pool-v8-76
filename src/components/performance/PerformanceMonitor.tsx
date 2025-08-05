import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PerformanceMonitor: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Monitor</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-2'>
          <div className='flex items-center justify-between'>
            <span>CPU Usage</span>
            <span className='text-sm text-muted-foreground'>25%</span>
          </div>
          <div className='flex items-center justify-between'>
            <span>Memory Usage</span>
            <span className='text-sm text-muted-foreground'>1.2GB</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceMonitor;
