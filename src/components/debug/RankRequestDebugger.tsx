import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, CheckCircle, Database } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const RankRequestDebugger = () => {
  const testRankRequestsAccess = async () => {
    try {
      toast.info('Testing rank requests access...');

      // Test 1: Get current user's club
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error('User not logged in');
        return;
      }

      // Test 2: Get club profile
      const { data: clubProfile, error: clubError } = await supabase
        .from('club_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (clubError) {
        toast.error(`Club profile error: ${clubError.message}`);
        return;
      }

      if (!clubProfile) {
        toast.error('No club profile found for user');
        return;
      }

      // Test 3: Get rank requests for this club
      const { data: rankRequests, error: requestsError } = await supabase
        .from('rank_requests')
        .select(
          `
          *,
          profiles!rank_requests_user_id_fkey(
            full_name,
            display_name,
            avatar_url
          )
        `
        )
        .eq('club_id', clubProfile.id)
        .order('created_at', { ascending: false });

      if (requestsError) {
        console.error('Rank requests error:', requestsError);

        // Fallback: Try without join
        const { data: basicRequests, error: basicError } = await supabase
          .from('rank_requests')
          .select('*')
          .eq('club_id', clubProfile.id);

        if (basicError) {
          toast.error(`Rank requests error: ${basicError.message}`);
          return;
        }

        toast.success(
          `Found ${basicRequests?.length || 0} rank requests (basic query)`
        );
        console.log('Basic rank requests:', basicRequests);
        return;
      }

      toast.success(
        `✅ Found ${rankRequests?.length || 0} rank requests for club ${clubProfile.club_name}`
      );
      console.log('Rank requests with profiles:', rankRequests);

      // Test 4: Get user profiles separately if needed
      if (rankRequests && rankRequests.length > 0) {
        const userIds = rankRequests.map(r => r.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, display_name, avatar_url')
          .in('user_id', userIds);

        console.log('User profiles:', profiles);
      }
    } catch (error: any) {
      toast.error(`Test failed: ${error.message}`);
      console.error('Test error:', error);
    }
  };

  const triggerRealtimeTest = () => {
    const channel = supabase
      .channel('rank-requests-test')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rank_requests',
        },
        payload => {
          console.log('🔥 Realtime update:', payload);
          toast.success(`Realtime update: ${payload.eventType}`);
        }
      )
      .subscribe();

    toast.info('Realtime channel subscribed. Check console for updates.');

    // Clean up after 30 seconds
    setTimeout(() => {
      supabase.removeChannel(channel);
      toast.info('Realtime channel unsubscribed');
    }, 30000);
  };

  return (
    <Card className='w-full max-w-2xl mx-auto'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Database className='w-5 h-5' />
          Rank Requests Debugger
        </CardTitle>
        <p className='text-sm text-muted-foreground'>
          Debug tool để test rank requests access và realtime updates
        </p>
      </CardHeader>

      <CardContent className='space-y-4'>
        <div className='grid grid-cols-1 gap-4'>
          <Button
            onClick={testRankRequestsAccess}
            className='flex items-center gap-2'
          >
            <CheckCircle className='w-4 h-4' />
            Test Rank Requests Access
          </Button>

          <Button
            variant='outline'
            onClick={triggerRealtimeTest}
            className='flex items-center gap-2'
          >
            <RefreshCw className='w-4 h-4' />
            Test Realtime Updates
          </Button>
        </div>

        <div className='bg-blue-50 p-4 rounded-lg text-sm'>
          <h4 className='font-semibold text-blue-900 mb-2'>Debug Steps:</h4>
          <ol className='text-blue-800 space-y-1'>
            <li>
              1. Click "Test Rank Requests Access" to verify database access
            </li>
            <li>2. Check browser console for detailed logs</li>
            <li>3. Check toast notifications for results</li>
            <li>
              4. Navigate to "Xác thực hạng người chơi" tab to see if data loads
            </li>
          </ol>
        </div>

        <div className='bg-green-50 p-4 rounded-lg text-sm'>
          <h4 className='font-semibold text-green-900 mb-2'>
            Expected Results:
          </h4>
          <ul className='text-green-800 space-y-1'>
            <li>✅ Should find club profile for current user</li>
            <li>✅ Should find rank requests for the club</li>
            <li>✅ Should display "Found X rank requests" message</li>
            <li>✅ Console should show request data</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default RankRequestDebugger;
