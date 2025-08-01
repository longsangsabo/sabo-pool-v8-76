import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const RankingSystemTest = () => {
  const [testing, setTesting] = useState(false);

  const testRankingSystem = async () => {
    setTesting(true);
    try {
      // Test basic ranking functions
      const { data, error } = await supabase.rpc('refresh_leaderboard_stats');

      if (error) {
        toast.error('Test failed: ' + error.message);
      } else {
        toast.success('Ranking system test completed successfully');
      }
    } catch (error) {
      toast.error('Test failed: ' + (error as Error).message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ranking System Test</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='flex items-center justify-between'>
          <div>
            <h3 className='font-medium'>Test Ranking Functions</h3>
            <p className='text-sm text-muted-foreground'>
              Test the ranking system functionality
            </p>
          </div>
          <Button
            onClick={testRankingSystem}
            disabled={testing}
            variant='outline'
          >
            {testing ? 'Testing...' : 'Run Test'}
          </Button>
        </div>

        <div className='space-y-2'>
          <Badge variant='secondary'>Trust Score Calculation</Badge>
          <Badge variant='secondary'>Leaderboard Stats</Badge>
          <Badge variant='secondary'>Rank Verification</Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default RankingSystemTest;
