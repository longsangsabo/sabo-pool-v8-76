import React, { useEffect, useState } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useProfile } from '../hooks/useProfile';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

export const RankTestComponent = () => {
  const { getProfile, profile } = useProfile();
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (message: string) => {
    setTestResults(prev => [
      `${new Date().toLocaleTimeString()}: ${message}`,
      ...prev.slice(0, 9),
    ]);
  };

  const testProfileUpdate = async () => {
    try {
      addTestResult('Testing profile refresh...');
      const refreshedProfile = await getProfile();
      if (refreshedProfile) {
        addTestResult(`Profile rank: ${refreshedProfile.current_rank}`);
      } else {
        addTestResult('Failed to get profile');
      }
    } catch (error) {
      addTestResult(
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  // Monitor notifications for rank approvals
  useEffect(() => {
    const channel = supabase
      .channel('rank-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: 'type=eq.rank_approved',
        },
        payload => {
          addTestResult(
            `🎉 Rank approved notification: ${payload.new.message}`
          );
          // Auto-refresh profile when rank approval notification comes in
          testProfileUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    // Initial profile load
    testProfileUpdate();
  }, []);

  return (
    <Card className='w-full max-w-md'>
      <CardHeader>
        <CardTitle>Rank Verification Test</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div>
          <p>
            <strong>Current Rank:</strong>{' '}
            {profile?.current_rank || 'Loading...'}
          </p>
        </div>

        <Button onClick={testProfileUpdate} className='w-full'>
          Refresh Profile
        </Button>

        <div>
          <h4 className='font-semibold mb-2'>Test Results:</h4>
          <div className='max-h-48 overflow-y-auto space-y-1'>
            {testResults.map((result, index) => (
              <div key={index} className='text-sm p-2 bg-muted rounded'>
                {result}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
