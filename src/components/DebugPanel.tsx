import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Bug,
  Database,
  Users,
  Settings,
  Globe,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

const DebugPanel = () => {
  const { user, session } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const runDatabaseTest = async () => {
    setIsLoading(true);
    try {
      const results = {
        profiles: await supabase.from('profiles').select('count'),
        clubs: await supabase.from('clubs').select('count'),
        tournaments: await supabase.from('tournaments').select('count'),
        challenges: await supabase.from('challenges').select('count'),
        memberships: await (supabase as any)
          .from('memberships')
          .select('count'),
        player_rankings: await (supabase as any)
          .from('player_rankings')
          .select('count'),
      };

      setDebugInfo({ type: 'database', results });
    } catch (error) {
      setDebugInfo({ type: 'database', error: error.message });
    }
    setIsLoading(false);
  };

  const runAuthTest = async () => {
    setIsLoading(true);
    try {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      setDebugInfo({
        type: 'auth',
        session: currentSession,
        user: currentUser,
        sessionValid: !!currentSession,
        userValid: !!currentUser,
      });
    } catch (error) {
      setDebugInfo({ type: 'auth', error: error.message });
    }
    setIsLoading(false);
  };

  const runStorageTest = async () => {
    setIsLoading(true);
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      if (error) throw error;

      setDebugInfo({
        type: 'storage',
        buckets,
        bucketsCount: buckets.length,
      });
    } catch (error) {
      setDebugInfo({ type: 'storage', error: error.message });
    }
    setIsLoading(false);
  };

  const runRealtimeTest = async () => {
    setIsLoading(true);
    try {
      const channel = supabase.channel('debug-test');
      let connected = false;

      const subscription = channel.subscribe(status => {
        if (status === 'SUBSCRIBED') {
          connected = true;
          setDebugInfo({
            type: 'realtime',
            status: 'connected',
            channelState: channel.state,
          });
          supabase.removeChannel(channel);
          setIsLoading(false);
        }
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        if (!connected) {
          setDebugInfo({
            type: 'realtime',
            status: 'timeout',
            error: 'Connection timeout after 5 seconds',
          });
          supabase.removeChannel(channel);
          setIsLoading(false);
        }
      }, 5000);
    } catch (error) {
      setDebugInfo({ type: 'realtime', error: error.message });
      setIsLoading(false);
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className='fixed bottom-4 right-4 z-50'>
      <Card
        className={`w-96 transition-all duration-300 ${isCollapsed ? 'max-h-16' : 'max-h-96 overflow-auto'}`}
      >
        <CardHeader className='pb-2'>
          <div className='flex items-center justify-between'>
            <CardTitle className='flex items-center gap-2 text-sm'>
              <Bug className='w-4 h-4' />
              Debug Panel
            </CardTitle>
            <div className='flex items-center gap-1'>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setIsCollapsed(!isCollapsed)}
                className='h-6 w-6 p-0'
              >
                {isCollapsed ? (
                  <ChevronUp className='w-3 h-3' />
                ) : (
                  <ChevronDown className='w-3 h-3' />
                )}
              </Button>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setIsVisible(false)}
                className='h-6 w-6 p-0 text-gray-500 hover:text-red-500'
              >
                <X className='w-3 h-3' />
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isCollapsed && (
          <CardContent>
            <Tabs defaultValue='quick' className='w-full'>
              <TabsList className='grid w-full grid-cols-2'>
                <TabsTrigger value='quick'>Quick</TabsTrigger>
                <TabsTrigger value='detailed'>Detail</TabsTrigger>
              </TabsList>

              <TabsContent value='quick' className='space-y-2'>
                <div className='grid grid-cols-2 gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={runDatabaseTest}
                    disabled={isLoading}
                    className='flex items-center gap-1'
                  >
                    <Database className='w-3 h-3' />
                    DB
                  </Button>

                  <Button
                    variant='outline'
                    size='sm'
                    onClick={runAuthTest}
                    disabled={isLoading}
                    className='flex items-center gap-1'
                  >
                    <Users className='w-3 h-3' />
                    Auth
                  </Button>

                  <Button
                    variant='outline'
                    size='sm'
                    onClick={runStorageTest}
                    disabled={isLoading}
                    className='flex items-center gap-1'
                  >
                    <Settings className='w-3 h-3' />
                    Storage
                  </Button>

                  <Button
                    variant='outline'
                    size='sm'
                    onClick={runRealtimeTest}
                    disabled={isLoading}
                    className='flex items-center gap-1'
                  >
                    <Globe className='w-3 h-3' />
                    RT
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value='detailed' className='space-y-2'>
                <div className='text-xs space-y-1'>
                  <div className='flex justify-between'>
                    <span>User:</span>
                    <Badge
                      variant={user ? 'default' : 'secondary'}
                      className='text-xs'
                    >
                      {user ? '✓' : '✗'}
                    </Badge>
                  </div>
                  <div className='flex justify-between'>
                    <span>Session:</span>
                    <Badge
                      variant={session ? 'default' : 'secondary'}
                      className='text-xs'
                    >
                      {session ? '✓' : '✗'}
                    </Badge>
                  </div>
                  <div className='flex justify-between'>
                    <span>URL:</span>
                    <span className='text-xs truncate'>
                      {window.location.pathname}
                    </span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {debugInfo && (
              <div className='mt-3 p-2 bg-gray-50 rounded text-xs'>
                <pre className='whitespace-pre-wrap overflow-auto max-h-32'>
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default DebugPanel;
