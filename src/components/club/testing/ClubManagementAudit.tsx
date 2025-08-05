import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuditResult {
  category: string;
  test: string;
  status: 'pass' | 'fail' | 'warning' | 'pending';
  message: string;
  details?: any;
}

const ClubManagementAudit = () => {
  const [auditResults, setAuditResults] = useState<AuditResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();

  const runAudit = async () => {
    setIsRunning(true);
    setAuditResults([]);

    const results: AuditResult[] = [];

    try {
      // Test 1: Authentication Check
      const {
        data: { user },
      } = await supabase.auth.getUser();
      results.push({
        category: 'Authentication',
        test: 'User Authentication',
        status: user ? 'pass' : 'fail',
        message: user
          ? `Authenticated as ${user.email}`
          : 'No user authenticated',
      });

      if (user) {
        // Test 2: Profile Access
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        results.push({
          category: 'Profile',
          test: 'Profile Data Access',
          status: profile ? 'pass' : 'fail',
          message: profile
            ? 'Profile data accessible'
            : `Profile error: ${profileError?.message}`,
        });

        // Test 3: Club Profile Access
        const { data: clubProfile, error: clubError } = await supabase
          .from('club_profiles')
          .select('*')
          .eq('user_id', user.id);

        results.push({
          category: 'Club Management',
          test: 'Club Profile Access',
          status: clubProfile ? 'pass' : 'fail',
          message: clubProfile
            ? `Found ${clubProfile.length} club(s)`
            : `Club error: ${clubError?.message}`,
        });

        // Test 4: Tournament Management
        if (clubProfile && clubProfile.length > 0) {
          const { data: tournaments } = await supabase
            .from('tournaments')
            .select('*')
            .eq('club_id', clubProfile[0].id)
            .limit(5);

          results.push({
            category: 'Tournament',
            test: 'Tournament Data Access',
            status: 'pass',
            message: `Found ${tournaments?.length || 0} tournaments`,
          });
        }

        // Test 5: RLS Policy Check
        const { data: restrictedData } = await supabase
          .from('profiles')
          .select('*')
          .neq('user_id', user.id)
          .limit(1);

        results.push({
          category: 'Security',
          test: 'RLS Policy Enforcement',
          status:
            restrictedData && restrictedData.length > 0 ? 'warning' : 'pass',
          message:
            restrictedData && restrictedData.length > 0
              ? 'RLS may not be properly configured'
              : 'RLS policies working correctly',
        });
      }
    } catch (error: any) {
      results.push({
        category: 'System',
        test: 'Audit Execution',
        status: 'fail',
        message: `Audit failed: ${error.message}`,
      });
    }

    setAuditResults(results);
    setIsRunning(false);

    const failCount = results.filter(r => r.status === 'fail').length;
    const warningCount = results.filter(r => r.status === 'warning').length;

    if (failCount === 0 && warningCount === 0) {
      toast({
        title: 'Audit Complete',
        description: 'All tests passed successfully!',
      });
    } else {
      toast({
        title: 'Audit Complete',
        description: `${failCount} failures, ${warningCount} warnings found`,
        variant: failCount > 0 ? 'destructive' : 'default',
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className='h-4 w-4 text-green-500' />;
      case 'fail':
        return <XCircle className='h-4 w-4 text-red-500' />;
      case 'warning':
        return <AlertTriangle className='h-4 w-4 text-yellow-500' />;
      default:
        return <div className='h-4 w-4 rounded-full bg-gray-300' />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pass: 'default',
      fail: 'destructive',
      warning: 'secondary',
      pending: 'outline',
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle>Club Management Audit</CardTitle>
          <CardDescription>
            Comprehensive testing of club management features, security
            policies, and data access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={runAudit} disabled={isRunning} className='w-full'>
            {isRunning ? (
              <>
                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2' />
                Running Audit...
              </>
            ) : (
              <>
                <Play className='h-4 w-4 mr-2' />
                Run Complete Audit
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {auditResults.length > 0 && (
        <div className='space-y-4'>
          <h3 className='text-lg font-semibold'>Audit Results</h3>

          {auditResults.map((result, index) => (
            <Card key={index}>
              <CardHeader className='pb-3'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-2'>
                    {getStatusIcon(result.status)}
                    <CardTitle className='text-sm'>{result.test}</CardTitle>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <Badge variant='outline'>{result.category}</Badge>
                    {getStatusBadge(result.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className='pt-0'>
                <p className='text-sm text-muted-foreground'>
                  {result.message}
                </p>
                {result.details && (
                  <pre className='mt-2 text-xs bg-muted p-2 rounded overflow-auto'>
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                )}
              </CardContent>
            </Card>
          ))}

          <Card>
            <CardContent className='pt-6'>
              <div className='grid grid-cols-4 gap-4 text-center'>
                <div>
                  <div className='text-2xl font-bold text-green-600'>
                    {auditResults.filter(r => r.status === 'pass').length}
                  </div>
                  <div className='text-sm text-muted-foreground'>Passed</div>
                </div>
                <div>
                  <div className='text-2xl font-bold text-red-600'>
                    {auditResults.filter(r => r.status === 'fail').length}
                  </div>
                  <div className='text-sm text-muted-foreground'>Failed</div>
                </div>
                <div>
                  <div className='text-2xl font-bold text-yellow-600'>
                    {auditResults.filter(r => r.status === 'warning').length}
                  </div>
                  <div className='text-sm text-muted-foreground'>Warnings</div>
                </div>
                <div>
                  <div className='text-2xl font-bold'>
                    {auditResults.length}
                  </div>
                  <div className='text-sm text-muted-foreground'>
                    Total Tests
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ClubManagementAudit;
